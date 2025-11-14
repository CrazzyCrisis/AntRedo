# Entity System Implementation Checklist

## Overview
**MVC Architecture:** All entities follow Model-View-Controller pattern with strict separation of concerns.
- **Models:** Pure data classes in `src/classes/` (no rendering, only EventBus emissions)
- **Views:** Handled by Factory pattern + Renderer (developers never touch rendering code)
- **Controllers:** Managers in `src/managers/` (orchestrate logic, listen to events)
- **Testing:** Every component is independently testable with loose coupling via EventBus

**Component System:** Base `GameObject` class with pluggable components for flexible behaviors.
**Pathfinding:** Reuse existing `Pathfinder.ts` with A* algorithm (already implemented, tested, production-ready).
**Config-First:** All values (stats, cooldowns, ranges, damage, speeds) in centralized config files.

---

## Phase 1: Core Entity Foundation (MVC + Testable)

### Task 1.1: Base GameObject Class (MODEL)
- [ ] Create `src/classes/GameObject.ts` with base class
  - [ ] Properties: `id`, `type`, `gridX`, `gridY`, `worldX`, `worldY`, `isActive`
  - [ ] Collision: `collisionWidth`, `collisionHeight`, `collisionShape` (rect/circle)
  - [ ] Use helpers: `gridToWorld()`, `worldToGrid()`, `rectIntersect()`, `circleIntersect()`, `distance()`
  - [ ] Methods: `moveTo()`, `destroy()`, `isCollidingWith()`, `update(deltaTime)`
  - [ ] Components: `Map<string, IComponent>` for behavior composition
  - [ ] EventBus integration: Emit `ENTITY_MOVED`, `ENTITY_DESTROYED` (no rendering code)
  - [ ] **TEST:** Unit tests for creation, movement, collision detection, component management

### Task 1.2: Component Interface (PATTERN)
- [ ] Create `src/classes/components/IComponent.ts` interface
  - [ ] Methods: `update(deltaTime: number)`, `onAttach(owner: GameObject)`, `onDetach()`
  - [ ] Property: `owner: GameObject` reference for accessing entity data
  - [ ] Each component is independently testable (pass mock GameObject)
  - [ ] **TEST:** Mock component tests for lifecycle (attach, update, detach)

### Task 1.3: Entity Manager (CONTROLLER)
- [ ] Create `src/managers/EntityManager.ts` singleton
  - [ ] Track entities: `Map<string, GameObject>` by ID
  - [ ] Track by type: `Map<string, Set<string>>` for fast type queries (O(1) lookups)
  - [ ] Methods: `addEntity()`, `removeEntity()`, `getEntity()`, `getEntitiesByType()`, `getAllEntities()`
  - [ ] Spatial queries: `getEntitiesAt(gridX, gridY)`, `getEntitiesInRadius(x, y, radius)`, `getEntitiesInRect(x, y, w, h)`
  - [ ] Use helpers: `distance()`, `pointInCircle()`, `rectIntersect()` for spatial queries
  - [ ] Count tracking: `getEntityCount(type?)` for UI display and game logic
  - [ ] EventBus listeners: Subscribe to `ENTITY_DESTROYED` to auto-cleanup
  - [ ] **TEST:** Unit tests for add/remove, type queries, spatial queries, count tracking

### Task 1.4: Entity Configuration (CONFIG-FIRST)
- [ ] Create `src/config/entityConfig.ts` - single source of truth for all entity stats
  - [ ] **Ant stats:** `JOBS` (Gatherer, Builder, Warrior, Scout), health, speed, visionRange, attackDamage, gatherRate, smellRange
  - [ ] **Ant job priorities:** Priority arrays for each job type (see Task 2.8)
  - [ ] **Queen stats:** health, speed, commandRadius, powerCooldowns, powerDamage, powerRanges, powerKnockback
  - [ ] **Queen powers:** Lightning (AOE radius, knockback, soot duration), Fireball (AOE, burn duration), Blackhole (radius, pullStrength, damage), Tidalwave (pushStrength, damage), FinalFlash (unlockRequirement)
  - [ ] **Boss stats:** health, speed, visionConeAngle, visionConeDistance, patrolSpeed, projectileSpeed, projectileDamage
  - [ ] **Boss projectiles:** Homing (turnSpeed, homingRange) vs Straight-line (speed)
  - [ ] **Resource types:** Food, Wood, Stone, MagicCrystals (collision size, stack amounts, spawn rates)
  - [ ] **Building types:** Sizes (variable, e.g., `{width: 2, height: 3}`), costs (per resource type), construction time, level caps
  - [ ] **Building levels:** Level 1-3 boosts (antCapBonus, resourceProductionRate, statBoosts per level)
  - [ ] All numeric values must be here (no hardcoded values in code)
  - [ ] **TEST:** Config validation tests (all values present, ranges valid)

### Task 1.5: GameEvents for Entities (EVENTBUS)
- [ ] Add to `src/utils/eventBus.ts` GameEvents constants:
  - [ ] **Entity lifecycle:** `ENTITY_ADDED`, `ENTITY_REMOVED`, `ENTITY_MOVED`, `ENTITY_UPDATED`
  - [ ] **Ant events:** `ANT_STATE_CHANGED`, `ANT_DIED`, `ANT_ATTACKED`, `ANT_JOB_CHANGED`, `ANT_HUNGER_CHANGED`
  - [ ] **Queen events:** `QUEEN_COMMAND_ISSUED`, `QUEEN_DIED`, `QUEEN_POWER_USED`, `QUEEN_POWER_UNLOCKED`, `QUEEN_POWER_UPGRADED`
  - [ ] **Boss events:** `BOSS_ATTACKED`, `BOSS_DIED`, `BOSS_TARGET_CHANGED`, `BOSS_PROJECTILE_FIRED`
  - [ ] **Resource events:** `RESOURCE_COLLECTED`, `RESOURCE_DEPOSITED`, `RESOURCE_DEPLETED`, `RESOURCE_SMELLED` (ant detection)
  - [ ] **Building events:** `BUILDING_PLACED`, `BUILDING_COMPLETED`, `BUILDING_DESTROYED`, `BUILDING_LEVELED_UP`, `CONSTRUCTION_PROGRESS`
  - [ ] **Power effects:** `LIGHTNING_STRIKE`, `FIREBALL_EXPLODE`, `BLACKHOLE_PULL`, `TIDALWAVE_PUSH`, `FINALFLASH_ACTIVATED`, `SOOT_STAIN_CREATED`
  - [ ] **TEST:** EventBus integration tests (emit/receive, multiple listeners)

---

## Phase 2: Component Systems (MVC + Testable + Reuse Helpers)

### Task 2.1: State Machine Component (MODEL)
- [ ] Create `src/classes/components/StateMachineComponent.ts`
  - [ ] States enum: `IDLE`, `GATHER`, `COMBAT`, `FOLLOWING`, `BUILDING`, `PATROLLING`, `ATTACKING`, `SCOUTING`, `HEALING`
  - [ ] Properties: `currentState`, `previousState`, `stateHistory: string[]` (for debugging)
  - [ ] Methods: `setState(newState)`, `getState()`, `isInState(state)`, `transitionTo(newState, reason?)`
  - [ ] EventBus: Emit `STATE_CHANGED` with (entityId, oldState, newState, reason)
  - [ ] Used by: Ants (all jobs), Boss (patrol/attack)
  - [ ] **TEST:** State transitions, invalid transitions, event emissions, state history

