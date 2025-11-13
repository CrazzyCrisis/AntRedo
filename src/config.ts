// Game configuration constants
interface GameConfig {
    CANVAS_WIDTH: number;
    CANVAS_HEIGHT: number;
    FPS: number;
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
    FPS: 60,
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
