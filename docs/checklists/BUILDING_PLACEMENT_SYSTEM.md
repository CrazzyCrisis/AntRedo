# Building Placement System Implementation Checklist

## Overview
Implement comprehensive building placement system with UI menu, ghost preview, terrain/resource validation, construction workflow, and builder AI integration.

---

## Phase 1: Configuration & Data Structures ✅ PARTIALLY EXISTS

### 1.1 Building Configuration (NEW FILE NEEDED)
**File:** `src/config/buildingConfig.ts`

- [ ] Create building placement configuration
  - [ ] Define `BUILDING_PLACEMENT_CONFIG` with per-building properties:
    - `allowedTerrain: TileType[]` - Whitelist of valid terrain types
    - `constructionSprite: string` - Path to construction site sprite
    - `completedSprite: string` - Path to finished building sprite
    - `unlocked: boolean` - Quest progression flag (default `true` for now)
  - [ ] Import from `entityConfig.ts`: `BUILDINGS` (has size, costs, constructionTime already)
  - [ ] Export combined config for easy access

**Existing Resources:**
- ✅ `ENTITY_CONFIG.BUILDINGS` has: size, costs, constructionTime, levels
- ✅ `TileType` enum exists in `src/world/TileSystem.ts`
- ✅ Sprite paths pattern exists in `src/config/spriteMapping.ts`

**Dependencies:** None (foundational file)

---

### 1.2 Quest Manager Stub (NEW FILE NEEDED)
**File:** `src/managers/QuestManager.ts`

- [ ] Create minimal `QuestManager` singleton extending `BaseManager`
- [ ] Add stub method: `unlockBuilding(buildingType: BuildingType): void`
  - [ ] Emit `GameEvents.BUILDING_UNLOCKED` event
- [ ] Add stub method: `isBuildingUnlocked(buildingType: BuildingType): boolean`
  - [ ] Returns `BUILDING_PLACEMENT_CONFIG[type].unlocked`
- [ ] Add placeholder for future quest tracking
- [ ] Register in barrel exports (`src/imports/managerImports.ts`)

**Existing Resources:**
- ✅ `BaseManager` pattern exists - follow same structure
- ✅ EventBus infrastructure ready

**Dependencies:** `buildingConfig.ts` (1.1)

---

### 1.3 Add Building Events (UPDATE EXISTING)
**File:** `src/utils/eventBus.ts`

- [ ] Add new GameEvents constants:
  - `BUILDING_MENU_TOGGLED: 'building:menu:toggled'`
  - `BUILDING_SELECTED: 'building:selected'` (emits buildingType)
  - `BUILDING_PLACEMENT_INVALID: 'building:placement:invalid'` (emits reason, position)
  - `CONSTRUCTION_SITE_CREATED: 'construction:site:created'` (emits buildingId, position, type, size)

**Existing Resources:**
- ✅ Many building events already exist (`BUILDING_PLACED`, `BUILDING_COMPLETED`, etc.)
- ✅ Event naming convention established

**Dependencies:** None (foundational file)

---

## Phase 2: UI Components 🆕 ALL NEW

### 2.1 Building Menu Component (NEW FILE)
**File:** `src/rendering/components/BuildingMenuComponent.ts`

- [ ] Create `BuildingMenuComponent implements Renderable`
- [ ] Constructor: `(x: number, y: number, factionId: string)`
- [ ] Layout:
  - [ ] Vertical list above build button position
  - [ ] Each entry shows: icon, name, resource costs (icon × amount per resource)
  - [ ] Use `drawUIPanel()` helper for background
- [ ] Building buttons:
  - [ ] Query `QuestManager.isBuildingUnlocked()` for each building
  - [ ] Check `ResourceManager.hasResources()` for cost display
  - [ ] Visual states: locked (grayed + padlock 🔒), insufficient resources (yellow cost text), affordable (green cost text)
