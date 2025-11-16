# Generic Status Bar System Usage Guide

## Overview
The `StatusBarComponent` is a generic, configurable status bar system that can display any type of entity stat (health, hunger, oxygen, stamina, shield, mana, etc.) with color-coded thresholds and configurable events.

## Architecture

### Configuration-Driven Design
All status bar colors, events, and visual settings are defined in `src/config/statusBarConfig.ts`:

```typescript
export const STATUS_BAR_CONFIGS: Record<string, StatusBarConfig> = {
    health: {
        colors: [
            { threshold: 0.6, color: { r: 50, g: 200, b: 50 } },   // Green (60%+)
            { threshold: 0.3, color: { r: 220, g: 200, b: 50 } },  // Yellow (30-60%)
            { threshold: 0.0, color: { r: 220, g: 50, b: 50 } }    // Red (<30%)
        ],
        events: {
            damaged: 'ENTITY_DAMAGED',
            healed: 'ENTITY_HEALED'
        }
    },
    hunger: { /* ... */ },
    oxygen: { /* ... */ },
    // Add more bar types as needed
};
```

## Basic Usage

### 1. Using Helper Functions (Recommended)

The easiest way to add status bars to entities is using the helper functions:

```typescript
import { setupHealthBarBinding, setupHungerBarBinding } from '../utils/helpers';

// In your factory:
export class AntFactory {
    static create(renderer: Renderer, sprite: any, gridX: number, gridY: number) {
        const ant = new Ant(gridX, gridY);
        
        // Setup sprite
        const spriteComponent = new SpriteComponent(sprite, worldX, worldY);
        setupEntitySpriteBinding(ant, spriteComponent, renderer, RenderLayer.ENTITIES, gridToWorld);
        
        // Setup health bar (automatic)
        setupHealthBarBinding(ant, renderer, RenderLayer.ABOVE_ENTITIES);
        
        // Setup hunger bar (if ant has HungerComponent)
        setupHungerBarBinding(ant, renderer, RenderLayer.ABOVE_ENTITIES);
        
        return ant;
    }
}
```

**Available Helper Functions:**
- `setupHealthBarBinding(entity, renderer, layer)` - For HealthComponent
- `setupHungerBarBinding(entity, renderer, layer)` - For HungerComponent
- `setupOxygenBarBinding(entity, renderer, layer)` - For OxygenComponent
- `setupStaminaBarBinding(entity, renderer, layer)` - For StaminaComponent

### 2. Generic Setup (Advanced)

For custom bar types or non-standard component names:

```typescript
import { setupStatusBarBinding } from '../utils/helpers';

// Generic setup
setupStatusBarBinding(
    entity,           // Entity with component
    renderer,         // Renderer instance
    layer,            // RenderLayer (typically ABOVE_ENTITIES)
    'mana',           // Bar type (must match key in STATUS_BAR_CONFIGS)
    'Mana',           // Component name to read from
    40,               // Optional: custom width
    5,                // Optional: custom height
    -25               // Optional: custom Y offset
);
```

### 3. Manual Setup (Maximum Control)

For complete control over the status bar:

```typescript
import { StatusBarComponent } from '../rendering/components/StatusBarComponent';

const healthBar = new StatusBarComponent(
    entity.id,        // Entity ID for event filtering
    worldX,           // Initial X position
    worldY,           // Initial Y position
    'health',         // Bar type (config key)
    100,              // Max value
    32,               // Optional: custom width
    4,                // Optional: custom height
    -20               // Optional: custom Y offset
);

// Update value manually
healthBar.updateValue(currentHealth, maxHealth);

// Update position each frame
healthBar.setPosition(newX, newY);

// Register with renderer
const unregister = renderer.register(healthBar);

// Cleanup when done
healthBar.destroy();
unregister();
```

## Adding New Bar Types

### 1. Define Configuration

Add your new bar type to `src/config/statusBarConfig.ts`:

```typescript
export const STATUS_BAR_CONFIGS: Record<string, StatusBarConfig> = {
    // ... existing configs
    
    energy: {
        colors: [
            { threshold: 0.7, color: { r: 255, g: 255, b: 100 } }, // Bright yellow (70%+)
            { threshold: 0.4, color: { r: 255, g: 180, b: 50 } },  // Orange (40-70%)
            { threshold: 0.0, color: { r: 200, g: 100, b: 50 } }   // Dark orange (<40%)
        ],
        events: {
            damaged: 'ENTITY_ENERGY_DEPLETED',
            healed: 'ENTITY_ENERGY_RESTORED'
        },
        visual: {
            offsetY: -35  // Position above other bars
        }
    }
};
```

### 2. Create Helper Function (Optional)

Add a convenience helper to `src/utils/helpers.ts`:

```typescript
/**
 * Setup energy bar binding for an entity
 * @param entity - Entity with EnergyComponent
 * @param renderer - Renderer instance
 * @param layer - RenderLayer (typically ABOVE_ENTITIES)
 * @returns StatusBarComponent instance
 */
export function setupEnergyBarBinding(
    entity: any,
    renderer: any,
    layer: any
): any {
    return setupStatusBarBinding(entity, renderer, layer, 'energy', 'Energy');
}
```

### 3. Export from Factory Imports

