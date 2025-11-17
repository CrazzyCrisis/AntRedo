/**
 * BuildingMenuComponent - Hierarchical Building Selection Menu (UI)
 * Two-tier system: Category selection → Building selection
 * Categories: STORAGE, UNITS, BOOSTS, DEFENSE
 * Positioned above BUILD button, shows unlock status and affordability
 */

import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { 
    getBuildingByType, 
    getBuildingsByUICategory, 
    BuildingUICategory,
    BuildingType
} from '../../config/buildings/buildingConfig';
import { QuestManager } from '../../managers/QuestManager';
import { ResourceManager } from '../../managers/ResourceManager';
import { drawUIPanel, isPointInRect } from '../../utils/helpers';
import { GAME_UI_CONFIG } from '../../config/ui/gameUIConfig';

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

interface CategoryButton {
    category: BuildingUICategory;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
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
    private filteredButtons: BuildingButton[] = []; // Currently displayed buildings
    
    // Category system
    private categoryButtons: CategoryButton[] = [];
    private selectedCategory: BuildingUICategory | null = null;
    private hoveredCategory: BuildingUICategory | null = null;
    
    // Resource icon sprites (wood, stone, etc.)
    private resourceSprites: Map<string, any> = new Map();
    
    // Layout configuration from gameUIConfig
    private buttonWidth: number = GAME_UI_CONFIG.SIZES.BUILDING_MENU_BUTTON_WIDTH;
    private buttonHeight: number = GAME_UI_CONFIG.SIZES.BUILDING_MENU_BUTTON_HEIGHT;
    private spacing: number = GAME_UI_CONFIG.BUILDING_MENU.BUTTON_SPACING;
    private padding: number = GAME_UI_CONFIG.BUILDING_MENU.PANEL_PADDING;
    
    // Category button configuration
    private categoryWidth: number = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_BUTTON_WIDTH;
    private categoryHeight: number = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_BUTTON_HEIGHT;
    private categorySpacing: number = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_SPACING;
    
    private hoveredButton: BuildingType | null = null;

    // Canvas dimensions for normalized coordinate calculations and window resize
    // @ts-ignore - canvasWidth stored for future use in calculations
    private canvasWidth: number;
    private canvasHeight: number;

    /**
     * Create building menu component
     * @param canvasWidth - Canvas width for normalized coordinate calculation
     * @param canvasHeight - Canvas height for normalized coordinate calculation
     * @param factionId - Faction ID for resource checking
     * @param resourceSprites - Object with resource sprite references {wood, stone}
     */
    constructor(canvasWidth: number, canvasHeight: number, factionId: string, resourceSprites: any) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.factionId = factionId;
        
        // Calculate position from normalized coordinates in config
        const halfWidth = canvasWidth / 2;
        const halfHeight = canvasHeight / 2;
        this.centerX = (canvasWidth / 2) + (GAME_UI_CONFIG.LAYOUT.BUILDING_MENU.offsetX * halfWidth);
        this.centerY = (canvasHeight / 2) - (GAME_UI_CONFIG.LAYOUT.BUILDING_MENU.offsetY * halfHeight);
        
        // Store resource sprites
        if (resourceSprites.wood) this.resourceSprites.set('wood', resourceSprites.wood);
        if (resourceSprites.stone) this.resourceSprites.set('stone', resourceSprites.stone);
        
        this.initializeCategoryButtons();
        this.initializeButtons();
        
