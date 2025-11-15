/**
 * DevRoomScene - Development/testing room for world generation
 * Loads a procedurally generated world and displays it
 */

import {
    IScene,
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
    TILE_SIZE,
    ButtonComponent,
    DEV_ROOM_CONFIG,
    TILE_CONFIG,
    TileFrillSystem,
    updateMaterialPriorities,
    CONFIG,
    WorldPresetManager,
    WorldPreset,
    PauseMenuScene,
    InputManager,
    WorldGenConfigMenu
} from '../imports/sceneImports';

export class DevRoomScene implements IScene {
    private renderer: Renderer;
    private canvasWidth: number;
    private canvasHeight: number;
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
    
    // Spawning system
    private spawnManager: SpawnManager | null = null;
    private levelLoader: LevelLoader | null = null;
    private entitySprites: {
        ant: any;
        queen: any;
        boss: any;
        resource: any;
    } | null = null;
    
    // Tile colors from config (fallback)
    private tileColors: { [key: number]: string };

    constructor(
        renderer: Renderer, 
        canvasWidth: number, 
        canvasHeight: number, 
        backButtonImg: any, 
        tileSprites: { [key: number]: any }, 
        tileEdgeSprites: { [path: string]: any },
        entitySprites: { ant: any; queen: any; boss: any; resource: any } | null = null
    ) {
        this.renderer = renderer;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.backButtonImg = backButtonImg;
        this.tileSprites = tileSprites;
        this.tileEdgeSprites = tileEdgeSprites;
        this.entitySprites = entitySprites;
        this.gameState = GameStateManager.getInstance();
        this.worldGenerator = new WorldGenerator();
        this.inputManager = InputManager.getInstance();
        
        // Initialize tile colors from config (used only if sprites disabled)
        this.tileColors = TILE_CONFIG.COLORS;
    }

    enter(): void {
        // Start dev room music
        AudioManager.getInstance().playBGM('DEV_ROOM_THEME', true);
        
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
        } else {
            console.log('[DevRoomScene] Entity sprites not loaded - spawning system disabled');
        }
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
        const grid = tileGrid.getGrid();
        
