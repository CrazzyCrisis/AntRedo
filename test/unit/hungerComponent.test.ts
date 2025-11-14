/**
 * HungerComponent Tests (TDD - RED phase)
 * Tests for hunger system with decay, starvation, and food consumption
 */

import { expect } from 'chai';
import { HungerComponent } from '../../src/classes/components/HungerComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';

describe('HungerComponent', () => {
    let hunger: HungerComponent;
    let owner: GameObject;

    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();

        // Create owner GameObject (ant)
        owner = new GameObject('ant', 5, 5);

        // Create hunger component with max hunger of 100
        hunger = new HungerComponent(100);
        hunger.onAttach(owner);
    });

    describe('Initialization', () => {
        it('should initialize with max hunger', () => {
            expect(hunger.getHunger()).to.equal(100);
        });

        it('should initialize with max hunger equal to current', () => {
            expect(hunger.getMaxHunger()).to.equal(100);
            expect(hunger.getHunger()).to.equal(100);
        });

        it('should not be hungry initially', () => {
            expect(hunger.isHungry()).to.be.false;
        });

        it('should not be starving initially', () => {
            expect(hunger.isStarving()).to.be.false;
        });

        it('should validate positive max hunger', () => {
            expect(() => new HungerComponent(0)).to.throw('Max hunger must be positive');
            expect(() => new HungerComponent(-10)).to.throw('Max hunger must be positive');
        });
    });

    describe('Hunger Decay', () => {
        it('should decrease hunger over time', () => {
            hunger.setDecayRate(1); // 1 hunger per second
            hunger.update(1000); // 1 second

            expect(hunger.getHunger()).to.equal(99);
        });

        it('should decay proportionally to time', () => {
            hunger.setDecayRate(2); // 2 hunger per second
            hunger.update(500); // 0.5 seconds

            expect(hunger.getHunger()).to.equal(99); // Lost 1 hunger
        });

        it('should not decay below zero', () => {
            hunger.setHunger(5);
            hunger.setDecayRate(10);
            hunger.update(2000); // Would go to -15

            expect(hunger.getHunger()).to.equal(0);
        });

        it('should accumulate small decay amounts', () => {
            hunger.setDecayRate(0.1); // 0.1 hunger per second

            for (let i = 0; i < 10; i++) {
                hunger.update(1000); // 10 seconds total
            }

            expect(hunger.getHunger()).to.be.closeTo(99, 0.1); // Lost 1 hunger total
        });

        it('should handle zero decay rate', () => {
            hunger.setDecayRate(0);
            hunger.update(10000);

            expect(hunger.getHunger()).to.equal(100); // No change
        });
    });

    describe('Hunger States', () => {
        it('should be hungry when below threshold', () => {
            hunger.setHungerThreshold(50);
            hunger.setHunger(49);

            expect(hunger.isHungry()).to.be.true;
        });

        it('should not be hungry when at threshold', () => {
            hunger.setHungerThreshold(50);
            hunger.setHunger(50);

            expect(hunger.isHungry()).to.be.false;
        });

        it('should be starving when at zero', () => {
            hunger.setHunger(0);
            expect(hunger.isStarving()).to.be.true;
        });

        it('should not be starving when above zero', () => {
            hunger.setHunger(1);
            expect(hunger.isStarving()).to.be.false;
        });

        it('should emit ENTITY_HUNGRY event when becoming hungry', (done) => {
            hunger.setHungerThreshold(50);
            hunger.setHunger(51); // Not hungry yet

            EventBus.once(GameEvents.ENTITY_HUNGRY, (entityId: string) => {
                expect(entityId).to.equal(owner.id);
                done();
            });

            hunger.setHunger(49); // Now hungry
        });

        it('should emit ENTITY_STARVING event when starving', (done) => {
            hunger.setHunger(1); // Not starving yet

            EventBus.once(GameEvents.ENTITY_STARVING, (entityId: string) => {
                expect(entityId).to.equal(owner.id);
                done();
            });

            hunger.setHunger(0); // Now starving
        });

        it('should not emit duplicate hungry events', () => {
            let eventCount = 0;
            hunger.setHungerThreshold(50);

            EventBus.on(GameEvents.ENTITY_HUNGRY, () => {
                eventCount++;
            });

            hunger.setHunger(49); // Hungry
            hunger.setHunger(48); // Still hungry

            expect(eventCount).to.equal(1);
        });
    });

    describe('Food Consumption', () => {
        it('should restore hunger when eating', () => {
            hunger.setHunger(50);
            hunger.eat(30);

            expect(hunger.getHunger()).to.equal(80);
        });

        it('should not exceed max hunger', () => {
            hunger.setHunger(90);
            hunger.eat(50); // Would go to 140

            expect(hunger.getHunger()).to.equal(100);
        });

        it('should emit ENTITY_ATE event', (done) => {
            hunger.setHunger(50);

            EventBus.once(GameEvents.ENTITY_ATE, (entityId: string, amount: number, newHunger: number) => {
                expect(entityId).to.equal(owner.id);
                expect(amount).to.equal(20);
                expect(newHunger).to.equal(70);
                done();
            });

            hunger.eat(20);
        });

        it('should handle zero food amount', () => {
            hunger.setHunger(50);
            hunger.eat(0);
            expect(hunger.getHunger()).to.equal(50);
        });

        it('should reject negative food amounts', () => {
            expect(() => hunger.eat(-10)).to.throw('Food amount must be non-negative');
        });

        it('should fully restore hunger', () => {
            hunger.setHunger(20);
            hunger.fullyRestore();

            expect(hunger.getHunger()).to.equal(100);
        });

        it('should emit event on full restoration', (done) => {
            hunger.setHunger(30);

            EventBus.once(GameEvents.ENTITY_ATE, (entityId: string, amount: number) => {
                expect(entityId).to.equal(owner.id);
                expect(amount).to.equal(70); // 100 - 30
                done();
            });

            hunger.fullyRestore();
        });
    });

    describe('Starvation Damage', () => {
        it('should enable starvation damage', () => {
            hunger.setStarvationDamage(5);
            expect(hunger.getStarvationDamage()).to.equal(5);
        });

        it('should deal damage when starving', (done) => {
            hunger.setHunger(0);
            hunger.setStarvationDamage(10);

            EventBus.once(GameEvents.STARVATION_DAMAGE, (entityId: string, damage: number) => {
                expect(entityId).to.equal(owner.id);
                expect(damage).to.equal(10);
                done();
            });

            hunger.update(1000); // Trigger starvation damage
        });

        it('should not deal damage when not starving', () => {
            let eventCount = 0;
            hunger.setHunger(50);
            hunger.setStarvationDamage(5);

            EventBus.on(GameEvents.STARVATION_DAMAGE, () => {
                eventCount++;
            });

            hunger.update(1000);

            expect(eventCount).to.equal(0);
        });

        it('should deal damage at intervals', () => {
            let damageCount = 0;
            hunger.setHunger(0);
            hunger.setStarvationDamage(5);
            hunger.setStarvationInterval(1000); // 1 second intervals

            EventBus.on(GameEvents.STARVATION_DAMAGE, () => {
                damageCount++;
            });

            hunger.update(500); // 0.5 seconds
            expect(damageCount).to.equal(0);

            hunger.update(500); // Total 1 second
            expect(damageCount).to.equal(1);

            hunger.update(1000); // Total 2 seconds
            expect(damageCount).to.equal(2);
        });

        it('should reject negative starvation damage', () => {
            expect(() => hunger.setStarvationDamage(-5)).to.throw('Starvation damage must be non-negative');
        });

        it('should handle zero starvation damage', () => {
            let eventCount = 0;
            hunger.setHunger(0);
            hunger.setStarvationDamage(0);

            EventBus.on(GameEvents.STARVATION_DAMAGE, () => {
                eventCount++;
            });

            hunger.update(5000);

            expect(eventCount).to.equal(0);
        });
    });

    describe('Hunger Percentage', () => {
        it('should return percentage of max hunger', () => {
            hunger.setHunger(75);
            expect(hunger.getHungerPercentage()).to.equal(75);
        });

        it('should return 0% when empty', () => {
            hunger.setHunger(0);
            expect(hunger.getHungerPercentage()).to.equal(0);
        });

        it('should return 100% when full', () => {
            hunger.setHunger(100);
            expect(hunger.getHungerPercentage()).to.equal(100);
        });

        it('should handle fractional percentages', () => {
            const h = new HungerComponent(3);
            h.setHunger(1);
            expect(h.getHungerPercentage()).to.be.closeTo(33.33, 0.01);
        });
    });

    describe('Configuration', () => {
        it('should set decay rate', () => {
            hunger.setDecayRate(5);
            hunger.update(1000);
            expect(hunger.getHunger()).to.equal(95);
        });

        it('should set hunger threshold', () => {
            hunger.setHungerThreshold(75);
            hunger.setHunger(74);
            expect(hunger.isHungry()).to.be.true;
        });

        it('should set starvation interval', () => {
            hunger.setStarvationInterval(2000);
            hunger.setHunger(0);
            hunger.setStarvationDamage(5);

            let damageCount = 0;
            EventBus.on(GameEvents.STARVATION_DAMAGE, () => {
                damageCount++;
            });

            hunger.update(1000); // Not enough time
            expect(damageCount).to.equal(0);

            hunger.update(1000); // Now 2 seconds
            expect(damageCount).to.equal(1);
        });

        it('should reject negative decay rate', () => {
            expect(() => hunger.setDecayRate(-1)).to.throw('Decay rate must be non-negative');
        });

        it('should reject negative hunger threshold', () => {
            expect(() => hunger.setHungerThreshold(-1)).to.throw('Hunger threshold must be non-negative');
        });

        it('should reject negative starvation interval', () => {
            expect(() => hunger.setStarvationInterval(-1)).to.throw('Starvation interval must be positive');
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const newHunger = new HungerComponent(100);
            const newOwner = new GameObject('ant', 0, 0);

            newHunger.onAttach(newOwner);
            expect(newHunger.owner).to.equal(newOwner);
        });

        it('should detach from owner', () => {
            const ownerBefore = hunger.owner;
            hunger.onDetach();
            expect(hunger.owner).to.equal(ownerBefore);
        });

        it('should reset state on detach', () => {
            hunger.setHunger(50);
            hunger.setDecayRate(5);
            
            hunger.onDetach();

            // State should be reset
            expect(hunger.getHunger()).to.equal(100); // Back to max
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large hunger values', () => {
            const bigHunger = new HungerComponent(1000000);
            bigHunger.setHunger(500000);
            expect(bigHunger.getHungerPercentage()).to.equal(50);
        });

        it('should handle very small decay rates', () => {
            hunger.setDecayRate(0.001); // Very slow decay
            hunger.update(100); // 0.1 seconds

            expect(hunger.getHunger()).to.be.closeTo(100, 0.1);
        });

        it('should handle very large decay rates', () => {
            hunger.setDecayRate(1000);
            hunger.update(1000);
            expect(hunger.getHunger()).to.equal(0); // Instant starvation
        });

        it('should handle rapid updates', () => {
            hunger.setDecayRate(1);
            
            for (let i = 0; i < 100; i++) {
                hunger.update(10); // 100 * 10ms = 1 second
            }

            expect(hunger.getHunger()).to.be.closeTo(99, 1);
        });

        it('should handle eating while starving', () => {
            hunger.setHunger(0);
            hunger.eat(50);

            expect(hunger.getHunger()).to.equal(50);
            expect(hunger.isStarving()).to.be.false;
        });

        it('should handle multiple state transitions', () => {
            hunger.setHungerThreshold(50);
            
            hunger.setHunger(100); // Full
            expect(hunger.isHungry()).to.be.false;
            
            hunger.setHunger(40); // Hungry
            expect(hunger.isHungry()).to.be.true;
            
            hunger.setHunger(0); // Starving
            expect(hunger.isStarving()).to.be.true;
            
            hunger.eat(60); // Fed
            expect(hunger.isHungry()).to.be.false;
        });

        it('should handle decay while already at zero', () => {
            hunger.setHunger(0);
            hunger.setDecayRate(5);
            hunger.update(5000);

            expect(hunger.getHunger()).to.equal(0); // Still zero
        });

        it('should handle eating to exactly max hunger', () => {
            hunger.setHunger(70);
            hunger.eat(30); // Exactly to max

            expect(hunger.getHunger()).to.equal(100);
        });
    });
});
