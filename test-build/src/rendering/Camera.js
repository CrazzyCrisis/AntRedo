"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = void 0;
/**
 * Camera handles viewport positioning, smooth following, and coordinate conversions
 * between world space and screen space.
 */
var Camera = /** @class */ (function () {
    function Camera(x, y, canvasWidth, canvasHeight) {
        if (canvasWidth === void 0) { canvasWidth = 800; }
        if (canvasHeight === void 0) { canvasHeight = 600; }
        this.smoothing = 0.1;
        this.targetX = null;
        this.targetY = null;
        // Shake effect properties
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.x = x;
        this.y = y;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
    /**
     * Move camera immediately to position
     */
    Camera.prototype.moveTo = function (x, y) {
        this.x = x;
        this.y = y;
        this.targetX = null;
        this.targetY = null;
    };
    /**
     * Set target for smooth following
     */
    Camera.prototype.follow = function (x, y) {
        this.targetX = x;
        this.targetY = y;
    };
    /**
     * Set smoothing value (0 = instant, 1 = no movement)
     */
    Camera.prototype.setSmoothing = function (smoothing) {
        this.smoothing = smoothing;
    };
    /**
     * Update camera position (call every frame)
     */
    Camera.prototype.update = function () {
        // Update smooth following
        if (this.targetX !== null && this.targetY !== null) {
            var dx = this.targetX - this.x;
            var dy = this.targetY - this.y;
            this.x += dx * (1 - this.smoothing);
            this.y += dy * (1 - this.smoothing);
        }
        // Update shake effect
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            if (this.shakeTimer > 0) {
                // Random offset based on intensity
                this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
                this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            }
            else {
                // Shake finished
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
                this.shakeIntensity = 0;
            }
        }
    };
    /**
     * Start camera shake effect
     */
    Camera.prototype.shake = function (intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration * 60; // Convert seconds to frames (assuming 60fps)
        this.shakeTimer = this.shakeDuration;
    };
    /**
     * Convert world coordinates to screen coordinates
     */
    Camera.prototype.worldToScreen = function (worldX, worldY) {
        var screenX = worldX - this.x + this.canvasWidth / 2 + this.shakeOffsetX;
        var screenY = worldY - this.y + this.canvasHeight / 2 + this.shakeOffsetY;
        return { x: screenX, y: screenY };
    };
    /**
     * Convert screen coordinates to world coordinates
     */
    Camera.prototype.screenToWorld = function (screenX, screenY) {
        var worldX = screenX + this.x - this.canvasWidth / 2 - this.shakeOffsetX;
        var worldY = screenY + this.y - this.canvasHeight / 2 - this.shakeOffsetY;
        return { x: worldX, y: worldY };
    };
    /**
     * Check if a point is in camera view
     */
    Camera.prototype.isInView = function (x, y, margin) {
        if (margin === void 0) { margin = 0; }
        var left = this.x - this.canvasWidth / 2 - margin;
        var right = this.x + this.canvasWidth / 2 + margin;
        var top = this.y - this.canvasHeight / 2 - margin;
        var bottom = this.y + this.canvasHeight / 2 + margin;
        return x >= left && x <= right && y >= top && y <= bottom;
    };
    /**
     * Check if a rectangle is in camera view
     */
    Camera.prototype.isRectInView = function (x, y, width, height, margin) {
        if (margin === void 0) { margin = 0; }
        var left = this.x - this.canvasWidth / 2 - margin;
        var right = this.x + this.canvasWidth / 2 + margin;
        var top = this.y - this.canvasHeight / 2 - margin;
        var bottom = this.y + this.canvasHeight / 2 + margin;
        return !(x + width < left || x > right || y + height < top || y > bottom);
    };
    /**
     * Apply camera transform to a graphics context
     */
    Camera.prototype.applyTransform = function (graphics) {
        var offsetX = -this.x + this.canvasWidth / 2 + this.shakeOffsetX;
        var offsetY = -this.y + this.canvasHeight / 2 + this.shakeOffsetY;
        graphics.translate(offsetX, offsetY);
    };
    return Camera;
}());
exports.Camera = Camera;
