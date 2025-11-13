// Main p5.js sketch file
// This file needs to remain compatible with p5.js global mode
// p5.js types are declared globally through @types/p5

import { CONFIG } from './config';
import { EventBus, GameEvents } from './utils/eventBus';
import { SceneManager } from './managers/SceneManager';
import { Renderer } from './rendering/Renderer';
import { MenuScene } from './scenes/MenuScene';

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
} | null = null;

function preload() {
    // Load menu assets
    menuImages = {
        title: loadImage('assets/images/menu/ant_logo3.png'),
        playButton: loadImage('assets/images/menu/play_button.png'),
        optionsButton: loadImage('assets/images/menu/options_button.png'),
        exitButton: loadImage('assets/images/menu/exit_button.png')
    };
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
