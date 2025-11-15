/**
 * EntityShowcaseScene - Test scene showcasing all entity systems
 * Demonstrates: Ants, Queen, Boss, Resources, Buildings, Powers, UI components
 * 
 * Features:
 * - Player-controlled Queen with all 5 powers
 * - Autonomous ants (different jobs)
 * - Patrolling Boss with vision cone
 * - Resource nodes for gathering
 * - Buildings with construction
 * - All UI components visible
 * - Minimap with entity tracking
 * - Debug overlays enabled
 */

import {
    IScene,
    Renderer,
    RenderLayer,
    Camera,
    EventBus,
    GameEvents,
    Queen,
    Ant,
    Boss,
    Resource,
    Building,
    AntFactory,
    QueenFactory,
    BossFactory,
    ResourceFactory,
    BuildingFactory,
    EntityManager,
    FactionManager,
    PathfindingManager,
    InputManager,
    WorldGenerator,
    TileGrid,
    CONFIG
} from '../imports/sceneImports';
import { ResourceManager } from '../managers/ResourceManager';
import { PowerManager } from '../managers/PowerManager';
import { TileRendererComponent } from '../rendering/components/TileRendererComponent';
import { ResourceDisplayComponent } from '../rendering/components/ResourceDisplayComponent';
import { PopulationDisplayComponent } from '../rendering/components/PopulationDisplayComponent';
import { PowerBarComponent } from '../rendering/components/PowerBarComponent';
import { QueenPortraitComponent } from '../rendering/components/QueenPortraitComponent';
import { QueenCommandsComponent } from '../rendering/components/QueenCommandsComponent';
import { MinimapComponent } from '../rendering/components/MinimapComponent';
import { ENTITY_CONFIG, ResourceType } from '../config/entityConfig';

/**
 * EntityShowcaseScene - Interactive demonstration of all entity systems
 */
export class EntityShowcaseScene implements IScene {
    private renderer: Renderer;
    private camera: Camera;
    private canvasWidth: number;
    private canvasHeight: number;
    
    // Entities
    private queen: Queen | null = null;
    private ants: Ant[] = [];
    private boss: Boss | null = null;
    private resources: Resource[] = [];
    private buildings: Building[] = [];
    
    // UI Components
    private resourceDisplay: ResourceDisplayComponent | null = null;
    private populationDisplay: PopulationDisplayComponent | null = null;
    private powerBar: PowerBarComponent | null = null;
    private queenPortrait: QueenPortraitComponent | null = null;
    private commandsUI: QueenCommandsComponent | null = null;
    private minimap: MinimapComponent | null = null;
    private tileRenderer: TileRendererComponent | null = null;
    
    // Unregister functions for cleanup
    private uiUnregisterFunctions: Array<() => void> = [];
    private eventUnsubscribers: Array<() => void> = [];
    
    // World dimensions
    private worldWidth: number = 3200; // 200 tiles * 16px
    private worldHeight: number = 2400; // 150 tiles * 16px
    
    // World generation
    private worldGenerator: WorldGenerator;
    
    // Debug mode
    private debugMode: boolean = true;
    
    // Preloaded sprites
    private sprites: {
        ant: any;
        queen: any;
        boss: any;
        building: any;
        resource: any;
    };
    private tileSprites: { [key: number]: any };
    private tileEdgeSprites: { [path: string]: any };

    constructor(
        renderer: Renderer,
        camera: Camera,
        canvasWidth: number,
        canvasHeight: number,
        sprites: {
            ant: any;
            queen: any;
            boss: any;
            building: any;
            resource: any;
        },
        tileSprites: { [key: number]: any },
        tileEdgeSprites: { [path: string]: any }
    ) {
        this.renderer = renderer;
        this.camera = camera;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.sprites = sprites;
        this.tileSprites = tileSprites;
        this.tileEdgeSprites = tileEdgeSprites;
        this.worldGenerator = new WorldGenerator();
    }

