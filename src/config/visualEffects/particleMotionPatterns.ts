/**
 * Particle Motion Patterns
 * Reusable motion patterns for particle effects
 * 
 * Each pattern function takes:
 * - age: Current particle age (0 to 1, where 1 = end of lifetime)
 * - startX, startY: Initial spawn position
 * - randomSeed: Random value (0-1) for variation
 * 
 * Returns: { x: number, y: number } - Current position
 */

export type ParticleMotionFunction = (
    age: number,
    startX: number,
    startY: number,
    randomSeed: number
) => { x: number; y: number };

/**
 * Simple upward float with slight horizontal drift
 */
export const FLOAT_UP: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const distance = age * 40; // Float 40 pixels over lifetime
    const drift = (randomSeed - 0.5) * 20 * age; // Horizontal drift
    return {
        x: startX + drift,
        y: startY - distance
    };
};

/**
 * Sine wave horizontal motion while floating up
 */
export const SINE_WAVE: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const verticalDistance = age * 50;
    const waveAmplitude = 15 * (1 + randomSeed); // 15-30 pixel amplitude
    const waveFrequency = 2 + randomSeed * 2; // 2-4 cycles per lifetime
    const horizontalOffset = Math.sin(age * Math.PI * waveFrequency) * waveAmplitude;
    
    return {
        x: startX + horizontalOffset,
        y: startY - verticalDistance
    };
};

/**
 * Spiral motion upward
 */
export const SPIRAL: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const verticalDistance = age * 45;
    const spiralRadius = 10 + randomSeed * 10; // 10-20 pixel radius
    const spiralSpeed = 3 + randomSeed * 2; // 3-5 rotations per lifetime
    const angle = age * Math.PI * 2 * spiralSpeed;
    
    return {
        x: startX + Math.cos(angle) * spiralRadius,
        y: startY - verticalDistance
    };
};

/**
 * Burst outward from spawn point (explosion effect)
 */
export const BURST_OUTWARD: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const angle = randomSeed * Math.PI * 2; // Random direction
    const distance = age * 60; // Travel 60 pixels over lifetime
    const gravity = age * age * 20; // Slight downward arc
    
    return {
        x: startX + Math.cos(angle) * distance,
        y: startY + Math.sin(angle) * distance + gravity
    };
};

/**
 * Float up with random jitter
 */
export const JITTER_UP: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const verticalDistance = age * 35;
    // Use age as seed for pseudo-random jitter
    const jitterX = Math.sin(age * 10 + randomSeed * 100) * 8;
    const jitterY = Math.cos(age * 8 + randomSeed * 100) * 5;
    
    return {
        x: startX + jitterX,
        y: startY - verticalDistance + jitterY
    };
};

/**
 * Arc motion (parabolic trajectory)
 */
export const ARC: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const horizontalDistance = (randomSeed - 0.5) * 60; // -30 to +30 pixels
    const verticalPeak = 40; // Peak height
    // Parabolic motion: goes up then down
    const verticalOffset = -(4 * verticalPeak * age * (1 - age));
    
    return {
        x: startX + horizontalDistance * age,
        y: startY + verticalOffset
    };
};

/**
 * Circular orbit around spawn point
 */
export const ORBIT: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const orbitRadius = 15 + randomSeed * 15; // 15-30 pixel radius
    const orbitSpeed = 2 + randomSeed; // 2-3 rotations per lifetime
    const angle = age * Math.PI * 2 * orbitSpeed;
    
    return {
        x: startX + Math.cos(angle) * orbitRadius,
        y: startY + Math.sin(angle) * orbitRadius
    };
};

/**
 * Slow drift (minimal movement)
 */
export const DRIFT: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const driftX = (randomSeed - 0.5) * 10 * age; // -5 to +5 pixels
    const driftY = (randomSeed * 0.5 - 0.25) * 10 * age; // -2.5 to +2.5 pixels
    
    return {
        x: startX + driftX,
        y: startY + driftY
    };
};

/**
 * Water bubble float (gentle rise with random wobble)
 */
export const BUBBLE_FLOAT: ParticleMotionFunction = (age, startX, startY, randomSeed) => {
    const riseDistance = age * 30; // Gentle rise
    const wobbleFrequency = 4 + randomSeed * 2; // 4-6 wobbles per lifetime
    const wobbleAmplitude = 3 + randomSeed * 3; // 3-6 pixel wobble
    const wobble = Math.sin(age * Math.PI * wobbleFrequency) * wobbleAmplitude * (1 - age * 0.5);
    
    return {
        x: startX + wobble,
        y: startY - riseDistance
    };
};

/**
 * Collect all patterns into a map for easy lookup
 */
export const MOTION_PATTERNS = {
    FLOAT_UP,
    SINE_WAVE,
    SPIRAL,
    BURST_OUTWARD,
    JITTER_UP,
    ARC,
    ORBIT,
    DRIFT,
    BUBBLE_FLOAT
} as const;

export type MotionPatternName = keyof typeof MOTION_PATTERNS;
