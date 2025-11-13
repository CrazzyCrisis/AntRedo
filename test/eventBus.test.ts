import { expect } from 'chai';
import { EventBus, GameEvents } from '../src/utils/eventBus';

describe('EventBus', () => {
    beforeEach(() => {
        // Clear all events before each test
        EventBus.clear();
    });

    describe('on() - Subscribe to events', () => {
        it('should register an event listener', () => {
            let called = false;
            EventBus.on('test:event', () => {
                called = true;
            });

            EventBus.emit('test:event');
            expect(called).to.be.true;
        });

        it('should pass arguments to the callback', () => {
            let result: any;
            EventBus.on('test:event', (arg1: number, arg2: string) => {
                result = { arg1, arg2 };
            });

            EventBus.emit('test:event', 42, 'hello');
            expect(result).to.deep.equal({ arg1: 42, arg2: 'hello' });
        });

        it('should allow multiple listeners for the same event', () => {
            let count = 0;
            EventBus.on('test:event', () => count++);
            EventBus.on('test:event', () => count++);
            EventBus.on('test:event', () => count++);

            EventBus.emit('test:event');
            expect(count).to.equal(3);
        });

        it('should return an unsubscribe function', () => {
            let called = false;
            const unsubscribe = EventBus.on('test:event', () => {
                called = true;
            });

            unsubscribe();
            EventBus.emit('test:event');
            expect(called).to.be.false;
        });
    });

    describe('once() - Subscribe to event once', () => {
        it('should only trigger callback once', () => {
            let count = 0;
            EventBus.once('test:event', () => count++);

            EventBus.emit('test:event');
            EventBus.emit('test:event');
            EventBus.emit('test:event');

            expect(count).to.equal(1);
        });

        it('should pass arguments to the callback', () => {
            let result: any;
            EventBus.once('test:event', (value: number) => {
                result = value;
            });

            EventBus.emit('test:event', 123);
            expect(result).to.equal(123);
        });

        it('should return an unsubscribe function', () => {
            let called = false;
            const unsubscribe = EventBus.once('test:event', () => {
                called = true;
            });

            unsubscribe();
            EventBus.emit('test:event');
            expect(called).to.be.false;
        });
    });

    describe('off() - Unsubscribe from events', () => {
        it('should remove a specific listener', () => {
            let count = 0;
            const callback = () => count++;

            EventBus.on('test:event', callback);
            EventBus.emit('test:event');
            expect(count).to.equal(1);

            EventBus.off('test:event', callback);
            EventBus.emit('test:event');
            expect(count).to.equal(1); // Should still be 1
        });

        it('should not affect other listeners', () => {
            let count1 = 0;
            let count2 = 0;
            const callback1 = () => count1++;
            const callback2 = () => count2++;

            EventBus.on('test:event', callback1);
            EventBus.on('test:event', callback2);

            EventBus.off('test:event', callback1);
            EventBus.emit('test:event');

            expect(count1).to.equal(0);
            expect(count2).to.equal(1);
        });

        it('should handle removing non-existent listener gracefully', () => {
            const callback = () => {};
            expect(() => EventBus.off('test:event', callback)).to.not.throw();
        });
    });

    describe('emit() - Trigger events', () => {
        it('should do nothing if no listeners registered', () => {
            expect(() => EventBus.emit('test:event')).to.not.throw();
        });

        it('should handle errors in callbacks gracefully', () => {
            // Suppress console.error for this test to avoid cluttering output
            const originalError = console.error;
            console.error = () => {};
            
            let called = false;
            EventBus.on('test:event', () => {
                throw new Error('Test error');
            });
            EventBus.on('test:event', () => {
                called = true;
            });

            expect(() => EventBus.emit('test:event')).to.not.throw();
            expect(called).to.be.true; // Second callback should still run
            
            // Restore console.error
            console.error = originalError;
        });

        it('should pass multiple arguments', () => {
            let result: any[] = [];
            EventBus.on('test:event', (...args: any[]) => {
                result = args;
            });

            EventBus.emit('test:event', 1, 'two', { three: 3 }, [4, 5]);
            expect(result).to.deep.equal([1, 'two', { three: 3 }, [4, 5]]);
        });
    });

    describe('clear() - Remove listeners', () => {
        it('should clear all listeners for a specific event', () => {
            let count = 0;
            EventBus.on('test:event1', () => count++);
            EventBus.on('test:event1', () => count++);
            EventBus.on('test:event2', () => count++);

            EventBus.clear('test:event1');
            EventBus.emit('test:event1');
            EventBus.emit('test:event2');

            expect(count).to.equal(1); // Only event2 listener should fire
        });

        it('should clear all events if no event name provided', () => {
            let count = 0;
            EventBus.on('test:event1', () => count++);
            EventBus.on('test:event2', () => count++);
            EventBus.on('test:event3', () => count++);

            EventBus.clear();
            EventBus.emit('test:event1');
            EventBus.emit('test:event2');
            EventBus.emit('test:event3');

            expect(count).to.equal(0);
        });
    });

    describe('listenerCount() - Get number of listeners', () => {
        it('should return 0 for event with no listeners', () => {
            expect(EventBus.listenerCount('test:event')).to.equal(0);
        });

        it('should return correct count of listeners', () => {
            EventBus.on('test:event', () => {});
            EventBus.on('test:event', () => {});
            EventBus.on('test:event', () => {});

            expect(EventBus.listenerCount('test:event')).to.equal(3);
        });

        it('should update count after removing listeners', () => {
            const callback = () => {};
            EventBus.on('test:event', callback);
            EventBus.on('test:event', () => {});

            expect(EventBus.listenerCount('test:event')).to.equal(2);

            EventBus.off('test:event', callback);
            expect(EventBus.listenerCount('test:event')).to.equal(1);
        });
    });

    describe('hasListeners() - Check if event has listeners', () => {
        it('should return false for event with no listeners', () => {
            expect(EventBus.hasListeners('test:event')).to.be.false;
        });

        it('should return true for event with listeners', () => {
            EventBus.on('test:event', () => {});
            expect(EventBus.hasListeners('test:event')).to.be.true;
        });
    });

    describe('getEventNames() - Get all event names', () => {
        it('should return empty array when no events registered', () => {
            expect(EventBus.getEventNames()).to.deep.equal([]);
        });

        it('should return array of event names', () => {
            EventBus.on('event1', () => {});
            EventBus.on('event2', () => {});
            EventBus.on('event3', () => {});

            const names = EventBus.getEventNames();
            expect(names).to.have.lengthOf(3);
            expect(names).to.include('event1');
            expect(names).to.include('event2');
            expect(names).to.include('event3');
        });
    });

    describe('GameEvents constants', () => {
        it('should have game lifecycle events', () => {
            expect(GameEvents.GAME_START).to.equal('game:start');
            expect(GameEvents.GAME_PAUSE).to.equal('game:pause');
            expect(GameEvents.GAME_OVER).to.equal('game:over');
        });

        it('should have player events', () => {
            expect(GameEvents.PLAYER_MOVE).to.equal('player:move');
            expect(GameEvents.PLAYER_DAMAGE).to.equal('player:damage');
            expect(GameEvents.PLAYER_DEATH).to.equal('player:death');
        });

        it('should have UI events', () => {
            expect(GameEvents.SCORE_UPDATE).to.equal('score:update');
            expect(GameEvents.UI_BUTTON_CLICK).to.equal('ui:button:click');
        });
    });

    describe('Real-world usage scenarios', () => {
        it('should handle complex event flow', () => {
            let playerHealth = 100;
            let uiHealthDisplay = 100;
            let damageLog: number[] = [];

            // Player takes damage
            EventBus.on(GameEvents.PLAYER_DAMAGE, (amount: number) => {
                playerHealth -= amount;
                damageLog.push(amount);
            });

            // UI updates health display
            EventBus.on(GameEvents.PLAYER_DAMAGE, (_amount: number, newHealth: number) => {
                uiHealthDisplay = newHealth;
            });

            // Trigger damage
            EventBus.emit(GameEvents.PLAYER_DAMAGE, 25, 75);

            expect(playerHealth).to.equal(75);
            expect(damageLog).to.deep.equal([25]);
            expect(uiHealthDisplay).to.equal(75);
        });

        it('should allow chaining events', () => {
            let score = 0;
            let levelUp = false;

            EventBus.on(GameEvents.SCORE_UPDATE, (newScore: number) => {
                score = newScore;
                if (score >= 100) {
                    EventBus.emit(GameEvents.LEVEL_COMPLETE);
                }
            });

            EventBus.on(GameEvents.LEVEL_COMPLETE, () => {
                levelUp = true;
            });

            EventBus.emit(GameEvents.SCORE_UPDATE, 150);

            expect(score).to.equal(150);
            expect(levelUp).to.be.true;
        });
    });
});
