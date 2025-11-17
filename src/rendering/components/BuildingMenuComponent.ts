/**
 * BuildingMenuComponent - Horizontal Building Selection Menu (UI)
 * Displays available buildings with resource costs in a horizontal layout
 * Positioned above BUILD button, shows unlock status and affordability
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { BuildingType } from '../../config/entityConfig';
import { getBuildingConfig } from '../../config/buildingConfig';
import { QuestManager } from '../../managers/QuestManager';
import { ResourceManager } from '../../managers/ResourceManager';
import { drawUIPanel, isPointInRect } from '../../utils/helpers';
import { GAME_UI_CONFIG } from '../../config/gameUIConfig';

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

/**
 * BuildingMenuComponent
 * Horizontal menu displaying available buildings with resource costs
 * Shows lock icons for locked buildings, color-codes affordability
 */
export class BuildingMenuComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 900; // High depth for UI visibility
    public visible: boolean = false;

    private centerX: number;
    private centerY: number;
    private factionId: string;
    private buttons: BuildingButton[] = [];
    
    // Resource icon sprites (wood, stone, etc.)
    private resourceSprites: Map<string, any> = new Map();
    
    // Layout configuration from gameUIConfig
    private buttonWidth: number = GAME_UI_CONFIG.SIZES.BUILDING_MENU_BUTTON_WIDTH;
    private buttonHeight: number = GAME_UI_CONFIG.SIZES.BUILDING_MENU_BUTTON_HEIGHT;
    private spacing: number = GAME_UI_CONFIG.BUILDING_MENU.BUTTON_SPACING;
    private padding: number = GAME_UI_CONFIG.BUILDING_MENU.PANEL_PADDING;
    
    private hoveredButton: BuildingType | null = null;

    /**
     * Create building menu component
     * @param centerX - Center X position (from config normalized coordinates)
     * @param centerY - Center Y position (from config normalized coordinates)
     * @param factionId - Faction ID for resource checking
     * @param resourceSprites - Object with resource sprite references {wood, stone}
     */
    constructor(centerX: number, centerY: number, factionId: string, resourceSprites: any) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.factionId = factionId;
        
        // Store resource sprites
        if (resourceSprites.wood) this.resourceSprites.set('wood', resourceSprites.wood);
        if (resourceSprites.stone) this.resourceSprites.set('stone', resourceSprites.stone);
        
        this.initializeButtons();
    }

    /**
     * Initialize building buttons in horizontal layout
     * Buttons are centered on centerX, positioned at centerY
     * Phase 4: Now supports all 12 building types
     */
    private initializeButtons(): void {
        // Phase 4: All 12 building types from centralized config
        const buildingTypes: BuildingType[] = [
            'warehouse', 'barracks', 'tower',        // Original 3
            'nest',                                  // STORAGE
            'builderHut', 'gathererHut', 'spitterHut', // SPAWNER
            'speedBeacon', 'attackBeacon', 'attackSpeedBeacon', 'gatherSpeedBeacon', 'terrainBeacon' // STAT_BOOST
        ];
        const questManager = QuestManager.getInstance();
        const resourceManager = ResourceManager.getInstance();
        
        // Calculate total width of button row
        const totalWidth = buildingTypes.length * this.buttonWidth + 
                          (buildingTypes.length - 1) * this.spacing;
        
        // Starting X position (left edge of first button)
        const startX = this.centerX - (totalWidth / 2);
        
        // Button Y position (centerY is already adjusted for proper positioning)
        // No additional offset needed - centerY is the top of the buttons
        const buttonY = this.centerY;
        
        buildingTypes.forEach((type, index) => {
            const config = getBuildingConfig(type);
            const unlocked = questManager.isBuildingUnlocked(type);
            const canAfford = resourceManager.canAfford(this.factionId, config.costs);
            
            // Calculate X position for this button (horizontal layout)
            const buttonX = startX + index * (this.buttonWidth + this.spacing);
            
            const button = {
                buildingType: type,
                name: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
                x: buttonX,
                y: buttonY,
                width: this.buttonWidth,
                height: this.buttonHeight,
                unlocked,
                canAfford
            };
            
            console.log(`[BuildingMenu] Button '${type}' bounds: x=${buttonX}, y=${buttonY}, width=${this.buttonWidth}, height=${this.buttonHeight}, unlocked=${unlocked}`);
            
            this.buttons.push(button);
        });
    }

    /**
     * Show the menu (called when BUILD button clicked)
     */
    public show(): void {
        this.visible = true;
        this.updateButtonStates();
    }

    /**
     * Hide the menu
     */
    public hide(): void {
        this.visible = false;
        this.hoveredButton = null;
    }

    /**
     * Update button states (unlock status, affordability)
     */
    private updateButtonStates(): void {
        const questManager = QuestManager.getInstance();
        const resourceManager = ResourceManager.getInstance();
        
        this.buttons.forEach(btn => {
            btn.unlocked = questManager.isBuildingUnlocked(btn.buildingType);
            const config = getBuildingConfig(btn.buildingType);
            btn.canAfford = resourceManager.canAfford(this.factionId, config.costs);
        });
    }

    /**
     * Handle mouse click
     * @param x - Mouse X position
     * @param y - Mouse Y position
     */
    public handleClick(x: number, y: number): boolean {
        if (!this.visible) {
            return false; // Menu not visible, didn't handle click
        }
        
        console.log(`[BuildingMenu] Click at (${x}, ${y})`);
        
        for (const btn of this.buttons) {
            const inBounds = isPointInRect(x, y, btn.x, btn.y, btn.width, btn.height, false);
            
            if (inBounds) {
                console.log(`[BuildingMenu] Button clicked: ${btn.buildingType}, unlocked: ${btn.unlocked}`);
                if (btn.unlocked) {
                    console.log(`[BuildingMenu] Emitting BUILDING_SELECTED: ${btn.buildingType}`);
                    EventBus.emit(GameEvents.BUILDING_SELECTED, btn.buildingType);
                    this.hide(); // Hide menu after selection
                } else {
                    console.log(`[BuildingMenu] Button '${btn.buildingType}' is locked`);
                }
                return true; // Click was on a button (consumed)
            }
        }
        
        // Click was inside menu area but missed buttons - still consume it
        return false; // Let click through for now
    }

    /**
     * Handle mouse move for hover detection
     * @param x - Mouse X position
     * @param y - Mouse Y position
     */
    public handleMouseMove(x: number, y: number): void {
        if (!this.visible) return;
        
        const previousHover = this.hoveredButton;
        this.hoveredButton = null;
        
        for (const btn of this.buttons) {
            // Button coordinates are top-left corner, not center!
            if (isPointInRect(x, y, btn.x, btn.y, btn.width, btn.height, false)) {
                if (previousHover !== btn.buildingType) {
                    console.log(`[BuildingMenu] Hover: ${btn.buildingType}`);
                }
                this.hoveredButton = btn.buildingType;
                break;
            }
        }
        
        // Mark dirty if hover state changed
        if (previousHover !== this.hoveredButton) {
            // Trigger re-render by emitting event or directly marking dirty
            // Note: This component doesn't have direct access to renderer
            // The GameUIOverlay or DevRoomScene should mark UI layer dirty
        }
    }

    /**
     * Render the building menu
     * @param graphics - p5.js graphics context
     */
    render(graphics: any): void {
        if (!this.visible) return;
        
        // Calculate panel dimensions
        const totalWidth = this.buttons.length * this.buttonWidth + 
                          (this.buttons.length - 1) * this.spacing + 
                          this.padding * 2;
        const panelHeight = this.buttonHeight + this.padding * 2;
        const panelX = this.centerX - (totalWidth / 2);
        const panelY = this.centerY - this.padding;
        
        // Draw panel background
        drawUIPanel(
            graphics, 
            panelX, 
            panelY, 
            totalWidth, 
            panelHeight,
            GAME_UI_CONFIG.BUILDING_MENU.PANEL_BACKGROUND_COLOR,
            GAME_UI_CONFIG.BUILDING_MENU.PANEL_ALPHA
        );
        
        // Draw buttons
        this.buttons.forEach(btn => {
            this.renderButton(graphics, btn);
        });
    }

    /**
     * Render individual building button
     * @param graphics - p5.js graphics context
     * @param btn - Button data
     */
    private renderButton(graphics: any, btn: BuildingButton): void {
        const config = getBuildingConfig(btn.buildingType);
        const isHovered = this.hoveredButton === btn.buildingType;
        
        // Button background color
        let bgColor = '#444444';
        if (!btn.unlocked) {
            bgColor = '#222222'; // Dark gray for locked
        } else if (isHovered) {
            bgColor = '#555555'; // Light gray for hover
        }
        
        // Draw button background
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
        
        // Resource costs (bottom of button)
        let costX = btn.x + 10;
        const costY = btn.y + btn.height - 25;
        
        if (config.costs.wood > 0) {
            this.drawResourceCost(graphics, costX, costY, 'wood', config.costs.wood, btn.canAfford);
            costX += 60;
        }
        if (config.costs.stone > 0) {
            this.drawResourceCost(graphics, costX, costY, 'stone', config.costs.stone, btn.canAfford);
        }
    }

    /**
     * Draw resource cost icon + amount
     * @param graphics - p5.js graphics context
     * @param x - X position
     * @param y - Y position
     * @param resourceType - Resource type (wood, stone)
     * @param amount - Amount required
     * @param canAfford - Whether player can afford this cost
     */
    private drawResourceCost(
        graphics: any, 
        x: number, 
        y: number, 
        resourceType: string, 
        amount: number, 
        canAfford: boolean
    ): void {
        // Draw resource icon
        const sprite = this.resourceSprites.get(resourceType);
        if (sprite) {
            const iconSize = GAME_UI_CONFIG.BUILDING_MENU.RESOURCE_ICON_SIZE;
            graphics.image(sprite, x, y, iconSize, iconSize);
        }
        
        // Draw amount text (green if affordable, red if not)
        graphics.fill(canAfford ? '#00FF00' : '#FF0000');
        graphics.textSize(12);
        graphics.textAlign((window as any).LEFT, (window as any).TOP);
        graphics.text(`×${amount}`, x + 20, y + 2);
    }

    /**
     * Update method (for animations if needed)
     */
    public update(): void {
        // No animations currently, but available for future use
    }

    /**
     * Set position of the menu (for window resize)
     */
    public setPosition(centerX: number, centerY: number): void {
        this.centerX = centerX;
        this.centerY = centerY;
        this.initializeButtons(); // Recalculate button positions
    }
}
