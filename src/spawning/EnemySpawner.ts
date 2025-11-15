/**
 * EnemySpawner - Spawns enemy entities with safe zone validation
 * 
 * Responsibilities:
 * - Spawn enemy nests (boss + ant guards)
 * - Spawn enemy waves with increasing difficulty
 * - Validate all spawns respect safe zone boundaries
 * - Emit events for enemy spawns
 * 
 * Pattern:
 * - Uses BossFactory and AntSpawner for entity creation
 * - Integrates with SafeZone for validation
 * - Emits EventBus events for wave notifications
 */

import { Boss } from '../classes/Boss';
import { Ant } from '../classes/Ant';
import { BossFactory } from '../factories/BossFactory';
import { AntSpawner } from './AntSpawner';
import { SafeZone } from './SafeZone';
import { Renderer } from '../rendering/Renderer';
import { SpawnRuleValidator } from './SpawnRule';
import { EventBus, GameEvents } from '../utils/eventBus';
import { EnemyNestConfig, WaveConfig } from '../config/spawnConfig';

/**
 * Enemy nest spawn result
 */
export interface EnemyNestResult {
    boss: Boss;
    ants: Ant[];
    nestCenter: { x: number; y: number };
}

/**
 * Enemy wave spawn result
 */
export interface WaveSpawnResult {
    boss: Boss | null;
    ants: Ant[];
    waveNumber: number;
}

/**
 * EnemySpawner handles all enemy entity spawning with safe zone validation
 */
export class EnemySpawner {
    private renderer: Renderer;
    private antSpawner: AntSpawner;
    private tileGrid: any;
    private getEntitiesInRadius: (x: number, y: number, radius: number) => any[];
    private bossSprite: any | null = null;
    private safeZone: SafeZone | null = null;

    constructor(
        renderer: Renderer,
        antSpawner: AntSpawner,
        tileGrid: any,
        getEntitiesInRadius: (x: number, y: number, radius: number) => any[]
    ) {
        this.renderer = renderer;
        this.antSpawner = antSpawner;
        this.tileGrid = tileGrid;
        this.getEntitiesInRadius = getEntitiesInRadius;
    }

    /**
     * Set safe zone for spawn validation
     */
    public setSafeZone(safeZone: SafeZone): void {
        this.safeZone = safeZone;
    }

    /**
     * Register boss sprite
     */
    public registerBossSprite(sprite: any): void {
        this.bossSprite = sprite;
    }

    /**
     * Spawn enemy nest with boss and ant guards
     * @param config Enemy nest configuration
     * @returns Boss and guard ants
     */
    public spawnEnemyNest(config: EnemyNestConfig): EnemyNestResult | null {
        const centerX = config.center.x;
        const centerY = config.center.y;

        // Validate nest center is outside safe zone
        if (!this.canSpawnEnemy(centerX, centerY)) {
            console.warn(`Cannot spawn enemy nest at (${centerX}, ${centerY}) - inside safe zone or invalid tile`);
            return null;
        }

        // Spawn boss at nest center
        if (!this.bossSprite) {
            console.error('Boss sprite not registered');
            return null;
        }

        const boss = BossFactory.create(
            this.renderer,
            this.bossSprite,
            centerX,
            centerY,
            config.patrolPath 
                ? config.patrolPath.map(p => ({gridX: p.x, gridY: p.y}))
                : [{gridX: centerX, gridY: centerY}],
            'homing'
        );

        // Spawn guard ants around boss
        const antResult = this.antSpawner.spawnEnemyAnts(
            centerX,
            centerY,
            config.antCount,
            5, // radius
            config.factionId
        );

        // Emit nest spawned event
        EventBus.emit(GameEvents.ENEMY_SPAWN, {
            type: 'nest',
            bossId: boss.id,
            antCount: antResult.ants.length,
            position: { x: centerX, y: centerY }
        });

        return {
            boss,
            ants: antResult.ants,
            nestCenter: { x: centerX, y: centerY }
        };
    }