### Task 2.2: Pathfinding Component (MODEL - Reuses Existing Pathfinder)
- [ ] Create `src/classes/components/PathfindingComponent.ts`
  - [ ] **Reuse:** Import `Pathfinder` from `src/world/Pathfinder.ts` (already fully implemented with A*)
  - [ ] Properties: `pathfinder: Pathfinder`, `currentPath: PathNode[]`, `pathIndex: number`, `speed: number`, `isMoving: boolean`
  - [ ] Methods: `findPath(targetGridX, targetGridY)`, `followPath(deltaTime)`, `hasPath()`, `clearPath()`, `getNextNode()`
  - [ ] Grid integration: Get walkable grid from PathfindingManager (Phase 5.5)
  - [ ] Use helpers: `gridToWorld()`, `distance()` for movement calculations
  - [ ] Movement: Lerp toward next node in path using `lerp()` helper
  - [ ] EventBus: Emit `PATH_FOUND`, `PATH_BLOCKED`, `PATH_COMPLETE`, `PATH_FAILED`
  - [ ] Used by: Ants (all jobs), Queen (player control + autopilot), Boss (patrol + chase)
  - [ ] **TEST:** Path finding, path following, obstacle detection, path completion, speed variations

### Task 2.3: Health Component (MODEL)
- [ ] Create `src/classes/components/HealthComponent.ts`
  - [ ] Properties: `currentHealth`, `maxHealth`, `isAlive`, `regenRate`, `lastDamageTime`
  - [ ] Methods: `takeDamage(amount, attackerId)`, `heal(amount)`, `isDead()`, `getHealthPercent()`, `regenerate(deltaTime)`
  - [ ] Death: Mark owner as inactive, emit `ENTITY_DIED` with (entityId, killerId)
  - [ ] EventBus: Emit `ENTITY_DAMAGED` (entityId, damage, currentHealth), `ENTITY_HEALED`, `ENTITY_DIED`
  - [ ] Used by: Ants, Queen, Boss
  - [ ] **TEST:** Damage, healing, death, regen, edge cases (overheal, negative damage)

### Task 2.4: Combat Component (MODEL)
- [ ] Create `src/classes/components/CombatComponent.ts`
  - [ ] Properties: `attackDamage`, `attackRange`, `attackCooldown`, `lastAttackTime`, `targetId`, `isAttacking: boolean`
  - [ ] Methods: `attack(targetId)`, `canAttack()`, `setTarget(targetId)`, `clearTarget()`, `updateCooldown(deltaTime)`
  - [ ] Range check: Use `distance()` helper to validate target in range
  - [ ] EventBus: Emit `ENTITY_ATTACKED` (attackerId, targetId, damage)
  - [ ] Used by: Ants (Warrior priority), Queen (all powers), Boss (melee + projectiles)
  - [ ] **TEST:** Attack cooldown, range validation, target tracking, damage calculation

### Task 2.5: Inventory Component (MODEL)
- [ ] Create `src/classes/components/InventoryComponent.ts`
  - [ ] Properties: `items: Map<string, number>`, `capacity: number`, `currentWeight: number`
  - [ ] Methods: `addItem(type, amount)`, `removeItem(type, amount)`, `hasItem(type, minAmount?)`, `getItemCount(type)`, `isFull()`, `isEmpty()`, `clear()`
  - [ ] EventBus: Emit `ITEM_ADDED` (entityId, itemType, amount), `ITEM_REMOVED`, `INVENTORY_FULL`
  - [ ] Used by: Ants (resource carrying), potentially Warehouses (building storage)
  - [ ] **TEST:** Add/remove items, capacity limits, overflow, underflow, queries

### Task 2.6: Vision Component (MODEL)
- [ ] Create `src/classes/components/VisionComponent.ts`
  - [ ] Properties: `visionRange`, `visionAngle` (for cone, 360 for circle), `visionDirection` (radians), `detectedEntities: Set<string>`
  - [ ] Methods: `canSee(target: GameObject)`, `getVisibleEntities(allEntities: GameObject[])`, `isInVisionCone(targetX, targetY)`
  - [ ] Cone vision: Use `angleBetween()` and `normalizeAngle()` helpers for angle math
  - [ ] Circle vision: Use `distance()` helper for range check
  - [ ] Use helpers: `distance()`, `angleBetween()`, `normalizeAngle()` from helpers.ts
  - [ ] EventBus: Emit `ENTITY_DETECTED` (observerId, targetId), `ENTITY_LOST` (when leaves vision)
  - [ ] Used by: Boss (cone vision for targeting), Ants (circle vision for gathering/combat)
  - [ ] **TEST:** Cone vision angle checks, circle vision range, occlusion (optional), detection events

### Task 2.7: AI Behavior Component (CONTROLLER)
- [ ] Create `src/classes/components/AIBehaviorComponent.ts`
  - [ ] Properties: `isAutonomous: boolean`, `behaviorTree: BehaviorNode`, `blackboard: Map<string, any>` (AI memory)
  - [ ] Methods: `setAutonomous(enabled)`, `update(deltaTime)`, `evaluateBehavior()`, `setBlackboardValue(key, value)`
  - [ ] Ant AI: Priority-based (see Task 2.8 for job-specific priorities)
  - [ ] Boss AI: State-based (Patrol → Detect → Chase → Attack)
  - [ ] Use EntityManager spatial queries for target detection
  - [ ] EventBus: Emit `AI_TARGET_ACQUIRED`, `AI_STATE_CHANGED`, `AI_BEHAVIOR_COMPLETE`
  - [ ] Used by: Ants (autonomous mode), Boss (always autonomous)
  - [ ] **TEST:** Autonomous toggle, priority evaluation, target selection, state transitions

### Task 2.8: Ant Job System (NEW - MODEL + CONTROLLER)
- [ ] Create `src/classes/components/AntJobComponent.ts`
  - [ ] Job types enum: `GATHERER`, `BUILDER`, `WARRIOR`, `SCOUT`
  - [ ] Properties: `jobType`, `jobPriorities: string[]`, `currentTask: string`, `hunger: number`, `maxHunger: number`
  - [ ] **Priority System** (first match wins, checked every tick):
    - [ ] **ALL JOBS:** `QUEEN_COMMAND` (always first priority, overrides all)
    - [ ] **Gatherer:** `COMBAT`, `EAT_FOOD` (hunger), `GATHER_RESOURCES`, `BUILD`, `IDLE`
    - [ ] **Builder:** `COMBAT`, `EAT_FOOD`, `BUILD`, `GATHER_RESOURCES`, `IDLE`
    - [ ] **Warrior:** `COMBAT`, `EAT_FOOD`, `GATHER_RESOURCES`, `BUILD`, `IDLE`
    - [ ] **Scout:** `REVEAL_MAP` (scout fog of war), `COMBAT`, `EAT_FOOD`, `GATHER_RESOURCES`, `BUILD`, `IDLE`
  - [ ] Methods: `setJob(jobType)`, `evaluatePriorities()`, `canPerformTask(taskType)`, `updateHunger(deltaTime)`
  - [ ] Smell range: Use `distance()` helper to detect resources in configurable range (from entityConfig.ts)
  - [ ] Config: All job priorities, hunger rates, smell ranges in `entityConfig.ts`
  - [ ] EventBus: Emit `ANT_JOB_CHANGED`, `ANT_TASK_STARTED`, `ANT_HUNGER_CHANGED`
  - [ ] **TEST:** Job assignment, priority evaluation, hunger mechanics, smell detection

### Task 2.9: Hunger System (NEW - MODEL)
- [ ] Create `src/classes/components/HungerComponent.ts`
  - [ ] Properties: `hunger: number`, `maxHunger: number`, `hungerRate: number`, `starvationDamage: number`, `lastEatTime: number`
  - [ ] Methods: `increaseHunger(deltaTime)`, `eat(foodAmount)`, `isHungry()`, `isStarving()`, `getHungerPercent()`
  - [ ] Starvation: If hunger reaches max, apply damage over time (use HealthComponent)
  - [ ] Eating: Find food resource, consume, reduce hunger, emit event
  - [ ] EventBus: Emit `ANT_HUNGRY`, `ANT_EATING`, `ANT_STARVING`
  - [ ] Config: Hunger rates, starvation damage in `entityConfig.ts`
  - [ ] Used by: All ants (job system triggers eating behavior)
  - [ ] **TEST:** Hunger increase, eating, starvation, edge cases

---

## Phase 3: Specialized Entities (MVC + Testable)

---

## Phase 3: Specialized Entities (MVC + Testable)

