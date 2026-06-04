# Project Structure

## Root Directory
- `README.md` - Project documentation and setup instructions
- `LICENSE` - MIT license
- `*.sh` - Shell scripts for building, deploying, and managing the console
- `setup-tests.sh` - Test environment setup

## Package Directory (`package/`)
- `control` - Debian package control file with dependencies
- `postinst` - Post-installation script
- `prerm` - Pre-removal script

## Website Directory (`website/`)
Main React application source code and configuration.

### Configuration Files
- `package.json` - Dependencies and npm scripts
- `vite.config.ts` - Vite build configuration with car proxy setup
- `tsconfig.json` - TypeScript configuration
- `playwright.config.ts` - E2E test configuration
- `vitest.config.ts` - Unit test configuration
- `.eslintrc.cjs` - ESLint configuration

### Source Structure (`website/src/`)
- `main.tsx` - Application entry point
- `app.tsx` - Main app component with routing
- `components/` - Reusable React components
- `pages/` - Page-level components
- `common/` - Shared utilities and types
- `styles/` - Global styles and Sass files
- `test/` - Test utilities and mocks

### Build Output
- `website/dist/` - Vite build output
- `dist/` - Debian package build directory

## Key Architecture Patterns
- **Component-based**: Uses Cloudscape Design System components
- **Page-based routing**: React Router with page components
- **Proxy development**: Vite proxies API calls to actual DeepRacer car
- **Debian packaging**: Custom build script creates installable packages
- **File replacement deployment**: Replaces original console files directly

## Naming Conventions
- React components use PascalCase
- Files use kebab-case
- TypeScript interfaces and types use PascalCase
- CSS classes follow Cloudscape conventions