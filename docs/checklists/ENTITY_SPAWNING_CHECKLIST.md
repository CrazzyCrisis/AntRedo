# Entity Spawning System Checklist

Complete implementation guide for the universal entity spawning system that works across all levels.

---

## Phase 1: Core Spawning Infrastructure

### Task 1.1: SpawnConfig Interface
- [ ] Create `src/config/spawnConfig.ts`
  - [ ] Define `SpawnConfig` interface (full level spawn configuration)
  - [ ] Define `QueenSpawnConfig` (position, faction)
  - [ ] Define `AntClusterConfig` (center, count, radius, faction, jobDistribution)
  - [ ] Define `ResourceVeinConfig` (bounds, type, noiseLayer, threshold, density)
  - [ ] Define `EnemyNestConfig` (center, patrolPath, bossType, antCount, faction)
  - [ ] Define `DecorationConfig` (bounds, type, density, tileTypes)
  - [ ] Define `SafeZoneConfig` (center, radius, duration)
  - [ ] Define `SpawnConstraints` interface (tileTypes, minDistance, noiseThreshold)
  - [ ] Define `NoiseLayers` interface (resources, enemies, decorations - each with scale and seed)
  - [ ] Create `DEFAULT_SPAWN_CONFIG` constant
  - [ ] **TEST:** Interface validation, default config completeness

### Task 1.2: SpawnRule System
- [ ] Create `src/spawning/SpawnRule.ts`
  - [ ] Interface `SpawnRule` (entityType, probability, clustering, constraints)
  - [ ] Enum `ClusterType` ('single', 'small', 'medium', 'large', 'radial', 'poisson', 'noise')
  - [ ] Interface `SpawnConstraints` with validation methods
  - [ ] Method `canSpawnAt(x, y, tileGrid, entityManager, noiseGen): boolean`
  - [ ] Tile type validation (ants: dirt/grass/sand, resources: no water, decorations: tile-specific)
  - [ ] Minimum distance validation from other entities
  - [ ] Perlin noise threshold validation
  - [ ] **TEST:** Constraint validation for all entity types

### Task 1.3: LevelData Interface
- [ ] Create `src/world/LevelData.ts`
  - [ ] Interface `LevelData` (name, worldSize, worldGenConfig, spawnConfig, noiseLayers)
  - [ ] Method `save(filePath: string): void` - Export to JSON
  - [ ] Method `load(filePath: string): LevelData` - Import from JSON
  - [ ] Method `validate(): boolean` - Check data integrity
  - [ ] Support for procedural generation (seed-based)
  - [ ] Support for level editor created data (handmade spawn points)
  - [ ] **TEST:** Save/load round trip, validation checks

---

## Phase 2: Spawning Algorithms

### Task 2.1: ClusterSpawner
- [ ] Create `src/spawning/ClusterSpawner.ts`
  - [ ] Method `spawnRadialCluster(center, count, radius, validator): Point[]`
    - Spawn entities in circle around center point
    - Use random angle + distance for natural variation
    - Validate each position with constraints
  - [ ] Method `spawnPoissonDisk(bounds, minDistance, maxAttempts): Point[]`
    - Even distribution for resources/decorations
    - Ensures minimum distance between spawns
    - Natural-looking scattered placement
  - [ ] Method `spawnNoiseCluster(bounds, noiseGen, threshold, density): Point[]`
    - Follow Perlin noise patterns (veins, features)
    - Sample noise at each position
    - Spawn where noise in threshold range
  - [ ] Method `spawnGridFormation(center, rows, cols, spacing): Point[]`
    - Structured formations (enemy patrols)
    - Aligned grid with offset variation
  - [ ] **TEST:** All cluster algorithms, constraint validation, distribution quality

### Task 2.2: NoiseLayerManager
- [ ] Create `src/spawning/NoiseLayerManager.ts`
  - [ ] Manage multiple Perlin noise generators (resources, enemies, decorations)
  - [ ] Property `noiseLayers: Map<string, PerlinNoise>`
  - [ ] Method `createLayer(name, scale, seed?): void`
  - [ ] Method `getLayer(name): PerlinNoise`
  - [ ] Method `sampleAt(layerName, x, y): number` - Get normalized noise value
  - [ ] Method `clearLayers(): void`
  - [ ] Default layers: 'resources', 'enemies', 'decorations'
  - [ ] **TEST:** Layer creation, sampling, isolation between layers

### Task 2.3: SafeZone System
- [ ] Create `src/spawning/SafeZone.ts`
  - [ ] Class `SafeZone` (center, radius, active, timer)
  - [ ] Method `isPointInside(x, y): boolean` - Check if position is safe
  - [ ] Method `update(deltaTime): void` - Timer countdown (optional expiration)
  - [ ] Method `expand(newRadius): void` - Grow safe zone over time
  - [ ] Method `deactivate(): void` - Remove safe zone
  - [ ] EventBus emit `SAFE_ZONE_EXPIRED` when timer runs out
  - [ ] **TEST:** Boundary detection, timer expiration, expansion

