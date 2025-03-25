import { Box, Header } from '@cloudscape-design/components';

export function SystemUnavailablePage() {
  return (
    <Box margin={{ vertical: 'xxxl' }} textAlign="center">
      <Header variant="h1">
        System Unavailable
      </Header>
      <p>The DeepRacer system is currently unavailable. Please try again later.</p>
    </Box>
  );
}

export default SystemUnavailablePage;