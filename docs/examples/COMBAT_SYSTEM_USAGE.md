# Combat System - Melee Attack with Visual Feedback

## Overview
Automatic melee combat system for ants with visual attack animations. When ants from different factions come within sight of each other, they automatically engage in combat with charge-up and lunge animations.

## Architecture

### CombatManager (NEW)
**Location:** `src/managers/CombatManager.ts`

**Responsibilities:**
- Listens for `ENTITY_DETECTED` events from VisionComponent
- Checks if detected entities are enemies (different factions)
- Initiates melee attack sequences with visual feedback
- Manages attack timing and cooldowns
- Prevents duplicate simultaneous attacks

**Combat Sequence (400ms total):**
1. **Charge (150ms)** - Entity pulls back slightly → Emits `COMBAT_CHARGE_START`
2. **Lunge (150ms)** - Entity rushes forward rapidly → Emits `COMBAT_LUNGE_START`  
3. **Impact** - Damage is dealt → Emits `ENTITY_ATTACKED`
4. **Return (100ms)** - Entity returns to tile → Emits `COMBAT_LUNGE_END`

###Events (Added to eventBus.ts)
```typescript
COMBAT_CHARGE_START: 'combat:charge:start'  // (attackerId, targetId, originX, originY)
COMBAT_LUNGE_START: 'combat:lunge:start'    // (attackerId, targetId, targetX, targetY)
COMBAT_LUNGE_END: 'combat:lunge:end'        // (attackerId, originX, originY)
```

## Integration with Existing Systems

### Leverages Existing Components
- **VisionComponent** - Already detects nearby entities, emits `ENTITY_DETECTED`
- **CombatComponent** - Already handles damage, cooldowns, range checks
- **HealthComponent** - Already handles damage application
- **FactionManager** - Already determines enemies with `isEnemy()`
- **Animation System** - 'attack' animations already defined in `animationConfig.ts`

### Flow
```
1. Ant A detects Ant B (VisionComponent)
   ↓ ENTITY_DETECTED event
2. CombatManager checks if enemies (FactionManager)
   ↓ If enemies & in range
3. CombatManager initiates attack sequence
   ↓ Visual events emitted
4. Visual handlers apply sprite offsets (charge/lunge)
   ↓ After lunge timing
5. CombatComponent.attack() deals damage
   ↓ ENTITY_ATTACKED event
6. HealthComponent.takeDamage() applies damage
   ↓ May emit ENTITY_DAMAGED, ENTITY_DIED
7. Visual returns to original position
```

## Visual Implementation (TODO - Hook for Animation Team)

The combat events are emitted and ready for visual integration. To add visual feedback:

### Option 1: Sprite Offset Component
Create a component that listens to combat events and applies temporary offsets to SpriteComponents:

```typescript
// Pseudocode - not implemented yet
EventBus.on(GameEvents.COMBAT_CHARGE_START, (attackerId, targetId, originX, originY) => {
    const sprite = getSpriteForEntity(attackerId);
    // Pull back 0.2 tiles in opposite direction from target
    sprite.setOffset(-dx * 0.2, -dy * 0.2);
});

EventBus.on(GameEvents.COMBAT_LUNGE_START, (attackerId, targetId, targetX, targetY) => {
    const sprite = getSpriteForEntity(attackerId);
    // Lunge 0.5 tiles toward target
    sprite.setOffset(dx * 0.5, dy * 0.5);
});

EventBus.on(GameEvents.COMBAT_LUNGE_END, (attackerId, originX, originY) => {
    const sprite = getSpriteForEntity(attackerId);
    // Return to original position
    sprite.setOffset(0, 0);
});
```

### Option 2: Animation State Triggers
Trigger 'attack' animation from animationConfig.ts:

```typescript
EventBus.on(GameEvents.COMBAT_CHARGE_START, (attackerId) => {
    const animComp = getAnimationComponent(attackerId);
    animComp.playAnimation('attack', false); // Play once, don't loop
});
```

## Usage

### Automatic Combat
Combat happens automatically when:
1. Both entities are ants (`type === 'ant'`)
2. Both have CombatComponents attached
3. Entities are from different factions
4. Entities are within VisionComponent range
5. Entities are within CombatComponent attack range

### Enable/Disable
```typescript
// Enable (default - starts automatically)
const combatManager = CombatManager.getInstance();

// Disable all combat
combatManager.cleanup();

// Check if entity in combat
if (combatManager.isInCombat(antId)) {
    console.log('Ant is fighting!');
}
```

### Configuration
Combat parameters configured in existing systems:

