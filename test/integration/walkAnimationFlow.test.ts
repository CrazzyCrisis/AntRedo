/**
 * Walk Animation Flow Integration Tests
 * Tests the complete flow from entity movement to walk animation triggering
 */

import { expect } from 'chai';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';
import { AnimatedSpriteSheetComponent } from '../../src/rendering/components/AnimatedSpriteSheetComponent';
import { Ant } from '../../src/classes/Ant';
import { EntityState } from '../../src/classes/components/StateMachineComponent';


describe('Walk Animation Flow Integration', () => {
    let mockSpritesheet: any;
    let animatedSprite: AnimatedSpriteSheetComponent;
    let ant: Ant;

    beforeEach(() => {
        EventBus.clear();

        // Create mock spritesheet
        mockSpritesheet = {
            width: 320,
            height: 320
        };

        // Create animated sprite component
        animatedSprite = new AnimatedSpriteSheetComponent(mockSpritesheet, 0, 0);

        // Add animations
        animatedSprite.addAnimation('idle', {
            row: 0,
            startCol: 0,
            endCol: 3,
            frameWidth: 32,
            frameHeight: 32,
            speed: 5,
            loop: true
        });

        animatedSprite.addAnimation('walk', {
            row: 1,
            startCol: 0,
            endCol: 5,
            frameWidth: 32,
            frameHeight: 32,
            speed: 3,
            loop: true
        });

        // Create ant entity
        ant = new Ant(10, 10, 'test-faction');

        // Link animated sprite to entity
        animatedSprite.setOwnerEntity(ant.id, new Map());

        // Start with idle animation
        animatedSprite.playAnimation('idle');
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Event Emission', () => {
        it('should emit ENTITY_MOVED when ant calls moveTo()', (done) => {
            let eventEmitted = false;

            EventBus.on(GameEvents.ENTITY_MOVED, (id: string, gridX: number, gridY: number) => {
                eventEmitted = true;
                expect(id).to.equal(ant.id);
                expect(gridX).to.equal(11);
                expect(gridY).to.equal(10);
                done();
            });

            ant.moveTo(11, 10);
            
            if (!eventEmitted) {
                done(new Error('ENTITY_MOVED event was not emitted'));
            }
        });

        it('should emit ENTITY_SMOOTH_POSITION_UPDATE during requestMove()', (done) => {
            let eventEmitted = false;

            EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string, x: number, y: number) => {
                eventEmitted = true;
                expect(id).to.equal(ant.id);
                console.log(`[TEST] ENTITY_SMOOTH_POSITION_UPDATE emitted: id=${id}, x=${x}, y=${y}`);
                done();
            });

            // Request movement
            ant.requestMove(1, 0);
            
            // Update ant to process movement (needs deltaTime)
            ant.update(16); // 16ms frame time

            setTimeout(() => {
                if (!eventEmitted) {
                    done(new Error('ENTITY_SMOOTH_POSITION_UPDATE event was not emitted'));
                }
            }, 50);
        });
    });

    describe('Animation Switching on Movement', () => {
        it('should switch from idle to walk on ENTITY_MOVED', (done) => {
            expect(animatedSprite.getCurrentAnimation()).to.equal('idle');

            // Emit ENTITY_MOVED event
            EventBus.emit(GameEvents.ENTITY_MOVED, ant.id, 11, 10);

            // Check animation switched
            setTimeout(() => {
                const currentAnim = animatedSprite.getCurrentAnimation();
                console.log(`[TEST] Current animation after ENTITY_MOVED: ${currentAnim}`);
                expect(currentAnim).to.equal('walk', 'Animation should switch to walk after ENTITY_MOVED');
                done();
            }, 10);
        });

        it('should switch from idle to walk on ENTITY_SMOOTH_POSITION_UPDATE', (done) => {
            expect(animatedSprite.getCurrentAnimation()).to.equal('idle');

            // Emit ENTITY_SMOOTH_POSITION_UPDATE event
            EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, ant.id, 320, 320);

            // Check animation switched
            setTimeout(() => {
                const currentAnim = animatedSprite.getCurrentAnimation();
                console.log(`[TEST] Current animation after ENTITY_SMOOTH_POSITION_UPDATE: ${currentAnim}`);
                expect(currentAnim).to.equal('walk', 'Animation should switch to walk after ENTITY_SMOOTH_POSITION_UPDATE');
                done();
            }, 10);
        });

        it('should switch back to idle after movement timeout', (done) => {
            // Start walking
            EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, ant.id, 320, 320);

            setTimeout(() => {
                expect(animatedSprite.getCurrentAnimation()).to.equal('walk');

                // Wait for timeout (100ms + buffer)
                setTimeout(() => {
                    animatedSprite.update(); // Trigger timeout check
                    const currentAnim = animatedSprite.getCurrentAnimation();
                    console.log(`[TEST] Current animation after timeout: ${currentAnim}`);
                    expect(currentAnim).to.equal('idle', 'Animation should switch back to idle after timeout');
                    done();
                }, 120);
            }, 10);
        });
    });

    describe('Full Movement Flow', () => {
        it('should trigger walk animation when ant moves via requestMove()', function(done) {
            this.timeout(200); // Increase timeout for this test

            expect(animatedSprite.getCurrentAnimation()).to.equal('idle');
            console.log('[TEST] Starting with idle animation');

            let smoothUpdateReceived = false;
            let animationSwitched = false;

            // Monitor smooth position updates
            const unsubscribe = EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string) => {
                if (id === ant.id) {
                    smoothUpdateReceived = true;
                    console.log('[TEST] Received ENTITY_SMOOTH_POSITION_UPDATE');
                    
                    const currentAnim = animatedSprite.getCurrentAnimation();
                    console.log(`[TEST] Animation after smooth update: ${currentAnim}`);
                    
                    if (currentAnim === 'walk') {
                        animationSwitched = true;
                    }
                }
            });

            // Request movement
            console.log('[TEST] Requesting movement...');
            ant.requestMove(1, 0);

            // Update ant to process movement
            console.log('[TEST] Updating ant (processing movement)...');
            ant.update(16);

            // Check results after delay
            setTimeout(() => {
                unsubscribe();
                console.log(`[TEST] Smooth update received: ${smoothUpdateReceived}`);
                console.log(`[TEST] Animation switched: ${animationSwitched}`);
                console.log(`[TEST] Final animation: ${animatedSprite.getCurrentAnimation()}`);

                expect(smoothUpdateReceived).to.be.true;
                expect(animationSwitched).to.be.true;
                expect(animatedSprite.getCurrentAnimation()).to.equal('walk');
                done();
            }, 100);
        });

        it('should handle continuous movement with multiple updates', function(done) {
            this.timeout(300);

            expect(animatedSprite.getCurrentAnimation()).to.equal('idle');

            let updateCount = 0;
            const unsubscribe = EventBus.on(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, (id: string) => {
                if (id === ant.id) {
                    updateCount++;
                }
            });

            // Simulate continuous movement (3 frames)
            for (let i = 0; i < 3; i++) {
                ant.requestMove(1, 0);
                ant.update(16);
            }

            setTimeout(() => {
                unsubscribe();
                console.log(`[TEST] Total smooth updates: ${updateCount}`);
                console.log(`[TEST] Final animation: ${animatedSprite.getCurrentAnimation()}`);

                expect(updateCount).to.be.greaterThan(0);
                expect(animatedSprite.getCurrentAnimation()).to.equal('walk');
                done();
            }, 100);
        });
    });

    describe('Edge Cases', () => {
        it('should not switch animation for different entity IDs', (done) => {
            expect(animatedSprite.getCurrentAnimation()).to.equal('idle');

            // Emit event for different entity
            EventBus.emit(GameEvents.ENTITY_MOVED, 'different-entity-id', 11, 10);

            setTimeout(() => {
                expect(animatedSprite.getCurrentAnimation()).to.equal('idle');
                done();
            }, 10);
        });

        it('should not switch from walk back to walk (already walking)', (done) => {
            // Start with walk
            animatedSprite.playAnimation('walk');
            expect(animatedSprite.getCurrentAnimation()).to.equal('walk');

            // Emit movement (should stay walk)
            EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, ant.id, 320, 320);

            setTimeout(() => {
                expect(animatedSprite.getCurrentAnimation()).to.equal('walk');
                done();
            }, 10);
        });

        it('should maintain walk animation during rapid movement updates', function(done) {
            this.timeout(300);

            // Rapid movement updates
            for (let i = 0; i < 10; i++) {
                EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, ant.id, 320 + i, 320);
            }

            setTimeout(() => {
                expect(animatedSprite.getCurrentAnimation()).to.equal('walk');
                done();
            }, 50);
        });
    });

    describe('State-Based Animation Override', () => {
        it('should not override state-based animations (e.g., attacking)', (done) => {
            // Set up state-to-animation mapping
            const stateMap = new Map<EntityState, string>();
            stateMap.set(EntityState.IDLE, 'idle');
            stateMap.set(EntityState.ATTACKING, 'attack');

            animatedSprite.setOwnerEntity(ant.id, stateMap);

            // Add attack animation
            animatedSprite.addAnimation('attack', {
                row: 2,
                startCol: 0,
                endCol: 3,
                frameWidth: 32,
                frameHeight: 32,
                speed: 4,
                loop: false
            });

            // Trigger attack state
            const stateMachine = ant.getComponent('StateMachine');
            if (stateMachine) {
                EventBus.emit(GameEvents.ENTITY_STATE_CHANGED, ant.id, EntityState.ATTACKING);
            }

            setTimeout(() => {
                const currentAnim = animatedSprite.getCurrentAnimation();
                console.log(`[TEST] Animation during attack: ${currentAnim}`);

                // Now emit movement - should NOT override attack animation
                EventBus.emit(GameEvents.ENTITY_SMOOTH_POSITION_UPDATE, ant.id, 320, 320);

                setTimeout(() => {
                    const finalAnim = animatedSprite.getCurrentAnimation();
                    console.log(`[TEST] Animation after movement during attack: ${finalAnim}`);
                    // Attack should be maintained (state-based animations have priority)
                    expect(finalAnim).to.equal('attack');
                    done();
                }, 20);
            }, 20);
        });
    });
});