- [ ] Interaction:
  - [ ] `handleClick(x, y)` - emit `BUILDING_SELECTED` on click
  - [ ] `handleMouseMove(x, y)` - hover highlighting
  - [ ] `show()` / `hide()` methods
- [ ] Resource icons:
  - [ ] Load sprites from `assets/images/resources/` (wood.png, stone.png, etc.)
  - [ ] Scale to 16x16 for UI display

**Existing Resources:**
- ✅ `QueenCommandsComponent` shows similar button grid pattern
- ✅ `drawUIPanel()`, `isPointInRect()`, `getButtonStateColor()` helpers exist
- ✅ `ResourceDisplayComponent` shows resource icon rendering
- ✅ Resource sprites exist in `assets/images/resources/`

**Dependencies:** `buildingConfig.ts` (1.1), `QuestManager` (1.2), Building events (1.3)

---

## Phase 3: Building Placement Manager 🆕 NEW

### 3.1 Building Placement Manager (NEW FILE)
**File:** `src/managers/BuildingPlacementManager.ts`

- [ ] Create `BuildingPlacementManager` singleton extending `BaseManager`
- [ ] State tracking:
  - [ ] `isPlacementActive: boolean`
  - [ ] `currentBuildingType: BuildingType | null`
  - [ ] `ghostSprite: SpriteComponent | null`
  - [ ] `currentGridX/Y: number` (snapped ghost position)
  - [ ] `validationState: 'valid' | 'invalid_terrain' | 'invalid_collision' | 'insufficient_resources'`
- [ ] Event subscriptions:
  - [ ] `BUILDING_SELECTED` → activate placement mode, create ghost
  - [ ] `INPUT_MOUSE_MOVE` → update ghost position (screen→world→grid conversion)
  - [ ] `INPUT_MOUSE_CLICK` → attempt placement
  - [ ] `INPUT_KEY_PRESS` (ESC/right-click) → cancel placement
- [ ] Core methods:
  - [ ] `activatePlacement(buildingType: BuildingType)` - create ghost sprite
  - [ ] `updateGhostPosition(screenX, screenY)` - snap to grid, run validation
  - [ ] `validatePlacement(gridX, gridY): ValidationResult` - check terrain + resources + collision
  - [ ] `attemptPlacement(gridX, gridY)` - place or show error
  - [ ] `cancelPlacement()` - destroy ghost, emit cancel event
- [ ] Multi-tile validation:
  - [ ] Loop through all tiles in building footprint (e.g., 2x2)
  - [ ] Check each tile against `allowedTerrain` whitelist (query `TileGrid`)
  - [ ] Check for building collision (query existing buildings via `BuildingManager`)
  - [ ] Ghost tint: RED (terrain/collision), YELLOW (insufficient resources), GREEN (valid)
- [ ] Ghost rendering:
  - [ ] Create semi-transparent `SpriteComponent` (alpha 128)
  - [ ] Render on `RenderLayer.ABOVE_ENTITIES` for visibility
  - [ ] Scale to match building footprint (2x2 tiles = 64x64 pixels at TILE_SIZE=32)
  - [ ] Center sprite on footprint middle (gridX + width/2, gridY + height/2)

**Existing Resources:**
- ✅ `BaseManager` pattern
- ✅ `SpriteComponent` with `setTint()` method
- ✅ `Camera.screenToWorld()` for coordinate conversion
- ✅ `helpers.ts` has `worldToGrid()`, `gridToWorld()` functions
- ✅ `BuildingManager.getAllBuildings()` for collision checks
- ✅ `TileGrid` exists for terrain queries

**Dependencies:** `buildingConfig.ts` (1.1), `QuestManager` (1.2), Building events (1.3)

---

### 3.2 Placement Validation & Feedback (EXTEND EXISTING)
**Files:** `BuildingPlacementManager.ts`, `AudioManager.ts`, `ParticleSystem.ts`

- [ ] Invalid placement handling in `BuildingPlacementManager`:
  - [ ] On invalid click, emit `BUILDING_PLACEMENT_INVALID` with reason + position
  - [ ] Reasons: `'invalid_terrain'`, `'invalid_collision'`, `'insufficient_resources'`
