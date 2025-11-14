/**
 * AntJobComponent
 * Manages ant job types (Gatherer, Builder, Warrior, Scout) with priority system
 */

import { IComponent } from './IComponent';
import { GameObject } from '../GameObject';
import { EventBus } from '../../utils/eventBus';
import { GameEvents } from '../../utils/eventBus';

export class AntJobComponent implements IComponent {
    public owner!: GameObject;

    // Job type constants
    public static readonly JOB_GATHERER = 0;
    public static readonly JOB_BUILDER = 1;
    public static readonly JOB_WARRIOR = 2;
    public static readonly JOB_SCOUT = 3;

    private priorities: number[]; // [gatherer, builder, warrior, scout]
    private currentJob: number | null = null;
    private currentTask: string | null = null;

    /**
     * Create job component with priorities [gatherer, builder, warrior, scout]
     */
    constructor(priorities: number[]) {
        if (priorities.length !== 4) {
            throw new Error('Priorities array must have exactly 4 elements');
        }

        if (priorities.some(p => p < 0)) {
            throw new Error('All priorities must be non-negative');
        }

        this.priorities = [...priorities];
    }

    /**
     * Attach component to owner GameObject
     */
    public onAttach(owner: GameObject): void {
        this.owner = owner;
    }

    /**
     * Detach component and cleanup state
     */
    public onDetach(): void {
        this.clearJob();
        this.clearTask();
    }

    /**
     * Update component
     */
    public update(_deltaTime: number): void {
        // Job component logic would go here
        // (e.g., task timers, job-specific behaviors)
    }

    /**
     * Get current priorities array
     */
    public getPriorities(): number[] {
        return [...this.priorities];
    }

    /**
     * Set all priorities at once
     */
    public setPriorities(priorities: number[]): void {
        if (priorities.length !== 4) {
            throw new Error('Priorities array must have exactly 4 elements');
        }

        if (priorities.some(p => p < 0)) {
            throw new Error('All priorities must be non-negative');
        }

        this.priorities = [...priorities];

        if (this.owner) {
            EventBus.emit(GameEvents.JOB_PRIORITIES_CHANGED, this.owner.id, this.priorities);
        }
    }

    /**
     * Get priority for specific job
     */
    public getPriority(jobIndex: number): number {
        if (jobIndex < 0 || jobIndex >= 4) {
            throw new Error('Job index out of bounds');
        }
        return this.priorities[jobIndex];
    }

    /**
     * Set priority for specific job
     */
    public setPriority(jobIndex: number, priority: number): void {
        if (jobIndex < 0 || jobIndex >= 4) {
            throw new Error('Job index out of bounds');
        }

        if (priority < 0) {
            throw new Error('Priority must be non-negative');
        }

        this.priorities[jobIndex] = priority;

        if (this.owner) {
            EventBus.emit(GameEvents.JOB_PRIORITIES_CHANGED, this.owner.id, this.priorities);
        }
    }

    /**
     * Assign job to ant
     */
    public assignJob(jobType: number): void {
        if (jobType < 0 || jobType >= 4) {
            throw new Error('Job index out of bounds');
        }

        this.currentJob = jobType;
        this.clearTask(); // Clear previous task when job changes

        if (this.owner) {
            EventBus.emit(GameEvents.JOB_ASSIGNED, this.owner.id, jobType);
        }
    }

    /**
     * Get current job
     */
    public getCurrentJob(): number | null {
        return this.currentJob;
    }

    /**
     * Clear current job
     */
    public clearJob(): void {
        this.currentJob = null;
    }

    /**
     * Get highest priority job (for auto-assignment)
     */
    public getHighestPriorityJob(): number {
        let maxPriority = this.priorities[0];
        let maxIndex = 0;

        for (let i = 1; i < this.priorities.length; i++) {
            if (this.priorities[i] > maxPriority) {
                maxPriority = this.priorities[i];
                maxIndex = i;
            }
        }

        return maxIndex;
    }

    /**
     * Set current task
     */
    public setCurrentTask(task: string | null): void {
        this.currentTask = task;

        if (this.owner && task !== null) {
            EventBus.emit(GameEvents.TASK_ASSIGNED, this.owner.id, task);
        }
    }

    /**
     * Get current task
     */
    public getCurrentTask(): string | null {
        return this.currentTask;
    }

    /**
     * Clear current task
     */
    public clearTask(): void {
        this.currentTask = null;
    }

    /**
     * Complete current task (emits event and clears)
     */
    public completeTask(): void {
        if (this.currentTask && this.owner) {
            EventBus.emit(GameEvents.TASK_COMPLETED, this.owner.id, this.currentTask);
        }

        this.currentTask = null;
    }

    /**
     * Job type checks
     */
    public isGatherer(): boolean {
        return this.currentJob === AntJobComponent.JOB_GATHERER;
    }

    public isBuilder(): boolean {
        return this.currentJob === AntJobComponent.JOB_BUILDER;
    }

    public isWarrior(): boolean {
        return this.currentJob === AntJobComponent.JOB_WARRIOR;
    }

    public isScout(): boolean {
        return this.currentJob === AntJobComponent.JOB_SCOUT;
    }
}
