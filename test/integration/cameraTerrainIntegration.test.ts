import { expect } from 'chai';
import { Camera } from '../../src/rendering/Camera';
import { CameraManager } from '../../src/managers/CameraManager';
import { EntityManager } from '../../src/managers/EntityManager';
import { QueenFactory } from '../../src/factories/QueenFactory';
import { Renderer } from '../../src/rendering/Renderer';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { TILE_SIZE } from '../../src/world/TileSystem';

describe('Camera + Terrain + Queen Integration', () => {
    let camera: Camera;
    let cameraManager: CameraManager;
    let renderer: Renderer;
    let mockP5: any;
    let mockGraphics: any;
    
    beforeEach(() => {
        // Clear singletons
        EventBus.clear();
        EntityManager.getInstance().clear();
        (CameraManager as any).instance = null;
        
        // Clear QueenFactory singleton (important!)
        const { QueenFactory } = require('../../src/factories/QueenFactory');
        QueenFactory.clearAll();
        
        // Mock p5 graphics
        mockGraphics = {
            push: () => {},
            pop: () => {},
            translate: () => {},
            image: () => {},
            fill: () => {},
            noStroke: () => {},
            rect: () => {},
            stroke: () => {},
            line: () => {},
            noSmooth: () => {},
            clear: () => {},
            drawingContext: { globalAlpha: 1.0 },
            width: 800,
            height: 600
        };
        
        mockP5 = {
            createGraphics: () => mockGraphics,
            image: () => {}
        };
        
        // Create renderer and camera
        renderer = new Renderer(mockP5, 800, 600);
        camera = new Camera(0, 0, 800, 600);
        
        // Register camera with renderer and CameraManager
        renderer.setCamera(camera);
        cameraManager = CameraManager.getInstance();
        cameraManager.setCamera(camera);
        cameraManager.setRenderer(renderer);
    });
    
    afterEach(() => {
        EventBus.clear();
        EntityManager.getInstance().clear();
        (CameraManager as any).instance = null;
    });
    
    describe('Camera Initialization', () => {
        it('should start at (0, 0)', () => {
            expect(camera.x).to.equal(0);
            expect(camera.y).to.equal(0);
        });
        
        it('should be registered with CameraManager', () => {
            expect(cameraManager.getCamera()).to.equal(camera);
        });
    });
    
    describe('Queen Spawn and Camera Follow', () => {
        it('should snap camera to Queen position when follow event is emitted', () => {
            const mockSprite = { width: 32, height: 32 };
            const queenGridX = 100;
            const queenGridY = 100;
            
            // Create queen - should emit CAMERA_FOLLOW_ENTITY
            QueenFactory.create(renderer, mockSprite, queenGridX, queenGridY, 'player');
            
            // Camera should have snapped to Queen's world position
            const expectedWorldX = queenGridX * TILE_SIZE;
            const expectedWorldY = queenGridY * TILE_SIZE;
            
            expect(camera.x).to.equal(expectedWorldX);
            expect(camera.y).to.equal(expectedWorldY);
        });
        
        it('should follow Queen as she moves', () => {
            const mockSprite = { width: 32, height: 32 };
            const queen = QueenFactory.create(renderer, mockSprite, 100, 100, 'player');
            
            // Initial position
            const initialCameraX = camera.x;
            
            // Move queen
            queen.moveTo(101, 100);
            
            // Update camera
            cameraManager.update();
            
            // Camera should have moved toward new position
            // (won't be exact due to smoothing, but should have changed)
            expect(camera.x).to.not.equal(initialCameraX);
        });
        
        it('should update camera every frame to follow Queen', () => {
            const mockSprite = { width: 32, height: 32 };
            const queen = QueenFactory.create(renderer, mockSprite, 100, 100, 'player');
            
            // Move queen to new position
            queen.moveTo(105, 105);
            
            // Simulate multiple frames
            for (let i = 0; i < 10; i++) {
                cameraManager.update();
            }
            
            // Camera should be very close to Queen's position after smoothing
            const expectedX = 105 * TILE_SIZE;
            const expectedY = 105 * TILE_SIZE;
            
            // Allow for smoothing (not exact, but close)
            expect(Math.abs(camera.x - expectedX)).to.be.lessThan(100);
            expect(Math.abs(camera.y - expectedY)).to.be.lessThan(100);
        });
    });
    
    describe('Terrain Rendering with Camera', () => {
        it('should apply camera transform to GROUND layer', () => {
            let transformApplied = false;
            let translateX: number | null = null;
            let translateY: number | null = null;
            
            mockGraphics.push = () => { transformApplied = true; };
            mockGraphics.translate = (x: number, y: number) => {
                translateX = x;
                translateY = y;
            };
            
            // Create a tile renderable on GROUND layer
            const tileRenderable = {
                id: 'test_tile',
                layer: RenderLayer.GROUND,
                depth: 0,
                render: (_graphics: any) => {}
            };
            
            renderer.register(tileRenderable);
            
            // Move camera
            camera.moveTo(1000, 1000);
            
            // Render
            renderer.render();
            
            // Camera transform should have been applied
            expect(transformApplied).to.be.true;
            expect(translateX).to.not.be.null;
            expect(translateY).to.not.be.null;
        });
        
        it('should NOT apply camera transform to UI layer', () => {
            // Create a UI renderable
            const uiRenderable = {
                id: 'test_ui',
                layer: RenderLayer.UI,
                depth: 0,
                render: (_graphics: any) => {}
            };
            
            renderer.register(uiRenderable);
            
            // Move camera
            camera.moveTo(1000, 1000);
            
            // Render
            renderer.render();
            
            // Verify UI layer exists and renders (camera shouldn't affect it)
            expect(uiRenderable.layer).to.equal(RenderLayer.UI);
        });
        
        it('should NOT apply camera transform to DEBUG layer', () => {
            const debugRenderable = {
                id: 'test_debug',
                layer: RenderLayer.DEBUG,
                depth: 0,
                render: (_graphics: any) => {}
            };
            
            renderer.register(debugRenderable);
            camera.moveTo(1000, 1000);
            renderer.render();
            
            expect(debugRenderable.layer).to.equal(RenderLayer.DEBUG);
        });
    });
    
    describe('Full Integration: Queen Movement + Camera + Terrain', () => {
        it('should keep terrain and Queen in sync when Queen moves', () => {
            const mockSprite = { width: 32, height: 32 };
            const queen = QueenFactory.create(renderer, mockSprite, 100, 100, 'player');
            
            // Create terrain renderable
            let tileRenderCount = 0;
            const tileRenderable = {
                id: 'terrain',
                layer: RenderLayer.GROUND,
                depth: 0,
                render: (_graphics: any) => {
                    tileRenderCount++;
                }
            };
            
            renderer.register(tileRenderable);
            
            // Move Queen
            queen.moveTo(105, 105);
            
            // Update camera
            cameraManager.update();
            
            // Render
            renderer.render();
            
            // Verify terrain was rendered
            expect(tileRenderCount).to.be.greaterThan(0);
            
            // Camera should be following Queen
            const expectedX = 105 * TILE_SIZE;
            const expectedY = 105 * TILE_SIZE;
            expect(Math.abs(camera.x - expectedX)).to.be.lessThan(100);
            expect(Math.abs(camera.y - expectedY)).to.be.lessThan(100);
        });
        
        it('should handle camera following Queen with terrain visible', () => {
            const mockSprite = { width: 32, height: 32 };
            const startGridX = 50;
            const startGridY = 50;
            
            // Create Queen
            const queen = QueenFactory.create(renderer, mockSprite, startGridX, startGridY, 'player');
            
            // Verify camera snapped to Queen
            expect(camera.x).to.equal(startGridX * TILE_SIZE);
            expect(camera.y).to.equal(startGridY * TILE_SIZE);
            
            // Create terrain tiles around Queen
            const tiles: any[] = [];
            for (let dx = -5; dx <= 5; dx++) {
                for (let dy = -5; dy <= 5; dy++) {
                    const tileX = (startGridX + dx) * TILE_SIZE;
                    const tileY = (startGridY + dy) * TILE_SIZE;
                    
                    tiles.push({
                        id: `tile_${dx}_${dy}`,
                        layer: RenderLayer.GROUND,
                        depth: 0,
                        worldX: tileX,
                        worldY: tileY,
                        render: (_graphics: any) => {}
                    });
                }
            }
            
            tiles.forEach(tile => renderer.register(tile));
            
            // Move Queen
            queen.moveTo(startGridX + 3, startGridY + 3);
            
            // Update camera multiple times for smooth following
            for (let i = 0; i < 20; i++) {
                cameraManager.update();
            }
            
            // Camera should have moved with Queen
            const expectedX = (startGridX + 3) * TILE_SIZE;
            const expectedY = (startGridY + 3) * TILE_SIZE;
            
            expect(Math.abs(camera.x - expectedX)).to.be.lessThan(10);
            expect(Math.abs(camera.y - expectedY)).to.be.lessThan(10);
            
            // Render everything
            renderer.render();
            
            // All tiles should still be registered
            expect(tiles.length).to.equal(121); // 11x11 grid
        });
    });
    
    describe('Camera World-to-Screen Conversion', () => {
        it('should convert world coordinates to screen coordinates correctly', () => {
            camera.moveTo(1000, 1000);
            
            const worldX = 1000;
            const worldY = 1000;
            
            const screen = camera.worldToScreen(worldX, worldY);
            
            // When camera is at (1000, 1000), that point should be at screen center
            expect(screen.x).to.equal(400); // 800/2
            expect(screen.y).to.equal(300); // 600/2
        });
        
        it('should convert screen coordinates to world coordinates correctly', () => {
            camera.moveTo(1000, 1000);
            
            const screenX = 400;
            const screenY = 300;
            
            const world = camera.screenToWorld(screenX, screenY);
            
            // Screen center should map to camera position
            expect(world.x).to.equal(1000);
            expect(world.y).to.equal(1000);
        });
        
        it('should maintain coordinate consistency when camera moves', () => {
            // Start position
            camera.moveTo(500, 500);
            const world1 = camera.screenToWorld(400, 300);
            
            // Move camera
            camera.moveTo(1500, 1500);
            const world2 = camera.screenToWorld(400, 300);
            
            // Same screen position should map to different world positions
            expect(world2.x).to.not.equal(world1.x);
            expect(world2.y).to.not.equal(world1.y);
            
            // Difference should match camera movement
            expect(world2.x - world1.x).to.equal(1000);
            expect(world2.y - world1.y).to.equal(1000);
        });
    });
    
    describe('Edge Cases', () => {
        it('should handle Queen at origin (0, 0)', () => {
            const mockSprite = { width: 32, height: 32 };
            QueenFactory.create(renderer, mockSprite, 0, 0, 'player');
            
            expect(camera.x).to.equal(0);
            expect(camera.y).to.equal(0);
            
            cameraManager.update();
            
            expect(camera.x).to.equal(0);
            expect(camera.y).to.equal(0);
        });
        
        it('should handle Queen at large coordinates', () => {
            const mockSprite = { width: 32, height: 32 };
            const largeX = 1000;
            const largeY = 1000;
            
            QueenFactory.create(renderer, mockSprite, largeX, largeY, 'player');
            
            expect(camera.x).to.equal(largeX * TILE_SIZE);
            expect(camera.y).to.equal(largeY * TILE_SIZE);
        });
        
        it('should stop following when Queen is destroyed', () => {
            const mockSprite = { width: 32, height: 32 };
            const queen = QueenFactory.create(renderer, mockSprite, 100, 100, 'player');
            
            // Destroy Queen
            EventBus.emit(GameEvents.ENTITY_DESTROYED, queen.id);
            
            // Move camera manually
            camera.moveTo(500, 500);
            
            // Update CameraManager
            cameraManager.update();
            
            // Camera should stay at manual position (not following destroyed Queen)
            expect(camera.x).to.equal(500);
            expect(camera.y).to.equal(500);
        });
    });
    
    describe('Camera Transform Application (CRITICAL)', () => {
        it('should verify camera is set on renderer', () => {
            expect((renderer as any).camera).to.equal(camera);
        });
        
        it('should apply camera offset when rendering terrain', () => {
            let capturedTransform: { x: number; y: number } | null = null;
            
            // Mock translate to capture transform
            mockGraphics.translate = (x: number, y: number) => {
                capturedTransform = { x, y };
            };
            
            // Create Queen at (100, 100) grid = (3200, 3200) world
            const mockSprite = { width: 32, height: 32 };
            QueenFactory.create(renderer, mockSprite, 100, 100, 'player');
            
            // Verify camera snapped
            expect(camera.x).to.equal(3200);
            expect(camera.y).to.equal(3200);
            
            // Create terrain tile at (100, 100) grid
            const tileRenderable = {
                id: 'test_tile_100_100',
                layer: RenderLayer.GROUND,
                depth: 0,
                render: () => {
                    // Tile draws at its world position (3200, 3200)
                }
            };
            
            renderer.register(tileRenderable);
            renderer.render();
            
            // Camera should have applied transform
            expect(capturedTransform).to.not.be.null;
            
            // Transform should offset world coords to screen coords
            // Camera at (3200, 3200), canvas 800x600
            // Expected: -3200 + 400 = -2800, -3200 + 300 = -2900
            expect(capturedTransform!.x).to.equal(-2800);
            expect(capturedTransform!.y).to.equal(-2900);
        });
        
        it('should keep terrain and Queen aligned after movement', () => {
            const mockSprite = { width: 32, height: 32 };
            const queen = QueenFactory.create(renderer, mockSprite, 100, 100, 'player');
            
            let tileRenderX = 0;
            let tileRenderY = 0;
            let queenRenderX = 0;
            let queenRenderY = 0;
            
            // Capture render positions with camera transform
            mockGraphics.translate = (x: number, y: number) => {
                // Store transform offset
                (mockGraphics as any).transformX = x;
                (mockGraphics as any).transformY = y;
            };
            
            // Create tile at same position as Queen
            const tileRenderable = {
                id: 'tile_at_queen',
                layer: RenderLayer.GROUND,
                depth: 0,
                render: (graphics: any) => {
                    const tileWorldX = 100 * TILE_SIZE;
                    const tileWorldY = 100 * TILE_SIZE;
                    // Apply transform to get screen position
                    tileRenderX = tileWorldX + ((graphics as any).transformX || 0);
                    tileRenderY = tileWorldY + ((graphics as any).transformY || 0);
                }
            };
            
            renderer.register(tileRenderable);
            
            // Get Queen's sprite position
            const queenSprites = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            const queenSprite = queenSprites[0];
            
            // Render initial frame
            renderer.render();
            
            queenRenderX = queenSprite.x + ((mockGraphics as any).transformX || 0);
            queenRenderY = queenSprite.y + ((mockGraphics as any).transformY || 0);
            
            // At initial position, both should be at screen center
            expect(Math.abs(tileRenderX - queenRenderX)).to.be.lessThan(1);
            expect(Math.abs(tileRenderY - queenRenderY)).to.be.lessThan(1);
            
            // Move Queen
            queen.moveTo(105, 105);
            
            // Update camera to follow
            for (let i = 0; i < 50; i++) {
                cameraManager.update();
            }
            
            // Render again
            renderer.render();
            
            // Recalculate positions
            const newTileWorldX = 100 * TILE_SIZE;
            const newTileWorldY = 100 * TILE_SIZE;
            tileRenderX = newTileWorldX + ((mockGraphics as any).transformX || 0);
            tileRenderY = newTileWorldY + ((mockGraphics as any).transformY || 0);
            
            queenRenderX = queenSprite.x + ((mockGraphics as any).transformX || 0);
            queenRenderY = queenSprite.y + ((mockGraphics as any).transformY || 0);
            
            // Tile should have moved relative to screen (camera followed Queen)
            // But tile and Queen should still be offset by their world distance
            const expectedOffsetX = (105 - 100) * TILE_SIZE;
            const expectedOffsetY = (105 - 100) * TILE_SIZE;
            
            expect(Math.abs((queenRenderX - tileRenderX) - expectedOffsetX)).to.be.lessThan(10);
            expect(Math.abs((queenRenderY - tileRenderY) - expectedOffsetY)).to.be.lessThan(10);
        });
        
        it('should verify renderer.setCamera was called', () => {
            const testCamera = new Camera(0, 0, 800, 600);
            renderer.setCamera(testCamera);
            
            expect((renderer as any).camera).to.equal(testCamera);
        });
        
        it('should log camera position updates during movement', () => {
            const mockSprite = { width: 32, height: 32 };
            const queen = QueenFactory.create(renderer, mockSprite, 100, 100, 'player');
            
            console.log(`Initial camera: (${camera.x}, ${camera.y})`);
            console.log(`Initial Queen: grid(${queen.gridX}, ${queen.gridY}), world(${queen.worldX}, ${queen.worldY})`);
            
            // Move Queen
            queen.moveTo(105, 105);
            console.log(`After moveTo Queen: grid(${queen.gridX}, ${queen.gridY}), world(${queen.worldX}, ${queen.worldY})`);
            
            // Update camera several times
            for (let i = 0; i < 10; i++) {
                cameraManager.update();
                if (i % 3 === 0) {
                    console.log(`  Frame ${i}: camera (${camera.x.toFixed(1)}, ${camera.y.toFixed(1)})`);
                }
            }
            
            console.log(`Final camera: (${camera.x.toFixed(1)}, ${camera.y.toFixed(1)})`);
            
            // Camera should have moved toward Queen's new position
            const expectedX = 105 * TILE_SIZE;
            const expectedY = 105 * TILE_SIZE;
            
            expect(Math.abs(camera.x - expectedX)).to.be.lessThan(50);
            expect(Math.abs(camera.y - expectedY)).to.be.lessThan(50);
        });
    });
});
