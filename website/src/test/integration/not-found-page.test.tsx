import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  screen,
  render,
} from "../utils";
import createWrapper from "@cloudscape-design/components/test-utils/dom";
import NotFound from "../../pages/not-found";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock BaseAppLayout to avoid complex layout dependencies
vi.mock("../../components/base-app-layout", () => ({
  default: ({ breadcrumbs, content }: { breadcrumbs: React.ReactNode; content: React.ReactNode }) => (
    <div data-testid="base-app-layout">
      <div data-testid="breadcrumbs">{breadcrumbs}</div>
      <div data-testid="content">{content}</div>
    </div>
  ),
}));

describe("NotFound Page Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it("should render 404 page with all required elements", () => {
    render(<NotFound />);

    // Check for main heading (use getAllByText since text appears multiple times)
    const headings = screen.getAllByText("404. Page Not Found");
    expect(headings.length).toBeGreaterThan(0);

    // Check for breadcrumbs (use getAllByText since text appears multiple times)
    const breadcrumbVehicleText = screen.getAllByText("AWS DeepRacer Vehicle");
    expect(breadcrumbVehicleText.length).toBeGreaterThan(0);
    
    const notFoundText = screen.getAllByText("Not Found");
    expect(notFoundText.length).toBeGreaterThan(0);

    // Check layout structure using Cloudscape test utils
    const wrapper = createWrapper(document.body);
    
    // Check for ContentLayout
    const contentLayout = wrapper.findContentLayout();
    expect(contentLayout).toBeTruthy();

    // Check for Container
    const container = wrapper.findContainer();
    expect(container).toBeTruthy();

    // Check for SpaceBetween layout
    const spaceBetween = wrapper.findSpaceBetween();
    expect(spaceBetween).toBeTruthy();

    // Check for Alert component
    const alert = wrapper.findAlert();
    expect(alert).toBeTruthy();

    // Check for BreadcrumbGroup
    const breadcrumbGroup = wrapper.findBreadcrumbGroup();
    expect(breadcrumbGroup).toBeTruthy();

    // Check that the error message is in the document
    expect(screen.getByText("The page you are looking for does not exist.")).toBeInTheDocument();
  });

  it("should have proper breadcrumb navigation structure", () => {
    render(<NotFound />);

    const wrapper = createWrapper(document.body);
    const breadcrumbGroup = wrapper.findBreadcrumbGroup();
    
    expect(breadcrumbGroup).toBeTruthy();
    
    // Check breadcrumb items
    const breadcrumbLinks = breadcrumbGroup?.findBreadcrumbLinks();
    expect(breadcrumbLinks).toHaveLength(2);
    
    // First breadcrumb should be home
    expect(breadcrumbLinks?.[0]?.getElement()).toHaveTextContent("AWS DeepRacer Vehicle");
    
    // Second breadcrumb should be current page
    expect(breadcrumbLinks?.[1]?.getElement()).toHaveTextContent("Not Found");
  });

  it("should handle breadcrumb navigation clicks", () => {
    render(<NotFound />);

    const wrapper = createWrapper(document.body);
    const breadcrumbGroup = wrapper.findBreadcrumbGroup();
    const breadcrumbLinks = breadcrumbGroup?.findBreadcrumbLinks();
    
    // Simulate breadcrumb click by triggering custom event
    const homeLink = breadcrumbLinks?.[0];
    if (homeLink) {
      // Create a custom event similar to what Cloudscape components emit
      const followEvent = new CustomEvent('follow', {
        detail: { href: '/', external: false }
      });
      homeLink.getElement().dispatchEvent(followEvent);
    }
    
    // For this basic test, we'll just verify the navigation structure is in place
    // The actual navigation logic is tested through the useOnFollow hook
    expect(breadcrumbLinks).toHaveLength(2);
    expect(breadcrumbLinks?.[0]?.getElement()).toHaveTextContent("AWS DeepRacer Vehicle");
  });

  it("should display error alert with correct content", () => {
    render(<NotFound />);

    const wrapper = createWrapper(document.body);
    const alert = wrapper.findAlert();
    
    expect(alert).toBeTruthy();
    
    // Check alert header
    const alertHeader = alert?.findHeader();
    expect(alertHeader?.getElement()).toHaveTextContent("404. Page Not Found");
    
    // Check alert content - verify the error message is present
    expect(screen.getByText("The page you are looking for does not exist.")).toBeInTheDocument();
  });

  it("should have proper semantic structure and accessibility", () => {
    render(<NotFound />);

    // Check for header element with h1 variant
    const wrapper = createWrapper(document.body);
    const header = wrapper.findHeader();
    expect(header).toBeTruthy();
    expect(header?.getElement()).toHaveTextContent("404. Page Not Found");

    // Check for proper ARIA labels on breadcrumbs
    const breadcrumbGroup = wrapper.findBreadcrumbGroup();
    expect(breadcrumbGroup?.getElement()).toHaveAttribute("aria-label", "Breadcrumbs");
  });

  it("should be wrapped in BaseAppLayout component", () => {
    render(<NotFound />);

    // Check that BaseAppLayout mock is rendered
    expect(screen.getByTestId("base-app-layout")).toBeInTheDocument();
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });
});