        // Subscribe to resource updates to refresh button states
        EventBus.on(GameEvents.RESOURCE_UPDATED, () => {
            if (this.visible) {
                this.updateButtonStates();
            }
        });
    }

    /**
     * Initialize category buttons in horizontal layout
     * Categories: STORAGE, UNITS, BOOSTS, DEFENSE
     */
    private initializeCategoryButtons(): void {
        const categories: { category: BuildingUICategory; label: string }[] = [
            { category: BuildingUICategory.STORAGE, label: 'STORAGE' },
            { category: BuildingUICategory.UNITS, label: 'UNITS' },
            { category: BuildingUICategory.BOOSTS, label: 'BOOSTS' },
            { category: BuildingUICategory.DEFENSE, label: 'DEFENSE' }
        ];
        
        // Calculate total width of category row
        const totalWidth = categories.length * this.categoryWidth + 
                          (categories.length - 1) * this.categorySpacing;
        
        // Starting X position (left edge of first category)
        const startX = this.centerX - (totalWidth / 2);
        
        // Category Y position (above building buttons) - use normalized offset from config
        const halfHeight = this.canvasHeight / 2;
        const categoryOffsetPixels = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_ROW_OFFSET_Y * halfHeight;
        const categoryY = this.centerY - categoryOffsetPixels;
        
        this.categoryButtons = categories.map((cat, index) => ({
            category: cat.category,
            label: cat.label,
            x: startX + index * (this.categoryWidth + this.categorySpacing),
            y: categoryY,
            width: this.categoryWidth,
            height: this.categoryHeight
        }));
    }

    /**
     * Initialize building buttons in horizontal layout
     * Buttons are centered on centerX, positioned at centerY
     * Creates ALL building buttons but only displays filtered subset
     */
    private initializeButtons(): void {
        // Phase 4: All 12 building types from centralized config
        const buildingTypes: BuildingType[] = [
            'warehouse', 'barracks', 'tower',        // Original 3
            'nest',                                  // STORAGE
            'builderHut', 'gathererHut', 'spitterHut', // SPAWNER
            'speedBeacon', 'attackBeacon', 'attackSpeedBeacon', 'gatherSpeedBeacon', 'terrainNullifierBeacon' // STAT_BOOST
        ];
        const questManager = QuestManager.getInstance();
        const resourceManager = ResourceManager.getInstance();
        
        // Calculate layout assuming max 5 buildings per category (largest is BOOSTS with 5)
        
        // Button Y position (below category buttons)
        const buttonY = this.centerY;
        
        buildingTypes.forEach((type) => {
            const config = getBuildingByType(type);
            const unlocked = questManager.isBuildingUnlocked(type);
            const canAfford = resourceManager.canAfford(this.factionId, config.costs);
            
            const button = {
                buildingType: type,
                name: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
                x: 0, // Position calculated when filtering
                y: buttonY,
                width: this.buttonWidth,
                height: this.buttonHeight,
                unlocked,
                canAfford
            };
            
            this.buttons.push(button);
        });
        
        // Initially no category selected - show placeholder
        this.filteredButtons = [];
    }

    /**
     * Select a category and filter buildings
     * @param category - UI category to display
     */
    private selectCategory(category: BuildingUICategory): void {
        this.selectedCategory = category;
        
        // Get building types in this category
        const categoryBuildingTypes = getBuildingsByUICategory(category);
        
        // Filter buttons by category
        this.filteredButtons = this.buttons.filter(btn => 
            categoryBuildingTypes.includes(btn.buildingType)
        );
        
        // Calculate positions for filtered buttons (centered)
        const totalWidth = this.filteredButtons.length * this.buttonWidth + 
                          (this.filteredButtons.length - 1) * this.spacing;
        const startX = this.centerX - (totalWidth / 2);
        
        this.filteredButtons.forEach((btn, index) => {
            btn.x = startX + index * (this.buttonWidth + this.spacing);
        });
        
        console.log(`[BuildingMenu] Category '${category}' selected, showing ${this.filteredButtons.length} buildings`);
    }

    /**
     * Show the menu (called when BUILD button clicked)
     */
    public show(): void {
        this.visible = true;
        this.selectedCategory = null; // Reset selection
        this.filteredButtons = [];
        this.updateButtonStates();
    }

    /**
     * Hide the menu
     */
    public hide(): void {
        this.visible = false;
        this.hoveredButton = null;
        this.hoveredCategory = null;
        this.selectedCategory = null;
    }

    /**
     * Update button states (unlock status, affordability)
     */
    private updateButtonStates(): void {
        const questManager = QuestManager.getInstance();
        const resourceManager = ResourceManager.getInstance();
        
        this.buttons.forEach(btn => {
            btn.unlocked = questManager.isBuildingUnlocked(btn.buildingType);
            const config = getBuildingByType(btn.buildingType);
            btn.canAfford = resourceManager.canAfford(this.factionId, config.costs);
        });
    }

    /**
     * Handle mouse click
     * Two-tier interaction: Category selection → Building selection
     * @param x - Mouse X position
     * @param y - Mouse Y position
     */
    public handleClick(x: number, y: number): boolean {
        if (!this.visible) {
            return false; // Menu not visible, didn't handle click
        }
        
        console.log(`[BuildingMenu] Click at (${x}, ${y})`);
        
        // Check category button clicks first
        for (const catBtn of this.categoryButtons) {
            if (isPointInRect(x, y, catBtn.x, catBtn.y, catBtn.width, catBtn.height, false)) {
                console.log(`[BuildingMenu] Category clicked: ${catBtn.category}`);
                this.selectCategory(catBtn.category);
                return true; // Click consumed
            }
        }
        
        // Check building button clicks (only if category selected)
        for (const btn of this.filteredButtons) {
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
     * Detects hover on both category and building buttons
     * @param x - Mouse X position
     * @param y - Mouse Y position
     */
    public handleMouseMove(x: number, y: number): void {
        if (!this.visible) return;
        
        const previousHoverButton = this.hoveredButton;
        const previousHoverCategory = this.hoveredCategory;
        this.hoveredButton = null;
        this.hoveredCategory = null;
        
        // Check category button hovers
        for (const catBtn of this.categoryButtons) {
            if (isPointInRect(x, y, catBtn.x, catBtn.y, catBtn.width, catBtn.height, false)) {
                this.hoveredCategory = catBtn.category;
                break;
            }
        }
        
        // Check building button hovers
        for (const btn of this.filteredButtons) {
            if (isPointInRect(x, y, btn.x, btn.y, btn.width, btn.height, false)) {
                if (previousHoverButton !== btn.buildingType) {
                    console.log(`[BuildingMenu] Hover: ${btn.buildingType}`);
                }
                this.hoveredButton = btn.buildingType;
                break;
            }
        }
        
        // Mark dirty if hover state changed
        if (previousHoverButton !== this.hoveredButton || previousHoverCategory !== this.hoveredCategory) {
            // Trigger re-render by emitting event or directly marking dirty
            // Note: This component doesn't have direct access to renderer
            // The GameUIOverlay or DevRoomScene should mark UI layer dirty
        }
    }

    /**
     * Render the building menu
     * Two-row layout: Category buttons on top, building buttons below
     * @param graphics - p5.js graphics context
     */
    render(graphics: any): void {
        if (!this.visible) return;
        
        // Calculate panel dimensions for both rows
        const categoryRowWidth = this.categoryButtons.length * this.categoryWidth + 
                                 (this.categoryButtons.length - 1) * this.categorySpacing + 
                                 this.padding * 2;
        
        const buildingRowWidth = this.filteredButtons.length > 0 
            ? this.filteredButtons.length * this.buttonWidth + 
              (this.filteredButtons.length - 1) * this.spacing + 
              this.padding * 2
            : categoryRowWidth; // Use category width if no buildings shown
        
        const maxWidth = Math.max(categoryRowWidth, buildingRowWidth);
        
        // Category panel
        const categoryPanelHeight = this.categoryHeight + this.padding * 2;
        const categoryPanelX = this.centerX - (maxWidth / 2);
        const halfHeight = this.canvasHeight / 2;
        const categoryOffsetPixels = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_ROW_OFFSET_Y * halfHeight;
        const categoryPanelY = this.centerY - categoryOffsetPixels - this.padding;
        
        // Draw category panel background
        drawUIPanel(
            graphics, 
            categoryPanelX, 
            categoryPanelY, 
            maxWidth, 
            categoryPanelHeight,
            GAME_UI_CONFIG.BUILDING_MENU.PANEL_BACKGROUND_COLOR,
            GAME_UI_CONFIG.BUILDING_MENU.PANEL_ALPHA
        );
        
        // Draw category buttons
        this.categoryButtons.forEach(catBtn => {
            this.renderCategoryButton(graphics, catBtn);
        });
        
        // Building panel (only if category selected)
        if (this.filteredButtons.length > 0) {
            const buildingPanelHeight = this.buttonHeight + this.padding * 2;
            const buildingPanelX = this.centerX - (buildingRowWidth / 2);
            const buildingPanelY = this.centerY - this.padding;
            
            // Draw building panel background
            drawUIPanel(
                graphics, 
                buildingPanelX, 
                buildingPanelY, 
                buildingRowWidth, 
                buildingPanelHeight,
                GAME_UI_CONFIG.BUILDING_MENU.PANEL_BACKGROUND_COLOR,
                GAME_UI_CONFIG.BUILDING_MENU.PANEL_ALPHA
            );
            
            // Draw building buttons
            this.filteredButtons.forEach(btn => {
                this.renderButton(graphics, btn);
            });
        } else {
            // Show "Select a category" placeholder
            graphics.fill(200);
            graphics.noStroke();
            graphics.textSize(18);
            graphics.textAlign((window as any).CENTER, (window as any).TOP);
            graphics.text('Select a category', this.centerX, this.centerY + 20);
        }
    }

    /**
     * Render individual category button
     * @param graphics - p5.js graphics context
     * @param catBtn - Category button data
     */
    private renderCategoryButton(graphics: any, catBtn: CategoryButton): void {
        const isSelected = this.selectedCategory === catBtn.category;
        const isHovered = this.hoveredCategory === catBtn.category;
        
        // Button background color
        let bgColor: string = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_NORMAL_COLOR;
        if (isSelected) {
            bgColor = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_SELECTED_COLOR;
        } else if (isHovered) {
            bgColor = GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_HOVER_COLOR;
        }
        
        // Draw button background
        graphics.fill(bgColor);
        graphics.stroke(255);
        graphics.strokeWeight(isSelected ? 3 : (isHovered ? 2 : 1));
        graphics.rect(catBtn.x, catBtn.y, catBtn.width, catBtn.height, 5);
        
        // Category label
        graphics.fill(GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_TEXT_COLOR);
        graphics.noStroke();
        graphics.textSize(GAME_UI_CONFIG.BUILDING_MENU.CATEGORY_TEXT_SIZE);
        graphics.textAlign((window as any).CENTER, (window as any).CENTER);
        graphics.text(catBtn.label, catBtn.x + catBtn.width / 2, catBtn.y + catBtn.height / 2);
    }

    /**
     * Render individual building button
     * @param graphics - p5.js graphics context
     * @param btn - Button data
     */
    private renderButton(graphics: any, btn: BuildingButton): void {
        const config = getBuildingByType(btn.buildingType);
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
     * @param canvasWidth - New canvas width
     * @param canvasHeight - New canvas height
     */
    public setPosition(canvasWidth: number, canvasHeight: number): void {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Recalculate position from normalized coordinates in config
        const halfWidth = canvasWidth / 2;
        const halfHeight = canvasHeight / 2;
        this.centerX = (canvasWidth / 2) + (GAME_UI_CONFIG.LAYOUT.BUILDING_MENU.offsetX * halfWidth);
        this.centerY = (canvasHeight / 2) - (GAME_UI_CONFIG.LAYOUT.BUILDING_MENU.offsetY * halfHeight);
        
        this.initializeCategoryButtons(); // Recalculate category positions
        this.initializeButtons(); // Recalculate button positions
        
        // Re-filter if category was selected
        if (this.selectedCategory) {
            this.selectCategory(this.selectedCategory);
        }
    }
}
