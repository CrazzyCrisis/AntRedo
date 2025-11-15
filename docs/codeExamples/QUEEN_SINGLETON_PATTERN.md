# Queen Singleton Pattern Documentation

## Overview
The Queen entity enforces a **per-faction singleton pattern** to ensure only one Queen exists per faction at any time. This is critical for game integrity as the Queen is the central command unit and player control hub.

## Why Singleton is Critical

### Game Design Constraints
1. **Player Control**: Only one Queen should have direct player input at a time
2. **Camera Tracking**: Camera follows Queen via `CAMERA_FOLLOW_ENTITY` - multiple Queens would break targeting
3. **Game Over Logic**: Queen death triggers game over - multiple Queens make win/loss conditions undefined
4. **Command Hierarchy**: Starter ants follow Queen as commander - duplicates create ambiguous structure
5. **Faction Leadership**: Queen represents the faction leader - multiple Queens per faction violates game design

## Implementation

### Singleton Enforcement
```typescript
export class QueenFactory {
    // Track one Queen per faction
    private static activeQueens: Map<string, Queen> = new Map();

    static create(
        renderer: Renderer,
        sprite: any,
        gridX: number,
        gridY: number,
        factionId: string
    ): Queen {
        // ENFORCE: Only one Queen per faction
        if (QueenFactory.activeQueens.has(factionId)) {
            throw new Error(`Queen already exists for faction '${factionId}'`);
        }

        // Create Queen model
        const queen = new Queen(gridX, gridY, factionId);

        // Track immediately after creation
        QueenFactory.activeQueens.set(factionId, queen);

        // ... rendering setup ...

        return queen;
    }
}
```

### Automatic Cleanup
The singleton pattern automatically removes Queens from tracking on death or destruction:

```typescript
// Death listener - removes Queen from tracking
const diedListener = (entityId: string, entityType: string) => {
    if (entityId === queen.id && entityType === 'queen') {
        QueenFactory.activeQueens.delete(factionId); // Auto-cleanup
        unregisterSprite();
        EventBus.off('ENTITY_DIED', diedListener);
        EventBus.off('ENTITY_DESTROYED', destroyListener);
        EventBus.off('ENTITY_MOVED', moveListener);
    }
};

// Destroy listener - also removes Queen
const destroyListener = (entityId: string, entityType: string) => {
    if (entityId === queen.id && entityType === 'queen') {
        QueenFactory.activeQueens.delete(factionId); // Auto-cleanup
        unregisterSprite();
        EventBus.off('ENTITY_DIED', diedListener);
        EventBus.off('ENTITY_DESTROYED', destroyListener);
        EventBus.off('ENTITY_MOVED', moveListener);
    }
};

// Manual cleanup - also removes Queen
(queen as any)._cleanup = () => {
    QueenFactory.activeQueens.delete(factionId); // Auto-cleanup
    unregisterSprite();
    EventBus.off('ENTITY_DIED', diedListener);
    EventBus.off('ENTITY_DESTROYED', destroyListener);
    EventBus.off('ENTITY_MOVED', moveListener);
};
```

### Query API
Helper methods for checking and retrieving Queens:

```typescript
/**
 * Get the active Queen for a faction
 * @returns Queen instance or undefined if none exists
 */
static getQueen(factionId: string): Queen | undefined {
    return QueenFactory.activeQueens.get(factionId);
}

/**
 * Check if a faction has an active Queen
 */
static hasQueen(factionId: string): boolean {
    return QueenFactory.activeQueens.has(factionId);
}

/**
 * Get all active Queens across all factions
 */
static getAllQueens(): Queen[] {
    return Array.from(QueenFactory.activeQueens.values());
}

/**
 * Clear all tracked Queens (for testing/reset)
 */
static clearAll(): void {
    QueenFactory.activeQueens.clear();
}
```

## Usage Examples

### Creating a Queen (Per-Faction)
```typescript
// Create Queen for player faction - OK
const playerQueen = QueenFactory.create(renderer, sprite, 10, 10, 'player');

// Create Queen for enemy faction - OK (different faction)
const enemyQueen = QueenFactory.create(renderer, sprite, 50, 50, 'enemy');

// Try to create second Queen for player faction - THROWS ERROR
const duplicate = QueenFactory.create(renderer, sprite, 20, 20, 'player');
// Error: Queen already exists for faction 'player'
```

### Querying Active Queens
```typescript
// Check if player has Queen
if (QueenFactory.hasQueen('player')) {
    console.log('Player Queen exists');
}

// Get specific Queen
const queen = QueenFactory.getQueen('player');
if (queen) {
    queen.usePower('fireball', targetX, targetY);
}

// Get all Queens
const allQueens = QueenFactory.getAllQueens();
console.log(`Active Queens: ${allQueens.length}`);
```

