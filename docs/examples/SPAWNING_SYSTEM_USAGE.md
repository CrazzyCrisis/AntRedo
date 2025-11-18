# Entity Spawning System - Usage Guide

Complete guide for using the entity spawning system to create levels.

---

## Quick Start

### 1. Initialize SpawnManager

```typescript
import { SpawnManager } from './managers/SpawnManager';
import { Renderer } from './rendering/Renderer';
import { DEFAULT_SPAWN_CONFIG } from './config/spawnConfig';

// Get singleton instance
const spawnManager = SpawnManager.getInstance();

// Initialize with renderer and helper functions
spawnManager.initialize(
    renderer,
    (gridX, gridY) => tileGrid.getTileAt(gridX, gridY), // getTileAt
    (x, y, radius) => EntityManager.getInstance().getEntitiesInRadius(x, y, radius) // getEntitiesInRadius
);

// Register sprites
spawnManager.registerSprites({
    ants: new Map([
        [AntJobComponent.JOB_GATHERER, gathererSprite],
        [AntJobComponent.JOB_BUILDER, builderSprite],
        [AntJobComponent.JOB_WARRIOR, warriorSprite],
        [AntJobComponent.JOB_SCOUT, scoutSprite]
    ]),
    resources: new Map([
        ['food', foodSprite],
        ['wood', woodSprite],
        ['stone', stoneSprite],
        ['magicCrystal', crystalSprite]
    ]),
    boss: bossSprite,
    queen: queenSprite
});
```

### 2. Spawn Level

```typescript
// Use default config or custom config
const spawnResult = spawnManager.spawnLevel(
    DEFAULT_SPAWN_CONFIG,
    Date.now() // World seed
);

console.log('Spawned:', spawnResult);
// {
//     queen: Queen,
//     ants: Ant[],
//     resources: Resource[],
//     enemies: { bosses: Boss[], ants: Ant[] }
// }
```

### 3. Update (in game loop)

```typescript
function update(deltaTime: number) {
    // Update wave spawning and safe zone
    spawnManager.update(deltaTime);
}
```

### 4. Cleanup

```typescript
function exitLevel() {
    // Destroy all spawned entities
    spawnManager.clearAllSpawns();
}
```

---

## Custom Spawn Configuration

### Basic Level Config

```typescript
import { SpawnConfig } from './config/spawnConfig';

const customLevel: SpawnConfig = {
    // Queen spawn
    queen: {
        position: { x: 50, y: 50 },
        factionId: 'player'
    },
    
    // Starter ants
    starterAnts: {
        builders: 3,
        gatherers: 5,
        scouts: 2
    },
    
    // Resource veins
    resourceVeins: [
        {
            bounds: { x: 10, y: 10, width: 80, height: 80 },
            resourceType: 'food',
            noiseLayer: 'resources',
            threshold: { min: 0.6, max: 1.0 },
            density: 0.3 // 30% spawn probability
        },
        {
            bounds: { x: 10, y: 10, width: 80, height: 80 },
            resourceType: 'wood',
            noiseLayer: 'resources',
            threshold: { min: 0.3, max: 0.6 },
            density: 0.2
        }
    ],
    
    // Enemy nests
    enemyNests: [
        {
            center: { x: 80, y: 80 },
            bossType: 'scorpion',
            antCount: 5,
            factionId: 'enemy'
        }
    ],
    
    // Safe zone
    safeZone: {
        center: { x: 50, y: 50 },
        radius: 20,
        duration: 60 // 60 seconds before contraction
    },
    
    // Noise layers
    noiseLayers: {
        resources: { scale: 0.05, seed: 12345 },
        enemies: { scale: 0.08, seed: 54321 },
        decorations: { scale: 0.1, seed: 99999 }
    },
    
    // Enemy waves (optional)
    waves: {
        enabled: true,
        baseDelay: 30,             // 30 seconds between waves
        baseAntCount: 5,            // Start with 5 ants
        antCountMultiplier: 1.2,    // Increase by 20% each wave
        bossInterval: 5             // Boss every 5 waves
    }
};

// Spawn with custom config
const result = spawnManager.spawnLevel(customLevel, 42);
```

---

## Advanced Spawning Patterns

### 1. Procedural Resource Veins

```typescript
// Resources follow Perlin noise patterns for natural veins
resourceVeins: [
    {
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        resourceType: 'magicCrystal',
        noiseLayer: 'resources',
        threshold: { min: 0.8, max: 1.0 }, // Only spawn in high-noise areas
        density: 0.15 // Rare resource
    }
]
```

### 2. Multiple Enemy Nests

```typescript
enemyNests: [
    {
        center: { x: 20, y: 20 },
        bossType: 'scorpion',
        antCount: 3,
        factionId: 'enemy',
        patrolPath: [ // Optional patrol route
            { x: 20, y: 20 },
            { x: 30, y: 20 },
            { x: 30, y: 30 },
            { x: 20, y: 30 }
        ]
    },
    {
        center: { x: 80, y: 80 },
        bossType: 'spider',
        antCount: 5,
        factionId: 'enemy'
    }
]
```

### 3. Safe Zone Configuration

```typescript
safeZone: {
    center: { x: 50, y: 50 },
    radius: 30,
    duration: -1 // -1 = permanent (never expires)
}

// OR shrinking safe zone
safeZone: {
    center: { x: 50, y: 50 },
    radius: 30,
    duration: 120 // Starts shrinking after 2 minutes
}
```

### 4. Wave Spawning

