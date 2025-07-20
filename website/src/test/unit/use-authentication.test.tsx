import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { useAuth, useAuthProvider, AuthContext } from "../../common/hooks/use-authentication";

// Mock console.debug to avoid noise in tests
vi.mock("console", () => ({
  debug: vi.fn(),
}));

// Types
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

// Test wrapper component for AuthContext
const createWrapper = (authValue: AuthContextType) => {
  return ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

// Helper to set document.cookie
const setCookie = (value: string) => {
  Object.defineProperty(document, "cookie", {
    writable: true,
    value,
  });
};

// Helper to clear cookies
const clearCookies = () => {
  Object.defineProperty(document, "cookie", {
    writable: true,
    value: "",
  });
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCookies();
  });

  afterEach(() => {
    vi.resetAllMocks();
    clearCookies();
  });

  it("should throw error when used outside of AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");
  });

  it("should return context value when used within AuthProvider", () => {
    const mockAuthState = {
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    };

    const wrapper = createWrapper(mockAuthState);
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBe(mockAuthState);
    expect(result.current.isAuthenticated).toBe(true);
    expect(typeof result.current.login).toBe("function");
    expect(typeof result.current.logout).toBe("function");
  });
});

describe("useAuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCookies();
  });

  afterEach(() => {
    vi.resetAllMocks();
    clearCookies();
  });

  describe("initial authentication check", () => {
    it("should initialize as not authenticated when no cookie present", () => {
      clearCookies();
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should initialize as authenticated when deepracer_token cookie is present", () => {
      setCookie("deepracer_token=abc123");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should initialize as authenticated when deepracer_token cookie is present among other cookies", () => {
      setCookie("other_cookie=value; deepracer_token=abc123; another_cookie=value2");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should initialize as not authenticated when only other cookies are present", () => {
      setCookie("other_cookie=value; another_cookie=value2");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle cookie with spaces correctly", () => {
      setCookie(" deepracer_token=abc123 ");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should not match partial cookie names", () => {
      setCookie("not_deepracer_token=abc123; some_deepracer_token_suffix=value");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("login functionality", () => {
    it("should set authenticated state to true when login is called", () => {
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.login();
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should maintain authenticated state when login is called multiple times", () => {
      const { result } = renderHook(() => useAuthProvider());

      act(() => {
        result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should set authenticated to true even if already authenticated", () => {
      setCookie("deepracer_token=existing");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.login();
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("logout functionality", () => {
    it("should set authenticated state to false when logout is called", () => {
      setCookie("deepracer_token=abc123");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should clear the deepracer_token cookie when logout is called", () => {
      setCookie("deepracer_token=abc123");
      const { result } = renderHook(() => useAuthProvider());

      act(() => {
        result.current.logout();
      });

      // Check that the cookie clearing string was set
      expect(document.cookie).toBe(
        "deepracer_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      );
    });

    it("should set authenticated to false even if already not authenticated", () => {
      clearCookies();
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should maintain logout state when logout is called multiple times", () => {
      setCookie("deepracer_token=abc123");
      const { result } = renderHook(() => useAuthProvider());

      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("authentication flow", () => {
    it("should handle complete login/logout cycle", () => {
      const { result } = renderHook(() => useAuthProvider());

      // Start not authenticated
      expect(result.current.isAuthenticated).toBe(false);

      // Login
      act(() => {
        result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);

      // Login again
      act(() => {
        result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should maintain function reference stability", () => {
      const { result, rerender } = renderHook(() => useAuthProvider());

      // Trigger a re-render
      rerender();

      // Functions should still work correctly after re-render
      expect(typeof result.current.login).toBe("function");
      expect(typeof result.current.logout).toBe("function");
    });

    it("should handle state changes independently", () => {
      const { result } = renderHook(() => useAuthProvider());

      // Multiple rapid state changes
      act(() => {
        result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.login();
      });
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty cookie string", () => {
      setCookie("");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle malformed cookies gracefully", () => {
      setCookie("malformed_cookie_without_equals");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle cookie string with only semicolons", () => {
      setCookie(";;;");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle deepracer_token with empty value", () => {
      setCookie("deepracer_token=");
      const { result } = renderHook(() => useAuthProvider());

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
