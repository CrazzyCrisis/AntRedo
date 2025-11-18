/**
 * Centralized Factory Imports
 * 
 * Barrel export file for common factory dependencies.
 * All 7 entity factories share nearly identical imports - this eliminates
 * 8-10 import statements per factory.
 * 
 * Usage in factory files:
 * ```typescript
 * import {
 *     Renderer, RenderLayer, SpriteComponent,
 *     EventBus, GameEvents,
 *     setupEntitySpriteBinding, TILE_SIZE,
 *     EntityManager
 * } from '../imports/factoryImports';
 * import { MyEntity } from '../classes/MyEntity';
 * 
 * export class MyEntityFactory {
 *     static create(renderer: Renderer, sprite: any, x: number, y: number) {
 *         const entity = new MyEntity(x, y);
 *         const spriteComponent = new SpriteComponent(sprite, x, y);
 *         setupEntitySpriteBinding(entity, spriteComponent, renderer, RenderLayer.ENTITIES, gridToWorld);
 *         return entity;
 *     }
 * }
 * ```
 */

// ============================================================================
// RENDERING SYSTEM
// ============================================================================
export { Renderer } from '../rendering/Renderer';
export { RenderLayer } from '../rendering/RenderLayer';
export { SpriteComponent } from '../rendering/components/SpriteComponent';
export { AnimatedSpriteSheetComponent } from '../rendering/components/AnimatedSpriteSheetComponent';
export type { AnimationConfig } from '../rendering/components/AnimatedSpriteSheetComponent';

// ============================================================================
// EVENT BUS
// ============================================================================
export { EventBus, GameEvents } from '../utils/eventBus';

// ============================================================================
// UTILITIES
// ============================================================================
export { 
    setupEntitySpriteBinding, 
    setupHealthBarBinding, 
    setupStatusBarBinding,
    setupHungerBarBinding,
    setupOxygenBarBinding,
    setupStaminaBarBinding,
    gridToWorld, 
    gridToWorldCenter, 
    gridToWorldPosition, 
    createAnimationData 
} from '../utils/helpers';
export type { TilePosition } from '../utils/helpers';
export { TILE_SIZE } from '../world/TileSystem';

// ============================================================================
// MANAGERS
// ============================================================================
export { EntityManager } from '../managers/EntityManager';

// ============================================================================
// CONFIG
// ============================================================================
export { ResourceType, BuildingType, ENTITY_CONFIG } from '../config/gameplay/entityConfig';
export { 
    ANT_ANIMATIONS, 
    QUEEN_ANIMATIONS, 
    BOSS_ANIMATIONS,
    JOB_TO_ANIMATION_MAP,
    JOB_TO_SPRITESHEET_MAP 
} from '../config/systems/animationConfig';