```typescript
waves: {
    enabled: true,
    baseDelay: 20,            // First wave at 20 seconds
    baseAntCount: 3,          // Start small
    antCountMultiplier: 1.5,  // Aggressive scaling (50% increase)
    bossInterval: 3           // Boss every 3 waves
}
// Wave 1: 3 ants at 20s
// Wave 2: 4 ants at 40s
// Wave 3: 6 ants + BOSS at 60s
// Wave 4: 9 ants at 80s
// Wave 5: 13 ants at 100s
// Wave 6: 19 ants + BOSS at 120s
```

---

## Querying Spawned Entities

### Entity Counts

```typescript
const antCount = spawnManager.getEntityCount('ants');
const resourceCount = spawnManager.getEntityCount('resources');
const bossCount = spawnManager.getEntityCount('bosses');

console.log(`Ants: ${antCount}, Resources: ${resourceCount}, Bosses: ${bossCount}`);
```

### Faction Queries

```typescript
// Get all player ants
const playerAnts = spawnManager.getEntitiesByFaction('player');

// Get all enemy ants
const enemyAnts = spawnManager.getEntitiesByFaction('enemy');
```

### Safe Zone Access

```typescript
const safeZone = spawnManager.getSafeZone();

if (safeZone) {
    const isInSafeZone = safeZone.isPositionSafe(x, y);
    const distanceToEdge = safeZone.getDistanceToEdge(x, y);
    const remainingTime = safeZone.getRemainingTime();
    
    console.log(`Safe zone: ${remainingTime}ms remaining`);
}
```

---

## Event Listeners

### Spawn Events

```typescript
import { EventBus, GameEvents } from './utils/eventBus';

// Listen for level start
EventBus.on(GameEvents.LEVEL_START, () => {
    console.log('Level spawning complete!');
});

// Listen for enemy waves
EventBus.on(GameEvents.ENEMY_SPAWN, (data: {
    type: 'nest' | 'wave',
    waveNumber?: number,
    antCount: number,
    hasBoss?: boolean,
    position: {x: number, y: number}
}) => {
    if (data.type === 'wave') {
        console.log(`Wave ${data.waveNumber} spawned: ${data.antCount} ants, boss: ${data.hasBoss}`);
    }
});

// Listen for safe zone events
EventBus.on(GameEvents.SAFE_ZONE_EXPIRED, (x: number, y: number) => {
    console.log('Safe zone timer expired! Starting contraction...');
});

EventBus.on(GameEvents.SAFE_ZONE_FULLY_CONTRACTED, (x: number, y: number) => {
    console.log('Safe zone fully contracted - enemies can spawn anywhere!');
});
```

---

## Scene Integration Example

```typescript
export class GameScene implements IScene {
    private spawnManager: SpawnManager;
    private levelData: SpawnConfig;
    
    enter(): void {
        // Initialize spawn manager
        this.spawnManager = SpawnManager.getInstance();
        this.spawnManager.initialize(
            this.renderer,
            (x, y) => this.tileGrid.getTileAt(x, y),
            (x, y, r) => EntityManager.getInstance().getEntitiesInRadius(x, y, r)
        );
        
        // Register sprites
        this.spawnManager.registerSprites({
            ants: this.antSprites,
            resources: this.resourceSprites,
            boss: this.bossSprite,
            queen: this.queenSprite
        });
        
        // Load level config
        this.levelData = DEFAULT_SPAWN_CONFIG; // Or load from file
        
        // Spawn everything
        const spawnResult = this.spawnManager.spawnLevel(
            this.levelData,
            Date.now()
        );
        
        console.log('Level ready:', spawnResult);
    }
    
    update(): void {
        // Update wave spawning
        this.spawnManager.update(1/60 * 1000); // deltaTime in ms
    }
    
    exit(): void {
        // Cleanup
        this.spawnManager.clearAllSpawns();
    }
}
```

---

## Tips & Best Practices

### 1. Noise Layer Configuration
- **Resources:** `scale: 0.05` (large veins)
- **Enemies:** `scale: 0.08` (medium clusters)
- **Decorations:** `scale: 0.1` (fine detail)

### 2. Safe Zone Sizing
- **Easy:** 30+ tile radius
- **Medium:** 20-25 tile radius
- **Hard:** 15 tile radius

### 3. Wave Difficulty
- **Easy:** `antCountMultiplier: 1.2`, `bossInterval: 7`
- **Medium:** `antCountMultiplier: 1.5`, `bossInterval: 5`
- **Hard:** `antCountMultiplier: 2.0`, `bossInterval: 3`

### 4. Resource Density
- **Abundant:** `density: 0.5`
- **Normal:** `density: 0.3`
- **Scarce:** `density: 0.15`

### 5. Performance
- Large levels (200x200+): Use lower density values
- Small levels (<100x100): Higher density is fine
- Limit enemy nests to 5-10 per level

---

## Troubleshooting

### "No entities spawning"
- Verify `initialize()` called before `spawnLevel()`
- Check sprites are registered with `registerSprites()`
- Ensure tile grid provides valid tile types

### "Enemies spawning inside safe zone"
- Check safe zone radius covers spawn area
- Verify enemy nest centers are outside safe zone
- Safe zone position should match queen position

### "Resources not forming veins"
- Check noise layer initialized: `noiseLayers.resources`
- Adjust threshold values (0-1 range)
- Increase density for more resources

### "Waves not spawning"
- Verify `waves.enabled = true`
- Call `spawnManager.update(deltaTime)` every frame
- Check console for spawn position warnings
