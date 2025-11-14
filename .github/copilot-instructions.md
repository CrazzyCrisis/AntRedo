# AntRedo Copilot Instructions

## Project Overview
TypeScript game built with p5.js in **global mode**. Game logic compiles to `dist/` as CommonJS, then bundled with **esbuild** to browser-compatible IIFE format. Heavy use of centralized EventBus pattern for decoupled communication.

**Architecture Pattern:** MVC (Model-View-Controller) with EventBus + Factory Pattern for entity creation
**Rendering System:** Layer-based framebuffer rendering with automatic depth sorting
**World Generation:** Tile-based procedural generation using Perlin noise, overlaid with handmade assets
**Development Approach:** Test-Driven Development (TDD) - write tests first, then implementation
**Build System:** TypeScript → CommonJS → esbuild bundler → Single browser-ready IIFE file

## Architecture

### p5.js Integration (Critical)
- p5.js runs in **global mode** (not instance mode) - functions like `createCanvas()`, `background()` attached to `window`
- `sketch.ts` must expose functions to window: `(window as any).setup = setup`
- Never import p5 - use global declarations: `declare const createCanvas: any;`
- Build process: TypeScript compiles to CommonJS → esbuild bundles to IIFE → Browser loads `bundle.js`

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
- **Create checklists for multi-step tasks** - Break down complex work into tracked subtasks in `docs/checklists/`

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

### UI Layout Configuration (CRITICAL PATTERN)
**All UI positioning and styling MUST use centralized config files** - Never hardcode positions, scales, or animation values in UI components or scenes.

**Pattern:** Create layout config files in `src/config/` for each UI system:
- `menuLayout.ts` - Menu button positions, scales, animations
- Future: `hudLayout.ts`, `dialogLayout.ts`, etc.

**Normalized Coordinate System (-1 to 1 scale):**
- **offsetX:** `-1` (left edge) to `1` (right edge), `0` is center
- **offsetY:** `-1` (bottom edge) to `1` (top edge), `0` is center
- **Resolution-independent:** Automatically scales with canvas size
- **Conversion:** `pixelX = centerX + (offsetX * halfWidth)`, `pixelY = centerY - (offsetY * halfHeight)`

**Structure:**
```typescript
// Example: src/config/menuLayout.ts
export const MAIN_MENU_LAYOUT = {
    PLAY_BUTTON: {
        offsetX: 0,      // Centered horizontally
        offsetY: 0.05    // Slightly above center
    },
    // ... more elements
} as const;

export const MENU_SCALES = {
    TITLE: 0.6,
    BUTTON: 0.2
} as const;

export const MENU_ANIMATIONS = {
    TITLE_SPEED: 0.05,
    TITLE_AMPLITUDE: 8
} as const;
```

**Implementation in Scenes:**
```typescript
import { MAIN_MENU_LAYOUT, MENU_SCALES } from '../config/menuLayout';

// Convert normalized coordinates to pixels
const centerX = this.canvasWidth / 2;
const centerY = this.canvasHeight / 2;
const halfWidth = this.canvasWidth / 2;
const halfHeight = this.canvasHeight / 2;

this.playButton = new ButtonComponent(
    image,
    centerX + (MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetX * halfWidth),
    centerY - (MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetY * halfHeight),  // Note: subtract for Y
    'play_button'
);
this.playButton.scale = MENU_SCALES.BUTTON;
```

**Testing Integration:**
```typescript
// test/helpers/[system]TestConfig.ts imports actual config
import { MAIN_MENU_LAYOUT } from '../../src/config/menuLayout';

const centerX = TEST_CANVAS.WIDTH / 2;
const halfWidth = TEST_CANVAS.WIDTH / 2;

export const MAIN_MENU_BUTTONS = {
    PLAY: {
        x: centerX + (MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetX * halfWidth),
        y: centerY - (MAIN_MENU_LAYOUT.PLAY_BUTTON.offsetY * halfHeight)
    }
};
// Tests use these calculated positions - stay in sync automatically
```

**Benefits:**
- Single source of truth - change layout in one place
- Resolution-independent - works on any screen size
- Tests automatically stay in sync
- No magic numbers in code
- Easy to experiment with different layouts
- Clear, maintainable code

**ALWAYS use this pattern for:**
- Button positions and spacing
- UI element scales
- Animation speeds and amplitudes
- Padding and margins
- Any positioning or styling value

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
npm run build      # TypeScript → CommonJS → esbuild bundle (production)
npm run watch      # Auto-rebuild on changes (development)
npm run dev        # Alias for watch
```

**Build Process:**
1. TypeScript compiles `src/` to `dist/` (CommonJS format)
2. esbuild bundles `dist/sketch.js` → `dist/bundle.js` (IIFE format)
3. `index.html` loads `dist/bundle.js` (browser-ready, no module system)

**Why this setup?**
- TypeScript outputs CommonJS for Node.js compatibility (tests)
- esbuild bundles to IIFE for browser compatibility (no `exports`/`require` errors)
- Tests use CommonJS directly in Node.js (fast, no bundling needed)
- Browser gets single bundled file with all dependencies

Then open `index.html` in browser or use local server.

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
- Browser console for runtime
- TypeScript source maps enabled for debugging compiled code
- Check `npm run watch` terminal for TypeScript/bundling errors
- `dist/bundle.js` is the final output loaded by browser

## Common Patterns

### Scene System (NEW - Scene-Based Architecture)
**Pattern:** IScene interface + SceneManager singleton for game state management (menus, gameplay, pause, etc.)

**Creating a Scene:**
1. Implement `IScene` interface (`src/scenes/IScene.ts`)
2. Implement lifecycle methods: `enter()`, `exit()`, `update()`, `handleMouseClick()`, `handleMouseMove()`
3. Register UI components with Renderer in `enter()`, unregister in `exit()`
4. Switch scenes using `SceneManager.getInstance().switchScene(scene, 'SceneName')`

**Example MenuScene Pattern:**
```typescript
export class MenuScene implements IScene {
    private renderer: Renderer;
    private buttons: ButtonComponent[] = [];
    private unregisterFunctions: Array<() => void> = [];

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    enter(): void {
        // Create UI components
        const playButton = new ButtonComponent(sprite, 400, 300, 'play_button');
        playButton.onClick(() => EventBus.emit(GameEvents.MENU_PLAY_CLICKED));
        
        // Register with renderer (store unregister functions)
        this.unregisterFunctions.push(this.renderer.register(playButton));
        this.buttons.push(playButton);
    }

