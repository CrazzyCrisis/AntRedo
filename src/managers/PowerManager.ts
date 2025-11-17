import { BaseManager } from './BaseManager';
/**
 * PowerManager - Queen Power System Manager (CONTROLLER)
 * Singleton manager for queen power unlocks, upgrades, and usage
 */

import { LightningPower } from '../classes/powers/LightningPower';
import { FireballPower } from '../classes/powers/FireballPower';
import { BlackholePower } from '../classes/powers/BlackholePower';
import { TidalwavePower } from '../classes/powers/TidalwavePower';
import { FinalFlashPower } from '../classes/powers/FinalFlashPower';
import { IPower } from '../classes/powers/IPower';
import { ResourceManager } from './ResourceManager';


/**
 * Power upgrade costs
 */
interface PowerUpgradeCost {
    food: number;
    wood: number;
    stone: number;
    magicCrystal: number;
}

/**
 * Power key mapping (1-5 keys)
 */
const POWER_KEY_MAP: Record<string, number> = {
    'lightning': 1,
    'fireball': 2,
    'blackhole': 3,
    'tidalwave': 4,
    'finalFlash': 5
};

/**
 * PowerManager manages all queen powers
 */
export class PowerManager extends BaseManager {
    private static instance: PowerManager;
    private powers: Map<string, Map<string, IPower>>; // queenId ? (powerName ? IPower)
    private lastTickTime: number = Date.now();

    // Upgrade costs per level
    private upgradeCosts: Record<number, PowerUpgradeCost> = {
        1: { food: 0, wood: 0, stone: 0, magicCrystal: 0 },      // Level 1 is free (unlocked by default)
        2: { food: 100, wood: 100, stone: 50, magicCrystal: 10 }, // Level 2 upgrade cost
        3: { food: 200, wood: 200, stone: 100, magicCrystal: 25 } // Level 3 upgrade cost
    };

    private constructor() {
        super(); // Initialize BaseManager
        this.powers = new Map();
        this.setupEventListeners();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): PowerManager {
        if (!PowerManager.instance) {
            PowerManager.instance = new PowerManager();
        }
        return PowerManager.instance;
    }

    /**
     * Setup EventBus listeners
     */
    private setupEventListeners(): void {
        // Listen for queen creation to initialize powers
        this.subscribe('QUEEN_CREATED', (queenId: string, factionId: string) => {
            this.initializePowersForQueen(queenId, factionId);
        });

        // Listen for blackhole updates (needs to be called each frame)
        this.subscribe('GAME_UPDATE', (deltaTime: number) => {
            this.updateActivePowers(deltaTime);
            this.updateCooldownTicks();
        });
    }
    
    /**
     * Emit cooldown tick events for UI updates
     */
    private updateCooldownTicks(): void {
        const currentTime = Date.now();
        const deltaMs = currentTime - this.lastTickTime;
        
        // Only update every 100ms to reduce event spam
        if (deltaMs < 100) return;
        
        this.lastTickTime = currentTime;
        const currentTimeSec = currentTime / 1000;
        
        // Emit cooldown remaining for each power
        for (const [_queenId, powerMap] of this.powers.entries()) {
            for (const [powerName, power] of powerMap.entries()) {
                const powerKey = POWER_KEY_MAP[powerName];
                if (powerKey) {
                    const remaining = power.getCooldownRemaining(currentTimeSec);
                    this.emit('POWER_COOLDOWN_TICK', powerKey, remaining);
                }
            }
        }
    }

    /**
     * Initialize powers for a queen
     * @param queenId - Queen entity ID
     * @param factionId - Faction ID for enemy detection
     */
    public initializePowersForQueen(queenId: string, factionId: string): void {
        const powerMap = new Map<string, IPower>();

        // Create all powers
        const lightning = new LightningPower();
        const fireball = new FireballPower();
        const blackhole = new BlackholePower();
        const tidalwave = new TidalwavePower(factionId);
        const finalFlash = new FinalFlashPower(factionId);

        // Unlock basic powers by default (except Final Flash)
        lightning.isUnlocked = true;
        fireball.isUnlocked = true;
        blackhole.isUnlocked = true;
        tidalwave.isUnlocked = true;
        // finalFlash stays locked until all others are level 3

        powerMap.set('lightning', lightning);
        powerMap.set('fireball', fireball);
        powerMap.set('blackhole', blackhole);
        powerMap.set('tidalwave', tidalwave);
        powerMap.set('finalFlash', finalFlash);

        this.powers.set(queenId, powerMap);

        this.emit('QUEEN_POWERS_INITIALIZED', queenId);
    }

    /**
     * Get power for a queen
     * @param queenId - Queen entity ID
     * @param powerName - Power name
     * @returns Power instance or undefined
     */
    public getPower(queenId: string, powerName: string): IPower | undefined {
        const queenPowers = this.powers.get(queenId);
        if (!queenPowers) return undefined;
        return queenPowers.get(powerName);
    }

