# Building Placement System - Code Examples

Reference implementations for building placement system components.

---

## 1. Building Configuration (`src/config/buildingConfig.ts`)

```typescript
import { BuildingType, ENTITY_CONFIG } from './entityConfig';
import { TileType } from '../world/TileSystem';

/**
 * Building placement configuration
 * Extends ENTITY_CONFIG.BUILDINGS with placement-specific properties
 */
interface BuildingPlacementConfig {
    allowedTerrain: TileType[];     // Whitelist of valid terrain types
    constructionSprite: string;     // Path to construction site sprite
    completedSprite: string;        // Path to finished building sprite
    unlocked: boolean;              // Quest unlock status (all true for now)
}

export const BUILDING_PLACEMENT_CONFIG: Record<BuildingType, BuildingPlacementConfig> = {
    warehouse: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.FARMLAND],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/warehouse.png',
        unlocked: true  // Default unlocked
    },
    barracks: {
        allowedTerrain: [TileType.GRASS, TileType.DIRT, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/barracks.png',
        unlocked: true
    },
    tower: {
        allowedTerrain: [TileType.GRASS, TileType.STONE],
        constructionSprite: 'assets/images/Buildings/construction_site.png',
        completedSprite: 'assets/images/Buildings/tower.png',
        unlocked: true
    }
};

/**
 * Get full building config (combines ENTITY_CONFIG + placement config)
 */
export function getBuildingConfig(buildingType: BuildingType) {
    return {
        ...ENTITY_CONFIG.BUILDINGS[buildingType],
        ...BUILDING_PLACEMENT_CONFIG[buildingType]
    };
}
```

---

## 2. Quest Manager Stub (`src/managers/QuestManager.ts`)

```typescript
import { BaseManager } from './BaseManager';
import { BuildingType } from '../config/entityConfig';
import { BUILDING_PLACEMENT_CONFIG } from '../config/buildingConfig';
import { GameEvents } from '../utils/eventBus';

/**
 * QuestManager - Quest System Manager (CONTROLLER)
 * Stub implementation for building unlock progression
 * Will be expanded when quest system is implemented
 */
export class QuestManager extends BaseManager {
    private static instance: QuestManager;
    private unlockedBuildings: Set<BuildingType>;

    private constructor() {
        super();
        // Initialize all buildings as unlocked (temporary)
        this.unlockedBuildings = new Set(
            Object.keys(BUILDING_PLACEMENT_CONFIG) as BuildingType[]
        );
    }

    public static getInstance(): QuestManager {
        if (!QuestManager.instance) {
            QuestManager.instance = new QuestManager();
        }
        return QuestManager.instance;
    }

    /**
     * Check if building is unlocked
     */
    public isBuildingUnlocked(buildingType: BuildingType): boolean {
        return this.unlockedBuildings.has(buildingType);
    }

    /**
     * Unlock a building (for future quest system)
     */
    public unlockBuilding(buildingType: BuildingType): void {
        if (this.unlockedBuildings.has(buildingType)) return;
        
        this.unlockedBuildings.add(buildingType);
        this.emit(GameEvents.BUILDING_UNLOCKED, buildingType);
    }

    /**
     * Lock a building (for testing)
     */
    public lockBuilding(buildingType: BuildingType): void {
        this.unlockedBuildings.delete(buildingType);
    }

    /**
     * Get all unlocked buildings
     */
    public getUnlockedBuildings(): BuildingType[] {
        return Array.from(this.unlockedBuildings);
    }

    /**
     * Cleanup
     */
    public cleanup(): void {
        this.cleanupSubscriptions();
    }
}
```

---

## 3. Building Menu Component (`src/rendering/components/BuildingMenuComponent.ts`)