    /**
     * Initialize the showcase scene
     */
    enter(): void {
        console.log('🎮 Entering Entity Showcase Scene!');
        
        // Initialize managers
        this.initializeManagers();
        
        // Generate world terrain
        this.generateWorld();
        
        // Create factions
        this.createFactions();
        
        // Initialize pathfinding grid
        this.initializePathfinding();
        
        // Spawn entities
        this.spawnQueen();
        this.spawnAnts();
        this.spawnBoss();
        this.spawnResources();
        this.spawnBuildings();
        
        // Setup UI
        this.setupUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Camera starts at queen position (immediate jump, no smoothing)
        if (this.queen) {
            this.camera.moveTo(this.queen.worldX, this.queen.worldY);
            console.log(`📷 Camera positioned at queen: (${this.queen.worldX}, ${this.queen.worldY})`);
        }
        
        // Enable debug mode
        CONFIG.DEBUG_MODE = this.debugMode;
        
        console.log('✅ Entity Showcase Scene ready!');
        console.log('Controls:');
        console.log('  WASD/Arrow Keys - Move Queen');
        console.log('  1-5 - Use Powers');
        console.log('  Click Minimap - Jump to location');
        console.log('  D - Toggle debug overlays');
    }

    /**
     * Initialize all manager singletons
     */
    private initializeManagers(): void {
        // Get singleton instances (already initialized, just ensuring they exist)
        EntityManager.getInstance();
        FactionManager.getInstance();
        ResourceManager.getInstance();
        PathfindingManager.getInstance();
        PowerManager.getInstance();
    }

    /**
     * Generate procedural world terrain
     */
    private generateWorld(): void {
        // Generate world with seed
        const seed = Math.floor(Math.random() * 10000);
        const gridWidth = Math.floor(this.worldWidth / 16);
        const gridHeight = Math.floor(this.worldHeight / 16);
        
        const worldData = this.worldGenerator.generate(
            gridWidth,
            gridHeight,
            seed
        );
        
        // Create tile renderer
        const tileColors: { [key: number]: string } = {
            0: '#808080',  // Stone
            1: '#228B22',  // Grass
            2: '#8B4513',  // Dirt
            3: '#4169E1',  // Water
            4: '#D2B48C',  // Sand
        };
        
        this.tileRenderer = new TileRendererComponent(
            this.tileSprites,
            this.tileEdgeSprites,
            tileColors,
            {
                tileSize: 16,
                useSprites: true,
                useEdges: true,
                showGrid: false
            }
        );
        
        // Wrap in TileGrid and set
        const tileGrid = new TileGrid(worldData);
        this.tileRenderer.setTileGrid(tileGrid);
        this.uiUnregisterFunctions.push(this.renderer.register(this.tileRenderer));
        
        // Emit world generated event for other systems (pass TileGrid)
        EventBus.emit(GameEvents.WORLD_GENERATED, tileGrid);
        
        console.log(`✅ World generated with seed ${seed} (${gridWidth}x${gridHeight} tiles)`);
    }

    /**
     * Create player and enemy factions
     */
    private createFactions(): void {
        const factionManager = FactionManager.getInstance();
        
        // Clear any existing factions
        factionManager.clear();
        
        // Player faction (blue ants)
        factionManager.createFaction('player', '#4444ff', true);
        
        // Enemy faction (red ants - for future use)
        factionManager.createFaction('enemy', '#ff4444', false);
        
        console.log('✅ Factions created: player (blue), enemy (red)');
    }

    /**
     * Initialize pathfinding grid
     */
    private initializePathfinding(): void {
        const pathfindingManager = PathfindingManager.getInstance();
        
        // Create grid (200x150 tiles)
        const gridWidth = Math.floor(this.worldWidth / 16);
        const gridHeight = Math.floor(this.worldHeight / 16);
        
        pathfindingManager.initializeGrid(gridWidth, gridHeight);
        
        console.log(`✅ Pathfinding grid initialized: ${gridWidth}x${gridHeight}`);
    }

    /**
     * Spawn player-controlled Queen
     */
    private spawnQueen(): void {
        // Spawn at center of world
        const gridX = 100; // Center X
        const gridY = 75;  // Center Y
        
        // Create queen using factory
        this.queen = QueenFactory.create(
            this.renderer,
            this.sprites.queen, // Pass sprite
            gridX,
            gridY,
            'player'
        );
        
        // Unlock all powers for showcase
        this.queen.unlockPower('Lightning');
        this.queen.unlockPower('Fireball');
        this.queen.unlockPower('Blackhole');
        this.queen.unlockPower('Tidalwave');
        this.queen.unlockPower('FinalFlash');
        
        console.log(`✅ Queen spawned at (${gridX}, ${gridY}) with all powers unlocked`);
    }

