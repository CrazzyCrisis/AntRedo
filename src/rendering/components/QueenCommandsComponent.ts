import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';
import { EventBus, GameEvents } from '../../utils/eventBus';
import { drawUIPanel, isPointInRect, getButtonStateColor } from '../../utils/helpers';

/**
 * Queen command types
 */
export type QueenCommand = 'FIGHT' | 'BUILD' | 'GATHER' | 'FOLLOW';

/**
 * Command button information
 */
interface CommandButton {
    command: QueenCommand;
    label: string;
    icon: string; // Emoji
    enabled: boolean;
    selected: boolean;
    x: number;
    y: number;
}

/**
 * Queen Commands UI Component
 * Displays 4 command buttons for directing ants within command range
 * Bottom mid-left position with horizontal layout
 */
export class QueenCommandsComponent implements Renderable {
    public layer: RenderLayer = RenderLayer.UI;
    public depth: number = 850; // Below power bar (900)
    
    private x: number;
    private y: number;
    private commands: CommandButton[] = [];
    
    // Layout settings
    private buttonSize: number = 56;
    private spacing: number = 70; // Horizontal spacing between buttons
    private padding: number = 10;
    private labelFontSize: number = 10;
    private iconSize: number = 28;
    
    // Visual settings
    private backgroundColor: string = '#2C2C2C';
    private backgroundAlpha: number = 200;
    private normalColor: string = '#444444';
    private hoverColor: string = '#555555';
    private selectedColor: string = '#4CAF50'; // Green for selected
    private disabledColor: string = '#222222';
    private borderWidth: number = 3;
    
