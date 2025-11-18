# Entity Spawning System Checklist

Complete implementation guide for the universal entity spawning system that works across all levels.

---

## Phase 1: Core Spawning Infrastructure

### Task 1.1: SpawnConfig Interface
- [x] Create `src/config/spawnConfig.ts`
  - [x] Define `SpawnConfig` interface (full level spawn configuration)
  - [x] Define `QueenSpawnConfig` (position, faction)
  - [x] Define `AntClusterConfig` (center, count, radius, faction, jobDistribution)
  - [x] Define `ResourceVeinConfig` (bounds, type, noiseLayer, threshold, density)
  - [x] Define `EnemyNestConfig` (center, patrolPath, bossType, antCount, faction)
  - [x] Define `DecorationConfig` (bounds, type, density, tileTypes)
  - [x] Define `SafeZoneConfig` (center, radius, duration)
  - [x] Define `SpawnConstraints` interface (tileTypes, minDistance, noiseThreshold)
  - [x] Define `NoiseLayers` interface (resources, enemies, decorations - each with scale and seed)
  - [x] Create `DEFAULT_SPAWN_CONFIG` constant
  - [ ] **TEST:** Interface validation, default config completeness

### Task 1.2: SpawnRule System
- [x] Create `src/spawning/SpawnRule.ts`
  - [x] Interface `SpawnRule` (entityType, probability, clustering, constraints)
  - [x] Enum `ClusterType` ('single', 'small', 'medium', 'large', 'radial', 'poisson', 'noise')
  - [x] Interface `SpawnConstraints` with validation methods
  - [x] Method `canSpawnAt(x, y, tileGrid, entityManager, noiseGen): boolean`
  - [x] Tile type validation (ants: dirt/grass/sand, resources: no water, decorations: tile-specific)
  - [x] Minimum distance validation from other entities
  - [x] Perlin noise threshold validation
  - [ ] **TEST:** Constraint validation for all entity types

### Task 1.3: LevelData Interface
- [x] Create `src/world/LevelData.ts`
  - [x] Interface `LevelData` (name, worldSize, worldGenConfig, spawnConfig, noiseLayers)
  - [x] Method `save(filePath: string): void` - Export to JSON
  - [x] Method `load(filePath: string): LevelData` - Import from JSON
  - [x] Method `validate(): boolean` - Check data integrity
  - [x] Support for procedural generation (seed-based)
  - [x] Support for level editor created data (handmade spawn points)
  - [ ] **TEST:** Save/load round trip, validation checks

---

## Phase 2: Spawning Algorithms

### Task 2.1: ClusterSpawner
- [x] Create `src/spawning/ClusterSpawner.ts`
  - [x] Method `spawnRadialCluster(center, count, radius, validator): Point[]`
    - Spawn entities in circle around center point
    - Use random angle + distance for natural variation
    - Validate each position with constraints
  - [x] Method `spawnPoissonDisk(bounds, minDistance, maxAttempts): Point[]`
    - Even distribution for resources/decorations
    - Ensures minimum distance between spawns
    - Natural-looking scattered placement
  - [x] Method `spawnNoiseCluster(bounds, noiseGen, threshold, density): Point[]`
    - Follow Perlin noise patterns (veins, features)
    - Sample noise at each position
    - Spawn where noise in threshold range
  - [x] Method `spawnGridFormation(center, rows, cols, spacing): Point[]`
    - Structured formations (enemy patrols)
    - Aligned grid with offset variation
  - [x] Method `spawnLineFormation(start, end, count): Point[]`
    - Entities along a line path
  - [ ] **TEST:** All cluster algorithms, constraint validation, distribution quality

### Task 2.2: NoiseLayerManager
- [x] Create `src/spawning/NoiseLayerManager.ts`
  - [x] Manage multiple Perlin noise generators (resources, enemies, decorations)
  - [x] Property `noiseLayers: Map<string, PerlinNoise>`
  - [x] Method `createLayer(name, scale, seed?): void`
  - [x] Method `getLayer(name): PerlinNoise`
  - [x] Method `sampleAt(layerName, x, y): number` - Get normalized noise value
  - [x] Method `clearLayers(): void`
  - [x] Method `initializeFromConfig(config): void` - Auto-setup default layers
  - [x] Default layers: 'resources', 'enemies', 'decorations'
  - [ ] **TEST:** Layer creation, sampling, isolation between layers

