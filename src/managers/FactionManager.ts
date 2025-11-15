/**
 * FactionManager - Faction System Manager (CONTROLLER)
 * Singleton manager for tracking factions, teams, and ant populations
 * Handles faction colors, enemy detection, and ant cap management
 */

import { EventBus } from '../utils/eventBus';

/**
 * Faction data structure
 */
export interface Faction {
    id: string;
    color: string;           // Hex color for faction tint
    antIds: Set<string>;     // All ants in this faction
    queenId: string | null;  // Queen ID for this faction
    isPlayerFaction: boolean;
    antCap: number;          // Maximum ants (increases with buildings)
    currentAnts: number;     // Current ant count
}

/**
 * FactionManager manages all factions in the game
 * Tracks ant populations, caps, and provides enemy detection
 */
export class FactionManager {
    private static instance: FactionManager;
    private factions: Map<string, Faction>;
    private defaultAntCap: number = 20; // Base ant cap

    private constructor() {
        this.factions = new Map();
        this.setupEventListeners();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): FactionManager {
        if (!FactionManager.instance) {
            FactionManager.instance = new FactionManager();
        }
        return FactionManager.instance;
    }

    /**
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
        // Listen for ant creation to update counts
        EventBus.on('ANT_CREATED', (antId: string, factionId: string) => {
            this.addAntToFaction(antId, factionId);
        });

        // Listen for ant death to update counts
        EventBus.on('ANT_DIED', (antId: string) => {
            this.removeAntFromFaction(antId);
        });

        // Listen for building level ups to increase ant cap
        EventBus.on('BUILDING_LEVELED_UP', (_buildingId: string, _newLevel: number) => {
            // Building manager should emit faction-specific events
            // For now, this is a placeholder
        });
    }

    /**
     * Create a new faction
     * @param id - Unique faction identifier
     * @param color - Hex color string for faction tint
     * @param isPlayer - Is this the player's faction?
     * @returns Created faction
     */
    public createFaction(id: string, color: string, isPlayer: boolean = false): Faction {
        if (this.factions.has(id)) {
            throw new Error(`Faction ${id} already exists!`);
        }

        const faction: Faction = {
            id,
            color,
            antIds: new Set(),
            queenId: null,
            isPlayerFaction: isPlayer,
            antCap: this.defaultAntCap,
            currentAnts: 0
        };

        this.factions.set(id, faction);
        EventBus.emit('FACTION_CREATED', id, isPlayer);

        return faction;
    }

    /**
     * Add ant to faction
     * @param antId - Ant entity ID
     * @param factionId - Faction to add to
     */
    public addAntToFaction(antId: string, factionId: string): void {
        const faction = this.factions.get(factionId);
        if (!faction) {
            console.warn(`Faction ${factionId} not found!`);
            return;
        }

        // Check ant cap
        if (faction.currentAnts >= faction.antCap) {
            console.warn(`Faction ${factionId} at ant cap (${faction.antCap})!`);
            EventBus.emit('FACTION_ANT_CAP_REACHED', factionId);
            return;
        }

        faction.antIds.add(antId);
        faction.currentAnts = faction.antIds.size;

        EventBus.emit('FACTION_ANT_ADDED', factionId, antId, faction.currentAnts, faction.antCap);
    }

    /**
     * Remove ant from faction
     * @param antId - Ant entity ID
     */
    public removeAntFromFaction(antId: string): void {
        // Find which faction this ant belongs to
        for (const faction of this.factions.values()) {
            if (faction.antIds.has(antId)) {
                faction.antIds.delete(antId);
                faction.currentAnts = faction.antIds.size;
                
                EventBus.emit('FACTION_ANT_REMOVED', faction.id, antId, faction.currentAnts, faction.antCap);
                return;
            }
        }
    }

    /**
     * Get faction color for tinting sprites
     * @param factionId - Faction ID
     * @returns Hex color string or null
     */
    public getFactionColor(factionId: string): string | null {
        const faction = this.factions.get(factionId);
        return faction ? faction.color : null;
    }

    /**
     * Check if two factions are enemies
     * @param factionId1 - First faction
     * @param factionId2 - Second faction
     * @returns True if enemies (different factions)
     */
    public isEnemy(factionId1: string, factionId2: string): boolean {
        return factionId1 !== factionId2;
    }

    /**
     * Get faction's ant cap
     * @param factionId - Faction ID
     * @returns Max ant count
     */
    public getAntCap(factionId: string): number {
        const faction = this.factions.get(factionId);
        return faction ? faction.antCap : 0;
    }

    /**
     * Check if faction can spawn more ants
     * @param factionId - Faction ID
     * @returns True if under cap
     */
    public canSpawnAnt(factionId: string): boolean {
        const faction = this.factions.get(factionId);
        if (!faction) return false;
        return faction.currentAnts < faction.antCap;
    }

    /**
     * Increase faction's ant cap (from building bonuses)
     * @param factionId - Faction ID
     * @param amount - Amount to increase by
     */
    public increaseAntCap(factionId: string, amount: number): void {
        const faction = this.factions.get(factionId);
        if (!faction) return;

        faction.antCap += amount;
        EventBus.emit('FACTION_ANT_CAP_INCREASED', factionId, faction.antCap);
    }

    /**
     * Get faction by ID
     * @param factionId - Faction ID
     * @returns Faction or undefined
     */
    public getFaction(factionId: string): Faction | undefined {
        return this.factions.get(factionId);
    }

    /**
     * Get all faction IDs
     * @returns Array of faction IDs
     */
    public getAllFactionIds(): string[] {
        return Array.from(this.factions.keys());
    }

    /**
     * Get current ant count for faction
     * @param factionId - Faction ID
     * @returns Current ant count
     */
    public getCurrentAntCount(factionId: string): number {
        const faction = this.factions.get(factionId);
        return faction ? faction.currentAnts : 0;
    }

    /**
     * Set queen for faction
     * @param factionId - Faction ID
     * @param queenId - Queen entity ID
     */
    public setQueen(factionId: string, queenId: string): void {
        const faction = this.factions.get(factionId);
        if (faction) {
            faction.queenId = queenId;
        }
    }

    /**
     * Get queen ID for faction
     * @param factionId - Faction ID
     * @returns Queen ID or null
     */
    public getQueenId(factionId: string): string | null {
        const faction = this.factions.get(factionId);
        return faction ? faction.queenId : null;
    }

    /**
     * Clear all factions (for testing)
     */
    public clear(): void {
        this.factions.clear();
    }
}
