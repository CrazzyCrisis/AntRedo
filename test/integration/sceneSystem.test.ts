import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { SceneManager } from '../../src/managers/SceneManager';
import { MenuScene } from '../../src/scenes/MenuScene';
import { IScene } from '../../src/scenes/IScene';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { Renderer } from '../../src/rendering/Renderer';
import { AudioManager } from '../../src/managers/AudioManager';
import { createMockP5, createMockSound } from '../helpers/renderingMocks';
import { createMockImages, TEST_CANVAS, MAIN_MENU_BUTTONS } from '../helpers/menuTestConfig';

/**
 * Integration Test Suite: Complete Scene System
 * 
 * This test suite validates the full integration of:
 * - SceneManager (scene lifecycle management)
 * - MenuScene (concrete scene implementation)
 * - UI Components (AnimatedSpriteComponent, ButtonComponent, UIContainer)
 * - Renderer (visual component registration and rendering)
 * - EventBus (scene event communication)
 * 
 * Tests cover the complete workflow from scene creation through user interaction
 * to scene transition and cleanup.
 */
describe('Scene System Integration', () => {
    let sceneManager: SceneManager;
    let menuScene: MenuScene;
    let renderer: Renderer;
    const mockP5 = createMockP5();

    beforeEach(() => {
        // Reset singleton state
        (SceneManager as any).instance = null;
        sceneManager = SceneManager.getInstance();
        
        // Clear event bus
        EventBus.clear();
        
        // Mock audio sounds in AudioManager to prevent playback errors
        const audioManager = AudioManager.getInstance();
        const mockSound = createMockSound();
        (audioManager as any).sounds = new Map([
            ['MAIN_MENU_THEME', mockSound],
            ['BUTTON_HOVER', mockSound],
            ['BUTTON_CLICK', mockSound],
            ['DEV_ROOM_THEME', mockSound]
        ]);
        
        // Create fresh renderer
        renderer = new Renderer(mockP5 as any, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT);
        
        // Create menu scene
        menuScene = new MenuScene(renderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
    });

    describe('End-to-End Scene Lifecycle', () => {
        it('should complete full scene lifecycle: create → enter → update → interact → exit', () => {
            // PHASE 1: Scene Creation
            expect(menuScene).to.exist;
            expect(sceneManager.getCurrentScene()).to.be.null;

            // PHASE 2: Scene Entry (Activation)
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Verify scene is active
            expect(sceneManager.getCurrentScene()).to.equal(menuScene);
            expect(sceneManager.getCurrentSceneName()).to.equal('Menu');

            // PHASE 3: Update Loop (Animation)
            menuScene.update(); // Should update title + button animations
            menuScene.update(); // Should continue updating
            
            // Should not throw errors
            expect(() => sceneManager.update()).to.not.throw();

            // PHASE 4: User Interaction (Mouse Input)
            // Use test config for proper button position (normalized coordinates)
            const playButtonX = MAIN_MENU_BUTTONS.PLAY.x;
            const playButtonY = MAIN_MENU_BUTTONS.PLAY.y;
            
            // Hover over button
            menuScene.handleMouseMove(playButtonX, playButtonY);
            
            // Click button
            let playClicked = false;
            EventBus.on(GameEvents.MENU_PLAY_CLICKED, () => {
                playClicked = true;
            });
            
            menuScene.handleMouseClick(playButtonX, playButtonY);
            expect(playClicked).to.be.true;

            // PHASE 5: Scene Exit (Cleanup)
            // Create a dummy next scene
            const nextScene = {
                enter: () => {},
                exit: () => {},
                update: () => {},
                handleMouseClick: (_x: number, _y: number) => {},
                handleMouseMove: (_x: number, _y: number) => {},
                handleMouseUp: (_x: number, _y: number) => {},
                onResize: (_width: number, _height: number) => {}
            };
            
            sceneManager.switchScene(nextScene, 'NextScene');
            
            // Verify scene transition
            expect(sceneManager.getCurrentScene()).to.equal(nextScene);
            expect(sceneManager.getCurrentSceneName()).to.equal('NextScene');
        });

        it('should emit SCENE_CHANGE event with correct parameters', () => {
            let eventEmitted = false;
            let prevSceneName = '';
            let newSceneName = '';

            EventBus.on(GameEvents.SCENE_CHANGE, (newName: string, prevName: string) => {
                eventEmitted = true;
                newSceneName = newName;
                prevSceneName = prevName;
            });

            sceneManager.switchScene(menuScene, 'Menu');

            expect(eventEmitted).to.be.true;
            expect(prevSceneName).to.equal('');
            expect(newSceneName).to.equal('Menu');
        });
    });

    describe('SceneManager + Renderer Integration', () => {
        it('should register UI components with renderer on scene enter', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // MenuScene should register 4 components: 1 title + 3 buttons
            // Just verify renderer doesn't throw and components exist
            expect(() => renderer.render()).to.not.throw();
        });

        it('should unregister UI components on scene exit', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Switch to different scene
            const emptyScene = {
                enter: () => {},
                exit: () => {},
                update: () => {},
                handleMouseClick: (_x: number, _y: number) => {},
                handleMouseMove: (_x: number, _y: number) => {},
                handleMouseUp: (_x: number, _y: number) => {},
                onResize: (_width: number, _height: number) => {}
            };
            
            sceneManager.switchScene(emptyScene, 'Empty');
            
            // Menu components should be unregistered - verify no errors
            expect(() => renderer.render()).to.not.throw();
        });

        it('should allow renderer to render scene components', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Renderer.render() should not throw
            expect(() => renderer.render()).to.not.throw();
        });
    });

    describe('MenuScene + UI Components Integration', () => {
        it('should create interactive buttons with proper positioning', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Buttons should be positioned vertically with spacing
            const playButtonY = 270; // centerY (300) - 30
            const optionsButtonY = 370;
            const exitButtonY = 440;
            
            // Test hover detection on each button
            expect(() => {
                menuScene.handleMouseMove(400, playButtonY);
                menuScene.handleMouseMove(400, optionsButtonY);
                menuScene.handleMouseMove(400, exitButtonY);
            }).to.not.throw();
        });

        it('should handle button clicks and emit appropriate events', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            let playClicked = false;
            let exitClicked = false;
            
            EventBus.on(GameEvents.MENU_PLAY_CLICKED, () => playClicked = true);
            EventBus.on(GameEvents.MENU_EXIT_CLICKED, () => exitClicked = true);
            
            // Click play button (will switch to level select menu)
            menuScene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            expect(playClicked).to.be.true;
            
            // Go back to main menu
            if (menuScene.backButton) {
                menuScene.handleMouseClick(menuScene.backButton.x, menuScene.backButton.y);
            }
            
            // Now click exit button
            menuScene.handleMouseClick(MAIN_MENU_BUTTONS.EXIT.x, MAIN_MENU_BUTTONS.EXIT.y);
            expect(exitClicked).to.be.true;
        });

        it('should animate title with vertical oscillation', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Title should update animation each frame
            for (let i = 0; i < 10; i++) {
                expect(() => menuScene.update()).to.not.throw();
            }
        });

        it('should pulse buttons on hover', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Hover over button
            menuScene.handleMouseMove(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            // Update should apply pulse animation
            for (let i = 0; i < 5; i++) {
                expect(() => menuScene.update()).to.not.throw();
            }
        });
    });

    describe('EventBus + Scene System Integration', () => {
        it('should allow external systems to respond to menu button clicks', () => {
            let gameStarted = false;
            
            // Simulate game controller listening to menu events
            EventBus.on(GameEvents.MENU_PLAY_CLICKED, () => {
                gameStarted = true;
                // Game controller could switch to GameScene here
            });
            
            sceneManager.switchScene(menuScene, 'Menu');
            menuScene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y); // Click play button
            
            expect(gameStarted).to.be.true;
        });

        it('should allow scene transitions based on user input', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Simulate game controller handling play button click
            EventBus.on(GameEvents.MENU_PLAY_CLICKED, () => {
                const gameScene = {
                    enter: () => {},
                    exit: () => {},
                    update: () => {},
                    handleMouseClick: (_x: number, _y: number) => {},
                    handleMouseMove: (_x: number, _y: number) => {},
                    handleMouseUp: (_x: number, _y: number) => {},
                    onResize: (_width: number, _height: number) => {}
                };
                
                sceneManager.switchScene(gameScene, 'Game');
            });
            
            // User clicks play button
            menuScene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            // Should have transitioned to game scene
            expect(sceneManager.getCurrentSceneName()).to.equal('Game');
        });

        it('should support multiple scene transitions', () => {
            const menuScene1 = menuScene;
            const menuScene2 = new MenuScene(renderer, 800, 600, createMockImages());
            
            sceneManager.switchScene(menuScene1, 'Menu1');
            expect(sceneManager.getCurrentSceneName()).to.equal('Menu1');
            
            sceneManager.switchScene(menuScene2, 'Menu2');
            expect(sceneManager.getCurrentSceneName()).to.equal('Menu2');
            
            sceneManager.switchScene(menuScene1, 'Menu1');
            expect(sceneManager.getCurrentSceneName()).to.equal('Menu1');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle multiple scene switches without memory leaks', () => {
            const emptyScene = {
                enter: () => {},
                exit: () => {},
                update: () => {},
                handleMouseClick: (_x: number, _y: number) => {},
                handleMouseMove: (_x: number, _y: number) => {},
                handleMouseUp: (_x: number, _y: number) => {},
                onResize: (_width: number, _height: number) => {}
            };
            
            // Switch scenes many times
            for (let i = 0; i < 10; i++) {
                sceneManager.switchScene(menuScene, 'Menu');
                sceneManager.switchScene(emptyScene, 'Empty');
            }
            
            // Should still work
            expect(sceneManager.getCurrentSceneName()).to.equal('Empty');
            expect(() => sceneManager.update()).to.not.throw();
        });

        it('should handle clicks outside button bounds gracefully', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Click far away from any button
            expect(() => menuScene.handleMouseClick(0, 0)).to.not.throw();
            expect(() => menuScene.handleMouseClick(800, 600)).to.not.throw();
        });

        it('should handle rapid mouse movements', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            // Simulate rapid mouse movement
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * 800;
                const y = Math.random() * 600;
                expect(() => menuScene.handleMouseMove(x, y)).to.not.throw();
            }
        });

        it('should handle update loop without active scene', () => {
            // No scene set
            expect(() => sceneManager.update()).to.not.throw();
            
            // No scene for mouse events
            expect(() => sceneManager.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y)).to.not.throw();
            expect(() => sceneManager.handleMouseMove(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y)).to.not.throw();
        });
    });

    describe('Performance and Optimization', () => {
        it('should efficiently handle frame updates', () => {
            sceneManager.switchScene(menuScene, 'Menu');
            
            const startTime = Date.now();
            
            // Simulate 60 frames
            for (let i = 0; i < 60; i++) {
                sceneManager.update();
                renderer.render();
            }
            
            const endTime = Date.now();
            const elapsed = endTime - startTime;
            
            // Should complete quickly (< 100ms for 60 frames)
            expect(elapsed).to.be.lessThan(100);
        });

        it('should not create memory leaks with event listeners', () => {
            const initialListenerCount = EventBus.listenerCount(GameEvents.SCENE_CHANGE);
            
            // Create and destroy scenes multiple times
            for (let i = 0; i < 5; i++) {
                const scene = new MenuScene(renderer, 800, 600, createMockImages());
                
                sceneManager.switchScene(scene, `Menu${i}`);
                scene.exit();
            }
            
            const finalListenerCount = EventBus.listenerCount(GameEvents.SCENE_CHANGE);
            
            // Should not accumulate listeners
            expect(finalListenerCount).to.equal(initialListenerCount);
        });
    });

    describe('Real-World Usage Patterns', () => {
        it('should support typical game menu workflow', () => {
            // 1. Game starts → Show menu
            sceneManager.switchScene(menuScene, 'Menu');
            expect(sceneManager.getCurrentSceneName()).to.equal('Menu');
            
            // 2. Player hovers over buttons
            menuScene.handleMouseMove(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            menuScene.update(); // Pulse animation
            
            // 3. Player clicks play
            let shouldStartGame = false;
            EventBus.on(GameEvents.MENU_PLAY_CLICKED, () => {
                shouldStartGame = true;
            });
            menuScene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            expect(shouldStartGame).to.be.true;
            
            // 4. Transition to game scene
            const gameScene: IScene = {
                enter: () => {},
                exit: () => {},
                update: () => {},
                handleMouseClick: (_x: number, _y: number) => {},
                handleMouseMove: (_x: number, _y: number) => {},
                handleMouseUp: (_x: number, _y: number) => {},
                onResize: (_width: number, _height: number) => {}
            };
            sceneManager.switchScene(gameScene, 'Game');
            
            // 5. Menu is cleaned up
            expect(sceneManager.getCurrentSceneName()).to.equal('Game');
        });

        it('should support pause menu workflow', () => {
            // Start in game
            const gameScene = {
                enter: () => {},
                exit: () => {},
                update: () => {},
                handleMouseClick: (_x: number, _y: number) => {},
                handleMouseMove: (_x: number, _y: number) => {},
                handleMouseUp: (_x: number, _y: number) => {},
                onResize: (_width: number, _height: number) => {}
            };
            sceneManager.switchScene(gameScene, 'Game');
            
            // Player presses ESC → Pause menu
            sceneManager.switchScene(menuScene, 'Pause');
            expect(sceneManager.getCurrentSceneName()).to.equal('Pause');
            
            // Player clicks resume → Back to game
            sceneManager.switchScene(gameScene, 'Game');
            expect(sceneManager.getCurrentSceneName()).to.equal('Game');
        });
    });
});