### Task 3.1: Ant Class (MODEL)
- [ ] Create `src/classes/Ant.ts` extends `GameObject`
  - [ ] Attach components: StateMachine, Pathfinding, Health, Combat, Inventory, Vision, AIBehavior, AntJob, Hunger
  - [ ] Properties: `factionId: string`, `isAutonomous: boolean`, `commanderId: string` (queen ID)
  - [ ] Methods: `gather()`, `dropoff()`, `attackTarget()`, `followCommander()`, `toggleAutonomous()`, `setJob(jobType)`
  - [ ] Job-based behavior: Call `jobComponent.evaluatePriorities()` each tick
  - [ ] EventBus: Emit `ANT_CREATED`, `ANT_STATE_CHANGED`, `ANT_JOB_CHANGED`
  - [ ] **NO RENDERING CODE** - Factory handles all visuals (shader for faction color)
  - [ ] **TEST:** Component integration, job switching, autonomous behavior, queen commands

### Task 3.2: Queen Class (MODEL)
- [ ] Create `src/classes/Queen.ts` extends `GameObject`
  - [ ] Attach components: Pathfinding, Health, Combat
  - [ ] Properties: `powers: Map<string, QueenPower>`, `commandRadius`, `playerControlled: true`, `factionId: string`
  - [ ] Power system: Each power has (isUnlocked, level, cooldown, lastUsedTime)
  - [ ] Methods: `usePower(powerName, targetX?, targetY?)`, `commandAnts(radius, command)`, `interact()`, `upgradePower(powerName)`, `unlockPower(powerName)`
  - [ ] Camera: Emit `CAMERA_FOLLOW_ENTITY` event with queen ID for camera tracking
  - [ ] Input: Listen for keybinds (1,2,3,4,5) via EventBus for power activation
  - [ ] EventBus: Emit `QUEEN_COMMAND_ISSUED`, `QUEEN_POWER_USED`, `QUEEN_POWER_UNLOCKED`, `QUEEN_POWER_UPGRADED`
  - [ ] **NO RENDERING CODE** - Factory handles visuals
  - [ ] **TEST:** Power cooldowns, unlocking, upgrading, command radius, death triggers game over

### Task 3.3: Boss Class (MODEL)
- [ ] Create `src/classes/Boss.ts` extends `GameObject`
  - [ ] Attach components: StateMachine, Pathfinding, Health, Combat, Vision, AIBehavior
  - [ ] Properties: `patrolPath: PathNode[]`, `projectileType: 'homing' | 'straight'`, `weakestTargetId: string`, `patrolIndex: number`
  - [ ] AI Loop: Patrol → Vision cone scans → Detect weakest ant → Chase → Attack (projectile or melee)
  - [ ] Methods: `setPatrolPath(path)`, `shootProjectile(targetId)`, `findWeakestTarget()`, `resumePatrol()`
  - [ ] Vision cone: Use VisionComponent with angle and direction
  - [ ] Weakest target: Query EntityManager for ants, find lowest health
  - [ ] EventBus: Emit `BOSS_PATROLLING`, `BOSS_TARGET_ACQUIRED`, `BOSS_ATTACKING`, `BOSS_PROJECTILE_FIRED`
  - [ ] **NO RENDERING CODE** - Factory handles visuals (vision cone in debug layer)
  - [ ] **TEST:** Patrol behavior, target detection, weakest selection, projectile firing, state transitions

### Task 3.4: Resource Class (MODEL - Simple)
- [ ] Create `src/classes/Resource.ts` extends `GameObject`
  - [ ] Properties: `resourceType: 'FOOD' | 'WOOD' | 'STONE' | 'MAGIC_CRYSTALS'`, `amount: number`, `isCollectable: boolean`
  - [ ] Methods: `collect(amount)`, `isEmpty()`, `getType()`, `getAmount()`
  - [ ] Smell system: Ants detect in range using `distance()` helper
  - [ ] EventBus: Emit `RESOURCE_COLLECTED` (antId, resourceType, amount), `RESOURCE_DEPLETED` (resourceId)
  - [ ] **NO RENDERING CODE** - Factory registers sprite
  - [ ] **TEST:** Collection, depletion, type validation

### Task 3.5: Building Class (MODEL)
- [ ] Create `src/classes/Building.ts` extends `GameObject`
  - [ ] Properties: `buildingType: string`, `size: {width, height}`, `level: number`, `maxLevel: number`, `isConstructed: boolean`, `constructionProgress: number`, `blocksPathfinding: boolean`, `boosts: {}`, `workers: Set<string>`, `resourceProduction: {type, rate}`
  - [ ] Methods: `startConstruction()`, `addProgress(amount)`, `completeConstruction()`, `levelUp()`, `applyBoost(ant)`, `generateResources()`, `assignWorker(antId)`, `removeWorker(antId)`
  - [ ] Level system: Each level increases ant cap, resource rate, or stat boosts (from config)
  - [ ] Types: Warehouse (stores resources), Barracks (spawns ants), ResourceGenerator (produces resources), TurretTower (defends)
  - [ ] Construction: Starts as "construction site", ants build over time, completes when progress reaches 100%
  - [ ] Pathfinding: Occupies grid cells (width × height), marks as blocked in PathfindingManager
  - [ ] EventBus: Emit `BUILDING_PLACED`, `CONSTRUCTION_PROGRESS`, `BUILDING_COMPLETED`, `BUILDING_LEVELED_UP`, `BUILDING_DESTROYED`
  - [ ] **NO RENDERING CODE** - Factory handles sprites (construction site vs completed)
  - [ ] **TEST:** Construction progress, leveling, worker assignment, resource generation, pathfinding blocking

### Task 3.6: Projectile Class (MODEL)
- [ ] Create `src/classes/Projectile.ts` extends `GameObject`
  - [ ] Properties: `damage: number`, `speed: number`, `targetId: string`, `ownerId: string`, `projectileType: 'homing' | 'straight'`, `lifeTime: number`
  - [ ] Methods: `moveTowardsTarget(deltaTime)`, `onHit(targetId)`, `updateHomingDirection()`
  - [ ] Homing: Use `angleBetween()`, `vectorNormalize()`, turn speed from config
  - [ ] Straight: Move in initial direction using `vectorNormalize()`, `vectorLimit()`
  - [ ] Collision: Check against entities using EntityManager spatial queries
  - [ ] Auto-destroy: On hit or lifetime expires
  - [ ] EventBus: Emit `PROJECTILE_HIT` (projectileId, targetId, damage), `PROJECTILE_EXPIRED`
  - [ ] Used by: Queen powers (fireball), Boss attacks
  - [ ] **NO RENDERING CODE** - Factory handles trail/sprite
  - [ ] **TEST:** Homing vs straight movement, hit detection, lifetime expiration

---

## Phase 4: Factory Pattern for Entities (VIEW Bridge)

### Task 4.1: Ant Factory (VIEW + MODEL)
- [ ] Create `src/factories/AntFactory.ts`
  - [ ] `create(gridX, gridY, factionId, jobType, sprite)` → Returns Ant model
  - [ ] Attach ALL components (StateMachine, Pathfinding, Health, Combat, Inventory, Vision, AIBehavior, AntJob, Hunger)
  - [ ] Register sprite with Renderer on `RenderLayer.ENTITIES` using `renderer.register()`
  - [ ] Apply faction color shader/tint to sprite (use FactionManager to get color)
  - [ ] Register with EntityManager using `entityManager.addEntity()`
  - [ ] EventBus listeners: Update sprite position on `ENTITY_MOVED`, remove on `ENTITY_DESTROYED`
  - [ ] Return Ant model only (hide rendering complexity)
  - [ ] **TEST:** Factory creates ant with all components, sprite registered, faction color applied

### Task 4.2: Queen Factory (VIEW + MODEL)
- [ ] Create `src/factories/QueenFactory.ts`
  - [ ] `create(gridX, gridY, factionId, sprite)` → Returns Queen model
  - [ ] Attach components (Pathfinding, Health, Combat)
  - [ ] Initialize powers map (all locked at level 0)
  - [ ] Register sprite with Renderer on `RenderLayer.ENTITIES`
  - [ ] Register with EntityManager
  - [ ] Emit `CAMERA_FOLLOW_ENTITY` event with queen ID
  - [ ] EventBus listeners: Update sprite, handle death (game over event)
  - [ ] Return Queen model only
  - [ ] **TEST:** Factory creates queen, camera follows, powers initialized

