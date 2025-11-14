# Playwright E2E Testing Setup

## Overview
End-to-end tests for the tile frill rendering system using Playwright.

## Installation
```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Debug tests with Playwright Inspector
```bash
npm run test:e2e:debug
```

## Test Structure

### `tests/e2e/frill-rendering.spec.ts`
Comprehensive test suite for the tile frill rendering system:

1. **Sprite Loading Tests**
   - Verifies all 60 frill sprites load correctly
   - Checks sprite dimensions (16x16)
   - Validates sprite path resolution

2. **Frill Detection Tests**
   - Tests boundary detection at tile edges
   - Verifies neighbor analysis logic
   - Captures console debug output

3. **Rendering Tests**
   - Verifies graphics context functionality
   - Tests image() call execution
   - Captures canvas screenshots for visual verification

4. **Direction Logic Tests**
   - Tests frill direction determination
   - Verifies neighbor → frill mapping
   - Logs tile type, neighbors, and sprite paths for debugging

## Prerequisites
- **Live Server**: Must be running on port 5500
- **Build**: Run `npm run build` before testing
- **DevRoom Scene**: Tests navigate to DevRoomScene automatically

## Test Output
- **HTML Report**: `playwright-report/index.html` (generated after test run)
- **Screenshots**: `test-results/frill-rendering.png` (canvas capture)
- **Videos**: Captured on test failure only
- **Console Logs**: All `console.log()` messages captured in test output

## Key Features

### Automatic Navigation
Tests automatically:
1. Navigate to `index.html`
2. Wait for p5.js to load
3. Navigate to DevRoom scene via EventBus
4. Wait for world generation and rendering

### Console Capture
Captures debug output including:
- Frill detection logs
- Tile types and neighbors
- Sprite paths and loading status
- Rendering completion markers

### Visual Verification
- Takes screenshot of canvas with rendered frills
- Saved to `test-results/frill-rendering.png`
- Useful for manual visual inspection

## Debugging Failed Tests

If tests fail:
1. Check `playwright-report/index.html` for detailed trace
2. View `test-results/frill-rendering.png` for visual state
3. Run `npm run test:e2e:debug` to step through test
4. Check console output in test logs for debug messages

## Configuration
See `playwright.config.ts` for:
- Base URL settings
- Timeout configuration
- Browser selection
- Reporter options
