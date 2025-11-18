/**
 * Building Placement UI Component
 * Handles building placement mode with ghost preview and validation
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { worldToGrid, gridToWorld } from '../../utils/helpers';

interface BuildingType {
    name: string;
    width: number;
    height: number;
    cost: { [resource: string]: number };
}

/**
 * BuildingPlacementComponent - Interactive building placement UI
 */
export class BuildingPlacementComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 100;
    
    private isActive: boolean = false;
    private currentBuildingType: BuildingType | null = null;
    private gridX: number = 0;
    private gridY: number = 0;
    private tileSize: number;
    private isValidPlacement: boolean = false;
    private ghostSprite: any = null; // p5.Image for building sprite

    constructor(tileSize: number) {
        this.tileSize = tileSize;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for mouse movement
        EventBus.on(GameEvents.INPUT_MOUSE_MOVE, (x: number, y: number) => {
            if (this.isActive) {
                this.updateMousePosition(x, y);
            }
        });

        // Listen for placement confirmation
        EventBus.on(GameEvents.INPUT_MOUSE_CLICK, (x: number, y: number, _button: number) => {
            if (this.isActive && this.isValidPlacement) {
                this.placeBuilding(x, y);
            }
        });

        // Listen for cancellation (ESC key)
        EventBus.on(GameEvents.INPUT_KEY_PRESS, (keyCode: number) => {
            if (this.isActive && keyCode === 27) { // ESC
                this.exitPlacementMode();
            }
        });
    }

    /**
     * Enter placement mode for a building type
     */
    enterPlacementMode(buildingType: BuildingType, sprite?: any): void {
        this.isActive = true;
        this.currentBuildingType = buildingType;
        this.ghostSprite = sprite || null;
        EventBus.emit(GameEvents.BUILDING_PLACEMENT_STARTED, buildingType.name);
    }

    /**
     * Exit placement mode
     */
    exitPlacementMode(): void {
        this.isActive = false;
        this.currentBuildingType = null;
        this.ghostSprite = null;
        this.isValidPlacement = false;
        EventBus.emit(GameEvents.BUILDING_PLACEMENT_CANCELLED);
    }

    /**
     * Update mouse position and validate placement
     */
    private updateMousePosition(x: number, y: number): void {
        if (this.currentBuildingType) {
            // Snap to grid
            const gridPos = worldToGrid(x, y, this.tileSize);
            this.gridX = gridPos.col;
            this.gridY = gridPos.row;
            
            // Validate placement
            this.validatePlacement();
        }
    }

    /**
     * Validate if building can be placed at current position
     */
    private validatePlacement(): void {
        if (!this.currentBuildingType) {
            this.isValidPlacement = false;
            return;
        }

        // Emit validation request - external systems will respond
        // For now, assume valid (in production, check for overlaps, resources, etc.)
        EventBus.emit(GameEvents.BUILDING_PLACEMENT_VALIDATE, 
            this.gridX, 
            this.gridY, 
            this.currentBuildingType.width, 
            this.currentBuildingType.height,
            (isValid: boolean) => {
                this.isValidPlacement = isValid;
            }
        );
        
        // Default to valid if no response (for now)
        this.isValidPlacement = true;
    }

    /**
     * Place building at current position
     */
    private placeBuilding(_x: number, _y: number): void {
        if (!this.currentBuildingType) return;

        EventBus.emit(GameEvents.BUILDING_PLACEMENT_REQUESTED, 
            this.currentBuildingType.name,
            this.gridX,
            this.gridY
        );

        // Exit placement mode after placing
        this.exitPlacementMode();
    }

    /**
     * Get if placement mode is active
     */
    isPlacementActive(): boolean {
        return this.isActive;
    }

    /**
     * Render ghost preview
     */
    render(graphics: any): void {
        if (!this.isActive || !this.currentBuildingType) return;

        graphics.push();

        // Calculate world position snapped to grid
        const worldPos = gridToWorld(this.gridX, this.gridY, this.tileSize);
        const width = this.currentBuildingType.width * this.tileSize;
        const height = this.currentBuildingType.height * this.tileSize;

        // Determine tint color based on validity
        const tintColor = this.isValidPlacement 
            ? [100, 255, 100, 150]  // Green - valid
            : [255, 100, 100, 150]; // Red - invalid

        // Draw ghost preview
        if (this.ghostSprite) {
            // Draw sprite with tint
            graphics.tint(...tintColor);
            graphics.image(this.ghostSprite, worldPos.x, worldPos.y, width, height);
            graphics.noTint();
        } else {
            // Fallback: Draw colored rectangle
            graphics.fill(...tintColor);
            graphics.noStroke();
            graphics.rect(worldPos.x, worldPos.y, width, height);
        }

        // Draw grid outline
        graphics.noFill();
        graphics.stroke(this.isValidPlacement ? [100, 255, 100] : [255, 100, 100]);
        graphics.strokeWeight(2);
        graphics.rect(worldPos.x, worldPos.y, width, height);

        // Draw size indicators (tile grid overlay)
        graphics.stroke(255, 255, 255, 100);
        graphics.strokeWeight(1);
        for (let col = 0; col <= this.currentBuildingType.width; col++) {
            const x = worldPos.x + col * this.tileSize;
            graphics.line(x, worldPos.y, x, worldPos.y + height);
        }
        for (let row = 0; row <= this.currentBuildingType.height; row++) {
            const y = worldPos.y + row * this.tileSize;
            graphics.line(worldPos.x, y, worldPos.x + width, y);
        }

        // Draw building info text
        graphics.fill(255, 255, 255);
        graphics.noStroke();
        graphics.textAlign(graphics.CENTER || 'center', graphics.TOP || 'top');
        graphics.textSize(14);
        graphics.text(
            `${this.currentBuildingType.name} (${this.currentBuildingType.width}x${this.currentBuildingType.height})`,
            worldPos.x + width / 2,
            worldPos.y - 20
        );

        // Draw cost requirements
        graphics.textSize(12);
        const costText = Object.entries(this.currentBuildingType.cost)
            .map(([resource, amount]) => `${resource}: ${amount}`)
            .join(' | ');
        graphics.text(costText, worldPos.x + width / 2, worldPos.y - 5);

        graphics.pop();
    }
}
