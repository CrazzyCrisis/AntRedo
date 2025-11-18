# Combat Visual Effects System

**File:** `src/managers/CombatVisualHandler.ts`  
**Status:** ✅ Implemented  
**Dependencies:** CombatManager, EntityManager, AudioManager, Camera (for shake)

## Overview

The `CombatVisualHandler` provides visual and audio feedback for the combat system. It listens to combat events from `CombatManager` and triggers:
- **Sprite offset animations** (charge pullback, lunge forward)
- **Camera shake** (queen damage only)
- **Combat sounds** (proximity-based to queen)
- **Particle effects** (impact particles)

## Architecture

### Event Flow
```
CombatManager → EventBus → CombatVisualHandler → Visual Systems
                                ↓
                    COMBAT_CHARGE_START (charge back animation)
                    COMBAT_LUNGE_START (lunge forward animation)
                    COMBAT_LUNGE_END (return to position)
                    ENTITY_ATTACKED (impact effects)
                                ↓
                    SPRITE_OFFSET_CHANGED → SpriteComponent
                    PARTICLE_SPAWN → ParticleSystem
                    CAMERA_SHAKE → Camera
                    play() → AudioManager
```

### Combat Animation Sequence
1. **Charge Phase** (150ms)
   - Sprite pulls back 0.25 tiles away from target
   - `SPRITE_OFFSET_CHANGED` event emitted
   
2. **Lunge Phase** (150ms)
   - Sprite rushes forward 0.5 tiles toward target
   - `SPRITE_OFFSET_CHANGED` event emitted
   - "whoosh" sound plays (if queen nearby)
   
3. **Impact Phase** (instant)
   - Damage applied by CombatManager
   - `ENTITY_ATTACKED` event emitted
   - Visual handler triggers:
     - Impact particles
     - Impact sound (if queen nearby)
     - Camera shake (if target is queen)
   
4. **Return Phase** (100ms)
   - Sprite returns to original position (0, 0 offset)
   - `SPRITE_OFFSET_CHANGED` event emitted

## Configuration

```typescript
// src/managers/CombatVisualHandler.ts
private readonly CHARGE_DISTANCE = 0.25;  // Tiles to pull back
private readonly LUNGE_DISTANCE = 0.5;    // Tiles to lunge forward
private readonly AUDIO_RANGE = 15;        // Grid units - queen hears within range
private readonly CAMERA_SHAKE_INTENSITY = 8; // Pixels
private readonly CAMERA_SHAKE_DURATION = 200; // ms
```

## Events System

### Input Events (from CombatManager)
```typescript
// Phase 1: Charge start
GameEvents.COMBAT_CHARGE_START
// (attackerId: string, targetId: string)

// Phase 2: Lunge start  
GameEvents.COMBAT_LUNGE_START
// (attackerId: string, targetId: string)

// Phase 3: Return to position
GameEvents.COMBAT_LUNGE_END
// (attackerId: string)

// Impact: Damage applied
GameEvents.ENTITY_ATTACKED
// (attackerId: string, targetId: string, damage: number)
```

### Output Events (to visual systems)
```typescript
// Sprite position offset
GameEvents.SPRITE_OFFSET_CHANGED
// (entityId: string, offsetX: number, offsetY: number)

// Particle effect spawn
GameEvents.PARTICLE_SPAWN
// (effectType: string, x: number, y: number, options: object)

// Camera shake
GameEvents.CAMERA_SHAKE
// (intensity: number, duration: number)
```

## Proximity-Based Audio

**Design:** Combat sounds only play if queen is within `AUDIO_RANGE` (15 tiles)

**Benefits:**
- Reduces audio clutter in large battles
- Focuses player attention on nearby threats
- Simulates realistic hearing range

**Implementation:**
```typescript
private playProximitySoundEffect(soundId: string, x: number, y: number): void {
    // Find player queen
    const playerQueen = allEntities.find(e => 
        e.type === 'queen' && e.factionId === 'player'
    );
    
    // Check distance
    const dist = distance(playerQueen.gridX, playerQueen.gridY, x, y);
    
    if (dist <= this.AUDIO_RANGE) {
        this.audioManager.play(soundId);
    }
}
```

**Sound IDs Required:**
- `combat_whoosh` - Lunge phase
- `combat_impact` - Damage phase

## Camera Shake (Queen Only)

**Design:** Camera shake only triggers when **queen takes damage**, not other units

**Rationale:**
- Emphasizes queen's importance
- Alerts player to critical damage
- Avoids shake fatigue from many ants fighting

**Implementation:**
```typescript
private handleImpact(targetId: string, damage: number): void {
    const target = this.entityManager.getEntity(targetId);
    
    // Camera shake ONLY if target is queen
    if (target.type === 'queen') {
        EventBus.emit(
            GameEvents.CAMERA_SHAKE, 
            this.CAMERA_SHAKE_INTENSITY,  // 8 pixels
            this.CAMERA_SHAKE_DURATION    // 200ms
        );
    }
}
```

## Particle Effects

**Spawned on all impacts:**
```typescript
EventBus.emit(GameEvents.PARTICLE_SPAWN, 'combat_impact', x, y, {
    count: Math.min(damage, 10), // More particles = more damage
    color: [220, 50, 50],        // Red particles
    velocity: 2,
    lifetime: 500                // 500ms duration
});
```

**Required Particle System:**
- Must listen to `GameEvents.PARTICLE_SPAWN`
- Should support configurable count, color, velocity, lifetime

## Sprite Offset Integration

