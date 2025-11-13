// Main p5.js sketch file
// This file needs to remain compatible with p5.js global mode
// p5.js types are declared globally through @types/p5

import { CONFIG } from './config';
import { EventBus, GameEvents } from './utils/eventBus';

// Declare p5.js global functions and variables
declare const createCanvas: any;
declare const frameRate: any;
declare const background: any;
declare const keyCode: any;
declare const key: any;
declare const mouseX: any;
declare const mouseY: any;
declare const mouseButton: any;

// let gameManager: any; // Uncomment when GameManager class is created

function preload() {
    // Load assets (images, sounds, etc.)
}

function setup() {
    createCanvas(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    frameRate(CONFIG.FPS);
    
    // gameManager = new GameManager();
    // gameManager.init();
    
    EventBus.emit(GameEvents.GAME_START);
}

function draw() {
    background(CONFIG.COLORS.BACKGROUND);
    
    // if (gameManager) {
    //     gameManager.update();
    //     gameManager.render();
    // }
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
    
    // if (gameManager) {
    //     gameManager.handleMousePressed();
    // }
}

function mouseMoved() {
    EventBus.emit(GameEvents.INPUT_MOUSE_MOVE, mouseX, mouseY);
}

// Make functions available to p5.js
(window as any).preload = preload;
(window as any).setup = setup;
(window as any).draw = draw;
(window as any).keyPressed = keyPressed;
(window as any).keyReleased = keyReleased;
(window as any).mousePressed = mousePressed;
(window as any).mouseMoved = mouseMoved;
