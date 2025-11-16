/**
 * Visual Effects Configuration - Barrel Export
 * Central export point for all visual effect configurations
 */

export { DAMAGE_NUMBER_CONFIG } from './damageNumberConfig';
export { FLASH_EFFECT_CONFIG } from './flashEffectConfig';
export { FLOATING_TEXT_CONFIG } from './floatingTextConfig';
export {
    WATER_PARTICLE_CONFIG,
    CAVE_WATER_PARTICLE_CONFIG,
    WATER_SPLASH_CONFIG
} from './waterParticleConfig';
export {
    MOTION_PATTERNS,
    type ParticleMotionFunction,
    type MotionPatternName
} from './particleMotionPatterns';

/**
 * Visual Effect Presets - Easy-to-use preset configurations
 */
import { DAMAGE_NUMBER_CONFIG } from './damageNumberConfig';
import { FLASH_EFFECT_CONFIG } from './flashEffectConfig';
import { FLOATING_TEXT_CONFIG } from './floatingTextConfig';

export const VFX_PRESETS = {
    // Damage presets
    DAMAGE_PHYSICAL: {
        type: 'damage',
        color: DAMAGE_NUMBER_CONFIG.colors.physical
    },
    DAMAGE_MAGICAL: {
        type: 'damage',
        color: DAMAGE_NUMBER_CONFIG.colors.magical
    },
    DAMAGE_CRITICAL: {
        type: 'damage',
        color: DAMAGE_NUMBER_CONFIG.colors.critical,
        scale: DAMAGE_NUMBER_CONFIG.criticalScale,
        duration: DAMAGE_NUMBER_CONFIG.criticalDuration
    },
    HEALING: {
        type: 'damage',
        color: DAMAGE_NUMBER_CONFIG.colors.healing
    },
    
    // Flash presets
    FLASH_DAMAGE: FLASH_EFFECT_CONFIG.damage,
    FLASH_HEAL: FLASH_EFFECT_CONFIG.heal,
    FLASH_CRITICAL: FLASH_EFFECT_CONFIG.critical,
    FLASH_POWERUP: FLASH_EFFECT_CONFIG.powerup,
    FLASH_DEATH: FLASH_EFFECT_CONFIG.death,
    
    // Text presets
    TEXT_XP: {
        type: 'text',
        color: FLOATING_TEXT_CONFIG.colors.xp
    },
    TEXT_LEVEL_UP: {
        type: 'text',
        color: FLOATING_TEXT_CONFIG.colors.levelUp
    },
    TEXT_RESOURCE: {
        type: 'text',
        color: FLOATING_TEXT_CONFIG.colors.resource
    }
} as const;