**Vision Range** (when ants detect each other):
```typescript
// In Ant.ts constructor
const vision = new VisionComponent(8, 360); // 8 tile range, 360° (circle)
```

**Attack Range** (distance for melee):
```typescript
// In Ant.ts constructor
const combat = new CombatComponent(10, 2.5, 1000); // damage:10, range:2.5, cooldown:1000ms
```

**Attack Damage** and **Cooldown**: Same CombatComponent parameters

## Testing

### Manual Test Scenario
1. Create two ants from different factions
2. Place them within 8 tiles of each other (vision range)
3. Ensure they're within 2.5 tiles (attack range)
4. Observe combat events in console

```typescript
// In DevRoomScene or test scene
const playerAnt = AntFactory.create(renderer, sprite, 10, 10, 'player');
const enemyAnt = AntFactory.create(renderer, sprite, 12, 10, 'enemy');

// Listen for combat events
EventBus.on(GameEvents.COMBAT_CHARGE_START, (attackerId, targetId) => {
    console.log(`${attackerId} charging at ${targetId}!`);
});

EventBus.on(GameEvents.ENTITY_ATTACKED, (attackerId, targetId, damage) => {
    console.log(`${attackerId} hit ${targetId} for ${damage} damage!`);
});
```

### Unit Tests (TODO)
```typescript
// test/unit/combatManager.test.ts
describe('CombatManager', () => {
    it('should initiate combat when enemies detected', () => {
        // Test event flow
    });
    
    it('should not attack friendlies', () => {
        // Test faction check
    });
    
    it('should respect attack cooldown', () => {
        // Test rapid attacks prevented
    });
    
    it('should cleanup on entity destroyed', () => {
        // Test combat tracking cleanup
    });
});
```

## Performance Considerations

- **Combat tracking:** Uses Set for O(1) lookup of active combats
- **Event-driven:** No polling, reacts only to detection events
- **Cooldown enforcement:** Prevents spam attacks
- **Automatic cleanup:** Removes combats when entities die or lose vision

## Visual Effects System

**See:** `docs/examples/COMBAT_VISUAL_EFFECTS.md` for complete documentation

The `CombatVisualHandler` provides visual and audio feedback for combat:
- **Sprite animations:** Charge pullback (0.25 tiles) → Lunge forward (0.5 tiles) → Return
- **Camera shake:** Queen damage only (8px intensity, 200ms duration)
- **Combat sounds:** Proximity-based (15 tile range from queen)
- **Particle effects:** Impact particles on all hits (damage-scaled)

**Integration:**
```typescript
// In game scene initialization (DevRoomScene.enter() or equivalent)
const combatVisualHandler = CombatVisualHandler.getInstance();

// In update loop
combatVisualHandler.update();
```

**Events Emitted:**
- `SPRITE_OFFSET_CHANGED` → SpriteComponent applies position offset
- `PARTICLE_SPAWN` → ParticleSystem spawns particles
- `CAMERA_SHAKE` → Camera applies shake effect

## Future Enhancements

- **Knockback** - Push enemies back on hit (use `COMBAT_KNOCKBACK_APPLIED` event)
- **Stun/Stagger** - Brief movement lockout after being hit
- **Critical hits** - Random chance for extra damage
- **Attack animations** - Integrate with existing 'attack' animation in animationConfig
- **Distance-based volume** - Scale sound volume based on proximity
- **Multiple attackers** - Handle 2v1, 3v1 scenarios
- **Ranged attacks** - Extend system for projectiles (Boss already has this)
- **Team-specific particles** - Color particles by faction

## Files Modified/Created

**Created:**
- `src/managers/CombatManager.ts` - Combat AI and sequencing
- `src/managers/CombatVisualHandler.ts` - Visual/audio feedback for combat

**Modified:**
- `src/utils/eventBus.ts` - Added 6 new combat events (3 sequencing + 3 visual)

**Integration Points (Remaining):**
- [ ] Initialize CombatVisualHandler in game scene
- [ ] SpriteComponent listens to SPRITE_OFFSET_CHANGED
- [ ] ParticleSystem listens to PARTICLE_SPAWN
- [ ] Camera listens to CAMERA_SHAKE
- [ ] Add combat sound assets (combat_whoosh, combat_impact)
- Particle effects on hit

## Notes

- Ants must have `factionId` property for enemy detection
- Boss and Queen could use similar system (just check `type !== 'ant'` condition)
- Visual implementation is separate from logic - events are ready for rendering team
- Combat respects existing cooldowns from CombatComponent
- Vision detection is handled by existing VisionComponent update calls
