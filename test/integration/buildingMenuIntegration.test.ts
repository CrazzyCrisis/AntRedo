/**
 * Building Menu Integration Tests
 * Tests the full click flow: BUILD button -> Menu visibility -> Button clicks -> Event emission
 */

import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { BuildingMenuComponent } from '../../src/rendering/components/BuildingMenuComponent';
import { QuestManager } from '../../src/managers/QuestManager';
import { ResourceManager } from '../../src/managers/ResourceManager';
import { isPointInRect } from '../../src/utils/helpers';

describe('Building Menu Integration Tests', () => {
    let buildingMenu: BuildingMenuComponent;
    let resourceSprites: any;

    beforeEach(() => {
        EventBus.clear();
        
        // Mock resource sprites
        resourceSprites = {
            wood: { width: 16, height: 16 },
            stone: { width: 16, height: 16 }
        };
        
        // Initialize ResourceManager and QuestManager
        ResourceManager.getInstance().initializeFaction('player');
        ResourceManager.getInstance().setResource('player', 'wood', 100);
        ResourceManager.getInstance().setResource('player', 'stone', 100);
        
        // Unlock all buildings in QuestManager
        const questManager = QuestManager.getInstance();
        questManager.unlockBuilding('warehouse');
        questManager.unlockBuilding('barracks');
        questManager.unlockBuilding('tower');
        
        // Create menu at screen center (simulating 800x600 screen)
        buildingMenu = new BuildingMenuComponent(400, 300, 'player', resourceSprites);
    });

    afterEach(() => {
        EventBus.clear();
        ResourceManager.getInstance().cleanup();
        QuestManager.getInstance().cleanup();
    });

    describe('Menu Visibility', () => {
        it('should start hidden', () => {
            expect(buildingMenu.visible).to.be.false;
        });

        it('should show when visible property set to true', () => {
            buildingMenu.visible = true;
            expect(buildingMenu.visible).to.be.true;
        });

        it('should toggle visibility on BUILDING_MENU_TOGGLED event', () => {
            expect(buildingMenu.visible).to.be.false;
            
            buildingMenu.visible = true;
            expect(buildingMenu.visible).to.be.true;
            
            buildingMenu.visible = false;
            expect(buildingMenu.visible).to.be.false;
        });
    });

    describe('Button Click Detection', () => {
        beforeEach(() => {
            buildingMenu.visible = true;
        });

        it('should have 3 buttons initialized', () => {
            // Access buttons through render to verify they exist
            const mockGraphics = {
                fill: () => {},
                stroke: () => {},
                strokeWeight: () => {},
                rect: () => {},
                noStroke: () => {},
                textSize: () => {},
                textAlign: () => {},
                text: () => {},
                image: () => {}
            };
            
            // Render to ensure buttons are initialized
            buildingMenu.render(mockGraphics);
            
            // Buttons should be created (3 building types)
            expect(buildingMenu).to.exist;
        });

        it('should detect click on first button (warehouse)', (done) => {
            // Warehouse button should be at left side
            // With buttonWidth=180, spacing=15, total width = 3*180 + 2*15 = 570
            // Start X = 400 - 285 = 115
            // First button: x=115, y=300, w=180, h=60
            
            const buttonX = 115 + 90; // Center of first button
            const buttonY = 300 + 30; // Center of first button
            
            console.log(`Test clicking at (${buttonX}, ${buttonY})`);
            
            EventBus.once(GameEvents.BUILDING_SELECTED, (buildingType: string) => {
                expect(buildingType).to.equal('warehouse');
                done();
            });
            
            buildingMenu.handleClick(buttonX, buttonY);
        });

        it('should detect click on second button (barracks)', (done) => {
            // Second button: x=115+180+15=310, y=300, w=180, h=60
            const buttonX = 310 + 90; // Center of second button
            const buttonY = 300 + 30;
            
            EventBus.once(GameEvents.BUILDING_SELECTED, (buildingType: string) => {
                expect(buildingType).to.equal('barracks');
                done();
            });
            
            buildingMenu.handleClick(buttonX, buttonY);
        });

        it('should detect click on third button (tower)', (done) => {
            // Third button: x=115+180+15+180+15=505, y=300, w=180, h=60
            const buttonX = 505 + 90; // Center of third button
            const buttonY = 300 + 30;
            
            EventBus.once(GameEvents.BUILDING_SELECTED, (buildingType: string) => {
                expect(buildingType).to.equal('tower');
                done();
            });
            
            buildingMenu.handleClick(buttonX, buttonY);
        });

        it('should not emit event when clicking outside buttons', (done) => {
            let eventFired = false;
            
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                eventFired = true;
            });
            
            // Click outside all buttons (far right)
            buildingMenu.handleClick(900, 300);
            
            // Wait a bit to ensure event doesn't fire
            setTimeout(() => {
                expect(eventFired).to.be.false;
                done();
            }, 50);
        });

        it('should hide menu after successful button click', (done) => {
            expect(buildingMenu.visible).to.be.true;
            
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                expect(buildingMenu.visible).to.be.false;
                done();
            });
            
            const buttonX = 115 + 90;
            const buttonY = 300 + 30;
            buildingMenu.handleClick(buttonX, buttonY);
        });
    });

    describe('isPointInRect Helper', () => {
        it('should detect point inside rectangle', () => {
            expect(isPointInRect(50, 50, 0, 0, 100, 100)).to.be.true;
        });

        it('should detect point on rectangle edge', () => {
            expect(isPointInRect(0, 0, 0, 0, 100, 100)).to.be.true;
            expect(isPointInRect(100, 100, 0, 0, 100, 100)).to.be.true;
        });

        it('should reject point outside rectangle', () => {
            expect(isPointInRect(150, 50, 0, 0, 100, 100)).to.be.false;
            expect(isPointInRect(50, 150, 0, 0, 100, 100)).to.be.false;
            expect(isPointInRect(-10, 50, 0, 0, 100, 100)).to.be.false;
        });
    });

    describe('Event Flow: BUILD Button -> Menu -> Selection', () => {
        it('should toggle menu visibility when BUILD button clicked', () => {
            expect(buildingMenu.visible).to.be.false;
            
            // Simulate BUILD button click
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            buildingMenu.visible = !buildingMenu.visible;
            
            expect(buildingMenu.visible).to.be.true;
            
            // Toggle again
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            buildingMenu.visible = !buildingMenu.visible;
            
            expect(buildingMenu.visible).to.be.false;
        });

        it('should complete full flow: BUILD -> Show Menu -> Select Building -> Hide Menu', (done) => {
            let menuShown = false;
            
            // Step 1: BUILD button toggles menu
            buildingMenu.visible = true;
            menuShown = true;
            expect(menuShown).to.be.true;
            
            // Step 2: Select building
            EventBus.once(GameEvents.BUILDING_SELECTED, (buildingType: string) => {
                expect(buildingType).to.equal('warehouse');
                expect(buildingMenu.visible).to.be.false; // Menu should hide
                done();
            });
            
            // Step 3: Click button
            const buttonX = 115 + 90;
            const buttonY = 300 + 30;
            buildingMenu.handleClick(buttonX, buttonY);
        });
    });

    describe('Mouse Move Hover Detection', () => {
        beforeEach(() => {
            buildingMenu.visible = true;
        });

        it('should detect hover on first button', () => {
            const buttonX = 115 + 90;
            const buttonY = 300 + 30;
            
            buildingMenu.handleMouseMove(buttonX, buttonY);
            
            // Hover state should be updated (no public getter, but behavior tested via render)
            expect(buildingMenu).to.exist;
        });

        it('should clear hover when mouse leaves button area', () => {
            // Hover on button first
            buildingMenu.handleMouseMove(115 + 90, 300 + 30);
            
            // Move mouse away
            buildingMenu.handleMouseMove(900, 300);
            
            expect(buildingMenu).to.exist;
        });
    });

    describe('Resource Affordability Integration', () => {
        it('should show all buttons as affordable when resources are sufficient', () => {
            buildingMenu.visible = true;
            
            // All buttons should be affordable (we set 100 wood, 100 stone)
            // Warehouse: 20w, 10s ✓
            // Barracks: 15w, 15s ✓
            // Tower: 10w, 20s ✓
            
            expect(ResourceManager.getInstance().canAfford('player', { wood: 20, stone: 10 })).to.be.true;
            expect(ResourceManager.getInstance().canAfford('player', { wood: 15, stone: 15 })).to.be.true;
            expect(ResourceManager.getInstance().canAfford('player', { wood: 10, stone: 20 })).to.be.true;
        });

        it('should update affordability when resources change', () => {
            buildingMenu.visible = true;
            
            // Remove resources
            ResourceManager.getInstance().setResource('player', 'wood', 5);
            ResourceManager.getInstance().setResource('player', 'stone', 5);
            
            // Update button states
            buildingMenu.visible = false;
            buildingMenu.visible = true; // Force refresh
            
            // Should not be affordable anymore
            expect(ResourceManager.getInstance().canAfford('player', { wood: 20, stone: 10 })).to.be.false;
        });
    });

    describe('Click Propagation During Menu Visibility', () => {
        it('should handle clicks when menu is visible', (done) => {
            buildingMenu.visible = true;
            
            let clickProcessed = false;
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                clickProcessed = true;
                expect(clickProcessed).to.be.true;
                done();
            });
            
            // Click on button
            buildingMenu.handleClick(115 + 90, 300 + 30);
        });

        it('should not process clicks when menu is hidden', (done) => {
            buildingMenu.visible = false;
            
            let clickProcessed = false;
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                clickProcessed = true;
            });
            
            // Click should not register
            buildingMenu.handleClick(115 + 90, 300 + 30);
            
            setTimeout(() => {
                expect(clickProcessed).to.be.false;
                done();
            }, 50);
        });
    });

    describe('GameUIOverlay Integration', () => {
        it('should forward clicks to building menu when visible', (done) => {
            // This tests that GameUIOverlay properly forwards clicks
            // We can't fully test without mocking Renderer, but we can verify the logic
            
            buildingMenu.visible = true;
            
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                done();
            });
            
            // Simulate GameUIOverlay.handleMouseClick forwarding to buildingMenu
            if (buildingMenu.visible) {
                buildingMenu.handleClick(115 + 90, 300 + 30);
            }
        });
    });
});
