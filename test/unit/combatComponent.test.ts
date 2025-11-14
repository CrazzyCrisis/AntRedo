/**
 * CombatComponent Tests (TDD - RED phase)
 * Tests for attack, cooldown, range validation, and target tracking
 */

import { expect } from 'chai';
import { CombatComponent } from '../../src/classes/components/CombatComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';

describe('CombatComponent', () => {
    let combat: CombatComponent;
    let owner: GameObject;
    let target: GameObject;

    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();

        // Create owner and target GameObjects
        owner = new GameObject('ant', 5, 5);
        target = new GameObject('enemy', 6, 6); // Distance = sqrt(2) ≈ 1.41, within 2.5 range

        // Create combat component with typical warrior stats
        combat = new CombatComponent(10, 2.5, 1000); // 10 damage, 2.5 range, 1000ms cooldown
        combat.onAttach(owner);
    });

    describe('Initialization', () => {
        it('should initialize with attack damage', () => {
            expect(combat.getAttackDamage()).to.equal(10);
        });

        it('should initialize with attack range', () => {
            expect(combat.getAttackRange()).to.equal(2.5);
        });

        it('should initialize with attack cooldown', () => {
            expect(combat.getAttackCooldown()).to.equal(1000);
        });

        it('should not be attacking initially', () => {
            expect(combat.isAttacking()).to.be.false;
        });

        it('should have no target initially', () => {
            expect(combat.getTarget()).to.be.null;
        });

        it('should be able to attack initially (no cooldown)', () => {
            expect(combat.canAttack()).to.be.true;
        });
    });

    describe('Target Management', () => {
        it('should set target', () => {
            const testTarget = new GameObject('enemy', 6, 6);
            combat.setTarget(testTarget.id);
            expect(combat.getTarget()).to.equal(testTarget.id);
        });

        it('should clear target', () => {
            const testTarget = new GameObject('enemy', 6, 6);
            combat.setTarget(testTarget.id);
            combat.clearTarget();
            expect(combat.getTarget()).to.be.null;
        });

        it('should replace existing target', () => {
            const target1 = new GameObject('enemy', 6, 6);
            const target2 = new GameObject('enemy', 7, 7);
            combat.setTarget(target1.id);
            combat.setTarget(target2.id);
            expect(combat.getTarget()).to.equal(target2.id);
        });

        it('should track target during attack', () => {
            combat.attack(target);
            expect(combat.getTarget()).to.equal(target.id);
        });
    });

    describe('Attack Execution', () => {
        it('should execute attack on valid target', () => {
            const result = combat.attack(target);
            expect(result).to.be.true;
        });

        it('should set attacking state when attacking', () => {
            combat.attack(target);
            expect(combat.isAttacking()).to.be.true;
        });

        it('should emit ENTITY_ATTACKED event', (done) => {
            EventBus.once(GameEvents.ENTITY_ATTACKED, (attackerId: string, targetId: string, damage: number) => {
                expect(attackerId).to.equal(owner.id);
                expect(targetId).to.equal(target.id);
                expect(damage).to.equal(10);
                done();
            });

            combat.attack(target);
        });

        it('should trigger attack cooldown', () => {
            combat.attack(target);
            expect(combat.canAttack()).to.be.false;
        });

        it('should not attack when target is null', () => {
            const result = combat.attack(null as any);
            expect(result).to.be.false;
        });
    });

    describe('Range Validation', () => {
        it('should not attack target out of range', () => {
            const farTarget = new GameObject('enemy', 20, 20);
            const result = combat.attack(farTarget);
            expect(result).to.be.false;
        });

        it('should attack target within range', () => {
            const nearTarget = new GameObject('enemy', 5, 7); // Within 2.5 range
            const result = combat.attack(nearTarget);
            expect(result).to.be.true;
        });

        it('should attack target at exact range boundary', () => {
            const edgeTarget = new GameObject('enemy', 5 + 2.5, 5);
            const result = combat.attack(edgeTarget);
            expect(result).to.be.true;
        });

        it('should check if target is in range without attacking', () => {
            const nearTarget = new GameObject('enemy', 6, 6);
            expect(combat.isInRange(nearTarget)).to.be.true;

            const farTarget = new GameObject('enemy', 20, 20);
            expect(combat.isInRange(farTarget)).to.be.false;
        });
    });

    describe('Attack Cooldown', () => {
        it('should not allow attack during cooldown', () => {
            combat.attack(target);
            expect(combat.canAttack()).to.be.false;
        });

        it('should allow attack after cooldown expires', () => {
            combat.attack(target);
            expect(combat.canAttack()).to.be.false;

            // Simulate time passing
            combat.update(1000); // Full cooldown duration

            expect(combat.canAttack()).to.be.true;
        });

        it('should not allow attack before cooldown completes', () => {
            combat.attack(target);
            combat.update(500); // Half cooldown
            expect(combat.canAttack()).to.be.false;
        });

        it('should track remaining cooldown time', () => {
            combat.attack(target);
            expect(combat.getRemainingCooldown()).to.be.greaterThan(0);

            combat.update(500);
            expect(combat.getRemainingCooldown()).to.be.approximately(500, 50);

            combat.update(500);
            expect(combat.getRemainingCooldown()).to.equal(0);
        });

        it('should not go below zero cooldown', () => {
            combat.attack(target);
            combat.update(2000); // Twice the cooldown
            expect(combat.getRemainingCooldown()).to.equal(0);
        });
    });

    describe('Update Loop', () => {
        it('should update cooldown over time', () => {
            combat.attack(target);
            const initialCooldown = combat.getRemainingCooldown();

            combat.update(100);
            expect(combat.getRemainingCooldown()).to.be.lessThan(initialCooldown);
        });

        it('should clear attacking state after cooldown', () => {
            combat.attack(target);
            expect(combat.isAttacking()).to.be.true;

            combat.update(1000);
            expect(combat.isAttacking()).to.be.false;
        });

        it('should handle multiple updates correctly', () => {
            combat.attack(target);

            combat.update(250);
            combat.update(250);
            combat.update(250);
            combat.update(250);

            expect(combat.canAttack()).to.be.true;
        });
    });

    describe('Dynamic Stat Changes', () => {
        it('should allow setting new attack damage', () => {
            combat.setAttackDamage(20);
            expect(combat.getAttackDamage()).to.equal(20);
        });

        it('should allow setting new attack range', () => {
            combat.setAttackRange(5.0);
            expect(combat.getAttackRange()).to.equal(5.0);
        });

        it('should allow setting new attack cooldown', () => {
            combat.setAttackCooldown(500);
            expect(combat.getAttackCooldown()).to.equal(500);
        });

        it('should emit correct damage after stat change', (done) => {
            combat.setAttackDamage(25);

            EventBus.once(GameEvents.ENTITY_ATTACKED, (_attackerId: string, _targetId: string, damage: number) => {
                expect(damage).to.equal(25);
                done();
            });

            combat.attack(target);
        });

        it('should use new range after stat change', () => {
            combat.setAttackRange(10.0);
            const farTarget = new GameObject('enemy', 15, 5); // 10 units away

            expect(combat.isInRange(farTarget)).to.be.true;
        });

        it('should use new cooldown after stat change', () => {
            combat.setAttackCooldown(500);
            combat.attack(target);

            combat.update(500);
            expect(combat.canAttack()).to.be.true; // Should be ready with shorter cooldown
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const newCombat = new CombatComponent(10, 2.5, 1000);
            const newOwner = new GameObject('ant', 0, 0);

            newCombat.onAttach(newOwner);
            expect(newCombat.owner).to.equal(newOwner);
        });

        it('should detach from owner', () => {
            combat.onDetach();
            expect(combat.owner).to.be.undefined;
        });

        it('should clear state on detach', () => {
            const testTarget = new GameObject('enemy', 6, 6);
            combat.setTarget(testTarget.id);
            combat.attack(target);

            combat.onDetach();

            // State should be cleared
            expect(combat.getTarget()).to.be.null;
            expect(combat.isAttacking()).to.be.false;
        });
    });

    describe('Edge Cases', () => {
        it('should handle attacking same target multiple times', () => {
            combat.attack(target);
            combat.update(1000);

            combat.attack(target);
            combat.update(1000);

            expect(combat.getTarget()).to.equal(target.id);
        });

        it('should handle zero damage', () => {
            const zeroCombat = new CombatComponent(0, 2.5, 1000);
            zeroCombat.onAttach(owner);

            const result = zeroCombat.attack(target);
            expect(result).to.be.true; // Should still "attack" but with 0 damage
        });

        it('should handle zero range (melee only)', () => {
            const meleeCombat = new CombatComponent(10, 0, 1000);
            meleeCombat.onAttach(owner);

            const samePositionTarget = new GameObject('enemy', 5, 5);
            expect(meleeCombat.isInRange(samePositionTarget)).to.be.true;
        });

        it('should handle instant attacks (zero cooldown)', () => {
            const instantCombat = new CombatComponent(10, 2.5, 0);
            instantCombat.onAttach(owner);

            instantCombat.attack(target);
            expect(instantCombat.canAttack()).to.be.true; // Should be ready immediately
        });

        it('should handle negative damage (treated as zero)', () => {
            combat.setAttackDamage(-10);
            expect(combat.getAttackDamage()).to.equal(0); // Should clamp to zero
        });

        it('should handle negative range (treated as zero)', () => {
            combat.setAttackRange(-5);
            expect(combat.getAttackRange()).to.equal(0); // Should clamp to zero
        });

        it('should handle negative cooldown (treated as zero)', () => {
            combat.setAttackCooldown(-500);
            expect(combat.getAttackCooldown()).to.equal(0); // Should clamp to zero
        });

        it('should handle attacking while already attacking', () => {
            combat.attack(target);
            const secondResult = combat.attack(target);
            expect(secondResult).to.be.false; // Should reject while on cooldown
        });

        it('should handle rapid target changes', () => {
            const target1 = new GameObject('enemy', 6, 6);
            const target2 = new GameObject('enemy', 7, 7);
            const target3 = new GameObject('enemy', 8, 8);
            combat.setTarget(target1.id);
            combat.setTarget(target2.id);
            combat.setTarget(target3.id);
            expect(combat.getTarget()).to.equal(target3.id);
        });
    });
});