### Task 4.3: Boss Factory (VIEW + MODEL)
- [ ] Create `src/factories/BossFactory.ts`
  - [ ] `create(gridX, gridY, patrolPath, projectileType, sprite)` → Returns Boss model
  - [ ] Attach components (StateMachine, Pathfinding, Health, Combat, Vision, AIBehavior)
  - [ ] Configure vision cone (angle, distance from config)
  - [ ] Set patrol path
  - [ ] Register sprite with Renderer on `RenderLayer.ENTITIES`
  - [ ] Register with EntityManager
  - [ ] Debug: Register vision cone renderable on `RenderLayer.DEBUG`
  - [ ] Return Boss model only
  - [ ] **TEST:** Factory creates boss, patrol set, vision configured

### Task 4.4: Resource Factory (VIEW + MODEL)
- [ ] Create `src/factories/ResourceFactory.ts`
  - [ ] `create(gridX, gridY, resourceType, amount, sprite)` → Returns Resource model
  - [ ] Register sprite with Renderer on `RenderLayer.GROUND_DECORATIONS`
  - [ ] Register with EntityManager
  - [ ] EventBus listener: Remove sprite on `RESOURCE_DEPLETED`
  - [ ] Return Resource model only
  - [ ] **TEST:** Factory creates resource, sprite registered, depletion cleanup

### Task 4.5: Building Factory (VIEW + MODEL)
- [ ] Create `src/factories/BuildingFactory.ts`
  - [ ] `create(gridX, gridY, buildingType, size, sprite)` → Returns Building model
  - [ ] Handle construction site sprite vs completed building sprite
  - [ ] Register sprite with Renderer on `RenderLayer.GROUND_DECORATIONS` or custom building layer
  - [ ] Register with EntityManager
  - [ ] Update PathfindingManager grid (mark tiles as blocked based on size)
  - [ ] EventBus listeners: Update sprite on `CONSTRUCTION_PROGRESS`, `BUILDING_COMPLETED`, `BUILDING_LEVELED_UP`
  - [ ] Return Building model only
  - [ ] **TEST:** Factory creates building, pathfinding blocked, sprite transitions

### Task 4.6: Projectile Factory (VIEW + MODEL)
- [ ] Create `src/factories/ProjectileFactory.ts`
  - [ ] `create(startX, startY, targetId, damage, projectileType, sprite)` → Returns Projectile model
  - [ ] Register sprite with Renderer on `RenderLayer.ABOVE_ENTITIES`
  - [ ] Register with EntityManager
  - [ ] EventBus listeners: Update sprite position, remove on `PROJECTILE_HIT` or `PROJECTILE_EXPIRED`
  - [ ] Optional: Trail effect (multiple sprites following projectile)
  - [ ] Return Projectile model only
  - [ ] **TEST:** Factory creates projectile, sprite follows movement, cleanup on hit

---

## Phase 5: Manager Systems (CONTROLLERS)

---

## Phase 5: Manager Systems (CONTROLLERS)

### Task 5.1: Faction Manager (CONTROLLER)
- [ ] Create `src/managers/FactionManager.ts` singleton
  - [ ] Track factions: `Map<string, Faction>` where Faction = {id, color, antIds: Set<string>, queenId, isPlayerFaction, antCap, currentAnts}
  - [ ] Methods: `createFaction(id, color, isPlayer)`, `addAntToFaction(antId, factionId)`, `removeAntFromFaction(antId)`, `getFactionColor(factionId)`, `isEnemy(factionId1, factionId2)`, `getAntCap(factionId)`, `canSpawnAnt(factionId)`
  - [ ] Ant cap: Track current ants vs cap (cap increases with building levels)
  - [ ] EventBus listeners: Update ant counts on `ANT_CREATED`, `ANT_DIED`
  - [ ] **TEST:** Faction creation, ant tracking, enemy detection, ant cap limits

### Task 5.2: Resource Manager (CONTROLLER)
- [ ] Create `src/managers/ResourceManager.ts` singleton
  - [ ] Track global resources: `Map<string, number>` (resourceType → amount) per faction
  - [ ] Methods: `addResource(factionId, type, amount)`, `removeResource(factionId, type, amount)`, `hasEnough(factionId, type, amount)`, `getResourceCount(factionId, type)`, `getAll ResourceCounts(factionId)`
  - [ ] Warehouse integration: Resources only count when in warehouse building range
  - [ ] EventBus: Emit `RESOURCE_UPDATED` (factionId, type, newAmount) for UI updates
  - [ ] EventBus listeners: Listen for `RESOURCE_DEPOSITED`, `BUILDING_RESOURCE_GENERATED`
  - [ ] **TEST:** Add/remove resources, warehouse storage, resource checks, UI updates

### Task 5.3: Building Manager (CONTROLLER)
- [ ] Create `src/managers/BuildingManager.ts` singleton
  - [ ] Track buildings: `Map<string, Building>` by ID, `Map<string, Set<string>>` by faction
  - [ ] Methods: `placeConstructionSite(factionId, type, gridX, gridY)`, `completeBuilding(buildingId)`, `destroyBuilding(buildingId)`, `levelUpBuilding(buildingId)`, `getBoostsInRange(gridX, gridY, radius)`, `getBuildingsOfType(factionId, type)`
  - [ ] Construction: Workers (ants) add progress each tick until complete
  - [ ] Leveling: Cost resources, increase ant cap/boosts/production
  - [ ] Pathfinding: Update PathfindingManager grid when placed/destroyed
  - [ ] Boosts: Apply stat boosts to ants in range (check each tick or on ant spawn)
  - [ ] EventBus: Listen for `BUILDING_PLACED`, emit `BUILDING_LEVEL_UP_COMPLETE`
  - [ ] **TEST:** Placement, construction progress, leveling, boost application, pathfinding updates

### Task 5.4: Command Manager (CONTROLLER)
- [ ] Create `src/managers/CommandManager.ts` singleton
  - [ ] Queen command types: `MOVE_TO`, `ATTACK_TARGET`, `GATHER_RESOURCE`, `BUILD_BUILDING`, `FOLLOW_QUEEN`, `CHANGE_STATE`
  - [ ] Methods: `issueCommand(queenId, commandType, params)`, `getAntsInRadius(queenPos, radius)`, `setAntState(antId, state)`, `assignTask(antId, task)`
  - [ ] Auto-select ants: Get all faction ants in queen's command radius using EntityManager spatial query
  - [ ] Command override: Set ant's `isAutonomous = false`, set target task, ants execute then return to autonomous
  - [ ] EventBus: Listen for `QUEEN_COMMAND_ISSUED`, emit `ANT_COMMANDED` (antId, commandType)
  - [ ] **TEST:** Command issuing, ant selection, state changes, autonomous return

### Task 5.5: Pathfinding Manager (CONTROLLER - Reuses Existing Pathfinder)
- [ ] Create `src/managers/PathfindingManager.ts` singleton
  - [ ] **Reuse:** Import `Pathfinder` class from `src/world/Pathfinder.ts`
  - [ ] Store walkable grid: `boolean[][]` (true = walkable, false = blocked by building/obstacle)
  - [ ] Shared Pathfinder instance: `pathfinder: Pathfinder` (all entities use this)
  - [ ] Methods: `initializeGrid(width, height)`, `updateGrid(tileData)`, `findPath(startX, startY, goalX, goalY)`, `isWalkable(gridX, gridY)`, `markBlocked(gridX, gridY)`, `markWalkable(gridX, gridY)`, `getGrid()`
  - [ ] Building integration: When building placed, mark all tiles in size as blocked
  - [ ] EventBus: Listen for `BUILDING_PLACED`, `BUILDING_DESTROYED` to update grid
  - [ ] **TEST:** Grid initialization, blocking/unblocking, path finding, building updates