**SpriteComponent Integration Pattern:**
```typescript
// In SpriteComponent.ts
constructor() {
    // Subscribe to offset changes
    EventBus.on(GameEvents.SPRITE_OFFSET_CHANGED, 
        (entityId: string, offsetX: number, offsetY: number) => {
            if (entityId === this.entityId) {
                this.offsetX = offsetX;
                this.offsetY = offsetY;
            }
        }
    );
}

render(p: any): void {
    const worldPos = gridToWorld(entity.gridX, entity.gridY);
    
    // Apply offset to world position
    const renderX = worldPos.x + (this.offsetX * TILE_SIZE);
    const renderY = worldPos.y + (this.offsetY * TILE_SIZE);
    
    p.image(this.sprite, renderX, renderY);
}
```

## Initialization

**Add to game initialization (DevRoomScene or main game scene):**
```typescript
// In scene enter() or game setup
const combatVisualHandler = CombatVisualHandler.getInstance();

// Update loop (to cleanup expired offsets)
function update() {
    combatVisualHandler.update();
}
```

**Note:** Handler automatically subscribes to events on instantiation.

## Testing Scenarios

### 1. Combat Animation Flow
```typescript
// Setup: Two enemy ants close together
const ant1 = AntFactory.create(5, 5, 'player');
const ant2 = AntFactory.create(6, 5, 'enemy');

// Trigger combat via CombatManager
// Expected:
// 1. Ant1 sprite pulls back (0.25 tiles west)
// 2. Whoosh sound plays (if queen within 15 tiles)
// 3. Ant1 sprite lunges forward (0.5 tiles east)
// 4. Impact particles spawn at ant2 position
// 5. Impact sound plays (if queen within 15 tiles)
// 6. Ant1 sprite returns to original position
// 7. No camera shake (ant2 is not queen)
```

### 2. Queen Damage Camera Shake
```typescript
// Setup: Enemy ant attacks player queen
const queen = QueenFactory.create(10, 10, 'player');
const enemy = AntFactory.create(11, 10, 'enemy');

// Trigger combat
// Expected:
// 1. All combat animations play
// 2. Camera shakes when queen takes damage (8px, 200ms)
// 3. Impact sound and particles
```

### 3. Proximity Audio Range
```typescript
// Setup: Combat 20 tiles from queen (outside AUDIO_RANGE)
const queen = QueenFactory.create(0, 0, 'player');
const ant1 = AntFactory.create(20, 0, 'player');
const ant2 = AntFactory.create(21, 0, 'enemy');

// Trigger combat between ant1 and ant2
// Expected:
// 1. Combat animations play normally
// 2. NO sounds (distance > 15 tiles)
// 3. Particles visible (visuals not proximity-limited)

// Move queen closer (10 tiles)
queen.moveTo(10, 0);

// Trigger combat again
// Expected:
// 1. Sounds now play (distance < 15 tiles)
```

### 4. Multiple Simultaneous Combats
```typescript
// Setup: 3 pairs fighting at once
// Combat A: Near queen (5 tiles)
// Combat B: Mid range (12 tiles)
// Combat C: Far (18 tiles)

// Expected:
// - All animations play independently
// - Only A and B sounds audible
// - All particles visible
// - No camera shake unless queen damaged
```

## Performance Considerations

### Offset Tracking
- `activeOffsets` Map tracks sprite positions
- Automatically cleaned up after duration expires
- `update()` method prunes stale offsets every frame

### Audio Optimization
- Distance check prevents playing distant sounds
- Reduces AudioManager load in large battles
- Uses single queen position (O(1) lookup after initial find)

### Event Efficiency
- Single event per animation phase (not per-frame)
- SpriteComponents update offsets on event, not polling
- Particle spawn is one-time emission, not continuous

## Future Enhancements

### Distance-Based Volume Scaling
```typescript
// TODO: Add to AudioManager
const volumeMultiplier = 1.0 - (dist / AUDIO_RANGE) * 0.7;
audioManager.play(soundId, volumeMultiplier);
```

### Animation Interpolation
```typescript
// TODO: Smooth lerp between offset positions
private interpolateOffset(current: Vec2, target: Vec2, alpha: number): Vec2 {
    return {
        x: lerp(current.x, target.x, alpha),
        y: lerp(current.y, target.y, alpha)
    };
}
```

### Multi-Phase Attacks
```typescript
// TODO: Support multi-hit combos
COMBAT_HIT_1, COMBAT_HIT_2, COMBAT_HIT_3
// Different offsets per phase
```

### Team-Specific Particles
```typescript
// TODO: Color particles by faction
const color = target.factionId === 'player' 
    ? [50, 50, 220]  // Blue for friendly
    : [220, 50, 50]; // Red for enemy
```

## Integration Checklist

- [x] CombatVisualHandler singleton created
- [x] Event listeners setup (COMBAT_CHARGE_START, COMBAT_LUNGE_START, COMBAT_LUNGE_END, ENTITY_ATTACKED)
- [x] Sprite offset calculations (charge/lunge/return)
- [x] Proximity audio system (15 tile range)
- [x] Camera shake (queen only)
- [x] Particle effect emissions
- [x] Initialize in game scene (DevRoomScene.enter())
- [x] SpriteComponent listens to SPRITE_OFFSET_CHANGED
- [x] ParticleSystem listens to PARTICLE_SPAWN
- [x] Camera listens to CAMERA_SHAKE
- [ ] Add combat sound assets (combat_whoosh, combat_impact) - **USER TO COMPLETE**
- [ ] Test all combat scenarios
- [ ] Verify audio range with queen position

## Related Documentation
- `docs/examples/COMBAT_SYSTEM_USAGE.md` - Core combat mechanics
- `docs/codeExamples/RENDERING_ARCHITECTURE.md` - Sprite rendering
- `docs/architecture/AUDIO_SYSTEM.md` - Audio architecture
