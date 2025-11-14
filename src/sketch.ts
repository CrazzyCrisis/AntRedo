// Main p5.js sketch file
// This file needs to remain compatible with p5.js global mode
// p5.js types are declared globally through @types/p5

import { CONFIG } from './config';
import { EventBus, GameEvents } from './utils/eventBus';
import { SceneManager } from './managers/SceneManager';
import { Renderer } from './rendering/Renderer';
import { MenuScene } from './scenes/MenuScene';
import { DevRoomScene } from './scenes/DevRoomScene';
import { TILE_SPRITE_MAP, TILE_SPRITE_BASE_PATH } from './config/spriteMapping';
import { TileType } from './world/TileSystem';
import { TileEdgeSystem } from './world/TileEdgeSystem';

// Declare p5.js global functions and variables
declare const createCanvas: any;
declare const frameRate: any;
declare const background: any;
declare const keyCode: any;
declare const key: any;
declare const mouseX: any;
declare const mouseY: any;
declare const mouseButton: any;
declare const resizeCanvas: any;
declare const loadImage: any;

// Global renderer instance
let renderer: Renderer;

// Preloaded menu images
let menuImages: {
    title: any;
    playButton: any;
    optionsButton: any;
    exitButton: any;
    videoSettingsButton: any;
    audioSettingsButton: any;
    controlsButton: any;
    backButton: any;
    devRoomButton: any;
    startGameButton: any;
    levelEditorButton: any;
} | null = null;

// Preloaded tile sprites
let tileSprites: { [key: number]: any } | null = null;

// Preloaded tile edge sprites (keyed by full path)
let tileEdgeSprites: { [path: string]: any } | null = null;

function preload() {
    // Load menu assets
    menuImages = {
        title: loadImage('assets/images/menu/ant_logo3.png'),
        playButton: loadImage('assets/images/menu/play_button.png'),
        optionsButton: loadImage('assets/images/menu/options_button.png'),
        exitButton: loadImage('assets/images/menu/exit_button.png'),
        videoSettingsButton: loadImage('assets/images/menu/vs_button.png'),
        audioSettingsButton: loadImage('assets/images/menu/as_button.png'),
        controlsButton: loadImage('assets/images/menu/controls_button.png'),
        backButton: loadImage('assets/images/menu/back_button.png'),
        devRoomButton: loadImage('assets/images/menu/dev_room_button.png'),
        startGameButton: loadImage('assets/images/menu/start_game_button.png'),
        levelEditorButton: loadImage('assets/images/menu/level_editor_button.png'),
    };
    
    // Load tile sprites
    tileSprites = {};
    for (const tileTypeKey in TILE_SPRITE_MAP) {
        const tileType = parseInt(tileTypeKey) as TileType;
        const spritePath = TILE_SPRITE_BASE_PATH + TILE_SPRITE_MAP[tileType];
        tileSprites[tileType] = loadImage(spritePath);
    }
    
    // Load tile edge sprites
    tileEdgeSprites = {};
    for (const tileTypeKey in TILE_SPRITE_MAP) {
        const tileType = parseInt(tileTypeKey) as TileType;
        
        // Only load edges for tiles that support them
        if (TileEdgeSystem.supportsEdges(tileType)) {
            const edgePaths = TileEdgeSystem.getEdgeSpritePaths(tileType);
            for (const path of edgePaths) {
                tileEdgeSprites[path] = loadImage(path);
            }
        }
    }
    
    console.log('Assets preloaded: menu images, tile sprites, and edge sprites');
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    frameRate(CONFIG.FPS);
    
    // Create renderer
    renderer = new Renderer(window as any, window.innerWidth, window.innerHeight);
    
    // Create and set menu scene
    if (menuImages) {
        const menuScene = new MenuScene(renderer, window.innerWidth, window.innerHeight, menuImages);
        SceneManager.getInstance().switchScene(menuScene, 'Menu');
    }
    
    // Listen for dev room navigation
    EventBus.on(GameEvents.MENU_DEV_ROOM_CLICKED, () => {
        console.log('Switching to DevRoom scene...');
        if (menuImages && tileSprites && tileEdgeSprites) {
            const devRoomScene = new DevRoomScene(
                renderer, 
                window.innerWidth, 
                window.innerHeight,
                menuImages.backButton,
                tileSprites,
                tileEdgeSprites
            );
            SceneManager.getInstance().switchScene(devRoomScene, 'DevRoom');
        }
    });

    // Listen for back button in dev room
    EventBus.on(GameEvents.MENU_BACK_CLICKED, () => {
        const currentScene = SceneManager.getInstance().getCurrentScene();
        if (currentScene instanceof DevRoomScene && menuImages) {
            console.log('Returning to menu from DevRoom...');
            const menuScene = new MenuScene(renderer, window.innerWidth, window.innerHeight, menuImages);
            SceneManager.getInstance().switchScene(menuScene, 'Menu');
        }
    });
    
    EventBus.emit(GameEvents.GAME_START);
}

function draw() {
    background(CONFIG.COLORS.BACKGROUND);
    
    // Update current scene
    SceneManager.getInstance().update();
    
    // Render all layers
    renderer.render();
}

function keyPressed() {
    EventBus.emit(GameEvents.INPUT_KEY_PRESS, keyCode, key);
    
    // if (gameManager) {
    //     gameManager.handleKeyPressed(keyCode);
    // }
}

function keyReleased() {
    EventBus.emit(GameEvents.INPUT_KEY_RELEASE, keyCode, key);
    
    // if (gameManager) {
    //     gameManager.handleKeyReleased(keyCode);
    // }
}

function mousePressed() {
    EventBus.emit(GameEvents.INPUT_MOUSE_CLICK, mouseX, mouseY, mouseButton);
    
    // Forward to current scene
    SceneManager.getInstance().handleMouseClick(mouseX, mouseY);
    
    // if (gameManager) {
    //     gameManager.handleMousePressed();
    // }
}

function mouseMoved() {
    EventBus.emit(GameEvents.INPUT_MOUSE_MOVE, mouseX, mouseY);
    
    // Forward to current scene
    SceneManager.getInstance().handleMouseMove(mouseX, mouseY);
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    
    // Update renderer dimensions
    renderer.updateDimensions(window.innerWidth, window.innerHeight);
    
    // Recreate menu scene with new dimensions (if in menu)
    const currentScene = SceneManager.getInstance().getCurrentScene();
    if (currentScene instanceof MenuScene && menuImages) {
        const newMenuScene = new MenuScene(renderer, window.innerWidth, window.innerHeight, menuImages);
        SceneManager.getInstance().switchScene(newMenuScene, 'Menu');
    }
}

// Make functions available to p5.js
(window as any).preload = preload;
(window as any).setup = setup;
(window as any).draw = draw;
(window as any).keyPressed = keyPressed;
(window as any).keyReleased = keyReleased;
(window as any).mousePressed = mousePressed;
(window as any).mouseMoved = mouseMoved;
(window as any).windowResized = windowResized;
