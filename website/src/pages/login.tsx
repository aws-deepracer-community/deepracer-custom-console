import {
  Button,
  Container,
  SpaceBetween,
  FormField,
  Box,
  Checkbox,
  Input,
  Link,
  Grid,
  Alert,
} from "@cloudscape-design/components";
import * as React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// eslint-disable-next-line react-refresh/only-export-components
export default () => {
  const [value, setValue] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  const [csrfToken, setCsrfToken] = React.useState("");
  const [error, setError] = React.useState("");
  const navigate = useNavigate();

  // Run handleLogout only once when component mounts
  React.useEffect(() => {
    const handleLogout = async () => {
      try {
        const response = await axios.get("/redirect_login");
        console.log("Vehicle Logged Out:", response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.info("Car already logged out.");
        } else {
          console.error("Error logging out vehicle:", error);
        }
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("epwd")) return;

    handleLogout();
  }, []);

  // Generate and set up CSRF token on component mount
  React.useEffect(() => {
    const generateCsrfToken = async () => {
      try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
        if (token) {
          setCsrfToken(token);
          axios.defaults.headers.common["X-CSRF-Token"] = token;
          axios.defaults.withCredentials = true;
          console.debug("CSRF token set:", token); // for troubleshooting
        }
      } catch (error) {
        console.error("Error setting CSRF token:", error);
      }
    };

    if (csrfToken) return;
    generateCsrfToken();
  }, [csrfToken, setCsrfToken]);

  // Modified submitLogin to explicitly include the CSRF token
  const submitLogin = React.useCallback(
    async (password: string) => {
      console.log("Attempting login...");
      setError("");

      if (!password) {
        setError("Password cannot be empty");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("password", password);
        console.log("CSRF Token:", csrfToken);
        const response = await axios.post("/login", formData, {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
          withCredentials: true, // This is crucial for cookie handling
        });

        if (response.data === "failure") {
          setError("Login failed - invalid credentials");
          setValue("");
        } else {
          console.log("Login successful");
          // The cookies will be automatically stored by the browser
          // You can verify the cookies are set using:
          console.log("Cookies set:", document.cookie);
          navigate("/home");
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          console.error("System unavailable - backend returned 400");
          navigate("/system-unavailable");
          return;
        }
        setError("Login error. Please try again.");
        console.error("Login error:", error);
      }
    },
    [csrfToken, navigate]
  );

  // Add a useEffect to check for password in URL and auto-login
  React.useEffect(() => {
    // Wait until CSRF token is available
    if (!csrfToken) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("epwd")) {
      let urlPassword = urlParams.get("epwd");
      if (urlPassword === null) {
        urlPassword = "";
      }
      console.debug("Auto-login password found!"); // for troubleshooting

      const url = new URL(window.location.href);
      url.searchParams.delete("epwd");
      window.history.pushState({}, "", url);

      if (urlPassword && urlPassword.length > 0) {
        setValue(urlPassword);

        setTimeout(() => {
          submitLogin(urlPassword);
        }, 500);
      }
    }
  }, [csrfToken, setValue, submitLogin]);

  return (
    <Box padding="l">
      <Grid
        gridDefinition={[
          {
            offset: { s: 2, m: 2, l: 3, xl: 4 },
            colspan: { default: 12, xxs: 12, xs: 12, s: 8, m: 8, l: 6, xl: 5 },
          },
        ]}
      >
        <Container>
          <SpaceBetween size="l">
            <Box textAlign="center">
              <img src="./static/AWS_logo_RGB.svg" width="100" alt="AWS Logo" />
            </Box>

            <Box variant="h1" textAlign="center">
              Unlock your AWS DeepRacer vehicle
            </Box>

            <Box textAlign="center">
              The default AWS DeepRacer password can be found printed on the bottom of your vehicle.
              If you've recently flashed your car the password may have been reset to 'deepracer'.
            </Box>

            {error && (
              <Alert type="error" dismissible={true} onDismiss={() => setError("")}>
                {error}
              </Alert>
            )}
            <form>
              <FormField label="Password" stretch={true}>
                <Input
                  onChange={({ detail }) => setValue(detail.value)}
                  value={value}
                  type={checked ? "text" : "password"}
                  placeholder="Enter your password"
                  onKeyDown={({ detail }) => {
                    if (detail.keyCode === 13) {
                      // 13 is the key code for Enter
                      submitLogin(value);
                    }
                  }}
                />
              </FormField>
            </form>

            <Checkbox onChange={({ detail }) => setChecked(detail.checked)} checked={checked}>
              Show Password
            </Checkbox>

            <Button variant="primary" onClick={() => submitLogin(value)} fullWidth={true}>
              Access vehicle
            </Button>

            <Box textAlign="center">
              <Link
                href="https://docs.aws.amazon.com/console/deepracer/recover-vehicle-password"
                external
              >
                Forgot password?
              </Link>
            </Box>
          </SpaceBetween>
        </Container>
      </Grid>
    </Box>
  );
};