### Respawning After Death
```typescript
// Queen dies (automatically removed from tracking)
playerQueen.destroy();

// Can now create new Queen for same faction
const respawnedQueen = QueenFactory.create(renderer, sprite, 15, 15, 'player');
```

## Testing Considerations

### Test Isolation
Tests must clear singleton state between test cases to prevent pollution:

```typescript
describe('QueenFactory', () => {
    afterEach(() => {
        EventBus.clear();
        QueenFactory.clearAll(); // CRITICAL: Clear singleton state
    });

    it('should enforce singleton pattern', () => {
        QueenFactory.create(renderer, sprite, 0, 0, 'player');

        // Should throw error on duplicate
        expect(() => {
            QueenFactory.create(renderer, sprite, 10, 10, 'player');
        }).to.throw('Queen already exists for faction \'player\'');
    });
});
```

### Key Test Cases
1. **Duplicate Creation**: Verify error thrown when creating second Queen for same faction
2. **Multi-Faction**: Verify multiple factions can each have one Queen
3. **Death Cleanup**: Verify Queen removed from tracking on death
4. **Destroy Cleanup**: Verify Queen removed from tracking on destroy
5. **Respawn**: Verify new Queen can be created after previous one dies
6. **Query Methods**: Verify `getQueen()`, `hasQueen()`, `getAllQueens()` work correctly

## Design Rationale

### Per-Faction vs Global Singleton
The pattern uses **per-faction enforcement** rather than a global singleton to support:
- Multi-faction gameplay (player vs enemy factions, each with one Queen)
- Future multiplayer scenarios (each player faction has one Queen)
- Campaign progression (different factions in different levels)

### Error on Duplicate vs Silent Failure
The factory **throws an error** rather than silently returning existing Queen because:
- **Debugging**: Makes accidental duplicate attempts immediately visible
- **Intent Clarity**: Forces developers to explicitly check existence before creation
- **No Ambiguity**: Caller knows exactly what happened (error vs success)

### Automatic Cleanup vs Manual Tracking
The pattern uses **event-driven automatic cleanup** rather than manual removal because:
- **Safety**: Can't forget to remove Queen from tracking
- **Consistency**: All cleanup paths (death, destroy, manual) handled uniformly
- **Decoupling**: Queen destruction doesn't need to know about factory tracking

## Test Coverage

**Total Tests**: 34
- Factory Creation: 5 tests (position, faction, components, events)
- Rendering Integration: 10 tests (sprite registration, updates, cleanup)
- Singleton Pattern: 11 tests (enforcement, queries, cleanup, respawn)
- Component Integration: 3 tests (all components present)
- Multiple Factions: 3 tests (independent Queens)
- Edge Cases: 4 tests (boundaries, empty faction)

**All 34 tests passing** ✅

## Integration Points

### EntityManager
Queens are registered with EntityManager for spatial queries and collision detection.

### Renderer
Queen sprites are registered on `RenderLayer.ENTITIES` with automatic depth sorting.

### Camera System
Queen emits `CAMERA_FOLLOW_ENTITY` event on creation for camera tracking.

### EventBus
Key events:
- `QUEEN_POWER_USED` - Power activated
- `QUEEN_COMMAND_ISSUED` - Ants commanded
- `CAMERA_FOLLOW_ENTITY` - Camera should follow
- `QUEEN_DEATH` - Queen died (game over)

## Future Considerations

### Respawn Mechanics
If game design requires Queen respawn after death:
```typescript
// Check if Queen exists before respawn
if (!QueenFactory.hasQueen('player')) {
    const respawnQueen = QueenFactory.create(
        renderer, sprite, 
        respawnX, respawnY, 
        'player'
    );
}
```

### Faction Management
When destroying a faction entirely, clear its Queen:
```typescript
function destroyFaction(factionId: string) {
    const queen = QueenFactory.getQueen(factionId);
    if (queen) {
        queen.destroy(); // Automatically removes from tracking
    }
    // ... destroy other faction entities ...
}
```

### Save/Load System
When saving game state, track Queen faction IDs:
```typescript
function saveGame() {
    const queens = QueenFactory.getAllQueens();
    const saveData = {
        queens: queens.map(q => ({
            factionId: q.getFactionId(),
            gridX: q.gridX,
            gridY: q.gridY,
            health: q.getComponent('Health').health,
            powers: q.getPowers()
        }))
    };
    return saveData;
}

function loadGame(saveData) {
    QueenFactory.clearAll(); // Clear existing Queens
    saveData.queens.forEach(queenData => {
        const queen = QueenFactory.create(
            renderer, sprite,
            queenData.gridX, queenData.gridY,
            queenData.factionId
        );
        // Restore health, powers, etc.
    });
}
```
