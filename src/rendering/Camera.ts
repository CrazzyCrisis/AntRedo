/**
 * Camera handles viewport positioning, smooth following, and coordinate conversions
 * between world space and screen space.
 */
export class Camera {
    public x: number;
    public y: number;
    public smoothing: number = 0.1;
    
    private targetX: number | null = null;
    private targetY: number | null = null;
    private canvasWidth: number;
    private canvasHeight: number;
    
    // Shake effect properties
    private shakeIntensity: number = 0;
    private shakeDuration: number = 0;
    private shakeTimer: number = 0;
    private shakeOffsetX: number = 0;
    private shakeOffsetY: number = 0;

    constructor(x: number, y: number, canvasWidth: number = 800, canvasHeight: number = 600) {
        this.x = x;
        this.y = y;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    /**
     * Move camera immediately to position
     */
    moveTo(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.targetX = null;
        this.targetY = null;
    }

    /**
     * Set target for smooth following
     */
    follow(x: number, y: number): void {
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * Set smoothing value (0 = instant, 1 = no movement)
     */
    setSmoothing(smoothing: number): void {
        this.smoothing = smoothing;
    }

    /**
     * Update camera position (call every frame)
     */
    update(): void {
        // Update smooth following
        if (this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            
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
            } else {
                // Shake finished
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
                this.shakeIntensity = 0;
            }
        }
    }

    /**
     * Start camera shake effect
     */
    shake(intensity: number, duration: number): void {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration * 60; // Convert seconds to frames (assuming 60fps)
        this.shakeTimer = this.shakeDuration;
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        const screenX = worldX - this.x + this.canvasWidth / 2 + this.shakeOffsetX;
        const screenY = worldY - this.y + this.canvasHeight / 2 + this.shakeOffsetY;
        return { x: screenX, y: screenY };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        const worldX = screenX + this.x - this.canvasWidth / 2 - this.shakeOffsetX;
        const worldY = screenY + this.y - this.canvasHeight / 2 - this.shakeOffsetY;
        return { x: worldX, y: worldY };
    }

    /**
     * Check if a point is in camera view
     */
    isInView(x: number, y: number, margin: number = 0): boolean {
        const left = this.x - this.canvasWidth / 2 - margin;
        const right = this.x + this.canvasWidth / 2 + margin;
        const top = this.y - this.canvasHeight / 2 - margin;
        const bottom = this.y + this.canvasHeight / 2 + margin;
        
        return x >= left && x <= right && y >= top && y <= bottom;
    }

    /**
     * Check if a rectangle is in camera view
     */
    isRectInView(x: number, y: number, width: number, height: number, margin: number = 0): boolean {
        const left = this.x - this.canvasWidth / 2 - margin;
        const right = this.x + this.canvasWidth / 2 + margin;
        const top = this.y - this.canvasHeight / 2 - margin;
        const bottom = this.y + this.canvasHeight / 2 + margin;
        
        return !(x + width < left || x > right || y + height < top || y > bottom);
    }

    /**
     * Apply camera transform to a graphics context
     */
    applyTransform(graphics: any): void {
        const offsetX = -this.x + this.canvasWidth / 2 + this.shakeOffsetX;
        const offsetY = -this.y + this.canvasHeight / 2 + this.shakeOffsetY;
        graphics.translate(offsetX, offsetY);
    }
}
