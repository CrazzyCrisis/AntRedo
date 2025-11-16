/**
 * RenderLayer enum defines the 8 rendering layers in order of draw priority.
 * Lower values are drawn first (background), higher values drawn last (foreground).
 */
export enum RenderLayer {
    BACKGROUND = 0,
    GROUND = 1,
    GROUND_DECORATIONS = 2,
    ENTITIES = 3,
    ABOVE_ENTITIES = 4,
    VISUAL_EFFECTS = 5,  // Damage numbers, flashes, particles - above entities, below UI
    UI = 6,
    DEBUG = 7
}