### Task 2.3: SafeZone System
- [x] Create `src/spawning/SafeZone.ts`
  - [x] Class `SafeZone` (center, radius, active, timer)
  - [x] Method `isPositionSafe(x, y): boolean` - Check if position is safe
  - [x] Method `update(deltaTime): void` - Timer countdown + radius contraction
  - [x] Method `expandRadius(amount): void` - Grow safe zone over time
  - [x] Method `deactivate(): void` - Remove safe zone
  - [x] Method `getDistanceToEdge(x, y): number` - Distance calculations
  - [x] EventBus emit `SAFE_ZONE_EXPIRED` when timer runs out
  - [x] EventBus emit `SAFE_ZONE_FULLY_CONTRACTED` when radius reaches 0
  - [ ] **TEST:** Boundary detection, timer expiration, expansion

---

## Phase 3: Entity Spawners

### Task 3.1: AntSpawner
- [x] Create `src/spawning/AntSpawner.ts`
  - [x] Constructor takes `Renderer`, `getTileAt`, `getEntitiesInRadius`
  - [x] Method `registerSprite(jobType, sprite)` - Register ant sprites
  - [x] Method `spawnStarterAnts(queenPos, config): AntSpawnResult`
    - Extract job counts from config.jobDistribution
    - Spawn in radial cluster around Queen using ClusterSpawner
    - Validate spawn positions (dirt/grass/sand only)
    - Uses AntFactory.create() for each ant
    - Returns ants, positions, jobCounts
  - [x] Method `spawnAntCluster(center, count, radius, faction, jobDistribution): AntSpawnResult`
    - Spawn N ants in cluster using Poisson disk
    - Apply job distribution (e.g., {gatherer: 0.5, warrior: 0.3, builder: 0.2})
    - Shuffle job types for variety
    - Return array of created ants with positions
  - [x] Method `spawnEnemyAnts(nestCenter, count, radius, faction): AntSpawnResult`
    - Spawn enemy ants around nest/boss using radial cluster
    - Default to warrior job (aggressive)
    - Uses AntFactory for creation
  - [ ] **TEST:** Starter ants, job distribution, constraint validation

### Task 3.2: ResourceSpawner
- [x] Create `src/spawning/ResourceSpawner.ts`
  - [x] Constructor takes `Renderer`, `getTileAt`, `getEntitiesInRadius`
  - [x] Method `setNoiseManager(manager)` - Set noise layer manager
  - [x] Method `registerSprite(resourceType, sprite)` - Register resource sprites
  - [x] Method `spawnResourceVein(bounds, config, noiseLayer): ResourceSpawnResult`
    - Sample Perlin noise across bounds
    - Spawn where noise in threshold range
    - Validate no water tiles using SpawnRuleValidator
    - Create veins/clusters following noise
    - Density controls spawn probability (0-1)
    - Uses ResourceFactory.create()
  - [x] Method `spawnResourceCluster(center, type, radius, amountPerNode): ResourceSpawnResult`
    - Spawn resources in cluster using Poisson disk
    - Even distribution for resources
  - [x] Track spawned resources for depletion (no respawn)
  - [ ] **TEST:** Noise-based veins, clustering, constraint validation

### Task 3.3: DecorationSpawner
- [ ] Create `src/spawning/DecorationSpawner.ts`
  - [ ] Constructor takes `DecorationFactory`, `TileGrid`, `NoiseLayerManager`
  - [ ] Method `spawnDecorations(bounds, type, density, tileTypes): Decoration[]`
    - Tile-specific decorations (grass on grass, rocks on stone, etc.)
    - Use Poisson disk for natural scattering
    - Density controls spawn probability
    - Validate tile type constraints
  - [ ] Method `spawnDecorationCluster(center, type, count, radius, tileTypes): Decoration[]`
    - Spawn decorations in cluster
  - [ ] **TEST:** Tile-specific spawning, density control, distribution

### Task 3.4: EnemySpawner
- [x] Create `src/spawning/EnemySpawner.ts`
  - [x] Constructor takes `Renderer`, `AntSpawner`, `getTileAt`, `getEntitiesInRadius`
  - [x] Method `setSafeZone(safeZone)` - Set safe zone for validation
  - [x] Method `registerBossSprite(sprite)` - Register boss sprite
  - [x] Method `spawnEnemyNest(config): EnemyNestResult`
    - Check nest center outside safe zone
    - Spawn Boss at nest center with patrol path using BossFactory
    - Spawn enemy ants in cluster around boss via AntSpawner
    - Returns {boss, ants, nestCenter}
  - [x] Method `canSpawnEnemy(x, y): boolean`
    - Check position outside safe zone
    - Validate tile type (dirt/grass/sand) using SpawnRuleValidator
    - Check minimum distance from player entities
  - [x] Method `spawnWave(waveConfig): WaveSpawnResult`
    - Find spawn position outside safe zone
    - Spawn enemies in waves (increasing difficulty)
    - Spawn boss if waveConfig.hasBoss
    - Emit `ENEMY_SPAWN` event
  - [x] Method `getDistanceFromSafeZone(x, y): number` - Distance helper
  - [ ] **TEST:** Safe zone validation, wave spawning, nest creation

