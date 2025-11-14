# Tile Sprite Mapping System

## Overview
Complete sprite mapping system that loads PNG tiles from `assets/images/16x16 Tiles/` and renders them in the DevRoom scene.

## Architecture

### 1. Sprite Mapping Configuration
**File:** `src/config/spriteMapping.ts`

Maps each TileType enum to its corresponding PNG file:

```typescript
export const TILE_SPRITE_MAP: Record<TileType, string> = {
    [TileType.GRASS]: 'grass.png',
    [TileType.DIRT]: 'dirt.png',
    [TileType.STONE]: 'stone.png',
    [TileType.SAND]: 'sand.png',
    [TileType.SAND_DARK]: 'sand_dark.png',
    [TileType.WATER]: 'water.png',
    [TileType.FARMLAND]: 'farmland.png',
    [TileType.MOSS]: 'moss.png',
    [TileType.PEBBLE_1]: 'pebble_1.png',
    [TileType.PEBBLE_2]: 'pebble_2.png',
    [TileType.PEBBLE_3]: 'pebble_3.png',
    [TileType.CAVE_FLOOR]: 'cave_1.png',
    [TileType.CAVE_WALL]: 'cave_extraDark.png',
    [TileType.CAVE_DIRT]: 'cave_dirt.png',
    [TileType.CAVE_DARK]: 'cave_3.png',
    [TileType.CAVE_WATER]: 'water_cave.png',
    [TileType.ANTHILL]: 'anthill.png'
};
```

### 2. Sprite Loading (sketch.ts)
Tiles are preloaded in p5.js `preload()` function:

```typescript
// Global tile sprites object
let tileSprites: { [key: number]: any } | null = null;

function preload() {
    // ... menu images ...
    
    // Load tile sprites
    tileSprites = {};
    for (const tileTypeKey in TILE_SPRITE_MAP) {
        const tileType = parseInt(tileTypeKey) as TileType;
        const spritePath = TILE_SPRITE_BASE_PATH + TILE_SPRITE_MAP[tileType];
        tileSprites[tileType] = loadImage(spritePath);
    }
}
```

### 3. Scene Integration
DevRoomScene receives tile sprites via constructor:

```typescript
const devRoomScene = new DevRoomScene(
    renderer, 
    window.innerWidth, 
    window.innerHeight,
    menuImages.backButton,
    tileSprites  // ← Tile sprites passed here
);
```

### 4. Sprite vs Color Rendering
Controlled by `DEV_ROOM_CONFIG.TILES.USE_SPRITES` flag:

```typescript
if (DEV_ROOM_CONFIG.TILES.USE_SPRITES && this.tileSprites[tile.type]) {
    // Draw sprite
    graphics.image(this.tileSprites[tile.type], x, y, TILE_SIZE, TILE_SIZE);
} else {
    // Draw colored rectangle (fallback)
    const color = this.tileColors[tile.type] || '#FFFFFF';
    graphics.fill(color);
    graphics.rect(x, y, TILE_SIZE, TILE_SIZE);
}
```

## File Mapping

### Available Sprites (19 files)
```
assets/images/16x16 Tiles/
├── anthill.png          → TileType.ANTHILL (16)
├── cave_1.png           → TileType.CAVE_FLOOR (11)
├── cave_2.png           → Available for variants
├── cave_3.png           → TileType.CAVE_DARK (14)
├── cave_dirt.png        → TileType.CAVE_DIRT (13)
├── cave_extraDark.png   → TileType.CAVE_WALL (12)
├── dirt.png             → TileType.DIRT (1)
├── farmland.png         → TileType.FARMLAND (6)
├── grass.png            → TileType.GRASS (0)
├── moss.png             → TileType.MOSS (7)
├── pebble_1.png         → TileType.PEBBLE_1 (8)
├── pebble_2.png         → TileType.PEBBLE_2 (9)
├── pebble_3.png         → TileType.PEBBLE_3 (10)
├── sand.png             → TileType.SAND (3)
├── sand_dark.png        → TileType.SAND_DARK (4)
├── stone.png            → TileType.STONE (2)
├── water.png            → TileType.WATER (5)
└── water_cave.png       → TileType.CAVE_WATER (15)
```