```typescript
import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { BuildingType } from '../../config/entityConfig';
import { getBuildingConfig } from '../../config/buildingConfig';
import { QuestManager } from '../../managers/QuestManager';
import { ResourceManager } from '../../managers/ResourceManager';
import { drawUIPanel, isPointInRect } from '../../utils/helpers';

interface BuildingButton {
    buildingType: BuildingType;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    unlocked: boolean;
    canAfford: boolean;
}

export class BuildingMenuComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 900;

    private x: number;
    private y: number;
    private factionId: string;
    private buttons: BuildingButton[] = [];
    private visible: boolean = false;
    
    // Resource icon sprites
    private resourceSprites: Map<string, any> = new Map();
    
    // Layout
    private buttonWidth: number = 200;
    private buttonHeight: number = 60;
    private spacing: number = 10;
    private padding: number = 15;
    
    private hoveredButton: BuildingType | null = null;

    constructor(x: number, y: number, factionId: string, resourceSprites: any) {
        this.x = x;
        this.y = y;
        this.factionId = factionId;
        
        // Load resource sprites (wood, stone, etc.)
        this.resourceSprites.set('wood', resourceSprites.wood);
        this.resourceSprites.set('stone', resourceSprites.stone);
        
        this.initializeButtons();
    }

    private initializeButtons(): void {
        const buildingTypes: BuildingType[] = ['warehouse', 'barracks', 'tower'];
        const questManager = QuestManager.getInstance();
        const resourceManager = ResourceManager.getInstance();
        
        buildingTypes.forEach((type, index) => {
            const config = getBuildingConfig(type);
            const unlocked = questManager.isBuildingUnlocked(type);
            const canAfford = resourceManager.hasResources(this.factionId, config.costs);
            
            this.buttons.push({
                buildingType: type,
                name: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize
                x: this.x,
                y: this.y - (index * (this.buttonHeight + this.spacing)),
                width: this.buttonWidth,
                height: this.buttonHeight,
                unlocked,
                canAfford
            });
        });
    }

    public show(): void {
        this.visible = true;
        this.updateButtonStates();
    }

    public hide(): void {
        this.visible = false;
    }

    private updateButtonStates(): void {
        const questManager = QuestManager.getInstance();
        const resourceManager = ResourceManager.getInstance();
        
        this.buttons.forEach(btn => {
            btn.unlocked = questManager.isBuildingUnlocked(btn.buildingType);
            const config = getBuildingConfig(btn.buildingType);
            btn.canAfford = resourceManager.hasResources(this.factionId, config.costs);
        });
    }

    public handleClick(x: number, y: number): void {
        if (!this.visible) return;
        
        for (const btn of this.buttons) {
            if (isPointInRect(x, y, btn.x, btn.y, btn.width, btn.height)) {
                if (btn.unlocked) {
                    EventBus.emit(GameEvents.BUILDING_SELECTED, btn.buildingType);
                    this.hide();
                }
                return;
            }
        }
    }

    public handleMouseMove(x: number, y: number): void {
        if (!this.visible) return;
        
        this.hoveredButton = null;
        for (const btn of this.buttons) {
            if (isPointInRect(x, y, btn.x, btn.y, btn.width, btn.height)) {
                this.hoveredButton = btn.buildingType;
                return;
            }
        }
    }

    render(graphics: any): void {
        if (!this.visible) return;
        
        // Draw panel background
        const panelHeight = this.buttons.length * (this.buttonHeight + this.spacing) + this.padding * 2;
        drawUIPanel(graphics, this.x - this.padding, this.y - panelHeight, 
                    this.buttonWidth + this.padding * 2, panelHeight, 
                    '#2C2C2C', 200);
        
        // Draw buttons
        this.buttons.forEach(btn => {
            const config = getBuildingConfig(btn.buildingType);
            const isHovered = this.hoveredButton === btn.buildingType;
            
            // Button background
            let bgColor = '#444444';
            if (!btn.unlocked) bgColor = '#222222'; // Locked
            else if (isHovered) bgColor = '#555555'; // Hover
            
            graphics.fill(bgColor);
            graphics.stroke(255);
            graphics.strokeWeight(isHovered ? 3 : 2);
            graphics.rect(btn.x, btn.y, btn.width, btn.height, 5);
            
            // Building name
            graphics.fill(btn.unlocked ? 255 : 128);
            graphics.noStroke();
            graphics.textSize(16);
            graphics.textAlign((window as any).LEFT, (window as any).TOP);
            graphics.text(btn.name, btn.x + 10, btn.y + 10);
            
            // Lock icon if locked
            if (!btn.unlocked) {
                graphics.textSize(20);
                graphics.text('🔒', btn.x + btn.width - 30, btn.y + 10);
            }
            
            // Resource costs
            let costX = btn.x + 10;
            const costY = btn.y + btn.height - 30;
            
            if (config.costs.wood > 0) {
                this.drawResourceCost(graphics, costX, costY, 'wood', config.costs.wood, btn.canAfford);
                costX += 60;
            }
            if (config.costs.stone > 0) {
                this.drawResourceCost(graphics, costX, costY, 'stone', config.costs.stone, btn.canAfford);
            }
        });
    }

    private drawResourceCost(graphics: any, x: number, y: number, resourceType: string, amount: number, canAfford: boolean): void {
        // Draw resource icon
        const sprite = this.resourceSprites.get(resourceType);
        if (sprite) {
            graphics.image(sprite, x, y, 16, 16);
        }
        
        // Draw amount text
        graphics.fill(canAfford ? '#00FF00' : '#FFFF00'); // Green if affordable, yellow if not
        graphics.textSize(12);
        graphics.textAlign((window as any).LEFT, (window as any).TOP);
        graphics.text(`x${amount}`, x + 20, y + 2);
    }
}
```

