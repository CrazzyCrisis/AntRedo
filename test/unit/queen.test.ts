import { expect } from 'chai';
import { Queen } from '../../src/classes/Queen';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { PathfindingComponent } from '../../src/classes/components/PathfindingComponent';
import { HealthComponent } from '../../src/classes/components/HealthComponent';
import { CombatComponent } from '../../src/classes/components/CombatComponent';

describe('Queen', () => {
    let queen: Queen;

    beforeEach(() => {
        EventBus.clear();
        queen = new Queen(10, 15, 'player');
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Initialization', () => {
        it('should initialize with correct position', () => {
            expect(queen.gridX).to.equal(10);
            expect(queen.gridY).to.equal(15);
        });

        it('should initialize with faction ID', () => {
            expect(queen.getFactionId()).to.equal('player');
        });

        it('should initialize with queen type', () => {
            expect(queen.type).to.equal('queen');
        });

        it('should be player controlled by default', () => {
            expect(queen.isPlayerControlled()).to.be.true;
        });

        it('should have required components', () => {
            expect(queen.getComponent('Pathfinding')).to.exist;
            expect(queen.getComponent('Health')).to.exist;
            expect(queen.getComponent('Combat')).to.exist;
        });

        it('should have default command radius', () => {
            expect(queen.getCommandRadius()).to.be.greaterThan(0);
        });

        it('should emit CAMERA_FOLLOW_ENTITY on creation', (done) => {
            // Setup listener BEFORE creating queen
            EventBus.once(GameEvents.CAMERA_FOLLOW_ENTITY, (entityId: string) => {
                expect(entityId).to.include('queen_'); // Just verify it's a queen ID
                done();
            });

            // Create new queen to trigger event
            new Queen(0, 0, 'player');
        });
    });

    describe('Power System', () => {
        it('should have powers map', () => {
            const powers = queen.getPowers();
            expect(powers).to.be.instanceOf(Map);
        });

        it('should have no unlocked powers initially', () => {
            const powers = queen.getPowers();
            let unlockedCount = 0;
            powers.forEach(power => {
                if (power.isUnlocked) unlockedCount++;
            });
            expect(unlockedCount).to.equal(0);
        });

        it('should unlock a power', () => {
            queen.unlockPower('fireball');
            
            const power = queen.getPower('fireball');
            expect(power?.isUnlocked).to.be.true;
        });

        it('should emit QUEEN_POWER_UNLOCKED when power unlocked', (done) => {
            EventBus.once(GameEvents.QUEEN_POWER_UNLOCKED, (queenId: string, powerName: string) => {
                expect(queenId).to.equal(queen.id);
                expect(powerName).to.equal('fireball');
                done();
            });

            queen.unlockPower('fireball');
        });

        it('should upgrade a power level', () => {
            queen.unlockPower('fireball');
            queen.upgradePower('fireball');

            const power = queen.getPower('fireball');
            expect(power?.level).to.equal(2);
        });

        it('should not upgrade locked power', () => {
            queen.upgradePower('fireball');

            const power = queen.getPower('fireball');
            expect(power?.level).to.equal(1);
        });

        it('should emit QUEEN_POWER_UPGRADED when power upgraded', (done) => {
            queen.unlockPower('fireball');

            EventBus.once(GameEvents.QUEEN_POWER_UPGRADED, (queenId: string, powerName: string, level: number) => {
                expect(queenId).to.equal(queen.id);
                expect(powerName).to.equal('fireball');
                expect(level).to.equal(2);
                done();
            });

            queen.upgradePower('fireball');
        });

        it('should not upgrade beyond max level', () => {
            queen.unlockPower('fireball');
            
            // Upgrade to max
            for (let i = 1; i < 10; i++) {
                queen.upgradePower('fireball');
            }

            const power = queen.getPower('fireball');
            expect(power?.level).to.be.lessThanOrEqual(5); // Assuming max level 5
        });
    });

    describe('Power Usage', () => {
        beforeEach(() => {
            queen.unlockPower('fireball');
        });

        it('should use a power', () => {
            const result = queen.usePower('fireball', 20, 25);
            expect(result).to.be.true;
        });

        it('should not use locked power', () => {
            const result = queen.usePower('lightning');
            expect(result).to.be.false;
        });

        it('should emit QUEEN_POWER_USED when power used', (done) => {
            EventBus.once(GameEvents.QUEEN_POWER_USED, (queenId: string, powerName: string) => {
                expect(queenId).to.equal(queen.id);
                expect(powerName).to.equal('fireball');
                done();
            });

            queen.usePower('fireball', 20, 25);
        });

        it('should respect cooldown', () => {
            queen.usePower('fireball', 20, 25);
            
            // Try to use again immediately
            const result = queen.usePower('fireball', 30, 35);
            expect(result).to.be.false;
        });

        it('should allow power use after cooldown', () => {
            queen.usePower('fireball', 20, 25);

            // Simulate time passing
            const power = queen.getPower('fireball');
            if (power) {
                power.lastUsedTime = Date.now() - power.cooldown - 1000;
            }

            const result = queen.usePower('fireball', 30, 35);
            expect(result).to.be.true;
        });

        it('should accept optional target coordinates', () => {
            const result1 = queen.usePower('fireball', 20, 25);
            expect(result1).to.be.true;

            // Wait for cooldown
            const power = queen.getPower('fireball');
            if (power) {
                power.lastUsedTime = Date.now() - power.cooldown - 1000;
            }

            const result2 = queen.usePower('fireball');
            expect(result2).to.be.true;
        });
    });

    describe('Command Radius', () => {
        it('should get command radius', () => {
            const radius = queen.getCommandRadius();
            expect(radius).to.be.a('number');
            expect(radius).to.be.greaterThan(0);
        });

        it('should set command radius', () => {
            queen.setCommandRadius(20);
            expect(queen.getCommandRadius()).to.equal(20);
        });

        it('should command ants in radius', () => {
            const result = queen.commandAnts(15, 'gather');
            expect(result).to.be.a('number');
        });

        it('should emit QUEEN_COMMAND_ISSUED when commanding', (done) => {
            EventBus.once(GameEvents.QUEEN_COMMAND_ISSUED, (queenId: string, command: string, radius: number) => {
                expect(queenId).to.equal(queen.id);
                expect(command).to.equal('attack');
                expect(radius).to.equal(15);
                done();
            });

            queen.commandAnts(15, 'attack');
        });

        it('should return 0 if no ants in radius', () => {
            const count = queen.commandAnts(1, 'gather');
            expect(count).to.equal(0);
        });
    });

    describe('Player Control', () => {
        it('should be player controlled by default', () => {
            expect(queen.isPlayerControlled()).to.be.true;
        });

        it('should toggle player control', () => {
            queen.setPlayerControlled(false);
            expect(queen.isPlayerControlled()).to.be.false;

            queen.setPlayerControlled(true);
            expect(queen.isPlayerControlled()).to.be.true;
        });
    });

    describe('Interaction', () => {
        it('should have interact method', () => {
            expect(queen.interact).to.be.a('function');
        });

        it('should emit event on interact', (done) => {
            EventBus.once(GameEvents.QUEEN_INTERACTED, (queenId: string) => {
                expect(queenId).to.equal(queen.id);
                done();
            });

            queen.interact();
        });
    });

    describe('Component Integration', () => {
        it('should have pathfinding component', () => {
            const pathfinding = queen.getComponent('Pathfinding') as PathfindingComponent;
            expect(pathfinding).to.exist;
        });

        it('should have health component', () => {
            const health = queen.getComponent('Health') as HealthComponent;
            expect(health).to.exist;
            expect(health?.getCurrentHealth()).to.be.greaterThan(0);
        });

        it('should have combat component', () => {
            const combat = queen.getComponent('Combat') as CombatComponent;
            expect(combat).to.exist;
        });

        it('should take damage', () => {
            const health = queen.getComponent('Health') as HealthComponent;
            const initialHealth = health?.getCurrentHealth() || 0;

            health?.takeDamage(20, 'attacker_1');

            expect(health?.getCurrentHealth()).to.equal(initialHealth - 20);
        });
    });

    describe('Faction System', () => {
        it('should have faction ID', () => {
            expect(queen.getFactionId()).to.equal('player');
        });

        it('should detect enemy queen', () => {
            const enemyQueen = new Queen(50, 50, 'enemy');
            expect(queen.isEnemy(enemyQueen)).to.be.true;
        });

        it('should not detect ally as enemy', () => {
            const allyQueen = new Queen(50, 50, 'player');
            expect(queen.isEnemy(allyQueen)).to.be.false;
        });
    });

    describe('Update Cycle', () => {
        it('should update all components', () => {
            expect(() => queen.update(16)).to.not.throw();
        });

        it('should handle multiple updates', () => {
            for (let i = 0; i < 10; i++) {
                queen.update(16);
            }
            expect(queen.isActive).to.be.true;
        });
    });

    describe('Lifecycle', () => {
        it('should be active on creation', () => {
            expect(queen.isActive).to.be.true;
        });

        it('should destroy queen', () => {
            queen.destroy();
            expect(queen.isActive).to.be.false;
        });

        it('should emit ENTITY_DESTROYED on destroy', (done) => {
            // Listen for string literal (GameObject legacy behavior)
            EventBus.once('ENTITY_DESTROYED', (entityId: string) => {
                expect(entityId).to.equal(queen.id);
                done();
            });

            queen.destroy();
        });

        it('should emit QUEEN_DEATH on death', (done) => {
            EventBus.once(GameEvents.QUEEN_DEATH, (queenId: string, factionId: string) => {
                expect(queenId).to.equal(queen.id);
                expect(factionId).to.equal('player');
                done();
            });

            // Kill queen via health
            const health = queen.getComponent('Health') as HealthComponent;
            health?.takeDamage(9999, 'attacker_1');
        });

        it('should become inactive after death', () => {
            const health = queen.getComponent('Health') as HealthComponent;
            health?.takeDamage(9999, 'attacker_1');

            expect(queen.isActive).to.be.false;
        });
    });

    describe('Power Keybind System', () => {
        it('should listen for power keybinds', (done) => {
            queen.unlockPower('fireball');

            // Simulate keybind press
            EventBus.once(GameEvents.QUEEN_POWER_USED, () => {
                done();
            });

            // Emit keybind event (1 = first power)
            EventBus.emit(GameEvents.INPUT_KEY_PRESS, '1');
        });
    });

    describe('Edge Cases', () => {
        it('should handle invalid power name', () => {
            const result = queen.usePower('invalid_power');
            expect(result).to.be.false;
        });

        it('should handle unlock same power twice', () => {
            queen.unlockPower('fireball');
            queen.unlockPower('fireball');

            const power = queen.getPower('fireball');
            expect(power?.isUnlocked).to.be.true;
        });

        it('should handle upgrade before unlock', () => {
            queen.upgradePower('fireball');
            
            const power = queen.getPower('fireball');
            expect(power?.level).to.equal(1); // Should not upgrade
        });

        it('should handle empty command', () => {
            const count = queen.commandAnts(10, '');
            expect(count).to.equal(0);
        });

        it('should handle negative command radius', () => {
            queen.setCommandRadius(-5);
            expect(queen.getCommandRadius()).to.be.greaterThanOrEqual(0);
        });

        it('should handle very large command radius', () => {
            queen.setCommandRadius(9999);
            expect(queen.getCommandRadius()).to.equal(9999);
        });
    });

    describe('Multiple Powers', () => {
        it('should unlock multiple powers', () => {
            queen.unlockPower('fireball');
            queen.unlockPower('lightning');
            queen.unlockPower('heal');

            expect(queen.getPower('fireball')?.isUnlocked).to.be.true;
            expect(queen.getPower('lightning')?.isUnlocked).to.be.true;
            expect(queen.getPower('heal')?.isUnlocked).to.be.true;
        });

        it('should track cooldowns independently', () => {
            queen.unlockPower('fireball');
            queen.unlockPower('lightning');

            queen.usePower('fireball', 10, 10);
            queen.usePower('lightning', 20, 20);

            // Fireball should be on cooldown
            expect(queen.usePower('fireball', 10, 10)).to.be.false;
            // Lightning should be on cooldown
            expect(queen.usePower('lightning', 20, 20)).to.be.false;
        });

        it('should upgrade powers independently', () => {
            queen.unlockPower('fireball');
            queen.unlockPower('lightning');

            queen.upgradePower('fireball');
            queen.upgradePower('fireball');

            expect(queen.getPower('fireball')?.level).to.equal(3);
            expect(queen.getPower('lightning')?.level).to.equal(1);
        });
    });
});
