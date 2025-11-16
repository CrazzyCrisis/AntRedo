# Tile Movement Configuration System

## Overview
Centralized configuration system for tile-based pathfinding costs and entity movement speed modifiers. Allows easy tuning of how different tiles affect pathfinding decisions and entity movement speed.

## Location
`src/config/tileMovementConfig.ts`

## Features
- **Pathfinding Costs**: Weight values for A* pathfinding (higher = less desirable path)
- **Speed Modifiers**: Percentage-based speed changes when entities move on tiles (1.0 = normal, 0.4 = 60% slower, 1.3 = 30% faster)
- **Entity-Specific Overrides**: Different entity types can have custom speed modifiers on the same tile (e.g., bosses faster on stone)
- **Walkability**: Whether entities can traverse the tile at all

## Configuration Structure

### TileMovementConfig Interface
```typescript
interface TileMovementConfig {
    pathfindingCost: number;       // A* weight (higher = avoid)
    speedModifier: TileSpeedModifier;  // Speed multipliers
    walkable: boolean;             // Can walk on this tile?
}

interface TileSpeedModifier {
    default: number;           // Default for all entities
    boss?: number;            // Override for bosses
    queen?: number;           // Override for queen
    ant?: number;             // Override for ants
}
```

## Example Configurations

### Water (Extremely Slow, High Avoidance)
```typescript
[TileType.WATER]: {
    pathfindingCost: 100.0,        // Very high - almost never path through
    speedModifier: {
        default: 0.4,              // 60% slower (40% speed)
    },
    walkable: false                 // Not walkable (future: swimming)
}
```

### Stone (Slow for Most, Fast for Bosses)
```typescript
[TileType.STONE]: {
    pathfindingCost: 5.0,          // High cost - avoid if possible
    speedModifier: {
        default: 0.7,              // 30% slower for most
        boss: 1.3                  // 30% faster for bosses!
    },
    walkable: true
}
```

### Grass (Normal Terrain)
```typescript
[TileType.GRASS]: {
    pathfindingCost: 1.0,          // Normal pathfinding weight
    speedModifier: { default: 1.0 },  // Normal speed
    walkable: true
}
```

## Usage

### Getting Speed Modifier for Entity
```typescript
import { getTileSpeedModifier } from '../config/tileMovementConfig';
import { TileType } from '../world/TileSystem';

// Queen on grass
const modifier = getTileSpeedModifier(TileType.GRASS, 'queen');
// → 1.0 (normal speed)

// Boss on stone
const modifier = getTileSpeedModifier(TileType.STONE, 'boss');
// → 1.3 (30% faster!)

// Ant on water (if walkable)
const modifier = getTileSpeedModifier(TileType.WATER, 'ant');
// → 0.4 (60% slower)
```

### Getting Pathfinding Cost
```typescript
import { getTilePathfindingCost } from '../config/tileMovementConfig';

const cost = getTilePathfindingCost(TileType.WATER);
// → 100.0 (very high - avoid!)

const cost = getTilePathfindingCost(TileType.GRASS);
// → 1.0 (normal)
```

### Checking Walkability
```typescript
import { isTileWalkable } from '../config/tileMovementConfig';

const canWalk = isTileWalkable(TileType.WATER);
// → false

const canWalk = isTileWalkable(TileType.STONE);
// → true
```

## Integration with GameObject

The `GameObject` class automatically applies tile speed modifiers in `processMovement()`:

```typescript
// In GameObject.processMovement()
let effectiveSpeed = this.moveSpeed; // Base speed

const tileGrid = GameStateManager.getInstance().getTileGrid();
const currentTile = tileGrid.getTileDataAt(this.gridX, this.gridY);

if (currentTile) {
    // Get speed modifier for this entity type on this tile
    const speedModifier = getTileSpeedModifier(currentTile.type, this.entityClass);
    effectiveSpeed *= speedModifier;
}

const moveDistance = deltaSeconds * effectiveSpeed * TILE_SIZE;
```