---

## 4. Building Placement Manager (`src/managers/BuildingPlacementManager.ts`)

```typescript
import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';
import { BuildingType } from '../config/entityConfig';
import { getBuildingConfig } from '../config/buildingConfig';
import { SpriteComponent } from '../rendering/components/SpriteComponent';
import { RenderLayer } from '../rendering/RenderLayer';
import { Renderer } from '../rendering/Renderer';
import { Camera } from '../rendering/Camera';
import { worldToGrid, gridToWorldCenter } from '../utils/helpers';
import { TileGrid } from '../world/TileGrid';
import { ResourceManager } from './ResourceManager';
import { BuildingManager } from './BuildingManager';
import { TILE_CONFIG } from '../config/tileConfig';

type ValidationState = 'valid' | 'invalid_terrain' | 'invalid_collision' | 'insufficient_resources';

export class BuildingPlacementManager extends BaseManager {
    private static instance: BuildingPlacementManager;
    
    private isPlacementActive: boolean = false;
    private currentBuildingType: BuildingType | null = null;
    private ghostSprite: SpriteComponent | null = null;
    private currentGridX: number = 0;
    private currentGridY: number = 0;
    private validationState: ValidationState = 'valid';
    
    private renderer: Renderer | null = null;
    private camera: Camera | null = null;
    private tileGrid: TileGrid | null = null;
    private factionId: string = '';

    private constructor() {
        super();
        this.setupEventListeners();
    }

    public static getInstance(): BuildingPlacementManager {
        if (!BuildingPlacementManager.instance) {
            BuildingPlacementManager.instance = new BuildingPlacementManager();
        }
        return BuildingPlacementManager.instance;
    }

    public initialize(renderer: Renderer, camera: Camera, tileGrid: TileGrid, factionId: string): void {
        this.renderer = renderer;
        this.camera = camera;
        this.tileGrid = tileGrid;
        this.factionId = factionId;
    }

    private setupEventListeners(): void {
        this.subscribe(GameEvents.BUILDING_SELECTED, (buildingType: BuildingType) => {
            this.activatePlacement(buildingType);
        });
        
        this.subscribe(GameEvents.INPUT_KEY_PRESS, (key: string) => {
            if (key === 'Escape' && this.isPlacementActive) {
                this.cancelPlacement();
            }
        });
    }

    public activatePlacement(buildingType: BuildingType): void {
        if (!this.renderer) return;
        
        this.currentBuildingType = buildingType;
        this.isPlacementActive = true;
        
        // Create ghost sprite
        const config = getBuildingConfig(buildingType);
        const constructionSprite = (window as any).loadImage(config.constructionSprite);
        
        this.ghostSprite = new SpriteComponent(
            constructionSprite,
            0,
            0,
            RenderLayer.ABOVE_ENTITIES,
            1000, // High depth for visibility
            config.size.width * TILE_CONFIG.SIZE,
            config.size.height * TILE_CONFIG.SIZE
        );
        
        // Semi-transparent
        this.ghostSprite.setTint({ r: 255, g: 255, b: 255, a: 128 });
        
        this.renderer.register(this.ghostSprite);
        this.emit(GameEvents.BUILDING_PLACEMENT_STARTED, buildingType);
    }

    public updateGhostPosition(screenX: number, screenY: number): void {
        if (!this.isPlacementActive || !this.ghostSprite || !this.camera || !this.tileGrid) return;
        
        // Convert screen to world to grid
        const worldPos = this.camera.screenToWorld(screenX, screenY);
        const gridPos = worldToGrid(worldPos.x, worldPos.y, TILE_CONFIG.SIZE);
        
        this.currentGridX = gridPos.gridX;
        this.currentGridY = gridPos.gridY;
        
        // Validate placement
        this.validationState = this.validatePlacement(this.currentGridX, this.currentGridY);
        
        // Update ghost sprite position (centered on footprint)
        const config = getBuildingConfig(this.currentBuildingType!);
        const centerX = this.currentGridX + (config.size.width - 1) * 0.5;
        const centerY = this.currentGridY + (config.size.height - 1) * 0.5;
        const worldCenter = gridToWorldCenter(centerX, centerY, TILE_CONFIG.SIZE);
        
        this.ghostSprite.setPosition(worldCenter.x, worldCenter.y);
        
        // Update ghost tint based on validation
        this.updateGhostTint();
        this.renderer!.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
    }

    private validatePlacement(gridX: number, gridY: number): ValidationState {
        if (!this.currentBuildingType || !this.tileGrid) return 'invalid_terrain';
        
        const config = getBuildingConfig(this.currentBuildingType);
        
        // Check all tiles in footprint
        for (let x = 0; x < config.size.width; x++) {
            for (let y = 0; y < config.size.height; y++) {
                const tileX = gridX + x;
                const tileY = gridY + y;
                
                // Check terrain
                const tile = this.tileGrid.getTile(tileX, tileY);
                if (!tile || !config.allowedTerrain.includes(tile.type)) {
                    return 'invalid_terrain';
                }
                
                // Check collision with existing buildings
                const buildings = BuildingManager.getInstance().getAllBuildings();
                for (const building of buildings) {
                    const occupiedTiles = building.getOccupiedTiles();
                    if (occupiedTiles.some(t => t.gridX === tileX && t.gridY === tileY)) {
                        return 'invalid_collision';
                    }
                }
            }
        }
        
        // Check resources
        if (!ResourceManager.getInstance().hasResources(this.factionId, config.costs)) {
            return 'insufficient_resources';
        }
        
        return 'valid';
    }

    private updateGhostTint(): void {
        if (!this.ghostSprite) return;
        
        switch (this.validationState) {
            case 'valid':
                this.ghostSprite.setTint({ r: 0, g: 255, b: 0, a: 128 }); // Green
                break;
            case 'insufficient_resources':
                this.ghostSprite.setTint({ r: 255, g: 255, b: 0, a: 128 }); // Yellow
                break;
            case 'invalid_terrain':
            case 'invalid_collision':
                this.ghostSprite.setTint({ r: 255, g: 0, b: 0, a: 128 }); // Red
                break;
        }
    }

    public attemptPlacement(): void {
        if (!this.isPlacementActive || !this.currentBuildingType) return;
        
        if (this.validationState === 'valid') {
            // Valid placement - emit construction started event
            this.emit(GameEvents.BUILDING_CONSTRUCTION_STARTED, {
                buildingType: this.currentBuildingType,
                gridX: this.currentGridX,
                gridY: this.currentGridY,
                factionId: this.factionId
            });
            
            this.cancelPlacement();
        } else {
            // Invalid placement - emit error event
            const config = getBuildingConfig(this.currentBuildingType);
            const centerX = this.currentGridX + (config.size.width - 1) * 0.5;
            const centerY = this.currentGridY + (config.size.height - 1) * 0.5;
            const worldCenter = gridToWorldCenter(centerX, centerY, TILE_CONFIG.SIZE);
            
            this.emit(GameEvents.BUILDING_PLACEMENT_INVALID, {
                reason: this.validationState,
                position: worldCenter,
                costs: config.costs
            });
        }
    }

    public cancelPlacement(): void {
        if (!this.isPlacementActive) return;
        
        // Destroy ghost sprite
        if (this.ghostSprite && this.renderer) {
            this.ghostSprite.destroy();
            this.renderer.markLayerDirty(RenderLayer.ABOVE_ENTITIES);
        }
        
        this.isPlacementActive = false;
        this.currentBuildingType = null;
        this.ghostSprite = null;
        
        this.emit(GameEvents.BUILDING_PLACEMENT_CANCELLED);
    }

    public cleanup(): void {
        this.cancelPlacement();
        this.cleanupSubscriptions();
    }
}
```

