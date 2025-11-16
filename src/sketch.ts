// Main p5.js sketch file
// This file needs to remain compatible with p5.js global mode
// p5.js types are declared globally through @types/p5

import { CONFIG } from './config';
import { EventBus, GameEvents } from './utils/eventBus';
import { SceneManager } from './managers/SceneManager';
import { InputManager } from './managers/InputManager';
import { AudioManager } from './managers/AudioManager';
import { CameraManager } from './managers/CameraManager';
import { EntityManager } from './managers/EntityManager';
import { SpawnManager } from './managers/SpawnManager';
import { ResourceManager } from './managers/ResourceManager';
import { PowerManager } from './managers/PowerManager';
import { PathfindingManager } from './managers/PathfindingManager';
import { BuildingManager } from './managers/BuildingManager';
import { GameStateManager } from './managers/GameStateManager';
import { QueenFactory } from './factories/QueenFactory';
import { Renderer } from './rendering/Renderer';
import { Camera } from './rendering/Camera';
import { MenuScene } from './scenes/MenuScene';
import { DevRoomScene } from './scenes/DevRoomScene';
import { AudioSettingsScene } from './scenes/AudioSettingsScene';
import { TILE_SPRITE_MAP, TILE_SPRITE_BASE_PATH, ENTITY_SPRITES, getEntitySpritePath } from './config/spriteMapping';
import { TileType } from './world/TileSystem';
import { TileFrillSystem } from './world/TileEdgeSystem';
import { AUDIO_SOUNDS, SoundKey } from './config/audioConfig';
import { FPSCounter } from './utils/helpers';

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
declare const loadSound: any;

// Global renderer instance
let renderer: Renderer;

// Global camera instance
let camera: Camera;

// FPS counter
let fpsCounter: FPSCounter;

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

// Preloaded entity sprites for showcase scene
let entitySprites: {
    ant: any;
    queen: any;
    boss: any;
    building: any;
    hill1: any;
    hill2: any;
    hive1: any;
    hive2: any;
    cone1: any;
    cone2: any;
    resources: {
        food: any;
        wood: any;
        stone: any;
        magicCrystal: any;
    };
} | null = null;

