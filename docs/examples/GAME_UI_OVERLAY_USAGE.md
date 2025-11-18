# GameUIOverlay Usage Guide

## Overview
`GameUIOverlay` is a reusable UI management class that encapsulates all standard game UI components (resources, population, power bar, queen portrait, commands, minimap). It provides a clean API for scenes to display game UI without managing individual components.

## Location
`src/rendering/GameUIOverlay.ts`

## Components Managed
- **ResourceDisplay** - Shows faction resources (food, wood, stone)
- **PopulationDisplay** - Shows current/max population
- **PowerBar** - Shows queen's unlocked powers with cooldowns
- **QueenPortrait** - Animated queen portrait with health bar
- **QueenCommands** - Interactive command buttons (Attack, Follow, Defend, etc.)
- **Minimap** - Mini-map with camera position and click-to-move

## Basic Usage

### 1. Import and Create
```typescript
import { GameUIOverlay } from '../rendering/overlays/GameUIOverlay';

export class MyGameScene implements IScene {
    private uiOverlay: GameUIOverlay | null = null;
    
    // ... other scene properties
}
```

### 2. Initialize in `enter()`
```typescript
enter(): void {
    // Create UI overlay
    this.uiOverlay = new GameUIOverlay(
        this.renderer,
        this.camera,
        {
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight,
            factionId: 'player',
            showMinimap: true,
            showPowerBar: true,
            showQueenPortrait: true,
            showCommands: true,
            showResources: true,
            showPopulation: true
        },
        {
            queen: this.sprites.queen
        }
    );
    
    // Initialize components and register with renderer
    this.uiOverlay.initialize();
    
    // Set queen reference (configures power bar and portrait)
    if (this.queen) {
        this.uiOverlay.setQueen(this.queen);
    }
    
    // Update initial population
    this.uiOverlay.updatePopulation(this.ants.length, 50);
}
```

### 3. Update in `update()`
```typescript
update(): void {
    // Update entity logic, camera, etc.
    
    // Update UI overlay (portrait animations, etc.)
    if (this.uiOverlay) {
        this.uiOverlay.update();
    }
}
```

### 4. Delegate Mouse Handlers
```typescript
handleMouseClick(x: number, y: number): void {
    // Delegate to UI overlay
    if (this.uiOverlay) {
        this.uiOverlay.handleMouseClick(x, y);
    }
}

handleMouseMove(x: number, y: number): void {
    // Delegate to UI overlay
    if (this.uiOverlay) {
        this.uiOverlay.handleMouseMove(x, y);
    }
}
```

### 5. Handle Resize
```typescript
onResize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    // Update UI overlay with new dimensions
    if (this.uiOverlay) {
        this.uiOverlay.onResize(width, height);
    }
}
```

### 6. Cleanup in `exit()`
```typescript
exit(): void {
    // Cleanup UI overlay
    if (this.uiOverlay) {
        this.uiOverlay.cleanup();
        this.uiOverlay = null!;
    }
    
    // ... other cleanup
}
```

## Configuration Options

### GameUIConfig Interface
```typescript
interface GameUIConfig {
    canvasWidth: number;      // Canvas width for positioning
    canvasHeight: number;     // Canvas height for positioning
    worldWidth: number;       // World width for minimap
    worldHeight: number;      // World height for minimap
    factionId: string;        // Faction ID for resource display
    showMinimap?: boolean;    // Show minimap (default: true)
    showPowerBar?: boolean;   // Show power bar (default: true)
    showQueenPortrait?: boolean; // Show queen portrait (default: true)
    showCommands?: boolean;   // Show command buttons (default: true)
    showResources?: boolean;  // Show resource display (default: true)
    showPopulation?: boolean; // Show population display (default: true)
}
```

### Optional Component Visibility
You can selectively show/hide components by setting flags to `false`:

```typescript
// Example: Hide commands and minimap
this.uiOverlay = new GameUIOverlay(
    this.renderer,
    this.camera,
    {
        // ... other config
        showCommands: false,  // Hide command buttons
        showMinimap: false,   // Hide minimap
    },
    { queen: this.sprites.queen }
);
```

## API Methods

### `initialize(): void`
Creates and registers all UI components with the renderer. Call once in scene's `enter()`.

### `setQueen(queen: Queen): void`
Configures power bar with queen's powers and portrait with queen reference. Call after queen is created.

### `updatePopulation(current: number, max: number): void`
Updates population display with current and max values. Call when population changes.

### `update(): void`
Updates animated components (portrait, etc.). Call every frame in scene's `update()`.

### `handleMouseClick(x: number, y: number): void`
Handles mouse clicks for minimap and command buttons. Delegate from scene's `handleMouseClick()`.

### `handleMouseMove(x: number, y: number): void`
Handles mouse hover for command buttons. Delegate from scene's `handleMouseMove()`.

### `onResize(width: number, height: number): void`
Repositions UI components when window resizes. Delegate from scene's `onResize()`.

### `cleanup(): void`
Unregisters all components and cleans up event listeners. Call in scene's `exit()`.

## Example Implementation
See `src/scenes/EntityShowcaseScene.ts` for a complete working example.

## Benefits
- **Reusable** - Use across multiple scenes (DevRoomScene, EntityShowcaseScene, etc.)
- **Consistent** - All game scenes have identical UI layout and behavior
- **Maintainable** - UI changes in one place affect all scenes
- **Clean** - Scenes don't manage individual UI components
- **Configurable** - Show/hide components per scene needs

## EventBus Integration
The overlay automatically subscribes to relevant events:
- `MINIMAP_CLICK` - Emitted when minimap is clicked
- `QUEEN_COMMAND_*` - Emitted when command buttons are clicked
- Power usage events are handled by PowerBar automatically

## Notes
- UI overlay manages its own renderer registration/unregistration
- Component positioning is hardcoded for standard game UI layout
- Sprites parameter currently only requires `queen` sprite (for portrait)
- Future: Could extend to support custom positions or themes
