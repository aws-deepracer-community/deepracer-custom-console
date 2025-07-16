import { Box, Container, SpaceBetween, Grid } from "@cloudscape-design/components";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ApiHelper } from "../common/helpers/api-helper";

export function SystemUnavailablePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSystem = async () => {
      try {
        const response = await ApiHelper.get("server_ready");
        if (response) {
          navigate("/home", { replace: true });
        }
      } catch (error) {
        // System still unavailable, continue polling
      }
    };

    const pollInterval = setInterval(checkSystem, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [navigate]);

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
              The DeepRacer system is currently unavailable
            </Box>

            <Box textAlign="center">
              If the problem persists try rebooting your DeepRacer car.
              <br />
              If rebooting doesn't fix the problem consider flashing your car.
            </Box>
          </SpaceBetween>
        </Container>
      </Grid>
    </Box>
  );
}

export default SystemUnavailablePage;