// Preloaded entity spritesheets for animation system
let entitySpritesheets: {
    default: any;
    warrior: any;
    scout: any;
    builder: any;
    farmer: any;
    spitter: any;
    queen: any;
} | null = null;

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
    
    // Load entity sprites for showcase scene
    entitySprites = {
        ant: loadImage(getEntitySpritePath(ENTITY_SPRITES.ant)),
        queen: loadImage(getEntitySpritePath(ENTITY_SPRITES.queen)),
        boss: loadImage(getEntitySpritePath(ENTITY_SPRITES.boss)),
        building: loadImage(getEntitySpritePath(ENTITY_SPRITES.building)),
        hill1: loadImage(getEntitySpritePath(ENTITY_SPRITES.hill1)),
        hill2: loadImage(getEntitySpritePath(ENTITY_SPRITES.hill2)),
        hive1: loadImage(getEntitySpritePath(ENTITY_SPRITES.hive1)),
        hive2: loadImage(getEntitySpritePath(ENTITY_SPRITES.hive2)),
        cone1: loadImage(getEntitySpritePath(ENTITY_SPRITES.cone1)),
        cone2: loadImage(getEntitySpritePath(ENTITY_SPRITES.cone2)),
        resources: {
            food: loadImage(getEntitySpritePath(ENTITY_SPRITES.resources.food)),
            wood: loadImage(getEntitySpritePath(ENTITY_SPRITES.resources.wood)),
            stone: loadImage(getEntitySpritePath(ENTITY_SPRITES.resources.stone)),
            magicCrystal: loadImage(getEntitySpritePath(ENTITY_SPRITES.resources.magicCrystal))
        }
    };
    
    // Load entity spritesheets for animation system
    entitySpritesheets = {
        default: loadImage('assets/spriteSheets/Default.png'),
        warrior: loadImage('assets/spriteSheets/Warrior.png'),
        scout: loadImage('assets/spriteSheets/Scout.png'),
        builder: loadImage('assets/spriteSheets/Builder.png'),
        farmer: loadImage('assets/spriteSheets/Farmer.png'),
        spitter: loadImage('assets/spriteSheets/Spitter.png'),
        queen: loadImage('assets/spriteSheets/Queen.png')
    };
    
    // Load tile edge sprites (frills)
    tileEdgeSprites = {};
    for (const tileTypeKey in TILE_SPRITE_MAP) {
        const tileType = parseInt(tileTypeKey) as TileType;
        
        // Only load frill overlays for tiles that support them
        if (TileFrillSystem.supportsFrills(tileType)) {
            const frillPaths = TileFrillSystem.getFrillSpritePaths(tileType);
            for (const path of frillPaths) {
                tileEdgeSprites[path] = loadImage(path);
            }
        }
    }
    
    // Load audio files (optional - silently fails if files don't exist)
    const audioManager = AudioManager.getInstance();
    Object.entries(AUDIO_SOUNDS).forEach(([key, config]) => {
        try {
            // loadSound will fail silently if file doesn't exist
            // This allows development without audio assets
            const sound = loadSound(config.file, 
                () => {
                    audioManager.loadSound(key as SoundKey, sound);
                },
                () => {
                    // Silently fail - audio is optional during development
                }
            );
        } catch (error) {
            // Silently fail - audio is optional
        }
    });
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    frameRate(CONFIG.FPS);
    
    // Create renderer
    renderer = new Renderer(window as any, window.innerWidth, window.innerHeight);
    
    // Initialize camera
    camera = new Camera(0, 0, window.innerWidth, window.innerHeight);
    
    // Set camera deadzone (bounding box) - 200x150 pixels
    camera.setDeadzone(200, 150);
    
    // Initialize FPS counter
    fpsCounter = new FPSCounter();
    
    // Register camera with renderer and CameraManager (centralized control)
    renderer.setCamera(camera);
    CameraManager.getInstance().setCamera(camera);
    CameraManager.getInstance().setRenderer(renderer);
    
    // Initialize environment effects with renderer (for particle spawning)
    const { EnvironmentEffectsManager } = require('./managers/EnvironmentEffectsManager');
    EnvironmentEffectsManager.getInstance().setRenderer(renderer);
    
    // Initialize visual effects with renderer (for damage numbers, flash effects)
    const { VisualEffectsManager } = require('./managers/VisualEffectsManager');
    VisualEffectsManager.getInstance().setRenderer(renderer);
    
    // Initialize AudioManager with event-driven playback
    AudioManager.getInstance().initialize();
    
    // Create and set menu scene
    if (menuImages) {
        const menuScene = new MenuScene(
            renderer, 
            window.innerWidth, 
            window.innerHeight, 
            menuImages,
            tileSprites || undefined,
            tileEdgeSprites || undefined
        );
        SceneManager.getInstance().switchScene(menuScene, 'Menu');
    }
    
    // Listen for dev room navigation
    EventBus.on(GameEvents.MENU_DEV_ROOM_CLICKED, () => {

        if (menuImages && tileSprites && tileEdgeSprites) {
            const devRoomScene = new DevRoomScene(
                renderer, 
                window.innerWidth, 
                window.innerHeight,
                menuImages.backButton,
                tileSprites,
                tileEdgeSprites,
                entitySprites,
                entitySpritesheets
            );
            SceneManager.getInstance().switchScene(devRoomScene, 'DevRoom');
        }
    });

    // Listen for back button in dev room
    EventBus.on(GameEvents.MENU_BACK_CLICKED, () => {
        const currentScene = SceneManager.getInstance().getCurrentScene();
        if ((currentScene instanceof DevRoomScene || currentScene instanceof AudioSettingsScene) && menuImages) {

            
            // Comprehensive cleanup when leaving game scenes
            if (currentScene instanceof DevRoomScene) {

                
                // FIRST: Broadcast cleanup signal - all entities self-destruct
                //const listenerCount = EventBus.listenerCount(GameEvents.CLEANUP_ALL_ENTITIES);

                EventBus.emit(GameEvents.CLEANUP_ALL_ENTITIES);

                
                // THEN: Call scene exit() to unregister UI components

                currentScene.exit();
                
                // THEN: Mark all renderer layers dirty to clear framebuffers

                renderer.markAllLayersDirty();
                
                // THEN: Cleanup all managers (clears EventBus subscriptions)

                EntityManager.getInstance().cleanup();
                SpawnManager.getInstance().cleanup();
                ResourceManager.getInstance().cleanup();
                PowerManager.getInstance().cleanup();
                PathfindingManager.getInstance().cleanup();
                BuildingManager.getInstance().cleanup();
                GameStateManager.getInstance().cleanup();
                
                // THEN: Reset factory registries (allows new Queens to be created)

                QueenFactory.clearAll();
                
                // Reset camera to center

                camera.x = 0;
                camera.y = 0;
                

            }
            
            const menuScene = new MenuScene(
                renderer, 
                window.innerWidth, 
                window.innerHeight, 
                menuImages,
                tileSprites || undefined,
                tileEdgeSprites || undefined
            );
            SceneManager.getInstance().switchScene(menuScene, 'Menu');
        }
    });
    
    // Listen for audio settings navigation
    EventBus.on(GameEvents.MENU_AUDIO_SETTINGS_CLICKED, () => {

        if (menuImages) {
            const audioSettingsScene = new AudioSettingsScene(renderer, window.innerWidth, window.innerHeight, menuImages.backButton);
            SceneManager.getInstance().switchScene(audioSettingsScene, 'AudioSettings');
        }
    });
    
    EventBus.emit(GameEvents.GAME_START);
}