---

## Phase 6: Queen Power System (MODEL + CONTROLLER + VIEW)

### Task 6.1: Power Base Interface (MODEL)
- [ ] Create `src/classes/powers/IPower.ts` interface
  - [ ] Properties: `name: string`, `isUnlocked: boolean`, `level: number`, `maxLevel: number`, `cooldown: number`, `lastUsedTime: number`
  - [ ] Methods: `use(queenPos, targetPos?)`, `canUse()`, `upgrade()`, `isOnCooldown()`, `getCooldownRemaining()`
  - [ ] Each power extends this interface

### Task 6.2: Lightning Power (MODEL + CONTROLLER)
- [ ] Create `src/classes/powers/LightningPower.ts` implements IPower
  - [ ] **Behavior:** Single target, instant strike, AOE knockback in small radius around target
  - [ ] **Effect:** Fast attack (many hits), low damage per hit, knockback enemies
  - [ ] Properties: `damage: number`, `knockbackRadius: number`, `knockbackStrength: number`, `sootDuration: number`
  - [ ] Methods: `use(queenPos, targetId)` → Find target, apply damage, knockback nearby entities, create soot stain
  - [ ] Knockback: Use `vectorNormalize()` and `angleBetween()` to push entities away from strike point
  - [ ] Soot stain: Create visual effect (renderable) that lasts N seconds
  - [ ] Config values: Damage per level, knockback radius/strength, soot duration in `entityConfig.ts`
  - [ ] EventBus: Emit `LIGHTNING_STRIKE` (targetId, damage, knockbackRadius), `SOOT_STAIN_CREATED`
  - [ ] **TEST:** Damage application, knockback calculation, soot creation, level scaling

### Task 6.3: Fireball Power (MODEL + CONTROLLER)
- [ ] Create `src/classes/powers/FireballPower.ts` implements IPower
  - [ ] **Behavior:** Aimed projectile, AOE explosion on impact, applies burn status to all in radius
  - [ ] **Effect:** Single large hit, AOE burn damage over time
  - [ ] Properties: `damage: number`, `aoeRadius: number`, `burnDuration: number`, `burnDamagePerSecond: number`, `projectileSpeed: number`
  - [ ] Methods: `use(queenPos, targetPos)` → Create projectile (use ProjectileFactory), on hit create explosion, apply burn status
  - [ ] Burn status: Create `BurnStatusComponent` that ticks damage over time
  - [ ] Explosion: Query EntityManager for entities in radius, apply burn
  - [ ] Use helpers: `distance()` for radius check, `gridToWorld()` for positioning
  - [ ] Config values: Damage, AOE radius, burn duration/DPS per level in `entityConfig.ts`
  - [ ] EventBus: Emit `FIREBALL_EXPLODE` (targetPos, aoeRadius, damage), `ENTITY_BURNING` (entityId, duration)
  - [ ] **TEST:** Projectile creation, explosion radius, burn status, damage over time

### Task 6.4: Blackhole Power (MODEL + CONTROLLER)
- [ ] Create `src/classes/powers/BlackholePower.ts` implements IPower
  - [ ] **Behavior:** Placed AOE, pulls all entities in radius toward center in spiral, massive damage to entities at center when cast ends
  - [ ] **Effect:** Crowd control (pull enemies together), execution damage, soot stain
  - [ ] Properties: `radius: number`, `pullStrength: number`, `duration: number`, `centerDamage: number`, `spiralSpeed: number`
  - [ ] Methods: `use(queenPos, targetPos)` → Create blackhole entity, pull entities each tick, apply damage at end, create soot
  - [ ] Pull mechanic: Each tick, get entities in radius, calculate vector toward center using `angleBetween()` and `vectorNormalize()`, apply pull force
  - [ ] Spiral: Add tangential velocity (perpendicular to pull direction) for spiral effect
  - [ ] Center check: At end of duration, entities within small radius of center take massive damage and are destroyed
  - [ ] Use helpers: `distance()`, `angleBetween()`, `vectorNormalize()` for pull calculations
  - [ ] Config values: Radius, pull strength, duration, damage per level in `entityConfig.ts`
  - [ ] EventBus: Emit `BLACKHOLE_PULL` (entityId, pullVector), `BLACKHOLE_DAMAGE` (entityId, damage), `SOOT_STAIN_CREATED`
  - [ ] **TEST:** Pull force calculation, spiral movement, center damage, entity destruction

### Task 6.5: Tidalwave Power (MODEL + CONTROLLER)
- [ ] Create `src/classes/powers/TidalwavePower.ts` implements IPower
  - [ ] **Behavior:** Defensive wave radiating from queen, pushes ALL non-friendly entities back, deals damage
  - [ ] **Effect:** Knockback enemies, protect queen, zone control
  - [ ] Properties: `pushRadius: number`, `pushStrength: number`, `damage: number`, `waveSpeed: number` (expanding animation)
  - [ ] Methods: `use(queenPos)` → Get all non-faction entities in radius, push away from queen, apply damage
  - [ ] Push mechanic: Calculate vector from queen to each entity using `angleBetween()` and `vectorNormalize()`, apply push force based on distance
  - [ ] Faction check: Use FactionManager.isEnemy() to only push enemies
  - [ ] Use helpers: `distance()`, `angleBetween()`, `vectorNormalize()` for push calculations
  - [ ] Config values: Radius, push strength, damage per level in `entityConfig.ts`
  - [ ] EventBus: Emit `TIDALWAVE_PUSH` (entityId, pushVector, damage)
  - [ ] **TEST:** Push calculation, faction filtering, damage application, radius scaling

### Task 6.6: Final Flash Power (MODEL + CONTROLLER)
- [ ] Create `src/classes/powers/FinalFlashPower.ts` implements IPower
  - [ ] **Behavior:** Ultimate ability, unlocked after all powers are level 3, kills ALL non-friendly entities on screen
  - [ ] **Effect:** Screen-wide instant kill, long cooldown, quest-gated unlock
  - [ ] Properties: `isUnlocked: boolean` (requires quest), `cooldown: number` (very long)
  - [ ] Unlock requirement: Check if all other powers are max level (level 3)
  - [ ] Methods: `use(queenPos)` → Get ALL entities on screen (no range limit), filter by faction, destroy all enemies
  - [ ] Screen check: Use camera bounds or just get all entities from EntityManager
  - [ ] Visual effect: Screen flash, particle effects (renderer handles)
  - [ ] Config values: Cooldown, unlock requirements in `entityConfig.ts`
  - [ ] EventBus: Emit `FINALFLASH_ACTIVATED`, `ENTITY_DESTROYED` for each killed entity
  - [ ] **TEST:** Unlock condition check, screen-wide targeting, faction filtering, cooldown

### Task 6.7: Power Upgrade System (CONTROLLER)
- [ ] Create `src/managers/PowerManager.ts` singleton
  - [ ] Methods: `unlockPower(queenId, powerName)`, `upgradePower(queenId, powerName)`, `canUpgrade(queenId, powerName)`, `getUpgradeCost(powerName, currentLevel)`
  - [ ] Upgrade costs: Resources required per level (from ResourceManager)
  - [ ] Level effects: Damage, radius, duration scale with level (config multipliers)
  - [ ] Quest integration: Track quest completion, unlock Final Flash when conditions met
  - [ ] EventBus: Emit `QUEEN_POWER_UNLOCKED`, `QUEEN_POWER_UPGRADED`, listen for `QUEST_COMPLETED`
  - [ ] **TEST:** Unlock logic, upgrade costs, resource consumption, level scaling

