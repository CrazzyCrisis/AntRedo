# AntRedo Copilot Instructions

## Project Overview
TypeScript game built with p5.js in **global mode**. Game logic compiles to `dist/`, loaded as ES module in browser. Heavy use of centralized EventBus pattern for decoupled communication.

**Architecture Pattern:** MVC (Model-View-Controller) with EventBus + Factory Pattern for entity creation
**Rendering System:** Layer-based framebuffer rendering with automatic depth sorting
**World Generation:** Tile-based procedural generation using Perlin noise, overlaid with handmade assets
**Development Approach:** Test-Driven Development (TDD) - write tests first, then implementation

## Architecture

### p5.js Integration (Critical)
- p5.js runs in **global mode** (not instance mode) - functions like `createCanvas()`, `background()` attached to `window`
- `sketch.ts` must expose functions to window: `(window as any).setup = setup`
- Never import p5 - use global declarations: `declare const createCanvas: any;`
- Compiled JS loaded as `type="module"` in `index.html`

### Event-Driven Design
- **EventBus** (`src/utils/eventBus.ts`) is the primary inter-component communication mechanism
- Use `GameEvents` constants, not magic strings: `EventBus.emit(GameEvents.PLAYER_MOVE, x, y)`
- All input handling flows through EventBus (see `sketch.ts` keyPressed/mousePressed)
- Components subscribe in constructors, emit state changes
- Example pattern in `docs/examples/EVENTBUS_EXAMPLES.md`

### Factory Pattern for Entity Creation
- Use Factory classes to create entities with rendering automatically handled
- Factories register renderables with the Renderer, developers don't touch rendering code
- Example: `PlayerFactory.create()` returns Player model and handles all rendering setup
- See `docs/codeExamples/FACTORY_PATTERN.md` for implementation details

### Rendering System
- **Layer-based rendering** with p5.js framebuffers (`createGraphics`)
- **7 layers:** Background, Ground, Ground Decorations, Entities, Above Entities, UI, Debug
- **Automatic depth sorting** by Y-coordinate within entity layers
- **Dirty flag system** - only redraws changed layers for performance
- **EventBus integration** - state changes trigger layer redraws automatically
- See `docs/codeExamples/RENDERING_ARCHITECTURE.md` for full details

### Project Structure
```
src/
  config.ts         # Single CONFIG object for all game constants
  sketch.ts         # p5.js lifecycle (setup/draw/input) - bridges p5 to game (VIEW layer)
  utils/
    eventBus.ts     # Singleton EventBus + GameEvents constants
    helpers.ts      # 50+ pure utility functions (math, grid, vectors, etc.)
  classes/          # Game entities (MODEL layer)
  managers/         # System managers (CONTROLLER layer - audio, level, etc.)
  factories/        # Entity factories (hide rendering complexity)
  rendering/        # Rendering system (Renderer, Camera, Layers, Components)
  scenes/           # Scene management (CONTROLLER layer)
assets/
  images/
    16x16 Tiles/    # Tile spritesheet for procedural generation overlay
  spriteSheets/     # Handmade asset overlays
test/               # Mocha/Chai tests - write tests BEFORE implementation
docs/               # Documentation structure (see below)
```

## Documentation Structure

All documentation follows this organized structure:

```
docs/
  architecture/     # System design documents
    RENDERING_SYSTEM_CODE.md      # Code snippets for rendering
    FACTORY_PATTERN.md             # Factory pattern examples
  checklists/       # Implementation checklists
    RENDERING_CHECKLIST.md         # Phased rendering implementation
  codeExamples/     # Pattern examples and guides
    RENDERING_ARCHITECTURE.md      # Rendering architecture decisions
    FACTORY_PATTERN.md             # Factory pattern implementation
  examples/         # Usage examples
    EVENTBUS_EXAMPLES.md           # EventBus usage patterns
```

**Documentation Guidelines:**
- **Checklists** in `docs/checklists/` - Clean, actionable items with phase breakdowns
- **Architecture** in `docs/architecture/` - Design decisions and code snippets
- **Examples** in `docs/examples/` or `docs/codeExamples/` - Usage patterns and best practices
- Keep checklists clean - reference code snippets, don't embed large code blocks
- Update relevant docs when adding new patterns or systems

## Key Conventions