---

## 5. Audio & VFX Feedback Integration

```typescript
// In AudioManager.ts - Add listener
this.subscribe(GameEvents.BUILDING_PLACEMENT_INVALID, () => {
    this.playSound('error'); // Use existing error sound
});

// In ParticleSystem.ts - Add listener
this.subscribe(GameEvents.BUILDING_PLACEMENT_INVALID, (data: any) => {
    const { reason, position, costs } = data;
    
    let text = '';
    let color = { r: 255, g: 0, b: 0 }; // Red
    
    if (reason === 'invalid_terrain') {
        text = 'Invalid Terrain';
    } else if (reason === 'invalid_collision') {
        text = 'Location Blocked';
    } else if (reason === 'insufficient_resources') {
        text = `Need ${costs.wood || 0} Wood, ${costs.stone || 0} Stone`;
        color = { r: 255, g: 255, b: 0 }; // Yellow
    }
    
    // Spawn floating text
    this.spawnFloatingText(position.x, position.y, text, color, 2000);
});
```

---

## 6. Update Building Factory with factionId

```typescript
// In BuildingFactory.create() - add factionId parameter
static create(
    renderer: Renderer,
    constructionSprite: any,
    completedSprite: any,
    gridX: number,
    gridY: number,
    buildingType: BuildingType,
    factionId: string  // NEW PARAMETER
): Building {
    // Pass factionId to Building constructor
    const building = new Building(gridX, gridY, buildingType, factionId);
    
    // ... rest of factory code
    
    // Emit CONSTRUCTION_SITE_CREATED with all details
    EventBus.emit(GameEvents.CONSTRUCTION_SITE_CREATED, {
        buildingId: building.id,
        gridX,
        gridY,
        buildingType,
        sizeWidth: building.size.width,
        sizeHeight: building.size.height,
        factionId
    });
    
    return building;
}
```