---

## Phase 4: Spawn Manager

### Task 4.1: SpawnManager (Core Controller)
- [x] Create `src/managers/SpawnManager.ts` singleton
  - [x] Constructor takes `Renderer`, spawner dependencies
  - [x] Method `initialize(renderer, getTileAt, getEntitiesInRadius)` - Setup spawners
  - [x] Method `registerSprites(sprites)` - Register all entity sprites
  - [x] Method `spawnLevel(config, worldSeed): SpawnResult`
    - Initialize noise layers from seed
    - Create safe zone
    - Spawn Queen at configured position
    - Spawn starter ants around Queen (converted from config format)
    - Spawn resource veins (all configured veins)
    - Spawn enemy nests (all configured nests)
    - Setup wave spawning system (generate waves from config)
    - Return all spawned entities
  - [x] Method `update(deltaTime)` - Handle wave timers and safe zone
  - [x] Method `spawnNextWave()`
    - Increment wave number
    - Spawn enemies outside safe zone
    - Increase difficulty (more ants, add boss)
    - Emit `ENEMY_SPAWN` event
  - [x] Method `clearAllSpawns(): void` - Remove all spawned entities
  - [x] Method `getEntityCount(category): number` - Entity counting
  - [x] Method `getSafeZone(): SafeZone` - Access safe zone
  - [ ] **TEST:** Full spawn sequence, wave spawning, safe zone integration

### Task 4.2: Entity Tracking
- [x] Add to SpawnManager
  - [x] Property `trackedEntities` with Maps for each category
  - [x] Method `trackAnts(ants)` - Track spawned ants
  - [x] Method `trackResources(resources)` - Track spawned resources
  - [x] Method `trackBoss(boss)` - Track spawned boss
  - [x] Listen to `ENTITY_DESTROYED` event for automatic untracking
  - [x] Method `getEntityCount(category): number`
  - [x] Method `getEntitiesByFaction(factionId): Ant[]`
  - [ ] **TEST:** Registration, unregistration, queries
- [ ] Create `src/managers/SpawnManager.ts` singleton
  - [ ] Properties:
    - `spawnConfig: SpawnConfig`
    - `noiseLayerManager: NoiseLayerManager`
    - `safeZone: SafeZone | null`
    - `spawnedEntities: Map<string, GameObject[]>` (track all spawns)
    - `waveTimer: number` (for enemy waves)
    - `currentWave: number`
  - [ ] Method `initialize(levelData: LevelData, factories): void`
    - Load spawn config from level data
    - Create noise layers
    - Initialize spawners with factories
  - [ ] Method `spawnLevel(): void` - Execute full spawn sequence
    - Step 1: Spawn Queen at configured position
    - Step 2: Spawn starter ants around Queen (3 builders, 2 gatherers, 2 scouts)
    - Step 3: Create safe zone around Queen
    - Step 4: Spawn resources using Perlin noise veins
    - Step 5: Spawn decorations across map
    - Step 6: Spawn enemy nests outside safe zone
    - Emit `LEVEL_SPAWNED` event when complete
  - [ ] Method `update(deltaTime): void`
    - Update safe zone timer
    - Update enemy wave timer
    - Trigger waves when timer expires
  - [ ] Method `spawnEnemyWave(): void`
    - Increment wave number
    - Spawn enemies outside safe zone
    - Increase difficulty (more ants, add boss)
    - Emit `ENEMY_WAVE_SPAWNED` event
  - [ ] Method `clearAllSpawns(): void` - Remove all spawned entities
  - [ ] Method `getSpawnedEntities(type?: string): GameObject[]`
  - [ ] **TEST:** Full spawn sequence, wave spawning, safe zone integration

