# DevRoom Configuration System

## Overview
The DevRoom now uses a centralized configuration file (`src/config/devRoomConfig.ts`) for all customization, following the same pattern as the main menu system.

## Configuration Structure

### World Generation
```typescript
DEV_ROOM_CONFIG.WORLD = {
    WIDTH: 30,          // World width in tiles
    HEIGHT: 20,         // World height in tiles
    SEED: 12345,        // Fixed seed for deterministic generation
    NOISE_SCALE: 0.1    // Perlin noise scale (0.05-0.3 typical)
}
```

### Tile Appearance
```typescript
DEV_ROOM_CONFIG.TILES = {
    SIZE: 16,                    // Tile size in pixels
    USE_SPRITES: false,          // Toggle between sprites and colors
    COLORS: {                    // Placeholder colors (17 tile types)
        0: '#90EE90',  // GRASS
        1: '#8B4513',  // DIRT
        2: '#808080',  // STONE
        // ... etc
    }
}
```

### UI Layout (Normalized Coordinates)
```typescript
DEV_ROOM_CONFIG.LAYOUT = {
    BACK_BUTTON: {
        offsetX: -0.85,  // -1 (left) to 1 (right), 0 = center
        offsetY: 0.85    // -1 (bottom) to 1 (top), 0 = center
    },
    INFO_TEXT: {
        offsetX: 0,      // Centered horizontally
        offsetY: -0.85   // Bottom of screen
    }
}
```

### Scales & Animations
```typescript
DEV_ROOM_CONFIG.SCALES = {
    BUTTON: 0.15  // Button sprite scale
}

DEV_ROOM_CONFIG.ANIMATIONS = {
    BUTTON_PULSE_SPEED: 0.03,   // Pulse animation speed
    BUTTON_PULSE_AMOUNT: 0.05   // Pulse scale change
}
```

### Debug Options
```typescript
DEV_ROOM_CONFIG.DEBUG = {
    SHOW_GRID: false,
    SHOW_COORDINATES: false,
    SHOW_MOVEMENT_COSTS: false,
    SHOW_INFO: true
}
```

## Usage in DevRoomScene

### World Generation
```typescript
// In enter() method
this.worldGenerator.setNoiseScale(DEV_ROOM_CONFIG.WORLD.NOISE_SCALE);
const worldData = this.worldGenerator.generate(
    DEV_ROOM_CONFIG.WORLD.WIDTH,
    DEV_ROOM_CONFIG.WORLD.HEIGHT,
    DEV_ROOM_CONFIG.WORLD.SEED
);
```

### Tile Rendering
```typescript
// In constructor
this.tileColors = DEV_ROOM_CONFIG.TILES.COLORS;

// In tile renderer
const color = this.tileColors[tile.type] || '#FFFFFF';
```

### Button Positioning
```typescript
// Convert normalized coordinates to pixels
const centerX = this.canvasWidth / 2;
const centerY = this.canvasHeight / 2;
const halfWidth = this.canvasWidth / 2;
const halfHeight = this.canvasHeight / 2;

const buttonX = centerX + (DEV_ROOM_CONFIG.LAYOUT.BACK_BUTTON.offsetX * halfWidth);
const buttonY = centerY - (DEV_ROOM_CONFIG.LAYOUT.BACK_BUTTON.offsetY * halfHeight);

this.backButton = new ButtonComponent(
    this.backButtonImg,
    buttonX,
    buttonY,
    'back_button_devroom'
);
this.backButton.scale = DEV_ROOM_CONFIG.SCALES.BUTTON;
this.backButton.setPulseSpeed(DEV_ROOM_CONFIG.ANIMATIONS.BUTTON_PULSE_SPEED);
```

## ButtonComponent Integration

### Replaced Placeholder with Real Button
**Before (Placeholder):**
```typescript
// Grey rectangle with hardcoded position
const backButtonRenderable = {
    render: (graphics: any) => {
        graphics.fill(100, 100, 100);
        graphics.rect(10, 10, 100, 40);
        graphics.text('Back', 30, 35);
    }
};
```

**After (ButtonComponent):**
```typescript
// Proper button with sprite, hover, and pulse animation
this.backButton = new ButtonComponent(
    this.backButtonImg,
    buttonX,
    buttonY,
    'back_button_devroom'
);
this.backButton.scale = DEV_ROOM_CONFIG.SCALES.BUTTON;
this.backButton.setPulseSpeed(DEV_ROOM_CONFIG.ANIMATIONS.BUTTON_PULSE_SPEED);
this.backButton.onClick(() => {
    EventBus.emit(GameEvents.MENU_BACK_CLICKED);
});
```

### Button Lifecycle
```typescript
// In update()
this.backButton.update();  // Animate pulse

// In handleMouseClick()
this.backButton.handleClick(x, y);  // Process clicks

// In handleMouseMove()
this.backButton.setHovered(this.backButton.isMouseOver(x, y));  // Hover state
```

## Benefits

1. **Single Source of Truth** - All settings in one config file
2. **Easy Customization** - Change world size, colors, layout without touching scene code
3. **Resolution Independent** - Normalized coordinates work on any screen size
4. **Consistent Pattern** - Matches main menu layout system
5. **Professional UI** - ButtonComponent with hover and animations
6. **Future-Proof** - USE_SPRITES flag ready for sprite integration

## How to Customize

### Change World Size
```typescript
// In devRoomConfig.ts
WORLD: {
    WIDTH: 50,   // Larger world
    HEIGHT: 30,
    // ...
}
```

### Adjust Terrain Variation
```typescript
WORLD: {
    NOISE_SCALE: 0.05,  // Larger features (less variation)
    // or
    NOISE_SCALE: 0.3,   // Smaller features (more variation)
}
```

### Reposition Button
```typescript
LAYOUT: {
    BACK_BUTTON: {
        offsetX: 0.85,   // Move to right side
        offsetY: 0.85    // Keep at top
    }
}
```

### Change Tile Colors
```typescript
TILES: {
    COLORS: {
        0: '#00FF00',  // Bright green grass
        2: '#444444',  // Darker stone
        // ... etc
    }
}
```

## Next Steps

1. **Add Info Text Display** - Show world dimensions, seed, tile counts
2. **Implement Debug Toggles** - Grid overlay, coordinates, movement costs
3. **Sprite Integration** - Load PNG sprites when USE_SPRITES = true
4. **Camera Controls** - Pan/zoom using CAMERA config settings
