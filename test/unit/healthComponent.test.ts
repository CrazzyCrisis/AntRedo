/**
 * Tests for HealthComponent (MODEL)
 * Following TDD: Write tests first, then implementation
 */

import { expect } from 'chai';
import { HealthComponent } from '../../src/classes/components/HealthComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';

describe('HealthComponent', () => {
    let gameObject: GameObject;
    let health: HealthComponent;

    beforeEach(() => {
        gameObject = new GameObject('ant', 0, 0);
        health = new HealthComponent(100, 0.5); // 100 max health, 0.5 health/sec regen
        gameObject.addComponent('health', health);
    });

    afterEach(() => {
        gameObject.destroy();
    });

    describe('Initialization', () => {
        it('should initialize with max health', () => {
            expect(health.getCurrentHealth()).to.equal(100);
            expect(health.getMaxHealth()).to.equal(100);
        });

        it('should start alive', () => {
            expect(health.isAlive()).to.be.true;
            expect(health.isDead()).to.be.false;
        });

        it('should have correct health percentage', () => {
            expect(health.getHealthPercent()).to.equal(1.0);
        });

        it('should store regen rate', () => {
            expect(health.getRegenRate()).to.equal(0.5);
        });
    });

    describe('Taking Damage', () => {
        it('should reduce health when damaged', () => {
            health.takeDamage(30, 'enemy_1');
            expect(health.getCurrentHealth()).to.equal(70);
        });

        it('should emit ENTITY_DAMAGED event', () => {
            let emitted = false;
            let capturedDamage = 0;
            let capturedHealth = 0;

            EventBus.on('ENTITY_DAMAGED', (_id: string, damage: number, currentHealth: number) => {
                emitted = true;
                capturedDamage = damage;
                capturedHealth = currentHealth;
            });

            health.takeDamage(25, 'enemy_1');

            expect(emitted).to.be.true;
            expect(capturedDamage).to.equal(25);
            expect(capturedHealth).to.equal(75);
        });

        it('should not go below zero health', () => {
            health.takeDamage(150, 'enemy_1');
            expect(health.getCurrentHealth()).to.equal(0);
        });

        it('should die when health reaches zero', () => {
            health.takeDamage(100, 'enemy_1');
            
            expect(health.isDead()).to.be.true;
            expect(health.isAlive()).to.be.false;
        });

        it('should emit ENTITY_DIED event on death', () => {
            let died = false;
            let killerId = '';

            EventBus.on('ENTITY_DIED', (_entityId: string, attackerId: string) => {
                died = true;
                killerId = attackerId;
            });

            health.takeDamage(100, 'boss_1');

            expect(died).to.be.true;
            expect(killerId).to.equal('boss_1');
        });

        it('should track time since last damage', () => {
            health.takeDamage(10, 'enemy_1');
            const timeSinceDamage1 = health.getTimeSinceLastDamage();
            expect(timeSinceDamage1).to.equal(0); // Should reset to 0

            // Simulate time passing
            health.update(1000); // 1 second
            const timeSinceDamage2 = health.getTimeSinceLastDamage();
            expect(timeSinceDamage2).to.equal(1000);
        });

        it('should not take damage when already dead', () => {
            health.takeDamage(100, 'enemy_1');
            
            const healthAfterDeath = health.getCurrentHealth();
            health.takeDamage(50, 'enemy_2');

            expect(health.getCurrentHealth()).to.equal(healthAfterDeath);
        });

        it('should handle zero damage', () => {
            health.takeDamage(0, 'enemy_1');
            expect(health.getCurrentHealth()).to.equal(100);
        });

        it('should handle negative damage (treated as zero)', () => {
            health.takeDamage(-10, 'enemy_1');
            expect(health.getCurrentHealth()).to.equal(100);
        });
    });

    describe('Healing', () => {
        it('should restore health when healed', () => {
            health.takeDamage(40, 'enemy_1');
            health.heal(20);

            expect(health.getCurrentHealth()).to.equal(80);
        });

        it('should emit ENTITY_HEALED event', () => {
            let healed = false;
            let capturedAmount = 0;

            EventBus.on('ENTITY_HEALED', (_id: string, amount: number) => {
                healed = true;
                capturedAmount = amount;
            });

            health.takeDamage(30, 'enemy_1');
            health.heal(15);

            expect(healed).to.be.true;
            expect(capturedAmount).to.equal(15);
        });

        it('should not exceed max health', () => {
            health.takeDamage(20, 'enemy_1');
            health.heal(50);

            expect(health.getCurrentHealth()).to.equal(100);
        });

        it('should not heal when already at max health', () => {
            let healedEmitted = false;
            EventBus.on('ENTITY_HEALED', () => healedEmitted = true);

            health.heal(10);

            expect(health.getCurrentHealth()).to.equal(100);
            expect(healedEmitted).to.be.false;
        });

        it('should not heal when dead', () => {
            health.takeDamage(100, 'enemy_1');
            health.heal(50);

            expect(health.getCurrentHealth()).to.equal(0);
            expect(health.isDead()).to.be.true;
        });

        it('should handle zero heal', () => {
            health.takeDamage(30, 'enemy_1');
            health.heal(0);

            expect(health.getCurrentHealth()).to.equal(70);
        });
    });

    describe('Health Regeneration', () => {
        it('should regenerate health over time', () => {
            health.takeDamage(50, 'enemy_1');
            expect(health.getCurrentHealth()).to.equal(50);

            // Wait for regen delay (3 seconds) + 2 seconds of regen
            // Regen: 0.5 health/sec * 2 seconds = 1 health
            health.update(5000);

            expect(health.getCurrentHealth()).to.equal(51);
        });

        it('should not regenerate when at max health', () => {
            health.update(5000);
            expect(health.getCurrentHealth()).to.equal(100);
        });

        it('should not regenerate when dead', () => {
            health.takeDamage(100, 'enemy_1');
            health.update(5000);

            expect(health.getCurrentHealth()).to.equal(0);
        });

        it('should not regenerate immediately after taking damage', () => {
            health.takeDamage(30, 'enemy_1');
            
            // Regen delay typically prevents immediate regen
            health.update(100);

            // Should still be 70 or very close (depending on regen delay config)
            expect(health.getCurrentHealth()).to.be.lessThan(72);
        });

        it('should respect zero regen rate', () => {
            const noRegen = new HealthComponent(100, 0);
            const obj = new GameObject('test', 0, 0);
            obj.addComponent('health', noRegen);

            noRegen.takeDamage(50, 'enemy_1');
            noRegen.update(10000);

            expect(noRegen.getCurrentHealth()).to.equal(50);
            obj.destroy();
        });
    });

    describe('Health Queries', () => {
        it('should calculate health percentage correctly', () => {
            expect(health.getHealthPercent()).to.equal(1.0);

            health.takeDamage(25, 'enemy_1');
            expect(health.getHealthPercent()).to.equal(0.75);

            health.takeDamage(25, 'enemy_1');
            expect(health.getHealthPercent()).to.equal(0.5);

            health.takeDamage(50, 'enemy_1');
            expect(health.getHealthPercent()).to.equal(0);
        });

        it('should return zero percent when dead', () => {
            health.takeDamage(100, 'enemy_1');
            expect(health.getHealthPercent()).to.equal(0);
        });

        it('should check if low health', () => {
            expect(health.isLowHealth(0.3)).to.be.false;

            health.takeDamage(80, 'enemy_1');
            expect(health.isLowHealth(0.3)).to.be.true;
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const obj = new GameObject('test', 0, 0);
            const hp = new HealthComponent(50, 0);
            
            obj.addComponent('health', hp);
            
            expect(hp.owner).to.equal(obj);
            obj.destroy();
        });

        it('should detach from owner', () => {
            const obj = new GameObject('test', 0, 0);
            const hp = new HealthComponent(50, 0);
            
            obj.addComponent('health', hp);
            obj.removeComponent('health');
            
            expect(hp.owner).to.be.undefined;
            obj.destroy();
        });

        it('should update during game loop', () => {
            health.takeDamage(20, 'enemy_1');
            const before = health.getCurrentHealth();
            
            health.update(1000);
            
            // With regen, should be higher than before
            expect(health.getCurrentHealth()).to.be.at.least(before);
        });
    });

    describe('Edge Cases', () => {
        it('should handle multiple rapid damage events', () => {
            health.takeDamage(10, 'enemy_1');
            health.takeDamage(10, 'enemy_2');
            health.takeDamage(10, 'enemy_3');

            expect(health.getCurrentHealth()).to.equal(70);
        });

        it('should handle exact lethal damage', () => {
            health.takeDamage(100, 'enemy_1');
            
            expect(health.getCurrentHealth()).to.equal(0);
            expect(health.isDead()).to.be.true;
        });

        it('should handle overkill damage', () => {
            health.takeDamage(200, 'enemy_1');
            
            expect(health.getCurrentHealth()).to.equal(0);
            expect(health.isDead()).to.be.true;
        });

        it('should handle resurrection (heal after death)', () => {
            health.takeDamage(100, 'enemy_1');
            expect(health.isDead()).to.be.true;

            // Can't heal when dead
            health.heal(50);
            expect(health.getCurrentHealth()).to.equal(0);
            expect(health.isDead()).to.be.true;
        });
    });
});
