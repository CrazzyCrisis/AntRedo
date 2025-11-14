/**
 * AntJobComponent Tests (TDD - RED phase)
 * Tests for ant job system with priorities (Gatherer, Builder, Warrior, Scout)
 */

import { expect } from 'chai';
import { AntJobComponent } from '../../src/classes/components/AntJobComponent';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';

describe('AntJobComponent', () => {
    let jobComponent: AntJobComponent;
    let owner: GameObject;

    beforeEach(() => {
        // Clear EventBus before each test
        EventBus.clear();

        // Create owner GameObject (ant)
        owner = new GameObject('ant', 5, 5);

        // Create job component with default priorities
        jobComponent = new AntJobComponent([1, 1, 1, 1]);
        jobComponent.onAttach(owner);
    });

    describe('Initialization', () => {
        it('should initialize with provided priorities', () => {
            const priorities = jobComponent.getPriorities();
            expect(priorities).to.deep.equal([1, 1, 1, 1]);
        });

        it('should initialize with no current job', () => {
            expect(jobComponent.getCurrentJob()).to.be.null;
        });

        it('should initialize with no current task', () => {
            expect(jobComponent.getCurrentTask()).to.be.null;
        });

        it('should validate priorities array length', () => {
            expect(() => new AntJobComponent([1, 2])).to.throw('Priorities array must have exactly 4 elements');
        });

        it('should validate non-negative priorities', () => {
            expect(() => new AntJobComponent([1, -1, 1, 1])).to.throw('All priorities must be non-negative');
        });
    });

    describe('Job Types', () => {
        it('should have GATHERER job type', () => {
            expect(AntJobComponent.JOB_GATHERER).to.equal(0);
        });

        it('should have BUILDER job type', () => {
            expect(AntJobComponent.JOB_BUILDER).to.equal(1);
        });

        it('should have WARRIOR job type', () => {
            expect(AntJobComponent.JOB_WARRIOR).to.equal(2);
        });

        it('should have SCOUT job type', () => {
            expect(AntJobComponent.JOB_SCOUT).to.equal(3);
        });
    });

    describe('Priority Management', () => {
        it('should get priorities', () => {
            const priorities = jobComponent.getPriorities();
            expect(priorities).to.be.an('array');
            expect(priorities.length).to.equal(4);
        });

        it('should set priorities', () => {
            jobComponent.setPriorities([2, 3, 1, 0]);
            expect(jobComponent.getPriorities()).to.deep.equal([2, 3, 1, 0]);
        });

        it('should emit JOB_PRIORITIES_CHANGED event', (done) => {
            EventBus.once(GameEvents.JOB_PRIORITIES_CHANGED, (entityId: string, priorities: number[]) => {
                expect(entityId).to.equal(owner.id);
                expect(priorities).to.deep.equal([5, 4, 3, 2]);
                done();
            });

            jobComponent.setPriorities([5, 4, 3, 2]);
        });

        it('should validate priorities on set', () => {
            expect(() => jobComponent.setPriorities([1, 2, 3])).to.throw('Priorities array must have exactly 4 elements');
        });

        it('should get priority for specific job', () => {
            jobComponent.setPriorities([10, 20, 30, 40]);
            expect(jobComponent.getPriority(AntJobComponent.JOB_GATHERER)).to.equal(10);
            expect(jobComponent.getPriority(AntJobComponent.JOB_BUILDER)).to.equal(20);
            expect(jobComponent.getPriority(AntJobComponent.JOB_WARRIOR)).to.equal(30);
            expect(jobComponent.getPriority(AntJobComponent.JOB_SCOUT)).to.equal(40);
        });

        it('should set priority for specific job', () => {
            jobComponent.setPriority(AntJobComponent.JOB_WARRIOR, 99);
            expect(jobComponent.getPriority(AntJobComponent.JOB_WARRIOR)).to.equal(99);
        });

        it('should validate job index bounds', () => {
            expect(() => jobComponent.getPriority(4)).to.throw('Job index out of bounds');
            expect(() => jobComponent.getPriority(-1)).to.throw('Job index out of bounds');
            expect(() => jobComponent.setPriority(5, 1)).to.throw('Job index out of bounds');
        });

        it('should validate priority value', () => {
            expect(() => jobComponent.setPriority(AntJobComponent.JOB_GATHERER, -1)).to.throw('Priority must be non-negative');
        });
    });

    describe('Job Assignment', () => {
        it('should assign job', () => {
            jobComponent.assignJob(AntJobComponent.JOB_GATHERER);
            expect(jobComponent.getCurrentJob()).to.equal(AntJobComponent.JOB_GATHERER);
        });

        it('should change job', () => {
            jobComponent.assignJob(AntJobComponent.JOB_GATHERER);
            jobComponent.assignJob(AntJobComponent.JOB_WARRIOR);
            expect(jobComponent.getCurrentJob()).to.equal(AntJobComponent.JOB_WARRIOR);
        });

        it('should emit JOB_ASSIGNED event', (done) => {
            EventBus.once(GameEvents.JOB_ASSIGNED, (entityId: string, jobType: number) => {
                expect(entityId).to.equal(owner.id);
                expect(jobType).to.equal(AntJobComponent.JOB_BUILDER);
                done();
            });

            jobComponent.assignJob(AntJobComponent.JOB_BUILDER);
        });

        it('should clear previous task when job changes', () => {
            jobComponent.assignJob(AntJobComponent.JOB_GATHERER);
            jobComponent.setCurrentTask('gather_food');
            
            jobComponent.assignJob(AntJobComponent.JOB_WARRIOR);
            
            expect(jobComponent.getCurrentTask()).to.be.null;
        });

        it('should validate job type on assignment', () => {
            expect(() => jobComponent.assignJob(99)).to.throw('Job index out of bounds');
        });

        it('should clear job', () => {
            jobComponent.assignJob(AntJobComponent.JOB_SCOUT);
            jobComponent.clearJob();
            expect(jobComponent.getCurrentJob()).to.be.null;
        });
    });

    describe('Task Management', () => {
        it('should set current task', () => {
            jobComponent.setCurrentTask('gather_food');
            expect(jobComponent.getCurrentTask()).to.equal('gather_food');
        });

        it('should change task', () => {
            jobComponent.setCurrentTask('build_tunnel');
            jobComponent.setCurrentTask('repair_wall');
            expect(jobComponent.getCurrentTask()).to.equal('repair_wall');
        });

        it('should clear task', () => {
            jobComponent.setCurrentTask('patrol_area');
            jobComponent.clearTask();
            expect(jobComponent.getCurrentTask()).to.be.null;
        });

        it('should emit TASK_ASSIGNED event', (done) => {
            EventBus.once(GameEvents.TASK_ASSIGNED, (entityId: string, task: string) => {
                expect(entityId).to.equal(owner.id);
                expect(task).to.equal('explore_zone');
                done();
            });

            jobComponent.setCurrentTask('explore_zone');
        });

        it('should emit TASK_COMPLETED event', (done) => {
            jobComponent.setCurrentTask('gather_food');

            EventBus.once(GameEvents.TASK_COMPLETED, (entityId: string, task: string) => {
                expect(entityId).to.equal(owner.id);
                expect(task).to.equal('gather_food');
                done();
            });

            jobComponent.completeTask();
        });

        it('should clear task on completion', () => {
            jobComponent.setCurrentTask('build_structure');
            jobComponent.completeTask();
            expect(jobComponent.getCurrentTask()).to.be.null;
        });

        it('should handle completing with no task', () => {
            jobComponent.completeTask();
            expect(jobComponent.getCurrentTask()).to.be.null;
        });
    });

    describe('Highest Priority Job', () => {
        it('should return job with highest priority', () => {
            jobComponent.setPriorities([10, 50, 30, 20]);
            expect(jobComponent.getHighestPriorityJob()).to.equal(AntJobComponent.JOB_BUILDER);
        });

        it('should return first job when tied priorities', () => {
            jobComponent.setPriorities([25, 25, 25, 25]);
            expect(jobComponent.getHighestPriorityJob()).to.equal(AntJobComponent.JOB_GATHERER);
        });

        it('should handle all zero priorities', () => {
            jobComponent.setPriorities([0, 0, 0, 0]);
            expect(jobComponent.getHighestPriorityJob()).to.equal(AntJobComponent.JOB_GATHERER);
        });

        it('should return correct job with mixed priorities', () => {
            jobComponent.setPriorities([5, 0, 100, 50]);
            expect(jobComponent.getHighestPriorityJob()).to.equal(AntJobComponent.JOB_WARRIOR);
        });
    });

    describe('Job Queries', () => {
        it('should check if ant is gatherer', () => {
            jobComponent.assignJob(AntJobComponent.JOB_GATHERER);
            expect(jobComponent.isGatherer()).to.be.true;
            expect(jobComponent.isBuilder()).to.be.false;
        });

        it('should check if ant is builder', () => {
            jobComponent.assignJob(AntJobComponent.JOB_BUILDER);
            expect(jobComponent.isBuilder()).to.be.true;
            expect(jobComponent.isWarrior()).to.be.false;
        });

        it('should check if ant is warrior', () => {
            jobComponent.assignJob(AntJobComponent.JOB_WARRIOR);
            expect(jobComponent.isWarrior()).to.be.true;
            expect(jobComponent.isScout()).to.be.false;
        });

        it('should check if ant is scout', () => {
            jobComponent.assignJob(AntJobComponent.JOB_SCOUT);
            expect(jobComponent.isScout()).to.be.true;
            expect(jobComponent.isGatherer()).to.be.false;
        });

        it('should return false for all when no job assigned', () => {
            expect(jobComponent.isGatherer()).to.be.false;
            expect(jobComponent.isBuilder()).to.be.false;
            expect(jobComponent.isWarrior()).to.be.false;
            expect(jobComponent.isScout()).to.be.false;
        });
    });

    describe('Component Lifecycle', () => {
        it('should attach to owner', () => {
            const newJob = new AntJobComponent([1, 1, 1, 1]);
            const newOwner = new GameObject('ant', 0, 0);

            newJob.onAttach(newOwner);
            expect(newJob.owner).to.equal(newOwner);
        });

        it('should detach from owner', () => {
            const ownerBefore = jobComponent.owner;
            jobComponent.onDetach();
            expect(jobComponent.owner).to.equal(ownerBefore);
        });

        it('should clear state on detach', () => {
            jobComponent.assignJob(AntJobComponent.JOB_WARRIOR);
            jobComponent.setCurrentTask('attack_enemy');

            jobComponent.onDetach();

            expect(jobComponent.getCurrentJob()).to.be.null;
            expect(jobComponent.getCurrentTask()).to.be.null;
        });
    });

    describe('Update Cycle', () => {
        it('should update component', () => {
            jobComponent.assignJob(AntJobComponent.JOB_GATHERER);
            jobComponent.update(16);
            
            // Component processes updates
            expect(jobComponent.getCurrentJob()).to.equal(AntJobComponent.JOB_GATHERER);
        });

        it('should track multiple updates', () => {
            jobComponent.update(16);
            jobComponent.update(16);
            jobComponent.update(16);
            
            // Updates should be processed without errors
            expect(jobComponent.getCurrentJob()).to.be.null;
        });
    });

    describe('Edge Cases', () => {
        it('should handle null task name', () => {
            jobComponent.setCurrentTask(null as any);
            expect(jobComponent.getCurrentTask()).to.be.null;
        });

        it('should handle empty string task name', () => {
            jobComponent.setCurrentTask('');
            expect(jobComponent.getCurrentTask()).to.equal('');
        });

        it('should handle very long task names', () => {
            const longTask = 'a'.repeat(1000);
            jobComponent.setCurrentTask(longTask);
            expect(jobComponent.getCurrentTask()).to.equal(longTask);
        });

        it('should handle rapid job changes', () => {
            for (let i = 0; i < 100; i++) {
                jobComponent.assignJob(i % 4);
            }
            // Last iteration: i=99, 99 % 4 = 3 (SCOUT)
            expect(jobComponent.getCurrentJob()).to.equal(3);
        });

        it('should handle rapid task changes', () => {
            for (let i = 0; i < 100; i++) {
                jobComponent.setCurrentTask(`task_${i}`);
            }
            expect(jobComponent.getCurrentTask()).to.equal('task_99');
        });

        it('should handle large priority values', () => {
            jobComponent.setPriorities([999999, 1000000, 500000, 750000]);
            expect(jobComponent.getHighestPriorityJob()).to.equal(AntJobComponent.JOB_BUILDER);
        });

        it('should handle completing task multiple times', () => {
            jobComponent.setCurrentTask('test');
            jobComponent.completeTask();
            jobComponent.completeTask();
            expect(jobComponent.getCurrentTask()).to.be.null;
        });

        it('should handle clearing job multiple times', () => {
            jobComponent.assignJob(AntJobComponent.JOB_GATHERER);
            jobComponent.clearJob();
            jobComponent.clearJob();
            expect(jobComponent.getCurrentJob()).to.be.null;
        });

        it('should handle priority changes during active job', () => {
            jobComponent.assignJob(AntJobComponent.JOB_WARRIOR);
            jobComponent.setPriorities([100, 0, 0, 0]);
            
            expect(jobComponent.getCurrentJob()).to.equal(AntJobComponent.JOB_WARRIOR);
            expect(jobComponent.getHighestPriorityJob()).to.equal(AntJobComponent.JOB_GATHERER);
        });
    });
});
