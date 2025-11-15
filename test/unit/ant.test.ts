/**
 * Ant Class Tests (TDD - RED phase)
 * Tests for Ant entity with all integrated components
 */

import { expect } from 'chai';
import { Ant } from '../../src/classes/Ant';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';
import { AntJobComponent } from '../../src/classes/components/AntJobComponent';
import { HealthComponent } from '../../src/classes/components/HealthComponent';
import { InventoryComponent } from '../../src/classes/components/InventoryComponent';
import { HungerComponent } from '../../src/classes/components/HungerComponent';

describe('Ant', () => {
    let ant: Ant;

    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();

        // Create ant at position (5, 5)
        ant = new Ant(5, 5, 'faction_1');
    });

    describe('Initialization', () => {
        it('should initialize with correct position', () => {
            expect(ant.gridX).to.equal(5);
            expect(ant.gridY).to.equal(5);
        });

        it('should initialize with faction ID', () => {
            expect(ant.getFactionId()).to.equal('faction_1');
        });

        it('should initialize as autonomous by default', () => {
            expect(ant.isAutonomous()).to.be.true;
        });

        it('should initialize with ant type', () => {
            expect(ant.type).to.equal('ant');
        });

        it('should have all required components', () => {
            expect(ant.getComponent('StateMachine')).to.exist;
            expect(ant.getComponent('Pathfinding')).to.exist;
            expect(ant.getComponent('Health')).to.exist;
            expect(ant.getComponent('Combat')).to.exist;
            expect(ant.getComponent('Inventory')).to.exist;
            expect(ant.getComponent('Vision')).to.exist;
            expect(ant.getComponent('AIBehavior')).to.exist;
            expect(ant.getComponent('AntJob')).to.exist;
            expect(ant.getComponent('Hunger')).to.exist;
        });

        it('should start with GATHERER job by default', () => {
            const jobComponent = ant.getComponent('AntJob') as AntJobComponent;
            expect(jobComponent?.getCurrentJob()).to.equal(AntJobComponent.JOB_GATHERER);
        });
    });

    describe('Job Management', () => {
        it('should change job', () => {
            ant.setJob(AntJobComponent.JOB_WARRIOR);
            const jobComponent = ant.getComponent('AntJob') as AntJobComponent;
            expect(jobComponent?.getCurrentJob()).to.equal(AntJobComponent.JOB_WARRIOR);
        });

        it('should emit JOB_ASSIGNED event on job change', (done) => {
            EventBus.once(GameEvents.JOB_ASSIGNED, (entityId: string, jobType: number) => {
                expect(entityId).to.equal(ant.id);
                expect(jobType).to.equal(AntJobComponent.JOB_BUILDER);
                done();
            });

            ant.setJob(AntJobComponent.JOB_BUILDER);
        });

        it('should check if ant is gatherer', () => {
            ant.setJob(AntJobComponent.JOB_GATHERER);
            expect(ant.isGatherer()).to.be.true;
            expect(ant.isBuilder()).to.be.false;
        });

        it('should check if ant is builder', () => {
            ant.setJob(AntJobComponent.JOB_BUILDER);
            expect(ant.isBuilder()).to.be.true;
            expect(ant.isWarrior()).to.be.false;
        });

        it('should check if ant is warrior', () => {
            ant.setJob(AntJobComponent.JOB_WARRIOR);
            expect(ant.isWarrior()).to.be.true;
            expect(ant.isScout()).to.be.false;
        });

        it('should check if ant is scout', () => {
            ant.setJob(AntJobComponent.JOB_SCOUT);
            expect(ant.isScout()).to.be.true;
            expect(ant.isGatherer()).to.be.false;
        });
    });

    describe('Autonomous Mode', () => {
        it('should toggle autonomous mode', () => {
            ant.setAutonomous(false);
            expect(ant.isAutonomous()).to.be.false;

            ant.setAutonomous(true);
            expect(ant.isAutonomous()).to.be.true;
        });

        it('should emit AI_STATE_CHANGED on autonomy toggle', (done) => {
            EventBus.once(GameEvents.AI_STATE_CHANGED, (entityId: string, autonomous: boolean) => {
                expect(entityId).to.equal(ant.id);
                expect(autonomous).to.be.false;
                done();
            });

            ant.setAutonomous(false);
        });
    });

    describe('Component Integration', () => {
        it('should have health component', () => {
            const health = ant.getComponent('Health') as HealthComponent;
            expect(health).to.exist;
            expect(health?.getCurrentHealth()).to.be.greaterThan(0);
        });

        it('should take damage', () => {
            const health = ant.getComponent('Health') as HealthComponent;
            const initialHealth = health?.getCurrentHealth() || 0;

            health?.takeDamage(10, 'attacker_1');

            expect(health?.getCurrentHealth()).to.equal(initialHealth - 10);
        });

        it('should have inventory component', () => {
            const inventory = ant.getComponent('Inventory') as InventoryComponent;
            expect(inventory).to.exist;
            expect(inventory?.getTotalItems()).to.equal(0);
        });

        it('should add items to inventory', () => {
            const inventory = ant.getComponent('Inventory') as InventoryComponent;
            inventory?.addItem('food', 5);
            expect(inventory?.getItemCount('food')).to.equal(5);
        });

        it('should have hunger component', () => {
            const hunger = ant.getComponent('Hunger') as HungerComponent;
            expect(hunger).to.exist;
            expect(hunger?.getHunger()).to.be.greaterThan(0);
        });

        it('should become hungry over time', () => {
            const hunger = ant.getComponent('Hunger') as HungerComponent;
            hunger?.setDecayRate(10); // Fast decay for testing

            ant.update(1000); // 1 second

            expect(hunger?.getHunger()).to.be.lessThan(hunger?.getMaxHunger() || 100);
        });
    });

    describe('Update Cycle', () => {
        it('should update all components', () => {
            const hunger = ant.getComponent('Hunger') as HungerComponent;
            const initialHunger = hunger?.getHunger() || 100;
            hunger?.setDecayRate(1);

            ant.update(1000);

            expect(hunger?.getHunger()).to.be.lessThan(initialHunger);
        });

        it('should handle multiple updates', () => {
            for (let i = 0; i < 10; i++) {
                ant.update(16); // Simulate 60 FPS
            }

            expect(ant.isActive).to.be.true;
        });
    });

    describe('Lifecycle', () => {
        it('should be active on creation', () => {
            expect(ant.isActive).to.be.true;
        });

        it('should destroy ant', () => {
            ant.destroy();
            expect(ant.isActive).to.be.false;
        });

        it('should emit ENTITY_DESTROYED on destroy', (done) => {
            EventBus.once('ENTITY_DESTROYED', (entityId: string) => {
                expect(entityId).to.equal(ant.id);
                done();
            });

            ant.destroy();
        });
    });

    describe('Faction', () => {
        it('should have faction ID', () => {
            expect(ant.getFactionId()).to.equal('faction_1');
        });

        it('should check enemy status', () => {
            const ally = new Ant(0, 0, 'faction_1');
            const enemy = new Ant(0, 0, 'faction_2');

            expect(ant.isEnemy(ally)).to.be.false;
            expect(ant.isEnemy(enemy)).to.be.true;
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid job changes', () => {
            for (let i = 0; i < 100; i++) {
                ant.setJob(i % 4);
            }

            expect(ant.isActive).to.be.true;
        });

        it('should handle autonomous toggle during update', () => {
            ant.setAutonomous(false);
            ant.update(16);
            ant.setAutonomous(true);
            ant.update(16);

            expect(ant.isActive).to.be.true;
        });

        it('should handle component access after destroy', () => {
            ant.destroy();
            // Components are detached on destroy, so they become unavailable
            expect(ant.isActive).to.be.false;
        });
    });
});
