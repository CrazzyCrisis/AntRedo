/**
 * Centralized Scene Imports
 * 
 * Barrel export file that re-exports all commonly used scene dependencies.
 * This eliminates 20+ import statements per scene file and provides a single
 * source of truth for scene dependencies.
 * 
 * Usage in scene files:
 * ```typescript
 * import {
 *     IScene, Renderer, EventBus, GameEvents, RenderLayer,
 *     GameStateManager, AudioManager, ButtonComponent, CONFIG
 * } from './sceneImports';
 * ```
 */

// ============================================================================
// CORE SCENE SYSTEMS
// ============================================================================
export { IScene } from '../scenes/IScene';
export { Renderer } from '../rendering/Renderer';
export { Camera } from '../rendering/Camera';
export { RenderLayer } from '../rendering/RenderLayer';

// ============================================================================
// EVENT BUS
// ============================================================================
export { EventBus, GameEvents } from '../utils/eventBus';

// ============================================================================
// MANAGERS (Singletons)
// ============================================================================
export { GameStateManager } from '../managers/GameStateManager';
export { AudioManager } from '../managers/AudioManager';
export { InputManager } from '../managers/InputManager';
export { EntityManager } from '../managers/EntityManager';
export { CameraManager } from '../managers/CameraManager';
export { SpawnManager } from '../managers/SpawnManager';
export { LevelLoader } from '../managers/LevelLoader';
export { PathfindingManager } from '../managers/PathfindingManager';
export { BuildingManager } from '../managers/BuildingManager';
export { CommandManager } from '../managers/CommandManager';
export { FactionManager } from '../managers/FactionManager';

// ============================================================================
// ENTITY FACTORIES
// ============================================================================
export { AntFactory } from '../factories/AntFactory';
export { QueenFactory } from '../factories/QueenFactory';
export { BossFactory } from '../factories/BossFactory';
export { ResourceFactory } from '../factories/ResourceFactory';
export { BuildingFactory } from '../factories/BuildingFactory';
export { PlayerFactory } from '../factories/PlayerFactory';
export { ProjectileFactory } from '../factories/ProjectileFactory';

// ============================================================================
// UI COMPONENTS (Rendering/Components)
// ============================================================================
export { ButtonComponent } from '../rendering/components/ButtonComponent';
export { AnimatedSpriteComponent } from '../rendering/components/AnimatedSpriteComponent';
export { SliderWithArrowsComponent } from '../rendering/components/SliderWithArrowsComponent';
export { KeybindComponent } from '../rendering/components/KeybindComponent';
export { TextRenderable } from '../rendering/components/TextRenderable';
export { PanelRenderable } from '../rendering/components/PanelRenderable';
export { WorldGenConfigMenu } from '../rendering/components/WorldGenConfigMenu';

// ============================================================================
// WORLD SYSTEMS
// ============================================================================
export { WorldGenerator } from '../world/WorldGenerator';
export { TileGrid } from '../world/TileGrid';
export { TileFrillSystem, updateMaterialPriorities } from '../world/TileEdgeSystem';
export { WorldPresetManager, WorldPreset } from '../world/WorldPresetManager';
export { TILE_SIZE } from '../world/TileSystem';

// ============================================================================
// ENTITY CLASSES
// ============================================================================
export { Queen } from '../classes/Queen';
export { Ant } from '../classes/Ant';
export { Boss } from '../classes/Boss';
export { Resource } from '../classes/Resource';
export { Building } from '../classes/Building';
export { Player } from '../classes/Player';
export { Projectile } from '../classes/Projectile';
export { GameObject } from '../classes/GameObject';

// ============================================================================
// CONFIGS
// ============================================================================
export { CONFIG } from '../config';
export { DEV_ROOM_CONFIG } from '../config/devRoomConfig';
export { TILE_CONFIG } from '../config/tileConfig';
export { 
    MAIN_MENU_LAYOUT, 
    OPTIONS_MENU_LAYOUT, 
    LEVEL_SELECT_LAYOUT, 
    MENU_SCALES, 
    MENU_ANIMATIONS,
    AUDIO_SETTINGS_LAYOUT,
    SETTINGS_SCALES,
    CONTROLS_LAYOUT
} from '../config/menuLayout';
export { KeyBindings } from '../config/defaultSettings';

// ============================================================================
// OTHER SCENES (for scene transitions)
// ============================================================================
export { PauseMenuScene } from '../scenes/PauseMenuScene';
export { MenuScene } from '../scenes/MenuScene';
// Note: Don't export DevRoomScene, EntityShowcaseScene, etc. to avoid circular dependencies
