# AntRedo

A game built with p5.js and TypeScript.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript files:
```bash
npm run build
```

Or watch for changes:
```bash
npm run watch
```

3. Open `index.html` in your browser or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

## Project Structure

```
src/
  ├── config.ts           # Game configuration
  ├── sketch.ts           # Main p5.js sketch
  └── utils/
      ├── eventBus.ts     # Event system
      └── helpers.ts      # Utility functions
dist/                     # Compiled JavaScript (generated)
js/                       # Old JavaScript files (can be removed)
```

## Development

- `npm run build` - Compile TypeScript once
- `npm run watch` - Watch for changes and recompile

## Features

- **TypeScript** - Type-safe game development
- **Event Bus** - Centralized event management
- **Helper Functions** - 50+ utility functions for:
  - Math operations (lerp, clamp, distance)
  - Grid/tile operations
  - Vector math
  - Collision detection
  - Color utilities
  - Timer and FPS counter classes
  - State machine
  - Array utilities

## Event Bus Usage

```typescript
import { EventBus, GameEvents } from './utils/eventBus';

// Listen to events
EventBus.on(GameEvents.PLAYER_MOVE, (x, y) => {
    console.log(`Moved to ${x}, ${y}`);
});

// Emit events
EventBus.emit(GameEvents.PLAYER_MOVE, 100, 200);
```

See `EVENTBUS_EXAMPLES.md` for more examples.
