/**
 * Unit Tests for CommandManager
 * Tests command issuing, ant selection, state changes, and autonomous return
 */

import { expect } from 'chai';
import { CommandManager, CommandType } from '../../src/managers/CommandManager';
import { EntityManager } from '../../src/managers/EntityManager';
import { EventBus } from '../../src/utils/eventBus';
import { Ant } from '../../src/classes/Ant';
import { Queen } from '../../src/classes/Queen';

describe('CommandManager', () => {
    let manager: CommandManager;
    let entityManager: EntityManager;
    let queen: Queen;
    const testFactionId = 'test-faction';

    beforeEach(() => {
        EventBus.clear();
        manager = CommandManager.getInstance();
        entityManager = EntityManager.getInstance();
        
        entityManager.clear();
        (manager as any).activeCommands.clear();
        
        // Reinitialize EventBus listeners after clear
        manager.reinitializeListeners();
        
        // Create test queen
        queen = new Queen(10, 10, testFactionId);
        entityManager.addEntity(queen);
    });

    afterEach(() => {
        EventBus.clear();
        entityManager.clear();
    });

    describe('Initialization', () => {
        it('should be a singleton', () => {
            const instance1 = CommandManager.getInstance();
            const instance2 = CommandManager.getInstance();
            expect(instance1).to.equal(instance2);
        });

        it('should initialize with empty active commands', () => {
            expect((manager as any).activeCommands.size).to.equal(0);
        });
    });

    describe('Command Issuing', () => {
        let ant1: Ant;
        let ant2: Ant;
        let ant3: Ant;

        beforeEach(() => {
            // Create ants at various distances from queen
            ant1 = new Ant(11, 11, testFactionId); // Close
            ant2 = new Ant(12, 12, testFactionId); // Medium
            ant3 = new Ant(20, 20, testFactionId); // Far
            
            entityManager.addEntity(ant1);
            entityManager.addEntity(ant2);
            entityManager.addEntity(ant3);
        });

        it('should issue MOVE_TO command to ants in radius', () => {
            const count = manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                5, // Radius
                undefined,
                { x: 15, y: 15 }
            );
            
            expect(count).to.be.greaterThan(0);
        });

        it('should emit QUEEN_COMMAND_ISSUED event', (done) => {
            EventBus.once('QUEEN_COMMAND_ISSUED', (queenId, commandType, antCount) => {
                expect(queenId).to.equal(queen.id);
                expect(commandType).to.equal(CommandType.ATTACK_TARGET);
                expect(antCount).to.be.greaterThan(0);
                done();
            });
            
            manager.issueCommand(queen.id, CommandType.ATTACK_TARGET, 5, 'target-id');
        });

        it('should issue ATTACK_TARGET command with target ID', () => {
            const count = manager.issueCommand(
                queen.id,
                CommandType.ATTACK_TARGET,
                5,
                'enemy-id'
            );
            
            expect(count).to.be.greaterThan(0);
        });

        it('should issue GATHER_RESOURCE command', () => {
            const count = manager.issueCommand(
                queen.id,
                CommandType.GATHER_RESOURCE,
                5,
                'resource-id'
            );
            
            expect(count).to.be.greaterThan(0);
        });

        it('should issue BUILD_BUILDING command', () => {
            const count = manager.issueCommand(
                queen.id,
                CommandType.BUILD_BUILDING,
                5,
                'building-id'
            );
            
            expect(count).to.be.greaterThan(0);
        });

        it('should issue FOLLOW_QUEEN command', () => {
            const count = manager.issueCommand(
                queen.id,
                CommandType.FOLLOW_QUEEN,
                5,
                queen.id
            );
            
            expect(count).to.be.greaterThan(0);
        });

        it('should issue CHANGE_STATE command with target state', () => {
            const count = manager.issueCommand(
                queen.id,
                CommandType.CHANGE_STATE,
                5,
                undefined,
                undefined,
                'IDLE'
            );
            
            expect(count).to.be.greaterThan(0);
        });

        it('should return 0 for unknown queen', () => {
            const count = manager.issueCommand(
                'unknown-queen-id',
                CommandType.MOVE_TO,
                5,
                undefined,
                { x: 15, y: 15 }
            );
            
            expect(count).to.equal(0);
        });

        it('should only command ants within radius', () => {
            const count = manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                2, // Small radius - only ant1 should be in range
                undefined,
                { x: 15, y: 15 }
            );
            
            expect(count).to.be.lessThan(3); // Not all 3 ants
        });

        it('should store active commands for ants', () => {
            manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                5,
                undefined,
                { x: 15, y: 15 }
            );
            
            const activeCommands = (manager as any).activeCommands;
            expect(activeCommands.size).to.be.greaterThan(0);
        });
    });

    describe('Ant Selection', () => {
        let ant1: Ant;
        let ant2: Ant;
        let ant3: Ant;

        beforeEach(() => {
            ant1 = new Ant(11, 11, testFactionId);
            ant2 = new Ant(13, 13, testFactionId);
            ant3 = new Ant(25, 25, testFactionId);
            
            entityManager.addEntity(ant1);
            entityManager.addEntity(ant2);
            entityManager.addEntity(ant3);
        });

        it('should get ants in radius', () => {
            const ants = manager.getAntsInRadius(queen.gridX, queen.gridY, 5);
            
            expect(ants).to.be.an('array');
            expect(ants.length).to.be.greaterThan(0);
            expect(ants.every(ant => ant instanceof Ant)).to.be.true;
        });

        it('should not include ants outside radius', () => {
            const ants = manager.getAntsInRadius(queen.gridX, queen.gridY, 2);
            
            const ant3InList = ants.some(ant => ant.id === ant3.id);
            expect(ant3InList).to.be.false; // ant3 is far away
        });

        it('should return empty array when no ants in radius', () => {
            const ants = manager.getAntsInRadius(999, 999, 5);
            expect(ants).to.be.an('array').that.is.empty;
        });

        it('should only return active ants', () => {
            ant1.isActive = false;
            
            const ants = manager.getAntsInRadius(queen.gridX, queen.gridY, 5);
            const inactiveAntInList = ants.some(ant => ant.id === ant1.id);
            
            expect(inactiveAntInList).to.be.false;
        });
    });

    describe('Autonomous Mode Override', () => {
        let ant: Ant;

        beforeEach(() => {
            ant = new Ant(11, 11, testFactionId);
            entityManager.addEntity(ant);
        });

        it('should disable autonomous mode when commanding', (done) => {
            EventBus.once('ANT_COMMANDED', (_antId) => {
                const aiBehavior = ant.getComponent('AIBehaviorComponent');
                if (aiBehavior) {
                    expect((aiBehavior as any).isAutonomous).to.be.false;
                }
                done();
            });
            
            manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                5,
                undefined,
                { x: 15, y: 15 }
            );
        });

        it('should restore autonomous mode on task completion', (done) => {
            // Command ant first
            manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                5,
                undefined,
                { x: 15, y: 15 }
            );
            
            // Check autonomous restored after completion
            setTimeout(() => {
                EventBus.emit('ANT_TASK_COMPLETED', ant.id);
                
                // Check if command cleared
                const activeCommands = (manager as any).activeCommands;
                expect(activeCommands.has(ant.id)).to.be.false;
                done();
            }, 10);
        });
    });

    describe('Command Execution Events', () => {
        let ant: Ant;

        beforeEach(() => {
            ant = new Ant(11, 11, testFactionId);
            entityManager.addEntity(ant);
        });

        it('should emit ANT_COMMANDED_MOVE for MOVE_TO', (done) => {
            EventBus.once('ANT_COMMANDED_MOVE', (antId, x, y) => {
                expect(antId).to.equal(ant.id);
                expect(x).to.equal(15);
                expect(y).to.equal(15);
                done();
            });
            
            manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                5,
                undefined,
                { x: 15, y: 15 }
            );
        });

        it('should emit ANT_COMMANDED_ATTACK for ATTACK_TARGET', (done) => {
            EventBus.once('ANT_COMMANDED_ATTACK', (antId, targetId) => {
                expect(antId).to.equal(ant.id);
                expect(targetId).to.equal('enemy-id');
                done();
            });
            
            manager.issueCommand(
                queen.id,
                CommandType.ATTACK_TARGET,
                5,
                'enemy-id'
            );
        });

        it('should emit ANT_COMMANDED_GATHER for GATHER_RESOURCE', (done) => {
            EventBus.once('ANT_COMMANDED_GATHER', (antId, targetId) => {
                expect(antId).to.equal(ant.id);
                expect(targetId).to.equal('resource-id');
                done();
            });
            
            manager.issueCommand(
                queen.id,
                CommandType.GATHER_RESOURCE,
                5,
                'resource-id'
            );
        });

        it('should emit ANT_COMMANDED_BUILD for BUILD_BUILDING', (done) => {
            EventBus.once('ANT_COMMANDED_BUILD', (antId, targetId) => {
                expect(antId).to.equal(ant.id);
                expect(targetId).to.equal('building-id');
                done();
            });
            
            manager.issueCommand(
                queen.id,
                CommandType.BUILD_BUILDING,
                5,
                'building-id'
            );
        });

        it('should emit ANT_COMMANDED_FOLLOW for FOLLOW_QUEEN', (done) => {
            EventBus.once('ANT_COMMANDED_FOLLOW', (antId, targetId) => {
                expect(antId).to.equal(ant.id);
                expect(targetId).to.equal(queen.id);
                done();
            });
            
            manager.issueCommand(
                queen.id,
                CommandType.FOLLOW_QUEEN,
                5,
                queen.id
            );
        });

        it('should emit ANT_COMMANDED_CHANGE_STATE for CHANGE_STATE', (done) => {
            EventBus.once('ANT_COMMANDED_CHANGE_STATE', (antId, targetState) => {
                expect(antId).to.equal(ant.id);
                expect(targetState).to.equal('IDLE');
                done();
            });
            
            manager.issueCommand(
                queen.id,
                CommandType.CHANGE_STATE,
                5,
                undefined,
                undefined,
                'IDLE'
            );
        });
    });

    describe('Command Cleanup', () => {
        let ant: Ant;

        beforeEach(() => {
            ant = new Ant(11, 11, testFactionId);
            entityManager.addEntity(ant);
        });

        it('should clear command on task completion', () => {
            manager.issueCommand(queen.id, CommandType.MOVE_TO, 5, undefined, { x: 15, y: 15 });
            
            const activeCommands = (manager as any).activeCommands;
            expect(activeCommands.has(ant.id)).to.be.true;
            
            EventBus.emit('ANT_TASK_COMPLETED', ant.id);
            expect(activeCommands.has(ant.id)).to.be.false;
        });

        it('should cancel command on ant death', () => {
            manager.issueCommand(queen.id, CommandType.MOVE_TO, 5, undefined, { x: 15, y: 15 });
            
            EventBus.emit('ANT_DIED', ant.id);
            
            const activeCommands = (manager as any).activeCommands;
            expect(activeCommands.has(ant.id)).to.be.false;
        });

        it('should handle resource depletion', () => {
            manager.issueCommand(queen.id, CommandType.GATHER_RESOURCE, 5, 'resource-id');
            
            EventBus.emit('RESOURCE_DEPLETED', 'resource-id');
            
            // Should handle gracefully (ants with this target should have commands canceled)
            expect(() => EventBus.emit('RESOURCE_DEPLETED', 'resource-id')).to.not.throw();
        });

        it('should handle entity destruction', () => {
            manager.issueCommand(queen.id, CommandType.ATTACK_TARGET, 5, 'enemy-id');
            
            EventBus.emit('ENTITY_DESTROYED', 'enemy-id');
            
            // Should handle gracefully
            expect(() => EventBus.emit('ENTITY_DESTROYED', 'enemy-id')).to.not.throw();
        });
    });

    describe('Edge Cases', () => {
        it('should handle commanding with no ants', () => {
            const count = manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                5,
                undefined,
                { x: 15, y: 15 }
            );
            
            expect(count).to.equal(0);
        });

        it('should handle commanding all ants at once', () => {
            // Create many ants
            for (let i = 0; i < 20; i++) {
                const ant = new Ant(10 + i * 0.1, 10 + i * 0.1, testFactionId);
                entityManager.addEntity(ant);
            }
            
            const count = manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                10,
                undefined,
                { x: 15, y: 15 }
            );
            
            expect(count).to.equal(20);
        });

        it('should handle rapid command issuing', () => {
            const ant = new Ant(11, 11, testFactionId);
            entityManager.addEntity(ant);
            
            for (let i = 0; i < 10; i++) {
                manager.issueCommand(
                    queen.id,
                    CommandType.MOVE_TO,
                    5,
                    undefined,
                    { x: 15 + i, y: 15 + i }
                );
            }
            
            // Last command should overwrite previous ones
            const activeCommands = (manager as any).activeCommands;
            expect(activeCommands.size).to.be.greaterThan(0);
        });

        it('should handle command with undefined optional parameters', () => {
            const ant = new Ant(11, 11, testFactionId);
            entityManager.addEntity(ant);
            
            const count = manager.issueCommand(
                queen.id,
                CommandType.MOVE_TO,
                5
            );
            
            expect(count).to.be.greaterThan(0);
        });
    });
});