- [ ] Audio feedback in `AudioManager`:
  - [ ] Subscribe to `BUILDING_PLACEMENT_INVALID`
  - [ ] Play error sound (use existing error sound or add new one to `audioConfig.ts`)
- [ ] Visual feedback in `ParticleSystem`:
  - [ ] Subscribe to `BUILDING_PLACEMENT_INVALID`
  - [ ] Spawn floating text at ghost center position:
    - Invalid terrain: Red text "Invalid Terrain"
    - Invalid collision: Red text "Location Blocked"
    - Insufficient resources: Yellow text "Need 20 Wood, 10 Stone"
  - [ ] Text floats upward for 2 seconds, fades out
- [ ] Valid placement:
  - [ ] Emit `BUILDING_CONSTRUCTION_STARTED` with buildingType, gridX, gridY, factionId
  - [ ] Call `ResourceManager.removeResources()` to consume costs
  - [ ] Destroy ghost sprite
  - [ ] Deactivate placement mode

**Existing Resources:**
- ✅ `AudioManager` already handles sound playback
- ✅ `ParticleSystem` already has floating text methods
- ✅ `ResourceManager.hasResources()` and `.removeResources()` exist

**Dependencies:** BuildingPlacementManager (3.1)

---

## Phase 4: Construction Workflow 🔧 UPDATE EXISTING

### 4.1 Update Building Class (UPDATE EXISTING)
**File:** `src/classes/Building.ts`

- [ ] Add `factionId: string` property (needed for resource tracking)
- [ ] Verify `isConstructed` flag works correctly
- [ ] Verify `constructionProgress` (0-100) tracking
- [ ] Verify `getOccupiedTiles()` returns all footprint tiles
- [ ] Add `setSprite(sprite: any)` method for sprite swapping (if not exists)

**Existing Resources:**
- ✅ Building class has most required properties
- ✅ `startConstruction()`, `addProgress()`, `completeConstruction()` exist
- ✅ `getOccupiedTiles()` already calculates multi-tile footprint

**Dependencies:** None (existing file)

---

### 4.2 Update BuildingFactory (UPDATE EXISTING)
**File:** `src/factories/BuildingFactory.ts`

- [ ] Add `factionId` parameter to `create()` method
- [ ] Pass `factionId` to Building constructor
- [ ] Update construction site sprite:
  - [ ] Use simple box sprite (magenta placeholder or create brown box)
  - [ ] Scale sprite to match building footprint size (2x2 → 64x64px)
- [ ] Emit `CONSTRUCTION_SITE_CREATED` event with:
  - `{ buildingId, gridX, gridY, buildingType, sizeWidth, sizeHeight, factionId }`
- [ ] Listen to `BUILDING_COMPLETED` to swap to final sprite (already exists ✅)

**Existing Resources:**
- ✅ BuildingFactory already handles sprite swapping on completion
- ✅ Multi-tile positioning already centered correctly
- ✅ Pathfinding block events already emitted

**Dependencies:** Building class updates (4.1)

---

### 4.3 Update BuildingManager (UPDATE EXISTING)
**File:** `src/managers/BuildingManager.ts`

- [ ] Update `placeConstructionSite()` method:
  - [ ] Accept `factionId` parameter
  - [ ] Validate resources via `ResourceManager.hasResources()`
  - [ ] Consume resources via `ResourceManager.removeResources()`
  - [ ] Call `BuildingFactory.create()` with all parameters
  - [ ] Return created Building entity
- [ ] Listen to `BUILDING_CONSTRUCTION_STARTED` event:
  - [ ] Extract parameters, call `placeConstructionSite()`
- [ ] Verify `update()` method handles construction progress (already exists ✅)

**Existing Resources:**
- ✅ `placeConstructionSite()` method exists, just needs updates
- ✅ `update()` already increments construction progress from workers
- ✅ Resource validation pattern already in place

