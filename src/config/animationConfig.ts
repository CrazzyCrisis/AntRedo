/**
 * Animation Configuration
 * Centralized animation data for all entity types (config-first philosophy)
 * 
 * Each animation specifies:
 * - row: Grid row in spritesheet (0-indexed)
 * - startCol: Starting column (0-indexed)
 * - endCol: Ending column (inclusive)
 * - frameWidth: Width of each frame in pixels
 * - frameHeight: Height of each frame in pixels
 * - speed: Game frames between animation frames (higher = slower)
 * - loop: Loop animation (true) or play once (false)
 */

import { AntJobComponent } from '../classes/components/AntJobComponent';
import { AnimationConfig } from '../rendering/components/AnimatedSpriteSheetComponent';

/**
 * Ant animations by job type
 * PLACEHOLDER VALUES - tune during testing after inspecting spritesheets
 */
export const ANT_ANIMATIONS = {
    // Default/Gatherer ant
    DEFAULT: {
        idle: {
            row: 0,
            startCol: 0,
            endCol: 0,
            frameWidth: 16,
            frameHeight: 16,
            speed: 30,  // Slowed down for testing visibility
            loop: true
        } as AnimationConfig,
        walk: {
            row: 0,
            startCol: 2,
            endCol: 5,
            frameWidth: 16,
            frameHeight: 16,
            speed: 15,  // Slowed down for testing visibility
            loop: true
        } as AnimationConfig,
        attack: {
            row: 1,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 3,
            loop: true
        } as AnimationConfig,
        gather: {
            row: 1,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 5,
            loop: true
        } as AnimationConfig,
        build: {
            row: 2,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 6,
            loop: true
        } as AnimationConfig,
        die: {
            row: 2,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: false // One-shot
        } as AnimationConfig
    },

    // Warrior ant
    WARRIOR: {
        idle: {
            row: 0,
            startCol: 0,
            endCol: 0,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: true
        } as AnimationConfig,
        walk: {
            row: 0,
            startCol: 2,
            endCol: 5,
            frameWidth: 16,
            frameHeight: 16,
            speed: 4,
            loop: true
        } as AnimationConfig,
        attack: {
            row: 1,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 2, // Faster attacks
            loop: true
        } as AnimationConfig,
        gather: {
            row: 1,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 5,
            loop: true
        } as AnimationConfig,
        build: {
            row: 2,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 6,
            loop: true
        } as AnimationConfig,
        die: {
            row: 2,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: false
        } as AnimationConfig
    },

    // Scout ant (faster animations)
    SCOUT: {
        idle: {
            row: 0,
            startCol: 0,
            endCol: 0,
            frameWidth: 16,
            frameHeight: 16,
            speed: 6, // Slightly faster idle
            loop: true
        } as AnimationConfig,
        walk: {
            row: 0,
            startCol: 2,
            endCol: 5,
            frameWidth: 16,
            frameHeight: 16,
            speed: 3, // Faster walk
            loop: true
        } as AnimationConfig,
        attack: {
            row: 1,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 3,
            loop: true
        } as AnimationConfig,
        gather: {
            row: 1,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 4, // Faster gathering
            loop: true
        } as AnimationConfig,
        build: {
            row: 2,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 5,
            loop: true
        } as AnimationConfig,
        die: {
            row: 2,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: false
        } as AnimationConfig
    },

    // Farmer ant
    FARMER: {
        idle: {
            row: 0,
            startCol: 0,
            endCol: 0,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: true
        } as AnimationConfig,
        walk: {
            row: 0,
            startCol: 2,
            endCol: 5,
            frameWidth: 16,
            frameHeight: 16,
            speed: 4,
            loop: true
        } as AnimationConfig,
        attack: {
            row: 1,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 4,
            loop: true
        } as AnimationConfig,
        gather: {
            row: 1,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 4, // Faster at gathering (specialist)
            loop: true
        } as AnimationConfig,
        build: {
            row: 2,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 6,
            loop: true
        } as AnimationConfig,
        die: {
            row: 2,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: false
        } as AnimationConfig
    },

    // Builder ant
    BUILDER: {
        idle: {
            row: 0,
            startCol: 0,
            endCol: 0,  // Single frame only
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: true
        } as AnimationConfig,
        walk: {
            row: 1,
            startCol: 0,
            endCol: 1,
            frameWidth: 16,
            frameHeight: 16,
            speed: 10,
            loop: true
        } as AnimationConfig,
        attack: {
            row: 3,
            startCol: 0,
            endCol: 1,
            frameWidth: 16,
            frameHeight: 16,
            speed: 4,
            loop: true
        } as AnimationConfig,
        gather: {
            row: 2,
            startCol: 0,
            endCol: 1,
            frameWidth: 16,
            frameHeight: 16,
            speed: 6,
            loop: true
        } as AnimationConfig,
        build: {
            row: 3,
            startCol: 0,
            endCol: 1,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: true
        } as AnimationConfig,
        die: {
            row: 0,
            startCol: 0,
            endCol: 0,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: false
        } as AnimationConfig
    },

    // Spitter ant (ranged attacker)
    SPITTER: {
        idle: {
            row: 0,
            startCol: 0,
            endCol: 0,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: true
        } as AnimationConfig,
        walk: {
            row: 0,
            startCol: 2,
            endCol: 5,
            frameWidth: 16,
            frameHeight: 16,
            speed: 4,
            loop: true
        } as AnimationConfig,
        attack: {
            row: 1,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 5, // Ranged attack animation
            loop: true
        } as AnimationConfig,
        gather: {
            row: 1,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 5,
            loop: true
        } as AnimationConfig,
        build: {
            row: 2,
            startCol: 0,
            endCol: 3,
            frameWidth: 16,
            frameHeight: 16,
            speed: 6,
            loop: true
        } as AnimationConfig,
        die: {
            row: 2,
            startCol: 4,
            endCol: 7,
            frameWidth: 16,
            frameHeight: 16,
            speed: 8,
            loop: false
        } as AnimationConfig
    }
};