    exit(): void {
        // Cleanup: unregister all components
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];
        this.buttons = [];
    }

    update(): void {
        // Update animations
        this.buttons.forEach(button => button.update());
    }

    handleMouseClick(x: number, y: number): void {
        this.buttons.forEach(button => button.handleClick(x, y));
    }

    handleMouseMove(x: number, y: number): void {
        this.buttons.forEach(button => {
            button.setHovered(button.isMouseOver(x, y));
        });
    }
}
```

**SceneManager Integration (sketch.ts):**
```typescript
// Minimal additions to sketch.ts - keep it clean!
import { SceneManager } from './managers/SceneManager';

function draw() {
    background(CONFIG.COLORS.BACKGROUND);
    SceneManager.getInstance().update(); // One line
}

function mousePressed() {
    EventBus.emit(GameEvents.INPUT_MOUSE_CLICK, mouseX, mouseY, mouseButton);
    SceneManager.getInstance().handleMouseClick(mouseX, mouseY); // One line
}

function mouseMoved() {
    EventBus.emit(GameEvents.INPUT_MOUSE_MOVE, mouseX, mouseY);
    SceneManager.getInstance().handleMouseMove(mouseX, mouseY); // One line
}
```

### Reusable UI Components (NEW)
**Location:** `src/rendering/components/`

1. **AnimatedSpriteComponent** - Animated floating/hovering sprites (titles, banners)
   - `setAnimationSpeed(speed)` - radians per frame
   - `setAmplitude(amplitude)` - vertical movement range
   - `update()` - call every frame
   - Automatically oscillates with sine wave

2. **ButtonComponent** - Interactive buttons with hover pulse
   - `isMouseOver(x, y)` - bounds checking
   - `setHovered(hovered)` - hover state
   - `onClick(callback)` - click callback
   - `handleClick(x, y)` - process click
   - `setPulseSpeed(speed)` - animation speed
   - `update()` - call every frame for pulse effect

3. **UIContainer** - Layout manager for UI elements
   - `addChild(component, relativeX, relativeY)` - add with relative positioning
   - `removeChild(component)` - remove component
   - `setPosition(x, y)` - move container and all children
   - `centerHorizontally(canvasWidth)` - center on screen

4. **SliderWithArrowsComponent** - Enhanced slider with arrow buttons
   - Combines draggable slider + left/right arrow buttons (±1% default)
   - `getValue()` / `setValue(value)` - get/set current value
   - `incrementByArrow()` / `decrementByArrow()` - discrete adjustments
   - `setArrowStep(step)` - customize arrow increment amount
   - `onChange(callback)` - fires on all value changes
   - All interactions bounded to [min, max] range
   - Hover highlighting on track and arrows

5. **NumberInputComponent** - Numeric input with increment/decrement arrows
   - Click-to-focus text input + arrow buttons
   - `getValue()` / `setValue(value)` - get/set current value
   - `setStep(step)` - set arrow increment amount
   - `handleTextInput(text)` - process keyboard input when focused
   - `onChange(callback)` - fires when value changes
   - Validates numeric input, clamps to bounds

**Example Usage:**
```typescript
// Slider with arrows for precise control
const slider = new SliderWithArrowsComponent(
    sprite, x, y, 0, 1, 0.5, 'my_slider'
);
slider.setArrowStep(0.01); // 1% increments
slider.onChange((value) => {
    console.log('Value changed:', value);
});

// Number input with arrows
const numberInput = new NumberInputComponent(
    x, y, 0, 100, 50, 'priority_input'
);
numberInput.setStep(1); // Integer steps
numberInput.onChange((value) => {
    updateConfig(value);
});

// Animated title
const title = new AnimatedSpriteComponent(titleSprite, 400, 150);
title.setAnimationSpeed(0.05);
title.setAmplitude(8);
renderer.register(title);

// Interactive button
const button = new ButtonComponent(buttonSprite, 400, 300, 'play_button');
button.onClick(() => EventBus.emit(GameEvents.MENU_PLAY_CLICKED));
renderer.register(button);

// In update loop
title.update();
button.update();

// In mouse handlers
if (button.isMouseOver(mouseX, mouseY)) {
    button.setHovered(true);
}
button.handleClick(mouseX, mouseY);
```

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

### Regression Testing (CRITICAL)
**ALWAYS perform regression testing after ANY code changes:**
1. **Manual Testing:** Test all related features in browser after each change
2. **Common Regressions to Check:**
   - UI component interactions (clicks, hovers, drags)
   - Window resize behavior (all UI should scale/reposition)
   - Component positioning after state changes
   - Event handler chains (input → scene → component)
   - Config/state synchronization between systems
3. **Before Marking Complete:** Verify ALL existing functionality still works
4. **When Bugs Found:** Add test coverage to prevent future regressions

**Pattern:** After every edit, mentally ask "What could this break?" and test those areas.

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