### Task 6.8: Power Keybinds (CONTROLLER)
- [ ] Create `src/managers/InputManager.ts` or extend existing
  - [ ] Keybinds: 1,2,3,4,5 for powers (rebindable via settings)
  - [ ] Properties: `powerKeys: Map<number, string>` (keyCode → powerName)
  - [ ] Methods: `bindPowerKey(keyCode, powerName)`, `handlePowerInput(keyCode)`, `getPowerForKey(keyCode)`
  - [ ] Input flow: Key press → Check if power available → Enter "aim mode" if needed (fireball, blackhole) → Use power
  - [ ] Aim mode: For targeted powers, show ghost circle/indicator at mouse position, click to confirm
  - [ ] EventBus: Listen for `INPUT_KEY_PRESS`, emit `POWER_ACTIVATED` (queenId, powerName, targetPos)
  - [ ] **TEST:** Keybind mapping, power activation, aim mode, rebinding

---

## Phase 7: Rendering Integration (VIEW)

### Task 7.1: Shader System for Faction Recoloring (VIEW)
- [ ] **Option A: GLSL Shaders** (better performance, more complex)
  - [ ] Research p5.js shader API (`createShader()`, `shader()`)
  - [ ] Create `src/rendering/shaders/factionRecolorShader.glsl`
  - [ ] Vertex shader: Pass texture coordinates
  - [ ] Fragment shader: Replace specific color (e.g., white) with faction color
  - [ ] Apply in AntFactory: `sprite.setShader(factionShader, factionColor)`
- [ ] **Option B: p5.js tint()** (simpler, may have performance cost)
  - [ ] In sprite render: `tint(factionColor.r, factionColor.g, factionColor.b)`
  - [ ] Reset tint after drawing: `noTint()`
- [ ] **Recommendation:** Start with Option B (tint), upgrade to Option A if performance issues
- [ ] **TEST:** Color application, multiple factions, sprite rendering

### Task 7.2: Entity Sprite Components (VIEW)
- [ ] Update `src/rendering/components/SpriteComponent.ts` (if exists) or create
  - [ ] Properties: `sprite`, `x`, `y`, `scale`, `rotation`, `tintColor`, `shader`
  - [ ] Methods: `render(graphics)`, `setTint(color)`, `setShader(shader)`, `setPosition(x, y)`
  - [ ] Render: Apply tint/shader if present, draw sprite, reset
  - [ ] EventBus listeners: Update position on `ENTITY_MOVED`
  - [ ] **TEST:** Rendering, tint application, position updates

### Task 7.3: Power Visual Effects (VIEW)
- [ ] Create `src/rendering/effects/` for power effects
  - [ ] **Lightning:** Bolt sprite from queen to target, flash effect, knockback animation
  - [ ] **Fireball:** Projectile sprite with trail, explosion sprite on impact, fire particles for burn
  - [ ] **Blackhole:** Vortex sprite, spiral particle effect, entities pulled visually
  - [ ] **Tidalwave:** Expanding wave sprite, ripple effect, push animation
  - [ ] **FinalFlash:** Screen flash (white overlay fade), particle burst
  - [ ] **Soot stains:** Dark circle sprite on ground, fades over time
  - [ ] All effects registered with Renderer on appropriate layers
  - [ ] EventBus listeners: Create effects on power events
  - [ ] **TEST:** Effect creation, timing, cleanup

### Task 7.4: Vision Cone Visualization (VIEW - Debug)
- [ ] Create debug rendering for boss vision cone
  - [ ] Draw cone shape: Arc from boss position, direction, angle
  - [ ] Use p5.js `arc()` or custom triangle mesh
  - [ ] Color: Semi-transparent red for cone, green for detected entities
  - [ ] Register on `RenderLayer.DEBUG` (only visible when debug mode enabled)
  - [ ] EventBus listener: Update cone on boss direction change
  - [ ] **TEST:** Cone angle accuracy, direction updates, debug toggle

---

## Phase 8: UI Integration (VIEW)

### Task 8.1: Resource Display UI (VIEW)
- [ ] Create `src/rendering/components/ResourceDisplayComponent.ts`
  - [ ] Show resource counts: Food, Wood, Stone, Magic Crystals
  - [ ] Layout: Top-right corner, icon + count for each resource
  - [ ] Methods: `updateResourceCount(type, amount)`, `render(graphics)`
  - [ ] EventBus listener: Update on `RESOURCE_UPDATED` event
  - [ ] Register on `RenderLayer.UI`
  - [ ] **TEST:** Display updates, formatting, positioning

### Task 8.2: Building Placement UI (VIEW)
- [ ] Create `src/rendering/components/BuildingPlacementComponent.ts`
  - [ ] Build menu: Show building icons, costs, availability
  - [ ] Ghost preview: Semi-transparent building sprite follows mouse, snapped to grid
  - [ ] Validation: Green tint = valid placement, Red tint = invalid (blocked, no resources, overlaps)
  - [ ] Methods: `enterPlacementMode(buildingType)`, `exitPlacementMode()`, `validatePlacement(gridX, gridY)`, `placeBuilding()`
  - [ ] Use helpers: `worldToGrid()` for snap, `rectIntersect()` for overlap check
  - [ ] EventBus: Emit `BUILDING_PLACEMENT_REQUESTED` on click
  - [ ] Register on `RenderLayer.UI`
  - [ ] **TEST:** Ghost movement, validation, placement, cancellation

### Task 8.3: Ant State Display (VIEW - Debug)
- [ ] Create debug overlay for ant states
  - [ ] Show state label above ant sprite (e.g., "GATHERING", "IDLE")
  - [ ] Show pathfinding lines (current path as connected line segments)
  - [ ] Show target indicator (arrow pointing to target resource/enemy)
  - [ ] Use p5.js `text()`, `line()` for rendering
  - [ ] Register on `RenderLayer.DEBUG`
  - [ ] EventBus listener: Update on `ANT_STATE_CHANGED`
  - [ ] **TEST:** Label positioning, path visualization, debug toggle

### Task 8.4: Queen Power UI (VIEW)
- [ ] Create `src/rendering/components/PowerBarComponent.ts`
  - [ ] Show power icons: 1,2,3,4,5 with labels (Lightning, Fireball, etc.)
  - [ ] Cooldown overlay: Circular or bar fill showing remaining cooldown
  - [ ] Locked indicator: Grayed out icon for locked powers
  - [ ] Level display: Show power level (1/2/3) on icon
  - [ ] Keybind display: Show "1", "2", etc. on each icon
  - [ ] Methods: `updateCooldown(powerName, remaining)`, `updateLevel(powerName, level)`, `setPowerUnlocked(powerName)`
  - [ ] EventBus listeners: Update on `QUEEN_POWER_USED`, `QUEEN_POWER_UNLOCKED`, `QUEEN_POWER_UPGRADED`
  - [ ] Register on `RenderLayer.UI` (bottom-center)
  - [ ] **TEST:** Cooldown animation, lock state, level display, positioning

### Task 8.5: Ant Cap Display (VIEW - NEW)
- [ ] Add to Resource Display or separate component
  - [ ] Show: "Ants: 15/20" (current/cap)
  - [ ] Update on `ANT_CREATED`, `ANT_DIED`, building level up events
  - [ ] EventBus listener: Update on faction ant count changes
  - [ ] **TEST:** Count accuracy, cap updates from buildings

---

## Phase 9: Testing (TDD + Regression)

---

## Phase 9: Testing (TDD + Regression)

### Task 9.1: Unit Tests - GameObject & Components
- [ ] **GameObject tests** (`test/unit/gameObject.test.ts`)
  - [ ] Creation, ID generation, grid/world position conversion
  - [ ] Component attach/detach lifecycle
  - [ ] Movement, collision detection (use mock components)
  - [ ] Destroy() cleanup, isActive flag
  - [ ] EventBus emissions (ENTITY_MOVED, ENTITY_DESTROYED)
- [ ] **StateMachine tests** (`test/unit/stateMachine.test.ts`)
  - [ ] State transitions, invalid transitions
  - [ ] Event emissions on state change
  - [ ] State history tracking
- [ ] **Pathfinding tests** (`test/unit/pathfindingComponent.test.ts`)
  - [ ] **Reuse existing Pathfinder tests** from `test/unit/pathfinder.test.ts` (already has 20+ tests)
  - [ ] Component-specific: Path following, speed variations, path completion events
  - [ ] Grid integration with PathfindingManager
