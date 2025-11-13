// Main p5.js sketch file
let gameManager;

function preload() {
    // Load assets (images, sounds, etc.)
}

function setup() {
    createCanvas(800, 600);
    gameManager = new GameManager();
    gameManager.init();
}

function draw() {
    background(220);
    gameManager.update();
    gameManager.render();
}

function keyPressed() {
    gameManager.handleKeyPressed(keyCode);
}

function keyReleased() {
    gameManager.handleKeyReleased(keyCode);
}

function mousePressed() {
    gameManager.handleMousePressed();
}