**Dependencies:** BuildingFactory updates (4.2), Placement Manager (3.1)

---

## Phase 5: Builder AI Integration 🤖 UPDATE EXISTING

### 5.1 Update AntJobComponent (UPDATE EXISTING)
**File:** `src/classes/components/AntJobComponent.ts`

- [ ] Verify builder job exists: `AntJobComponent.JOB_BUILDER`
- [ ] Subscribe to `CONSTRUCTION_SITE_CREATED` event
- [ ] Builder behavior:
  - [ ] Calculate distance to all construction sites
  - [ ] Pathfind to closest site
  - [ ] When adjacent, play `build` animation (from `animationConfig.ts`)
  - [ ] Increment construction progress while building
- [ ] Interrupt conditions:
  - [ ] Construction complete → find new site
  - [ ] Queen command issued → follow queen's orders (higher priority)
  - [ ] Combat started → defend colony (check priority array)

**Existing Resources:**
- ✅ `JOB_BUILDER` exists in `AntJobComponent`
- ✅ Animation config has `build` animation: `ANT_ANIMATIONS.BUILDER.build`
- ✅ Priority system exists: `ENTITY_CONFIG.ANT.JOB_PRIORITIES.builder`
- ✅ Pathfinding system integrated via `PathfindingComponent`

**Dependencies:** Construction workflow (4.1-4.3)

---

### 5.2 Verify Pathfinding Blocks Buildings (VERIFY EXISTING)
**File:** `src/managers/PathfindingManager.ts`

- [ ] Verify `BUILDING_PATHFINDING_BLOCK` listener works
- [ ] Verify `BUILDING_PATHFINDING_UNBLOCK` listener works
- [ ] Test that buildings block ant pathfinding correctly
- [ ] Confirm multi-tile buildings block all occupied tiles

**Existing Resources:**
- ✅ PathfindingManager already listens to building block events
- ✅ `markBlocked()` and `markWalkable()` methods exist

**Dependencies:** None (verification task)

---

## Phase 6: UI Integration 🖥️ UPDATE EXISTING

### 6.1 Update GameUIOverlay (UPDATE EXISTING)
**File:** `src/rendering/overlays/GameUIOverlay.ts`

- [ ] Add `buildingMenu: BuildingMenuComponent | null` property
- [ ] Initialize building menu in `initialize()` method:
  - [ ] Position above existing command buttons (use layout offset)
  - [ ] Start hidden (call `.hide()`)
  - [ ] Register with renderer on `RenderLayer.UI`
- [ ] Update `handleMouseClick()`:
  - [ ] Forward clicks to building menu when visible
- [ ] Update `handleMouseMove()`:
  - [ ] Forward mouse moves to building menu for hover effects
- [ ] Add `toggleBuildingMenu()` method:
  - [ ] Show/hide menu
  - [ ] Emit `BUILDING_MENU_TOGGLED` event
- [ ] Cleanup in `cleanup()`: unregister building menu

**Existing Resources:**
- ✅ GameUIOverlay already manages multiple UI components
- ✅ `QueenCommandsComponent` integration shows pattern
- ✅ Click/move forwarding already implemented

**Dependencies:** BuildingMenuComponent (2.1)

---

### 6.2 Wire Build Button (UPDATE EXISTING)
**File:** `src/rendering/components/QueenCommandsComponent.ts`

- [ ] Update `selectCommand()` method for BUILD command:
  - [ ] Emit `BUILDING_MENU_TOGGLED` event instead of queen command
  - [ ] Don't set as selected command (menu handles selection)
- [ ] Or: Keep BUILD as normal command, emit separate event for menu toggle
  - [ ] Option: Double-click BUILD opens menu, single-click issues build command

**Existing Resources:**
- ✅ BUILD command button already exists in `QueenCommandsComponent`
- ✅ Click handling already wired up

**Dependencies:** GameUIOverlay updates (6.1)

