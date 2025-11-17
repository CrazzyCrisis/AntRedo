/**
 * DevRoomScene - Development/testing room for world generation
 * Loads a procedurally generated world and displays it
 */

import {
    Renderer,
    EventBus,
    GameEvents,
    GameStateManager,
    AudioManager,
    WorldGenerator,
    SpawnManager,
    LevelLoader,
    TileGrid,
    RenderLayer,
    ButtonComponent,
    DEV_ROOM_CONFIG,
    TILE_CONFIG,
    updateMaterialPriorities,
    CONFIG,
    WorldPresetManager,
    WorldPreset,
    PauseMenuScene,
    InputManager,
    WorldGenConfigMenu,
    EntityManager,
    CameraManager,
    Building,
    BuildingFactory,
    AntFactory,
    PathfindingManager
} from '../imports/sceneImports';
import { BaseScene } from './BaseScene';
import { ENTITY_CONFIG } from '../config/gameplay/entityConfig';
import { ResourceManager } from '../managers/ResourceManager';
import { CombatVisualHandler } from '../managers/CombatVisualHandler';
import { CombatManager } from '../managers/CombatManager';
import { ParticleSystem } from '../managers/ParticleSystem';
import { TileRenderer, TileRenderConfig } from '../world/TileRenderer';
import { GameUIOverlay } from '../rendering/overlays/GameUIOverlay';
import { PathVisualizerComponent } from '../rendering/components/PathVisualizerComponent';
import { PathfindingComponent } from '../classes/components/PathfindingComponent';
import { TileHighlightComponent } from '../rendering/components/TileHighlightComponent';
import { DEV_ROOM_SPAWN_CONFIG } from '../config/gameplay/devRoomSpawnConfig';
import { TILE_SIZE } from '../world/TileSystem';
import { ConstructionManager } from '../managers/ConstructionManager';
import { QuestManager } from '../managers/QuestManager';
import { BuildingManager } from '../managers/BuildingManager';

export class DevRoomScene extends BaseScene {
    private backButton: ButtonComponent | null = null;
    private unregisterFunctions: Array<() => void> = [];
    private gameState: GameStateManager;
    private worldGenerator: WorldGenerator;
    private backButtonImg: any;
    private tileSprites: { [key: number]: any };
    private tileEdgeSprites: { [path: string]: any };
    private currentWorldSeed: number = 0;
    private currentMapData: any[][] | null = null;
    private isPaused: boolean = false;
    private pauseMenu: PauseMenuScene | null = null;
    private inputManager: InputManager;
    private worldGenConfigMenu: WorldGenConfigMenu | null = null;
    private tileRendererUnregister: (() => void)[] = [];
    private uiOverlay: GameUIOverlay | null = null;
    private playerQueen: any | null = null; // Reference to player's queen for click commands
    private tileHighlight: TileHighlightComponent | null = null; // Visual tile highlight for debugging
    private hoveredEntityId: string | null = null; // Track currently hovered entity for outline
    
    // Spawning system
    private spawnManager: SpawnManager | null = null;
    
    // Building system
    private constructionManager: ConstructionManager | null = null;
    private isBuildingPlacementActive: boolean = false;
    private levelLoader: LevelLoader | null = null;
    private entitySprites: {
        ant: any;
        queen: any;
        boss: any;
        building: any;
        hill1?: any;
        hill2?: any;
        hive1?: any;
        hive2?: any;
        cone1?: any;
        cone2?: any;
        resources: {
            food: any;
            wood: any;
            stone: any;
            magicCrystal: any;
        };
    } | null = null;
    private entitySpritesheets: {
        default?: any;
        warrior?: any;
        scout?: any;
        builder?: any;
        farmer?: any;
    } | null = null;
    
    // Enemy building tracking
    private enemyBuildings: Array<{ building: Building; spawnTimer: number; spawnInterval: number }> = [];
    
    // Tile colors from config (fallback)
    private tileColors: { [key: number]: string };

    constructor(
        renderer: Renderer, 
        canvasWidth: number, 
        canvasHeight: number, 
        backButtonImg: any, 
        tileSprites: { [key: number]: any }, 
        tileEdgeSprites: { [path: string]: any },
        entitySprites: { 
            ant: any; 
            queen: any; 
            boss: any; 
            building: any;
            hill1?: any;
            hill2?: any;
            hive1?: any;
            hive2?: any;
            cone1?: any;
            cone2?: any;
            resources: { 
                food: any; 
                wood: any; 
                stone: any; 
                magicCrystal: any; 
            };
        } | null,
        entitySpritesheets?: {
            default?: any;
            warrior?: any;
            scout?: any;
            builder?: any;
            farmer?: any;
        } | null
    ) {
        super(renderer, canvasWidth, canvasHeight);
        
        this.backButtonImg = backButtonImg;
        this.tileSprites = tileSprites;
        this.tileEdgeSprites = tileEdgeSprites;
        this.entitySprites = entitySprites;
        this.entitySpritesheets = entitySpritesheets || null;
        this.gameState = GameStateManager.getInstance();
        this.worldGenerator = new WorldGenerator();
        this.inputManager = InputManager.getInstance();
        
        // Initialize building system managers (singletons - no need to store references)
        QuestManager.getInstance();
        this.constructionManager = ConstructionManager.getInstance();
        BuildingManager.getInstance();
        
        // Initialize pathfinding manager (listens for WORLD_GENERATED and BUILDING_PATHFINDING_BLOCK events)
        PathfindingManager.getInstance();
        
        // Initialize combat system for automatic melee attacks
        CombatManager.getInstance();
        
        // Initialize combat visual handler for sprite animations, camera shake, sounds
        CombatVisualHandler.getInstance();
        
        // Initialize particle system for combat impact effects
        ParticleSystem.getInstance().initialize(renderer);
        
        // Initialize tile colors from config (used only if sprites disabled)
        this.tileColors = TILE_CONFIG.COLORS;
    }

