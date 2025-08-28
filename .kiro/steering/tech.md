# Technology Stack

## Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: AWS Cloudscape Design System
- **Build Tool**: Vite
- **Styling**: Sass with PostCSS and Autoprefixer
- **Routing**: React Router DOM

## Development Tools
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Package Manager**: npm

## Build System
- **Bundler**: Vite with Rollup
- **Package Format**: Debian (.deb) packages
- **Deployment**: Direct file replacement on DeepRacer car

## Common Commands

### Development
```bash
cd website
npm install                    # Install dependencies
export CAR_IP=<car-ip>        # Set car IP for proxy
npm run dev                   # Start development server (port 3000)
npm run build                 # Create production build
```

### Testing
```bash
npm run test                  # Run unit tests
npm run test:coverage         # Run tests with coverage
npm run test:e2e             # Run E2E tests
npm run lint                 # Run linting
npm run format               # Format code
```

### Packaging
```bash
./deepracer-build-pkg.sh     # Build Debian package
./deepracer-deploy-console.sh # Deploy to car (development)
```

## Development Environment
- Requires setting `CAR_IP` environment variable for API proxy
- Development server proxies API calls to actual DeepRacer car
- Car requires CSRF disabled for development: `WTF_CSRF_ENABLED=False`