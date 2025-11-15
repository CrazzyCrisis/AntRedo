/**
 * Building - Constructable Building Entity (MODEL)
 * Variable-sized buildings with construction, leveling, and stat boost systems
 * Blocks pathfinding grid tiles based on size
 */

import { GameObject } from './GameObject';
import { EventBus } from '../utils/eventBus';
import { ENTITY_CONFIG, BuildingType } from '../config/entityConfig';

export class Building extends GameObject {
    public readonly buildingType: BuildingType;
    public readonly size: { width: number; height: number };
    public level: number;
    public readonly maxLevel: number = 3;
    public isConstructed: boolean;
    public constructionProgress: number;  // 0-100
    public blocksPathfinding: boolean;
    public workers: Set<string>;  // Ant IDs assigned as workers
    
    // Production system
    public resourceProduction?: { type: string; rate: number };
    private lastProductionTime: number = 0;

    constructor(gridX: number, gridY: number, buildingType: BuildingType) {
        const config = ENTITY_CONFIG.BUILDINGS[buildingType];
        super('building', gridX, gridY);
        
        this.buildingType = buildingType;
        this.size = config.size;
        this.level = 1;
        this.isConstructed = false;
        this.constructionProgress = 0;
        this.blocksPathfinding = true;
        this.workers = new Set();
        
        // Set collision size based on building size
        const tileSize = 16; // TODO: Get from config
        this.collisionWidth = this.size.width * tileSize;
        this.collisionHeight = this.size.height * tileSize;
        
        // Initialize resource production if applicable
        if (config.levels[0].productionRate) {
            this.resourceProduction = {
                type: 'food', // Default, can be configured
                rate: config.levels[0].productionRate
            };
        }
        
        // Emit creation event
        EventBus.emit('BUILDING_PLACED', this.id, gridX, gridY, buildingType);
    }

    /**
     * Start construction
     */
    public startConstruction(): void {
        if (this.isConstructed) {
            return;
        }
        
        this.constructionProgress = 0;
        EventBus.emit('CONSTRUCTION_STARTED', this.id);
    }

    /**
     * Add construction progress
     * @param amount - Progress amount (0-100 scale)
     */
    public addProgress(amount: number): void {
        if (this.isConstructed) {
            return;
        }
        
        this.constructionProgress = Math.min(100, this.constructionProgress + amount);
        
        EventBus.emit('CONSTRUCTION_PROGRESS', this.id, this.constructionProgress);
        
        // Check if construction complete
        if (this.constructionProgress >= 100) {
            this.completeConstruction();
        }
    }

    /**
     * Complete construction
     */
    public completeConstruction(): void {
        if (this.isConstructed) {
            return;
        }
        
        this.isConstructed = true;
        this.constructionProgress = 100;
        
        EventBus.emit('BUILDING_COMPLETED', this.id, this.buildingType);
    }

    /**
     * Level up building
     * Increases stats, boosts, and production
     */
    public levelUp(): void {
        if (this.level >= this.maxLevel) {
            return; // Already at max level
        }
        
        this.level++;
        
        // Update production rate if applicable
        const config = ENTITY_CONFIG.BUILDINGS[this.buildingType];
        const levelData = config.levels[this.level - 1];
        
        if (this.resourceProduction && levelData.productionRate) {
            this.resourceProduction.rate = levelData.productionRate;
        }
        
        EventBus.emit('BUILDING_LEVELED_UP', this.id, this.level);
    }

    /**
     * Get ant cap bonus for current level
     */
    public getAntCapBonus(): number {
        const config = ENTITY_CONFIG.BUILDINGS[this.buildingType];
        const levelData = config.levels[this.level - 1];
        return levelData.antCapBonus || 0;
    }

    /**
     * Get stat boosts for current level
     */
    public getBoosts(): Record<string, number> {
        const config = ENTITY_CONFIG.BUILDINGS[this.buildingType];
        const levelData = config.levels[this.level - 1];
        return levelData.statBoost || {};
    }

    /**
     * Apply stat boost to an ant
     * @param ant - Ant entity to boost
     */
    public applyBoost(ant: GameObject): void {
        if (!this.isConstructed) {
            return;
        }
        
        const boosts = this.getBoosts();
        
        // Emit boost event for systems to handle
        EventBus.emit('BUILDING_BOOST_APPLIED', this.id, ant.id, boosts);
    }

    /**
     * Generate resources over time
     * Called periodically by BuildingManager
     */
    public generateResources(_deltaTime: number): number {
        if (!this.isConstructed || !this.resourceProduction) {
            return 0;
        }
        
        const currentTime = Date.now();
        const timeSinceLastProduction = (currentTime - this.lastProductionTime) / 1000; // Convert to seconds
        
        if (timeSinceLastProduction < 1) {
            return 0; // Produce every second
        }
        
        this.lastProductionTime = currentTime;
        
        // Production rate is per second, modified by worker count
        const workerBonus = 1 + (this.workers.size * 0.1); // 10% per worker
        const produced = this.resourceProduction.rate * workerBonus;
        
        EventBus.emit('BUILDING_RESOURCE_GENERATED', this.id, this.resourceProduction.type, produced);
        
        return produced;
    }

    /**
     * Assign worker to this building
     * @param antId - Ant entity ID
     */
    public assignWorker(antId: string): void {
        this.workers.add(antId);
        EventBus.emit('BUILDING_WORKER_ASSIGNED', this.id, antId);
    }

    /**
     * Remove worker from this building
     * @param antId - Ant entity ID
     */
    public removeWorker(antId: string): void {
        this.workers.delete(antId);
        EventBus.emit('BUILDING_WORKER_REMOVED', this.id, antId);
    }

    /**
     * Get all grid tiles occupied by this building
     * Used for pathfinding blocking
     */
    public getOccupiedTiles(): Array<{gridX: number; gridY: number}> {
        const tiles: Array<{gridX: number; gridY: number}> = [];
        
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                tiles.push({
                    gridX: this.gridX + x,
                    gridY: this.gridY + y
                });
            }
        }
        
        return tiles;
    }

    /**
     * Check if building is at max level
     */
    public isMaxLevel(): boolean {
        return this.level >= this.maxLevel;
    }

    /**
     * Override destroy to emit building destroyed event
     */
    public destroy(): void {
        EventBus.emit('BUILDING_DESTROYED', this.id, this.buildingType);
        super.destroy();
    }
}
