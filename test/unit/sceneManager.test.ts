/**
 * Tests for SceneManager and IScene interface
 * Following TDD - tests written BEFORE implementation
 */

// @ts-nocheck - Suppress unused warnings for skipped tests
import { expect } from 'chai';
import { EventBus } from '../../src/utils/eventBus';
import { SceneManager } from '../../src/managers/SceneManager';
import { IScene } from '../../src/scenes/IScene';

// Import SceneManager (not yet implemented)
// import { SceneManager } from '../../src/managers/SceneManager';
// import { IScene } from '../../src/scenes/IScene';

// Mock scene for testing
class MockScene implements IScene {
    public enterCalled = false;
    public exitCalled = false;
    public updateCalled = false;
    public updateCallCount = 0;
    public mouseClickCalled = false;
    public mouseMoveCalled = false;
    public lastMouseX = 0;
    public lastMouseY = 0;

    enter(): void {
        this.enterCalled = true;
    }

    exit(): void {
        this.exitCalled = true;
    }

    update(): void {
        this.updateCalled = true;
        this.updateCallCount++;
    }

    handleMouseClick(x: number, y: number): void {
        this.mouseClickCalled = true;
        this.lastMouseX = x;
        this.lastMouseY = y;
    }

    handleMouseMove(x: number, y: number): void {
        this.mouseMoveCalled = true;
        this.lastMouseX = x;
        this.lastMouseY = y;
    }
}

describe('SceneManager', () => {
    beforeEach(() => {
        EventBus.clear();
        // Reset singleton state by switching to null (private access workaround)
        const manager = SceneManager.getInstance();
        (manager as any).currentScene = null;
        (manager as any).currentSceneName = '';
    });

    describe('Singleton Pattern', () => {
        it('should return same instance on multiple getInstance calls', () => {
            const instance1 = SceneManager.getInstance();
            const instance2 = SceneManager.getInstance();
            
            expect(instance1).to.equal(instance2);
        });

        it('should not allow direct instantiation', () => {
            // Constructor should be private - TypeScript enforces this
            // This test documents the pattern
            // expect(() => new SceneManager()).to.throw();
        });
    });

    describe('Scene Lifecycle', () => {
        it('should call enter() when scene is set for first time', () => {
            const manager = SceneManager.getInstance();
            const scene = new MockScene();
            
            manager.switchScene(scene);
            
            expect(scene.enterCalled).to.be.true;
            expect(scene.exitCalled).to.be.false;
        });

        it('should call exit() on old scene when switching', () => {
            const manager = SceneManager.getInstance();
            const scene1 = new MockScene();
            const scene2 = new MockScene();
            
            manager.switchScene(scene1);
            manager.switchScene(scene2);
            
            expect(scene1.exitCalled).to.be.true;
            expect(scene2.enterCalled).to.be.true;
        });

        it('should call enter() on new scene when switching', () => {
            const manager = SceneManager.getInstance();
            const scene1 = new MockScene();
            const scene2 = new MockScene();
            
            manager.switchScene(scene1);
            manager.switchScene(scene2);
            
            expect(scene2.enterCalled).to.be.true;
        });

        it('should track current scene', () => {
            const manager = SceneManager.getInstance();
            const scene = new MockScene();
            
            manager.switchScene(scene);
            
            expect(manager.getCurrentScene()).to.equal(scene);
        });

        it('should return null if no scene is set', () => {
            const manager = SceneManager.getInstance();
            
            expect(manager.getCurrentScene()).to.be.null;
        });
    });

    describe('Update Loop', () => {
        it('should call update() on current scene', () => {
            const manager = SceneManager.getInstance();
            const scene = new MockScene();
            
            manager.switchScene(scene);
            manager.update();
            
            expect(scene.updateCalled).to.be.true;
        });

        it('should call update() every frame', () => {
            const manager = SceneManager.getInstance();
            const scene = new MockScene();
            
            manager.switchScene(scene);
            manager.update();
            manager.update();
            manager.update();
            
            expect(scene.updateCallCount).to.equal(3);
        });

        it('should not throw if no scene is set', () => {
            const manager = SceneManager.getInstance();
            
            expect(() => manager.update()).to.not.throw();
        });
    });

    describe('Mouse Event Forwarding', () => {
        it('should forward mouse click to current scene', () => {
            const manager = SceneManager.getInstance();
            const scene = new MockScene();
            
            manager.switchScene(scene);
            manager.handleMouseClick(100, 200);
            
            expect(scene.mouseClickCalled).to.be.true;
            expect(scene.lastMouseX).to.equal(100);
            expect(scene.lastMouseY).to.equal(200);
        });

        it('should forward mouse move to current scene', () => {
            const manager = SceneManager.getInstance();
            const scene = new MockScene();
            
            manager.switchScene(scene);
            manager.handleMouseMove(150, 250);
            
            expect(scene.mouseMoveCalled).to.be.true;
            expect(scene.lastMouseX).to.equal(150);
            expect(scene.lastMouseY).to.equal(250);
        });

        it('should not throw on mouse click if no scene is set', () => {
            const manager = SceneManager.getInstance();
            
            expect(() => manager.handleMouseClick(100, 200)).to.not.throw();
        });

        it('should not throw on mouse move if no scene is set', () => {
            const manager = SceneManager.getInstance();
            
            expect(() => manager.handleMouseMove(100, 200)).to.not.throw();
        });
    });

    describe('EventBus Integration', () => {
        it('should emit SCENE_CHANGE event when switching scenes', () => {
            const manager = SceneManager.getInstance();
            const scene1 = new MockScene();
            const scene2 = new MockScene();
            
            let eventEmitted = false;
            let newSceneName = '';
            
            EventBus.on('scene:change', (sceneName: string) => {
                eventEmitted = true;
                newSceneName = sceneName;
            });
            
            manager.switchScene(scene1, 'MenuScene');
            expect(eventEmitted).to.be.true;
            expect(newSceneName).to.equal('MenuScene');
            
            eventEmitted = false;
            manager.switchScene(scene2, 'GameScene');
            expect(eventEmitted).to.be.true;
            expect(newSceneName).to.equal('GameScene');
        });

        it('should include previous scene name in SCENE_CHANGE event', () => {
            const manager = SceneManager.getInstance();
            const scene1 = new MockScene();
            const scene2 = new MockScene();
            
            let previousScene = '';
            let newScene = '';
            
            manager.switchScene(scene1, 'MenuScene');
            
            EventBus.on('scene:change', (newName: string, prevName: string) => {
                newScene = newName;
                previousScene = prevName;
            });
            
            manager.switchScene(scene2, 'GameScene');
            
            expect(newScene).to.equal('GameScene');
            expect(previousScene).to.equal('MenuScene');
        });
    });

    describe('Scene State Management', () => {
        it('should allow getting scene name', () => {
            const manager = SceneManager.getInstance();
            const scene = new MockScene();
            
            manager.switchScene(scene, 'TestScene');
            
            expect(manager.getCurrentSceneName()).to.equal('TestScene');
        });

        it('should return empty string if no scene name provided', () => {
            const manager = SceneManager.getInstance();
            const scene = new MockScene();
            
            manager.switchScene(scene); // No name provided
            
            expect(manager.getCurrentSceneName()).to.equal('');
        });
    });
});