- [ ] **Health tests** (`test/unit/healthComponent.test.ts`)
  - [ ] Damage, healing, death detection
  - [ ] Regeneration over time
  - [ ] Edge cases (negative damage, overheal, zero health)
- [ ] **Combat tests** (`test/unit/combatComponent.test.ts`)
  - [ ] Attack cooldown timing
  - [ ] Range validation (use `distance()` helper)
  - [ ] Target tracking, clear target
- [ ] **Inventory tests** (`test/unit/inventoryComponent.test.ts`)
  - [ ] Add/remove items, capacity limits
  - [ ] Overflow, underflow handling
  - [ ] Item queries (hasItem, getItemCount)
- [ ] **Vision tests** (`test/unit/visionComponent.test.ts`)
  - [ ] Circle vision range checks (use `distance()` helper)
  - [ ] Cone vision angle math (use `angleBetween()`, `normalizeAngle()` helpers)
  - [ ] Entity detection events
- [ ] **AIBehavior tests** (`test/unit/aiBehaviorComponent.test.ts`)
  - [ ] Autonomous toggle
  - [ ] Priority evaluation (job-specific)
  - [ ] Target selection logic
- [ ] **AntJob tests** (`test/unit/antJobComponent.test.ts`)
  - [ ] Job assignment (Gatherer, Builder, Warrior, Scout)
  - [ ] Priority arrays per job
  - [ ] Hunger mechanics, smell range detection
  - [ ] Task evaluation (queen command override)

### Task 9.2: Unit Tests - Entities
- [ ] **Ant tests** (`test/unit/ant.test.ts`)
  - [ ] Creation with all components
  - [ ] Job switching, autonomous behavior
  - [ ] Queen command override
  - [ ] Hunger → eating behavior
  - [ ] Resource gathering, dropoff cycle
- [ ] **Queen tests** (`test/unit/queen.test.ts`)
  - [ ] Power initialization (all locked, level 0)
  - [ ] Power unlocking, upgrading
  - [ ] Cooldown tracking
  - [ ] Command radius, ant selection
  - [ ] Death triggers game over event
- [ ] **Boss tests** (`test/unit/boss.test.ts`)
  - [ ] Patrol path following
  - [ ] Vision cone detection
  - [ ] Weakest target selection
  - [ ] Projectile firing (homing vs straight)
- [ ] **Resource tests** (`test/unit/resource.test.ts`)
  - [ ] Collection, depletion
  - [ ] Type validation (Food, Wood, etc.)
  - [ ] Smell detection by ants
- [ ] **Building tests** (`test/unit/building.test.ts`)
  - [ ] Construction progress, completion
  - [ ] Leveling system (1-3)
  - [ ] Stat boosts, ant cap increase
  - [ ] Resource generation
  - [ ] Pathfinding blocking (variable sizes)
- [ ] **Projectile tests** (`test/unit/projectile.test.ts`)
  - [ ] Homing movement (turn speed, target tracking)
  - [ ] Straight-line movement
  - [ ] Hit detection, lifetime expiration

### Task 9.3: Unit Tests - Managers
- [ ] **EntityManager tests** (`test/unit/entityManager.test.ts`)
  - [ ] Add/remove entities
  - [ ] Type queries (getEntitiesByType)
  - [ ] Spatial queries (getEntitiesInRadius, getEntitiesInRect) - use helper mocks
  - [ ] Count tracking
- [ ] **FactionManager tests** (`test/unit/factionManager.test.ts`)
  - [ ] Faction creation, ant tracking
  - [ ] Enemy detection (isEnemy)
  - [ ] Ant cap limits, spawn blocking
- [ ] **ResourceManager tests** (`test/unit/resourceManager.test.ts`)
  - [ ] Add/remove resources per faction
  - [ ] Resource checks (hasEnough)
  - [ ] Warehouse integration
  - [ ] UI update events
- [ ] **BuildingManager tests** (`test/unit/buildingManager.test.ts`)
  - [ ] Placement validation
  - [ ] Construction system
  - [ ] Leveling, boost calculation
  - [ ] Pathfinding grid updates
- [ ] **CommandManager tests** (`test/unit/commandManager.test.ts`)
  - [ ] Command issuing
  - [ ] Ant selection in radius
  - [ ] State overrides, autonomous return
- [ ] **PathfindingManager tests** (`test/unit/pathfindingManager.test.ts`)
  - [ ] **Reuse existing Pathfinder tests** - no need to retest A* algorithm
  - [ ] Grid initialization, blocking/unblocking
  - [ ] Building placement updates
- [ ] **PowerManager tests** (`test/unit/powerManager.test.ts`)
  - [ ] Unlock logic, upgrade costs
  - [ ] Resource consumption
  - [ ] Final Flash unlock condition
  - [ ] Level scaling (damage, radius)

### Task 9.4: Unit Tests - Queen Powers
- [ ] **Lightning tests** (`test/unit/lightningPower.test.ts`)
  - [ ] Damage application, knockback calculation
  - [ ] AOE radius, soot stain creation
  - [ ] Level scaling (damage, knockback, radius)
- [ ] **Fireball tests** (`test/unit/fireballPower.test.ts`)
  - [ ] Projectile creation, explosion
  - [ ] Burn status application, damage over time
  - [ ] AOE radius, level scaling
- [ ] **Blackhole tests** (`test/unit/blackholePower.test.ts`)
  - [ ] Pull force calculation (use `angleBetween()`, `vectorNormalize()` helpers)
  - [ ] Spiral movement
  - [ ] Center damage, entity destruction
  - [ ] Duration, level scaling
- [ ] **Tidalwave tests** (`test/unit/tidalwavePower.test.ts`)
  - [ ] Push force calculation
  - [ ] Faction filtering (only push enemies)
  - [ ] Damage application, level scaling
- [ ] **FinalFlash tests** (`test/unit/finalFlashPower.test.ts`)
  - [ ] Unlock condition (all powers level 3)
  - [ ] Screen-wide targeting
  - [ ] Faction filtering
  - [ ] Cooldown

### Task 9.5: Integration Tests - Ant Behavior
- [ ] **Autonomous gather cycle** (`test/integration/antGathering.test.ts`)
  - [ ] Ant detects resource in smell range
  - [ ] Pathfinding to resource
  - [ ] Collection, inventory update
  - [ ] Pathfinding to warehouse
  - [ ] Dropoff, resource added to faction
  - [ ] Repeat cycle
- [ ] **Ant combat** (`test/integration/antCombat.test.ts`)
  - [ ] Enemy detection in vision range
  - [ ] Pathfinding to enemy
  - [ ] Attack, damage application
  - [ ] Death handling, respawn
- [ ] **Queen command override** (`test/integration/queenCommand.test.ts`)
  - [ ] Queen issues command
  - [ ] Ants in radius selected
  - [ ] Autonomous behavior paused
  - [ ] Command executed
  - [ ] Return to autonomous after completion
- [ ] **Hunger system** (`test/integration/antHunger.test.ts`)
  - [ ] Hunger increases over time
  - [ ] Ant seeks food when hungry
  - [ ] Eating reduces hunger
  - [ ] Starvation damage if unfed

### Task 9.6: Integration Tests - Building System
- [ ] **Building placement** (`test/integration/buildingPlacement.test.ts`)
  - [ ] Queen enters build mode
  - [ ] Ghost preview validation
  - [ ] Placement, construction site created
  - [ ] Ants assigned as workers
  - [ ] Construction progress updates
  - [ ] Building completed
  - [ ] Pathfinding grid updated (tiles blocked)
- [ ] **Building leveling** (`test/integration/buildingLeveling.test.ts`)
  - [ ] Resource costs checked
  - [ ] Level up applied
  - [ ] Ant cap increased
  - [ ] Stat boosts updated
  - [ ] Resource production rate increased
- [ ] **Resource generation** (`test/integration/resourceGeneration.test.ts`)
  - [ ] Building generates resources over time
  - [ ] Workers increase generation rate
  - [ ] Resources added to faction pool
  - [ ] UI updates