    enter(): void {
        // Start dev room music
        AudioManager.getInstance().playBGM('DEV_ROOM_THEME', true);
        
        // Initialize player faction resources with starting values from config
        const resourceManager = ResourceManager.getInstance();
        resourceManager.initializeFaction('player');
        if (DEV_ROOM_CONFIG.STARTING_RESOURCES) {
            resourceManager.setResource('player', 'food', DEV_ROOM_CONFIG.STARTING_RESOURCES.FOOD);
            resourceManager.setResource('player', 'wood', DEV_ROOM_CONFIG.STARTING_RESOURCES.WOOD);
            resourceManager.setResource('player', 'stone', DEV_ROOM_CONFIG.STARTING_RESOURCES.STONE);
            resourceManager.setResource('player', 'magicCrystal', DEV_ROOM_CONFIG.STARTING_RESOURCES.MAGIC_CRYSTAL);
            console.log(`[DevRoom] Initialized colony with ${DEV_ROOM_CONFIG.STARTING_RESOURCES.FOOD} food for healing system testing`);
        }
        
        // Subscribe to building system events
        this.unregisterFunctions.push(
            EventBus.on(GameEvents.BUILDING_MENU_TOGGLED, () => {
                // Building menu visibility toggled - no action needed here
                // GameUIOverlay handles the menu component
            })
        );
        
        this.unregisterFunctions.push(
            EventBus.on(GameEvents.BUILDING_SELECTED, (buildingType: string) => {
                console.log(`[DevRoom] Building selected: ${buildingType}`);
                this.isBuildingPlacementActive = true;
                this.buildingPlacementManager.activatePlacement(buildingType as any);
            })
        );
        
        this.unregisterFunctions.push(
            EventBus.on(GameEvents.BUILDING_PLACEMENT_CANCELLED, () => {
                console.log('[DevRoom] Building placement cancelled');
                this.isBuildingPlacementActive = false;
            })
        );
        
        // Subscribe to mouse movement for ghost sprite updates
        this.unregisterFunctions.push(
            EventBus.on(GameEvents.INPUT_MOUSE_MOVE, (x: number, y: number) => {
                if (this.isBuildingPlacementActive && this.buildingPlacementManager) {
                    this.buildingPlacementManager.updateGhostPosition(x, y);
                }
            })
        );
        
        // Subscribe to mouse clicks for placement confirmation
        this.unregisterFunctions.push(
            EventBus.on(GameEvents.INPUT_MOUSE_CLICK, (x: number, y: number, button: number) => {
                if (this.isBuildingPlacementActive && button === 0) {
                    console.log(`[DevRoom] Mouse click detected at (${x}, ${y}), button: ${button}`);
                    console.log(`[DevRoom] Calling attemptPlacement...`);
                    this.buildingPlacementManager.attemptPlacement();
                }
            })
        );
        
        this.unregisterFunctions.push(
            EventBus.on(GameEvents.BUILDING_CONSTRUCTION_STARTED, () => {
                console.log('[DevRoom] Building construction started');
                this.isBuildingPlacementActive = false;
            })
        );
        
        // Check if user provided a custom seed via URL parameter or config
        const urlParams = typeof window !== 'undefined' && window.location 
            ? new URLSearchParams(window.location.search) 
            : new URLSearchParams('');
        const urlSeed = urlParams.get('seed');
        const customSeed = urlSeed ? parseInt(urlSeed) : null;
        
        // Generate world using config parameters
        this.worldGenerator.setNoiseScale(DEV_ROOM_CONFIG.WORLD.NOISE_SCALE);
        
        // Initialize material priorities from config
        updateMaterialPriorities(this.worldGenerator.getConfig());
        
        // Use custom seed if provided, otherwise use system time
        const seed = customSeed !== null ? customSeed : Date.now();
        this.currentWorldSeed = seed;
        
        const worldData = this.worldGenerator.generate(
            DEV_ROOM_CONFIG.WORLD.WIDTH,
            DEV_ROOM_CONFIG.WORLD.HEIGHT,
            seed
        );
        
        // Store map data for preset saving
        this.currentMapData = worldData;
        
        const tileGrid = new TileGrid(worldData);
        
        // Store in game state
        this.gameState.setTileGrid(tileGrid);
        
        // Initialize PathfindingManager with the same grid
        PathfindingManager.getInstance().initializeFromTileGrid(worldData);
        console.log(`[DevRoom] ✅ PathfindingManager initialized with grid`);
        
        // Initialize BuildingPlacementManager using BaseScene helper
        if (this.entitySprites?.hill1 && this.entitySprites?.hive1 && this.entitySprites?.cone1) {
            this.initializeBuildingPlacement(tileGrid, 'player', {
                warehouse: this.entitySprites.hill1,
                barracks: this.entitySprites.hive1,
                tower: this.entitySprites.cone1
            });
            
            // Initialize BuildingManager with renderer and building sprites (ALL 12 BUILDINGS)
            const buildingManager = BuildingManager.getInstance();
            buildingManager.initialize(this.renderer, {
                construction: new Map([
                    // Original 3
                    ['warehouse', this.entitySprites.hill1],
                    ['barracks', this.entitySprites.hive1],
                    ['tower', this.entitySprites.cone1],
                    // Storage (1)
                    ['nest', this.entitySprites.hive2],
                    // Spawners (3)
                    ['builderHut', this.entitySprites.hill2],
                    ['gathererHut', this.entitySprites.hive1],
                    ['spitterHut', this.entitySprites.cone2],
                    // Stat Boost Beacons (5)
                    ['speedBeacon', this.entitySprites.hill1],
                    ['attackBeacon', this.entitySprites.cone1],
                    ['attackSpeedBeacon', this.entitySprites.hive2],
                    ['gatherSpeedBeacon', this.entitySprites.hill2],
                    ['terrainBeacon', this.entitySprites.cone2]
                ]) as Map<any, any>,
                completed: new Map([
                    // Original 3
                    ['warehouse', this.entitySprites.hill2 || this.entitySprites.hill1],
                    ['barracks', this.entitySprites.hive2 || this.entitySprites.hive1],
                    ['tower', this.entitySprites.cone2 || this.entitySprites.cone1],
                    // Storage (1)
                    ['nest', this.entitySprites.hive2],
                    // Spawners (3)
                    ['builderHut', this.entitySprites.hill2],
                    ['gathererHut', this.entitySprites.hive1],
                    ['spitterHut', this.entitySprites.cone2],
                    // Stat Boost Beacons (5)
                    ['speedBeacon', this.entitySprites.hill1],
                    ['attackBeacon', this.entitySprites.cone1],
                    ['attackSpeedBeacon', this.entitySprites.hive2],
                    ['gatherSpeedBeacon', this.entitySprites.hill2],
                    ['terrainBeacon', this.entitySprites.cone2]
                ]) as Map<any, any>
            });
            console.log(`[DevRoom] ✅ BuildingManager initialized with all 12 building types`);
        } else {
            console.warn(`[DevRoom] Building sprites not available - placement system disabled`);
        }
        
        // Listen for save preset event
        const savePresetListener = EventBus.on(GameEvents.SAVE_WORLD_PRESET, (presetName: string) => {
            this.saveCurrentWorld(presetName);
        });
        
        // Listen for load preset event
        const loadPresetListener = EventBus.on(GameEvents.LOAD_WORLD_PRESET, (preset: WorldPreset) => {
            this.loadPresetWorld(preset);
            // Auto-resume after loading completes (use setTimeout to ensure this happens after all event handlers)
            setTimeout(() => {
                EventBus.emit(GameEvents.GAME_RESUME);
            }, 0);
        });
        
        // Listen for resume event
        const resumeListener = EventBus.on(GameEvents.GAME_RESUME, () => {
            this.resumeGame();
        });
        
        // Listen for world gen config menu toggle
        const worldGenToggleListener = EventBus.on(GameEvents.WORLDGEN_CONFIG_MENU_TOGGLE, (enabled: boolean) => {
            if (enabled) {
                this.showWorldGenConfigMenu();
            } else {
                this.hideWorldGenConfigMenu();
            }
        });
        
        // Listen for world gen config changes
        const worldGenConfigListener = EventBus.on(GameEvents.WORLDGEN_CONFIG_CHANGED, (config: any) => {
            this.worldGenerator.setConfig(config);
            updateMaterialPriorities(config); // Update tile rendering priorities
        });
        
        // Listen for threshold reordering
        const worldGenThresholdListener = EventBus.on(GameEvents.WORLDGEN_THRESHOLD_CHANGED, (thresholds: any) => {
            // Config change event already handles regeneration, this is for logging/debugging
            if (CONFIG.DEBUG_MODE) {
                console.log('Thresholds reordered:', thresholds);
            }
        });
        
        // Listen for world gen regeneration trigger
        const worldGenRegenerateListener = EventBus.on(GameEvents.WORLDGEN_REGENERATE, () => {
            this.regenerateWorld();
        });
        
        this.unregisterFunctions.push(savePresetListener, loadPresetListener, resumeListener, worldGenToggleListener, worldGenConfigListener, worldGenThresholdListener, worldGenRegenerateListener);

        // Create back button using ButtonComponent
        this.createBackButton();

        // Create a simple tile renderer component
        this.createTileRenderer(tileGrid);
        
        // Initialize spawning system if entity sprites available
        if (this.entitySprites) {
            this.initializeSpawningSystem(tileGrid);
            this.setupGameUI();
        } else {
            console.log('[DevRoomScene] Entity sprites not loaded - spawning system disabled');
        }
    }

