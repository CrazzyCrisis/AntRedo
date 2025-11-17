/**
 * Tests for Entity Configuration (CONFIG)
 * Validates all entity stats and configuration values
 */

import { expect } from 'chai';
import {
    ENTITY_CONFIG,
    AntJobType,
    QueenPowerType,
    ResourceType,
    BuildingType
} from '../../src/config/gameplay/entityConfig';

describe('Entity Configuration', () => {
    describe('Ant Configuration', () => {
        it('should have stats for all job types', () => {
            const jobTypes: AntJobType[] = ['gatherer', 'builder', 'warrior', 'scout'];
            
            jobTypes.forEach(job => {
                expect(ENTITY_CONFIG.ANT.JOBS[job]).to.exist;
                expect(ENTITY_CONFIG.ANT.JOBS[job].health).to.be.a('number');
                expect(ENTITY_CONFIG.ANT.JOBS[job].speed).to.be.a('number');
                expect(ENTITY_CONFIG.ANT.JOBS[job].visionRange).to.be.a('number');
            });
        });

        it('should have valid priority arrays for each job', () => {
            const jobTypes: AntJobType[] = ['gatherer', 'builder', 'warrior', 'scout'];
            
            jobTypes.forEach(job => {
                const priorities = ENTITY_CONFIG.ANT.JOB_PRIORITIES[job];
                expect(priorities).to.be.an('array');
                expect(priorities.length).to.be.greaterThan(0);
                // Queen command should always be first
                expect(priorities[0]).to.equal('queenCommand');
            });
        });

        it('should have hunger system stats', () => {
            expect(ENTITY_CONFIG.ANT.HUNGER.MAX).to.be.a('number');
            expect(ENTITY_CONFIG.ANT.HUNGER.DEPLETION_RATE).to.be.a('number');
            expect(ENTITY_CONFIG.ANT.HUNGER.DEATH_THRESHOLD).to.be.a('number');
            expect(ENTITY_CONFIG.ANT.HUNGER.CRITICAL_THRESHOLD).to.be.a('number');
        });

        it('should have positive stat values', () => {
            const jobTypes: AntJobType[] = ['gatherer', 'builder', 'warrior', 'scout'];
            
            jobTypes.forEach(job => {
                const stats = ENTITY_CONFIG.ANT.JOBS[job];
                expect(stats.health).to.be.greaterThan(0);
                expect(stats.speed).to.be.greaterThan(0);
                expect(stats.visionRange).to.be.greaterThan(0);
            });
        });
    });

    describe('Queen Configuration', () => {
        it('should have base stats', () => {
            expect(ENTITY_CONFIG.QUEEN.health).to.be.a('number').greaterThan(0);
            expect(ENTITY_CONFIG.QUEEN.speed).to.be.a('number').greaterThan(0);
            expect(ENTITY_CONFIG.QUEEN.commandRadius).to.be.a('number').greaterThan(0);
        });

        it('should have all 5 power types configured', () => {
            const powers: QueenPowerType[] = ['lightning', 'fireball', 'blackhole', 'tidalwave', 'finalFlash'];
            
            powers.forEach(power => {
                expect(ENTITY_CONFIG.QUEEN.POWERS[power]).to.exist;
                expect(ENTITY_CONFIG.QUEEN.POWERS[power].cooldown).to.be.a('number');
                expect(ENTITY_CONFIG.QUEEN.POWERS[power].levels).to.be.an('array');
                expect(ENTITY_CONFIG.QUEEN.POWERS[power].levels.length).to.equal(3);
            });
        });

        it('should have scaling stats for power levels', () => {
            const powers: QueenPowerType[] = ['lightning', 'fireball', 'blackhole', 'tidalwave', 'finalFlash'];
            
            powers.forEach(power => {
                const levels = ENTITY_CONFIG.QUEEN.POWERS[power].levels;
                levels.forEach((level, index) => {
                    expect(level.damage).to.be.a('number');
                    if (index > 0) {
                        // Higher levels should have more damage
                        expect(level.damage).to.be.greaterThan(levels[index - 1].damage);
                    }
                });
            });
        });

        it('should have keybind assignments', () => {
            expect(ENTITY_CONFIG.QUEEN.KEYBINDS.lightning).to.be.a('string');
            expect(ENTITY_CONFIG.QUEEN.KEYBINDS.fireball).to.be.a('string');
            expect(ENTITY_CONFIG.QUEEN.KEYBINDS.blackhole).to.be.a('string');
            expect(ENTITY_CONFIG.QUEEN.KEYBINDS.tidalwave).to.be.a('string');
            expect(ENTITY_CONFIG.QUEEN.KEYBINDS.finalFlash).to.be.a('string');
        });
    });

    describe('Boss Configuration', () => {
        it('should have combat stats', () => {
            expect(ENTITY_CONFIG.BOSS.health).to.be.a('number').greaterThan(0);
            expect(ENTITY_CONFIG.BOSS.speed).to.be.a('number').greaterThan(0);
            expect(ENTITY_CONFIG.BOSS.attackDamage).to.be.a('number').greaterThan(0);
        });

        it('should have vision cone settings', () => {
            expect(ENTITY_CONFIG.BOSS.VISION.coneAngle).to.be.a('number');
            expect(ENTITY_CONFIG.BOSS.VISION.coneDistance).to.be.a('number');
            expect(ENTITY_CONFIG.BOSS.VISION.coneAngle).to.be.greaterThan(0);
            expect(ENTITY_CONFIG.BOSS.VISION.coneAngle).to.be.lessThan(360);
        });

        it('should have projectile configurations', () => {
            expect(ENTITY_CONFIG.BOSS.PROJECTILE.speed).to.be.a('number').greaterThan(0);
            expect(ENTITY_CONFIG.BOSS.PROJECTILE.damage).to.be.a('number').greaterThan(0);
            expect(ENTITY_CONFIG.BOSS.PROJECTILE.HOMING.turnSpeed).to.be.a('number');
            expect(ENTITY_CONFIG.BOSS.PROJECTILE.HOMING.homingRange).to.be.a('number');
        });
    });

    describe('Resource Configuration', () => {
        it('should have all 4 resource types', () => {
            const resources: ResourceType[] = ['food', 'wood', 'stone', 'magicCrystal'];
            
            resources.forEach(resource => {
                expect(ENTITY_CONFIG.RESOURCES[resource]).to.exist;
                expect(ENTITY_CONFIG.RESOURCES[resource].stackAmount).to.be.a('number');
                expect(ENTITY_CONFIG.RESOURCES[resource].collisionSize).to.be.a('number');
            });
        });

        it('should have positive values', () => {
            const resources: ResourceType[] = ['food', 'wood', 'stone', 'magicCrystal'];
            
            resources.forEach(resource => {
                expect(ENTITY_CONFIG.RESOURCES[resource].stackAmount).to.be.greaterThan(0);
                expect(ENTITY_CONFIG.RESOURCES[resource].collisionSize).to.be.greaterThan(0);
            });
        });

        it('should have smell ranges for gathering', () => {
            const resources: ResourceType[] = ['food', 'wood', 'stone', 'magicCrystal'];
            
            resources.forEach(resource => {
                expect(ENTITY_CONFIG.RESOURCES[resource].smellRange).to.be.a('number').greaterThan(0);
            });
        });
    });

    describe('Building Configuration', () => {
        it('should have all building types', () => {
            const buildings: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildings.forEach(building => {
                expect(ENTITY_CONFIG.BUILDINGS[building]).to.exist;
            });
        });

        it('should have variable building sizes', () => {
            const buildings: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildings.forEach(building => {
                const size = ENTITY_CONFIG.BUILDINGS[building].size;
                expect(size.width).to.be.a('number').greaterThan(0);
                expect(size.height).to.be.a('number').greaterThan(0);
            });
        });

        it('should have construction costs', () => {
            const buildings: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildings.forEach(building => {
                const costs = ENTITY_CONFIG.BUILDINGS[building].costs;
                expect(costs.wood).to.be.a('number');
                expect(costs.stone).to.be.a('number');
            });
        });

        it('should have 3 levels with stat boosts', () => {
            const buildings: BuildingType[] = ['warehouse', 'barracks', 'tower'];
            
            buildings.forEach(building => {
                const levels = ENTITY_CONFIG.BUILDINGS[building].levels;
                expect(levels).to.be.an('array');
                expect(levels.length).to.equal(3);
                
                levels.forEach((level, index) => {
                    expect(level.health).to.be.a('number').greaterThan(0);
                    if (index > 0) {
                        // Higher levels should have more health
                        expect(level.health).to.be.greaterThan(levels[index - 1].health);
                    }
                });
            });
        });
    });

    describe('Configuration Relationships', () => {
        it('should have warrior ants deal more damage than gatherers', () => {
            const warrior = ENTITY_CONFIG.ANT.JOBS.warrior;
            const gatherer = ENTITY_CONFIG.ANT.JOBS.gatherer;
            
            expect(warrior.attackDamage).to.be.greaterThan(gatherer.attackDamage || 0);
        });

        it('should have scout ants move faster than others', () => {
            const scout = ENTITY_CONFIG.ANT.JOBS.scout;
            const gatherer = ENTITY_CONFIG.ANT.JOBS.gatherer;
            const builder = ENTITY_CONFIG.ANT.JOBS.builder;
            
            expect(scout.speed).to.be.greaterThan(gatherer.speed);
            expect(scout.speed).to.be.greaterThan(builder.speed);
        });

        it('should have magic crystals be the rarest resource', () => {
            const magicCrystal = ENTITY_CONFIG.RESOURCES.magicCrystal;
            const food = ENTITY_CONFIG.RESOURCES.food;
            
            // Magic crystals should have smaller stack amounts (rarity indicator)
            expect(magicCrystal.stackAmount).to.be.lessThanOrEqual(food.stackAmount);
        });
    });
});