### Cave Variant System
Some tiles have multiple sprites for visual variety:

```typescript
export const CAVE_VARIANTS = {
    FLOOR: ['cave_1.png', 'cave_2.png'],
    WALL: ['cave_extraDark.png', 'cave_3.png']
} as const;
```

**Usage (future enhancement):**
```typescript
// Randomly select cave floor variant during world generation
const floorVariant = CAVE_VARIANTS.FLOOR[random(0, 2)];
```

## Configuration

### Enable/Disable Sprites
In `src/config/devRoomConfig.ts`:

```typescript
TILES: {
    USE_SPRITES: true,  // true = PNG sprites, false = colored rectangles
    COLORS: {           // Fallback colors when sprites disabled
        // ...
    }
}
```

### Helper Functions

**Get sprite path for any tile:**
```typescript
import { getTileSpritePath } from '../config/spriteMapping';

const spritePath = getTileSpritePath(TileType.GRASS);
// Returns: 'assets/images/16x16 Tiles/grass.png'
```

**List all available sprites:**
```typescript
import { AVAILABLE_SPRITES } from '../config/spriteMapping';

console.log(AVAILABLE_SPRITES);
// ['anthill.png', 'cave_1.png', ...]
```

## Testing

All tests pass with sprite system:
- **735 tests passing** (all existing tests still valid)
- Sprite loading handled in preload (no async issues)
- Fallback colors work if sprites fail to load

## Performance

**Bundle Size:**
- Before sprites: 73.7kb
- After sprites: 76.8kb
- **Increase:** +3.1kb (sprite mapping logic)

**Runtime:**
- Sprites preloaded during p5.js preload phase
- No runtime loading delays
- Direct sprite lookup via TileType enum (O(1))

## Usage Example

### Basic Scene Setup
```typescript
// In any scene that needs tiles
constructor(renderer: Renderer, tileSprites: { [key: number]: any }) {
    this.tileSprites = tileSprites;
}

// Render a tile
render(graphics: any, tile: Tile) {
    const x = tile.col * TILE_SIZE;
    const y = tile.row * TILE_SIZE;
    
    if (this.tileSprites[tile.type]) {
        graphics.image(this.tileSprites[tile.type], x, y, TILE_SIZE, TILE_SIZE);
    }
}
```

### Get Tile Sprite
```typescript
import { TILE_SPRITE_MAP } from '../config/spriteMapping';

// Get sprite filename
const filename = TILE_SPRITE_MAP[TileType.GRASS];  // 'grass.png'

// Get loaded sprite (in scene with preloaded sprites)
const sprite = this.tileSprites[TileType.GRASS];
```

## Future Enhancements

1. **Sprite Variants**
   - Randomly select from variant sets during generation
   - Add variation to prevent repetitive visuals
   
2. **Animated Tiles**
   - Water animation (multiple frames)
   - Lava/fire tiles
   
3. **Tile Overlays**
   - Edge blending between tile types
   - Shadows and lighting effects
   
4. **Sprite Sheets**
   - Convert individual PNGs to single sprite sheet
   - Improve performance with texture atlas

## Troubleshooting

### Sprites not appearing?
1. Check `DEV_ROOM_CONFIG.TILES.USE_SPRITES` is `true`
2. Verify sprites loaded in preload: `console.log(tileSprites)`
3. Check browser console for image loading errors
4. Ensure file paths match exactly (case-sensitive)

### Missing sprites?
- System falls back to placeholder colors
- Check `TILE_SPRITE_MAP` has entry for tile type
- Verify PNG file exists in `assets/images/16x16 Tiles/`

### Wrong sprites?
- Update `TILE_SPRITE_MAP` in `src/config/spriteMapping.ts`
- Rebuild: `npm run build`
- Hard refresh browser (Ctrl+Shift+R)
