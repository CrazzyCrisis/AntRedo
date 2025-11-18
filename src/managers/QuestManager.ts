/**
 * QuestManager - Quest System Manager (CONTROLLER)
 * Singleton manager for tracking quest progression and building unlocks
 * 
 * Current Implementation: Stub for building unlock tracking
 * Future: Will integrate full quest system when quests are implemented
 * 
 * Pattern: Extends BaseManager for EventBus subscription management
 */

import { BaseManager } from './BaseManager';
import { BuildingType, BUILDINGS } from '../config/buildings/buildingConfig';
import { GameEvents } from '../utils/eventBus';

/**
 * QuestManager manages quest progression and unlock states
 * Currently focused on building unlocks, will expand to full quest system
 */
export class QuestManager extends BaseManager {
    private static instance: QuestManager;
    private unlockedBuildings: Set<BuildingType>;

    private constructor() {
        super(); // Initialize BaseManager (EventBus subscription tracking)
        
        // Initialize all buildings as unlocked (temporary for testing)
        // When quest system is implemented, buildings will start locked
        this.unlockedBuildings = new Set(
            Object.keys(BUILDINGS) as BuildingType[]
        );
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): QuestManager {
        if (!QuestManager.instance) {
            QuestManager.instance = new QuestManager();
        }
        return QuestManager.instance;
    }

    /**
     * Check if building is unlocked for construction
     * @param buildingType - Type of building to check
     * @returns true if building is unlocked, false otherwise
     */
    public isBuildingUnlocked(buildingType: BuildingType): boolean {
        return this.unlockedBuildings.has(buildingType);
    }

    /**
     * Unlock a building (called when quest completed)
     * @param buildingType - Type of building to unlock
     */
    public unlockBuilding(buildingType: BuildingType): void {
        // Don't emit event if already unlocked
        if (this.unlockedBuildings.has(buildingType)) {
            return;
        }
        
        this.unlockedBuildings.add(buildingType);
        this.emit(GameEvents.BUILDING_UNLOCKED, buildingType);
    }

    /**
     * Lock a building (for testing/admin purposes)
     * @param buildingType - Type of building to lock
     */
    public lockBuilding(buildingType: BuildingType): void {
        this.unlockedBuildings.delete(buildingType);
    }

    /**
     * Get all unlocked buildings
     * @returns Array of unlocked building types
     */
    public getUnlockedBuildings(): BuildingType[] {
        return Array.from(this.unlockedBuildings);
    }

    /**
     * Cleanup manager
     * Called when manager is being destroyed or reset
     */
    public cleanup(): void {
        this.cleanupSubscriptions(); // BaseManager cleanup
        // Reset unlocked buildings to default state
        this.unlockedBuildings = new Set(
            Object.keys(BUILDINGS) as BuildingType[]
        );
    }
    
    /**
     * Reset singleton instance (for testing)
     */
    public static resetInstance(): void {
        if (QuestManager.instance) {
            QuestManager.instance.cleanup();
            QuestManager.instance = undefined as any;
        }
    }
}
