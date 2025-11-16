import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { drawUIPanel, smoothTransition, hexToRgb } from '../../utils/helpers';
import { EntityManager } from '../../managers/EntityManager';
import { FactionManager } from '../../managers/FactionManager';

/**
 * Ant type information for breakdown display
 */
interface AntTypeCount {
    type: 'WORKER' | 'WARRIOR' | 'SCOUT';
    count: number;
    icon: any; // Sprite object (p5.Image)
    color: string; // Color for count text
}

/**
 * Population display component showing total ant count and breakdown by type
 * Features expandable section to show Worker/Warrior/Scout counts
 * Located on left side of screen
 */
export class PopulationDisplayComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 950; // Between powers (900) and resources (1000)
    public scale: number = 1.0; // Configurable scale multiplier
    
    private x: number;
    private y: number;
    private currentAnts: number = 0;
    private maxAnts: number = 50; // Default cap
    private isExpanded: boolean = false;
    
    // Ant type counts
    private antTypes: AntTypeCount[] = [
        { type: 'WORKER', count: 0, icon: null, color: '#FFD700' }, // Gold
        { type: 'WARRIOR', count: 0, icon: null, color: '#FF4444' }, // Red
        { type: 'SCOUT', count: 0, icon: null, color: '#4CAF50' }   // Green
    ];
    
    // Layout properties
    private panelWidth: number = 180;
    private panelHeight: number = 60; // Collapsed height
    private expandedHeight: number = 160; // Expanded height
    private padding: number = 12;
    private lineSpacing: number = 25;
    private fontSize: number = 14;
    private iconSize: number = 20;
    
    // Visual settings
    private backgroundColor: string = '#2C2C2C';
    private backgroundAlpha: number = 200;
    private hoverAlpha: number = 230;
    private isHovering: boolean = false;
    
    // Animation
    private currentHeight: number = 60;
    private animationSpeed: number = 0.2; // Lerp speed for smooth transitions
    private antSprite: any = null;
    private factionId: string = 'player'; // Default to player faction
    
    constructor(
        x: number,
        y: number,
        antSprite?: any,
        factionId?: string,
        jobSprites?: { worker?: any; warrior?: any; scout?: any }
    ) {
        this.x = x;
        this.y = y;
        this.currentHeight = this.panelHeight;
        if (antSprite) {
            this.antSprite = antSprite;
        }
        if (factionId) {
            this.factionId = factionId;
        }
        
        // Set job-specific sprites if provided
        if (jobSprites) {
            if (jobSprites.worker) {
                const workerType = this.antTypes.find(t => t.type === 'WORKER');
                if (workerType) workerType.icon = jobSprites.worker;
            }
            if (jobSprites.warrior) {
                const warriorType = this.antTypes.find(t => t.type === 'WARRIOR');
                if (warriorType) warriorType.icon = jobSprites.warrior;
            }
            if (jobSprites.scout) {
                const scoutType = this.antTypes.find(t => t.type === 'SCOUT');
                if (scoutType) scoutType.icon = jobSprites.scout;
            }
        }
        
        this.setupEventListeners();
    }
    
    /**
     * Subscribe to population-related events
     */
    private setupEventListeners(): void {
        // Update on ant spawn
        EventBus.on(GameEvents.ANT_SPAWNED, (_antId: string, type: string) => {
            this.currentAnts++;
            const antType = this.antTypes.find(t => t.type === type);
            if (antType) {
                antType.count++;
            }
        });
        
        // Update on ant death
        EventBus.on(GameEvents.ANT_DIED, (_antId: string, type: string) => {
            this.currentAnts--;
            const antType = this.antTypes.find(t => t.type === type);
            if (antType) {
                antType.count = Math.max(0, antType.count - 1);
            }
        });
        
        // Update max cap when buildings level up
        EventBus.on(GameEvents.BUILDING_LEVELED_UP, (_buildingId: string, _newLevel: number) => {
            // Assuming each level adds +5 to cap (adjust as needed)
            this.maxAnts += 5;
        });
        
        // Update on explicit population change events
        EventBus.on(GameEvents.POPULATION_CHANGED, (current: number, max: number) => {
            this.currentAnts = current;
            this.maxAnts = max;
        });
        
        // Update specific ant type count
        EventBus.on(GameEvents.ANT_TYPE_COUNT_CHANGED, (type: string, count: number) => {
            const antType = this.antTypes.find(t => t.type === type);
            if (antType) {
                antType.count = count;
            }
        });
    }
    
    /**
     * Update total ant count
     */
    public updateTotal(current: number, max: number): void {
        this.currentAnts = current;
        this.maxAnts = max;
    }
    
    /**
     * Update count for specific ant type
     */
    public updateTypeCount(type: 'WORKER' | 'WARRIOR' | 'SCOUT', count: number): void {
        const antType = this.antTypes.find(t => t.type === type);
        if (antType) {
            antType.count = count;
        }
    }
    
    /**
     * Set expanded state
     */
    public setExpanded(expanded: boolean): void {
        this.isExpanded = expanded;
    }
    
    /**
     * Toggle expanded state
     */
    public toggleExpanded(): void {
        this.isExpanded = !this.isExpanded;
        EventBus.emit(GameEvents.UI_POPULATION_TOGGLED, this.isExpanded);
    }
    
    /**
     * Check if mouse is over the panel
     */
    public isMouseOver(mouseX: number, mouseY: number): boolean {
        return (
            mouseX >= this.x &&
            mouseX <= this.x + this.panelWidth &&
            mouseY >= this.y &&
            mouseY <= this.y + this.currentHeight
        );
    }
    
    /**
     * Handle mouse click
     */
    public handleClick(mouseX: number, mouseY: number): void {
        if (this.isMouseOver(mouseX, mouseY)) {
            this.toggleExpanded();
        }
    }
    
    /**
     * Set hover state
     */
    public setHovered(hovered: boolean): void {
        this.isHovering = hovered;
    }
    
    /**
     * Set position
     */
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Update animation state and query real-time ant counts
     */
    public update(): void {
        // Query real-time ant counts from EntityManager
        const entityManager = EntityManager.getInstance();
        const allAnts = entityManager.getEntitiesByType('ant');
        
        // Filter ants by faction
        const factionAnts = allAnts.filter((ant: any) => ant.getFactionId() === this.factionId);
        this.currentAnts = factionAnts.length;
        
        // Get ant cap from FactionManager
        const factionManager = FactionManager.getInstance();
        const faction = factionManager.getFaction(this.factionId);
        if (faction) {
            this.maxAnts = faction.antCap;
        }
        
        // Count ants by type (job component)
        this.antTypes.forEach(antType => antType.count = 0);
        factionAnts.forEach((ant: any) => {
            const jobComponent = ant.getComponent('AntJob');
            if (jobComponent) {
                const jobName = jobComponent.getCurrentJob();
                // Map job names to display types
                if (jobName === 'GATHERER' || jobName === 'BUILDER' || jobName === 'FARMER') {
                    const workerType = this.antTypes.find(t => t.type === 'WORKER');
                    if (workerType) workerType.count++;
                } else if (jobName === 'FIGHTER') {
                    const warriorType = this.antTypes.find(t => t.type === 'WARRIOR');
                    if (warriorType) warriorType.count++;
                } else if (jobName === 'SCOUT') {
                    const scoutType = this.antTypes.find(t => t.type === 'SCOUT');
                    if (scoutType) scoutType.count++;
                } else {
                    // Default to worker if no job or unknown job
                    const workerType = this.antTypes.find(t => t.type === 'WORKER');
                    if (workerType) workerType.count++;
                }
            } else {
                // No job component, count as worker
                const workerType = this.antTypes.find(t => t.type === 'WORKER');
                if (workerType) workerType.count++;
            }
        });
        
        // Smooth height animation using helper
        const targetHeight = this.isExpanded ? this.expandedHeight : this.panelHeight;
        this.currentHeight = smoothTransition(this.currentHeight, targetHeight, this.animationSpeed, 1);
    }
    
    /**
     * Render population display
     */
    render(graphics: any): void {
        graphics.push();
        
        // Draw background panel
        const alpha = this.isHovering ? this.hoverAlpha : this.backgroundAlpha;
        drawUIPanel(graphics, this.x, this.y, this.panelWidth, this.currentHeight, this.backgroundColor, alpha, 8);
        
        // Draw total ant count (always visible)
        let currentY = this.y + this.padding;
        
        graphics.fill(255, 255, 255);
        graphics.textAlign('left' as any, 'top' as any);
        graphics.textSize(this.fontSize);
        
        // Ant icon
        if (this.antSprite) {
            graphics.imageMode('corner' as any);
            graphics.image(this.antSprite, this.x + this.padding, currentY, this.iconSize, this.iconSize);
        } else {
            graphics.textSize(this.iconSize);
            graphics.text('🐜', this.x + this.padding, currentY);
        }
        
        // Total count text
        graphics.textSize(this.fontSize);
        const totalText = `Total Ants: ${this.currentAnts}/${this.maxAnts}`;
        graphics.text(totalText, this.x + this.padding + this.iconSize + 5, currentY + 3);
        
        currentY += this.lineSpacing;
        
        // Draw expand/collapse indicator
        const indicator = this.isExpanded ? '▼' : '▶';
        graphics.textSize(12);
        graphics.fill(200, 200, 200);
        graphics.text(indicator, this.x + this.padding, currentY);
        graphics.fill(255, 255, 255);
        graphics.textSize(12);
        graphics.text('Breakdown', this.x + this.padding + 15, currentY + 2);
        
        currentY += this.lineSpacing;
        
        // Draw breakdown (only if expanded and animation progress allows)
        if (this.currentHeight > this.panelHeight + 10) {
            // Calculate fade-in alpha based on animation progress
            const fadeProgress = (this.currentHeight - this.panelHeight) / (this.expandedHeight - this.panelHeight);
            const textAlpha = Math.floor(255 * fadeProgress);
            
            // Draw separator line
            graphics.stroke(100, 100, 100, textAlpha);
            graphics.strokeWeight(1);
            graphics.line(
                this.x + this.padding,
                currentY - 5,
                this.x + this.panelWidth - this.padding,
                currentY - 5
            );
            graphics.noStroke();
            
            // Draw each ant type
            this.antTypes.forEach(antType => {
                // Icon (sprite or fallback to emoji)
                if (antType.icon) {
                    graphics.push();
                    graphics.tint(255, 255, 255, textAlpha);
                    graphics.imageMode('corner' as any);
                    graphics.image(antType.icon, this.x + this.padding + 10, currentY, this.iconSize - 4, this.iconSize - 4);
                    graphics.noTint();
                    graphics.pop();
                } else {
                    // Fallback to emoji if sprite not available
                    graphics.fill(255, 255, 255, textAlpha);
                    graphics.textSize(this.iconSize - 4);
                    const fallbackIcon = antType.type === 'WORKER' ? '🐜' : antType.type === 'WARRIOR' ? '⚔️' : '👁️';
                    graphics.text(fallbackIcon, this.x + this.padding + 10, currentY);
                }
                
                // Type name and count
                graphics.textSize(this.fontSize - 2);
                const typeColor = hexToRgb(antType.color);
                if (typeColor) {
                    graphics.fill(typeColor.r, typeColor.g, typeColor.b, textAlpha);
                } else {
                    graphics.fill(255, 255, 255, textAlpha);
                }
                const typeText = `${antType.type}: ${antType.count}`;
                graphics.text(typeText, this.x + this.padding + 35, currentY + 2);
                
                currentY += this.lineSpacing;
            });
        }
        
        graphics.pop();
    }
    
    /**
     * Cleanup
     */
    public destroy(): void {
        // EventBus listeners will be garbage collected
    }
}