### Task 4.2: Entity Tracking
- [ ] Add to SpawnManager
  - [ ] Method `registerSpawn(entity, category): void`
    - Track spawned entity by category (ant, resource, enemy, decoration)
    - Store entity ID and reference
  - [ ] Method `unregisterSpawn(entityId): void`
    - Remove from tracking (on entity destroy)
    - Listen to `ENTITY_DESTROYED` event
  - [ ] Method `getEntityCount(category): number`
  - [ ] Method `getEntitiesByFaction(factionId): GameObject[]`
  - [ ] **TEST:** Registration, unregistration, queries

---

## Phase 5: Level Integration

### Task 5.1: Level Loader
- [x] Create `src/managers/LevelLoader.ts`
  - [x] Method `loadLevel(filePath: string): Promise<LevelData>`
    - Load JSON from `assets/levels/`
    - Validate level data structure
    - Return parsed LevelData
  - [x] Method `loadProceduralLevel(params: ProceduralLevelParams, seed): LevelData`
    - Generate level data from difficulty/parameters
    - Create starter ants, resource veins, enemy nests
    - Return procedural LevelData with metadata
  - [x] Method `saveLevel(levelData: LevelData): string`
    - Export level to JSON string (for level editor)
  - [x] Validation with error messages for corrupt data
  - [ ] **TEST:** Load handmade levels, procedural generation, validation

### Task 5.2: Example Level Files
- [x] Create `assets/levels/tutorial.json`
  - Easy difficulty, large safe zone (35 radius, 120s)
  - Abundant resources (0.5/0.4 density)
  - Single enemy nest, gentle waves (1.2x multiplier)
- [x] Create `assets/levels/standard.json`
  - Medium difficulty, moderate safe zone (25 radius, 90s)
  - Normal resources (0.3/0.25/0.2/0.1 density)
  - Three enemy nests, balanced waves (1.5x multiplier)
- [x] Create `assets/levels/survival.json`
  - Hard difficulty, small safe zone (18 radius, 60s)
  - Scarce resources (0.2/0.15 density)
  - Four enemy nests, aggressive waves (1.8x multiplier, boss every 3)

### Task 5.3: Scene Integration
- [x] Update `DevRoomScene` (or create `GameScene`)
  - [x] Property `spawnManager: SpawnManager`
  - [x] Property `levelData: LevelData`
  - [x] In `enter()`:
    - Load level data (from file or procedural) ✓
    - Initialize SpawnManager with level data ✓
    - Execute `spawnManager.spawnLevel()` ✓
    - Start wave timer ✓
  - [x] In `update(deltaTime)`:
    - Call `spawnManager.update(deltaTime)` for waves ✓
  - [x] In `exit()`:
    - Call `spawnManager.clearAllSpawns()` ✓
  - [x] Listen to `ENEMY_SPAWN` for UI updates ✓
  - [ ] **TEST:** Scene lifecycle, level loading, spawn execution

### Task 5.4: Level Selection UI (Optional)### Task 5.3: Example Level Files
- [ ] Create `assets/levels/tutorial.json`
  - Small map (50x50)
  - Queen at center
  - Resource veins nearby
  - 1 enemy nest (small threat)
  - Large safe zone (30 tile radius)
- [ ] Create `assets/levels/standard.json`
  - Medium map (100x100)
  - Queen at corner
  - Multiple resource veins
  - 3 enemy nests
  - Medium safe zone (20 tile radius)
- [ ] Create `assets/levels/survival.json`
  - Large map (150x150)
  - Queen at center
  - Sparse resources
  - 5 enemy nests
  - Small safe zone (15 tile radius)
  - Fast wave spawning
- [ ] **TEST:** Load all example levels, validate spawn execution

---

## Phase 6: Advanced Features

### Task 6.1: Enemy Wave System
- [ ] Add to SpawnManager
  - [ ] Property `waveConfig: WaveConfig[]` (difficulty progression)
  - [ ] Interface `WaveConfig` (waveNumber, delay, antCount, hasBoss, spawnRadius)
  - [ ] Method `getWaveConfig(waveNumber): WaveConfig`
    - Scale difficulty: antCount = baseCount + (wave * multiplier)
    - Add boss every N waves
  - [ ] Method `spawnWaveAtEdge(): void`
    - Spawn at map edge, outside safe zone
    - Multiple spawn points around perimeter
  - [ ] Emit `WAVE_WARNING` event 5 seconds before wave
  - [ ] **TEST:** Wave scaling, boss spawning, timing