        // Create a renderable that draws all tiles with frill overlays
        const tileRenderable = {
            id: 'tile_grid',
            layer: RenderLayer.GROUND,
            depth: 0,
            render: (graphics: any) => {
                // Draw each tile
                for (let row = 0; row < grid.length; row++) {
                    for (let col = 0; col < grid[row].length; col++) {
                        const tile = grid[row][col];
                        const x = col * TILE_SIZE;
                        const y = row * TILE_SIZE;
                        
                        if (TILE_CONFIG.USE_SPRITES) {
                            // Step 1: Draw base tile sprite
                            if (this.tileSprites[tile.type]) {
                                graphics.image(this.tileSprites[tile.type], x, y, TILE_SIZE, TILE_SIZE);
                            }
                            
                            // Step 2: Overlay frill sprites on top (if enabled)
                            if (TILE_CONFIG.USE_EDGES) {
                                const frillData = TileFrillSystem.getFrillOverlays(tileGrid, col, row);
                                
                                if (frillData.hasFrill) {
                                    // Render each frill overlay
                                    for (const frillPath of frillData.frillPaths) {
                                        const sprite = this.tileEdgeSprites[frillPath];
                                        if (sprite) {
                                            graphics.image(sprite, x, y, TILE_SIZE, TILE_SIZE);
                                        }
                                    }
                                }
                            }
                        } else {
                            // Draw colored rectangle (fallback)
                            const color = this.tileColors[tile.type] || '#FFFFFF';
                            graphics.fill(color);
                            graphics.noStroke();
                            graphics.rect(x, y, TILE_SIZE, TILE_SIZE);
                            
                            // Draw border for clarity
                            graphics.stroke(0, 50);
                            graphics.noFill();
                            graphics.rect(x, y, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
            }
        };

        this.tileRendererUnregister.push(this.renderer.register(tileRenderable));
        this.renderer.markLayerDirty(RenderLayer.GROUND);
        
        // Add grid overlay on top of tiles
        if (TILE_CONFIG.GRID_OVERLAY.ENABLED) {
            this.createGridOverlay(tileGrid);
        }
    }
    
    private createGridOverlay(tileGrid: TileGrid): void {
        const grid = tileGrid.getGrid();
        const gridWidth = grid[0].length * TILE_SIZE;
        const gridHeight = grid.length * TILE_SIZE;
        
        const gridRenderable = {
            id: 'tile_grid_overlay',
            layer: RenderLayer.GROUND_DECORATIONS,
            depth: 1000,  // Render on top of everything else in this layer
            render: (graphics: any) => {
                graphics.stroke(TILE_CONFIG.GRID_OVERLAY.COLOR);
                graphics.strokeWeight(TILE_CONFIG.GRID_OVERLAY.LINE_WEIGHT);
                (graphics as any).drawingContext.globalAlpha = TILE_CONFIG.GRID_OVERLAY.ALPHA / 255;
                
                // Draw vertical lines
                for (let col = 0; col <= grid[0].length; col++) {
                    const x = col * TILE_SIZE;
                    graphics.line(x, 0, x, gridHeight);
                }
                
                // Draw horizontal lines
                for (let row = 0; row <= grid.length; row++) {
                    const y = row * TILE_SIZE;
                    graphics.line(0, y, gridWidth, y);
                }
                
                // Reset alpha
                (graphics as any).drawingContext.globalAlpha = 1.0;
            }
        };
        
        this.tileRendererUnregister.push(this.renderer.register(gridRenderable));
        this.renderer.markLayerDirty(RenderLayer.GROUND_DECORATIONS);
    }

    exit(): void {
        // Stop dev room music
        AudioManager.getInstance().stopBGM();
        
        // Cleanup spawning system
        if (this.spawnManager) {
            this.spawnManager.clearAllSpawns();
        }
        if (this.levelLoader) {
            this.levelLoader.clearLevel();
        }
        
        // Unregister all renderables
        this.unregisterFunctions.forEach(unregister => unregister());
        this.unregisterFunctions = [];

        // Clear game state
        this.gameState.clearTileGrid();
    }

    update(): void {
        // Update pause menu if paused
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.update();
            return;
        }
        
        // Update world gen config menu if visible
        if (this.worldGenConfigMenu && this.worldGenConfigMenu.isVisible()) {
            this.worldGenConfigMenu.update();
        }
        
        // Update spawn manager (wave spawning, safe zone)
        if (this.spawnManager) {
            this.spawnManager.update(16.67); // ~60fps
        }
        
        // Update button animations
        if (this.backButton) {
            this.backButton.update();
            // Mark UI layer dirty so button hover effects are visible
            this.renderer.markLayerDirty(RenderLayer.UI);
        }
    }

    handleMouseClick(x: number, y: number): void {
        // Forward to pause menu if paused
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.handleMouseClick(x, y);
            return;
        }
        
        // Forward to world gen config menu if visible
        if (this.worldGenConfigMenu && this.worldGenConfigMenu.isVisible()) {
            this.worldGenConfigMenu.handleMouseClick(x, y);
        }
        
        // Handle button click
        if (this.backButton) {
            this.backButton.handleClick(x, y);
        }
    }

    handleMouseMove(x: number, y: number): void {
        // Forward to pause menu if paused
        if (this.isPaused && this.pauseMenu) {
            this.pauseMenu.handleMouseMove(x, y);
            return;
        }
        
        // Forward to world gen config menu if visible
        if (this.worldGenConfigMenu && this.worldGenConfigMenu.isVisible()) {
            this.worldGenConfigMenu.handleMouseMove(x, y);
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
        
        // Show URL with seed for easy sharing
        const url = `${window.location.origin}${window.location.pathname}?seed=${this.currentWorldSeed}`;
        console.log(`World preset "${presetName}" saved!`);
        console.log(`Seed: ${this.currentWorldSeed}`);
        console.log(`Share URL: ${url}`);
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
        
        console.log('[DevRoomScene] Initializing spawning system...');
        
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
                ['food', this.entitySprites.resource],
                ['wood', this.entitySprites.resource],
                ['stone', this.entitySprites.resource],
                ['magicCrystal', this.entitySprites.resource]
            ]),
            boss: this.entitySprites.boss,
            queen: this.entitySprites.queen
        });
        
        // Generate a procedural level (tutorial difficulty)
        const levelData = this.levelLoader.loadProceduralLevel({
            difficulty: 'easy',
            worldSize: { 
                width: DEV_ROOM_CONFIG.WORLD.WIDTH, 
                height: DEV_ROOM_CONFIG.WORLD.HEIGHT 
            },
            resourceAbundance: 'normal',
            enemyDensity: 'low',
            safeZoneDuration: 120, // 2 minutes
            wavesEnabled: true
        }, this.currentWorldSeed);
        
        console.log(`[DevRoomScene] Generated level: ${levelData.metadata.name}`);
        
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
                console.log(`⚔️ Wave ${data.waveNumber} spawned: ${data.antCount} enemies${data.hasBoss ? ' + BOSS' : ''}`);
            }
        });
        
        const safeZoneListener = EventBus.on(GameEvents.SAFE_ZONE_EXPIRED, () => {
            console.log('⚠️ Safe zone expired - enemies can spawn closer!');
        });
        
        this.unregisterFunctions.push(waveListener, safeZoneListener);
        
        EventBus.emit(GameEvents.LEVEL_START);
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
     * Hide world gen config menu
     */
    private hideWorldGenConfigMenu(): void {
        if (this.worldGenConfigMenu) {
            this.worldGenConfigMenu.hide();
            this.renderer.markLayerDirty(RenderLayer.UI);
        }
    }
}