---

## 7. Builder AI Integration

```typescript
// In AntJobComponent.ts - Add construction site listener
private setupBuildingListeners(): void {
    if (this.jobType !== AntJobComponent.JOB_BUILDER) return;
    
    this.subscribe(GameEvents.CONSTRUCTION_SITE_CREATED, (data: any) => {
        // Only respond if not already assigned and not queen commanded
        if (this.currentTask || this.queenCommand) return;
        
        const building = EntityManager.getInstance().getEntity(data.buildingId);
        if (!building) return;
        
        // Check if this is closest construction site
        const distance = this.getDistanceToBuilding(building);
        if (distance < this.closestConstructionSiteDistance) {
            this.closestConstructionSiteDistance = distance;
            this.assignedBuilding = building;
            this.pathfindToBuilding(building);
        }
    });
}

private workOnConstruction(building: Building, deltaTime: number): void {
    // Check if adjacent to building
    const isAdjacent = this.isAdjacentTo(building);
    
    if (isAdjacent) {
        // Play build animation
        this.owner.getComponent('AnimatedSpriteSheet')?.playAnimation('build');
        
        // Increment construction progress
        const progressRate = ENTITY_CONFIG.ANT.JOBS.builder.buildSpeed || 1.0;
        const progress = progressRate * deltaTime;
        building.addProgress(progress);
        
        // Emit progress event
        EventBus.emit(GameEvents.BUILDING_CONSTRUCTION_PROGRESS, 
                      building.id, building.constructionProgress);
    } else {
        // Path to building
        this.pathfindToBuilding(building);
    }
}
```

---

These code examples provide the core implementation patterns. Adjust as needed based on actual project structure and coding standards.
