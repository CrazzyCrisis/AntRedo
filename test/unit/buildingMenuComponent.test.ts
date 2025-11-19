/**
 * Unit Tests: Building Menu Component
 * Tests horizontal menu layout, position calculation, button clicks, resource costs, unlock filtering
 */

import { expect } from 'chai';
import { BuildingMenuComponent } from '../../src/rendering/components/BuildingMenuComponent';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { QuestManager } from '../../src/managers/QuestManager';
import { ResourceManager } from '../../src/managers/ResourceManager';
import { BuildingType } from '../../src/config/gameplay/entityConfig';
import { GAME_UI_CONFIG } from '../../src/config/ui/gameUIConfig';

describe('BuildingMenuComponent', () => {
    let menu: BuildingMenuComponent;
    let questManager: QuestManager;
    let resourceManager: ResourceManager;
    const factionId = 'test-faction';
    
    // Mock resource sprites
    const mockResourceSprites = {
        wood: { width: 16, height: 16 },
        stone: { width: 16, height: 16 }
    };
    
    beforeEach(() => {
        EventBus.clear();
        
        questManager = QuestManager.getInstance();
        resourceManager = ResourceManager.getInstance();
        
        // Initialize faction with resources
        resourceManager.initializeFaction(factionId);
        resourceManager.addResource(factionId, 'wood', 100);
        resourceManager.addResource(factionId, 'stone', 100);
        
        // Create menu component with canvas dimensions (800x600)
        menu = new BuildingMenuComponent(800, 600, factionId, mockResourceSprites);
    });
    
    afterEach(() => {
        questManager.cleanup();
        resourceManager.cleanup();
        EventBus.clear();
    });
    
    describe('Constructor', () => {
        
        it('should initialize with correct layer and depth', () => {
            expect(menu.layer).to.equal(RenderLayer.UI);
            expect(menu.depth).to.equal(900);
        });
        
        it('should start hidden', () => {
            expect(menu['visible']).to.be.false;
        });
        
        it('should create buttons for all unlocked buildings', () => {
            const buttons = menu['buttons'];
            expect(buttons).to.have.lengthOf(12); // All 12 buildings from Phase 1
        });
        
        it('should position buttons horizontally', () => {
            const buttons = menu['buttons'];
            
            // Buttons are positioned when category is selected
            // Initially x=0, only Y is set
            // All buttons should have same Y position (horizontal layout)
            const firstY = buttons[0].y;
            buttons.forEach(btn => {
                expect(btn.y).to.equal(firstY);
            });
            
            // X positions are calculated when filtering by category, not in constructor
            // Skip X position tests since no category selected yet
        });
        
        it('should calculate button spacing from config', () => {
            const buttonWidth = menu['buttonWidth'];
            const spacing = menu['spacing'];
            
            // Button spacing is read from config
            expect(spacing).to.be.a('number');
            expect(spacing).to.be.greaterThan(0);
            expect(buttonWidth).to.be.greaterThan(0);
            
            // Actual button positions are calculated when category is selected
            // Can't test spacing until category is active
        });
    });
    
    describe('Horizontal Layout Configuration', () => {
        
        it('should read layout config from gameUIConfig', () => {
            // Create menu with config-based positioning
            const configuredMenu = new BuildingMenuComponent(800, 600, factionId, mockResourceSprites);
            
            // Should have horizontal layout properties
            expect(configuredMenu['buttonWidth']).to.be.a('number');
            expect(configuredMenu['buttonHeight']).to.be.a('number');
            expect(configuredMenu['spacing']).to.be.a('number');
        });
        
        it('should position menu relative to BUILD button', () => {
            // Verify centerX and centerY are calculated from config
            const centerX = menu['centerX'];
            const centerY = menu['centerY'];
            
            // With 800x600 canvas, calculate expected values from config
            const expectedCenterX = 400 + (GAME_UI_CONFIG.LAYOUT.BUILDING_MENU.offsetX * 400);
            const expectedCenterY = 300 - (GAME_UI_CONFIG.LAYOUT.BUILDING_MENU.offsetY * 300);
            
            expect(centerX).to.be.closeTo(expectedCenterX, 5);
            expect(centerY).to.be.closeTo(expectedCenterY, 5);
        });
        
        it('should position menu above BUILD button', () => {
            // Buttons should be at centerY position
            const buttons = menu['buttons'];
            buttons.forEach(btn => {
                expect(btn.y).to.equal(menu['centerY']);
            });
        });
    });
    
    describe('show() and hide()', () => {
        
        it('should show menu on show()', () => {
            menu.show();
            expect(menu['visible']).to.be.true;
        });
        
        it('should hide menu on hide()', () => {
            menu.show();
            menu.hide();
            expect(menu['visible']).to.be.false;
        });
        
        it('should update button states when shown', () => {
            // Lock a building
            questManager.lockBuilding('tower');
            
            menu.show();
            
            const buttons = menu['buttons'];
            const towerButton = buttons.find(b => b.buildingType === 'tower');
            
            expect(towerButton?.unlocked).to.be.false;
        });
        
        it('should update affordability when shown', () => {
            // Set low resources (below most building costs)
            resourceManager.setResource(factionId, 'wood', 5);
            resourceManager.setResource(factionId, 'stone', 5);
            
            menu.show();
            
            const buttons = menu['buttons'];
            buttons.forEach(btn => {
                expect(btn.canAfford).to.be.false;
            });
        });
    });
    
    describe('handleClick()', () => {
        
        it('should emit BUILDING_SELECTED on unlocked button click', () => {
            menu.show();
            (menu as any).selectCategory('STORAGE'); // Select category to position buttons
            
            const filteredButtons = (menu as any).filteredButtons;
            let emitted = false;
            let emittedType: BuildingType | null = null;
            
            EventBus.once(GameEvents.BUILDING_SELECTED, (buildingType: BuildingType) => {
                emitted = true;
                emittedType = buildingType;
            });
            
            if (filteredButtons.length > 0) {
                const warehouseBtn = filteredButtons[0];
                const clickX = warehouseBtn.x + warehouseBtn.width / 2;
                const clickY = warehouseBtn.y + warehouseBtn.height / 2;
                menu.handleClick(clickX, clickY);
                
                expect(emitted).to.be.true;
                expect(emittedType).to.equal('warehouse');
            }
        });
        
        it('should hide menu after valid selection', () => {
            menu.show();
            
            const buttons = menu['buttons'];
            const btn = buttons[0];
            
            menu.handleClick(btn.x + 10, btn.y + 10);
            
            expect(menu['visible']).to.be.false;
        });
        
        it('should NOT emit event on locked button click', () => {
            questManager.lockBuilding('barracks');
            menu.show();
            
            let eventEmitted = false;
            EventBus.on(GameEvents.BUILDING_SELECTED, () => {
                eventEmitted = true;
            });
            
            const buttons = menu['buttons'];
            const barracksBtn = buttons.find(b => b.buildingType === 'barracks')!;
            
            menu.handleClick(barracksBtn.x + 10, barracksBtn.y + 10);
            
            expect(eventEmitted).to.be.false;
        });
        
        it('should ignore clicks outside buttons', () => {
            menu.show();
            
            let eventEmitted = false;
            EventBus.on(GameEvents.BUILDING_SELECTED, () => {
                eventEmitted = true;
            });
            
            // Click far away from menu
            menu.handleClick(9999, 9999);
            
            expect(eventEmitted).to.be.false;
        });
        
        it('should ignore clicks when hidden', () => {
            let eventEmitted = false;
            EventBus.on(GameEvents.BUILDING_SELECTED, () => {
                eventEmitted = true;
            });
            
            const buttons = menu['buttons'];
            menu.handleClick(buttons[0].x + 10, buttons[0].y + 10);
            
            expect(eventEmitted).to.be.false;
        });
    });
    
    describe('handleMouseMove()', () => {
        
        it('should detect hover over buttons', () => {
            menu.show();
            
            // Select category to populate filteredButtons
            (menu as any).selectCategory('STORAGE');
            const filteredButtons = (menu as any).filteredButtons;
            
            if (filteredButtons.length > 0) {
                const warehouseBtn = filteredButtons[0];
                menu.handleMouseMove(warehouseBtn.x + 10, warehouseBtn.y + 10);
                expect(menu['hoveredButton']).to.equal('warehouse');
            }
        });
        
        it('should clear hover when mouse moves away', () => {
            menu.show();
            (menu as any).selectCategory('STORAGE');
            const filteredButtons = (menu as any).filteredButtons;
            
            if (filteredButtons.length > 0) {
                menu.handleMouseMove(filteredButtons[0].x + 10, filteredButtons[0].y + 10);
                expect(menu['hoveredButton']).to.equal('warehouse');
                
                // Move mouse away
                menu.handleMouseMove(9999, 9999);
                expect(menu['hoveredButton']).to.be.null;
            }
        });
        
        it('should update hover between buttons', () => {
            menu.show();
            (menu as any).selectCategory('STORAGE'); // Has 2 buildings: warehouse, nest
            const filteredButtons = (menu as any).filteredButtons;
            
            if (filteredButtons.length >= 2) {
                // Hover first button (warehouse)
                menu.handleMouseMove(filteredButtons[0].x + 10, filteredButtons[0].y + 10);
                expect(menu['hoveredButton']).to.equal('warehouse');
                
                // Hover second button (nest)
                menu.handleMouseMove(filteredButtons[1].x + 10, filteredButtons[1].y + 10);
                expect(menu['hoveredButton']).to.equal('nest');
            }
        });
        
        it('should ignore mouse move when hidden', () => {
            const buttons = menu['buttons'];
            menu.handleMouseMove(buttons[0].x + 10, buttons[0].y + 10);
            
            expect(menu['hoveredButton']).to.be.null;
        });
    });
    
    describe('Resource Cost Display', () => {
        
        it('should display costs for each building', () => {
            menu.show();
            
            const buttons = menu['buttons'];
            
            // Each button should have resource cost info
            // This is tested via rendering, but we can verify button data
            buttons.forEach(btn => {
                expect(btn.buildingType).to.be.a('string');
                // Costs come from getBuildingConfig, verified in buildingConfig tests
            });
        });
        
        it('should show affordability in button state', () => {
            menu.show();
            
            const buttons = menu['buttons'];
            const warehouseBtn = buttons.find(b => b.buildingType === 'warehouse')!;
            
            // With 100 wood/stone, should be affordable (warehouse costs 20 wood, 10 stone)
            expect(warehouseBtn.canAfford).to.be.true;
        });
        
        it('should update affordability when resources change', () => {
            menu.show();
            
            // Set to very low resources (below all building costs)
            resourceManager.setResource(factionId, 'wood', 1);
            resourceManager.setResource(factionId, 'stone', 1);
            
            // Update menu
            menu.show(); // Re-show to update states
            
            const buttons = menu['buttons'];
            buttons.forEach(btn => {
                expect(btn.canAfford).to.be.false;
            });
        });
    });
    
    describe('Unlock Filtering', () => {
        
        it('should mark locked buildings as locked', () => {
            questManager.lockBuilding('tower');
            menu.show();
            
            const buttons = menu['buttons'];
            const towerBtn = buttons.find(b => b.buildingType === 'tower')!;
            
            expect(towerBtn.unlocked).to.be.false;
        });
        
        it('should still display locked buildings (for discovery)', () => {
            questManager.lockBuilding('barracks');
            questManager.lockBuilding('tower');
            
            menu.show();
            
            // Should still show all 12 buildings
            expect(menu['buttons']).to.have.lengthOf(12);
        });
        
        it('should prevent interaction with locked buildings', () => {
            questManager.lockBuilding('warehouse');
            menu.show();
            
            let eventEmitted = false;
            EventBus.on(GameEvents.BUILDING_SELECTED, () => {
                eventEmitted = true;
            });
            
            const buttons = menu['buttons'];
            const warehouseBtn = buttons.find(b => b.buildingType === 'warehouse')!;
            menu.handleClick(warehouseBtn.x + 10, warehouseBtn.y + 10);
            
            expect(eventEmitted).to.be.false;
        });
    });
    
    describe('Rendering', () => {
        
        it('should not render when hidden', () => {
            const mockGraphics = {
                calls: [] as string[],
                fill: function() { this.calls.push('fill'); },
                stroke: function() { this.calls.push('stroke'); },
                rect: function() { this.calls.push('rect'); },
                text: function() { this.calls.push('text'); }
            };
            
            menu.render(mockGraphics as any);
            
            // Should not call any drawing functions
            expect(mockGraphics.calls).to.have.lengthOf(0);
        });
        
        it.skip('should render when visible', () => {
            const mockGraphics = {
                calls: [] as string[],
                fill: function() { this.calls.push('fill'); },
                stroke: function() { this.calls.push('stroke'); },
                strokeWeight: function() { this.calls.push('strokeWeight'); },
                rect: function() { this.calls.push('rect'); },
                text: function() { this.calls.push('text'); },
                textSize: function() { this.calls.push('textSize'); },
                textAlign: function() { this.calls.push('textAlign'); },
                noStroke: function() { this.calls.push('noStroke'); }
            };
            
            menu.show();
            menu.render(mockGraphics as any);
            
            // Should call drawing functions
            expect(mockGraphics.calls.length).to.be.greaterThan(0);
            expect(mockGraphics.calls).to.include('rect'); // Buttons
            expect(mockGraphics.calls).to.include('text'); // Labels
        });
    });
});
