/**
 * Audio Configuration
 * Defines all sound files and event mappings
 */

import { GameEvents } from '../utils/eventBus';

/**
 * Sound definitions with file paths and default volumes
 * Use assets/sounds/uiSounds/clicking/clickSound.mp3 for a default sound and replace later so the system does 
 * not silently fail to find a sound
 */
export const AUDIO_SOUNDS = {
    // =================================== Background Music ===================================

    MENU_THEME: { file: 'assets/sounds/bgMusic.mp3', volume: 1.0 },
    DEV_ROOM_THEME: { file: 'assets/sounds/prison.mp3', volume: 1.0 },
    BOSS_THEME: { file: 'assets/sounds/soundEffects/antNoises/focusedByPlayer/dabuu.wav', volume: 0.01 },

    // ==================================== Ant Sounds ====================================

    // Ants when focused_VOICE
    ANT_FOCUSED_1: { file: 'assets/sounds/soundEffects/antNoises/focusedByPlayer/dabuu.wav', volume: 1.0 },
    ANT_FOCUSED_2: { file: 'assets/sounds/soundEffects/antNoises/focusedByPlayer/scree.wav', volume: 1.0 },
    ANT_FOCUSED_3: { file: 'assets/sounds/soundEffects/antNoises/focusedByPlayer/zug.wav', volume: 1.0 },

    // Ants when attacked_VOICE
    ANT_ATTACKED_1: { file: 'assets/sounds/soundEffects/antNoises/attacking/forTheQueen.mp3', volume: 0.5 },
    ANT_ATTACKED_2: { file: 'assets/sounds/soundEffects/antNoises/attacking/hissssss.wav', volume: 0.5 },

    // Ant SFX sounds
    ANT_HIT: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.5 },
    ANT_DEATH: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.6 },
    ANT_ATTACK: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.5 },

    // =================================== Queen Sounds =======================================

    // Queen powers_SFX
    FIREBALL: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.7 },
    LIGHTNING: { file: 'assets/sounds/lightning_strike.wav', volume: 0.5 },
    BLACKHOLE: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.7 },
    TIDALWAVE: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.7 },
    FINALFLASH: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.8 },
    // =================================== Boss Sounds =========================================

    BOSS_SPAWN: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.8 },
    BOSS_DEATH: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.8 },
    BOSS_ATTACK: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.7 },

    // =================================== Building Sounds =====================================

    BUILDING_PLACE: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.6 },
    BUILDING_COMPLETE: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.6 },
    BUILDING_DESTROY: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.6 },

    // =================================== UI Sounds =====================================

    BUTTON_CLICK: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.5 },
    BUTTON_HOVER: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.3 },
    MENU_OPEN: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.4 },
    MENU_CLOSE: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.4 },

    // =================================== Combat Sounds =====================================

    PROJECTILE_FIRE: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.5 },
    PROJECTILE_HIT: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.6 },
    EXPLOSION: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.7 },

    // =================================== Resource Sounds =====================================

    RESOURCE_COLLECT: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.5 },
    RESOURCE_DEPOSIT: { file: 'assets/sounds/uiSounds/clicking/clickSound.mp3', volume: 0.5 },

} as const;

/**
 * Event to sound mappings
 * Maps GameEvents to sound keys
 */
export const AUDIO_EVENT_MAPPINGS: Record<string, keyof typeof AUDIO_SOUNDS> = {
    // UI events
    [GameEvents.UI_BUTTON_CLICK]: 'BUTTON_CLICK',
    [GameEvents.UI_MENU_OPEN]: 'MENU_OPEN',
    [GameEvents.UI_MENU_CLOSE]: 'MENU_CLOSE',
    
    // Ant events
    [GameEvents.ANT_ATTACKED]: 'ANT_HIT',
    [GameEvents.ANT_DIED]: 'ANT_DEATH',
    [GameEvents.ENTITY_ATTACKED]: 'ANT_ATTACK',
    
    // Queen power events
    [GameEvents.FIREBALL_EXPLODE]: 'FIREBALL',
    [GameEvents.LIGHTNING_STRIKE]: 'LIGHTNING',
    [GameEvents.BLACKHOLE_ACTIVATED]: 'BLACKHOLE',
    [GameEvents.TIDALWAVE_ACTIVATED]: 'TIDALWAVE',
    [GameEvents.FINALFLASH_ACTIVATED]: 'FINALFLASH',
    
    // Building events
    [GameEvents.BUILDING_PLACED]: 'BUILDING_PLACE',
    [GameEvents.BUILDING_COMPLETED]: 'BUILDING_COMPLETE',
    [GameEvents.BUILDING_DESTROYED]: 'BUILDING_DESTROY',
    
    // Resource events
    [GameEvents.RESOURCE_COLLECTED]: 'RESOURCE_COLLECT',
    [GameEvents.RESOURCE_DEPOSITED]: 'RESOURCE_DEPOSIT',
    
    // Combat events
    [GameEvents.PROJECTILE_SPAWNED]: 'PROJECTILE_FIRE',
    [GameEvents.PROJECTILE_HIT]: 'PROJECTILE_HIT',
    
    // Boss events
    [GameEvents.BOSS_SPAWNED]: 'BOSS_SPAWN',
    [GameEvents.BOSS_DIED]: 'BOSS_DEATH',
    [GameEvents.BOSS_ATTACKED]: 'BOSS_ATTACK'


};

/**
 * Sound categories for grouped volume control
 */
export const AUDIO_CATEGORIES = {
    BGM: ['MENU_THEME', 'DEV_ROOM_THEME', 'BOSS_THEME'],
    SFX: [
        'ANT_HIT', 'ANT_DEATH', 'ANT_ATTACK',
        'BUILDING_PLACE', 'BUILDING_COMPLETE', 'BUILDING_DESTROY',
        'RESOURCE_COLLECT', 'RESOURCE_DEPOSIT',
        'PROJECTILE_FIRE', 'PROJECTILE_HIT', 'EXPLOSION',
        'BOSS_SPAWN', 'BOSS_DEATH', 'BOSS_ATTACK',
        'FIREBALL', 'LIGHTNING', 'BLACKHOLE', 'TIDALWAVE', 'FINALFLASH'
    ],
    SYSTEM: [
        'BUTTON_CLICK', 'BUTTON_HOVER', 'MENU_OPEN', 'MENU_CLOSE'
    ],
    VOICE: [
        'ANT_FOCUSED_1', 'ANT_FOCUSED_2', 'ANT_FOCUSED_3',
        'ANT_ATTACKED_1', 'ANT_ATTACKED_2'
    ]
} as const;

export type SoundKey = keyof typeof AUDIO_SOUNDS;
export type AudioCategory = keyof typeof AUDIO_CATEGORIES;
