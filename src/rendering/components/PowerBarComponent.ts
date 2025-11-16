import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { drawRadialCooldown, drawUIPanel } from '../../utils/helpers';

/**
 * Power information for Queen abilities
 */
interface PowerInfo {
    key: number; // 1-5
    name: string;
    sprite: any; // p5.Image
    maxCooldown: number;
    currentCooldown: number;
    isLocked: boolean;
}

/**
 * UI component displaying Queen power bar with cooldown indicators
 * Shows 5 powers (1-5 keys) with icons, cooldowns, and locked states
 * Cooldown visualization: darkened icon + radial counter-clockwise progress
 * Registered on RenderLayer.UI
 */
export class PowerBarComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 900; // Below resource display (1000)
    
    private x: number;
    private y: number;
    private powers: PowerInfo[] = [];
    
    // Layout settings
    private iconSize: number = 48;
    private spacing: number = 60; // Horizontal spacing between powers
    private padding: number = 8;
    private keyFontSize: number = 14;
    
    // Visual settings
    private backgroundColor: string = '#2C2C2C';
    private backgroundAlpha: number = 200;
    private lockedTintAlpha: number = 100; // Grayscale locked icons
    private cooldownDarkenAlpha: number = 150;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        
        this.setupEventListeners();
    }
    
    /**
     * Subscribe to power-related events
     */
    private setupEventListeners(): void {
        // Update cooldown when power is used
        EventBus.on(GameEvents.POWER_USED, (powerKey: number, cooldown: number) => {
            const power = this.powers.find(p => p.key === powerKey);
            if (power) {
                power.currentCooldown = cooldown;
                power.maxCooldown = cooldown;
            }
        });
        
        // Tick down cooldowns every frame
        EventBus.on(GameEvents.POWER_COOLDOWN_TICK, (powerKey: number, remaining: number) => {
            const power = this.powers.find(p => p.key === powerKey);
            if (power) {
                power.currentCooldown = remaining;
            }
        });
        
        // Unlock power when requirements met
        EventBus.on(GameEvents.POWER_UNLOCKED, (powerKey: number) => {
            const power = this.powers.find(p => p.key === powerKey);
            if (power) {
                power.isLocked = false;
            }
        });
        
        // Lock power (if needed)
        EventBus.on(GameEvents.POWER_LOCKED, (powerKey: number) => {
            const power = this.powers.find(p => p.key === powerKey);
            if (power) {
                power.isLocked = true;
            }
        });
    }
    
    /**
     * Add a power to the bar
     */
    public addPower(
        key: number,
        name: string,
        sprite: any,
        maxCooldown: number,
        isLocked: boolean = false
    ): void {
        this.powers.push({
            key,
            name,
            sprite,
            maxCooldown,
            currentCooldown: 0,
            isLocked
        });
        
        // Sort by key for consistent display order
        this.powers.sort((a, b) => a.key - b.key);
    }
    
    /**
     * Remove a power from the bar
     */
    public removePower(key: number): void {
        this.powers = this.powers.filter(p => p.key !== key);
    }
    
    /**
     * Set cooldown for a power
     */
    public setCooldown(key: number, current: number, max?: number): void {
        const power = this.powers.find(p => p.key === key);
        if (power) {
            power.currentCooldown = current;
            if (max !== undefined) {
                power.maxCooldown = max;
            }
        }
    }
    
    /**
     * Lock/unlock a power
     */
    public setLocked(key: number, locked: boolean): void {
        const power = this.powers.find(p => p.key === key);
        if (power) {
            power.isLocked = locked;
        }
    }
    
    /**
     * Set position
     */
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Render power bar
     */
    render(graphics: any): void {
        if (this.powers.length === 0) return;
        
        graphics.push();
        
        // Calculate total width
        const totalWidth = (this.powers.length * this.spacing) + (this.padding * 2) - (this.spacing - this.iconSize);
        const barHeight = this.iconSize + (this.padding * 2) + 20; // Extra space for labels
        
        // Draw background panel
        const panelX = this.x - totalWidth / 2;
        const panelY = this.y - barHeight / 2;
        
        drawUIPanel(graphics, panelX, panelY, totalWidth, barHeight, this.backgroundColor, this.backgroundAlpha, 8);
        
        // Draw each power
        this.powers.forEach((power, index) => {
            const powerX = this.x - (totalWidth / 2) + this.padding + (index * this.spacing);
            const powerY = this.y;
            
            // Draw power icon
            graphics.imageMode('center' as any);
            
            if (power.isLocked) {
                // Locked: grayscale tint
                if (power.sprite) {
                    graphics.tint(128, 128, 128, this.lockedTintAlpha);
                    graphics.image(power.sprite, powerX, powerY, this.iconSize, this.iconSize);
                    graphics.noTint();
                } else {
                    // Placeholder for missing sprite
                    graphics.fill(128, 128, 128);
                    graphics.rect(powerX - this.iconSize/2, powerY - this.iconSize/2, this.iconSize, this.iconSize);
                }
                
                // Draw lock icon overlay (🔒)
                graphics.fill(255, 255, 255);
                graphics.textAlign('center' as any, 'center' as any);
                graphics.textSize(20);
                graphics.text('🔒', powerX, powerY);
            } else {
                // Normal icon
                if (power.sprite) {
                    graphics.image(power.sprite, powerX, powerY, this.iconSize, this.iconSize);
                } else {
                    // Placeholder for missing sprite
                    graphics.fill(150, 50, 200);
                    graphics.rect(powerX - this.iconSize/2, powerY - this.iconSize/2, this.iconSize, this.iconSize);
                }
                
                // Draw cooldown overlay if on cooldown
                if (power.currentCooldown > 0) {
                    const progress = power.currentCooldown / power.maxCooldown;
                    drawRadialCooldown(
                        graphics,
                        powerX,
                        powerY,
                        this.iconSize,
                        progress,
                        this.cooldownDarkenAlpha
                    );
                    
                    // Draw cooldown text (seconds remaining)
                    const secondsRemaining = Math.ceil(power.currentCooldown / 60); // Assuming 60 FPS
                    graphics.fill(255, 255, 255);
                    graphics.textAlign('center' as any, 'center' as any);
                    graphics.textSize(16);
                    graphics.text(secondsRemaining.toString(), powerX, powerY);
                }
            }
            
            // Draw key number below icon
            const keyY = powerY + (this.iconSize / 2) + 15;
            graphics.fill(255, 255, 255);
            graphics.textAlign('center' as any, 'center' as any);
            graphics.textSize(this.keyFontSize);
            graphics.text(power.key.toString(), powerX, keyY);
            
            // Draw power name (optional - commented out for space)
            // const nameY = keyY + 12;
            // graphics.textSize(this.fontSize);
            // graphics.text(power.name, powerX, nameY);
        });
        
        graphics.pop();
    }
    
    /**
     * Cleanup
     */
    public destroy(): void {
        // EventBus listeners will be garbage collected
    }
}