**Key Points:**
- `entityClass` field determines which modifier to use ('ant', 'queen', 'boss', etc.)
- Speed is applied every frame automatically
- No manual intervention needed in entity classes

## Entity Setup

Entities must set their `entityClass` in the constructor:

```typescript
// src/classes/Queen.ts
constructor(gridX: number, gridY: number, factionId: string) {
    super('queen', gridX, gridY);
    this.entityClass = 'queen'; // ← Set for tile speed modifiers
    // ...
}

// src/classes/Boss.ts
constructor(gridX: number, gridY: number, ...) {
    super('boss', gridX, gridY);
    this.entityClass = 'boss'; // ← Bosses get speed bonus on stone!
    // ...
}
```

## Design Rationale

### Why Separate Speed Modifiers and Pathfinding Costs?
- **Pathfinding Cost**: How much the AI "dislikes" a path (stone is high → ants avoid)
- **Speed Modifier**: Actual movement speed when on tile (stone slows ants down IF they walk on it)
- **Independent**: An ant might avoid stone (high cost) BUT if forced to walk on it, moves slowly (low speed)

### Why Not Infinity for Water?
- Water has high cost (100) instead of Infinity
- Allows for future swimming mechanics without config changes
- Still effectively prevents pathing through water (cost too high)
- If swimming is added, just set `walkable: true` for aquatic entities

### Entity-Specific Modifiers
- Bosses love stone → faster movement, tactical advantage
- Future: Fish would be faster in water
- Easy to add new entity types without changing core code

## Tuning Tips

### Making Tiles More/Less Desirable for Pathfinding
- **Higher cost**: AI avoids (good for hazards, slow terrain)
- **Lower cost**: AI prefers (good for roads, fast terrain)
- Typical range: 1.0 (normal) to 10.0 (very undesirable)
- Use Infinity for true walls (cave walls, anthill, etc.)

### Adjusting Movement Speed
- `1.0` = normal speed
- `0.5` = 50% slower (half speed)
- `0.7` = 30% slower
- `1.3` = 30% faster
- `2.0` = 2x faster (double speed)

### Testing Changes
1. Edit `src/config/tileMovementConfig.ts`
2. `npm run build`
3. Open game in browser
4. Watch entities move across different tiles
5. Observe pathfinding avoiding/preferring certain tiles

## Current Tile Values

| Tile Type    | Pathfinding Cost | Default Speed | Boss Speed | Walkable |
|-------------|------------------|---------------|------------|----------|
| GRASS       | 1.0              | 1.0 (100%)    | -          | ✓        |
| DIRT        | 1.1              | 0.95 (95%)    | -          | ✓        |
| STONE       | 5.0              | 0.7 (70%)     | 1.3 (130%) | ✓        |
| SAND        | 1.5              | 0.85 (85%)    | -          | ✓        |
| WATER       | 100.0            | 0.4 (40%)     | -          | ✗        |
| FARMLAND    | 1.2              | 0.9 (90%)     | -          | ✓        |
| MOSS        | 1.1              | 0.95 (95%)    | -          | ✓        |
| PEBBLES     | 1.0              | 1.0 (100%)    | -          | ✓        |
| CAVE_FLOOR  | 1.0              | 1.0 (100%)    | -          | ✓        |
| CAVE_WALL   | Infinity         | 0 (0%)        | -          | ✗        |
| CAVE_WATER  | 100.0            | 0.4 (40%)     | -          | ✗        |
| ANTHILL     | Infinity         | 0 (0%)        | -          | ✗        |

## Future Enhancements
- [ ] Add `player` entity class for manual control modifiers
- [ ] Add swimming mechanics (toggle water walkability per entity)
- [ ] Add tile damage (water hurts over time)
- [ ] Add footprint/trail effects based on tile type
- [ ] Add sound effects per tile type (splash in water, crunch on stone)
- [ ] Add stamina drain modifiers (stone drains stamina faster)
