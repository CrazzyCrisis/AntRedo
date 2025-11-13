// Utility helper functions

// Generate random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Map value from one range to another
function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Check if point is inside rectangle
function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// Check if point is inside circle
function pointInCircle(px, py, cx, cy, radius) {
    return distance(px, py, cx, cy) <= radius;
}

// Check if two rectangles intersect
function rectIntersect(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
    return !(r2x > r1x + r1w || r2x + r2w < r1x || r2y > r1y + r1h || r2y + r2h < r1y);
}

// Check if two circles intersect
function circleIntersect(c1x, c1y, r1, c2x, c2y, r2) {
    return distance(c1x, c1y, c2x, c2y) <= r1 + r2;
}

// Generate random float between min and max
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Pick random element from array
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Calculate angle between two points (in radians)
function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Convert degrees to radians
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

// Normalize angle to range [0, 2π)
function normalizeAngle(angle) {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
}

// Deep clone an object (simple version)
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Debounce function calls
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Throttle function calls
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// Format time in MM:SS format
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate percentage
function percentage(value, total) {
    return total === 0 ? 0 : (value / total) * 100;
}

// Ease functions for animations
const ease = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1)
};

// Grid/Tile utilities
function worldToGrid(x, y, tileSize) {
    return {
        col: Math.floor(x / tileSize),
        row: Math.floor(y / tileSize)
    };
}

function gridToWorld(col, row, tileSize) {
    return {
        x: col * tileSize,
        y: row * tileSize
    };
}

function gridToWorldCenter(col, row, tileSize) {
    return {
        x: col * tileSize + tileSize / 2,
        y: row * tileSize + tileSize / 2
    };
}

// Get neighboring grid cells (4-directional)
function getNeighbors4(col, row) {
    return [
        { col: col, row: row - 1 },     // top
        { col: col + 1, row: row },     // right
        { col: col, row: row + 1 },     // bottom
        { col: col - 1, row: row }      // left
    ];
}

// Get neighboring grid cells (8-directional)
function getNeighbors8(col, row) {
    return [
        { col: col - 1, row: row - 1 }, // top-left
        { col: col, row: row - 1 },     // top
        { col: col + 1, row: row - 1 }, // top-right
        { col: col + 1, row: row },     // right
        { col: col + 1, row: row + 1 }, // bottom-right
        { col: col, row: row + 1 },     // bottom
        { col: col - 1, row: row + 1 }, // bottom-left
        { col: col - 1, row: row }      // left
    ];
}

// Vector utilities (useful for p5.Vector)
function vectorMagnitude(x, y) {
    return Math.sqrt(x * x + y * y);
}

function vectorNormalize(x, y) {
    const mag = vectorMagnitude(x, y);
    return mag > 0 ? { x: x / mag, y: y / mag } : { x: 0, y: 0 };
}

function vectorLimit(x, y, max) {
    const mag = vectorMagnitude(x, y);
    if (mag > max) {
        const normalized = vectorNormalize(x, y);
        return { x: normalized.x * max, y: normalized.y * max };
    }
    return { x, y };
}

// Calculate Manhattan distance (grid distance)
function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

// Check if value is within range
function inRange(value, min, max) {
    return value >= min && value <= max;
}

// Wrap value around min/max (useful for toroidal worlds)
function wrap(value, min, max) {
    const range = max - min;
    return value < min ? max - (min - value) % range : min + (value - min) % range;
}

// Color utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    return rgbToHex(
        Math.round(lerp(c1.r, c2.r, t)),
        Math.round(lerp(c1.g, c2.g, t)),
        Math.round(lerp(c1.b, c2.b, t))
    );
}

// FPS counter
class FPSCounter {
    constructor() {
        this.frames = [];
        this.lastTime = Date.now();
    }
    
    update() {
        const now = Date.now();
        this.frames.push(now);
        // Keep only last second of frames
        while (this.frames.length > 0 && this.frames[0] < now - 1000) {
            this.frames.shift();
        }
        this.lastTime = now;
    }
    
    getFPS() {
        return this.frames.length;
    }
}

// Simple timer class
class Timer {
    constructor(duration) {
        this.duration = duration;
        this.elapsed = 0;
        this.running = false;
    }
    
    start() {
        this.running = true;
        this.elapsed = 0;
    }
    
    stop() {
        this.running = false;
    }
    
    reset() {
        this.elapsed = 0;
    }
    
    update(deltaTime) {
        if (this.running) {
            this.elapsed += deltaTime;
        }
    }
    
    isFinished() {
        return this.elapsed >= this.duration;
    }
    
    getProgress() {
        return clamp(this.elapsed / this.duration, 0, 1);
    }
}

// Simple state machine helper
class StateMachine {
    constructor(initialState) {
        this.currentState = initialState;
        this.previousState = null;
    }
    
    setState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
    }
    
    is(state) {
        return this.currentState === state;
    }
    
    wasState(state) {
        return this.previousState === state;
    }
}

// Array chunk utility
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// Remove element from array
function removeFromArray(array, element) {
    const index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}

// Weighted random choice
function weightedRandomChoice(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    return items[items.length - 1];
}

// Check if arrays are equal
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value === arr2[index]);
}

// Get unique values from array
function uniqueArray(array) {
    return [...new Set(array)];
}

// Sum array values
function sumArray(array) {
    return array.reduce((sum, val) => sum + val, 0);
}

// Average array values
function averageArray(array) {
    return array.length === 0 ? 0 : sumArray(array) / array.length;
}
