# Level Integration Guide

Quick guide for integrating the Entity Spawning System into game scenes.

---

## Step 1: Import Required Classes

```typescript
import { SpawnManager } from '../managers/SpawnManager';
import { LevelLoader, LevelData } from '../managers/LevelLoader';
import { EventBus, GameEvents } from '../utils/eventBus';
```

---

## Step 2: Add Scene Properties

```typescript
export class GameScene implements IScene {
    private spawnManager: SpawnManager;
    private levelLoader: LevelLoader;
    private currentLevel: LevelData | null = null;
    
    // ... other properties
}
```

---

## Step 3: Initialize in enter()

### Option A: Load from JSON File

```typescript
enter(): void {
    // Get singletons
    this.spawnManager = SpawnManager.getInstance();
    this.levelLoader = LevelLoader.getInstance();
    
    // Initialize spawn manager
    this.spawnManager.initialize(
        this.renderer,
        (gridX, gridY) => this.tileGrid.getTileAt(gridX, gridY),
        (x, y, radius) => EntityManager.getInstance().getEntitiesInRadius(x, y, radius)
    );
    
    // Register sprites
    this.spawnManager.registerSprites({
        ants: new Map([
            [AntJobComponent.JOB_GATHERER, this.gathererSprite],
            [AntJobComponent.JOB_BUILDER, this.builderSprite],
            [AntJobComponent.JOB_WARRIOR, this.warriorSprite],
            [AntJobComponent.JOB_SCOUT, this.scoutSprite]
        ]),
        resources: new Map([
            ['food', this.foodSprite],
            ['wood', this.woodSprite],
            ['stone', this.stoneSprite],
            ['magicCrystal', this.crystalSprite]
        ]),
        boss: this.bossSprite,
        queen: this.queenSprite
    });
    
    // Load level from file
    this.levelLoader.loadLevel('assets/levels/tutorial.json')
        .then(levelData => {
            this.currentLevel = levelData;
            
            // Spawn everything
            const spawnResult = this.spawnManager.spawnLevel(
                levelData.spawnConfig,
                levelData.worldSeed
            );
            
            console.log('Level loaded:', levelData.metadata.name);
            console.log('Spawned:', spawnResult);
            
            // Emit level start event
            EventBus.emit(GameEvents.LEVEL_START);
        })
        .catch(error => {
            console.error('Failed to load level:', error);
            // Fallback to procedural generation
            this.loadProceduralLevel();
        });
}
```

### Option B: Generate Procedurally

```typescript
enter(): void {
    // Initialize spawn manager (same as above)
    // ...
    
    // Generate procedural level
    this.loadProceduralLevel();
}

private loadProceduralLevel(): void {
    const levelData = this.levelLoader.loadProceduralLevel({
        difficulty: 'medium',
        worldSize: { width: 200, height: 150 },
        resourceAbundance: 'normal',
        enemyDensity: 'medium',
        safeZoneDuration: 90,
        wavesEnabled: true
    }, Date.now());
    
    this.currentLevel = levelData;
    
    // Spawn everything
    const spawnResult = this.spawnManager.spawnLevel(
        levelData.spawnConfig,
        levelData.worldSeed
    );
    
    console.log('Generated level:', spawnResult);
    EventBus.emit(GameEvents.LEVEL_START);
}
```

---

## Step 4: Update Wave Spawning

```typescript
update(): void {
    const deltaTime = 1/60 * 1000; // 16.67ms for 60fps
    
    // Update wave spawning and safe zone
    this.spawnManager.update(deltaTime);
    
    // ... other update logic
}
```

---

## Step 5: Listen to Spawn Events

```typescript
enter(): void {
    // ... initialization
    
    // Listen for wave spawns
    const unsubWave = EventBus.on(GameEvents.ENEMY_SPAWN, (data: {
        type: 'nest' | 'wave',
        waveNumber?: number,
        antCount: number,
        hasBoss?: boolean,
        position: {x: number, y: number}
    }) => {
        if (data.type === 'wave') {
            console.log(`⚔️ Wave ${data.waveNumber} incoming!`);
            if (data.hasBoss) {
                console.log('🔥 BOSS WAVE!');
            }
            // Update UI, play sound, etc.
        }
    });
    
    // Listen for safe zone events
    const unsubSafeZone = EventBus.on(GameEvents.SAFE_ZONE_EXPIRED, () => {
        console.log('⚠️ Safe zone expired - enemies can spawn closer!');
        // Show warning UI
    });
    
    // Store for cleanup
    this.eventUnsubscribers.push(unsubWave, unsubSafeZone);
}
```

---

## Step 6: Cleanup on exit()

```typescript
exit(): void {
    // Destroy all spawned entities
    this.spawnManager.clearAllSpawns();
    
    // Clear loaded level
    this.levelLoader.clearLevel();
    
    // Unsubscribe from events
    this.eventUnsubscribers.forEach(unsub => unsub());
    this.eventUnsubscribers = [];
    
    console.log('Level cleanup complete');
}
```

---

