# HealthBarComponent Integration Guide

## Overview
The `HealthBarComponent` is a visual health bar that displays above entities with health components. It automatically shows when health changes and fades out when at full health after a delay.

## Features
- **Automatic Display**: Shows when health is not at maximum
- **Event-Driven**: Listens to `ENTITY_DAMAGED` and `ENTITY_HEALED` events
- **Smart Visibility**: Displays for 3 seconds after any health change, then fades out over 0.5 seconds
- **Overheal Detection**: Shows even when attempting to heal at full health (useful for showing "already at max" feedback)
- **Color-Coded**: Green (60%+), Yellow (30-60%), Red (<30%)
- **Smooth Animation**: Health bar fill animates smoothly using lerp interpolation
- **Position Following**: Updates position each frame to follow entity

## Basic Usage

### Factory Integration (Recommended)
Add health bar creation to your entity factories:

```typescript
// Example: AntFactory.ts
import { HealthBarComponent } from '../rendering/components/HealthBarComponent';
import { RenderLayer } from '../rendering/RenderLayer';

export class AntFactory {
    static create(renderer: Renderer, sprite: any, gridX: number, gridY: number, factionId: string) {
        const ant = new Ant(gridX, gridY, factionId);
        const worldPos = gridToWorld(gridX, gridY);
        
        // Create sprite component
        const spriteComponent = new SpriteComponent(
            sprite, worldPos.x, worldPos.y, 
            RenderLayer.ENTITIES, worldPos.y
        );
        
        // Create health bar component
        const healthComp = ant.getComponent('Health') as HealthComponent;
        const healthBar = new HealthBarComponent(
            ant.id,
            worldPos.x,
            worldPos.y,
            healthComp.getCurrentHealth(),
            healthComp.getMaxHealth()
        );
        
        // Register both with renderer
        renderer.register(spriteComponent);
        const unregisterHealthBar = renderer.register(healthBar);
        
        // Update positions on entity movement
        EventBus.on('ENTITY_MOVED', (entity: GameObject) => {
            if (entity.id === ant.id) {
                const pos = gridToWorld(entity.gridX, entity.gridY);
                spriteComponent.setPosition(pos.x, pos.y);
                healthBar.setPosition(pos.x, pos.y); // Health bar follows entity
            }
        });
        
        // Cleanup on entity destruction
        EventBus.once('ENTITY_DIED', (entityId: string) => {
            if (entityId === ant.id) {
                unregisterHealthBar(); // Remove health bar from renderer
                healthBar.destroy(); // Clean up event listeners
            }
        });
        
        return ant;
    }
}
```

### Manual Creation
For testing or custom use cases:

```typescript
import { HealthBarComponent } from '../rendering/components/HealthBarComponent';
import { Renderer } from '../rendering/Renderer';

// Create health bar
const healthBar = new HealthBarComponent(
    'entity_123',  // Entity ID (for event filtering)
    400,           // X position (world coordinates)
    300,           // Y position (world coordinates)
    80,            // Current health
    100            // Max health
);

// Register with renderer (ABOVE_ENTITIES layer)
const unregister = renderer.register(healthBar);

// Update position each frame to follow entity
function update() {
    healthBar.setPosition(entity.x, entity.y);
}

// Update health manually (if not using HealthComponent events)
healthBar.updateHealth(currentHealth, maxHealth);

// Cleanup when entity is destroyed
unregister();
healthBar.destroy();
```

## Event Integration

The health bar automatically responds to these events:

### ENTITY_DAMAGED
Emitted by `HealthComponent.takeDamage()`:
```typescript
EventBus.emit('ENTITY_DAMAGED', entityId, damageAmount, newHealth);
```

### ENTITY_HEALED
Emitted by `HealthComponent.heal()`:
```typescript
EventBus.emit('ENTITY_HEALED', entityId, healAmount, newHealth);
```

### Example: Triggering Events
```typescript
// In your entity's HealthComponent
const healthComp = entity.getComponent('Health') as HealthComponent;

// Damage triggers health bar display
healthComp.takeDamage(20, 'attacker_id'); 
// -> Emits 'ENTITY_DAMAGED' -> Health bar shows

// Heal triggers health bar display
healthComp.heal(10);
// -> Emits 'ENTITY_HEALED' -> Health bar shows

// Overheal attempt (at max) still shows health bar briefly
healthComp.heal(50); // Already at 100/100
// -> Emits 'ENTITY_HEALED' -> Health bar shows for 3 seconds, then fades
```

