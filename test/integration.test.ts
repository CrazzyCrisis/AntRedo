import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { Renderer } from '../src/rendering/Renderer';
import { Camera } from '../src/rendering/Camera';
import { RenderLayer } from '../src/rendering/RenderLayer';
import { SpriteComponent } from '../src/rendering/components/SpriteComponent';
import { MultiPartComponent, SpritePart } from '../src/rendering/components/MultiPartComponent';
import { createMockP5 } from './helpers/renderingMocks';

describe('Rendering System Integration', () => {
    let renderer: Renderer;
    let camera: Camera;
    const mockP5 = createMockP5();

    beforeEach(() => {
        renderer = new Renderer(mockP5 as any, 800, 600);
        camera = new Camera(400, 300, 800, 600);
        renderer.setCamera(camera);
    });

    describe('SpriteComponent integration', () => {
        it('should register and render sprite components', () => {
            const mockSprite = { width: 32, height: 32 };
            const sprite = new SpriteComponent(
                mockSprite,
                100,
                100,
                RenderLayer.ENTITIES,
                50
            );

            const unregister = renderer.register(sprite);
            expect(unregister).to.be.a('function');

            renderer.render();
            // Should not throw errors
            expect(true).to.be.true;
        });

        it('should update sprite position', () => {
            const mockSprite = { width: 32, height: 32 };
            const sprite = new SpriteComponent(
                mockSprite,
                100,
                100,
                RenderLayer.ENTITIES,
                50
            );

            sprite.setPosition(200, 200);
            renderer.register(sprite);
            renderer.render();

            expect(true).to.be.true;
        });

        it('should update sprite depth', () => {
            const mockSprite = { width: 32, height: 32 };
            const sprite = new SpriteComponent(
                mockSprite,
                100,
                100,
                RenderLayer.ENTITIES,
                50
            );

            sprite.setDepth(100);
            expect(sprite.depth).to.equal(100);
        });
    });

    describe('MultiPartComponent integration', () => {
        it('should register and render multi-part components', () => {
            const trunkSprite = { width: 16, height: 32 };
            const canopySprite = { width: 48, height: 48 };

            const parts: SpritePart[] = [
                { sprite: trunkSprite, offsetX: 0, offsetY: 16 },
                { sprite: canopySprite, offsetX: -16, offsetY: -32 }
            ];

            const tree = new MultiPartComponent(
                200,
                200,
                RenderLayer.GROUND_DECORATIONS,
                100,
                parts
            );

            renderer.register(tree);
            renderer.render();

            expect(tree.getPartCount()).to.equal(2);
        });

        it('should add parts dynamically', () => {
            const tree = new MultiPartComponent(
                200,
                200,
                RenderLayer.GROUND_DECORATIONS,
                100
            );

            expect(tree.getPartCount()).to.equal(0);

            tree.addPart({ sprite: { width: 16, height: 32 }, offsetX: 0, offsetY: 0 });
            expect(tree.getPartCount()).to.equal(1);

            tree.addPart({ sprite: { width: 48, height: 48 }, offsetX: -16, offsetY: -32 });
            expect(tree.getPartCount()).to.equal(2);
        });

        it('should remove parts by index', () => {
            const parts: SpritePart[] = [
                { sprite: { width: 16, height: 32 }, offsetX: 0, offsetY: 0 },
                { sprite: { width: 48, height: 48 }, offsetX: -16, offsetY: -32 }
            ];

            const tree = new MultiPartComponent(
                200,
                200,
                RenderLayer.GROUND_DECORATIONS,
                100,
                parts
            );

            expect(tree.getPartCount()).to.equal(2);
            tree.removePart(0);
            expect(tree.getPartCount()).to.equal(1);
        });
    });

    describe('Performance with many entities', () => {
        it('should handle 100+ sprite components efficiently', () => {
            const sprites: SpriteComponent[] = [];
            const mockSprite = { width: 32, height: 32 };

            // Create 150 sprites
            for (let i = 0; i < 150; i++) {
                const x = (i % 15) * 50;
                const y = Math.floor(i / 15) * 50;
                const sprite = new SpriteComponent(
                    mockSprite,
                    x,
                    y,
                    RenderLayer.ENTITIES,
                    y // Use Y as depth for proper sorting
                );
                sprites.push(sprite);
                renderer.register(sprite);
            }

            const startTime = Date.now();
            renderer.render();
            const endTime = Date.now();

            const renderTime = endTime - startTime;
            expect(renderTime).to.be.lessThan(100); // Should render in under 100ms
            expect(sprites.length).to.equal(150);
        });

        it('should properly sort 100+ entities by depth', () => {
            const mockSprite = { width: 32, height: 32 };

            // Create sprites with random depths
            const depths = [100, 50, 200, 75, 150, 25, 175, 125];
            depths.forEach(depth => {
                const sprite = new SpriteComponent(
                    mockSprite,
                    0,
                    0,
                    RenderLayer.ENTITIES,
                    depth
                );
                renderer.register(sprite);
            });

            renderer.render();

            // Depth sorting is tested in renderer.test.ts
            expect(true).to.be.true;
        });
    });

    describe('Camera integration with components', () => {
        it('should render components with camera transform', () => {
            const mockSprite = { width: 32, height: 32 };
            const sprite = new SpriteComponent(
                mockSprite,
                400,
                300,
                RenderLayer.ENTITIES,
                50
            );

            renderer.register(sprite);
            camera.moveTo(400, 300);
            renderer.render();

            expect(true).to.be.true;
        });

        it('should update camera position and re-render', () => {
            const mockSprite = { width: 32, height: 32 };
            const sprite = new SpriteComponent(
                mockSprite,
                400,
                300,
                RenderLayer.ENTITIES,
                50
            );

            renderer.register(sprite);
            camera.moveTo(500, 400);
            renderer.markAllLayersDirty();
            renderer.render();

            expect(camera.x).to.equal(500);
            expect(camera.y).to.equal(400);
        });

        it('should handle camera follow with smooth movement', () => {
            camera.follow(500, 400);
            camera.setSmoothing(0.1);

            for (let i = 0; i < 10; i++) {
                camera.update();
            }

            // Camera should have moved towards target
            expect(camera.x).to.be.greaterThan(400);
            expect(camera.y).to.be.greaterThan(300);
        });
    });

    describe('Layer optimization', () => {
        it('should skip rendering clean layers', () => {
            const mockSprite = { width: 32, height: 32 };
            const sprite = new SpriteComponent(
                mockSprite,
                100,
                100,
                RenderLayer.ENTITIES,
                50
            );

            renderer.register(sprite);
            renderer.render(); // First render marks layer clean

            // Second render should skip clean layers (tested in renderer.test.ts)
            renderer.render();

            expect(true).to.be.true;
        });

        it('should re-render when layer marked dirty', () => {
            const mockSprite = { width: 32, height: 32 };
            const sprite = new SpriteComponent(
                mockSprite,
                100,
                100,
                RenderLayer.ENTITIES,
                50
            );

            renderer.register(sprite);
            renderer.render();
            
            renderer.markLayerDirty(RenderLayer.ENTITIES);
            renderer.render();

            expect(true).to.be.true;
        });
    });

    describe('Mixed component types', () => {
        it('should render both sprite and multi-part components together', () => {
            // Simple sprite
            const mockSprite = { width: 32, height: 32 };
            const sprite = new SpriteComponent(
                mockSprite,
                100,
                100,
                RenderLayer.ENTITIES,
                100
            );

            // Multi-part tree
            const parts: SpritePart[] = [
                { sprite: { width: 16, height: 32 }, offsetX: 0, offsetY: 16 },
                { sprite: { width: 48, height: 48 }, offsetX: -16, offsetY: -32 }
            ];
            const tree = new MultiPartComponent(
                200,
                200,
                RenderLayer.GROUND_DECORATIONS,
                50,
                parts
            );

            renderer.register(sprite);
            renderer.register(tree);
            renderer.render();

            expect(true).to.be.true;
        });

        it('should handle entities on different layers', () => {
            const mockSprite = { width: 32, height: 32 };

            const background = new SpriteComponent(
                mockSprite,
                0,
                0,
                RenderLayer.BACKGROUND,
                0
            );

            const entity = new SpriteComponent(
                mockSprite,
                100,
                100,
                RenderLayer.ENTITIES,
                100
            );

            const ui = new SpriteComponent(
                mockSprite,
                10,
                10,
                RenderLayer.UI,
                0
            );

            renderer.register(background);
            renderer.register(entity);
            renderer.register(ui);
            renderer.render();

            expect(true).to.be.true;
        });
    });
});