## Complete Example: DevRoomScene Integration

```typescript
import { SpawnManager } from '../managers/SpawnManager';
import { LevelLoader } from '../managers/LevelLoader';
import { EntityManager } from '../managers/EntityManager';
import { EventBus, GameEvents } from '../utils/eventBus';
import { IScene } from './IScene';
import { Renderer } from '../rendering/Renderer';
import { TileGrid } from '../world/TileGrid';
import { AntJobComponent } from '../classes/components/AntJobComponent';

export class DevRoomScene implements IScene {
    private renderer: Renderer;
    private tileGrid: TileGrid;
    private spawnManager: SpawnManager;
    private levelLoader: LevelLoader;
    private eventUnsubscribers: Array<() => void> = [];
    
    // Sprites (preloaded in constructor)
    private antSprites: Map<number, any>;
    private resourceSprites: Map<string, any>;
    private bossSprite: any;
    private queenSprite: any;
    
    constructor(renderer: Renderer, tileGrid: TileGrid, sprites: any) {
        this.renderer = renderer;
        this.tileGrid = tileGrid;
        
        // Store preloaded sprites
        this.antSprites = sprites.ants;
        this.resourceSprites = sprites.resources;
        this.bossSprite = sprites.boss;
        this.queenSprite = sprites.queen;
    }
    
    enter(): void {
        console.log('[DevRoomScene] Entering...');
        
        // Initialize managers
        this.spawnManager = SpawnManager.getInstance();
        this.levelLoader = LevelLoader.getInstance();
        
        this.spawnManager.initialize(
            this.renderer,
            (gridX, gridY) => this.tileGrid.getTileAt(gridX, gridY),
            (x, y, r) => EntityManager.getInstance().getEntitiesInRadius(x, y, r)
        );
        
        this.spawnManager.registerSprites({
            ants: this.antSprites,
            resources: this.resourceSprites,
            boss: this.bossSprite,
            queen: this.queenSprite
        });
        
        // Listen for events
        this.setupEventListeners();
        
        // Load tutorial level
        this.levelLoader.loadLevel('assets/levels/tutorial.json')
            .then(levelData => {
                const result = this.spawnManager.spawnLevel(
                    levelData.spawnConfig,
                    levelData.worldSeed
                );
                
                console.log(`✅ Level loaded: ${levelData.metadata.name}`);
                console.log(`   Queen: ${result.queen ? 'spawned' : 'failed'}`);
                console.log(`   Ants: ${result.ants.length}`);
                console.log(`   Resources: ${result.resources.length}`);
                console.log(`   Enemies: ${result.enemies.bosses.length} bosses, ${result.enemies.ants.length} ants`);
                
                EventBus.emit(GameEvents.LEVEL_START);
            })
            .catch(err => {
                console.error('[DevRoomScene] Failed to load level:', err);
            });
    }
    
    update(): void {
        // Update wave spawning
        this.spawnManager.update(16.67); // ~60fps
    }
    
    exit(): void {
        console.log('[DevRoomScene] Exiting...');
        
        // Cleanup
        this.spawnManager.clearAllSpawns();
        this.levelLoader.clearLevel();
        this.eventUnsubscribers.forEach(unsub => unsub());
        this.eventUnsubscribers = [];
    }
    
    handleMouseClick(x: number, y: number): void {
        // Handle clicks
    }
    
    handleMouseMove(x: number, y: number): void {
        // Handle mouse movement
    }
    
    private setupEventListeners(): void {
        // Wave spawns
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.ENEMY_SPAWN, (data: any) => {
                if (data.type === 'wave') {
                    console.log(`⚔️ Wave ${data.waveNumber}: ${data.antCount} enemies${data.hasBoss ? ' + BOSS' : ''}`);
                }
            })
        );
        
        // Safe zone
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.SAFE_ZONE_EXPIRED, () => {
                console.log('⚠️ Safe zone expired!');
            })
        );
        
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.SAFE_ZONE_FULLY_CONTRACTED, () => {
                console.log('🔴 Safe zone fully contracted!');
            })
        );
    }
}
```

---

## Testing Checklist

After integration, verify:
- [ ] Queen spawns at configured position
- [ ] Starter ants spawn with correct job distribution
- [ ] Resource veins spawn following noise patterns
- [ ] Enemy nests spawn with bosses + guards
- [ ] Safe zone appears and contracts on timer
- [ ] Waves spawn at intervals with increasing difficulty
- [ ] Boss waves spawn at configured intervals
- [ ] Entity cleanup works on scene exit
- [ ] Events fire correctly (ENEMY_SPAWN, SAFE_ZONE_EXPIRED, etc.)

---

## Next Steps

1. **Integrate into DevRoomScene** - Add the spawning system to existing scene
2. **Test with all 3 level files** - Verify tutorial, standard, and survival levels
3. **Add UI feedback** - Show wave warnings, safe zone timers, resource counts
4. **Test procedural generation** - Verify different difficulty levels work
5. **Write unit tests** - Test LevelLoader validation, spawner methods, etc.