---

## Phase 3: Entity Spawners

### Task 3.1: AntSpawner
- [ ] Create `src/spawning/AntSpawner.ts`
  - [ ] Constructor takes `AntFactory`, `TileGrid`, `EntityManager`
  - [ ] Method `spawnStarterAnts(queenPos, config): Ant[]`
    - 3 builders, 2 gatherers, 2 scouts (from config)
    - Spawn in radial cluster around Queen (2-4 tile radius)
    - Validate spawn positions (dirt/grass/sand only)
    - Set jobs via `setJob(jobType)`
    - Set to follow Queen via `setCommander(queenId)`
  - [ ] Method `spawnAntCluster(center, count, radius, faction, jobDistribution): Ant[]`
    - Spawn N ants in cluster
    - Apply job distribution (e.g., {gatherer: 0.5, warrior: 0.3, builder: 0.2})
    - Return array of created ants
  - [ ] Method `spawnEnemyAnts(nestCenter, count, faction): Ant[]`
    - Spawn enemy ants around nest/boss
    - Default to warrior job
    - Set autonomous mode enabled
  - [ ] **TEST:** Starter ants, job distribution, constraint validation

### Task 3.2: ResourceSpawner
- [ ] Create `src/spawning/ResourceSpawner.ts`
  - [ ] Constructor takes `ResourceFactory`, `TileGrid`, `NoiseLayerManager`
  - [ ] Method `spawnResourceVein(bounds, type, noiseLayer, threshold, density): Resource[]`
    - Sample Perlin noise across bounds
    - Spawn where noise in threshold range
    - Validate no water tiles
    - Create veins/clusters following noise
    - Density controls spawn probability (0-1)
  - [ ] Method `spawnResourceCluster(center, type, count, radius): Resource[]`
    - Spawn N resources in cluster (alternative to noise)
    - Poisson disk sampling for even distribution
  - [ ] Track spawned resources for depletion (no respawn)
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
- [ ] Create `src/spawning/EnemySpawner.ts`
  - [ ] Constructor takes `BossFactory`, `AntFactory`, `SafeZone`
  - [ ] Method `spawnEnemyNest(config, safeZone): {boss: Boss, ants: Ant[]}`
    - Check nest center outside safe zone
    - Spawn Boss at nest center with patrol path
    - Spawn enemy ants in cluster around boss
    - Set ants to follow boss
  - [ ] Method `canSpawnEnemy(x, y, safeZone): boolean`
    - Check position outside safe zone
    - Validate tile type (dirt/grass/sand)
    - Check minimum distance from player entities
  - [ ] Method `spawnWave(waveConfig, safeZone): {boss?: Boss, ants: Ant[]}`
    - Spawn enemies in waves (increasing difficulty)
    - Wave data: {antCount, hasBoss, positions}
    - Emit `ENEMY_WAVE_SPAWNED` event
  - [ ] **TEST:** Safe zone validation, wave spawning, nest creation

---

## Phase 4: Spawn Manager

### Task 4.1: SpawnManager (Core Controller)
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
- [ ] Create `src/world/LevelLoader.ts`
  - [ ] Method `loadLevel(filePath: string): LevelData`
    - Load JSON from `assets/levels/`
    - Validate level data
    - Return parsed LevelData
  - [ ] Method `loadProceduralLevel(seed: number, size: {width, height}): LevelData`
    - Generate level data from seed
    - Use default spawn config with seed-based variations
    - Return procedural LevelData
  - [ ] Method `saveLevel(levelData: LevelData, filePath: string): void`
    - Export level to JSON (for level editor)
  - [ ] Error handling for missing/corrupt files
  - [ ] **TEST:** Load handmade levels, procedural generation, save/load round trip

### Task 5.2: Scene Integration
- [ ] Update `DevRoomScene` (or create `GameScene`)
  - [ ] Property `spawnManager: SpawnManager`
  - [ ] Property `levelData: LevelData`
  - [ ] In `enter()`:
    - Load level data (from file or procedural)
    - Initialize SpawnManager with level data
    - Execute `spawnManager.spawnLevel()`
    - Start wave timer
  - [ ] In `update(deltaTime)`:
    - Call `spawnManager.update(deltaTime)` for waves
  - [ ] In `exit()`:
    - Call `spawnManager.clearAllSpawns()`
  - [ ] Listen to `ENEMY_WAVE_SPAWNED` for UI updates
  - [ ] **TEST:** Scene lifecycle, level loading, spawn execution

### Task 5.3: Example Level Files
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
