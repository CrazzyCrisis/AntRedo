# Visual Effects System Usage Guide

## Overview
The visual effects system provides damage numbers, flash effects, and floating text that render on the `VISUAL_EFFECTS` layer (above entities, below UI).

## Quick Start

### 1. Initialize Visual Effects Manager

```typescript
// In sketch.ts setup() or scene initialization
import { VisualEffectsManager } from './managers/VisualEffectsManager';

const vfxManager = VisualEffectsManager.getInstance();
vfxManager.setRenderer(renderer);

// In draw() loop
vfxManager.update();
```

### 2. Show Damage/Healing (Easy Way - via Helpers)

```typescript
import { showDamage, showHealing } from './utils/visualEffectsHelpers';

// Show damage
showDamage('entity_123', 25, worldX, worldY, false); // 25 damage
showDamage('entity_456', 50, worldX, worldY, true);  // 50 critical damage

// Show healing
showHealing('entity_789', 15, worldX, worldY); // +15 healing
```

### 3. Show Effects (via EventBus)

```typescript
import { EventBus, GameEvents } from './utils/eventBus';

// Damage with flash effect
EventBus.emit(GameEvents.ENTITY_DAMAGE, entityId, 30, x, y, false);

// Critical hit
EventBus.emit(GameEvents.ENTITY_DAMAGE, entityId, 60, x, y, true);

// Healing
EventBus.emit(GameEvents.ENTITY_HEALED, entityId, 20, x, y);

// Death effect
EventBus.emit(GameEvents.ENTITY_DIED, entityId, x, y);
```

### 4. Manual Effect Spawning

```typescript
import { VisualEffectsManager } from './managers/VisualEffectsManager';
import { DAMAGE_NUMBER_CONFIG } from './config/visualEffectsConfig';

const vfxManager = VisualEffectsManager.getInstance();

// Manual damage number
vfxManager.showDamageNumber(
    x, y, 
    -45, // Negative for damage
    DAMAGE_NUMBER_CONFIG.colors.magical, // Purple magical damage
    false // Not critical
);

// Manual flash effect
vfxManager.showFlash(
    x, y,
    'damage', // Flash type: 'damage', 'heal', 'critical', 'powerup', 'death'
    16, // Width
    16, // Height
    -8, // Offset X (for centering)
    -8  // Offset Y (for centering)
);
```

## Configuration Presets

All visual effect parameters are defined in `src/config/visualEffectsConfig.ts`:

### Damage Number Colors
```typescript
DAMAGE_NUMBER_CONFIG.colors = {
    physical: '#FF4444',    // Red
    magical: '#8844FF',     // Purple
    healing: '#44FF44',     // Green
    critical: '#FFAA00',    // Orange
    poison: '#88FF44',      // Lime
    fire: '#FF8800'         // Orange-red
}
```

### Flash Effect Types
```typescript
FLASH_EFFECT_CONFIG = {
    damage: { color: '#FF0000', duration: 200ms, intensity: 0.7, pulses: 2 },
    heal: { color: '#00FF00', duration: 300ms, intensity: 0.5, pulses: 1 },
    critical: { color: '#FFFF00', duration: 250ms, intensity: 0.9, pulses: 3 },
    powerup: { color: '#00FFFF', duration: 400ms, intensity: 0.6, pulses: 2 },
    death: { color: '#880000', duration: 500ms, intensity: 1.0, pulses: 1 }
}
```

### Easy Presets
```typescript
import { VFX_PRESETS } from './config/visualEffectsConfig';

// Use predefined presets
VFX_PRESETS.DAMAGE_PHYSICAL
VFX_PRESETS.DAMAGE_MAGICAL
VFX_PRESETS.DAMAGE_CRITICAL
VFX_PRESETS.HEALING
VFX_PRESETS.FLASH_DAMAGE
VFX_PRESETS.FLASH_HEAL
// ... etc
```

## Integration with Combat System

```typescript
// In CombatComponent or similar
dealDamage(target: GameObject, amount: number, isCritical: boolean = false): void {
    const health = target.getComponent('Health') as HealthComponent;
    if (health) {
        health.takeDamage(amount);
        
        // Show visual effect
        const pos = gridToWorldCenter(target.gridX, target.gridY, TILE_SIZE);
        showDamage(target.id, amount, pos.x, pos.y, isCritical);
    }
}
```

## Customizing Effects

Edit `src/config/visualEffectsConfig.ts` to change:
- Font sizes and weights
- Colors for different damage types
- Animation durations and speeds
- Float distances
- Fade timings
- Flash intensities and pulse counts
- Random offset ranges

All changes take effect immediately on next build - no code changes needed!

## Performance Notes

- Effects auto-cleanup when finished
- Use `vfxManager.clearAllEffects()` to force cleanup
- Each effect is lightweight (just position + timer)
- Effects render on dedicated `VISUAL_EFFECTS` layer
- No impact on entity rendering performance
