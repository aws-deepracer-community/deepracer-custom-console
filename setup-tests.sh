#!/bin/bash

# Test Framework Setup Script for AWS DeepRacer Console

echo "🚀 Setting up test automation framework..."

# Navigate to website directory
cd "$(dirname "$0")/website"

echo "📦 Installing dependencies..."
npm install

echo "🧪 Running initial test to verify setup..."
npm run test -- --run

echo "🎭 Installing Playwright browsers..."
npx playwright install

echo "🔍 Running linting check..."
npm run lint

echo "✅ Test framework setup complete!"
echo ""
echo "Available commands:"
echo "  npm run test              # Run unit tests in watch mode"
echo "  npm run test:ui           # Run tests with interactive UI"
echo "  npm run test:coverage     # Run tests with coverage report"
echo "  npm run test:e2e          # Run end-to-end tests"
echo "  npm run test:e2e:ui       # Run E2E tests with UI"
echo "  npm run test:e2e:headed   # Run E2E tests in visible browser"
echo ""
echo "📖 See TESTING.md for detailed documentation"
