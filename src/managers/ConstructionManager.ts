/**
 * ConstructionManager - Construction Work Coordination (CONTROLLER)
 * Manages construction sites, worker assignment, and progress tracking
 * Coordinates between buildings and ant workers using priority-based task assignment
 */

import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
import { Building } from '../classes/Building';
import { Ant } from '../classes/Ant';
import { AntJobComponent } from '../classes/components/AntJobComponent';
import { EntityManager } from './EntityManager';
import { distance } from '../utils/helpers';

interface ConstructionSite {
    buildingId: string;
    gridX: number;
    gridY: number;
    buildingType: string;
    sizeWidth: number;
    sizeHeight: number;
    factionId: string;
    workers: Set<string>; // Ant IDs currently working
    completed: boolean;
}

/**
 * ConstructionManager
 * Coordinates construction work assignment for all ants
 * Priority-based system: all ants can build, builders prioritize it higher
 */
export class ConstructionManager extends BaseManager {
    private static instance: ConstructionManager;
    
    private constructionSites: Map<string, ConstructionSite> = new Map();
    private antAssignments: Map<string, string> = new Map(); // antId -> buildingId
    private buildSpeedMultipliers: Map<number, number> = new Map(); // jobType -> speed multiplier
    
    private constructor() {
        super();
        
        // Initialize build speed multipliers
        this.buildSpeedMultipliers.set(AntJobComponent.JOB_GATHERER, 1.0); // Gatherers 1x speed
        this.buildSpeedMultipliers.set(AntJobComponent.JOB_BUILDER, 2.0);  // Builders 2x speed
        this.buildSpeedMultipliers.set(AntJobComponent.JOB_WARRIOR, 0.8);  // Warriors 0.8x speed
        this.buildSpeedMultipliers.set(AntJobComponent.JOB_SCOUT, 0.9);    // Scouts 0.9x speed
        
        this.setupEventListeners();
    }
    
    public static getInstance(): ConstructionManager {
        if (!ConstructionManager.instance) {
            ConstructionManager.instance = new ConstructionManager();
        }
        return ConstructionManager.instance;
    }
    
    /**
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
        // Listen for new construction sites
        this.subscribe(GameEvents.CONSTRUCTION_SITE_CREATED, (data: ConstructionSite) => {
            this.registerConstructionSite(data);
        });
        
        // Listen for building completion
        this.subscribe(GameEvents.BUILDING_COMPLETED, (buildingId: string) => {
            this.completeConstructionSite(buildingId);
        });
        
        // Listen for building destruction (cancel construction)
        this.subscribe(GameEvents.BUILDING_DESTROYED, (buildingId: string) => {
            this.cancelConstructionSite(buildingId);
        });
        
        // Listen for ant task requests (ants looking for work)
        this.subscribe(GameEvents.ANT_REQUESTING_TASK, (antId: string, factionId: string) => {
            this.assignConstructionWork(antId, factionId);
        });
        
        // Listen for ant death/removal
        this.subscribe(GameEvents.ENTITY_DESTROYED, (entityId: string) => {
            this.removeWorker(entityId);
        });
    }
    
    /**
     * Register a new construction site
     * @param data - Construction site data from CONSTRUCTION_SITE_CREATED event
     */
    private registerConstructionSite(data: ConstructionSite): void {
        const site: ConstructionSite = {
            ...data,
            workers: new Set(),
            completed: false
        };
        
        this.constructionSites.set(data.buildingId, site);
        
        // Notify idle ants of same faction about new construction opportunity
        this.emit(GameEvents.CONSTRUCTION_WORK_AVAILABLE, data.factionId, data.buildingId);
    }
    
    /**
     * Assign construction work to requesting ant
     * @param antId - Ant requesting work
     * @param factionId - Ant's faction
     */
    private assignConstructionWork(antId: string, factionId: string): void {
        // Get ant entity
        const ant = EntityManager.getInstance().getEntity(antId) as Ant;
        if (!ant) return;
        
        // Check if ant already has assignment
        if (this.antAssignments.has(antId)) return;
        
        // Find closest construction site of same faction
        const site = this.findClosestConstructionSite(ant, factionId);
        if (!site) return;
        
        // Get ant's job component to check priority
        const jobComponent = ant.getComponent('AntJob') as AntJobComponent;
        if (!jobComponent) return;
        
        // Check if ant is willing to build based on priority
        const builderPriority = jobComponent.getPriority(AntJobComponent.JOB_BUILDER);
        if (builderPriority <= 0) return; // Ant won't build if priority is 0
        
        // Assign ant to construction site
        this.antAssignments.set(antId, site.buildingId);
        site.workers.add(antId);
        
        // Set ant's task
        jobComponent.setCurrentTask(`building:${site.buildingId}`);
        
        // Emit assignment event with target position
        this.emit(GameEvents.CONSTRUCTION_TASK_ASSIGNED, {
            antId,
            buildingId: site.buildingId,
            gridX: site.gridX,
            gridY: site.gridY,
            sizeWidth: site.sizeWidth,
            sizeHeight: site.sizeHeight
        });
    }
    
