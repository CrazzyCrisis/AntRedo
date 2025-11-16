/**
 * Resource Display UI Component
 * Shows resource counts (Food, Wood, Stone, Magic Crystals) for a faction
 * Also displays pending resources (held by ants) with a "+N" indicator
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { drawUIPanel, formatNumberWithCommas } from '../../utils/helpers';

interface ResourceCounts {
    food: number;
    wood: number;
    stone: number;
    magicCrystals: number;
}

interface PendingResourceCounts {
    food: number;
    wood: number;
    stone: number;
    magicCrystal: number; // Note: singular, matches InventoryComponent
}

/**
 * ResourceDisplayComponent - UI overlay showing faction resources
 */
export class ResourceDisplayComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 1000; // High depth to appear on top
    public scale: number = 1.0; // Configurable scale multiplier
    
    private x: number;
    private y: number;
    private factionId: string;
    private resources: ResourceCounts;
    private pending: PendingResourceCounts; // Resources held by ants
    private entityManager: any | null = null; // For querying ants
    private baseIconSize: number = 24;
    private baseSpacing: number = 120;
    private baseFontSize: number = 16;
    private sprites: {
        food?: any;
        wood?: any;
        stone?: any;
        magicCrystal?: any;
    } = {};

    constructor(x: number, y: number, factionId: string, sprites?: { food?: any; wood?: any; stone?: any; magicCrystal?: any }) {
        this.x = x;
        this.y = y;
        this.factionId = factionId;
        if (sprites) {
            this.sprites = sprites;
        }
        this.resources = {
            food: 0,
            wood: 0,
            stone: 0,
            magicCrystals: 0
        };
        this.pending = {
            food: 0,
            wood: 0,
            stone: 0,
            magicCrystal: 0
        };
        
        this.setupEventListeners();
    }

    /**
     * Set EntityManager reference for querying ant inventories
     */
    public setEntityManager(entityManager: any): void {
        this.entityManager = entityManager;
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
     * Calculate pending resources from ant inventories
     */
    private updatePendingResources(): void {
        if (!this.entityManager) {
            this.pending = { food: 0, wood: 0, stone: 0, magicCrystal: 0 };
            return;
        }

        // Reset pending counts
        this.pending = { food: 0, wood: 0, stone: 0, magicCrystal: 0 };

        // Query all ants in faction
        const allEntities = this.entityManager.getAllEntities();
        for (const entity of allEntities) {
            // Check if ant and in our faction
            if (entity.entityType === 'ant' && entity.getFactionId && entity.getFactionId() === this.factionId) {
                const inventory = entity.getComponent('Inventory');
                if (inventory) {
                    this.pending.food += inventory.getItemCount('food');
                    this.pending.wood += inventory.getItemCount('wood');
                    this.pending.stone += inventory.getItemCount('stone');
                    this.pending.magicCrystal += inventory.getItemCount('magicCrystal');
                }
            }
        }
    }

    /**
     * Render resource display
     */
    render(graphics: any): void {
        graphics.push();
        
        // Update pending resources before rendering
        this.updatePendingResources();
        
        // Apply scale to all sizes
        const iconSize = this.baseIconSize * this.scale;
        const spacing = this.baseSpacing * this.scale;
        const fontSize = this.baseFontSize * this.scale;
        
        // Draw semi-transparent background panel
        drawUIPanel(graphics, this.x - 10, this.y - 10, spacing * 4 + 20, iconSize + 30, '#000000', 150, 5);
        
        // Text settings
        graphics.textAlign(graphics.LEFT || 'left', graphics.CENTER || 'center');
        graphics.textSize(fontSize);
        graphics.fill(255, 255, 255);

        // Draw each resource (stored + pending)
        this.drawResource(graphics, this.sprites.food || '🍖', this.resources.food, this.pending.food, 0, [255, 200, 100], iconSize, spacing, fontSize); // Food - orange
        this.drawResource(graphics, this.sprites.wood || '🪵', this.resources.wood, this.pending.wood, 1, [139, 90, 43], iconSize, spacing, fontSize); // Wood - brown
        this.drawResource(graphics, this.sprites.stone || '🪨', this.resources.stone, this.pending.stone, 2, [150, 150, 150], iconSize, spacing, fontSize); // Stone - gray
        this.drawResource(graphics, this.sprites.magicCrystal || '💎', this.resources.magicCrystals, this.pending.magicCrystal, 3, [150, 100, 255], iconSize, spacing, fontSize); // Crystals - purple

        graphics.pop();
    }

    /**
     * Draw individual resource icon and count (with pending)
     */
    private drawResource(graphics: any, iconOrSprite: any, count: number, pendingCount: number, index: number, color: number[], iconSize: number, spacing: number, fontSize: number): void {
        const xPos = this.x + (index * spacing);
        const yPos = this.y + iconSize / 2;

        // Draw icon (sprite if available, emoji fallback)
        if (typeof iconOrSprite === 'string') {
            // Emoji fallback
            graphics.textSize(iconSize);
            graphics.text(iconOrSprite, xPos, yPos);
        } else {
            // Sprite
            graphics.imageMode('center' as any);
            graphics.image(iconOrSprite, xPos + iconSize / 2, yPos, iconSize, iconSize);
        }

        // Draw stored count with color
        graphics.textSize(fontSize);
        graphics.fill(...color);
        const countText = formatNumberWithCommas(count);
        graphics.text(countText, xPos + iconSize + 8, yPos);

        // Draw pending count if > 0
        if (pendingCount > 0) {
            const textWidth = graphics.textWidth(countText);
            graphics.fill(100, 200, 100); // Green color for pending
            graphics.text(` +${formatNumberWithCommas(pendingCount)}`, xPos + iconSize + 8 + textWidth, yPos);
        }
    }
}