    /**
     * Check if enemy can spawn at position
     * @param x Grid X position
     * @param y Grid Y position
     * @returns True if position is valid for enemy spawn
     */
    public canSpawnEnemy(x: number, y: number): boolean {
        // Check safe zone
        if (this.safeZone && this.safeZone.getIsActive()) {
            if (this.safeZone.isPositionSafe(x, y)) {
                return false;
            }
        }

        // Check tile type and constraints
        const constraints = SpawnRuleValidator.getDefaultConstraints('enemy');
        const validation = SpawnRuleValidator.canSpawnAt(
            x, y, constraints,
            this.tileGrid,
            {getEntitiesInRadius: this.getEntitiesInRadius} as any
        );
        return validation.valid;
    }

    /**
     * Spawn enemy wave
     * @param waveConfig Wave configuration
     * @returns Spawned enemies
     */
    public spawnWave(waveConfig: WaveConfig): WaveSpawnResult {
        let boss: Boss | null = null;
        const ants: Ant[] = [];

        // Calculate spawn position outside safe zone
        const spawnPos = this.findWaveSpawnPosition(waveConfig.spawnRadius);
        if (!spawnPos) {
            console.warn('Could not find valid wave spawn position');
            return { boss: null, ants: [], waveNumber: waveConfig.waveNumber };
        }

        // Spawn boss if wave has one
        if (waveConfig.hasBoss && this.bossSprite) {
            boss = BossFactory.create(
                this.renderer,
                this.bossSprite,
                spawnPos.x,
                spawnPos.y,
                [{gridX: spawnPos.x, gridY: spawnPos.y}],
                'homing'
            );
        }

        // Spawn wave ants
        const antResult = this.antSpawner.spawnEnemyAnts(
            spawnPos.x,
            spawnPos.y,
            waveConfig.antCount,
            waveConfig.spawnRadius,
            'enemy_faction'
        );
        ants.push(...antResult.ants);

        // Emit wave spawned event
        EventBus.emit(GameEvents.ENEMY_SPAWN, {
            type: 'wave',
            waveNumber: waveConfig.waveNumber,
            hasBoss: waveConfig.hasBoss,
            antCount: ants.length,
            position: spawnPos
        });

        return { boss, ants, waveNumber: waveConfig.waveNumber };
    }

    /**
     * Find valid spawn position for wave outside safe zone
     * @param radiusFromSafeZone Distance from safe zone edge
     * @returns Spawn position or null if not found
     */
    private findWaveSpawnPosition(radiusFromSafeZone: number): { x: number; y: number } | null {
        if (!this.safeZone || !this.safeZone.getIsActive()) {
            // No safe zone - spawn at random position
            // This is a fallback - in practice, level should provide spawn points
            return { x: 0, y: 0 };
        }

        const center = this.safeZone.getCenter();
        const safeRadius = this.safeZone.getCurrentRadius();
        const spawnDistance = safeRadius + radiusFromSafeZone;

        // Try random angles to find valid spawn position
        const maxAttempts = 20;
        for (let i = 0; i < maxAttempts; i++) {
            const angle = Math.random() * Math.PI * 2;
            const x = Math.round(center.x + Math.cos(angle) * spawnDistance);
            const y = Math.round(center.y + Math.sin(angle) * spawnDistance);

            if (this.canSpawnEnemy(x, y)) {
                return { x, y };
            }
        }

        console.warn('Could not find valid wave spawn position after', maxAttempts, 'attempts');
        return null;
    }

    /**
     * Get minimum distance from safe zone edge for enemy spawning
     */
    public getDistanceFromSafeZone(x: number, y: number): number {
        if (!this.safeZone || !this.safeZone.getIsActive()) {
            return Infinity; // No safe zone - always safe to spawn
        }

        return this.safeZone.getDistanceToEdge(x, y);
    }
}