## Customization

### Adjusting Display Duration
Edit constants in `HealthBarComponent.ts`:
```typescript
private readonly DISPLAY_DURATION: number = 3000; // 3 seconds
private readonly FADE_DURATION: number = 500;     // 0.5 second fade
```

### Adjusting Bar Size and Position
```typescript
private barWidth: number = 32;      // Bar width in pixels
private barHeight: number = 4;      // Bar height in pixels
private offsetY: number = -20;      // Pixels above entity
private borderThickness: number = 1; // Border thickness
```

### Adjusting Colors
Modify `getHealthColor()` method:
```typescript
private getHealthColor(): { r: number; g: number; b: number } {
    const healthPercent = this.currentHealth / this.maxHealth;
    
    if (healthPercent > 0.6) {
        return { r: 50, g: 200, b: 50 };  // Green
    } else if (healthPercent > 0.3) {
        return { r: 220, g: 200, b: 50 }; // Yellow
    } else {
        return { r: 220, g: 50, b: 50 };  // Red
    }
}
```

### Adjusting Animation Speed
```typescript
private readonly LERP_SPEED: number = 0.15; // 0.0-1.0 (higher = faster)
```

## Best Practices

1. **Create in Factories**: Always create health bars in entity factories alongside sprite components
2. **Position Updates**: Update health bar position every frame to follow entity movement
3. **Cleanup**: Always unregister from renderer and call `destroy()` when entity is destroyed
4. **Event Filtering**: Health bar filters events by entity ID, so multiple entities can share event listeners safely
5. **Layer Usage**: Health bar renders on `RenderLayer.ABOVE_ENTITIES` for proper z-ordering

## Debugging

### Health Bar Not Showing
- Check if entity ID matches between health bar and events
- Verify `ENTITY_DAMAGED` or `ENTITY_HEALED` events are being emitted
- Confirm health is below max (or changed recently)
- Check renderer registration: `renderer.register(healthBar)`

### Health Bar Position Wrong
- Ensure `setPosition()` is called every frame
- Verify world coordinates (not grid coordinates) are used
- Check `offsetY` value for vertical positioning

### Health Bar Not Fading
- Wait 3.5+ seconds after healing to full health
- Check console for errors in render loop
- Verify `Date.now()` is working (timer-based fading)

## Testing

Run tests with:
```bash
npm test -- --grep "HealthBarComponent"
```

Test coverage includes:
- Construction and initialization
- Position and depth sorting
- Health updates via events
- Visibility behavior (show/hide/fade)
- Rendering (colors, alpha, animation)
- Edge cases (zero health, overheal, negative values)
- Cleanup

## Example: Full Queen Integration

```typescript
// QueenFactory.ts
export class QueenFactory {
    static create(renderer: Renderer, sprite: any, gridX: number, gridY: number) {
        const queen = Queen.getInstance(gridX, gridY);
        const worldPos = gridToWorld(gridX, gridY);
        
        // Sprite
        const spriteComponent = new SpriteComponent(
            sprite, worldPos.x, worldPos.y,
            RenderLayer.ENTITIES, worldPos.y
        );
        
        // Health bar
        const healthComp = queen.getComponent('Health') as HealthComponent;
        const healthBar = new HealthBarComponent(
            queen.id,
            worldPos.x,
            worldPos.y,
            healthComp.getCurrentHealth(),
            healthComp.getMaxHealth()
        );
        
        renderer.register(spriteComponent);
        const unregisterHealthBar = renderer.register(healthBar);
        
        // Position tracking
        EventBus.on('ENTITY_MOVED', (entity: GameObject) => {
            if (entity.id === queen.id) {
                const pos = gridToWorld(entity.gridX, entity.gridY);
                spriteComponent.setPosition(pos.x, pos.y);
                healthBar.setPosition(pos.x, pos.y);
            }
        });
        
        // Cleanup (though Queen is singleton, good practice)
        EventBus.once('ENTITY_DIED', (entityId: string) => {
            if (entityId === queen.id) {
                unregisterHealthBar();
                healthBar.destroy();
            }
        });
        
        return queen;
    }
}
```

## See Also
- `HealthComponent.ts` - Health management component
- `PowerBarComponent.ts` - Similar UI component pattern
- `docs/codeExamples/FACTORY_PATTERN.md` - Factory integration patterns
- `docs/examples/EVENTBUS_EXAMPLES.md` - EventBus usage
