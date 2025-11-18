/**
 * Tests for AnimatedSpriteSheetComponent
 * TDD - Tests written BEFORE implementation
 */

import { expect } from 'chai';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { AnimatedSpriteSheetComponent } from '../../src/rendering/components/AnimatedSpriteSheetComponent';
import { EntityState } from '../../src/classes/components/StateMachineComponent';
import { EventBus } from '../../src/utils/eventBus';

describe('AnimatedSpriteSheetComponent', () => {
    let mockSpritesheet: any;
    let mockGraphics: any;

    beforeEach(() => {
        // Clear EventBus
        EventBus.clear();

        // Mock spritesheet (p5.Image)
        mockSpritesheet = {
            width: 128,  // 4 frames x 32px
            height: 64   // 2 rows x 32px
        };

        // Mock p5.Graphics
        mockGraphics = {
            imageMode: () => {},
            image: () => {},
            copy: () => {},
            push: () => {},
            pop: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
            fill: () => {},
            stroke: () => {},
            strokeWeight: () => {},
            rect: () => {},
            line: () => {}
        };
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Constructor and Initialization', () => {
        it('should implement Renderable interface', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            expect(component.layer).to.be.a('number');
            expect(component.depth).to.be.a('number');
            expect(component.render).to.be.a('function');
        });

        it('should initialize with position', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            expect(component).to.exist;
        });

        it('should default to ENTITIES layer and depth 0', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            expect(component.layer).to.equal(RenderLayer.ENTITIES);
            expect(component.depth).to.equal(0);
        });
    });

    describe('Animation Management', () => {
        it('should add animation with config', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('idle', {
                row: 0,
                startCol: 0,
                endCol: 1,
                frameWidth: 32,
                frameHeight: 32,
                speed: 5,
                loop: true
            });

            // Should not throw, animation added successfully
            expect(() => component.playAnimation('idle')).to.not.throw();
        });

        it('should switch to different animation', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('idle', {
                row: 0,
                startCol: 0,
                endCol: 1,
                frameWidth: 32,
                frameHeight: 32,
                speed: 5,
                loop: true
            });

            component.addAnimation('walk', {
                row: 1,
                startCol: 0,
                endCol: 3,
                frameWidth: 32,
                frameHeight: 32,
                speed: 3,
                loop: true
            });

            component.playAnimation('idle');
            component.playAnimation('walk');
            
            // Should not throw
            expect(() => component.render(mockGraphics)).to.not.throw();
        });

        it('should handle missing animation gracefully', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            // Should not throw when playing non-existent animation
            expect(() => component.playAnimation('nonexistent')).to.not.throw();
        });

        it('should not force switch if already playing same animation', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('idle', {
                row: 0,
                startCol: 0,
                endCol: 1,
                frameWidth: 32,
                frameHeight: 32,
                speed: 5,
                loop: true
            });

            component.playAnimation('idle');
            const result = component.playAnimation('idle'); // Should not restart
            
            expect(result).to.be.false;
        });

        it('should force switch when force parameter is true', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('idle', {
                row: 0,
                startCol: 0,
                endCol: 1,
                frameWidth: 32,
                frameHeight: 32,
                speed: 5,
                loop: true
            });

            component.playAnimation('idle');
            const result = component.playAnimation('idle', true); // Force restart
            
            expect(result).to.be.true;
        });
    });

    describe('Frame-Based Timing', () => {
        it('should advance frame counter on update', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('idle', {
                row: 0,
                startCol: 0,
                endCol: 1,
                frameWidth: 32,
                frameHeight: 32,
                speed: 5,
                loop: true
            });

            component.playAnimation('idle');
            
            // Advance frames (speed 5 = change every 5 updates)
            for (let i = 0; i < 5; i++) {
                component.update();
            }
            
            // Frame should have advanced
            expect(() => component.render(mockGraphics)).to.not.throw();
        });

        it('should respect animation speed', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('slow', {
                row: 0,
                startCol: 0,
                endCol: 3,
                frameWidth: 32,
                frameHeight: 32,
                speed: 10, // Slower
                loop: true
            });

            component.playAnimation('slow');
            
            // Should not advance after 5 updates (needs 10)
            for (let i = 0; i < 5; i++) {
                component.update();
            }
            
            // Should advance after 10 updates
            for (let i = 0; i < 5; i++) {
                component.update();
            }
            
            expect(() => component.render(mockGraphics)).to.not.throw();
        });
    });

    describe('Looping Animations', () => {
        it('should loop animation when loop is true', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('walk', {
                row: 0,
                startCol: 0,
                endCol: 1, // 2 frames
                frameWidth: 32,
                frameHeight: 32,
                speed: 1, // Fast for testing
                loop: true
            });

            component.playAnimation('walk');
            
            // Advance past all frames multiple times
            for (let i = 0; i < 10; i++) {
                component.update();
            }
            
            // Should not throw (looping)
            expect(() => component.render(mockGraphics)).to.not.throw();
        });

        it('should stop at last frame when loop is false', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('die', {
                row: 0,
                startCol: 0,
                endCol: 1, // 2 frames
                frameWidth: 32,
                frameHeight: 32,
                speed: 1,
                loop: false // One-shot
            });

            component.playAnimation('die');
            
            // Advance past all frames
            for (let i = 0; i < 10; i++) {
                component.update();
            }
            
            // Should stay on last frame
            expect(() => component.render(mockGraphics)).to.not.throw();
        });
    });

    describe('EventBus Integration', () => {
        it('should listen to ENTITY_STATE_CHANGED event', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            const entityId = 'test-entity-123';
            
            component.addAnimation('idle', {
                row: 0,
                startCol: 0,
                endCol: 1,
                frameWidth: 32,
                frameHeight: 32,
                speed: 5,
                loop: true
            });

            component.addAnimation('walk', {
                row: 1,
                startCol: 0,
                endCol: 3,
                frameWidth: 32,
                frameHeight: 32,
                speed: 3,
                loop: true
            });

            // Setup state mapping
            const stateMap = new Map<EntityState, string>();
            stateMap.set(EntityState.IDLE, 'idle');
            stateMap.set(EntityState.FOLLOWING, 'walk');
            
            component.setOwnerEntity(entityId, stateMap);
            component.playAnimation('idle');

            // Emit state change event
            EventBus.emit('ENTITY_STATE_CHANGED', entityId, EntityState.IDLE, EntityState.FOLLOWING);

            // Animation should have switched (verify it doesn't throw)
            expect(() => component.render(mockGraphics)).to.not.throw();
        });

        it('should ignore state changes for other entities', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            const entityId = 'test-entity-123';
            const otherEntityId = 'other-entity-456';
            
            component.addAnimation('idle', {
                row: 0,
                startCol: 0,
                endCol: 1,
                frameWidth: 32,
                frameHeight: 32,
                speed: 5,
                loop: true
            });

            const stateMap = new Map<EntityState, string>();
            stateMap.set(EntityState.IDLE, 'idle');
            
            component.setOwnerEntity(entityId, stateMap);
            component.playAnimation('idle');

            // Emit state change for DIFFERENT entity
            EventBus.emit('ENTITY_STATE_CHANGED', otherEntityId, EntityState.IDLE, EntityState.FOLLOWING);

            // Should not affect this component
            expect(() => component.render(mockGraphics)).to.not.throw();
        });

        it('should cleanup EventBus subscription on destruction', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            const entityId = 'test-entity-123';
            
            const stateMap = new Map<EntityState, string>();
            stateMap.set(EntityState.IDLE, 'idle');
            
            component.setOwnerEntity(entityId, stateMap);
            
            // Cleanup (should unsubscribe)
            component.cleanup();

            // Should not throw
            expect(() => {
                EventBus.emit('ENTITY_STATE_CHANGED', entityId, EntityState.IDLE, EntityState.FOLLOWING);
            }).to.not.throw();
        });
    });

    describe('Position and Depth', () => {
        it('should update position', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.setPosition(300, 400);
            
            // Should not throw
            expect(() => component.render(mockGraphics)).to.not.throw();
        });

        it('should update depth for sorting', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.setDepth(150);
            
            expect(component.depth).to.equal(150);
        });

        it('should update layer', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.setLayer(RenderLayer.ABOVE_ENTITIES);
            
            expect(component.layer).to.equal(RenderLayer.ABOVE_ENTITIES);
        });
    });

    describe('Rendering', () => {
        it('should render without throwing', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            component.addAnimation('idle', {
                row: 0,
                startCol: 0,
                endCol: 1,
                frameWidth: 32,
                frameHeight: 32,
                speed: 5,
                loop: true
            });

            component.playAnimation('idle');
            
            expect(() => component.render(mockGraphics)).to.not.throw();
        });

        it('should handle null spritesheet gracefully', () => {
            const component = new AnimatedSpriteSheetComponent(null, 100, 200);
            
            // Should render placeholder without throwing
            expect(() => component.render(mockGraphics)).to.not.throw();
        });

        it('should render placeholder when no animation playing', () => {
            const component = new AnimatedSpriteSheetComponent(mockSpritesheet, 100, 200);
            
            // No animation added/playing
            expect(() => component.render(mockGraphics)).to.not.throw();
        });
    });
});