    /**
     * Spawn ants with different jobs
     */
    private spawnAnts(): void {
        const antJobs = [
            { job: 'GATHERER', count: 5 },
            { job: 'BUILDER', count: 3 },
            { job: 'WARRIOR', count: 4 },
            { job: 'SCOUT', count: 3 }
        ];
        
        let spawnedCount = 0;
        
        for (const jobConfig of antJobs) {
            for (let i = 0; i < jobConfig.count; i++) {
                // Spawn in a circle around queen
                const angle = (spawnedCount / 15) * Math.PI * 2;
                const radius = 5;
                const gridX = 100 + Math.floor(Math.cos(angle) * radius);
                const gridY = 75 + Math.floor(Math.sin(angle) * radius);
                
                const ant = AntFactory.create(
                    this.renderer,
                    this.sprites.ant,
                    gridX,
                    gridY,
                    'player',
                    jobConfig.job as any
                );
                
                this.ants.push(ant);
                spawnedCount++;
            }
        }
        
        console.log(`✅ Spawned ${spawnedCount} ants (5 Gatherers, 3 Builders, 4 Warriors, 3 Scouts)`);
    }

    /**
     * Spawn Boss with patrol path
     */
    private spawnBoss(): void {
        // Spawn boss in top-right area
        const startX = 150;
        const startY = 30;
        
        // Create patrol path (rectangle)
        const patrolPath = [
            { gridX: 150, gridY: 30 },
            { gridX: 170, gridY: 30 },
            { gridX: 170, gridY: 50 },
            { gridX: 150, gridY: 50 }
        ];
        
        this.boss = BossFactory.create(
            this.renderer,
            this.sprites.boss,
            startX,
            startY,
            patrolPath,
            'homing' // Homing projectiles
        );
        
        console.log(`✅ Boss spawned at (${startX}, ${startY}) with patrol path`);
    }

    /**
     * Spawn resource nodes
     */
    private spawnResources(): void {
        const resourceTypes: ResourceType[] = ['food', 'wood', 'stone', 'magicCrystal'];
        
        // Spawn clusters of each resource type
        for (let i = 0; i < 4; i++) {
            const resourceType = resourceTypes[i];
            
            // Create cluster position
            const clusterX = 50 + (i * 40);
            const clusterY = 100;
            
            // Spawn 5 resources per cluster
            for (let j = 0; j < 5; j++) {
                const offsetX = Math.floor(Math.random() * 8 - 4);
                const offsetY = Math.floor(Math.random() * 8 - 4);
                
                const resource = ResourceFactory.create(
                    this.renderer,
                    this.sprites.resource,
                    clusterX + offsetX,
                    clusterY + offsetY,
                    resourceType,
                    ENTITY_CONFIG.RESOURCES[resourceType].stackAmount
                );
                
                this.resources.push(resource);
            }
        }
        
        console.log(`✅ Spawned ${this.resources.length} resource nodes (4 clusters)`);
    }

    /**
     * Spawn buildings
     */
    private spawnBuildings(): void {
        // Spawn a Warehouse near queen
        const warehouse = BuildingFactory.create(
            this.renderer,
            this.sprites.building,
            this.sprites.building,
            95,
            85,
            'warehouse'
        );
        
        // Complete construction immediately for showcase
        warehouse.startConstruction();
        warehouse.addProgress(100);
        
        this.buildings.push(warehouse);
        
        // Spawn a Barracks
        const barracks = BuildingFactory.create(
            this.renderer,
            this.sprites.building,
            this.sprites.building,
            105,
            85,
            'barracks'
        );
        
        barracks.startConstruction();
        barracks.addProgress(100);
        
        this.buildings.push(barracks);
        
        console.log(`✅ Spawned ${this.buildings.length} buildings (Warehouse, Barracks)`);
    }

