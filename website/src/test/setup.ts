import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ 
    onUnhandledRequest: 'bypass' // Allow non-API requests to pass through
  })
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock window.location for routing tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '#/',
    hostname: 'localhost',
    port: '3000',
    protocol: 'http:',
  },
  writable: true,
})

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Suppress debug and log messages in tests unless needed
  debug: import.meta.env.NODE_ENV === 'test' ? () => {} : console.debug,
  log: import.meta.env.NODE_ENV === 'test' ? () => {} : console.log,
}
