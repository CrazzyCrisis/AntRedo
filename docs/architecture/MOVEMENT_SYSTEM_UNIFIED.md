# Movement System Architecture - Unified Design

## Problem Statement

**CONFLICT:** We have TWO movement systems fighting each other:
1. **GameObject smooth movement** - Pixel-based interpolation with snapping (Queen uses this)
2. **PathfindingComponent lerp** - Tile-to-tile linear interpolation (Ants/Boss would use this)

## Solution: Unified Movement System

### Design Decision

**GameObject smooth movement should be the ONLY system moving entities.**

PathfindingComponent should:
- Calculate paths (A* pathfinding)
- Provide next waypoint
- Track progress
- **NOT directly move the entity**

GameObject should:
- Handle all actual position updates
- Use `requestMove()` to move toward PathfindingComponent's next waypoint
- Maintain smooth interpolation and snapping behavior

## Implementation

### PathfindingComponent Role
```typescript
// PathfindingComponent tells GameObject WHERE to move
update(deltaTime: number): void {
    if (!this.hasPath()) return;
    
    const nextNode = this.currentPath[this.pathIndex];
    
    // Tell GameObject to move toward waypoint (doesn't directly move)
    const reached = this.owner.moveTowardTile(nextNode.col, nextNode.row, deltaTime);
    
    if (reached) {
        this.advanceToNextWaypoint();
    }
}
```

### GameObject Role
```typescript
// GameObject handles HOW to move (smooth interpolation)
public moveTowardTile(targetGridX: number, targetGridY: number, deltaTime: number): boolean {
    // Use existing smooth movement system
    // Returns true when tile reached
    if (this.gridX === targetGridX && this.gridY === targetGridY) {
        return true;
    }
    
    // Request move in direction of target
    const dx = Math.sign(targetGridX - this.gridX);
    const dy = Math.sign(targetGridY - this.gridY);
    
    this.requestMove(dx, dy);
    this.processMovement(deltaTime);
    
    return false;
}
```

## Benefits

1. **No conflict** - One system controls position
2. **Consistent behavior** - All entities use same smooth movement
3. **Easy collision** - Check before `requestMove()` accepts movement
4. **Reusable** - Queen's manual control and AI pathfinding use same system

## Progressive Pathfinding

**Start moving immediately, refine path asynchronously:**

```typescript
// Immediate: Move toward goal in straight line
entity.moveTowardTile(goalX, goalY);

// Background: Calculate optimal A* path
PathfindingManager.findPathAsync(startX, startY, goalX, goalY, (path) => {
    if (path) {
        pathfindingComponent.setPath(path); // Refine movement
    }
});
```

## Collision Avoidance

**Before accepting movement:**
```typescript
public requestMove(dx: number, dy: number): void {
    const nextX = this.gridX + dx;
    const nextY = this.gridY + dy;
    
    // Check if tile is walkable
    if (!PathfindingManager.getInstance().isWalkable(nextX, nextY)) {
        return;
    }
    
    // Check if tile is occupied by another ant
    const occupied = EntityManager.getInstance().getTileOccupant(nextX, nextY);
    if (occupied && occupied.type === 'ant') {
        // Collision! Don't move
        this.isWaitingForClearPath = true;
        return;
    }
    
    // Accept movement
    this.targetMoveX = dx;
    this.targetMoveY = dy;
}
```

## Tile Occupancy Tracking

**EntityManager tracks which ant is on which tile:**
```typescript
class EntityManager {
    private tileOccupants: Map<string, GameObject> = new Map();
    
    private getTileKey(gridX: number, gridY: number): string {
        return `${gridX},${gridY}`;
    }
    
    public registerTileOccupant(entity: GameObject): void {
        const key = this.getTileKey(entity.gridX, entity.gridY);
        this.tileOccupants.set(key, entity);
    }
    
    public getTileOccupant(gridX: number, gridY: number): GameObject | null {
        const key = this.getTileKey(gridX, gridY);
        return this.tileOccupants.get(key) || null;
    }
}
```

## Building Tile Blocking

**Buildings use PathfindingManager as single source of truth:**

```typescript
// When building placed
EventBus.emit('BUILDING_PLACED', buildingId, tiles);

// PathfindingManager listens
PathfindingManager.markBlocked(tiles);

// When building destroyed
EventBus.emit('BUILDING_DESTROYED', buildingId, tiles);
PathfindingManager.markWalkable(tiles);
```

**TileSystem provides INITIAL walkability** (water, walls), PathfindingManager handles DYNAMIC walkability (buildings, blocked areas).