    private setupGameUI(): void {
        // Get camera from CameraManager
        const camera = CameraManager.getInstance().getCamera();
        if (!camera) {
            console.log('[DevRoomScene] Cannot setup UI overlay - camera not initialized');
            return;
        }
        
        // Store camera reference for click handling
        this.camera = camera;
        
        // Get queen from EntityManager
        const entities = EntityManager.getInstance().getAllEntities();
        const queen = entities.find(e => e.entityClass === 'queen');
        
        if (!this.entitySprites || !queen) {
            console.log('[DevRoomScene] Cannot setup UI overlay - missing sprites or queen');
            return;
        }
        
        // Store queen reference for click commands
        this.playerQueen = queen;
        
        // Setup path visualization for debugging
        const pathfindingComponent = queen.getComponent('Pathfinding') as PathfindingComponent;
        if (pathfindingComponent) {
            const pathVisualizer = new PathVisualizerComponent(queen, pathfindingComponent, this.renderer);
            this.unregisterFunctions.push(this.renderer.register(pathVisualizer));
          }
        
        // Setup tile highlight for debugging
        this.tileHighlight = new TileHighlightComponent(camera, this.renderer);
        this.unregisterFunctions.push(this.renderer.register(this.tileHighlight));
        
        // Create UI overlay config
        const tileGrid = GameStateManager.getInstance().getTileGrid();
        if (!tileGrid) {
            console.warn('[DevRoomScene] Cannot setup UI overlay - missing tile grid');
            return;
        }
        
        this.uiOverlay = new GameUIOverlay(
            this.renderer,
            camera,
            {
                canvasWidth: this.canvasWidth,
                canvasHeight: this.canvasHeight,
                worldWidth: DEV_ROOM_CONFIG.WORLD.WIDTH * 64,  // World width in pixels (TILE_SIZE = 64)
                worldHeight: DEV_ROOM_CONFIG.WORLD.HEIGHT * 64, // World height in pixels
                factionId: 'player',
                showMinimap: true,
                showPowerBar: true,
                showQueenPortrait: true,
                showCommands: true,
                showResources: true,
                showPopulation: true
            },
            {
                queen: this.entitySprites.queen,
                ant: this.entitySprites.ant,
                resources: this.entitySprites.resources,
                jobSprites: this.entitySpritesheets ? {
                    worker: GameUIOverlay.extractIdleFrame(this.entitySpritesheets.default),
                    warrior: GameUIOverlay.extractIdleFrame(this.entitySpritesheets.warrior),
                    scout: GameUIOverlay.extractIdleFrame(this.entitySpritesheets.scout)
                } : undefined
            }
        );
        
        this.uiOverlay.initialize();
        this.uiOverlay.setQueen(queen as any);
        
        // Refresh resource display after resources are initialized
        this.uiOverlay.refreshResourceDisplay();
        
        console.log('[DevRoomScene] ✅ GameUIOverlay initialized');
    }

    private createBackButton(): void {
        // Convert normalized coordinates to pixels
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;
        
        const buttonX = centerX + (DEV_ROOM_CONFIG.LAYOUT.BACK_BUTTON.offsetX * halfWidth);
        const buttonY = centerY - (DEV_ROOM_CONFIG.LAYOUT.BACK_BUTTON.offsetY * halfHeight);
        
        // Create ButtonComponent with sprite
        this.backButton = new ButtonComponent(
            this.backButtonImg,
            buttonX,
            buttonY,
            'back_button_devroom'
        );
        this.backButton.scale = DEV_ROOM_CONFIG.SCALES.BUTTON;
        this.backButton.setPulseSpeed(DEV_ROOM_CONFIG.ANIMATIONS.BUTTON_PULSE_SPEED);
        this.backButton.onClick(() => {
            EventBus.emit(GameEvents.MENU_BACK_CLICKED);
        });
        
        this.unregisterFunctions.push(this.renderer.register(this.backButton));
    }