    /**
     * Setup all UI components
     */
    private setupUI(): void {
        const padding = 10;
        
        // Resource Display (top-left)
        this.resourceDisplay = new ResourceDisplayComponent(padding, padding, 'player');
        this.uiUnregisterFunctions.push(this.renderer.register(this.resourceDisplay));
        
        // Population Display (left side, below resources)
        this.populationDisplay = new PopulationDisplayComponent(padding, 100);
        this.uiUnregisterFunctions.push(this.renderer.register(this.populationDisplay));
        
        // Update initial population
        this.populationDisplay.updateTotal(this.ants.length, 50);
        
        // Power Bar (bottom center)
        this.powerBar = new PowerBarComponent(
            this.canvasWidth / 2 - 200,
            this.canvasHeight - 80
        );
        
        // Add powers if queen exists
        if (this.queen) {
            const powers = ['Lightning', 'Fireball', 'Blackhole', 'Tidalwave', 'FinalFlash'];
            powers.forEach((power, index) => {
                this.powerBar!.addPower(
                    index + 1, // key
                    power, // name
                    null, // No power sprites for now
                    10, // maxCooldown in seconds
                    false // Not locked
                );
            });
        }
        
        this.uiUnregisterFunctions.push(this.renderer.register(this.powerBar));
        
        // Queen Portrait (bottom-left)
        this.queenPortrait = new QueenPortraitComponent(
            padding,
            this.canvasHeight - 140,
            this.sprites.queen
        );
        this.uiUnregisterFunctions.push(this.renderer.register(this.queenPortrait));
        
        // Queen Commands (bottom mid-left)
        this.commandsUI = new QueenCommandsComponent(
            200,
            this.canvasHeight - 100
        );
        this.uiUnregisterFunctions.push(this.renderer.register(this.commandsUI));
        
        // Minimap (bottom-right)
        this.minimap = new MinimapComponent(
            this.canvasWidth - 160,
            this.canvasHeight - 160,
            150,
            150,
            this.worldWidth,
            this.worldHeight
        );
        this.minimap.setCamera(this.camera);
        this.uiUnregisterFunctions.push(this.renderer.register(this.minimap));
        
        console.log('✅ All UI components initialized');
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // Listen for minimap clicks to move camera
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.MINIMAP_CLICKED, (worldX: number, worldY: number) => {
                this.camera.moveTo(worldX, worldY);
                console.log(`📍 Camera moved to (${worldX.toFixed(0)}, ${worldY.toFixed(0)})`);
            })
        );
        
        // Listen for power usage
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.QUEEN_POWER_USED, (_queenId: string, powerName: string) => {
                console.log(`⚡ Queen used power: ${powerName}`);
            })
        );
        
        // Listen for resource collection
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.RESOURCE_COLLECTED, (_resourceId: string, type: string, amount: number) => {
                console.log(`🌾 Resource collected: ${amount} ${type}`);
            })
        );
        
        // Listen for entity deaths
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.ENTITY_DIED, (entityId: string) => {
                console.log(`💀 Entity died: ${entityId}`);
            })
        );
        
        // Listen for keyboard input to toggle debug mode
        this.eventUnsubscribers.push(
            EventBus.on(GameEvents.INPUT_KEY_PRESS, (keyCode: number) => {
                if (keyCode === 68) { // D key
                    this.debugMode = !this.debugMode;
                    CONFIG.DEBUG_MODE = this.debugMode;
                    console.log(`🔧 Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
                }
            })
        );
    }

    /**
     * Handle queen movement via InputManager
     */
    private handleQueenMovement(): void {
        if (!this.queen || !this.queen.isActive) return;
        
        const inputManager = InputManager.getInstance();
        const moveSpeed = 1; // Move 1 tile at a time
        let targetX = this.queen.gridX;
        let targetY = this.queen.gridY;
        
        // Use just-pressed for discrete tile-by-tile movement
        if (inputManager.isActionJustPressed('moveUp')) {
            targetY -= moveSpeed;
            console.log('⬆️ Move UP pressed');
        }
        if (inputManager.isActionJustPressed('moveDown')) {
            targetY += moveSpeed;
            console.log('⬇️ Move DOWN pressed');
        }
        if (inputManager.isActionJustPressed('moveLeft')) {
            targetX -= moveSpeed;
            console.log('⬅️ Move LEFT pressed');
        }
        if (inputManager.isActionJustPressed('moveRight')) {
            targetX += moveSpeed;
            console.log('➡️ Move RIGHT pressed');
        }
        
        // Move queen if position changed (direct tile movement)
        if (targetX !== this.queen.gridX || targetY !== this.queen.gridY) {
            console.log(`👑 Moving queen from (${this.queen.gridX}, ${this.queen.gridY}) to (${targetX}, ${targetY})`);
            this.queen.moveTo(targetX, targetY);
            console.log(`👑 Queen position after move: (${this.queen.gridX}, ${this.queen.gridY}), world: (${this.queen.worldX}, ${this.queen.worldY})`);
        }
    }

    /**
     * Update scene (called every frame)
     */
    update(): void {
        // Handle queen movement via InputManager
        this.handleQueenMovement();
        
        // Update queen
        if (this.queen && this.queen.isActive) {
            this.queen.update(1/60); // Assume 60 FPS
            // Camera following handled by CameraManager automatically via CAMERA_FOLLOW_ENTITY event
        }
        
        // Update camera (CameraManager handles following automatically)
        const { CameraManager } = require('../managers/CameraManager');
        CameraManager.getInstance().update();
        
        // Update ants
        for (const ant of this.ants) {
            if (ant.isActive) {
                ant.update(1/60);
            }
        }
        
        // Update boss
        if (this.boss && this.boss.isActive) {
            this.boss.update(1/60);
        }
        
        // Update buildings
        for (const building of this.buildings) {
            if (building.isActive) {
                building.update(1/60);
            }
        }
        
        // Update UI components
        // PowerBar updates automatically via EventBus
        
        if (this.queenPortrait) {
            this.queenPortrait.update();
        }
        
        // CRITICAL: Force entity and UI layers dirty every frame for animations
        // Without movement, ENTITY_MOVED won't fire and layers stay cached
        this.renderer.markLayerDirty(RenderLayer.ENTITIES);
        this.renderer.markLayerDirty(RenderLayer.UI);
    }

    /**
     * Handle mouse clicks
     */
    handleMouseClick(x: number, y: number): void {
        // Handle UI clicks
        if (this.commandsUI) {
            this.commandsUI.handleClick(x, y);
        }
        
        if (this.minimap) {
            this.minimap.handleClick(x, y);
        }
        
        if (this.populationDisplay) {
            this.populationDisplay.handleClick(x, y);
        }
    }

    /**
     * Handle mouse button release
     */
    handleMouseUp(_x: number, _y: number): void {
        // No drag operations in this scene
    }
    
    /**
     * Handle window resize
     */
    onResize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
        // UI components would need repositioning here
    }
    
    /**
     * Handle mouse movement
     */
    handleMouseMove(x: number, y: number): void {
        // Handle UI hover states
        if (this.commandsUI) {
            this.commandsUI.handleMouseMove(x, y);
        }
        
        if (this.minimap) {
            this.minimap.handleMouseMove(x, y);
        }
    }

    /**
     * Cleanup when leaving scene
     */
    exit(): void {
        console.log('👋 Exiting Entity Showcase Scene');
        
        // Unregister UI components
        for (const unregister of this.uiUnregisterFunctions) {
            unregister();
        }
        this.uiUnregisterFunctions = [];
        
        // Unsubscribe from events
        for (const unsubscribe of this.eventUnsubscribers) {
            unsubscribe();
        }
        this.eventUnsubscribers = [];
        
        // Destroy entities
        if (this.queen) {
            this.queen.destroy();
        }
        
        for (const ant of this.ants) {
            ant.destroy();
        }
        
        if (this.boss) {
            this.boss.destroy();
        }
        
        for (const resource of this.resources) {
            resource.destroy();
        }
        
        for (const building of this.buildings) {
            building.destroy();
        }
        
        // Clear references
        this.queen = null;
        this.ants = [];
        this.boss = null;
        this.resources = [];
        this.buildings = [];
        
        console.log('✅ Entity Showcase Scene cleaned up');
    }
}
