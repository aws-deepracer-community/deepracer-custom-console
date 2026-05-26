import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  screen,
  render,
  waitFor,
  act,
  fireEvent,
} from "../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import LoginPage from "../../pages/login";
import axios from "axios";

// Mock axios for login calls
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
      withCredentials: false,
    },
    isAxiosError: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authentication hook
const mockLogin = vi.fn();
const mockLogout = vi.fn();
vi.mock("../../common/hooks/use-authentication", async () => {
  const actual = await vi.importActual("../../common/hooks/use-authentication");
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      logout: mockLogout,
    }),
  };
});

// Mock DOM elements and APIs
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    search: "",
  },
  writable: true,
});

Object.defineProperty(window.history, "pushState", {
  value: vi.fn(),
  writable: true,
});

// Mock URLSearchParams
const MockURLSearchParams = class {
  private params: Record<string, string>;

  constructor(search: string) {
    this.params = {};
    if (search.startsWith("?")) {
      search = search.slice(1);
    }
    search.split("&").forEach((param) => {
      const [key, value] = param.split("=");
      if (key && value) {
        this.params[key] = decodeURIComponent(value);
      }
    });
  }

  has(key: string): boolean {
    return key in this.params;
  }

  get(key: string): string | null {
    return this.params[key] || null;
  }

  delete(key: string): void {
    delete this.params[key];
  }
};

// Replace the global URLSearchParams
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).URLSearchParams = MockURLSearchParams;

const mockAxios = vi.mocked(axios, true);