### Task 9.7: Integration Tests - Boss AI
- [ ] **Patrol behavior** (`test/integration/bossPatrol.test.ts`)
  - [ ] Boss follows patrol path
  - [ ] Reaches waypoints, loops path
  - [ ] No targets, stays in patrol mode
- [ ] **Vision cone detection** (`test/integration/bossVision.test.ts`)
  - [ ] Boss scans with vision cone
  - [ ] Detects ant entering cone
  - [ ] Transitions to attack state
  - [ ] Targets weakest ant in range
- [ ] **Chase and attack** (`test/integration/bossAttack.test.ts`)
  - [ ] Boss chases target
  - [ ] Fires projectile (homing or straight)
  - [ ] Projectile hits, damage applied
  - [ ] Target dies, boss resumes patrol

### Task 9.8: Integration Tests - Queen Powers
- [ ] **Power usage flow** (`test/integration/queenPowers.test.ts`)
  - [ ] Keybind pressed (1-5)
  - [ ] Cooldown checked
  - [ ] Aim mode (fireball, blackhole)
  - [ ] Power executed
  - [ ] Effects created, damage applied
  - [ ] Cooldown started
  - [ ] UI updated
- [ ] **Power progression** (`test/integration/powerProgression.test.ts`)
  - [ ] Power unlocked via quest
  - [ ] Upgrade costs resources
  - [ ] Level effects scale damage/radius
  - [ ] Final Flash unlocks after all powers level 3

### Task 9.9: Regression Testing (CRITICAL)
- [ ] **After EVERY code change, manually test:**
  - [ ] Ant creation, movement, gathering
  - [ ] Queen movement, command issuing, power usage
  - [ ] Building placement, construction, leveling
  - [ ] Boss patrol, detection, attacking
  - [ ] Resource collection, UI updates
  - [ ] Pathfinding around buildings
  - [ ] Faction colors display correctly
  - [ ] No rendering errors, no EventBus leaks
- [ ] **Create regression test suite** for common bugs
- [ ] **Performance testing** - entity count, pathfinding load

---

## Phase 10: Polish & Optimization (Optional)

### Task 10.1: Entity Pooling
- [ ] Object pool for projectiles, effects
  - [ ] Reuse destroyed entities instead of creating new
  - [ ] Pool manager for each entity type
  - [ ] Reduce garbage collection pressure
- [ ] **TEST:** Pool reuse, no memory leaks

### Task 10.2: Spatial Partitioning
- [ ] Quadtree or grid-based spatial index
  - [ ] Optimize `getEntitiesInRadius()` for large entity counts
  - [ ] Update index on entity movement
  - [ ] Trade memory for speed
- [ ] **TEST:** Query performance, correctness

### Task 10.3: Performance Profiling
- [ ] Measure entity update loop
  - [ ] Component update times
  - [ ] EventBus emission overhead
  - [ ] Rendering bottlenecks
  - [ ] Pathfinding cost
- [ ] Optimize: Skip inactive components, batch events, cache calculations
- [ ] **TEST:** Frame rate with 100+ entities

---

## Summary: What We're Building

### **Architecture: MVC + Component System**
- **Model:** Pure data classes (`GameObject`, `Ant`, `Queen`, etc.) with EventBus emissions
- **View:** Factory pattern + Renderer (developers never write rendering code)
- **Controller:** Managers orchestrate logic via EventBus
- **Components:** Pluggable behaviors (Pathfinding, Health, Combat, etc.)
- **Testing:** Every layer independently testable, loose coupling

### **Key Systems:**
1. **Existing Pathfinder** - Reuse `Pathfinder.ts` A* algorithm (fully tested, production-ready)
2. **Job System** - 4 job types (Gatherer, Builder, Warrior, Scout) with priority arrays
3. **Hunger System** - Ants eat food to survive, starvation causes damage
4. **Queen Powers** - 5 powers (Lightning, Fireball, Blackhole, Tidalwave, FinalFlash) with unlocking/upgrading
5. **Building System** - Variable sizes, construction, 3 levels, stat boosts, pathfinding blocking
6. **Boss AI** - Patrol + vision cone + weakest target selection
7. **Faction System** - Teams with colors, ant caps, enemy detection
8. **Resource System** - 4 types (Food, Wood, Stone, MagicCrystals), warehouse storage

### **Configuration-First (CRITICAL):**
**ALL values in `entityConfig.ts`:**
- Ant stats (health, speed, vision, attack, gather rate, smell range) per job
- Job priorities (order arrays for each job type)
- Queen powers (damage, cooldowns, AOE radii, knockback, pull strength, burn duration, etc.)
- Power upgrades (level 1-3 scaling factors)
- Boss stats (vision cone angle/distance, patrol speed, projectile speed/type)
- Resource types (spawn rates, stack amounts, collision sizes)
- Building types (sizes, costs, level boosts, production rates)
- Hunger rates, starvation damage
- **NO HARDCODED VALUES** in code - everything in config

### **Helper Function Reuse (DRY Principle):**
**Existing helpers from `helpers.ts`:**
- Grid: `worldToGrid()`, `gridToWorld()`, `gridToWorldCenter()`, `getNeighbors4()`, `getNeighbors8()`
- Collision: `rectIntersect()`, `circleIntersect()`, `pointInCircle()`, `pointInRect()`
- Math: `distance()`, `angleBetween()`, `manhattanDistance()`, `vectorNormalize()`, `vectorLimit()`, `vectorMagnitude()`
- Angles: `degToRad()`, `radToDeg()`, `normalizeAngle()`
- Utilities: `clamp()`, `lerp()`, `mapRange()`, `randomInt()`, `randomFloat()`, `randomChoice()`
- **ALWAYS check helpers.ts before implementing math/collision** - no duplication

### **Testing Strategy:**
- **TDD:** Write tests first, then implementation
- **Unit tests:** Each component/manager/entity independently
- **Integration tests:** Full behavior flows (gathering, combat, building, etc.)
- **Regression tests:** Manual + automated after every change
- **Mock helpers:** Reusable test stubs in `test/helpers/`

### **EventBus Usage:**
- Entity lifecycle (created, moved, destroyed)
- State changes (ant states, power usage, building progress)
- Combat (attacks, damage, deaths)
- Resources (collected, deposited, generated)
- Commands (queen → ants)
- UI updates (resource counts, cooldowns, ant caps)
- **Loose coupling** - models don't know about views

### **Rendering (Hidden from Game Logic):**
- Factories handle sprite registration
- Renderer manages layers, depth sorting, dirty flags
- Components never touch p5.js directly
- Shaders/tints for faction colors
- Effects for powers (lightning, explosion, blackhole, wave, flash)
- Debug layer for vision cones, states, paths

### **Biggest Implementation Challenges:**
1. **A* Pathfinding** - ✅ **ALREADY DONE** (reuse `Pathfinder.ts`)
2. **Component Update Order** - AI → State → Pathfinding → Combat → Health
3. **Vision Cone Math** - Use `angleBetween()`, `normalizeAngle()` helpers
4. **Blackhole Pull** - Spiral math using tangential velocity + radial pull
5. **Job Priority System** - Array-based priority evaluation each tick
6. **Building Variable Sizes** - Mark multiple grid cells as blocked
7. **Power Level Scaling** - Config multipliers per level (e.g., damage * 1.5 at level 2)

### **Development Order (Recommended):**
1. **Phase 1-2:** Core foundation (GameObject, Components, EntityManager)
2. **Phase 3-4:** Ant class + AntFactory (simplest entity)
3. **Phase 5:** Pathfinding, Resource, Faction managers
4. **Phase 3-4:** Queen + QueenFactory (player control)
5. **Phase 6:** Queen powers (Lightning → Fireball → Tidalwave → Blackhole → FinalFlash)
6. **Phase 3-4:** Building + BuildingFactory (construction system)
7. **Phase 3-4:** Boss + BossFactory (AI system)
8. **Phase 7-8:** Rendering, UI, effects
9. **Phase 9:** Testing (unit + integration)
10. **Phase 10:** Polish, optimization

**Ready to start implementation?**