---

### 6.3 Update DevRoomScene (UPDATE EXISTING)
**File:** `src/scenes/DevRoomScene.ts`

- [ ] Subscribe to `BUILDING_MENU_TOGGLED`:
  - [ ] Call `GameUIOverlay.toggleBuildingMenu()`
- [ ] Subscribe to `BUILDING_SELECTED`:
  - [ ] Hide building menu
  - [ ] Activate `BuildingPlacementManager`
- [ ] Update `handleMouseMove()`:
  - [ ] Forward to `BuildingPlacementManager.updateGhostPosition()` when placement active
- [ ] Update `handleMouseClick()`:
  - [ ] Forward to `BuildingPlacementManager.attemptPlacement()` when placement active
- [ ] Subscribe to input events for cancel (ESC/right-click):
  - [ ] Call `BuildingPlacementManager.cancelPlacement()`

**Existing Resources:**
- ✅ DevRoomScene already forwards mouse events to UI overlay
- ✅ Input event subscriptions already set up

**Dependencies:** BuildingPlacementManager (3.1), GameUIOverlay (6.1)

---

## Phase 7: Testing & Polish 🧪

### 7.1 Unit Tests
- [ ] Test `BuildingPlacementManager.validatePlacement()`:
  - [ ] Valid placement on allowed terrain
  - [ ] Invalid terrain rejection
  - [ ] Collision detection with existing buildings
  - [ ] Resource validation
- [ ] Test `QuestManager.isBuildingUnlocked()`
- [ ] Test multi-tile footprint validation (2x2, 3x3)

### 7.2 Integration Tests
- [ ] Test full placement flow: menu → select → ghost → place → construction
- [ ] Test resource deduction on placement
- [ ] Test builder AI responds to construction sites
- [ ] Test pathfinding avoids buildings
- [ ] Test ghost tinting (red/yellow/green) based on validation state
- [ ] Test construction completion sprite swap

### 7.3 Visual Polish
- [ ] Tune ghost sprite transparency
- [ ] Adjust floating text font size/duration
- [ ] Verify resource icon scaling in menu
- [ ] Test on different screen resolutions
- [ ] Verify multi-tile building centering looks correct

---

## Dependencies Summary

**Phase Order:**
1. **Phase 1** (Config & Data) → Foundation for everything
2. **Phase 2** (UI Components) → Depends on Phase 1
3. **Phase 3** (Placement Manager) → Depends on Phase 1, uses Phase 2
4. **Phase 4** (Construction) → Depends on Phase 3
5. **Phase 5** (Builder AI) → Depends on Phase 4
6. **Phase 6** (UI Integration) → Depends on Phase 2, 3
7. **Phase 7** (Testing) → Depends on all previous phases

**Critical Path:** 1 → 3 → 4 → 5 (Core gameplay loop)
**Parallel Work:** Phase 2 (UI) can be developed alongside Phase 3

---

## Notes

### Existing Systems to Leverage
- ✅ `BaseManager` pattern for all managers
- ✅ `EventBus` + `GameEvents` for communication
- ✅ `helpers.ts` has extensive utilities (grid conversion, collision, UI rendering)
- ✅ `ResourceManager` handles resource tracking
- ✅ `PathfindingManager` already blocks buildings
- ✅ `BuildingFactory` handles rendering setup
- ✅ `AnimatedSpriteSheetComponent` has build animations
- ✅ Config-first philosophy established

### New Patterns Introduced
- 🆕 Ghost preview with validation tinting
- 🆕 UI menu with resource cost display
- 🆕 Multi-tile building validation
- 🆕 Quest-based unlock system (stub)
- 🆕 Construction site workflow

### Future Enhancements (Not in Scope)
- Quest system implementation (unlock buildings via quests)
- Building leveling UI
- Construction progress bars
- Multiple construction sprite stages
- Advanced builder AI (priority system, multiple sites)
- Warehouse resource storage limits
- Building special abilities (tower defense, etc.)
