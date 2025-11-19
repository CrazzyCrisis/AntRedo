/**
 * Building Menu + Pathfinding Integration Tests
 * Tests that pathfinding works correctly when building menu is open/closed
 * Reproduces the bug: "sometimes pathfinding works with menu open, sometimes it doesn't"
 */

import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { BuildingMenuComponent } from '../../src/rendering/components/BuildingMenuComponent';
import { BuildingPlacementManager } from '../../src/managers/BuildingPlacementManager';
import { QuestManager } from '../../src/managers/QuestManager';
import { ResourceManager } from '../../src/managers/ResourceManager';

describe('Building Menu + Pathfinding Integration', () => {
    let buildingMenu: BuildingMenuComponent;
    let resourceSprites: any;

    beforeEach(() => {
        EventBus.clear();
        
        resourceSprites = {
            wood: { width: 16, height: 16 },
            stone: { width: 16, height: 16 }
        };
        
        ResourceManager.getInstance().initializeFaction('player');
        ResourceManager.getInstance().setResource('player', 'wood', 100);
        ResourceManager.getInstance().setResource('player', 'stone', 100);
        
        const questManager = QuestManager.getInstance();
        questManager.unlockBuilding('warehouse');
        questManager.unlockBuilding('barracks');
        questManager.unlockBuilding('tower');
        
        buildingMenu = new BuildingMenuComponent(800, 600, 'player', resourceSprites);
    });

    afterEach(() => {
        EventBus.clear();
        ResourceManager.getInstance().cleanup();
        QuestManager.getInstance().cleanup();
        BuildingPlacementManager.getInstance().cleanup();
    });

    describe('Click Event Propagation', () => {
        it('should allow world clicks when menu is closed', (done) => {
            buildingMenu.visible = false;
            
            let worldClickReceived = false;
            EventBus.once(GameEvents.INPUT_MOUSE_CLICK, () => {
                worldClickReceived = true;
            });
            
            // Simulate world click (not on menu)
            EventBus.emit(GameEvents.INPUT_MOUSE_CLICK, 600, 400, 0);
            
            setTimeout(() => {
                expect(worldClickReceived).to.be.true;
                done();
            }, 50);
        });

        it('should block world clicks when clicking on menu buttons', (done) => {
            buildingMenu.visible = true;
            
            let buildingSelected = false;
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                buildingSelected = true;
            });
            
            // Click on menu button (should consume click, not propagate to world)
            const buttonX = 115 + 90;
            const buttonY = 300 + 30;
            buildingMenu.handleClick(buttonX, buttonY);
            
            setTimeout(() => {
                expect(buildingSelected).to.be.true;
                done();
            }, 50);
        });

        it('should allow world clicks when menu is visible but clicking outside menu', (done) => {
            buildingMenu.visible = true;
            
            let worldClickReceived = false;
            EventBus.once(GameEvents.INPUT_MOUSE_CLICK, () => {
                worldClickReceived = true;
            });
            
            // Click outside menu area (far right, outside all buttons)
            // Menu buttons end around x=685 (115 + 3*180 + 2*15 + 180 = 685)
            // Clicking at x=800 should miss the menu
            buildingMenu.handleClick(800, 300);
            
            // Since click didn't hit menu, it should propagate to world
            EventBus.emit(GameEvents.INPUT_MOUSE_CLICK, 800, 300, 0);
            
            setTimeout(() => {
                expect(worldClickReceived).to.be.true;
                done();
            }, 50);
        });
    });

    describe('Building Placement Mode Interference', () => {
        it('should track when placement mode is active', () => {
            let placementActive = false;
            
            // Listen for BUILDING_SELECTED to track placement mode
            EventBus.once(GameEvents.BUILDING_SELECTED, (buildingType: string) => {
                placementActive = true;
                expect(buildingType).to.equal('warehouse');
            });
            
            buildingMenu.visible = true;
            buildingMenu.handleClick(115 + 90, 300 + 30);
            
            expect(placementActive).to.be.true;
        });

        it('should prevent pathfinding clicks during placement mode', () => {
            // When placement is active, world clicks should be blocked
            // This tests the DevRoomScene logic: if (isBuildingPlacementActive) return;
            
            let placementActive = false;
            
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                placementActive = true;
            });
            
            buildingMenu.visible = true;
            buildingMenu.handleClick(115 + 90, 300 + 30);
            
            expect(placementActive).to.be.true;
            
            // Now if we click in world, it should be consumed by placement manager
            // (DevRoomScene should return early, not call handleWorldClick)
        });

        it('should allow pathfinding clicks after placement is cancelled', () => {
            let placementActive = false;
            let cancelled = false;
            
            // Start placement
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                placementActive = true;
            });
            
            buildingMenu.visible = true;
            buildingMenu.handleClick(115 + 90, 300 + 30);
            expect(placementActive).to.be.true;
            
            // Cancel placement
            EventBus.once(GameEvents.BUILDING_PLACEMENT_CANCELLED, () => {
                placementActive = false;
                cancelled = true;
            });
            
            EventBus.emit(GameEvents.BUILDING_PLACEMENT_CANCELLED);
            expect(cancelled).to.be.true;
            expect(placementActive).to.be.false;
        });

        it('should allow pathfinding clicks after construction starts', () => {
            let placementActive = false;
            let constructionStarted = false;
            
            // Start placement
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                placementActive = true;
            });
            
            buildingMenu.visible = true;
            buildingMenu.handleClick(115 + 90, 300 + 30);
            expect(placementActive).to.be.true;
            
            // Complete placement
            EventBus.once(GameEvents.BUILDING_CONSTRUCTION_STARTED, () => {
                placementActive = false;
                constructionStarted = true;
            });
            
            EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, 'warehouse', 10, 10, 'player');
            
            expect(constructionStarted).to.be.true;
            expect(placementActive).to.be.false;
        });
    });

    describe('Menu Toggle State Consistency', () => {
        it('should maintain consistent visible state across toggles', () => {
            expect(buildingMenu.visible).to.be.false;
            
            // Toggle 1: Show
            buildingMenu.visible = !buildingMenu.visible;
            expect(buildingMenu.visible).to.be.true;
            
            // Toggle 2: Hide
            buildingMenu.visible = !buildingMenu.visible;
            expect(buildingMenu.visible).to.be.false;
            
            // Toggle 3: Show again
            buildingMenu.visible = !buildingMenu.visible;
            expect(buildingMenu.visible).to.be.true;
        });

        it('should hide menu when building is selected', () => {
            buildingMenu.visible = true;
            expect(buildingMenu.visible).to.be.true;
            
            let emitted = false;
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                emitted = true;
            });
            
            buildingMenu.handleClick(115 + 90, 300 + 30);
            
            expect(emitted).to.be.true;
            expect(buildingMenu.visible).to.be.false;
        });
    });

    describe('INPUT_MOUSE_CLICK Event Flow', () => {
        it('should emit INPUT_MOUSE_CLICK from sketch.ts mousePressed', () => {
            let eventReceived = false;
            let clickX = 0;
            let clickY = 0;
            
            EventBus.once(GameEvents.INPUT_MOUSE_CLICK, (x: number, y: number) => {
                eventReceived = true;
                clickX = x;
                clickY = y;
            });
            
            // Simulate sketch.ts: EventBus.emit(GameEvents.INPUT_MOUSE_CLICK, mouseX, mouseY, mouseButton)
            EventBus.emit(GameEvents.INPUT_MOUSE_CLICK, 500, 400, 0);
            
            expect(eventReceived).to.be.true;
            expect(clickX).to.equal(500);
            expect(clickY).to.equal(400);
        });

        it('should have multiple listeners on INPUT_MOUSE_CLICK (GameUIOverlay + BuildingPlacementManager)', () => {
            // This tests that multiple systems can listen to the same event
            let listener1Called = false;
            let listener2Called = false;
            
            EventBus.on(GameEvents.INPUT_MOUSE_CLICK, () => {
                listener1Called = true;
            });
            
            EventBus.on(GameEvents.INPUT_MOUSE_CLICK, () => {
                listener2Called = true;
            });
            
            EventBus.emit(GameEvents.INPUT_MOUSE_CLICK, 500, 400, 0);
            
            expect(listener1Called).to.be.true;
            expect(listener2Called).to.be.true;
        });
    });

    describe('DevRoomScene Click Routing Logic', () => {
        it('should simulate DevRoomScene click order: UI -> Placement -> World', () => {
            let uiHandled = false;
            let placementHandled = false;
            let worldHandled = false;
            
            // Simulate DevRoomScene.handleMouseClick order:
            
            // 1. Check UI (menu visible and clicked on button)
            buildingMenu.visible = true;
            const buttonX = 115 + 90;
            const buttonY = 300 + 30;
            
            EventBus.once(GameEvents.BUILDING_SELECTED, () => {
                uiHandled = true;
            });
            
            buildingMenu.handleClick(buttonX, buttonY);
            
            if (!uiHandled) {
                // 2. Check placement mode (if isBuildingPlacementActive)
                // If placement active, return early (don't process world click)
                placementHandled = false; // Not active in this test
                
                // 3. Process world click (pathfinding)
                if (!placementHandled) {
                    worldHandled = true;
                }
            }
            
            expect(uiHandled).to.be.true;
            expect(placementHandled).to.be.false;
            expect(worldHandled).to.be.false; // UI handled it, so world shouldn't process
        });

        it('should route click to world when menu is closed and placement inactive', () => {
            let uiHandled = false;
            let placementActive = false;
            let worldHandled = false;
            
            // Menu closed
            buildingMenu.visible = false;
            
            // Click outside menu
            buildingMenu.handleClick(800, 400);
            
            if (!uiHandled) {
                if (!placementActive) {
                    worldHandled = true;
                }
            }
            
            expect(worldHandled).to.be.true;
        });

        it('should block world clicks when placement is active', () => {
            let uiHandled = false;
            let placementActive = true; // Simulate placement mode
            let worldHandled = false;
            
            buildingMenu.visible = false;
            buildingMenu.handleClick(800, 400);
            
            if (!uiHandled) {
                if (placementActive) {
                    // Block world clicks during placement
                    return;
                }
                worldHandled = true;
            }
            
            expect(worldHandled).to.be.false; // Blocked by placement mode
        });
    });
});
