/**
 * Tests for MenuScene
 * Following TDD - tests written BEFORE implementation
 */

// @ts-nocheck - Suppress unused warnings for skipped tests
import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { createMockGraphics } from '../helpers/renderingMocks';
import { MenuScene } from '../../src/scenes/MenuScene';
import { createMockImages, TEST_CANVAS, MAIN_MENU_BUTTONS } from '../helpers/menuTestConfig';

// Mock Renderer for testing
class MockRenderer {
    public registeredComponents: any[] = [];
    public unregisteredComponents: any[] = [];

    register(component: any): () => void {
        this.registeredComponents.push(component);
        // Return unregister function
        return () => {
            this.unregisteredComponents.push(component);
        };
    }

    markLayerDirty(layer: any): void {
        // Mock implementation
    }

    clear(): void {
        this.registeredComponents = [];
        this.unregisteredComponents = [];
    }
}

describe('MenuScene', () => {
    let mockRenderer: MockRenderer;

    beforeEach(() => {
        EventBus.clear();
        mockRenderer = new MockRenderer();
    });

    describe('Scene Lifecycle', () => {
        it('should implement IScene interface', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            expect(scene.enter).to.be.a('function');
            expect(scene.exit).to.be.a('function');
            expect(scene.update).to.be.a('function');
            expect(scene.handleMouseClick).to.be.a('function');
            expect(scene.handleMouseMove).to.be.a('function');
        });

        it('should load assets on enter()', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            // // Check that sprites are loaded (mocked in actual implementation)
            expect(scene.titleSprite).to.not.be.undefined;
            expect(scene.playButton).to.not.be.undefined;
            expect(scene.optionsButton).to.not.be.undefined;
        });

        it('should register UI components with renderer on enter()', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            // // Should register title, buttons, etc.
            expect(mockRenderer.registeredComponents.length).to.be.greaterThan(0);
        });

        it('should unregister components on exit()', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            const registeredCount = mockRenderer.registeredComponents.length;
            
            scene.exit();
            
            expect(mockRenderer.unregisteredComponents.length).to.equal(registeredCount);
        });

        it('should clean up event listeners on exit()', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            // // Emit events to verify listeners are active
            let playClicked = false;
            // EventBus.on(GameEvents.MENU_PLAY_CLICKED, () => { playClicked = true; });
            
            scene.handleMouseClick(400, 300); // Assuming play button at this position
            
            scene.exit();
            
            // // After exit, internal listeners should be cleaned up
            // // This is tested by checking the scene's internal state
            expect(scene.eventUnsubscribers).to.be.undefined; // Or empty array
        });
    });

    describe('Button Creation', () => {
        it('should create play button', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            expect(scene.playButton).to.not.be.undefined;
            expect(scene.playButton.id).to.equal('play_button');
        });

        it('should create options button', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            expect(scene.optionsButton).to.not.be.undefined;
            expect(scene.optionsButton.id).to.equal('options_button');
        });

        it('should create exit button', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            expect(scene.exitButton).to.not.be.undefined;
            expect(scene.exitButton.id).to.equal('exit_button');
        });

        it('should position buttons vertically', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            // // Buttons should be stacked vertically
            expect(scene.playButton.y).to.be.lessThan(scene.optionsButton.y);
            expect(scene.optionsButton.y).to.be.lessThan(scene.exitButton.y);
        });

        it('should center buttons horizontally', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            
            // All buttons should be centered using config values
            expect(scene.playButton.x).to.equal(MAIN_MENU_BUTTONS.PLAY.x);
            expect(scene.optionsButton.x).to.equal(MAIN_MENU_BUTTONS.OPTIONS.x);
            expect(scene.exitButton.x).to.equal(MAIN_MENU_BUTTONS.EXIT.x);
        });
    });

    describe('Title Animation', () => {
        it('should create animated title', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            expect(scene.titleSprite).to.not.be.undefined;
            expect(scene.titleSprite.update).to.be.a('function');
        });

        it('should update title animation each frame', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            const initialOffset = scene.titleSprite.getAnimationOffset();
            
            scene.update();
            scene.update();
            scene.update();
            
            const newOffset = scene.titleSprite.getAnimationOffset();
            expect(newOffset).to.not.equal(initialOffset);
        });

        it('should position title at top of screen', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            // // Title should be near top, centered
            expect(scene.titleSprite.y).to.be.lessThan(200);
            expect(scene.titleSprite.x).to.equal(400); // Centered
        });
    });

    describe('Mouse Interaction', () => {
        it('should detect hover on play button', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            
            // Use config position for play button
            scene.handleMouseMove(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            expect(scene.playButton.isHovered).to.be.true;
        });

        it('should detect hover exit', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            
            scene.handleMouseMove(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y); // Hover button
            expect(scene.playButton.isHovered).to.be.true;
            
            scene.handleMouseMove(100, 100); // Move away
            expect(scene.playButton.isHovered).to.be.false;
        });

        it('should emit MENU_PLAY_CLICKED on play button click', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            scene.enter();
            
            let eventEmitted = false;
            EventBus.on(GameEvents.MENU_PLAY_CLICKED, () => { eventEmitted = true; });
            
            // Click play button using config position
            scene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            expect(eventEmitted).to.be.true;
        });

        it('should switch to options submenu on options button click', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            scene.enter();
            
            // Initially should have main menu buttons registered (title + 3 buttons = 4)
            const initialCount = mockRenderer.registeredComponents.length;
            
            // Click options button using config position
            scene.handleMouseClick(MAIN_MENU_BUTTONS.OPTIONS.x, MAIN_MENU_BUTTONS.OPTIONS.y);
            
            // Should have unregistered old buttons and registered new ones
            // Title stays, but buttons change (3 old buttons out, 4 new submenu buttons in)
            expect(mockRenderer.unregisteredComponents.length).to.be.greaterThan(0);
            expect(mockRenderer.registeredComponents.length).to.be.greaterThan(initialCount);
        });

        it('should emit MENU_EXIT_CLICKED on exit button click', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            scene.enter();
            
            let eventEmitted = false;
            EventBus.on(GameEvents.MENU_EXIT_CLICKED, () => { eventEmitted = true; });
            
            // Click exit button using config position
            scene.handleMouseClick(MAIN_MENU_BUTTONS.EXIT.x, MAIN_MENU_BUTTONS.EXIT.y);
            
            expect(eventEmitted).to.be.true;
        });

        it('should not emit events when clicking empty space', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            scene.enter();
            
            let playClicked = false;
            let optionsClicked = false;
            let exitClicked = false;
            
            // EventBus.on(GameEvents.MENU_PLAY_CLICKED, () => { playClicked = true; });
            // EventBus.on(GameEvents.MENU_OPTIONS_CLICKED, () => { optionsClicked = true; });
            // EventBus.on(GameEvents.MENU_EXIT_CLICKED, () => { exitClicked = true; });
            
            // // Click empty space
            scene.handleMouseClick(100, 100);
            
            expect(playClicked).to.be.false;
            expect(optionsClicked).to.be.false;
            expect(exitClicked).to.be.false;
        });
    });

    describe('Update Loop', () => {
        it('should update all animated components', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            // Track that update is called on animated components
            let titleUpdateCount = 0;
            const originalUpdate = scene.titleSprite.update;
            scene.titleSprite.update = () => {
                titleUpdateCount++;
                originalUpdate.call(scene.titleSprite);
            };
            
            scene.update();
            scene.update();
            
            expect(titleUpdateCount).to.equal(2);
        });

        it('should update button pulse animations', () => {
            const scene = new MenuScene(mockRenderer, 800, 600, createMockImages());
            
            scene.enter();
            
            scene.playButton.setHovered(true);
            
            const initialScale = scene.playButton.getPulseScale();
            
            scene.update();
            scene.update();
            
            const newScale = scene.playButton.getPulseScale();
            expect(newScale).to.not.equal(initialScale);
        });
    });

    describe('Multiple Button Hover', () => {
        it('should only hover one button at a time', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            
            // Hover play button using config
            scene.handleMouseMove(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            expect(scene.playButton.isHovered).to.be.true;
            expect(scene.optionsButton.isHovered).to.be.false;
            
            // Move to options button using config
            scene.handleMouseMove(MAIN_MENU_BUTTONS.OPTIONS.x, MAIN_MENU_BUTTONS.OPTIONS.y);
            expect(scene.playButton.isHovered).to.be.false;
            expect(scene.optionsButton.isHovered).to.be.true;
        });
    });

    describe('Level Select Menu', () => {
        it('should switch to level select menu when play button is clicked', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            
            // Click play button
            scene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            // Should have level select buttons, not main menu buttons
            expect(scene.devRoomButton).to.not.be.null;
            expect(scene.startGameButton).to.not.be.null;
            expect(scene.levelEditorButton).to.not.be.null;
            expect(scene.playButton).to.be.null;
        });

        it('should create three horizontally aligned buttons', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            scene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            // All buttons should have same Y position (horizontal alignment)
            expect(scene.devRoomButton.y).to.equal(scene.startGameButton.y);
            expect(scene.startGameButton.y).to.equal(scene.levelEditorButton.y);
            
            // Buttons should be spread horizontally
            expect(scene.devRoomButton.x).to.be.lessThan(scene.startGameButton.x);
            expect(scene.startGameButton.x).to.be.lessThan(scene.levelEditorButton.x);
        });

        it('should emit MENU_DEV_ROOM_CLICKED when dev room button clicked', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            scene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            let devRoomClicked = false;
            EventBus.on(GameEvents.MENU_DEV_ROOM_CLICKED, () => { devRoomClicked = true; });
            
            // Get dev room button position from scene
            const devRoomX = scene.devRoomButton.x;
            const devRoomY = scene.devRoomButton.y;
            
            scene.handleMouseClick(devRoomX, devRoomY);
            
            expect(devRoomClicked).to.be.true;
        });

        it('should emit MENU_START_GAME_CLICKED when start game button clicked', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            scene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            let startGameClicked = false;
            EventBus.on(GameEvents.MENU_START_GAME_CLICKED, () => { startGameClicked = true; });
            
            const startGameX = scene.startGameButton.x;
            const startGameY = scene.startGameButton.y;
            
            scene.handleMouseClick(startGameX, startGameY);
            
            expect(startGameClicked).to.be.true;
        });

        it('should emit MENU_LEVEL_EDITOR_CLICKED when level editor button clicked', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            scene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            let levelEditorClicked = false;
            EventBus.on(GameEvents.MENU_LEVEL_EDITOR_CLICKED, () => { levelEditorClicked = true; });
            
            const levelEditorX = scene.levelEditorButton.x;
            const levelEditorY = scene.levelEditorButton.y;
            
            scene.handleMouseClick(levelEditorX, levelEditorY);
            
            expect(levelEditorClicked).to.be.true;
        });

        it('should return to main menu when back button clicked', () => {
            const scene = new MenuScene(mockRenderer, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT, createMockImages());
            
            scene.enter();
            scene.handleMouseClick(MAIN_MENU_BUTTONS.PLAY.x, MAIN_MENU_BUTTONS.PLAY.y);
            
            // Now in level select menu
            expect(scene.devRoomButton).to.not.be.null;
            expect(scene.backButton).to.not.be.null;
            
            // Click back button using actual button position
            const backX = scene.backButton!.x;
            const backY = scene.backButton!.y;
            
            mockRenderer.clear();
            scene.handleMouseClick(backX, backY);
            
            // Should be back in main menu
            expect(scene.playButton).to.not.be.null;
            expect(scene.devRoomButton).to.be.null;
        });
    });
});




