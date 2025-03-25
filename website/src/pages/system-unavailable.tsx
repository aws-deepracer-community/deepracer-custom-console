import { Box, Container,SpaceBetween, Grid } from '@cloudscape-design/components';

export function SystemUnavailablePage() {
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
              <br/>
              If rebooting doesn't fix the problem consider flashing your car.
            </Box>
          </SpaceBetween>
        </Container>
      </Grid>
    </Box>
  );
}

export default SystemUnavailablePage;