/**
 * Queen animations
 * PLACEHOLDER VALUES - tune after inspecting Queen.png
 */
export const QUEEN_ANIMATIONS = {
    idle: {
        row: 0,
        startCol: 0,
        endCol: 1,
        frameWidth: 48, // Larger than worker ants
        frameHeight: 48,
        speed: 10, // Slower, regal movement
        loop: true
    } as AnimationConfig,
    walk: {
        row: 0,
        startCol: 2,
        endCol: 5,
        frameWidth: 48,
        frameHeight: 48,
        speed: 6,
        loop: true
    } as AnimationConfig,
    attack: {
        row: 1,
        startCol: 0,
        endCol: 3,
        frameWidth: 48,
        frameHeight: 48,
        speed: 4,
        loop: true
    } as AnimationConfig,
    gather: {
        row: 1,
        startCol: 4,
        endCol: 7,
        frameWidth: 48,
        frameHeight: 48,
        speed: 8,
        loop: true
    } as AnimationConfig,
    build: {
        row: 2,
        startCol: 0,
        endCol: 3,
        frameWidth: 48,
        frameHeight: 48,
        speed: 8,
        loop: true
    } as AnimationConfig,
    die: {
        row: 2,
        startCol: 4,
        endCol: 7,
        frameWidth: 48,
        frameHeight: 48,
        speed: 12, // Dramatic death
        loop: false
    } as AnimationConfig
};

/**
 * Boss (spider) animations
 * PLACEHOLDER VALUES - tune after inspecting spider sprites
 */
export const BOSS_ANIMATIONS = {
    idle: {
        row: 0,
        startCol: 0,
        endCol: 1,
        frameWidth: 64, // Large boss
        frameHeight: 64,
        speed: 12,
        loop: true
    } as AnimationConfig,
    walk: {
        row: 0,
        startCol: 2,
        endCol: 5,
        frameWidth: 64,
        frameHeight: 64,
        speed: 5,
        loop: true
    } as AnimationConfig,
    attack: {
        row: 1,
        startCol: 0,
        endCol: 3,
        frameWidth: 64,
        frameHeight: 64,
        speed: 3,
        loop: true
    } as AnimationConfig,
    gather: {
        row: 1,
        startCol: 4,
        endCol: 7,
        frameWidth: 64,
        frameHeight: 64,
        speed: 6,
        loop: true
    } as AnimationConfig,
    build: {
        row: 2,
        startCol: 0,
        endCol: 3,
        frameWidth: 64,
        frameHeight: 64,
        speed: 8,
        loop: true
    } as AnimationConfig,
    die: {
        row: 2,
        startCol: 4,
        endCol: 7,
        frameWidth: 64,
        frameHeight: 64,
        speed: 10,
        loop: false
    } as AnimationConfig
};

/**
 * Job type to animation config mapping
 * Used by AntFactory to select correct animations
 * Note: FARMER and SPITTER use DEFAULT/WARRIOR anims as placeholders
 */
export const JOB_TO_ANIMATION_MAP = {
    [AntJobComponent.JOB_GATHERER]: ANT_ANIMATIONS.DEFAULT,
    [AntJobComponent.JOB_WARRIOR]: ANT_ANIMATIONS.WARRIOR,
    [AntJobComponent.JOB_SCOUT]: ANT_ANIMATIONS.SCOUT,
    [AntJobComponent.JOB_BUILDER]: ANT_ANIMATIONS.BUILDER
};

/**
 * Job type to spritesheet name mapping
 * Used to load correct spritesheet per job
 * Note: FARMER and SPITTER use default/warrior sprites as placeholders
 */
export const JOB_TO_SPRITESHEET_MAP = {
    [AntJobComponent.JOB_GATHERER]: 'default',
    [AntJobComponent.JOB_WARRIOR]: 'warrior',
    [AntJobComponent.JOB_SCOUT]: 'scout',
    [AntJobComponent.JOB_BUILDER]: 'builder'
};