Add to `src/imports/factoryImports.ts`:

```typescript
export { 
    setupEntitySpriteBinding, 
    setupHealthBarBinding, 
    setupStatusBarBinding,
    setupHungerBarBinding,
    setupOxygenBarBinding,
    setupStaminaBarBinding,
    setupEnergyBarBinding,  // New helper
    // ... other exports
} from '../utils/helpers';
```

### 4. Use in Factories

```typescript
import { setupEnergyBarBinding } from '../imports/factoryImports';

// In factory create method:
setupEnergyBarBinding(entity, renderer, RenderLayer.ABOVE_ENTITIES);
```

## Features

### Automatic Behavior
- **Visibility:** Shows when value < max or recently changed
- **Fade-out:** Fades after 3 seconds at full value
- **Smooth animation:** Lerps between values for smooth transitions
- **Event-driven:** Listens to configured events automatically
- **Position tracking:** Follows entity movement via EventBus
- **Depth sorting:** Automatically updates depth for proper rendering
- **Auto-cleanup:** Removes on entity destruction

### Visual Customization
All visual settings can be customized per bar type in config:

```typescript
visual: {
    width: 32,           // Bar width in pixels
    height: 4,           // Bar height in pixels
    offsetY: -20,        // Vertical offset from entity (negative = above)
    borderThickness: 1   // Border thickness in pixels
}
```

### Color Thresholds
Colors are automatically interpolated based on value percentage:

```typescript
colors: [
    { threshold: 0.8, color: { r: 0, g: 255, b: 0 } },    // Green (80%+)
    { threshold: 0.5, color: { r: 255, g: 255, b: 0 } },  // Yellow (50-80%)
    { threshold: 0.2, color: { r: 255, g: 128, b: 0 } },  // Orange (20-50%)
    { threshold: 0.0, color: { r: 255, g: 0, b: 0 } }     // Red (<20%)
]
```

## Component Requirements

For helper functions to work, your component must have one of these method sets:

**Option 1: Health-style methods**
```typescript
class HealthComponent {
    getCurrentHealth(): number { /* ... */ }
    getMaxHealth(): number { /* ... */ }
}
```

**Option 2: Generic getCurrent/getMax**
```typescript
class HungerComponent {
    getCurrent(): number { /* ... */ }
    getMax(): number { /* ... */ }
}
```

**Option 3: Generic getValue/getMaxValue**
```typescript
class StaminaComponent {
    getValue(): number { /* ... */ }
    getMaxValue(): number { /* ... */ }
}
```

## Multiple Bars Per Entity

Entities can have multiple status bars with different offsets:

```typescript
// Health bar at default offset (-20)
setupHealthBarBinding(ant, renderer, RenderLayer.ABOVE_ENTITIES);

// Hunger bar above health bar (-25)
setupHungerBarBinding(ant, renderer, RenderLayer.ABOVE_ENTITIES);

// Oxygen bar above hunger bar (-30)
setupOxygenBarBinding(ant, renderer, RenderLayer.ABOVE_ENTITIES);
```

Each bar type has a default offset configured in `statusBarConfig.ts`.

## Best Practices

1. **Use helper functions** - They handle all setup, events, and cleanup automatically
2. **Configure in config file** - Never hardcode colors or thresholds in code
3. **Match event names** - Ensure your components emit the events defined in config
4. **Test with different values** - Verify color thresholds appear correctly
5. **Consider stacking** - Use offsetY to prevent bars from overlapping

## Examples

### Multiple Bars on Boss
```typescript
export class BossFactory {
    static create(renderer: Renderer, gridX: number, gridY: number) {
        const boss = new Boss(gridX, gridY);
        
        // Sprite setup
        setupEntitySpriteBinding(boss, spriteComponent, renderer, RenderLayer.ENTITIES, gridToWorld);
        
        // Health bar (main status)
        setupHealthBarBinding(boss, renderer, RenderLayer.ABOVE_ENTITIES);
        
        // Shield bar (secondary status, positioned lower)
        setupStatusBarBinding(boss, renderer, RenderLayer.ABOVE_ENTITIES, 'shield', 'Shield');
        
        return boss;
    }
}
```

### Custom Color Scheme
```typescript
// In statusBarConfig.ts
poison: {
    colors: [
        { threshold: 0.5, color: { r: 50, g: 255, b: 50 } },    // Bright green (safe)
        { threshold: 0.3, color: { r: 150, g: 255, b: 50 } },   // Yellow-green (warning)
        { threshold: 0.0, color: { r: 200, g: 50, b: 200 } }    // Purple (toxic!)
    ],
    events: {
        damaged: 'ENTITY_POISONED',
        healed: 'ENTITY_POISON_CURED'
    }
}
```

## Migration from HealthBarComponent

Old code (health-specific):
```typescript
const healthBar = new HealthBarComponent(entity.id, x, y, currentHealth, maxHealth);
```

New code (generic):
```typescript
const healthBar = new StatusBarComponent(entity.id, x, y, 'health', maxHealth);
healthBar.updateValue(currentHealth, maxHealth);
```

Or use helper (recommended):
```typescript
setupHealthBarBinding(entity, renderer, RenderLayer.ABOVE_ENTITIES);
```