describe("LoginPage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset window.location
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000",
        search: "",
      },
      writable: true,
    });

    // Set up default axios responses
    mockAxios.get.mockResolvedValue({
      data: "csrf-token-123",
    });

    mockAxios.post.mockResolvedValue({
      data: { redirect: "/home" },
    });

    mockAxios.isAxiosError.mockReturnValue(false);

    // Mock meta tag for CSRF token
    const metaTag = document.createElement("meta");
    metaTag.setAttribute("name", "csrf-token");
    metaTag.setAttribute("content", "csrf-token-123");
    document.head.appendChild(metaTag);

    // Mock document.cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  afterEach(() => {
    // Clean up meta tags
    const metaTags = document.head.querySelectorAll('meta[name="csrf-token"]');
    metaTags.forEach((tag) => tag.remove());
  });

  it("should render login form with all required elements", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);

      // Check for main heading
      expect(screen.getByText("Unlock your AWS DeepRacer vehicle")).toBeInTheDocument();

      // Check for password input
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
      
      // Check the actual input element type by finding it in the DOM
      const nativeInput = screen.getByPlaceholderText("Enter your password");
      expect(nativeInput).toHaveAttribute("type", "password");

      // Check for access button
      const accessButton = wrapper.findButton('[data-testid="access-button"]') || 
                          wrapper.findAllButtons().find(btn => 
                            btn.getElement().textContent?.includes("Access vehicle"));
      expect(accessButton).toBeTruthy();

      // Check for show password checkbox
      const showPasswordCheckbox = wrapper.findCheckbox();
      expect(showPasswordCheckbox).toBeTruthy();

      // Check for AWS logo
      expect(screen.getByAltText("AWS Logo")).toBeInTheDocument();

      // Check for forgot password link
      expect(screen.getByText("Forgot password?")).toBeInTheDocument();
    });
  });

  it("should handle logout sequence on component mount", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      // Should call logout from auth hook
      expect(mockLogout).toHaveBeenCalled();

      // Should call redirect_login endpoint
      expect(mockAxios.get).toHaveBeenCalledWith("/redirect_login");
    });
  });

  it("should set up CSRF token from meta tag", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      // Should set CSRF token in axios defaults
      expect(mockAxios.defaults.headers.common["X-CSRF-Token"]).toBe("csrf-token-123");
      expect(mockAxios.defaults.withCredentials).toBe(true);
    });
  });

  it("should handle successful login flow", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
    });

    const wrapper = createWrapper(document.body);
    const passwordInput = wrapper.findInput()!;
    const accessButton = wrapper.findAllButtons().find(btn => 
      btn.getElement().textContent?.includes("Access vehicle"))!;

    // Enter password
    await act(async () => {
      passwordInput.setInputValue("testpassword");
    });

    // Click login button
    await act(async () => {
      accessButton.click();
    });

    await waitFor(() => {
      // Should make login POST request with the correct password
      expect(mockAxios.post).toHaveBeenCalledWith(
        "/login",
        expect.any(FormData),
        {
          headers: {
            "X-CSRF-Token": "csrf-token-123",
          },
          withCredentials: true,
        }
      );

      // Verify the FormData contains the correct password
      const formDataCall = mockAxios.post.mock.calls.find(call => call[0] === "/login");
      expect(formDataCall).toBeTruthy();
      const formData = formDataCall![1] as FormData;
      expect(formData.get("password")).toBe("testpassword");

      // Should call login from auth hook
      expect(mockLogin).toHaveBeenCalled();

      // Should navigate to home
      expect(mockNavigate).toHaveBeenCalledWith("/home", {
        replace: true,
        state: { from: "/login" },
      });
    });
  });

  it("should handle login failure", async () => {
    // Mock failed login response
    mockAxios.post.mockResolvedValueOnce({
      data: "failure",
    });

    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
    });

    const wrapper = createWrapper(document.body);
    const passwordInput = wrapper.findInput()!;
    const accessButton = wrapper.findAllButtons().find(btn => 
      btn.getElement().textContent?.includes("Access vehicle"))!;

    // Enter password
    await act(async () => {
      passwordInput.setInputValue("wrongpassword");
    });

    // Click login button
    await act(async () => {
      accessButton.click();
    });

    await waitFor(() => {
      // Should show error message
      expect(screen.getByText("Login failed - invalid credentials")).toBeInTheDocument();

      // Verify the wrong password was actually sent to the server
      const formDataCall = mockAxios.post.mock.calls.find(call => call[0] === "/login");
      expect(formDataCall).toBeTruthy();
      const formData = formDataCall![1] as FormData;
      expect(formData.get("password")).toBe("wrongpassword");

      // Should not call login or navigate
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it("should handle system unavailable error (400 status)", async () => {
    // Mock 400 error response
    const axiosError = {
      response: { status: 400 },
    };
    mockAxios.isAxiosError.mockReturnValue(true);
    mockAxios.post.mockRejectedValueOnce(axiosError);

    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
    });

    const wrapper = createWrapper(document.body);
    const passwordInput = wrapper.findInput()!;
    const accessButton = wrapper.findAllButtons().find(btn => 
      btn.getElement().textContent?.includes("Access vehicle"))!;

    // Enter password
    await act(async () => {
      passwordInput.setInputValue("testpassword");
    });

    // Click login button
    await act(async () => {
      accessButton.click();
    });

    await waitFor(() => {
      // Should navigate to system unavailable
      expect(mockNavigate).toHaveBeenCalledWith("/system-unavailable");
    });
  });

  it("should handle empty password validation", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const accessButton = wrapper.findAllButtons().find(btn => 
        btn.getElement().textContent?.includes("Access vehicle"));
      expect(accessButton).toBeTruthy();
    });

    const wrapper = createWrapper(document.body);
    const accessButton = wrapper.findAllButtons().find(btn => 
      btn.getElement().textContent?.includes("Access vehicle"))!;

    // Click login button without entering password
    await act(async () => {
      accessButton.click();
    });

    await waitFor(() => {
      // Should show error message
      expect(screen.getByText("Password cannot be empty")).toBeInTheDocument();

      // Should not make API call
      expect(mockAxios.post).not.toHaveBeenCalledWith(
        "/login",
        expect.any(FormData),
        expect.any(Object)
      );
    });
  });

  it("should toggle password visibility", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
    });

    const wrapper = createWrapper(document.body);
    const showPasswordCheckbox = wrapper.findCheckbox()!;

    // Get the actual input element by placeholder text
    let nativeInput = screen.getByPlaceholderText("Enter your password");

    // Initially should be password type
    expect(nativeInput).toHaveAttribute("type", "password");

    // Click show password checkbox
    await act(async () => {
      showPasswordCheckbox.findNativeInput().click();
    });

    await waitFor(() => {
      // Re-get the input element after state change
      nativeInput = screen.getByPlaceholderText("Enter your password");
      // Should change to text type
      expect(nativeInput).toHaveAttribute("type", "text");
    });

    // Click again to hide
    await act(async () => {
      showPasswordCheckbox.findNativeInput().click();
    });

    await waitFor(() => {
      // Re-get the input element after state change
      nativeInput = screen.getByPlaceholderText("Enter your password");
      // Should change back to password type
      expect(nativeInput).toHaveAttribute("type", "password");
    });
  });

  it("should handle Enter key press in password field", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
    });

    const wrapper = createWrapper(document.body);
    const passwordInput = wrapper.findInput()!;

    // Enter password
    await act(async () => {
      passwordInput.setInputValue("testpassword");
    });

    // Simulate Enter key press
    await act(async () => {
      const inputElement = passwordInput.findNativeInput().getElement();
      fireEvent.keyDown(inputElement, { key: "Enter", keyCode: 13 });
    });

    await waitFor(() => {
      // Should make login POST request with correct password
      expect(mockAxios.post).toHaveBeenCalledWith(
        "/login",
        expect.any(FormData),
        {
          headers: {
            "X-CSRF-Token": "csrf-token-123",
          },
          withCredentials: true,
        }
      );

      // Verify the FormData contains the correct password
      const formDataCall = mockAxios.post.mock.calls.find(call => call[0] === "/login");
      expect(formDataCall).toBeTruthy();
      const formData = formDataCall![1] as FormData;
      expect(formData.get("password")).toBe("testpassword");
    });
  });

  it("should handle auto-login from URL parameter", async () => {
    // Mock URL with password parameter
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/login?epwd=autopassword",
        search: "?epwd=autopassword",
      },
      writable: true,
    });

    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
    });

    // Wait for auto-login to trigger (after timeout)
    await waitFor(
      () => {
        // Should make login POST request automatically with URL password
        expect(mockAxios.post).toHaveBeenCalledWith(
          "/login",
          expect.any(FormData),
          {
            headers: {
              "X-CSRF-Token": "csrf-token-123",
            },
            withCredentials: true,
          }
        );

        // Verify the FormData contains the password from URL parameter
        const formDataCall = mockAxios.post.mock.calls.find(call => call[0] === "/login");
        expect(formDataCall).toBeTruthy();
        const formData = formDataCall![1] as FormData;
        expect(formData.get("password")).toBe("autopassword");
      },
      { timeout: 1000 }
    );

    // Should clean up URL
    expect(window.history.pushState).toHaveBeenCalled();
  });

  it("should not auto-login if epwd parameter is empty", async () => {
    // Mock URL with empty password parameter
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/login?epwd=",
        search: "?epwd=",
      },
      writable: true,
    });

    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
    });

    // Wait a bit to ensure auto-login doesn't trigger
    await new Promise(resolve => setTimeout(resolve, 600));

    // Should not make login request
    expect(mockAxios.post).not.toHaveBeenCalledWith(
      "/login",
      expect.any(FormData),
      expect.any(Object)
    );
  });

  it("should handle network error during login", async () => {
    // Mock network error
    const networkError = new Error("Network Error");
    mockAxios.post.mockRejectedValueOnce(networkError);

    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const passwordInput = wrapper.findInput();
      expect(passwordInput).toBeTruthy();
    });

    const wrapper = createWrapper(document.body);
    const passwordInput = wrapper.findInput()!;
    const accessButton = wrapper.findAllButtons().find(btn => 
      btn.getElement().textContent?.includes("Access vehicle"))!;

    // Enter password
    await act(async () => {
      passwordInput.setInputValue("testpassword");
    });

    // Click login button
    await act(async () => {
      accessButton.click();
    });

    await waitFor(() => {
      // Should show generic error message
      expect(screen.getByText("Login error. Please try again.")).toBeInTheDocument();
    });
  });

  it("should dismiss error alert", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      const wrapper = createWrapper(document.body);
      const accessButton = wrapper.findAllButtons().find(btn => 
        btn.getElement().textContent?.includes("Access vehicle"));
      expect(accessButton).toBeTruthy();
    });

    const wrapper = createWrapper(document.body);
    const accessButton = wrapper.findAllButtons().find(btn => 
      btn.getElement().textContent?.includes("Access vehicle"))!;

    // Trigger empty password error
    await act(async () => {
      accessButton.click();
    });

    await waitFor(() => {
      expect(screen.getByText("Password cannot be empty")).toBeInTheDocument();
    });

    // Find and click dismiss button on alert
    const dismissButton = wrapper.findAlert()?.findDismissButton();
    expect(dismissButton).toBeTruthy();

    await act(async () => {
      dismissButton!.click();
    });

    await waitFor(() => {
      // Error should be dismissed
      expect(screen.queryByText("Password cannot be empty")).not.toBeInTheDocument();
    });
  });

  it("should handle logout error gracefully", async () => {
    // Mock logout error
    const logoutError = {
      response: { status: 401 },
    };
    mockAxios.isAxiosError.mockReturnValue(true);
    mockAxios.get.mockRejectedValueOnce(logoutError);

    render(<LoginPage />);

    await waitFor(() => {
      // Should still render the form even if logout fails
      expect(screen.getByText("Unlock your AWS DeepRacer vehicle")).toBeInTheDocument();
    });

    // Should still attempt logout
    expect(mockLogout).toHaveBeenCalled();
    expect(mockAxios.get).toHaveBeenCalledWith("/redirect_login");
  });

  it("should display external link correctly", async () => {
    render(<LoginPage />);

    await waitFor(() => {
      const forgotPasswordLink = screen.getByText("Forgot password?");
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink.closest("a")).toHaveAttribute(
        "href",
        "https://docs.aws.amazon.com/console/deepracer/recover-vehicle-password"
      );
    });
  });
});
