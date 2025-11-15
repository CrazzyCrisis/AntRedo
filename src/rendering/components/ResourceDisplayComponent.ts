/**
 * Resource Display UI Component
 * Shows resource counts (Food, Wood, Stone, Magic Crystals) for a faction
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';

interface ResourceCounts {
    food: number;
    wood: number;
    stone: number;
    magicCrystals: number;
}

/**
 * ResourceDisplayComponent - UI overlay showing faction resources
 */
export class ResourceDisplayComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 1000; // High depth to appear on top
    
    private x: number;
    private y: number;
    private factionId: string;
    private resources: ResourceCounts;
    private iconSize: number = 24;
    private spacing: number = 120;
    private fontSize: number = 16;

    constructor(x: number, y: number, factionId: string) {
        this.x = x;
        this.y = y;
        this.factionId = factionId;
        this.resources = {
            food: 0,
            wood: 0,
            stone: 0,
            magicCrystals: 0
        };
        
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for resource updates
        EventBus.on(GameEvents.RESOURCE_UPDATED, (factionId: string, resourceType: string, newAmount: number) => {
            if (factionId === this.factionId) {
                this.updateResourceCount(resourceType, newAmount);
            }
        });
    }

    /**
     * Update specific resource count
     */
    updateResourceCount(type: string, amount: number): void {
        const resourceKey = type.toLowerCase();
        if (resourceKey in this.resources) {
            (this.resources as any)[resourceKey] = amount;
        }
    }

    /**
     * Set all resource counts at once
     */
    setResources(resources: Partial<ResourceCounts>): void {
        this.resources = { ...this.resources, ...resources };
    }

    /**
     * Update position
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Format number with commas (e.g., 1000 -> "1,000")
     */
    private formatNumber(num: number): string {
        return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Render resource display
     */
    render(graphics: any): void {
        graphics.push();
        
        // Draw semi-transparent background panel
        graphics.fill(0, 0, 0, 150);
        graphics.noStroke();
        graphics.rect(this.x - 10, this.y - 10, this.spacing * 4 + 20, this.iconSize + 30, 5);
        
        // Text settings
        graphics.textAlign(graphics.LEFT || 'left', graphics.CENTER || 'center');
        graphics.textSize(this.fontSize);
        graphics.fill(255, 255, 255);

        // Draw each resource
        this.drawResource(graphics, '🍖', this.resources.food, 0, [255, 200, 100]); // Food - orange
        this.drawResource(graphics, '🪵', this.resources.wood, 1, [139, 90, 43]); // Wood - brown
        this.drawResource(graphics, '🪨', this.resources.stone, 2, [150, 150, 150]); // Stone - gray
        this.drawResource(graphics, '💎', this.resources.magicCrystals, 3, [150, 100, 255]); // Crystals - purple

        graphics.pop();
    }

    /**
     * Draw individual resource icon and count
     */
    private drawResource(graphics: any, icon: string, count: number, index: number, color: number[]): void {
        const xPos = this.x + (index * this.spacing);
        const yPos = this.y + this.iconSize / 2;

        // Draw icon (emoji fallback - in production would use sprite)
        graphics.textSize(this.iconSize);
        graphics.text(icon, xPos, yPos);

        // Draw count with color
        graphics.textSize(this.fontSize);
        graphics.fill(...color);
        graphics.text(this.formatNumber(count), xPos + this.iconSize + 8, yPos);
    }
}
