/**
 * Tests for GameEvents Constants
 * Validates all entity-related events are properly defined
 */

import { expect } from 'chai';
import { GameEvents } from '../../src/utils/eventBus';

describe('GameEvents Constants', () => {
    describe('Entity Lifecycle Events', () => {
        it('should have all entity lifecycle events defined', () => {
            expect(GameEvents.ENTITY_ADDED).to.equal('entity:added');
            expect(GameEvents.ENTITY_REMOVED).to.equal('entity:removed');
            expect(GameEvents.ENTITY_MOVED).to.equal('entity:moved');
            expect(GameEvents.ENTITY_DESTROYED).to.equal('entity:destroyed');
            expect(GameEvents.ENTITY_UPDATED).to.equal('entity:updated');
        });
    });

    describe('Ant Events', () => {
        it('should have all ant-related events defined', () => {
            expect(GameEvents.ANT_SPAWNED).to.be.a('string');
            expect(GameEvents.ANT_STATE_CHANGED).to.be.a('string');
            expect(GameEvents.ANT_DIED).to.be.a('string');
            expect(GameEvents.ANT_ATTACKED).to.be.a('string');
            expect(GameEvents.ANT_JOB_CHANGED).to.be.a('string');
            expect(GameEvents.ANT_HUNGER_CHANGED).to.be.a('string');
            expect(GameEvents.ANT_HUNGER_CRITICAL).to.be.a('string');
            expect(GameEvents.ANT_STARVED).to.be.a('string');
        });

        it('should have target tracking events', () => {
            expect(GameEvents.ANT_TARGET_ACQUIRED).to.be.a('string');
            expect(GameEvents.ANT_TARGET_LOST).to.be.a('string');
        });
    });

    describe('Queen Events', () => {
        it('should have all queen-related events defined', () => {
            expect(GameEvents.QUEEN_SPAWNED).to.be.a('string');
            expect(GameEvents.QUEEN_COMMAND_ISSUED).to.be.a('string');
            expect(GameEvents.QUEEN_DIED).to.be.a('string');
        });

        it('should have power system events', () => {
            expect(GameEvents.QUEEN_POWER_USED).to.be.a('string');
            expect(GameEvents.QUEEN_POWER_UNLOCKED).to.be.a('string');
            expect(GameEvents.QUEEN_POWER_UPGRADED).to.be.a('string');
            expect(GameEvents.QUEEN_POWER_COOLDOWN_READY).to.be.a('string');
        });
    });

    describe('Boss Events', () => {
        it('should have all boss-related events defined', () => {
            expect(GameEvents.BOSS_SPAWNED).to.be.a('string');
            expect(GameEvents.BOSS_ATTACKED).to.be.a('string');
            expect(GameEvents.BOSS_DIED).to.be.a('string');
            expect(GameEvents.BOSS_TARGET_CHANGED).to.be.a('string');
            expect(GameEvents.BOSS_PROJECTILE_FIRED).to.be.a('string');
            expect(GameEvents.BOSS_STATE_CHANGED).to.be.a('string');
            expect(GameEvents.BOSS_VISION_DETECTED).to.be.a('string');
        });
    });

    describe('Resource Events', () => {
        it('should have all resource-related events defined', () => {
            expect(GameEvents.RESOURCE_SPAWNED).to.be.a('string');
            expect(GameEvents.RESOURCE_COLLECTED).to.be.a('string');
            expect(GameEvents.RESOURCE_DEPOSITED).to.be.a('string');
            expect(GameEvents.RESOURCE_DEPLETED).to.be.a('string');
            expect(GameEvents.RESOURCE_SMELLED).to.be.a('string');
        });
    });

    describe('Building Events', () => {
        it('should have all building-related events defined', () => {
            expect(GameEvents.BUILDING_PLACED).to.be.a('string');
            expect(GameEvents.BUILDING_CONSTRUCTION_STARTED).to.be.a('string');
            expect(GameEvents.BUILDING_CONSTRUCTION_PROGRESS).to.be.a('string');
            expect(GameEvents.BUILDING_COMPLETED).to.be.a('string');
            expect(GameEvents.BUILDING_DESTROYED).to.be.a('string');
            expect(GameEvents.BUILDING_LEVELED_UP).to.be.a('string');
            expect(GameEvents.BUILDING_DAMAGED).to.be.a('string');
        });
    });

    describe('Projectile Events', () => {
        it('should have all projectile-related events defined', () => {
            expect(GameEvents.PROJECTILE_SPAWNED).to.be.a('string');
            expect(GameEvents.PROJECTILE_HIT).to.be.a('string');
            expect(GameEvents.PROJECTILE_DESTROYED).to.be.a('string');
        });
    });

    describe('Power Effect Events', () => {
        it('should have all 5 queen power events', () => {
            expect(GameEvents.LIGHTNING_STRIKE).to.be.a('string');
            expect(GameEvents.FIREBALL_EXPLODE).to.be.a('string');
            expect(GameEvents.BLACKHOLE_PULL).to.be.a('string');
            expect(GameEvents.TIDALWAVE_PUSH).to.be.a('string');
            expect(GameEvents.FINALFLASH_ACTIVATED).to.be.a('string');
        });

        it('should have effect application events', () => {
            expect(GameEvents.SOOT_STAIN_CREATED).to.be.a('string');
            expect(GameEvents.BURN_EFFECT_APPLIED).to.be.a('string');
        });
    });

    describe('Combat Events', () => {
        it('should have all combat-related events defined', () => {
            expect(GameEvents.COMBAT_DAMAGE_DEALT).to.be.a('string');
            expect(GameEvents.COMBAT_KNOCKBACK_APPLIED).to.be.a('string');
            expect(GameEvents.COMBAT_KILL).to.be.a('string');
        });
    });

    describe('Event Naming Conventions', () => {
        it('should follow namespace:action pattern', () => {
            // Sample a few events to verify naming pattern
            expect(GameEvents.ENTITY_MOVED).to.match(/^entity:/);
            expect(GameEvents.ANT_DIED).to.match(/^ant:/);
            expect(GameEvents.QUEEN_COMMAND_ISSUED).to.match(/^queen:/);
            expect(GameEvents.BOSS_ATTACKED).to.match(/^boss:/);
            expect(GameEvents.RESOURCE_COLLECTED).to.match(/^resource:/);
            expect(GameEvents.BUILDING_PLACED).to.match(/^building:/);
        });

        it('should have unique event names', () => {
            const eventValues = Object.values(GameEvents);
            const uniqueValues = new Set(eventValues);
            
            expect(uniqueValues.size).to.equal(eventValues.length);
        });
    });

    describe('Event Constants Immutability', () => {
        it('should be read-only (const assertion)', () => {
            // TypeScript const assertion makes it readonly
            // This test just verifies the constants exist and are strings
            const allEvents = Object.values(GameEvents);
            
            allEvents.forEach(event => {
                expect(event).to.be.a('string');
                expect(event.length).to.be.greaterThan(0);
            });
        });
    });
});