    private createTileRenderer(tileGrid: TileGrid): void {
        // Create TileRenderer with camera culling for optimized rendering
        const tileRenderConfig: TileRenderConfig = {
            tileSprites: this.tileSprites,
            tileEdgeSprites: this.tileEdgeSprites,
            tileColors: this.tileColors,
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight
        };
        
        const tileRenderer = new TileRenderer(tileGrid, tileRenderConfig);
        const camera = CameraManager.getInstance().getCamera();
        
        // Create optimized tile renderable with camera culling
        const tileRenderable = {
            id: 'tile_grid',
            layer: RenderLayer.GROUND,
            depth: 0,
            render: tileRenderer.createTileRenderable(camera)
        };

        this.tileRendererUnregister.push(this.renderer.register(tileRenderable));
        this.renderer.markLayerDirty(RenderLayer.GROUND);
        
        // Add grid overlay on top of tiles (also camera culled)
        if (TILE_CONFIG.GRID_OVERLAY.ENABLED) {
            this.createGridOverlay(tileGrid, tileRenderer, camera);
        }
    }
    
    private createGridOverlay(_tileGrid: TileGrid, tileRenderer: TileRenderer, camera: any): void {
        // Use TileRenderer's optimized grid overlay with camera culling
        const gridRenderable = {
            id: 'tile_grid_overlay',
            layer: RenderLayer.GROUND_DECORATIONS,
            depth: 1000,  // Render on top of everything else in this layer
            render: tileRenderer.createGridOverlayRenderable(camera)
        };
        
        this.tileRendererUnregister.push(this.renderer.register(gridRenderable));
        this.renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
    }

    exit(): void {
        // Stop dev room music
        AudioManager.getInstance().stopBGM();
        
        // Cleanup UI overlay
        if (this.uiOverlay) {
            this.uiOverlay.cleanup();
            this.uiOverlay = null;
        }
        
        // Note: Entity cleanup now handled by CLEANUP_ALL_ENTITIES event in sketch.ts
        // This only cleans up scene-specific UI and resources
        
        // Unregister tile renderers (CRITICAL - prevents framerate degradation)
        this.tileRendererUnregister.forEach(unregister => unregister());
        this.tileRendererUnregister = [];
        
        // Unregister all renderables (UI components only - entities handled by cleanup signal)
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];

