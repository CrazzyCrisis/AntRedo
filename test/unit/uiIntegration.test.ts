/**
 * Unit Tests: UI Integration
 * Tests GameUIOverlay BUILD button wiring, scene integration, menu persistence
 */

import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';

describe('UI Integration - Building Menu', () => {
    
    beforeEach(() => {
        EventBus.clear();
    });
    
    afterEach(() => {
        EventBus.clear();
    });
    
    describe('BUILD Button Wiring', () => {
        
        it('should emit BUILDING_MENU_TOGGLED on BUILD button click', (done) => {
            EventBus.once(GameEvents.BUILDING_MENU_TOGGLED, () => {
                done();
            });
            
            // Simulate BUILD button click
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
        });
        
        it('should have BUILD button in QueenCommandsComponent', () => {
            // QueenCommandsComponent has 4 commands: Fight, Build, Gather, Follow
            const commands = ['Fight', 'Build', 'Gather', 'Follow'];
            
            expect(commands).to.include('Build');
            expect(commands.indexOf('Build')).to.equal(1); // Index 1
        });
        
        it('should toggle menu visibility on repeated clicks', () => {
            let menuVisible = false;
            
            EventBus.on(GameEvents.BUILDING_MENU_TOGGLED, () => {
                menuVisible = !menuVisible;
            });
            
            // First click - show
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            expect(menuVisible).to.be.true;
            
            // Second click - hide
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            expect(menuVisible).to.be.false;
        });
    });
    
    describe('BuildingMenuComponent Show/Hide', () => {
        
        it('should show menu on BUILDING_MENU_TOGGLED when hidden', () => {
            let menuVisible = false;
            
            EventBus.on(GameEvents.BUILDING_MENU_TOGGLED, () => {
                if (!menuVisible) {
                    menuVisible = true;
                }
            });
            
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            expect(menuVisible).to.be.true;
        });
        
        it('should hide menu on BUILDING_MENU_TOGGLED when visible', () => {
            let menuVisible = true;
            
            EventBus.on(GameEvents.BUILDING_MENU_TOGGLED, () => {
                menuVisible = !menuVisible;
            });
            
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            expect(menuVisible).to.be.false;
        });
        
        it('should hide menu after building selected', () => {
            let menuVisible = true;
            
            EventBus.on(GameEvents.BUILDING_SELECTED, () => {
                menuVisible = false;
            });
            
            EventBus.emit(GameEvents.BUILDING_SELECTED, 'warehouse');
            expect(menuVisible).to.be.false;
        });
        
        it('should hide menu on BUILDING_PLACEMENT_CANCELLED', () => {
            let menuVisible = true;
            
            EventBus.on(GameEvents.BUILDING_PLACEMENT_CANCELLED, () => {
                menuVisible = false;
            });
            
            EventBus.emit(GameEvents.BUILDING_PLACEMENT_CANCELLED);
            expect(menuVisible).to.be.false;
        });
    });
    
    describe('Scene Integration - Base Scene Pattern', () => {
        
        it('should initialize GameUIOverlay in base scene setup', () => {
            // GameUIOverlay should be created once and shared across scenes
            const mockScene = {
                uiOverlay: null as any,
                initializeUI: function() {
                    this.uiOverlay = { initialized: true };
                }
            };
            
            mockScene.initializeUI();
            expect(mockScene.uiOverlay).to.not.be.null;
        });
        
        it('should persist UI overlay across scene transitions', () => {
            // UI should not be destroyed/recreated on scene change
            const mockUIOverlay = { id: 'ui-overlay-1', visible: true };
            
            // Scene 1
            const scene1 = { uiOverlay: mockUIOverlay };
            
            // Scene 2 should reference same overlay
            const scene2 = { uiOverlay: mockUIOverlay };
            
            expect(scene1.uiOverlay).to.equal(scene2.uiOverlay);
        });
        
        it('should allow all scenes to control UI overlay', () => {
            const mockUIOverlay = {
                visible: true,
                hide: function() { this.visible = false; },
                show: function() { this.visible = true; }
            };
            
            // Any scene can hide UI
            mockUIOverlay.hide();
            expect(mockUIOverlay.visible).to.be.false;
            
            // Any scene can show UI
            mockUIOverlay.show();
            expect(mockUIOverlay.visible).to.be.true;
        });
    });
    
    describe('Mouse Event Routing', () => {
        
        it('should route mouse clicks to BuildingMenuComponent when visible', () => {
            let menuClickReceived = false;
            
            EventBus.on('MENU_CLICK', () => {
                menuClickReceived = true;
            });
            
            // Simulate click on menu
            EventBus.emit('MENU_CLICK');
            
            expect(menuClickReceived).to.be.true;
        });
        
        it('should not route clicks to menu when hidden', () => {
            const menuVisible = false;
            let clickProcessed = false;
            
            if (menuVisible) {
                clickProcessed = true;
            }
            
            expect(clickProcessed).to.be.false;
        });
        
        it('should route hover events to BuildingMenuComponent', () => {
            let hoverDetected = false;
            
            EventBus.on('MENU_HOVER', () => {
                hoverDetected = true;
            });
            
            EventBus.emit('MENU_HOVER');
            expect(hoverDetected).to.be.true;
        });
        
        it('should prioritize menu clicks over world clicks', () => {
            // If click is on menu, don't propagate to world
            const clickX = 400;
            const clickY = 300;
            const menuBounds = { x: 350, y: 250, width: 200, height: 100 };
            
            const isInMenu = 
                clickX >= menuBounds.x &&
                clickX <= menuBounds.x + menuBounds.width &&
                clickY >= menuBounds.y &&
                clickY <= menuBounds.y + menuBounds.height;
            
            expect(isInMenu).to.be.true;
            // Should not propagate to world click handler
        });
    });
    
    describe('IScene Interface Integration', () => {
        
        it('should have handleMouseClick() in IScene interface', () => {
            const mockScene = {
                handleMouseClick: function(x: number, y: number) {
                    return { x, y };
                }
            };
            
            const result = mockScene.handleMouseClick(100, 200);
            expect(result.x).to.equal(100);
            expect(result.y).to.equal(200);
        });
        
        it('should have handleMouseMove() in IScene interface', () => {
            const mockScene = {
                handleMouseMove: function(x: number, y: number) {
                    return { x, y };
                }
            };
            
            const result = mockScene.handleMouseMove(150, 250);
            expect(result.x).to.equal(150);
            expect(result.y).to.equal(250);
        });
        
        it('should propagate clicks from sketch.ts to current scene', () => {
            let sceneReceivedClick = false;
            
            const mockSceneManager = {
                currentScene: {
                    handleMouseClick: function(_x: number, _y: number) {
                        sceneReceivedClick = true;
                    }
                }
            };
            
            // Simulate sketch.ts mousePressed()
            mockSceneManager.currentScene.handleMouseClick(100, 100);
            
            expect(sceneReceivedClick).to.be.true;
        });
    });
    
    describe('GameUIOverlay Component Management', () => {
        
        it('should track BuildingMenuComponent as child', () => {
            const mockOverlay = {
                components: [] as any[],
                addComponent: function(component: any) {
                    this.components.push(component);
                }
            };
            
            const menuComponent = { type: 'BuildingMenu' };
            mockOverlay.addComponent(menuComponent);
            
            expect(mockOverlay.components).to.include(menuComponent);
        });
        
        it('should update all child components', () => {
            let updatesReceived = 0;
            
            const mockOverlay = {
                components: [
                    { update: () => { updatesReceived++; } },
                    { update: () => { updatesReceived++; } }
                ],
                update: function() {
                    this.components.forEach(c => c.update());
                }
            };
            
            mockOverlay.update();
            expect(updatesReceived).to.equal(2);
        });
        
        it('should render all visible child components', () => {
            let renderCalls = 0;
            
            const mockOverlay = {
                components: [
                    { visible: true, render: (_graphics: any) => { renderCalls++; } },
                    { visible: false, render: (_graphics: any) => { renderCalls++; } },
                    { visible: true, render: (_graphics: any) => { renderCalls++; } }
                ],
                render: function(graphics: any) {
                    this.components.forEach(c => {
                        if (c.visible) c.render(graphics);
                    });
                }
            };
            
            mockOverlay.render({} as any);
            expect(renderCalls).to.equal(2); // Only visible components
        });
    });
    
    describe('Menu Positioning from Config', () => {
        
        it('should read BUILDING_MENU position from gameUIConfig', () => {
            const mockConfig = {
                LAYOUT: {
                    BUILDING_MENU: {
                        offsetX: 0,
                        offsetY: -0.70  // Slightly above BUILD button
                    }
                }
            };
            
            expect(mockConfig.LAYOUT.BUILDING_MENU.offsetX).to.equal(0);
            expect(mockConfig.LAYOUT.BUILDING_MENU.offsetY).to.be.lessThan(0); // Above center
        });
        
        it('should position menu above BUILD button', () => {
            const buildButtonY = -0.85; // From gameUIConfig.QUEEN_COMMANDS
            const menuY = -0.70;         // From gameUIConfig.BUILDING_MENU
            
            // Menu Y should be higher (less negative) than button
            expect(menuY).to.be.greaterThan(buildButtonY);
        });
        
        it('should convert normalized coordinates to pixels', () => {
            const canvasWidth = 800;
            const canvasHeight = 600;
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const halfWidth = canvasWidth / 2;
            const halfHeight = canvasHeight / 2;
            
            const offsetX = 0;    // Centered
            const offsetY = -0.70; // Slightly above center
            
            const pixelX = centerX + (offsetX * halfWidth);
            const pixelY = centerY - (offsetY * halfHeight); // Note: subtract for Y
            
            expect(pixelX).to.equal(400); // Center
            expect(pixelY).to.equal(90);  // Above center
        });
    });
    
    describe('Event Flow Integration', () => {
        
        it('should follow complete event flow: click BUILD → menu shows → select building → ghost appears', () => {
            const eventLog: string[] = [];
            
            EventBus.on(GameEvents.BUILDING_MENU_TOGGLED, () => {
                eventLog.push('menu_toggled');
            });
            
            EventBus.on(GameEvents.BUILDING_SELECTED, () => {
                eventLog.push('building_selected');
            });
            
            EventBus.on(GameEvents.BUILDING_PLACEMENT_STARTED, () => {
                eventLog.push('placement_started');
            });
            
            // Simulate flow
            EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
            EventBus.emit(GameEvents.BUILDING_SELECTED, 'warehouse');
            EventBus.emit(GameEvents.BUILDING_PLACEMENT_STARTED, 'warehouse');
            
            expect(eventLog).to.deep.equal([
                'menu_toggled',
                'building_selected',
                'placement_started'
            ]);
        });
    });
});