    /**
     * Find closest construction site for ant
     * @param ant - Ant looking for work
     * @param factionId - Ant's faction
     * @returns Closest construction site or null
     */
    private findClosestConstructionSite(ant: Ant, factionId: string): ConstructionSite | null {
        let closestSite: ConstructionSite | null = null;
        let closestDistance = Infinity;
        
        for (const site of this.constructionSites.values()) {
            // Only same faction sites
            if (site.factionId !== factionId) continue;
            
            // Skip completed sites
            if (site.completed) continue;
            
            // Calculate distance
            const dist = distance(ant.gridX, ant.gridY, site.gridX, site.gridY);
            
            if (dist < closestDistance) {
                closestDistance = dist;
                closestSite = site;
            }
        }
        
        return closestSite;
    }
    
    /**
     * Remove worker from construction site
     * @param antId - Ant ID to remove
     */
    private removeWorker(antId: string): void {
        const buildingId = this.antAssignments.get(antId);
        if (!buildingId) return;
        
        const site = this.constructionSites.get(buildingId);
        if (site) {
            site.workers.delete(antId);
        }
        
        this.antAssignments.delete(antId);
    }
    
    /**
     * Complete construction site
     * @param buildingId - Building ID
     */
    private completeConstructionSite(buildingId: string): void {
        const site = this.constructionSites.get(buildingId);
        if (!site) return;
        
        site.completed = true;
        
        // Release all workers
        for (const antId of site.workers) {
            const ant = EntityManager.getInstance().getEntity(antId) as Ant;
            if (ant) {
                const jobComponent = ant.getComponent('AntJob') as AntJobComponent;
                if (jobComponent) {
                    jobComponent.clearTask();
                }
            }
            this.antAssignments.delete(antId);
        }
        
        site.workers.clear();
        
        // Remove from tracking after delay (keep for reference)
        setTimeout(() => {
            this.constructionSites.delete(buildingId);
        }, 1000);
    }
    
    /**
     * Cancel construction site (building destroyed before completion)
     * @param buildingId - Building ID
     */
    private cancelConstructionSite(buildingId: string): void {
        const site = this.constructionSites.get(buildingId);
        if (!site) return;
        
        // Release all workers
        for (const antId of site.workers) {
            const ant = EntityManager.getInstance().getEntity(antId) as Ant;
            if (ant) {
                const jobComponent = ant.getComponent('AntJob') as AntJobComponent;
                if (jobComponent) {
                    jobComponent.clearTask();
                }
            }
            this.antAssignments.delete(antId);
        }
        
        this.constructionSites.delete(buildingId);
    }
    
    /**
     * Update construction progress (called per frame)
     * @param deltaTime - Time elapsed in seconds
     */
    public update(deltaTime: number): void {
        for (const site of this.constructionSites.values()) {
            if (site.completed) continue;
            if (site.workers.size === 0) continue;
            
            // Get building entity
            const building = EntityManager.getInstance().getEntity(site.buildingId) as Building;
            if (!building) continue;
            
            // Calculate total build speed from all workers
            let totalBuildSpeed = 0;
            
            for (const antId of site.workers) {
                const ant = EntityManager.getInstance().getEntity(antId) as Ant;
                if (!ant || !ant.isActive) continue;
                
                // Check if ant is adjacent to building
                if (!this.isAntAdjacentToBuilding(ant, site)) continue;
                
                // Get ant's job type for speed multiplier
                const jobComponent = ant.getComponent('AntJob') as AntJobComponent;
                if (!jobComponent) continue;
                
                const jobType = jobComponent.getCurrentJob();
                if (jobType === null) continue;
                
                const speedMultiplier = this.buildSpeedMultipliers.get(jobType) || 1.0;
                totalBuildSpeed += speedMultiplier;
                
                // Emit build animation trigger
                this.emit(GameEvents.ANT_BUILD_ANIMATION, antId);
            }
            
            if (totalBuildSpeed > 0) {
                // Add progress to building
                const progressAdded = totalBuildSpeed * deltaTime;
                building.addProgress(progressAdded);
                
                // Emit progress event
                this.emit(GameEvents.BUILDING_CONSTRUCTION_PROGRESS, site.buildingId, building.constructionProgress);
            }
        }
    }
    
    /**
     * Check if ant is adjacent to building (can work on it)
     * @param ant - Ant entity
     * @param site - Construction site
     * @returns True if ant is adjacent
     */
    private isAntAdjacentToBuilding(ant: Ant, site: ConstructionSite): boolean {
        // Check if ant is adjacent to any tile in building footprint
        for (let x = site.gridX; x < site.gridX + site.sizeWidth; x++) {
            for (let y = site.gridY; y < site.gridY + site.sizeHeight; y++) {
                const dx = Math.abs(ant.gridX - x);
                const dy = Math.abs(ant.gridY - y);
                
                // Adjacent if exactly 1 tile away (horizontally or vertically)
                if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Get construction site by building ID
     * @param buildingId - Building ID
     * @returns Construction site or undefined
     */
    public getConstructionSite(buildingId: string): ConstructionSite | undefined {
        return this.constructionSites.get(buildingId);
    }
    
    /**
     * Get all active construction sites for faction
     * @param factionId - Faction ID
     * @returns Array of construction sites
     */
    public getFactionConstructionSites(factionId: string): ConstructionSite[] {
        return Array.from(this.constructionSites.values())
            .filter(site => site.factionId === factionId && !site.completed);
    }
    
    /**
     * Check if ant is assigned to construction
     * @param antId - Ant ID
     * @returns True if assigned
     */
    public isAntAssigned(antId: string): boolean {
        return this.antAssignments.has(antId);
    }
    
    /**
     * Cleanup manager
     */
    public cleanup(): void {
        this.constructionSites.clear();
        this.antAssignments.clear();
        this.cleanupSubscriptions();
    }
}