function draw() {
    background(CONFIG.COLORS.BACKGROUND);
    
    // Update FPS counter
    fpsCounter.update();
    
    // Update scene FIRST (checks input state)
    SceneManager.getInstance().update();
    
    // Update input manager LAST (clears just-pressed/released flags for next frame)
    InputManager.getInstance().update();
    
    // Render all layers
    renderer.render();
    
    // Draw FPS counter on top (only when not in main menu)
    const currentSceneName = SceneManager.getInstance().getCurrentSceneName();
    if (currentSceneName !== 'Menu') {
        drawFPSCounter();
    }
}

function drawFPSCounter() {
    const fps = fpsCounter.getFPS();
    const p5Instance = window as any;
    
    // Draw background box
    p5Instance.fill(0, 0, 0, 150);
    p5Instance.noStroke();
    p5Instance.rect(window.innerWidth - 80, 10, 70, 30);
    
    // Draw FPS text
    p5Instance.fill(fps >= 55 ? '#00FF00' : fps >= 30 ? '#FFFF00' : '#FF0000');
    p5Instance.textAlign(p5Instance.RIGHT, p5Instance.TOP);
    p5Instance.textSize(18);
    p5Instance.text(`${fps} FPS`, window.innerWidth - 15, 18);
}

function keyPressed() {
    // Feed input to InputManager for action binding
    InputManager.getInstance().handleKeyPress(key);
    
    EventBus.emit(GameEvents.INPUT_KEY_PRESS, keyCode, key);
    
    // Forward to scene manager
    SceneManager.getInstance().handleKeyPress(key);
    
    // if (gameManager) {
    //     gameManager.handleKeyPressed(keyCode);
    // }
}

function keyReleased() {
    // Feed key release to InputManager
    InputManager.getInstance().handleKeyRelease(key);
    
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

function mouseDragged() {
    EventBus.emit(GameEvents.INPUT_MOUSE_MOVE, mouseX, mouseY);
    
    // Forward to current scene (dragging is just move while pressed)
    SceneManager.getInstance().handleMouseMove(mouseX, mouseY);
}

function mouseReleased() {
    EventBus.emit(GameEvents.INPUT_MOUSE_RELEASE, mouseX, mouseY, mouseButton);
    
    // Forward to current scene
    SceneManager.getInstance().handleMouseUp(mouseX, mouseY);
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    
    // Update renderer dimensions (only if initialized)
    if (renderer) {
        renderer.updateDimensions(window.innerWidth, window.innerHeight);
        
        // Forward resize to current scene
        SceneManager.getInstance().handleResize(window.innerWidth, window.innerHeight);
    }
}

// Make functions available to p5.js (only in browser environment)
if (typeof window !== 'undefined') {
    (window as any).preload = preload;
    (window as any).setup = setup;
    (window as any).draw = draw;
    (window as any).keyPressed = keyPressed;
    (window as any).keyReleased = keyReleased;
    (window as any).mousePressed = mousePressed;
    (window as any).mouseMoved = mouseMoved;
    (window as any).mouseDragged = mouseDragged;
    (window as any).mouseReleased = mouseReleased;
    (window as any).windowResized = windowResized;
}

// Export preloaded assets for use in factories/scenes
export { menuImages, tileSprites, tileEdgeSprites, entitySprites };

// Helper to get entity spritesheet (accessed via window in browser)
export function getEntitySpritesheet(name: string): any {
    return entitySpritesheets ? (entitySpritesheets as any)[name] : null;
}
