/**
 * Camera System Configuration
 * Controls camera behavior, movement, and following settings
 */

export const CAMERA_CONFIG = {
    // Following system
    FOLLOW_RESUME_DELAY: 5000,      // Time in milliseconds before camera resumes following (after manual move)
    DEFAULT_SMOOTHING: 0.1,         // Camera smoothing (0 = instant, 1 = no movement)
    
    // Deadzone (bounding box where camera doesn't move)
    DEADZONE_WIDTH: 200,            // Width of deadzone in pixels
    DEADZONE_HEIGHT: 150,           // Height of deadzone in pixels
    
    // Camera movement (separate from queen movement - uses InputManager actions)
    ARROW_MOVE_SPEED: 16,           // Pixels per frame to move with camera keys (at 60fps = 960 px/s)
    ARROW_MOVE_DELAY: 5000,         // Time in milliseconds before resuming follow after camera key movement
    
    // Shake effects
    DEFAULT_SHAKE_INTENSITY: 10,    // Default shake intensity in pixels
    DEFAULT_SHAKE_DURATION: 0.3,    // Default shake duration in seconds
} as const;
