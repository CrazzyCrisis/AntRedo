/**
 * Audio Configuration
 * Defines all sound files and event mappings
 */

import { GameEvents } from '../utils/eventBus';

/**
 * Sound definitions with file paths and default volumes
 */
export const AUDIO_SOUNDS = {
    // Music/BGM
    MENU_THEME: { file: 'assets/sounds/bgMusic.mp3', volume: 0.8 },
    DEV_ROOM_THEME: { file: 'assets/sounds/Prison.mp3', volume: 0.7 },
    BOSS_THEME: { file: 'assets/sounds/music/boss_theme.mp3', volume: 0.9 },
    
    // UI sounds
    BUTTON_CLICK: { file: 'assets/sounds/ui_click.wav', volume: 0.5 },
    BUTTON_HOVER: { file: 'assets/sounds/ui_hover.wav', volume: 0.3 },
    MENU_OPEN: { file: 'assets/sounds/menu_open.wav', volume: 0.4 },
    MENU_CLOSE: { file: 'assets/sounds/menu_close.wav', volume: 0.4 },
    
    // Ant sounds
    ANT_HIT: { file: 'assets/sounds/ant_hit.wav', volume: 0.5 },
    ANT_DEATH: { file: 'assets/sounds/ant_death.wav', volume: 0.6 },
    ANT_ATTACK: { file: 'assets/sounds/ant_attack.wav', volume: 0.5 },
    
    // Queen powers
    FIREBALL: { file: 'assets/sounds/fireball.wav', volume: 0.7 },
    LIGHTNING: { file: 'assets/sounds/lightning.wav', volume: 0.8 },
    BLACKHOLE: { file: 'assets/sounds/blackhole.wav', volume: 0.7 },
    TIDALWAVE: { file: 'assets/sounds/tidalwave.wav', volume: 0.7 },
    FINALFLASH: { file: 'assets/sounds/finalflash.wav', volume: 0.8 },
    
    // Building sounds
    BUILDING_PLACE: { file: 'assets/sounds/building_place.wav', volume: 0.6 },
    BUILDING_COMPLETE: { file: 'assets/sounds/building_complete.wav', volume: 0.6 },
    BUILDING_DESTROY: { file: 'assets/sounds/building_destroy.wav', volume: 0.6 },
    
    // Resource sounds
    RESOURCE_COLLECT: { file: 'assets/sounds/resource_collect.wav', volume: 0.5 },
    RESOURCE_DEPOSIT: { file: 'assets/sounds/resource_deposit.wav', volume: 0.5 },
    
    // Combat sounds
    PROJECTILE_FIRE: { file: 'assets/sounds/projectile_fire.wav', volume: 0.5 },
    PROJECTILE_HIT: { file: 'assets/sounds/projectile_hit.wav', volume: 0.6 },
    EXPLOSION: { file: 'assets/sounds/explosion.wav', volume: 0.7 },
    
    // Boss sounds
    BOSS_SPAWN: { file: 'assets/sounds/boss_spawn.wav', volume: 0.8 },
    BOSS_DEATH: { file: 'assets/sounds/boss_death.wav', volume: 0.8 },
    BOSS_ATTACK: { file: 'assets/sounds/boss_attack.wav', volume: 0.7 }
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
    MUSIC: ['MENU_THEME', 'DEV_ROOM_THEME', 'BOSS_THEME'],
    SFX: [
        'ANT_HIT', 'ANT_DEATH', 'ANT_ATTACK',
        'BUILDING_PLACE', 'BUILDING_COMPLETE', 'BUILDING_DESTROY',
        'RESOURCE_COLLECT', 'RESOURCE_DEPOSIT',
        'PROJECTILE_FIRE', 'PROJECTILE_HIT', 'EXPLOSION',
        'BOSS_SPAWN', 'BOSS_DEATH', 'BOSS_ATTACK',
        'FIREBALL', 'LIGHTNING', 'BLACKHOLE', 'TIDALWAVE', 'FINALFLASH'
    ],
    UI: [
        'BUTTON_CLICK', 'BUTTON_HOVER', 'MENU_OPEN', 'MENU_CLOSE'
    ]
} as const;

export type SoundKey = keyof typeof AUDIO_SOUNDS;
export type AudioCategory = keyof typeof AUDIO_CATEGORIES;
