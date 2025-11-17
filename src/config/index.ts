/**
 * Centralized Config Exports
 * Barrel export file for all configuration modules
 * Organized into logical categories for easy access
 */

// ============================================================================
// UI CONFIGS
// ============================================================================
export * from './ui/gameUIConfig';
export * from './ui/menuLayout';
export * from './ui/statusBarConfig';

// ============================================================================
// GAMEPLAY CONFIGS
// ============================================================================
export * from './gameplay/entityConfig';
export * from './gameplay/resourceGatheringConfig';
export * from './gameplay/spawnConfig';
export * from './gameplay/devRoomSpawnConfig';

// ============================================================================
// WORLD CONFIGS
// ============================================================================
export * from './world/worldGenConfig';
export * from './world/tileConfig';
export * from './world/tileMovementConfig';
export * from './world/environmentEffectsConfig';

// ============================================================================
// SYSTEMS CONFIGS
// ============================================================================
export * from './systems/animationConfig';
export * from './systems/audioConfig';
export * from './systems/spriteMapping';
export * from './systems/defaultSettings';

// ============================================================================
// BUILDINGS (Selective exports to avoid conflicts with entityConfig)
// ============================================================================
export { 
    BUILDINGS,
    BuildingFunctionType,
    BuildingUICategory,
    getBuildingByType,
    getBuildingDisplayName,
    getBuildingsByFunction,
    getBuildingsByUICategory,
    isBuildingUnlocked
} from './buildings/buildingConfig';
// Note: BuildingType, AntJobType, ResourceType, BuildingConfig, BuildingLevel 
// are exported from entityConfig to maintain compatibility

// ============================================================================
// VISUAL EFFECTS
// ============================================================================
export * from './visualEffects';

// ============================================================================
// DEV ROOM (Root Level)
// ============================================================================
export * from './devRoomConfig';