        // Clear tile grid
        this.gameState.clearTileGrid();
    }

    update(deltaTime: number): void {
        // Update pause menu if paused
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.update(deltaTime);
            return;
        }
        
        // Update world gen config menu if visible
        if (this.worldGenConfigMenu && this.worldGenConfigMenu.isVisible()) {
            this.worldGenConfigMenu.update();
        }
        
        // Update enemy building spawn timers
        this.updateEnemyBuildingSpawns(deltaTime);
        
        // Update all entities (Queen, Ants, Bosses, etc.) - EntityManager handles lifecycle
        EntityManager.getInstance().update(deltaTime);
        
        // Update spawn manager (wave spawning, safe zone)
        if (this.spawnManager) {
            this.spawnManager.update(deltaTime);
        }
        
        // Update building system managers
        if (this.constructionManager) {
            this.constructionManager.update(deltaTime);
        }
        
        // Update combat visual handler (cleanup expired sprite offsets)
        CombatVisualHandler.getInstance().update();
        
        // Update particle system (animate particles)
        ParticleSystem.getInstance().update(deltaTime);
        
        // Update camera (handles following and smooth movement)
        CameraManager.getInstance().update();
        
        // Update button animations
        if (this.backButton) {
            this.backButton.update();
            // Mark UI layer dirty so button hover effects are visible
            this.renderer.markLayerDirty(RenderLayer.UI);
        }

        // Update UI overlay
        if (this.uiOverlay) {
            this.uiOverlay.update();
        }
    }

    handleMouseClick(x: number, y: number): void {
        console.log(`[DevRoom] handleMouseClick called at (${x}, ${y})`);
        console.log(`[DevRoom] - isBuildingPlacementActive: ${this.isBuildingPlacementActive}`);
        
        // Forward to pause menu if paused
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.handleMouseClick(x, y);
            return;
        }
        
        // Forward to world gen config menu if visible
        if (this.worldGenConfigMenu && this.worldGenConfigMenu.isVisible()) {
            this.worldGenConfigMenu.handleMouseClick(x, y);
            return;
        }
        
        // Handle button click
        if (this.backButton && this.backButton.isMouseOver(x, y)) {
            this.backButton.handleClick(x, y);
            return;
        }

        // Delegate to UI overlay FIRST (check if click was on UI)
        if (this.uiOverlay) {
            const wasHandled = this.uiOverlay.handleMouseClick(x, y);
            console.log(`[DevRoom] UI overlay handled click: ${wasHandled}`);
            if (wasHandled) {
                console.log(`[DevRoom] Click consumed by UI overlay - stopping here`);
                return; // UI handled it, stop processing entirely
            }
        }
        
        // If building placement is active, attempt placement
        if (this.isBuildingPlacementActive && this.buildingPlacementManager) {
            console.log(`[DevRoom] Building placement active - calling attemptPlacement()`);
            this.buildingPlacementManager.attemptPlacement();
            return; // Don't process world clicks during placement
        }
        
        // World click: Handle queen commands (move/gather/attack)
        this.handleWorldClick(x, y);
    }

    handleMouseMove(x: number, y: number): void {
        // Update tile highlight
        if (this.tileHighlight) {
            this.tileHighlight.updateMousePosition(x, y);
        }
        
        // Update entity hover outlines
        this.updateEntityHover(x, y);
        
        // Forward to pause menu if paused
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.handleMouseMove(x, y);
            return;
        }
        
        // Forward to world gen config menu if visible
        if (this.worldGenConfigMenu && this.worldGenConfigMenu.isVisible()) {
            this.worldGenConfigMenu.handleMouseMove(x, y);
        }
        
        // If building placement is active, forward to BuildingPlacementManager
        if (this.isBuildingPlacementActive && this.buildingPlacementManager) {
            // BuildingPlacementManager listens to INPUT_MOUSE_MOVE event
            // Event already emitted by sketch.ts, no need to forward manually
        }
        
        // Handle button hover
        if (this.backButton) {
            this.backButton.setHovered(this.backButton.isMouseOver(x, y));
        }
    }
    
    handleMouseUp(_x: number, _y: number): void {
        // Forward to pause menu if paused
        if (this.isPaused && this.pauseMenu) {
            // Pause menu doesn't need mouse up currently
            return;
        }
        
        // Forward to world gen config menu if visible
        if (this.worldGenConfigMenu && this.worldGenConfigMenu.isVisible()) {
            this.worldGenConfigMenu.handleMouseUp();
        }
    }

    /**
     * Handle clicks on the game world (not UI)
     * Implements smart targeting:
     * - Click on resource → pathfind and gather
     * - Click on enemy → pathfind and attack
     * - Click on ground → pathfind to location
     */
    private handleWorldClick(screenX: number, screenY: number): void {
        console.log(`[DevRoomScene] handleWorldClick called with screen coords (${screenX}, ${screenY})`);
        
        if (!this.playerQueen || !this.camera) {
            console.log('[DevRoomScene] handleWorldClick: Missing queen or camera');
            console.log(`  playerQueen: ${this.playerQueen ? 'exists' : 'NULL'}`);
            console.log(`  camera: ${this.camera ? 'exists' : 'NULL'}`);
            return;
        }

        // Convert screen coordinates to world coordinates
        const { x: worldX, y: worldY } = this.camera.screenToWorld(screenX, screenY);
        
        console.log(`[DevRoomScene] Click: screen(${screenX}, ${screenY}) → world(${worldX.toFixed(1)}, ${worldY.toFixed(1)})`);
        
        // Convert world coordinates to grid coordinates (using correct TILE_SIZE from config)
        const gridX = Math.floor(worldX / TILE_SIZE);
        const gridY = Math.floor(worldY / TILE_SIZE);
        
        console.log(`[DevRoomScene] Grid position: (${gridX}, ${gridY}) using TILE_SIZE=${TILE_SIZE}`);

        // Check if clicked on an entity
        const clickedEntity = this.findEntityAtPosition(gridX, gridY);
        
        if (clickedEntity) {
            console.log(`[DevRoomScene] Clicked on entity: ${clickedEntity.type} at (${clickedEntity.gridX}, ${clickedEntity.gridY})`);
            // Clicked on an entity - determine action based on type
            if (clickedEntity.type === 'resource') {
                // Resource: Start gathering
                this.commandQueenToGather(clickedEntity);
            } else if (this.isEnemy(clickedEntity)) {
                // Enemy: Attack
                this.commandQueenToAttack(clickedEntity);
            } else {
                // Friendly or neutral: Just move there
                this.commandQueenToMove(gridX, gridY);
            }
        } else {
            console.log('[DevRoomScene] Clicked on empty ground');
            // Clicked on empty ground: Move there
            this.commandQueenToMove(gridX, gridY);
        }
    }

    /**
     * Find entity at grid position (within collision radius)
     */
    private findEntityAtPosition(gridX: number, gridY: number): any | null {
        const entityManager = EntityManager.getInstance();
        const allEntities = entityManager.getAllEntities();
        
        for (const entity of allEntities) {
            if (!entity.isActive) continue;
            
            // Check if click is within entity's tile (simple grid check)
            if (Math.floor(entity.gridX) === gridX && Math.floor(entity.gridY) === gridY) {
                return entity;
            }
        }
        
        return null;
    }

    /**
     * Check if entity is enemy to player queen
     */
    private isEnemy(entity: any): boolean {
        // Check if entity has a faction
        if (entity.getFactionId && typeof entity.getFactionId === 'function') {
            const entityFaction = entity.getFactionId();
            const queenFaction = this.playerQueen.getFactionId();
            return entityFaction !== queenFaction;
        }
        
        // Bosses are always enemies
        if (entity.type === 'boss') {
            return true;
        }
        
        return false;
    }

    /**
     * Command queen to move to location
     */
    private commandQueenToMove(gridX: number, gridY: number): void {
        const pathfinding = this.playerQueen.getComponent('Pathfinding');
        const tileGrid = GameStateManager.getInstance().getTileGrid();
        
        if (pathfinding && tileGrid) {
            const grid = tileGrid.getGrid();
            
            // EXTENSIVE DEBUG: Check tile properties
            console.log(`[DevRoomScene] ===== PATHFINDING DEBUG =====`);
            console.log(`[DevRoomScene] Queen at grid (${this.playerQueen.gridX}, ${this.playerQueen.gridY})`);
            console.log(`[DevRoomScene] Target at grid (${gridX}, ${gridY})`);
            console.log(`[DevRoomScene] Grid dimensions: ${grid[0]?.length}x${grid.length}`);
            console.log(`[DevRoomScene] Target in bounds: col=${gridX >= 0 && gridX < grid[0]?.length}, row=${gridY >= 0 && gridY < grid.length}`);
            
            // Check using TileGrid method
            const isWalkable = tileGrid.isWalkable(gridX, gridY);
            console.log(`[DevRoomScene] tileGrid.isWalkable(${gridX}, ${gridY}): ${isWalkable}`);
            
            // Check direct grid access
            const tileData = grid[gridY]?.[gridX];
            if (tileData) {
                console.log(`[DevRoomScene] Direct grid access grid[${gridY}][${gridX}]:`);
                console.log(`  - type: ${tileData.type}`);
                console.log(`  - walkable: ${tileData.walkable}`);
                console.log(`  - movementCost: ${tileData.movementCost}`);
                console.log(`  - spriteIndex: ${tileData.spriteIndex}`);
            } else {
                console.log(`[DevRoomScene] ERROR: grid[${gridY}][${gridX}] is ${tileData}`);
            }
            
            // Check surrounding tiles
            console.log(`[DevRoomScene] Surrounding tiles:`);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const checkX = gridX + dx;
                    const checkY = gridY + dy;
                    const tile = grid[checkY]?.[checkX];
                    if (tile) {
                        console.log(`  (${checkX}, ${checkY}): walkable=${tile.walkable}, type=${tile.type}`);
                    }
                }
            }
            console.log(`[DevRoomScene] ================================`);
            
            pathfinding.findPath(gridX, gridY, grid);
            console.log(`[DevRoomScene] Queen commanded to move to (${gridX}, ${gridY})`);
        }
    }

    /**
     * Command queen to gather resource
     */
    private commandQueenToGather(resource: any): void {
        // For now, just move to the resource location
        // TODO: Implement actual gathering behavior for Queen
        const pathfinding = this.playerQueen.getComponent('Pathfinding');
        const tileGrid = GameStateManager.getInstance().getTileGrid();
        
        if (pathfinding && tileGrid) {
            const grid = tileGrid.getGrid();
            pathfinding.findPath(Math.floor(resource.gridX), Math.floor(resource.gridY), grid);
            console.log(`[DevRoomScene] Queen commanded to gather resource at (${resource.gridX}, ${resource.gridY})`);
            
            // TODO: Add resource gathering component/behavior to Queen
            // For now, Queen will just move to resource location
        }
    }

    /**
     * Command queen to attack enemy
     */
    private commandQueenToAttack(enemy: any): void {
        const combat = this.playerQueen.getComponent('Combat');
        const pathfinding = this.playerQueen.getComponent('Pathfinding');
        const tileGrid = GameStateManager.getInstance().getTileGrid();
        
        if (combat && pathfinding && tileGrid) {
            // Set combat target
            combat.setTarget(enemy.id);
            
            // Move towards enemy
            const grid = tileGrid.getGrid();
            pathfinding.findPath(Math.floor(enemy.gridX), Math.floor(enemy.gridY), grid);
            
            console.log(`[DevRoomScene] Queen commanded to attack ${enemy.type} at (${enemy.gridX}, ${enemy.gridY})`);
        }
    }
    
    onResize(_width: number, _height: number): void {
        // Dev room doesn't need special resize handling currently
        // World gen config menu uses fixed positioning
    }
    
    handleKeyPress(key: string | number): void {
        // Forward to WorldGenConfigMenu if visible
        if (this.worldGenConfigMenu && this.worldGenConfigMenu.isVisible()) {
            this.worldGenConfigMenu.handleTextInput(key.toString());
            return; // Don't process other keys when config menu has focus
        }
        
        // Forward to pause menu if paused (except pause key)
        if (this.isPaused && this.pauseMenu && !this.inputManager.isKeyBoundToAction(key.toString(), 'pause')) {
            this.pauseMenu.handleKeyPress(key);
            return;
        }
        
        // Pause - Toggle pause menu
        if (this.inputManager.isKeyBoundToAction(key.toString(), 'pause')) {
            this.togglePause();
            return;
        }
        
        // Only allow other keys when not paused
        if (this.isPaused) return;
        
        // Removed saveWorld keybinding - now handled in PauseMenuScene with Ctrl+S
    }
    
    /**
     * Toggle pause menu
     */
    private togglePause(): void {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    /**
     * Pause game and show menu
     */
    private pauseGame(): void {
        this.isPaused = true;
        this.gameState.setPaused(true); // Update centralized pause state
        this.pauseMenu = new PauseMenuScene(
            this.renderer,
            this.canvasWidth,
            this.canvasHeight
        );
        this.pauseMenu.enter();
    }
    
    /**
     * Resume game and hide menu
     */
    private resumeGame(): void {
        if (this.pauseMenu) {
            this.pauseMenu.exit();
            this.pauseMenu = null;
        }
        this.isPaused = false;
        this.gameState.setPaused(false); // Update centralized pause state
        this.renderer.markLayerDirty(RenderLayer.UI);
    }
    
    /**
     * Load a preset world
     */
    private loadPresetWorld(preset: WorldPreset): void {
        // If preset has full map data, use it directly
        if (preset.mapData) {
            const tileGrid = new TileGrid(preset.mapData);
            this.gameState.setTileGrid(tileGrid);
            this.currentMapData = preset.mapData;
            this.currentWorldSeed = preset.seed;
            
            // Recreate tile renderer
            this.unregisterFunctions.forEach(unregister => unregister());
            this.unregisterFunctions = [];
            this.createBackButton();
            this.createTileRenderer(tileGrid);
        } else {
            // Otherwise regenerate from seed
            this.worldGenerator.setNoiseScale(preset.noiseScale);
            const worldData = this.worldGenerator.generate(
                preset.width,
                preset.height,
                preset.seed
            );
            
            this.currentMapData = worldData;
            this.currentWorldSeed = preset.seed;
            
            const tileGrid = new TileGrid(worldData);
            this.gameState.setTileGrid(tileGrid);
            
            // Recreate tile renderer
            this.unregisterFunctions.forEach(unregister => unregister());
            this.unregisterFunctions = [];
            this.createBackButton();
            this.createTileRenderer(tileGrid);
        }
        
        // Sync WorldGenConfigMenu with loaded preset config
        if (this.worldGenConfigMenu) {
            this.worldGenConfigMenu.setConfig(this.worldGenerator.getConfig());
        }
        
        // Update material priorities from loaded config
        updateMaterialPriorities(this.worldGenerator.getConfig());
    }
    
    /**
     * Save current world as a preset
     */
    private saveCurrentWorld(presetName: string): void {
        if (!this.currentMapData) return;
        
        const preset: WorldPreset = {
            name: presetName,
            seed: this.currentWorldSeed,
            noiseScale: this.worldGenerator.getNoiseScale(),
            width: DEV_ROOM_CONFIG.WORLD.WIDTH,
            height: DEV_ROOM_CONFIG.WORLD.HEIGHT,
            mapData: this.currentMapData,
            timestamp: Date.now()
        };
        
        WorldPresetManager.savePreset(preset);
    }
    
    /**
     * Regenerate the world with current config
     */
    private regenerateWorld(): void {
        // Unregister old tile renderers
        this.tileRendererUnregister.forEach(unregister => unregister());
        this.tileRendererUnregister = [];
        
        // Update material priorities before regenerating
        updateMaterialPriorities(this.worldGenerator.getConfig());
        
        // Generate new world with current seed
        const worldData = this.worldGenerator.generate(
            DEV_ROOM_CONFIG.WORLD.WIDTH,
            DEV_ROOM_CONFIG.WORLD.HEIGHT,
            this.currentWorldSeed
        );
        
        // Store map data
        this.currentMapData = worldData;
        const tileGrid = new TileGrid(worldData);
        this.gameState.setTileGrid(tileGrid);
        
        // Recreate tile renderer
        this.createTileRenderer(tileGrid);
        
        // Reinitialize spawning system if available
        if (this.entitySprites) {
            // Clear old spawns first
            if (this.spawnManager) {
                this.spawnManager.clearAllSpawns();
            }
            this.initializeSpawningSystem(tileGrid);
        }
    }

    /**
     * Initialize the entity spawning system
     */
    private initializeSpawningSystem(tileGrid: TileGrid): void {
        if (!this.entitySprites) {
            return;
        }
        

        
        // Get singletons
        this.spawnManager = SpawnManager.getInstance();
        this.levelLoader = LevelLoader.getInstance();
        
        // Initialize spawn manager with tileGrid array
        this.spawnManager.initialize(
            this.renderer,
            tileGrid.getGrid(),
            (_x: number, _y: number, _radius: number) => {
                // TODO: Replace with EntityManager when available
                // For now, return empty array (no collision checking)
                return [];
            }
        );
        
        // Register entity sprites
        // Note: We'll use the single ant sprite for all job types for now
        this.spawnManager.registerSprites({
            ants: new Map([
                [0, this.entitySprites.ant], // Gatherer
                [1, this.entitySprites.ant], // Builder
                [2, this.entitySprites.ant], // Warrior
                [3, this.entitySprites.ant]  // Scout
            ]),
            resources: new Map([
                ['food', this.entitySprites.resources.food],
                ['wood', this.entitySprites.resources.wood],
                ['stone', this.entitySprites.resources.stone],
                ['magicCrystal', this.entitySprites.resources.magicCrystal]
            ]),
            boss: this.entitySprites.boss,
            queen: this.entitySprites.queen
        });
        
        // Spawn enemy buildings around the map (controlled by config)
        if (DEV_ROOM_SPAWN_CONFIG.SPAWNING.ENEMY_BUILDINGS) {
            this.spawnEnemyBuildings(tileGrid);
        }
        
        // Generate a procedural level using spawn config
        const levelData = this.levelLoader.loadProceduralLevel({
            difficulty: DEV_ROOM_SPAWN_CONFIG.LEVEL.DIFFICULTY,
            worldSize: { 
                width: DEV_ROOM_CONFIG.WORLD.WIDTH, 
                height: DEV_ROOM_CONFIG.WORLD.HEIGHT 
            },
            resourceAbundance: DEV_ROOM_SPAWN_CONFIG.LEVEL.RESOURCE_ABUNDANCE,
            enemyDensity: DEV_ROOM_SPAWN_CONFIG.LEVEL.ENEMY_DENSITY,
            safeZoneDuration: DEV_ROOM_SPAWN_CONFIG.LEVEL.SAFE_ZONE_DURATION,
            wavesEnabled: DEV_ROOM_SPAWN_CONFIG.SPAWNING.WAVES
        }, this.currentWorldSeed);
        

        
        // Spawn everything
        const spawnResult = this.spawnManager.spawnLevel(
            levelData.spawnConfig,
            levelData.worldSeed
        );
        
        console.log('[DevRoomScene] Spawn results:');
        console.log(`  ✓ Queen: ${spawnResult.queen ? 'spawned' : 'failed'}`);
        console.log(`  ✓ Ants: ${spawnResult.ants.length}`);
        console.log(`  ✓ Resources: ${spawnResult.resources.length}`);
        console.log(`  ✓ Enemies: ${spawnResult.enemies.bosses.length} bosses, ${spawnResult.enemies.ants.length} ants`);
        
        // Listen for spawn events
        const waveListener = EventBus.on(GameEvents.ENEMY_SPAWN, (data: any) => {
            if (data.type === 'wave') {

            }
        });
        
        const safeZoneListener = EventBus.on(GameEvents.SAFE_ZONE_EXPIRED, () => {

        });
        
        this.unregisterFunctions.push(waveListener, safeZoneListener);
        
        EventBus.emit(GameEvents.LEVEL_START);
    }

    /**
     * Spawn enemy buildings around the map
     */
    private spawnEnemyBuildings(tileGrid: TileGrid): void {
        if (!this.entitySprites) {
            return;
        }

        const grid = tileGrid.getGrid();
        const worldWidth = grid[0].length;
        const worldHeight = grid.length;
        
        // Spawn 3-5 clusters of enemy buildings
        const numClusters = 3 + Math.floor(Math.random() * 3); // 3-5 clusters
        const buildingSprites = [
            this.entitySprites.hill1,
            this.entitySprites.hill2,
            this.entitySprites.hive1,
            this.entitySprites.hive2,
            this.entitySprites.cone1,
            this.entitySprites.cone2
        ];
        
        for (let cluster = 0; cluster < numClusters; cluster++) {
            // Find cluster center
            let attempts = 0;
            let clusterCenterX = 0;
            let clusterCenterY = 0;
            let foundValidCenter = false;
            
            while (attempts < 50 && !foundValidCenter) {
                clusterCenterX = Math.floor(Math.random() * worldWidth);
                clusterCenterY = Math.floor(Math.random() * worldHeight);
                
                // Check if tile is walkable and not too close to center (where queen spawns)
                const centerX = Math.floor(worldWidth / 2);
                const centerY = Math.floor(worldHeight / 2);
                const distanceFromCenter = Math.sqrt(
                    Math.pow(clusterCenterX - centerX, 2) + Math.pow(clusterCenterY - centerY, 2)
                );
                
                if (grid[clusterCenterY][clusterCenterX].walkable && distanceFromCenter > 15) {
                    foundValidCenter = true;
                }
                
                attempts++;
            }
            
            if (!foundValidCenter) {
                continue;
            }
            
            // Spawn 3-6 buildings in this cluster
            const buildingsInCluster = 3 + Math.floor(Math.random() * 4); // 3-6 buildings
            const clusterRadius = 4; // Buildings within 4 tiles of center
            
            for (let i = 0; i < buildingsInCluster; i++) {
                // Find position near cluster center
                let buildingAttempts = 0;
                let gridX = clusterCenterX;
                let gridY = clusterCenterY;
                let foundValidLocation = false;
                
                while (buildingAttempts < 20 && !foundValidLocation) {
                    // Random offset from cluster center
                    const offsetX = Math.floor(Math.random() * (clusterRadius * 2 + 1)) - clusterRadius;
                    const offsetY = Math.floor(Math.random() * (clusterRadius * 2 + 1)) - clusterRadius;
                    
                    gridX = clusterCenterX + offsetX;
                    gridY = clusterCenterY + offsetY;
                    
                    // Check bounds and walkability
                    if (gridX >= 0 && gridX < worldWidth - 1 && // -1 for 2x2 building
                        gridY >= 0 && gridY < worldHeight - 1 &&
                        grid[gridY][gridX].walkable &&
                        grid[gridY + 1][gridX].walkable &&
                        grid[gridY][gridX + 1].walkable &&
                        grid[gridY + 1][gridX + 1].walkable) {
                        
                        // Check not too close to other buildings (at least 1 tile apart)
                        let tooClose = false;
                        for (const existingBuilding of this.enemyBuildings) {
                            const dx = Math.abs(existingBuilding.building.gridX - gridX);
                            const dy = Math.abs(existingBuilding.building.gridY - gridY);
                            if (dx < 2 && dy < 2) { // 2 tile minimum spacing for denser clusters
                                tooClose = true;
                                break;
                            }
                        }
                        
                        if (!tooClose) {
                            foundValidLocation = true;
                        }
                    }
                    
                    buildingAttempts++;
                }
                
                if (!foundValidLocation) {
                    continue;
                }
                
                // Pick random building sprite
                const sprite = buildingSprites[Math.floor(Math.random() * buildingSprites.length)];
                
                // Create building (use same sprite for construction and completed)
                const building = BuildingFactory.create(
                    this.renderer,
                    sprite, // Construction sprite
                    sprite, // Completed sprite (same for now)
                    gridX,
                    gridY,
                    'tower', // Use tower type for enemy buildings
                    'enemy' // Faction ID
                );
                
                // Track building for enemy spawning
                this.enemyBuildings.push({
                    building,
                    spawnTimer: 0,
                    spawnInterval: 5000 + Math.random() * 5000 // 5-10 seconds
                });
                
                console.log(`[DevRoomScene] Spawned enemy building at (${gridX}, ${gridY}) in cluster ${cluster + 1}`);
            }
        }
    }

    /**
     * Update enemy building spawn timers and spawn ants
     */
    private updateEnemyBuildingSpawns(deltaTime: number): void {
        if (!this.entitySprites) {
            return;
        }

        for (const buildingData of this.enemyBuildings) {
            // Skip if building is destroyed
            if (!buildingData.building.isActive) {
                continue;
            }

            // Update spawn timer
            buildingData.spawnTimer += deltaTime;

            // Spawn ant if timer elapsed
            if (buildingData.spawnTimer >= buildingData.spawnInterval) {
                buildingData.spawnTimer = 0;
                buildingData.spawnInterval = 5000 + Math.random() * 5000; // Next spawn in 5-10 seconds

                // Spawn enemy ant near building (random adjacent tile)
                const directions = [
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                    { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
                    { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
                ];
                
                const randomDir = directions[Math.floor(Math.random() * directions.length)];
                const spawnX = buildingData.building.gridX + randomDir.dx;
                const spawnY = buildingData.building.gridY + randomDir.dy;

                // Create enemy ant (don't need to store reference, EntityManager tracks it)
                AntFactory.create(
                    this.renderer,
                    spawnX,
                    spawnY,
                    'enemy_faction'
                );

                console.log(`[DevRoomScene] Enemy ant spawned at (${spawnX}, ${spawnY}) from building at (${buildingData.building.gridX}, ${buildingData.building.gridY})`);
            }
        }
    }

    /**
     * Show world gen config menu
     */
    private showWorldGenConfigMenu(): void {
        if (!this.worldGenConfigMenu) {
            // Create menu if it doesn't exist
            this.worldGenConfigMenu = new WorldGenConfigMenu(
                20,
                100,
                this.worldGenerator.getConfig()
            );
            this.unregisterFunctions.push(this.renderer.register(this.worldGenConfigMenu));
        }
        this.worldGenConfigMenu.show();
        this.renderer.markLayerDirty(RenderLayer.UI);
    }
    
    /**
     * Update entity hover outlines based on mouse position
     */
    private updateEntityHover(screenX: number, screenY: number): void {
        if (!this.camera) return;

        // Convert screen to world coordinates
        const { x: worldX, y: worldY } = this.camera.screenToWorld(screenX, screenY);

        // Get all entities and check which one is hovered
        const entityManager = EntityManager.getInstance();
        const allEntities = [
            ...entityManager.getEntitiesByType('ant'),
            ...entityManager.getEntitiesByType('queen'),
            ...entityManager.getEntitiesByType('boss'),
            ...entityManager.getEntitiesByType('resource'),
            ...entityManager.getEntitiesByType('building')
        ];

        let newHoveredId: string | null = null;
        let closestDistance = Infinity;

        // Check each entity for hover - use smooth position (rendered position) not grid position
        for (const entity of allEntities) {
            // Get smooth position (actual rendered position)
            const smoothPos = (entity as any).getSmoothPosition?.() || { x: entity.worldX, y: entity.worldY };
            // worldX/worldY are top-left of tile, but sprites are drawn centered
            // Add half collision size to get sprite center position
            const entityX = smoothPos.x + entity.collisionWidth / 2;
            const entityY = smoothPos.y + entity.collisionHeight / 2;

            // Get sprite scale from entity config
            let spriteScale = 1.0;
            if (entity.type === 'queen') spriteScale = ENTITY_CONFIG.SPRITE_SCALES.queen;
            else if (entity.type === 'ant') spriteScale = ENTITY_CONFIG.SPRITE_SCALES.ant;
            else if (entity.type === 'boss') spriteScale = ENTITY_CONFIG.SPRITE_SCALES.boss;
            else if (entity.type === 'resource') spriteScale = ENTITY_CONFIG.SPRITE_SCALES.resource;
            else if (entity.type === 'building') spriteScale = ENTITY_CONFIG.SPRITE_SCALES.building;

            // Calculate visual size accounting for sprite scale
            const visualWidth = entity.collisionWidth * spriteScale;
            const visualHeight = entity.collisionHeight * spriteScale;

            const halfWidth = visualWidth / 2;
            const halfHeight = visualHeight / 2;

            // Check if mouse is within entity visual bounds
            if (
                worldX >= entityX - halfWidth &&
                worldX <= entityX + halfWidth &&
                worldY >= entityY - halfHeight &&
                worldY <= entityY + halfHeight
            ) {
                // Calculate distance from center for tie-breaking (prefer closest entity)
                const dx = worldX - entityX;
                const dy = worldY - entityY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < closestDistance) {
                    closestDistance = dist;
                    newHoveredId = entity.id;
                }
            }
        }

        // Update outline if hover changed
        if (newHoveredId !== this.hoveredEntityId) {
            // Remove outline from previously hovered entity
            if (this.hoveredEntityId) {
                EventBus.emit('ENTITY_HOVER_END', this.hoveredEntityId);
            }

            // Add outline to newly hovered entity
            if (newHoveredId) {
                EventBus.emit('ENTITY_HOVER_START', newHoveredId);
            }

            this.hoveredEntityId = newHoveredId;
        }
    }
    
    /**
     * Hide world gen config menu
     */
    private hideWorldGenConfigMenu(): void {
        if (this.worldGenConfigMenu) {
            this.worldGenConfigMenu.hide();
            this.renderer.markLayerDirty(RenderLayer.UI);
        }
    }
}