    // State
    private hoveredCommand: QueenCommand | null = null;
    private selectedCommand: QueenCommand | null = null;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        
        // Initialize command buttons
        this.initializeCommands();
        this.setupEventListeners();
    }
    
    /**
     * Initialize command buttons with icons and positions
     */
    private initializeCommands(): void {
        const commandData: Array<{command: QueenCommand, label: string, icon: string}> = [
            { command: 'FIGHT', label: 'Fight', icon: '⚔️' },
            { command: 'BUILD', label: 'Build', icon: '🔨' },
            { command: 'GATHER', label: 'Gather', icon: '🌾' },
            { command: 'FOLLOW', label: 'Follow', icon: '👥' }
        ];
        
        commandData.forEach((data, index) => {
            this.commands.push({
                command: data.command,
                label: data.label,
                icon: data.icon,
                enabled: true,
                selected: false,
                x: this.x + index * this.spacing,
                y: this.y
            });
        });
    }
    
    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // Listen for command availability changes
        EventBus.on(GameEvents.QUEEN_COMMAND_AVAILABLE, (command: string, available: boolean) => {
            const btn = this.commands.find(c => c.command === command);
            if (btn) {
                btn.enabled = available;
            }
        });
        
        // Listen for external command deselection
        EventBus.on(GameEvents.QUEEN_COMMAND_CANCELLED, () => {
            this.deselectCommand();
        });
    }
    
    /**
     * Select a command
     */
    public selectCommand(command: QueenCommand): void {
        const btn = this.commands.find(c => c.command === command);
        if (!btn || !btn.enabled) return;
        
        // Deselect previous
        if (this.selectedCommand) {
            const prevBtn = this.commands.find(c => c.command === this.selectedCommand);
            if (prevBtn) prevBtn.selected = false;
        }
        
        // Select new
        btn.selected = true;
        this.selectedCommand = command;
        
        EventBus.emit(GameEvents.QUEEN_COMMAND_SELECTED, command);
    }
    
    /**
     * Deselect current command
     */
    public deselectCommand(): void {
        if (this.selectedCommand) {
            const btn = this.commands.find(c => c.command === this.selectedCommand);
            if (btn) btn.selected = false;
            
            EventBus.emit(GameEvents.QUEEN_COMMAND_DESELECTED, this.selectedCommand);
            this.selectedCommand = null;
        }
    }
    
    /**
     * Set command enabled state
     */
    public setCommandEnabled(command: QueenCommand, enabled: boolean): void {
        const btn = this.commands.find(c => c.command === command);
        if (btn) {
            btn.enabled = enabled;
            
            // Deselect if disabling currently selected command
            if (!enabled && btn.selected) {
                this.deselectCommand();
            }
        }
    }
    
    /**
     * Check if mouse is over a button
     */
    public isMouseOver(mouseX: number, mouseY: number): QueenCommand | null {
        for (const btn of this.commands) {
            if (isPointInRect(mouseX, mouseY, btn.x, btn.y, this.buttonSize, this.buttonSize)) {
                return btn.command;
            }
        }
        return null;
    }
    
    /**
     * Handle mouse click
     */
    public handleClick(mouseX: number, mouseY: number): void {
        const command = this.isMouseOver(mouseX, mouseY);
        if (command) {
            const btn = this.commands.find(c => c.command === command);
            if (btn && btn.enabled) {
                if (btn.selected) {
                    this.deselectCommand();
                } else {
                    this.selectCommand(command);
                    
                    // Special handling for BUILD command - toggle building menu
                    if (command === 'BUILD') {
                        console.log('[QueenCommands] BUILD button clicked - emitting BUILDING_MENU_TOGGLED');
                        EventBus.emit(GameEvents.BUILDING_MENU_TOGGLED);
                    }
                }
            }
        }
    }
    
    /**
     * Handle mouse move for hover effects
     */
    public handleMouseMove(mouseX: number, mouseY: number): void {
        this.hoveredCommand = this.isMouseOver(mouseX, mouseY);
    }
    
    /**
     * Set position
     */
    public setPosition(x: number, y: number): void {
        const deltaX = x - this.x;
        const deltaY = y - this.y;
        
        this.x = x;
        this.y = y;
        
        // Update all button positions
        this.commands.forEach(btn => {
            btn.x += deltaX;
            btn.y += deltaY;
        });
    }
    
    /**
     * Render commands UI
     */
    render(graphics: any): void {
        graphics.push();
        
        // Calculate panel dimensions
        const totalWidth = (this.commands.length * this.spacing) + (this.padding * 2) - (this.spacing - this.buttonSize);
        const panelHeight = this.buttonSize + (this.padding * 2) + 20; // Extra space for labels
        
        // Draw background panel
        drawUIPanel(
            graphics,
            this.x - this.padding,
            this.y - this.buttonSize / 2 - this.padding,
            totalWidth,
            panelHeight,
            this.backgroundColor,
            this.backgroundAlpha,
            8
        );
        
        // Draw each command button
        this.commands.forEach(btn => {
            graphics.push();
            
            // Determine button color based on state using helper
            const colors = {
                normal: this.normalColor,
                hover: this.hoverColor,
                selected: this.selectedColor,
                disabled: this.disabledColor
            };
            const btnColor = getButtonStateColor(
                btn.enabled,
                btn.selected,
                this.hoveredCommand === btn.command,
                colors
            );
            
            // Draw button background
            graphics.fill(btnColor);
            graphics.noStroke();
            graphics.rect(
                btn.x - this.buttonSize / 2,
                btn.y - this.buttonSize / 2,
                this.buttonSize,
                this.buttonSize,
                5
            );
            
            // Draw selection border
            if (btn.selected) {
                graphics.noFill();
                graphics.stroke(this.selectedColor);
                graphics.strokeWeight(this.borderWidth);
                graphics.rect(
                    btn.x - this.buttonSize / 2,
                    btn.y - this.buttonSize / 2,
                    this.buttonSize,
                    this.buttonSize,
                    5
                );
            }
            
            // Draw icon
            graphics.fill(btn.enabled ? 255 : 100);
            graphics.noStroke();
            graphics.textAlign('center' as any, 'center' as any);
            graphics.textSize(this.iconSize);
            graphics.text(btn.icon, btn.x, btn.y - 5);
            
            // Draw label below button
            graphics.fill(btn.enabled ? 200 : 100);
            graphics.textSize(this.labelFontSize);
            graphics.text(btn.label, btn.x, btn.y + this.buttonSize / 2 + 12);
            
            graphics.pop();
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