### Code Quality Principles
- **Minimize redundancy:** Extract reusable patterns into helper functions/utilities
- **DRY (Don't Repeat Yourself):** If code appears twice, refactor into shared function. Alwyas scan the code base for similar code before making something new.
- **Single Responsiblity Principle:** A class or module should have only one responsibility, which translates to having only one reason to change. 
- **Test helpers:** Create reusable test stubs/mocks in `test/helpers/` for repeated patterns
- **Shared utilities:** Add common operations to `src/utils/helpers.ts`

### Configuration
- All game constants in `CONFIG` object (`src/config.ts`)
- Colors as hex strings, speeds/physics as numbers
- Update `CONFIG.DEBUG_MODE` for debug features

### Utilities (`helpers.ts`)
- 50+ tested pure functions - **always check here before implementing common math/collision/array operations**
- Grid/tile helpers: `worldToGrid()`, `gridToWorld()`, `getNeighbors4/8()`
- Vector math: `vectorNormalize()`, `vectorLimit()`, `angleBetween()`
- Classes: `Timer`, `FPSCounter`, `StateMachine<T>` for common patterns
- Import needed functions: `import { clamp, distance } from './utils/helpers'`

### EventBus Patterns
```typescript
// Listen (returns unsubscribe function)
const unsub = EventBus.on(GameEvents.PLAYER_DAMAGE, (amount, health) => {
    this.updateHealth(health);
});

// Emit with multiple args
EventBus.emit(GameEvents.PLAYER_MOVE, this.x, this.y, this.direction);

// One-time listeners
EventBus.once(GameEvents.LEVEL_COMPLETE, () => { /* ... */ });

// Cleanup
EventBus.off(GameEvents.EVENT_NAME, callback);
```

### TypeScript Strictness
- Strict mode enabled - no implicit any, unused variables/parameters cause errors
- Use interfaces for data structures (see `GridCell`, `WorldPosition` in helpers)
- p5.js globals must be declared: `declare const mouseX: any;`
- **No fallbacks unless absolutely necessary** - ask user before adding fallback logic/default values

## Development Workflow

### Build & Run
```bash
npm run watch      # Auto-recompile on changes (main development command)
npm run build      # One-time compile
```
Then open `index.html` in browser or use local server (no hot reload).

### Testing
```bash
npm test           # Run Mocha tests
npm run test:watch # Watch mode
```
- Tests use Chai assertions
- See `test/eventBus.test.ts` for EventBus testing patterns
- `test/helpers.test.ts` shows utility function testing

### Debugging
- Use `CONFIG.DEBUG_MODE = true` flag
- Browser console for runtime (no source maps currently in tsconfig)
- Check `npm run watch` terminal for TypeScript errors

## Common Patterns

### Adding New Game Entities (Factory Pattern)
1. Create Model in `src/classes/` (data only, no rendering)
2. Create Factory in `src/factories/`
3. Factory creates model + renderable components
4. Factory registers with Renderer automatically
5. Return model to calling code

**Example:**
```typescript
// Developer just calls this:
const player = PlayerFactory.create(x, y);

// Factory handles all rendering internally:
// - Creates sprite components
// - Registers with renderer
// - Sets up proper layers
// - Developer never touches rendering code
```

### Input Handling
Don't override p5 input functions directly in game code. Instead:
1. `sketch.ts` already emits `INPUT_*` events
2. Subscribe in your classes: `EventBus.on(GameEvents.INPUT_KEY_PRESS, (keyCode) => { ... })`

### State Management
Use `StateMachine<T>` class from helpers for game states:
```typescript
const state = new StateMachine<'menu' | 'playing' | 'paused'>('menu');
state.setState('playing');
if (state.is('playing')) { /* ... */ }
```

## MVC Architecture

### Model (Data Layer)
- **Location:** `src/classes/`
- **Responsibilities:** Game state, entity data, world data
- **Pattern:** Pure data classes with getters/setters, emit EventBus events on state changes
- **Example:** `Player`, `Enemy`, `Tile`, `WorldModel`

### View (Presentation Layer)
- **Location:** `src/rendering/` components
- **Responsibilities:** p5.js drawing, visual representation only
- **Pattern:** Subscribe to EventBus events, read from Models, never modify state
- **Hidden from developers:** Factory pattern abstracts rendering away

### Controller (Logic Layer)
- **Location:** `src/managers/`, `src/scenes/`, `src/factories/`
- **Responsibilities:** Game logic, input processing, system coordination
- **Pattern:** Listen to EventBus events, update Models, emit new events
- **Example:** `LevelManager`, `InputController`, `CollisionManager`

### Cross-Layer Communication
- Models emit events when data changes: `EventBus.emit(GameEvents.PLAYER_MOVE, x, y)`
- Controllers listen and orchestrate: `EventBus.on(GameEvents.INPUT_KEY_PRESS, ...)`
- Views subscribe and render: `EventBus.on(GameEvents.PLAYER_MOVE, () => this.markDirty())`
- Factories bridge Models and Views transparently

## Tile-Based Procedural Generation

### Perlin Noise Generation
- Use p5.js `noise()` function for 2D Perlin noise (seeded with `noiseSeed()`)
- Map noise values to tile types: `noise(x * scale, y * scale)` → `[0, 1]` → tile ID
- Store in 2D grid data structure (use `helpers.ts` grid functions)
- Example thresholds: `< 0.3` water, `0.3-0.6` grass, `> 0.6` stone

### Asset Overlay System
- **Base Layer:** Procedurally generated tiles from Perlin noise
- **Overlay Layer:** Handmade assets from `assets/images/16x16 Tiles/` and `assets/spriteSheets/`
- Pattern: Check overlay map first, fall back to procedural tile
- Use grid coordinates for asset placement: `gridToWorld()` for rendering

### Tile Implementation Pattern
```typescript
// Model: Tile data
class Tile {
    constructor(public col: number, public row: number, public type: string) {}
}

// Controller: Generate world
class WorldGenerator {
    generateTiles(seed: number): Tile[][] {
        // Perlin noise generation
        // Return 2D array of tiles
    }
    
    overlayAssets(tiles: Tile[][], assetMap: Map<string, any>): void {
        // Apply handmade assets on top
    }
}

// View: Render tiles (in sketch.ts or TileRenderer)
EventBus.on(GameEvents.WORLD_GENERATED, (tiles) => {
    // Draw tiles using p5.js
});
```

## Test-Driven Development (TDD)

### Strict TDD Workflow
1. **Red:** Write failing test first (`test/*.test.ts`)
2. **Green:** Write minimal code to pass test (`src/`)
3. **Refactor:** Improve code while keeping tests passing
4. **Repeat:** Never write production code without a failing test

### Testing Patterns
```typescript
// Test file structure
describe('FeatureName', () => {
    beforeEach(() => {
        // Setup: Clear EventBus, reset state
        EventBus.clear();
    });
    
    describe('method()', () => {
        it('should do specific behavior', () => {
            // Arrange: Setup test data
            // Act: Call method
            // Assert: Verify behavior
            expect(result).to.equal(expected);
        });
    });
});
```

### What to Test
- **Models:** Data integrity, state changes, event emissions
- **Controllers:** Logic flows, event handling, coordination between systems
- **Utilities:** Pure functions (see `test/helpers.test.ts` for examples)
- **Factories:** Entity creation, proper registration with renderer
- **Rendering:** Layer sorting, dirty flags, camera transforms
- **EventBus interactions:** Events emitted/received correctly

### Running Tests
```bash
npm test           # Run all tests once
npm run test:watch # Watch mode - runs on file changes (TDD mode)
```

### Test Examples
```typescript
// Model test
it('should emit event when player moves', () => {
    let emitted = false;
    EventBus.on(GameEvents.PLAYER_MOVE, () => emitted = true);
    player.moveTo(10, 20);
    expect(emitted).to.be.true;
});

// Procedural generation test
it('should generate same tiles with same seed', () => {
    const tiles1 = generator.generateTiles(42);
    const tiles2 = generator.generateTiles(42);
    expect(arraysEqual(tiles1, tiles2)).to.be.true;
});

// Controller test
it('should update player position on input', () => {
    const controller = new InputController(player);
    EventBus.emit(GameEvents.INPUT_KEY_PRESS, 39); // RIGHT arrow
    expect(player.x).to.be.greaterThan(0);
});
```

## Future Structure (Empty Directories)

### Classes (Models)
- `Player.ts` - Player entity data and state
- `Enemy.ts` - Enemy entities
- `Tile.ts` - Individual tile data
- `WorldModel.ts` - Complete world state (tile grid, entities)

### Managers (Controllers)
- `WorldGenerator.ts` - Perlin noise generation + asset overlay
- `LevelManager.ts` - Level loading and progression
- `InputController.ts` - Input → game logic translation
- `CollisionManager.ts` - Entity collision detection
- `AudioManager.ts` - Sound effects and music

### Scenes (Controllers)
- `MenuScene.ts` - Main menu
- `GameScene.ts` - Active gameplay
- `PauseScene.ts` - Pause screen
- Scene pattern: State management, input routing, rendering coordination

## Critical Notes
- **TDD First:** Write tests before implementation - no exceptions
- **Factory Pattern:** Use factories for entity creation - hide rendering complexity from game code
- **EventBus Integration:** Use selectively - not for every frame operations
- Never use p5 instance mode - global mode only
- MVC separation: Models = data, Views = rendering, Controllers = logic
- Procedural generation must be deterministic (same seed = same output)
- Use `helpers.ts` grid functions for tile coordinate conversions
- Update `GameEvents` constants when adding new event types
- Follow documentation structure in `docs/` - keep checklists clean
- Asset overlays reference `assets/images/16x16 Tiles/` for tile sprites
