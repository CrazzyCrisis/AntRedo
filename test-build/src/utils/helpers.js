"use strict";
// Utility helper functions
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachine = exports.Timer = exports.FPSCounter = exports.ease = void 0;
exports.randomInt = randomInt;
exports.distance = distance;
exports.clamp = clamp;
exports.lerp = lerp;
exports.mapRange = mapRange;
exports.pointInRect = pointInRect;
exports.pointInCircle = pointInCircle;
exports.rectIntersect = rectIntersect;
exports.circleIntersect = circleIntersect;
exports.randomFloat = randomFloat;
exports.randomChoice = randomChoice;
exports.shuffleArray = shuffleArray;
exports.angleBetween = angleBetween;
exports.degToRad = degToRad;
exports.radToDeg = radToDeg;
exports.normalizeAngle = normalizeAngle;
exports.perpendicularAngle = perpendicularAngle;
exports.fadeOutAlpha = fadeOutAlpha;
exports.fadeInAlpha = fadeInAlpha;
exports.deepClone = deepClone;
exports.debounce = debounce;
exports.throttle = throttle;
exports.formatTime = formatTime;
exports.percentage = percentage;
exports.worldToGrid = worldToGrid;
exports.gridToWorld = gridToWorld;
exports.gridToWorldCenter = gridToWorldCenter;
exports.getNeighbors4 = getNeighbors4;
exports.getNeighbors8 = getNeighbors8;
exports.vectorMagnitude = vectorMagnitude;
exports.vectorNormalize = vectorNormalize;
exports.vectorLimit = vectorLimit;
exports.manhattanDistance = manhattanDistance;
exports.inRange = inRange;
exports.wrap = wrap;
exports.hexToRgb = hexToRgb;
exports.rgbToHex = rgbToHex;
exports.lerpColor = lerpColor;
exports.chunkArray = chunkArray;
exports.removeFromArray = removeFromArray;
exports.weightedRandomChoice = weightedRandomChoice;
exports.arraysEqual = arraysEqual;
exports.uniqueArray = uniqueArray;
exports.sumArray = sumArray;
exports.averageArray = averageArray;
exports.getEntitiesInRadius = getEntitiesInRadius;
exports.isEntityEnemy = isEntityEnemy;
exports.distanceFalloff = distanceFalloff;
exports.calculatePushForce = calculatePushForce;
exports.setupEntitySpriteBinding = setupEntitySpriteBinding;
exports.emitEntityEvent = emitEntityEvent;
exports.destroyAndEmit = destroyAndEmit;
exports.drawRadialCooldown = drawRadialCooldown;
exports.drawUIPanel = drawUIPanel;
exports.formatNumberWithCommas = formatNumberWithCommas;
exports.smoothTransition = smoothTransition;
exports.isPointInRect = isPointInRect;
exports.calculateButtonBarPositions = calculateButtonBarPositions;
exports.getButtonStateColor = getButtonStateColor;
// Generate random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
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
    var _a;
    var shuffled = __spreadArray([], array, true);
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [shuffled[j], shuffled[i]], shuffled[i] = _a[0], shuffled[j] = _a[1];
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
    while (angle < 0)
        angle += Math.PI * 2;
    while (angle >= Math.PI * 2)
        angle -= Math.PI * 2;
    return angle;
}
// Get perpendicular angle (rotate by 90 degrees / π/2 radians)
function perpendicularAngle(angle) {
    return angle + Math.PI / 2;
}
// Calculate fade-out alpha based on progress (0-1)
function fadeOutAlpha(progress, maxAlpha) {
    if (maxAlpha === void 0) { maxAlpha = 255; }
    return maxAlpha * (1 - progress);
}
// Calculate fade-in alpha based on progress (0-1)
function fadeInAlpha(progress, maxAlpha) {
    if (maxAlpha === void 0) { maxAlpha = 255; }
    return maxAlpha * progress;
}
// Deep clone an object (simple version)
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
// Debounce function calls
function debounce(func, delay) {
    var timeoutId;
    return function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(function () { return func.apply(_this, args); }, delay);
    };
}
// Throttle function calls
function throttle(func, limit) {
    var inThrottle;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(function () { return (inThrottle = false); }, limit);
        }
    };
}
// Format time in MM:SS format
function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return "".concat(mins.toString().padStart(2, '0'), ":").concat(secs.toString().padStart(2, '0'));
}
// Calculate percentage
function percentage(value, total) {
    return total === 0 ? 0 : (value / total) * 100;
}
exports.ease = {
    linear: function (t) { return t; },
    easeInQuad: function (t) { return t * t; },
    easeOutQuad: function (t) { return t * (2 - t); },
    easeInOutQuad: function (t) { return (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t); },
    easeInCubic: function (t) { return t * t * t; },
    easeOutCubic: function (t) { return (--t) * t * t + 1; },
    easeInOutCubic: function (t) { return (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1); }
};
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
        { col: col, row: row - 1 }, // top
        { col: col + 1, row: row }, // right
        { col: col, row: row + 1 }, // bottom
        { col: col - 1, row: row } // left
    ];
}
// Get neighboring grid cells (8-directional)
function getNeighbors8(col, row) {
    return [
        { col: col - 1, row: row - 1 }, // top-left
        { col: col, row: row - 1 }, // top
        { col: col + 1, row: row - 1 }, // top-right
        { col: col + 1, row: row }, // right
        { col: col + 1, row: row + 1 }, // bottom-right
        { col: col, row: row + 1 }, // bottom
        { col: col - 1, row: row + 1 }, // bottom-left
        { col: col - 1, row: row } // left
    ];
}
// Vector utilities (useful for p5.Vector)
function vectorMagnitude(x, y) {
    return Math.sqrt(x * x + y * y);
}
function vectorNormalize(x, y) {
    var mag = vectorMagnitude(x, y);
    return mag > 0 ? { x: x / mag, y: y / mag } : { x: 0, y: 0 };
}
function vectorLimit(x, y, max) {
    var mag = vectorMagnitude(x, y);
    if (mag > max) {
        var normalized = vectorNormalize(x, y);
        return { x: normalized.x * max, y: normalized.y * max };
    }
    return { x: x, y: y };
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
    var range = max - min;
    return value < min ? max - (min - value) % range : min + (value - min) % range;
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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
    var c1 = hexToRgb(color1);
    var c2 = hexToRgb(color2);
    if (!c1 || !c2)
        return color1;
    return rgbToHex(Math.round(lerp(c1.r, c2.r, t)), Math.round(lerp(c1.g, c2.g, t)), Math.round(lerp(c1.b, c2.b, t)));
}
// FPS counter
var FPSCounter = /** @class */ (function () {
    function FPSCounter() {
        this.frames = [];
    }
    FPSCounter.prototype.update = function () {
        var now = Date.now();
        this.frames.push(now);
        // Keep only last second of frames
        while (this.frames.length > 0 && this.frames[0] < now - 1000) {
            this.frames.shift();
        }
    };
    FPSCounter.prototype.getFPS = function () {
        return this.frames.length;
    };
    return FPSCounter;
}());
exports.FPSCounter = FPSCounter;
// Simple timer class
var Timer = /** @class */ (function () {
    function Timer(duration) {
        this.duration = duration;
        this.elapsed = 0;
        this.running = false;
    }
    Timer.prototype.start = function () {
        this.running = true;
        this.elapsed = 0;
    };
    Timer.prototype.stop = function () {
        this.running = false;
    };
    Timer.prototype.reset = function () {
        this.elapsed = 0;
    };
    Timer.prototype.update = function (deltaTime) {
        if (this.running) {
            this.elapsed += deltaTime;
        }
    };
    Timer.prototype.isFinished = function () {
        return this.elapsed >= this.duration;
    };
    Timer.prototype.getProgress = function () {
        return clamp(this.elapsed / this.duration, 0, 1);
    };
    return Timer;
}());
exports.Timer = Timer;
// Simple state machine helper
var StateMachine = /** @class */ (function () {
    function StateMachine(initialState) {
        this.previousState = null;
        this.currentState = initialState;
    }
    StateMachine.prototype.setState = function (newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
    };
    StateMachine.prototype.is = function (state) {
        return this.currentState === state;
    };
    StateMachine.prototype.wasState = function (state) {
        return this.previousState === state;
    };
    StateMachine.prototype.getCurrentState = function () {
        return this.currentState;
    };
    StateMachine.prototype.getPreviousState = function () {
        return this.previousState;
    };
    return StateMachine;
}());
exports.StateMachine = StateMachine;
// Array chunk utility
function chunkArray(array, size) {
    var chunks = [];
    for (var i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
// Remove element from array
function removeFromArray(array, element) {
    var index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
}
// Weighted random choice
function weightedRandomChoice(items, weights) {
    var totalWeight = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
    var random = Math.random() * totalWeight;
    for (var i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    return items[items.length - 1];
}
// Check if arrays are equal
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    return arr1.every(function (value, index) { return value === arr2[index]; });
}
// Get unique values from array
function uniqueArray(array) {
    return __spreadArray([], new Set(array), true);
}
// Sum array values
function sumArray(array) {
    return array.reduce(function (sum, val) { return sum + val; }, 0);
}
// Average array values
function averageArray(array) {
    return array.length === 0 ? 0 : sumArray(array) / array.length;
}
// ============================================================================
// ENTITY/POWER HELPERS (for power system and entity queries)
// ============================================================================
/**
 * Get all entities within radius of a position
 * @param entityManager - EntityManager instance
 * @param centerX - Center X position
 * @param centerY - Center Y position
 * @param radius - Search radius
 * @param activeOnly - Only return active entities (default true)
 * @returns Array of entities within radius
 */
function getEntitiesInRadius(entityManager, centerX, centerY, radius, activeOnly) {
    if (activeOnly === void 0) { activeOnly = true; }
    return entityManager.getAllEntities().filter(function (entity) {
        if (activeOnly && !entity.isActive)
            return false;
        var dist = distance(centerX, centerY, entity.gridX, entity.gridY);
        return dist <= radius;
    });
}
/**
 * Check if entity is enemy to a faction
 * @param entityManager - EntityManager instance
 * @param factionManager - FactionManager instance
 * @param entityId - Entity ID to check
 * @param referenceFactionId - Faction ID to compare against
 * @returns True if entity is enemy
 */
function isEntityEnemy(entityManager, factionManager, entityId, referenceFactionId) {
    // If no faction system, all entities are enemies
    if (!referenceFactionId)
        return true;
    // Get entity from EntityManager
    var entity = entityManager.getEntity(entityId);
    if (!entity)
        return false;
    // Check if entity has faction ID property
    var entityFactionId = entity.factionId;
    if (!entityFactionId)
        return true; // No faction = enemy
    // Use FactionManager to check if enemy
    return factionManager.isEnemy(referenceFactionId, entityFactionId);
}
/**
 * Calculate falloff factor based on distance (1.0 at center, 0.0 at edge)
 * @param currentDistance - Current distance from center
 * @param maxDistance - Maximum distance (edge of radius)
 * @returns Falloff factor (0.0 to 1.0)
 */
function distanceFalloff(currentDistance, maxDistance) {
    if (maxDistance === 0)
        return 1;
    return clamp(1 - (currentDistance / maxDistance), 0, 1);
}
/**
 * Apply knockback/push force with distance falloff
 * @param sourceX - Source X position (center of force)
 * @param sourceY - Source Y position
 * @param targetX - Target X position (entity being pushed)
 * @param targetY - Target Y position
 * @param maxForce - Maximum force at center
 * @param radius - Radius of effect
 * @returns {x, y} vector for force
 */
function calculatePushForce(sourceX, sourceY, targetX, targetY, maxForce, radius) {
    var angle = angleBetween(sourceX, sourceY, targetX, targetY);
    var dist = distance(sourceX, sourceY, targetX, targetY);
    var falloff = distanceFalloff(dist, radius);
    var actualForce = maxForce * falloff;
    return {
        x: Math.cos(angle) * actualForce,
        y: Math.sin(angle) * actualForce
    };
}
// ============================================================================
// FACTORY PATTERN HELPERS
// ============================================================================
/**
 * Setup automatic sprite-to-entity binding with EventBus listeners
 * Handles sprite registration, ENTITY_MOVED tracking, ENTITY_DESTROYED cleanup
 * @param entity - GameObject to bind sprite to
 * @param sprite - SpriteComponent to register
 * @param renderer - Renderer instance
 * @param layer - RenderLayer for sprite
 * @param gridToWorldFn - Function to convert grid coordinates to world coordinates
 */
function setupEntitySpriteBinding(entity, sprite, renderer, layer, gridToWorldFn) {
    // Import dynamically to avoid circular dependencies
    var EventBus = require('./eventBus').EventBus;
    // Register sprite with renderer
    var unregister = renderer.register(sprite);
    // Listen for entity movement - update sprite position/depth
    var moveListener = EventBus.on('ENTITY_MOVED', function (entityId, gridX, gridY) {
        if (entityId === entity.id) {
            sprite.setPosition(gridToWorldFn(gridX), gridToWorldFn(gridY));
            sprite.setDepth(gridY);
            renderer.markLayerDirty(layer);
        }
    });
    // Listen for entity destruction - cleanup sprite
    var destroyListener = EventBus.once('ENTITY_DESTROYED', function (entityId) {
        if (entityId === entity.id) {
            unregister();
            EventBus.off('ENTITY_MOVED', moveListener);
        }
    });
    // Store cleanup function on entity for manual cleanup
    entity._cleanup = function () {
        unregister();
        EventBus.off('ENTITY_MOVED', moveListener);
        EventBus.off('ENTITY_DESTROYED', destroyListener);
    };
}
// ============================================================================
// EVENTBUS EMIT HELPERS
// ============================================================================
/**
 * Emit entity event with owner.id check
 * Common pattern: if (this.owner) { EventBus.emit(..., this.owner.id, ...) }
 * @param entity - Entity or component owner (must have .id property)
 * @param eventName - Event name to emit
 * @param args - Additional event arguments
 */
function emitEntityEvent(entity, eventName) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (entity) {
        var EventBus = require('./eventBus').EventBus;
        EventBus.emit.apply(EventBus, __spreadArray([eventName, entity.id], args, false));
    }
}
/**
 * Emit destruction event and destroy entity
 * Common pattern: EventBus.emit('X_DESTROYED', id, type); entity.destroy();
 * @param entity - GameObject to destroy (must have .id, .type, .destroy())
 * @param eventName - Event name to emit before destruction
 */
function destroyAndEmit(entity, eventName) {
    var EventBus = require('./eventBus').EventBus;
    EventBus.emit(eventName, entity.id, entity.type);
    entity.destroy();
}
// ============================================================================
// UI RENDERING HELPERS
// ============================================================================
/**
 * Draw radial cooldown overlay (counter-clockwise progress indicator)
 * Draws a darkened icon + radial "pie slice" that shrinks as cooldown progresses
 * Common pattern for ability/power cooldowns in games
 *
 * @param graphics - p5.Graphics context to draw on
 * @param x - Center X position of the icon
 * @param y - Center Y position of the icon
 * @param size - Diameter of the cooldown circle
 * @param progress - Cooldown progress (0 = ready, 1 = full cooldown)
 * @param darkenAlpha - Alpha value for darkening overlay (default 150)
 * @param radialColor - Color of radial overlay (default semi-transparent black)
 *
 * @example
 * // Power on 50% cooldown
 * drawRadialCooldown(graphics, powerX, powerY, 64, 0.5);
 *
 * // Custom styling
 * drawRadialCooldown(graphics, x, y, 48, progress, 180, '#FF0000');
 */
function drawRadialCooldown(graphics, x, y, size, progress, darkenAlpha, radialColor) {
    if (darkenAlpha === void 0) { darkenAlpha = 150; }
    if (radialColor === void 0) { radialColor = '#000000'; }
    graphics.push();
    // 1. Draw darkening overlay on entire icon
    if (progress > 0) {
        graphics.fill(0, 0, 0, darkenAlpha);
        graphics.noStroke();
        graphics.circle(x, y, size);
    }
    // 2. Draw radial cooldown "pie slice"
    if (progress > 0) {
        // Convert hex color to RGB
        var rgb = hexToRgb(radialColor);
        if (rgb) {
            graphics.fill(rgb.r, rgb.g, rgb.b, 180);
        }
        else {
            graphics.fill(0, 0, 0, 180);
        }
        graphics.noStroke();
        // Calculate angles (counter-clockwise from top)
        var startAngle = -Math.PI / 2; // Top (270° / -90°)
        var sweepAngle = progress * Math.PI * 2; // Full circle = 2π
        // Draw arc (PIE mode for filled wedge)
        graphics.arc(x, y, size, size, startAngle, startAngle + sweepAngle, 'PIE');
    }
    graphics.pop();
}
/**
 * Draw UI panel with rounded corners and semi-transparent background
 * Common pattern for all UI components (resource display, power bar, etc.)
 *
 * @param graphics - p5.Graphics context to draw on
 * @param x - X position (top-left corner)
 * @param y - Y position (top-left corner)
 * @param width - Panel width
 * @param height - Panel height
 * @param backgroundColor - Hex color string (default dark gray)
 * @param alpha - Background alpha transparency (0-255, default 200)
 * @param cornerRadius - Rounded corner radius (default 8)
 *
 * @example
 * // Standard UI panel
 * drawUIPanel(graphics, 10, 10, 200, 100);
 *
 * // Custom styling
 * drawUIPanel(graphics, x, y, w, h, '#3C3C3C', 180, 12);
 */
function drawUIPanel(graphics, x, y, width, height, backgroundColor, alpha, cornerRadius) {
    if (backgroundColor === void 0) { backgroundColor = '#2C2C2C'; }
    if (alpha === void 0) { alpha = 200; }
    if (cornerRadius === void 0) { cornerRadius = 8; }
    var rgb = hexToRgb(backgroundColor);
    if (rgb) {
        graphics.fill(rgb.r, rgb.g, rgb.b, alpha);
    }
    else {
        graphics.fill(44, 44, 44, alpha); // Fallback to default gray
    }
    graphics.noStroke();
    graphics.rect(x, y, width, height, cornerRadius);
}
/**
 * Format number with comma thousands separators
 * Common pattern for displaying resource counts, population, etc.
 *
 * @param num - Number to format
 * @returns Formatted string with commas (e.g., 1000 → "1,000")
 *
 * @example
 * formatNumberWithCommas(1000) // "1,000"
 * formatNumberWithCommas(1234567) // "1,234,567"
 */
function formatNumberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
/**
 * Smooth animation helper using lerp interpolation
 * Returns new value that smoothly transitions toward target
 * Common pattern for UI animations (expand/collapse, fade, slide)
 *
 * @param current - Current value
 * @param target - Target value
 * @param speed - Interpolation speed (0-1, default 0.2)
 * @param snapThreshold - Snap to target when within this distance (default 1)
 * @returns New current value
 *
 * @example
 * // Smooth height animation
 * this.currentHeight = smoothTransition(this.currentHeight, targetHeight, 0.2, 1);
 *
 * // Faster animation
 * this.alpha = smoothTransition(this.alpha, 255, 0.4, 2);
 */
function smoothTransition(current, target, speed, snapThreshold) {
    if (speed === void 0) { speed = 0.2; }
    if (snapThreshold === void 0) { snapThreshold = 1; }
    var newValue = current + (target - current) * speed;
    // Snap to target when close enough
    if (Math.abs(newValue - target) < snapThreshold) {
        return target;
    }
    return newValue;
}
// ============================================================================
// BUTTON/INTERACTION HELPERS
// ============================================================================
/**
 * Check if point is inside a rectangle (button bounds checking)
 * Common pattern for all clickable UI elements
 *
 * @param pointX - Mouse/point X coordinate
 * @param pointY - Mouse/point Y coordinate
 * @param rectX - Rectangle center X (or top-left if centerOrigin=false)
 * @param rectY - Rectangle center Y (or top-left if centerOrigin=false)
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param centerOrigin - If true, rectX/rectY are center point (default true)
 * @returns True if point is inside rectangle
 *
 * @example
 * // Center-origin button (most common for UI)
 * if (isPointInRect(mouseX, mouseY, buttonX, buttonY, 64, 64)) {
 *     // Button clicked
 * }
 *
 * // Top-left origin
 * if (isPointInRect(mouseX, mouseY, panelX, panelY, 200, 100, false)) {
 *     // Panel clicked
 * }
 */
function isPointInRect(pointX, pointY, rectX, rectY, width, height, centerOrigin) {
    if (centerOrigin === void 0) { centerOrigin = true; }
    if (centerOrigin) {
        return (pointX >= rectX - width / 2 &&
            pointX <= rectX + width / 2 &&
            pointY >= rectY - height / 2 &&
            pointY <= rectY + height / 2);
    }
    else {
        return (pointX >= rectX &&
            pointX <= rectX + width &&
            pointY >= rectY &&
            pointY <= rectY + height);
    }
}
/**
 * Calculate button positions for horizontal button bar layout
 * Common pattern for power bar, command buttons, etc.
 * Returns array of x positions centered around baseX
 *
 * @param baseX - Center X position for the entire button bar
 * @param buttonCount - Number of buttons
 * @param buttonSize - Width of each button
 * @param spacing - Distance between button centers
 * @returns Array of x positions for each button
 *
 * @example
 * // 4 buttons centered at x=400
 * const positions = calculateButtonBarPositions(400, 4, 56, 70);
 * // Returns: [265, 335, 405, 475] (buttons centered around 400)
 */
function calculateButtonBarPositions(baseX, buttonCount, buttonSize, spacing) {
    var positions = [];
    var totalWidth = (buttonCount * spacing) - (spacing - buttonSize);
    var startX = baseX - totalWidth / 2 + buttonSize / 2;
    for (var i = 0; i < buttonCount; i++) {
        positions.push(startX + (i * spacing));
    }
    return positions;
}
/**
 * Get button color based on state (normal/hover/selected/disabled)
 * Common pattern for all interactive buttons
 * Returns hex color string
 *
 * @param isEnabled - Whether button is enabled
 * @param isSelected - Whether button is selected
 * @param isHovered - Whether button is hovered
 * @param colors - Color scheme object with normal/hover/selected/disabled colors
 * @returns Hex color string
 *
 * @example
 * const colors = {
 *     normal: '#444444',
 *     hover: '#555555',
 *     selected: '#4CAF50',
 *     disabled: '#222222'
 * };
 * const color = getButtonStateColor(enabled, selected, hovered, colors);
 */
function getButtonStateColor(isEnabled, isSelected, isHovered, colors) {
    if (!isEnabled)
        return colors.disabled;
    if (isSelected)
        return colors.selected;
    if (isHovered)
        return colors.hover;
    return colors.normal;
}
