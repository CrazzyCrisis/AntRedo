/**
 * RenderLayer enum defines the 7 rendering layers in order of draw priority.
 * Lower values are drawn first (background), higher values drawn last (foreground).
 */
export enum RenderLayer {
    BACKGROUND = 0,
    GROUND = 1,
    GROUND_DECORATIONS = 2,
    ENTITIES = 3,
    ABOVE_ENTITIES = 4,
    UI = 5,
    DEBUG = 6
}
