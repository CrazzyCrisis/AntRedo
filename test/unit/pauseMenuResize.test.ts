import { expect } from 'chai';
import { PauseMenuScene } from '../../src/scenes/PauseMenuScene';
import { Renderer } from '../../src/rendering/Renderer';
import { EventBus } from '../../src/utils/eventBus';
import { createMockP5 } from '../helpers/renderingMocks';

/**
 * Unit tests for PauseMenuScene window resize behavior
 * Tests that UI components (toggle, panel) properly update positions on resize
 */
describe('PauseMenuScene - Window Resize', () => {
    let scene: PauseMenuScene;
    let renderer: Renderer;
    const mockP5 = createMockP5();

    beforeEach(() => {
        EventBus.clear();
        renderer = new Renderer(mockP5 as any, 800, 600);
        scene = new PauseMenuScene(renderer, 800, 600);
        scene.enter();
    });

    afterEach(() => {
        scene.exit();
        EventBus.clear();
    });

    describe('Toggle Position Updates', () => {
        it('should update toggle position when window resized', () => {
            // Initial toggle position should be based on 800x600
            const initialX = 800 / 2 - 180;
            const initialY = 600 / 2 + 180;
            
            // Access toggle through reflection (it's private)
            const toggle = (scene as any).worldGenToggle;
            expect(toggle).to.not.be.null;
            expect(toggle.x).to.equal(initialX);
            expect(toggle.y).to.equal(initialY);

            // Resize window to 1024x768
            scene.onResize(1024, 768);

            // Toggle position should update
            const newX = 1024 / 2 - 180;
            const newY = 768 / 2 + 180;
            expect(toggle.x).to.equal(newX);
            expect(toggle.y).to.equal(newY);
        });

        it('should handle multiple resize events', () => {
            const toggle = (scene as any).worldGenToggle;

            // Resize to 1920x1080
            scene.onResize(1920, 1080);
            expect(toggle.x).to.equal(1920 / 2 - 180);
            expect(toggle.y).to.equal(1080 / 2 + 180);

            // Resize to 640x480
            scene.onResize(640, 480);
            expect(toggle.x).to.equal(640 / 2 - 180);
            expect(toggle.y).to.equal(480 / 2 + 180);

            // Resize back to 800x600
            scene.onResize(800, 600);
            expect(toggle.x).to.equal(800 / 2 - 180);
            expect(toggle.y).to.equal(600 / 2 + 180);
        });
    });

    describe('Canvas Dimensions Updates', () => {
        it('should update canvasWidth and canvasHeight on resize', () => {
            expect((scene as any).canvasWidth).to.equal(800);
            expect((scene as any).canvasHeight).to.equal(600);

            scene.onResize(1024, 768);

            expect((scene as any).canvasWidth).to.equal(1024);
            expect((scene as any).canvasHeight).to.equal(768);
        });
    });

    describe('Toggle Click Detection After Resize', () => {
        it('should detect toggle click at new position after resize', () => {
            const toggle = (scene as any).worldGenToggle;
            
            // Resize to 1024x768
            scene.onResize(1024, 768);
            
            const toggleX = 1024 / 2 - 180;
            const toggleY = 768 / 2 + 180;
            
            // Click should be detected at new position
            const isOverBefore = toggle.isMouseOver(toggleX, toggleY);
            expect(isOverBefore).to.be.true;
            
            // Click at old position should NOT be detected
            const oldX = 800 / 2 - 180;
            const oldY = 600 / 2 + 180;
            const isOverOld = toggle.isMouseOver(oldX, oldY);
            expect(isOverOld).to.be.false;
        });

        it('should toggle state when clicked at new position', () => {
            const toggle = (scene as any).worldGenToggle;
            const initialState = toggle.isOn();
            
            // Resize
            scene.onResize(1024, 768);
            
            const toggleX = 1024 / 2 - 180;
            const toggleY = 768 / 2 + 180;
            
            // Click the toggle at new position
            scene.handleMouseClick(toggleX, toggleY);
            
            // State should have changed
            expect(toggle.isOn()).to.equal(!initialState);
        });
    });

    describe('Panel Rendering After Resize', () => {
        it('should render panel at centered position after resize', () => {
            // This tests that the panel render closure uses dynamic this.canvasWidth/Height
            // We can't directly test the render function, but we can verify it's marked dirty
            
            const layerDirtySpy = {
                wasCalled: false,
                layer: null as any
            };
            
            // Intercept markLayerDirty
            const originalMarkDirty = renderer.markLayerDirty.bind(renderer);
            renderer.markLayerDirty = (layer: any) => {
                layerDirtySpy.wasCalled = true;
                layerDirtySpy.layer = layer;
                originalMarkDirty(layer);
            };
            
            scene.onResize(1024, 768);
            
            expect(layerDirtySpy.wasCalled).to.be.true;
        });
    });

    describe('Preset List Click Detection After Resize', () => {
        it('should update preset list bounds after resize', () => {
            // Add a preset to test with
            const WorldPresetManager = require('../../src/world/WorldPresetManager').WorldPresetManager;
            WorldPresetManager.savePreset({
                name: 'Test Preset',
                seed: 12345,
                noiseScale: 0.1,
                width: 100,
                height: 100,
                timestamp: Date.now()
            });

            // Resize
            scene.onResize(1024, 768);

            const centerX = 1024 / 2;
            const centerY = 768 / 2;
            const panelX = centerX - 600 / 2;
            const panelY = centerY - 500 / 2;
            const listY = panelY + 180;

            // Click in the preset list area at new position
            const clickX = panelX + 100;
            const clickY = listY + 10;

            // Should not throw error
            expect(() => scene.handleMouseClick(clickX, clickY)).to.not.throw();

            // Cleanup
            WorldPresetManager.deletePreset('Test Preset');
        });
    });

    describe('Toggle Hover Detection After Resize', () => {
        it('should update toggle hover at new position', () => {
            const toggle = (scene as any).worldGenToggle;
            
            scene.onResize(1024, 768);
            
            const toggleX = 1024 / 2 - 180;
            const toggleY = 768 / 2 + 180;
            
            // Move mouse over toggle at new position
            scene.handleMouseMove(toggleX, toggleY);
            
            // Toggle should be hovered
            expect(toggle.isHovered).to.be.true;
            
            // Move mouse away
            scene.handleMouseMove(0, 0);
            
            // Toggle should not be hovered
            expect(toggle.isHovered).to.be.false;
        });
    });

    describe('Edge Cases', () => {
        it('should handle resize to very small dimensions', () => {
            scene.onResize(320, 240);
            
            const toggle = (scene as any).worldGenToggle;
            expect(toggle.x).to.equal(320 / 2 - 180);
            expect(toggle.y).to.equal(240 / 2 + 180);
        });

        it('should handle resize to very large dimensions', () => {
            scene.onResize(3840, 2160);
            
            const toggle = (scene as any).worldGenToggle;
            expect(toggle.x).to.equal(3840 / 2 - 180);
            expect(toggle.y).to.equal(2160 / 2 + 180);
        });

        it('should handle resize when toggle is null', () => {
            // Destroy toggle
            (scene as any).worldGenToggle = null;
            
            // Should not throw
            expect(() => scene.onResize(1024, 768)).to.not.throw();
        });
    });
});
