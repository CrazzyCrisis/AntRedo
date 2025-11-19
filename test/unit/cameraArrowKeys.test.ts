/**
 * Camera Movement Tests with InputManager
 * Tests camera movement using InputManager for held key detection
 */

import { expect } from 'chai';
import { CameraManager } from '../../src/managers/CameraManager';
import { Camera } from '../../src/rendering/Camera';
import { Renderer } from '../../src/rendering/Renderer';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { EntityManager } from '../../src/managers/EntityManager';
import { InputManager } from '../../src/managers/InputManager';
import { CAMERA_CONFIG } from '../../src/config/systems/cameraConfig';

describe('CameraManager - Camera Controls with InputManager', () => {
    let cameraManager: CameraManager;
    let camera: Camera;
    let renderer: Renderer;
    let inputManager: InputManager;
    let mockP5: any;
    let mockGraphics: any;

    beforeEach(() => {
        // Clear singletons
        EventBus.clear();
        EntityManager.getInstance().clear();
        (CameraManager as any).instance = null;
        (InputManager as any).instance = null;

        // Mock p5.js graphics
        mockGraphics = {
            clear: () => {},
            background: () => {},
            translate: () => {},
            push: () => {},
            pop: () => {},
            image: () => {},
            fill: () => {},
            noStroke: () => {},
            rect: () => {},
            ellipse: () => {},
            text: () => {},
            textAlign: () => {},
            textSize: () => {},
        };

        mockP5 = {
            createGraphics: () => mockGraphics,
        };

        // Create renderer and camera
        renderer = new Renderer(mockP5, 800, 600);
        camera = new Camera(0, 0, 800, 600);

        // Initialize InputManager first
        inputManager = InputManager.getInstance();

        // Initialize CameraManager
        cameraManager = CameraManager.getInstance();
        cameraManager.setCamera(camera);
        cameraManager.setRenderer(renderer);
    });

    afterEach(() => {
        EventBus.clear();
        EntityManager.getInstance().clear();
        (CameraManager as any).instance = null;
        (InputManager as any).instance = null;
    });

    describe('Camera Movement with Held Keys', () => {
        it('should move camera up when cameraMoveUp key is held', () => {
            // Bind a key to cameraMoveUp action
            inputManager.rebindKey('cameraMoveUp', 'i', true);
            
            const initialY = camera.y;
            
            // Simulate key being held
            inputManager.handleKeyPress('i');
            
            // Update camera (processes held keys)
            cameraManager.update();
            
            expect(camera.y).to.equal(initialY - CAMERA_CONFIG.ARROW_MOVE_SPEED);
            expect(camera.x).to.equal(0);
        });

        it('should move camera down when cameraMoveDown key is held', () => {
            inputManager.rebindKey('cameraMoveDown', 'k', true);
            
            const initialY = camera.y;
            
            inputManager.handleKeyPress('k');
            cameraManager.update();
            
            expect(camera.y).to.equal(initialY + CAMERA_CONFIG.ARROW_MOVE_SPEED);
            expect(camera.x).to.equal(0);
        });

        it('should move camera left when cameraMoveLeft key is held', () => {
            inputManager.rebindKey('cameraMoveLeft', 'j', true);
            
            const initialX = camera.x;
            
            inputManager.handleKeyPress('j');
            cameraManager.update();
            
            expect(camera.x).to.equal(initialX - CAMERA_CONFIG.ARROW_MOVE_SPEED);
            expect(camera.y).to.equal(0);
        });

        it('should move camera right when cameraMoveRight key is held', () => {
            inputManager.rebindKey('cameraMoveRight', 'l', true);
            
            const initialX = camera.x;
            
            inputManager.handleKeyPress('l');
            cameraManager.update();
            
            expect(camera.x).to.equal(initialX + CAMERA_CONFIG.ARROW_MOVE_SPEED);
            expect(camera.y).to.equal(0);
        });

        it('should move camera diagonally when multiple keys are held', () => {
            inputManager.rebindKey('cameraMoveUp', 'i', true);
            inputManager.rebindKey('cameraMoveRight', 'l', true);
            
            inputManager.handleKeyPress('i');
            inputManager.handleKeyPress('l');
            cameraManager.update();
            
            expect(camera.x).to.equal(CAMERA_CONFIG.ARROW_MOVE_SPEED);
            expect(camera.y).to.equal(-CAMERA_CONFIG.ARROW_MOVE_SPEED);
        });

        it('should continue moving while key is held', () => {
            inputManager.rebindKey('cameraMoveRight', 'l', true);
            
            inputManager.handleKeyPress('l');
            
            // First frame
            cameraManager.update();
            expect(camera.x).to.equal(CAMERA_CONFIG.ARROW_MOVE_SPEED);
            
            inputManager.update(); // Clear just-pressed flag
            
            // Second frame (key still held)
            cameraManager.update();
            expect(camera.x).to.equal(CAMERA_CONFIG.ARROW_MOVE_SPEED * 2);
        });

        it('should not move camera when queen movement keys are pressed', () => {
            // Default queen movement uses 'w', 'a', 's', 'd', arrow keys
            const initialX = camera.x;
            const initialY = camera.y;
            
            // Press queen movement keys
            inputManager.handleKeyPress('w');
            inputManager.handleKeyPress('ArrowUp');
            cameraManager.update();
            
            // Camera should not move (no camera keys bound)
            expect(camera.x).to.equal(initialX);
            expect(camera.y).to.equal(initialY);
        });

        it('should stop moving when key is released', () => {
            inputManager.rebindKey('cameraMoveRight', 'l', true);
            
            inputManager.handleKeyPress('l');
            cameraManager.update();
            expect(camera.x).to.equal(CAMERA_CONFIG.ARROW_MOVE_SPEED);
            
            inputManager.update();
            
            // Release key
            inputManager.handleKeyRelease('l');
            inputManager.update();
            
            // Next update should not move
            cameraManager.update();
            expect(camera.x).to.equal(CAMERA_CONFIG.ARROW_MOVE_SPEED); // No change
        });
    });

    describe('Camera Following Behavior', () => {
        it('should stop following when camera movement key is pressed', () => {
            inputManager.rebindKey('cameraMoveRight', 'l', true);
            
            // Start following an entity
            EventBus.emit(GameEvents.CAMERA_FOLLOW_ENTITY, 'test-entity-id');
            
            // Press camera movement key
            inputManager.handleKeyPress('l');
            cameraManager.update();
            
            // Camera moved, should have stopped following
            expect(camera.x).to.equal(CAMERA_CONFIG.ARROW_MOVE_SPEED);
        });

        it('should use configured camera move delay', () => {
            expect(CAMERA_CONFIG.ARROW_MOVE_DELAY).to.be.a('number');
            expect(CAMERA_CONFIG.ARROW_MOVE_DELAY).to.equal(5000); // 5 seconds
        });
    });

    describe('Configuration Values', () => {
        it('should have camera move speed configured', () => {
            expect(CAMERA_CONFIG.ARROW_MOVE_SPEED).to.be.a('number');
            expect(CAMERA_CONFIG.ARROW_MOVE_SPEED).to.be.greaterThan(0);
        });

        it('should have camera move delay configured', () => {
            expect(CAMERA_CONFIG.ARROW_MOVE_DELAY).to.be.a('number');
            expect(CAMERA_CONFIG.ARROW_MOVE_DELAY).to.be.greaterThan(0);
        });

        it('should have follow resume delay configured', () => {
            expect(CAMERA_CONFIG.FOLLOW_RESUME_DELAY).to.be.a('number');
            expect(CAMERA_CONFIG.FOLLOW_RESUME_DELAY).to.be.greaterThan(0);
        });
    });
});