### Task 6.2: Spawn Validation System
- [ ] Create `src/spawning/SpawnValidator.ts`
  - [ ] Method `validateSpawnPosition(x, y, constraints, tileGrid, entityManager): ValidationResult`
    - Check all constraints
    - Return detailed result (valid, reason if invalid)
  - [ ] Method `findValidSpawnPosition(center, radius, constraints): Point | null`
    - Search for valid position near center
    - Try multiple positions with fallback
  - [ ] Method `validateLevelData(levelData): ValidationResult`
    - Check spawn config completeness
    - Validate spawn positions don't overlap
    - Ensure safe zone is clear
  - [ ] **TEST:** All validation rules, edge cases

### Task 6.3: Spawn Analytics
- [ ] Add to SpawnManager
  - [ ] Method `getSpawnStats(): SpawnStats`
    - Total entities spawned by type
    - Resource distribution
    - Enemy nest locations
    - Wave history
  - [ ] Method `logSpawnEvent(event): void`
    - Track spawn timing and locations
    - Debug spawn failures
  - [ ] EventBus emit `SPAWN_FAILED` with reason
  - [ ] **TEST:** Stats tracking, event logging

---

## Phase 7: Configuration Files

### Task 7.1: Default Spawn Configurations
- [ ] Create `src/config/defaultSpawnConfigs.ts`
  - [ ] `TUTORIAL_SPAWN_CONFIG` - Easy start
  - [ ] `STANDARD_SPAWN_CONFIG` - Balanced gameplay
  - [ ] `SURVIVAL_SPAWN_CONFIG` - Hard mode
  - [ ] `SANDBOX_SPAWN_CONFIG` - No enemies, abundant resources
  - [ ] Export all presets for easy selection
  - [ ] **TEST:** All presets valid and complete

### Task 7.2: Spawn Config Editor Integration
- [ ] Add to WorldGenConfigMenu (or create SpawnConfigMenu)
  - [ ] Sliders for ant counts (builders, gatherers, scouts)
  - [ ] Toggle for enemy waves (on/off)
  - [ ] Slider for safe zone radius
  - [ ] Slider for resource density
  - [ ] Dropdown for spawn preset selection
  - [ ] Save/load spawn config to file
  - [ ] **TEST:** UI interaction, save/load

---

## Testing Strategy

### Unit Tests
- [ ] `test/unit/spawnRule.test.ts` - Constraint validation
- [ ] `test/unit/clusterSpawner.test.ts` - All cluster algorithms
- [ ] `test/unit/noiseLayerManager.test.ts` - Noise layer management
- [ ] `test/unit/safeZone.test.ts` - Safe zone logic
- [ ] `test/unit/spawnValidator.test.ts` - Validation rules

### Integration Tests
- [ ] `test/integration/antSpawner.test.ts` - Ant spawning with factories
- [ ] `test/integration/resourceSpawner.test.ts` - Resource veins
- [ ] `test/integration/enemySpawner.test.ts` - Enemy nests and waves
- [ ] `test/integration/spawnManager.test.ts` - Full spawn sequence
- [ ] `test/integration/levelLoader.test.ts` - Level loading

### End-to-End Tests
- [ ] Load tutorial level, verify all entities spawn correctly
- [ ] Load survival level, verify wave system works
- [ ] Test procedural level generation with seed
- [ ] Test safe zone expiration and enemy spawning
- [ ] Test resource depletion (no respawn)

---

## Implementation Order

1. **Phase 1** - Core interfaces and data structures
2. **Phase 2** - Spawning algorithms (independent of entities)
3. **Phase 3** - Entity-specific spawners (requires factories)
4. **Phase 4** - SpawnManager coordination
5. **Phase 5** - Level integration and loading
6. **Phase 6** - Advanced features (waves, validation)
7. **Phase 7** - Configuration and editor integration

**Estimated Total:** ~40 subtasks, builds on existing entity system (Ant, Queen, Resource, Boss, etc.)

---

## Dependencies

**Required Before Starting:**
- ✅ Ant + AntFactory (Phase 3.1 + 4.1) - COMPLETE
- Queen + QueenFactory (Phase 3.2 + 4.2)
- Resource + ResourceFactory (Phase 3.4 + 4.4)
- Boss + BossFactory (Phase 3.3 + 4.3)
- Decoration (optional, can mock for now)

**Can Start Now:**
- Phase 1 (Interfaces) - No dependencies
- Phase 2 (Algorithms) - No dependencies
- Phase 7.1 (Config files) - No dependencies

**Requires Factories:**
- Phase 3, 4, 5 - Need all entity factories complete
