/**
 * Core Game Configuration
 * Basic game constants and settings
 * Migrated from root config.ts for consistent organization
 */

interface GameConfig {
    CANVAS_WIDTH: number;
    CANVAS_HEIGHT: number;
    DEBUG_MODE: boolean;
    PLAYER_SPEED: number;
    ENEMY_SPEED: number;
    GRAVITY: number;
    COLORS: {
        BACKGROUND: string;
        PLAYER: string;
        ENEMY: string;
        UI: string;
    };
}

export const CONFIG: GameConfig = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    DEBUG_MODE: false,
    
    // Game settings
    PLAYER_SPEED: 5,
    ENEMY_SPEED: 3,
    GRAVITY: 0.5,
    
    // Colors
    COLORS: {
        BACKGROUND: '#222222',
        PLAYER: '#00FF00',
        ENEMY: '#FF0000',
        UI: '#FFFFFF'
    }
};
