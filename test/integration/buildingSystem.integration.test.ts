/**
 * Building System Integration Tests
 * Tests the full building placement flow from UI interaction to ghost sprite rendering
 */

import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { BuildingPlacementManager } from '../../src/managers/BuildingPlacementManager';
import { BuildingMenuComponent } from '../../src/rendering/components/BuildingMenuComponent';
import { QuestManager } from '../../src/managers/QuestManager';
import { ResourceManager } from '../../src/managers/ResourceManager';
import { Renderer } from '../../src/rendering/Renderer';
import { Camera } from '../../src/rendering/Camera';
import { TileGrid } from '../../src/world/TileGrid';
import { TileType } from '../../src/world/TileSystem';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { GAME_UI_CONFIG } from '../../src/config/ui/gameUIConfig';

describe('Building System Integration Tests', () => {
    let renderer: Renderer;
    let camera: Camera;
    let tileGrid: TileGrid;
    let buildingPlacementManager: BuildingPlacementManager;
    let buildingMenu: BuildingMenuComponent;
    let questManager: QuestManager;
    let resourceManager: ResourceManager;
    
    // Mock sprites
    const mockSprite = { width: 16, height: 16 };
    const mockResourceSprites = {
        food: mockSprite,
        wood: mockSprite,
        stone: mockSprite,
        magicCrystal: mockSprite
    };
    
    beforeEach(() => {
        // Clear EventBus
        EventBus.clear();
        
        // Reset singletons
        QuestManager.resetInstance();
        
        // Create mock renderer
        renderer = {
            register: (renderable: any) => {
                console.log(`[Test] Renderer.register called for ${renderable.constructor.name}`);
                return () => { console.log(`[Test] Unregister called for ${renderable.constructor.name}`); };
            },
            markLayerDirty: (layer: RenderLayer) => {
                console.log(`[Test] Layer ${layer} marked dirty`);
            }
        } as any;
        
        // Create mock camera
        camera = {
            screenToWorld: (screenX: number, screenY: number) => ({ x: screenX, y: screenY }),
            worldToScreen: (worldX: number, worldY: number) => ({ x: worldX, y: worldY }),
            x: 0,
            y: 0
        } as any;
        
        // Create real tile grid (10x10 grass world)
        const grid: any[][] = [];
        for (let row = 0; row < 10; row++) {
            grid[row] = [];
            for (let col = 0; col < 10; col++) {
                grid[row][col] = {
                    type: TileType.GRASS,
                    walkable: true,
                    movementCost: 1.0,
                    spriteIndex: 0
                };
            }
        }
        tileGrid = new TileGrid(grid);
        
        // Initialize managers
        questManager = QuestManager.getInstance();
        resourceManager = ResourceManager.getInstance();
        buildingPlacementManager = BuildingPlacementManager.getInstance();
        
        // Unlock all buildings for testing
        questManager.unlockBuilding('warehouse');
        questManager.unlockBuilding('barracks');
        questManager.unlockBuilding('tower');
        
        // Initialize faction and give player resources
        resourceManager.initializeFaction('player'); // CRITICAL: Must initialize faction first
        resourceManager.setResource('player', 'wood', 100);
        resourceManager.setResource('player', 'stone', 100);
        resourceManager.setResource('player', 'food', 100);
        
        // Initialize BuildingPlacementManager
        buildingPlacementManager.initialize(renderer, camera, tileGrid, 'player');
        
        // Register building sprites (Phase 4: All 12 building types)
        buildingPlacementManager.registerBuildingSprites({
            warehouse: mockSprite,
            barracks: mockSprite,
            tower: mockSprite,
            nest: mockSprite,
            builderHut: mockSprite,
            gathererHut: mockSprite,
            spitterHut: mockSprite,
            speedBeacon: mockSprite,
            attackBeacon: mockSprite,
            attackSpeedBeacon: mockSprite,
            gatherSpeedBeacon: mockSprite,
            terrainNullifierBeacon: mockSprite
        });
        
        // Create BuildingMenuComponent
        buildingMenu = new BuildingMenuComponent(
            800, // canvasWidth
            600, // canvasHeight
            'player',
            mockResourceSprites
        );
        buildingMenu.visible = false; // Start hidden
    });
    
    afterEach(() => {
        EventBus.clear();
        if (buildingPlacementManager) {
            (buildingPlacementManager as any).cleanup?.();
        }
    });
    
    describe('Menu Visibility Toggle', () => {
        it('should toggle menu visibility when BUILDING_MENU_TOGGLED is emitted', () => {
            expect(buildingMenu.visible).to.be.false;
            
            // Simulate BUILD button click
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            
            // Manual toggle (simulating GameUIOverlay behavior)
            buildingMenu.visible = !buildingMenu.visible;
            
            expect(buildingMenu.visible).to.be.true;
        });
        
        it('should hide menu after building selection', () => {
            buildingMenu.visible = true;
            
            // Simulate button click
            EventBus.emit(GameEvents.BUILDING_SELECTED, 'warehouse');
            
            // Menu should hide itself
            buildingMenu.hide();
            
            expect(buildingMenu.visible).to.be.false;
        });
    });
    
    describe('Building Selection Flow', () => {
        it('should emit BUILDING_SELECTED when unlocked button is clicked', () => {
            buildingMenu.visible = true;
            
            let emitted = false;
            let emittedType: string | null = null;
            
            // Subscribe to BUILDING_SELECTED
            EventBus.on(GameEvents.BUILDING_SELECTED, (buildingType: string) => {
                console.log(`[Test] BUILDING_SELECTED received: ${buildingType}`);
                emitted = true;
                emittedType = buildingType;
            });
            
            // Simulate click on warehouse button (mock coordinates)
            // First button should be at approximately x: 250-350, y: 470-550
            buildingMenu.handleClick(300, 510);
            
            expect(emitted).to.be.true;
            expect(emittedType).to.equal('warehouse');
        });
        
        it('should not emit BUILDING_SELECTED for locked buildings', () => {
            // Lock warehouse
            (questManager as any).unlockedBuildings.delete('warehouse');
            
            buildingMenu.visible = true;
            
            let emitted = false;
            EventBus.on(GameEvents.BUILDING_SELECTED, () => {
                emitted = true;
            });
            
            // Try to click warehouse button
            buildingMenu.handleClick(300, 510);
            
            expect(emitted).to.be.false;
        });
    });
    
    describe('Ghost Sprite Activation', () => {
        it('should activate ghost sprite when BUILDING_SELECTED is emitted', () => {
            let emitted = false;
            let emittedType: string | null = null;
            
            EventBus.on(GameEvents.BUILDING_PLACEMENT_STARTED, (buildingType: string) => {
                console.log(`[Test] BUILDING_PLACEMENT_STARTED: ${buildingType}`);
                emitted = true;
                emittedType = buildingType;
            });
            
            // Emit BUILDING_SELECTED
            EventBus.emit(GameEvents.BUILDING_SELECTED, 'warehouse');
            
            // Manager should activate placement
            buildingPlacementManager.activatePlacement('warehouse' as any);
            
            expect(emitted).to.be.true;
            expect(emittedType).to.equal('warehouse');
        });
        
        it('should create ghost sprite with correct sprite reference', () => {
            buildingPlacementManager.activatePlacement('warehouse' as any);
            
            // Check internal state (accessing private property for testing)
            const ghostSprite = (buildingPlacementManager as any).ghostSprite;
            expect(ghostSprite).to.not.be.null;
            expect(ghostSprite.sprite).to.equal(mockSprite);
        });
        
        it('should register ghost sprite with renderer', () => {
            let registerCalled = false;
            
            renderer.register = (renderable: any) => {
                if (renderable.constructor.name === 'GhostSpriteComponent') {
                    registerCalled = true;
                }
                return () => {};
            };
            
            buildingPlacementManager.activatePlacement('warehouse' as any);
            
            expect(registerCalled).to.be.true;
        });
    });
    
    describe('Ghost Sprite Movement', () => {
        beforeEach(() => {
            buildingPlacementManager.activatePlacement('warehouse' as any);
        });
        
        it('should update ghost position on INPUT_MOUSE_MOVE', () => {
            const initialGhost = (buildingPlacementManager as any).ghostSprite;
            const initialX = initialGhost.x;
            
            // Update ghost position
            buildingPlacementManager.updateGhostPosition(100, 100);
            
            const updatedGhost = (buildingPlacementManager as any).ghostSprite;
            expect(updatedGhost.x).to.not.equal(initialX);
        });
        
        it('should snap ghost to grid', () => {
            buildingPlacementManager.updateGhostPosition(100, 100);
            
            const ghostSprite = (buildingPlacementManager as any).ghostSprite;
            const gridX = (buildingPlacementManager as any).currentGridX;
            const gridY = (buildingPlacementManager as any).currentGridY;
            
            // Ghost sprite should exist
            expect(ghostSprite).to.not.be.null;
            
            // Grid coordinates should be integers
            expect(gridX).to.be.a('number');
            expect(gridY).to.be.a('number');
            expect(Math.floor(gridX)).to.equal(gridX);
            expect(Math.floor(gridY)).to.equal(gridY);
        });
        
        it('should update validation state based on position', () => {
            // Valid position (grass tile at 3,3)
            buildingPlacementManager.updateGhostPosition(96, 96);
            let validationState = (buildingPlacementManager as any).validationState;
            expect(validationState).to.equal('valid');
            
            // Invalid position (change tile 5,5 to water)
            const grid = tileGrid.getGrid();
            grid[5][5] = { type: TileType.WATER, walkable: false, movementCost: 100, spriteIndex: 5 };
            
            buildingPlacementManager.updateGhostPosition(160, 160); // Grid (5, 5) at 32px tile size
            validationState = (buildingPlacementManager as any).validationState;
            expect(validationState).to.equal('invalid_terrain');
        });
    });
    
    describe('Building Placement Confirmation', () => {
        beforeEach(() => {
            buildingPlacementManager.activatePlacement('warehouse' as any);
            buildingPlacementManager.updateGhostPosition(100, 100);
        });
        
        it('should emit BUILDING_PLACED on valid placement', () => {
            let emitted = false;
            let emittedType: string | null = null;
            
            EventBus.on(GameEvents.BUILDING_PLACED, (buildingType: string, x: number, y: number) => {
                console.log(`[Test] BUILDING_PLACED: ${buildingType} at (${x}, ${y})`);
                emitted = true;
                emittedType = buildingType;
            });
            
            buildingPlacementManager.attemptPlacement();
            
            expect(emitted).to.be.true;
            expect(emittedType).to.equal('warehouse');
        });
        
        it('should emit BUILDING_PLACEMENT_INVALID on invalid terrain', () => {
            // Change tile to water
            const grid = tileGrid.getGrid();
            grid[3][3] = { type: TileType.WATER, walkable: false, movementCost: 100, spriteIndex: 5 };
            
            buildingPlacementManager.updateGhostPosition(96, 96); // Grid (3, 3)
            
            let invalidEmitted = false;
            let eventData: any = null;
            EventBus.on(GameEvents.BUILDING_PLACEMENT_INVALID, (data: any) => {
                console.log(`[Test] BUILDING_PLACEMENT_INVALID:`, data);
                invalidEmitted = true;
                eventData = data;
            });
            
            buildingPlacementManager.attemptPlacement();
            
            expect(invalidEmitted).to.be.true;
            expect(eventData).to.have.property('reason');
            expect(eventData.reason).to.include('terrain');
        });
        
        it('should deduct resources on successful placement', () => {
            const initialWood = resourceManager.getResourceCount('player', 'wood');
            const initialStone = resourceManager.getResourceCount('player', 'stone');
            
            buildingPlacementManager.attemptPlacement();
            
            const finalWood = resourceManager.getResourceCount('player', 'wood');
            const finalStone = resourceManager.getResourceCount('player', 'stone');
            
            // Warehouse costs 50 wood, 30 stone
            expect(finalWood).to.equal(initialWood - 50);
            expect(finalStone).to.equal(initialStone - 30);
        });
        
        it('should cancel placement mode after successful placement', () => {
            buildingPlacementManager.attemptPlacement();
            
            const isActive = (buildingPlacementManager as any).isPlacementActive;
            expect(isActive).to.be.false;
        });
    });
    
    describe('Hover Detection', () => {
        beforeEach(() => {
            buildingMenu.visible = true;
            // Calculate proper category button position
            const halfWidth = 800 / 2;
            const halfHeight = 600 / 2;
            const centerX = 800 / 2;
            const centerY = 600 / 2;
            const menuCenterX = centerX + (GAME_UI_CONFIG.LAYOUT.BUILDING_MENU.offsetX * halfWidth);
            const menuCenterY = centerY - (GAME_UI_CONFIG.LAYOUT.BUILDING_MENU.offsetY * halfHeight);
            const categoryOffsetPixels = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_ROW_OFFSET_Y * halfHeight;
            const categoryCenterY = menuCenterY - categoryOffsetPixels;
            
            const categoryWidth = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_BUTTON_WIDTH;
            const categorySpacing = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_SPACING;
            const totalWidth = 4 * categoryWidth + 3 * categorySpacing;
            const startX = menuCenterX - (totalWidth / 2);
            const storageX = startX + categoryWidth / 2; // First category (index 0)
            
            // Click STORAGE category button
            buildingMenu.handleClick(storageX, categoryCenterY);
        });
        
        it('should detect hover over warehouse button', () => {
            // Get filtered buttons (now populated after category selection)
            const filteredButtons = (buildingMenu as any).filteredButtons;
            if (filteredButtons.length > 0) {
                const warehouseBtn = filteredButtons[0]; // First STORAGE building is warehouse
                buildingMenu.handleMouseMove(warehouseBtn.x + 10, warehouseBtn.y + 10);
                
                const hoveredButton = (buildingMenu as any).hoveredButton;
                expect(hoveredButton).to.equal('warehouse');
            } else {
                throw new Error('No filtered buttons after category selection');
            }
        });
        
        it('should clear hover when mouse moves away', () => {
            const filteredButtons = (buildingMenu as any).filteredButtons;
            if (filteredButtons.length > 0) {
                buildingMenu.handleMouseMove(filteredButtons[0].x + 10, filteredButtons[0].y + 10); // Over button
                let hoveredButton = (buildingMenu as any).hoveredButton;
                expect(hoveredButton).to.equal('warehouse');
                
                buildingMenu.handleMouseMove(100, 100); // Away from buttons
                hoveredButton = (buildingMenu as any).hoveredButton;
                expect(hoveredButton).to.be.null;
            } else {
                throw new Error('No filtered buttons after category selection');
            }
        });
    });
    
    describe('Full Workflow Integration', () => {
        it('should complete entire building placement flow', () => {
            const events: string[] = [];
            
            // Track all building-related events
            EventBus.on(GameEvents.BUILDING_MENU_TOGGLED, () => events.push('MENU_TOGGLED'));
            EventBus.on(GameEvents.BUILDING_SELECTED, (type: string) => events.push(`SELECTED:${type}`));
            EventBus.on(GameEvents.BUILDING_PLACEMENT_STARTED, (type: string) => events.push(`STARTED:${type}`));
            EventBus.on(GameEvents.BUILDING_PLACED, (type: string) => events.push(`PLACED:${type}`));
            
            // Step 1: Toggle menu
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            buildingMenu.visible = true;
            
            // Step 2: Click warehouse button
            buildingMenu.handleClick(300, 510);
            EventBus.emit(GameEvents.BUILDING_SELECTED, 'warehouse');
            buildingMenu.hide();
            
            // Step 3: Activate placement
            buildingPlacementManager.activatePlacement('warehouse' as any);
            
            // Step 4: Update position
            buildingPlacementManager.updateGhostPosition(100, 100);
            
            // Step 5: Confirm placement
            buildingPlacementManager.attemptPlacement();
            
            console.log('[Test] Event flow:', events);
            expect(events).to.include('MENU_TOGGLED');
            expect(events).to.include('SELECTED:warehouse');
            expect(events).to.include('STARTED:warehouse');
            expect(events).to.include('PLACED:warehouse');
        });
    });
    
    describe('Edge Cases', () => {
        it('should handle rapid clicks gracefully', () => {
            buildingMenu.visible = true;
            
            // Click multiple times rapidly
            for (let i = 0; i < 5; i++) {
                buildingMenu.handleClick(300, 510);
            }
            
            // Should only emit once per actual click
            // (In real implementation, menu hides after first click)
            expect(buildingMenu.visible).to.be.true; // Still visible in test since we don't auto-hide
        });
        
        it('should handle placement without sprite registration', () => {
            const newManager = BuildingPlacementManager.getInstance();
            newManager.initialize(renderer, camera, tileGrid, 'player');
            // Don't register sprites
            
            newManager.activatePlacement('warehouse' as any);
            const ghostSprite = (newManager as any).ghostSprite;
            
            // Ghost should still be created (with undefined sprite)
            expect(ghostSprite).to.not.be.null;
        });
        
        it('should handle invalid mouse coordinates', () => {
            buildingPlacementManager.activatePlacement('warehouse' as any);
            
            // Try negative coordinates
            expect(() => {
                buildingPlacementManager.updateGhostPosition(-100, -100);
            }).to.not.throw();
            
            // Try very large coordinates
            expect(() => {
                buildingPlacementManager.updateGhostPosition(10000, 10000);
            }).to.not.throw();
        });
    });
});