    /**
     * Use a power
     * @param queenId - Queen entity ID
     * @param powerName - Power name
     * @param queenX - Queen X position
     * @param queenY - Queen Y position
     * @param targetX - Optional target X
     * @param targetY - Optional target Y
     * @param targetId - Optional target entity ID
     * @returns True if power was used
     */
    public usePower(
        queenId: string,
        powerName: string,
        queenX: number,
        queenY: number,
        targetX?: number,
        targetY?: number,
        targetId?: string
    ): boolean {
        const power = this.getPower(queenId, powerName);
        if (!power) return false;

        const success = power.use(queenX, queenY, targetX, targetY, targetId);
        
        if (success) {
            // Emit POWER_USED event for UI updates
            const powerKey = POWER_KEY_MAP[powerName];
            if (powerKey) {
                this.emit('POWER_USED', powerKey, power.cooldown);
            }
        }
        
        return success;
    }

    /**
     * Upgrade a power
     * @param queenId - Queen entity ID
     * @param factionId - Faction ID for resource checking
     * @param powerName - Power name
     * @returns True if upgrade successful
     */
    public upgradePower(queenId: string, factionId: string, powerName: string): boolean {
        const power = this.getPower(queenId, powerName);
        if (!power) return false;

        // Check if already max level
        if (power.level >= power.maxLevel) return false;

        // Get upgrade cost for next level
        const nextLevel = power.level + 1;
        const cost = this.upgradeCosts[nextLevel];

        // Check if faction can afford
        if (!ResourceManager.getInstance().canAfford(factionId, cost)) {
            this.emit('POWER_UPGRADE_FAILED', queenId, powerName, 'insufficient_resources');
            return false;
        }

        // Spend resources
        ResourceManager.getInstance().spendResources(factionId, cost);

        // Upgrade power
        const success = power.upgrade();

        if (success) {
            // Check if Final Flash should be unlocked
            this.checkFinalFlashUnlock(queenId);
        }

        return success;
    }

    /**
     * Check if Final Flash should be unlocked (all other powers level 3)
     * @param queenId - Queen entity ID
     */
    private checkFinalFlashUnlock(queenId: string): void {
        const queenPowers = this.powers.get(queenId);
        if (!queenPowers) return;

        // Check if all other powers are level 3
        const lightning = queenPowers.get('lightning');
        const fireball = queenPowers.get('fireball');
        const blackhole = queenPowers.get('blackhole');
        const tidalwave = queenPowers.get('tidalwave');

        if (!lightning || !fireball || !blackhole || !tidalwave) return;

        const allMaxed = lightning.level === 3 && fireball.level === 3 && 
                        blackhole.level === 3 && tidalwave.level === 3;

        if (allMaxed) {
            const finalFlash = queenPowers.get('finalFlash') as FinalFlashPower;
            if (finalFlash && !finalFlash.isUnlocked) {
                finalFlash.unlock();
            }
        }
    }

    /**
     * Get upgrade cost for power
     * @param powerName - Power name
     * @param currentLevel - Current level
     * @returns Upgrade cost or null if max level
     */
    public getUpgradeCost(_powerName: string, currentLevel: number): PowerUpgradeCost | null {
        const nextLevel = currentLevel + 1;
        if (nextLevel > 3) return null;
        return this.upgradeCosts[nextLevel];
    }

    /**
     * Check if power can be upgraded
     * @param queenId - Queen entity ID
     * @param factionId - Faction ID
     * @param powerName - Power name
     * @returns True if can upgrade
     */
    public canUpgrade(queenId: string, factionId: string, powerName: string): boolean {
        const power = this.getPower(queenId, powerName);
        if (!power || power.level >= power.maxLevel) return false;

        const nextLevel = power.level + 1;
        const cost = this.upgradeCosts[nextLevel];

        return ResourceManager.getInstance().canAfford(factionId, cost);
    }

    /**
     * Update active powers (for blackhole pull effect)
     * @param deltaTime - Time elapsed in seconds
     */
    private updateActivePowers(deltaTime: number): void {
        for (const queenPowers of this.powers.values()) {
            const blackhole = queenPowers.get('blackhole') as BlackholePower;
            if (blackhole) {
                blackhole.update(deltaTime);
            }
        }
    }

    /**
     * Get all powers for a queen
     * @param queenId - Queen entity ID
     * @returns Map of power names to powers
     */
    public getAllPowers(queenId: string): Map<string, IPower> | undefined {
        return this.powers.get(queenId);
    }

    /**
     * Clear all powers (for testing)
     */
    public clear(): void {
        this.powers.clear();
    }

    /**
     * Cleanup - unsubscribe from all events
     */
    public cleanup(): void {
        this.cleanupSubscriptions();
        this.clear();
    }

    /**
     * Reinitialize EventBus listeners (for testing after EventBus.clear())
     */
    public reinitializeListeners(): void {
        this.setupEventListeners();
    }
}
