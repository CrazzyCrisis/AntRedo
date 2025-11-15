// Event Bus - Centralized event management system
// Usage:
//   EventBus.on('eventName', callback)
//   EventBus.emit('eventName', data)
//   EventBus.off('eventName', callback)
//   EventBus.once('eventName', callback)

type EventCallback = (...args: any[]) => void;
type EventMap = { [eventName: string]: EventCallback[] };

class EventBusClass {
    private events: EventMap = {};
    private onceEvents: Map<EventCallback, EventCallback> = new Map();

    /**
     * Subscribe to an event
     * @param eventName - Name of the event
     * @param callback - Function to call when event is emitted
     * @returns Unsubscribe function
     */
    on(eventName: string, callback: EventCallback): () => void {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        this.events[eventName].push(callback);
        
        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    /**
     * Subscribe to an event only once
     * @param eventName - Name of the event
     * @param callback - Function to call when event is emitted
     * @returns Unsubscribe function
     */
    once(eventName: string, callback: EventCallback): () => void {
        const wrapper: EventCallback = (...args: any[]) => {
            callback(...args);
            this.off(eventName, wrapper);
        };
        
        // Store reference so we can remove it if needed
        this.onceEvents.set(callback, wrapper);
        
        return this.on(eventName, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param eventName - Name of the event
     * @param callback - Callback to remove
     */
    off(eventName: string, callback: EventCallback): void {
        if (!this.events[eventName]) return;

        // Check if this was a 'once' event
        const wrapper = this.onceEvents.get(callback);
        const targetCallback = wrapper || callback;

        this.events[eventName] = this.events[eventName].filter(
            cb => cb !== targetCallback
        );

        if (wrapper) {
            this.onceEvents.delete(callback);
        }

        // Clean up empty event arrays
        if (this.events[eventName].length === 0) {
            delete this.events[eventName];
        }
    }

    /**
     * Emit an event
     * @param eventName - Name of the event
     * @param args - Arguments to pass to callbacks
     */
    emit(eventName: string, ...args: any[]): void {
        if (!this.events[eventName]) return;

        // Create a copy to avoid issues if handlers modify the array
        const handlers = [...this.events[eventName]];
        
        handlers.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event handler for "${eventName}":`, error);
            }
        });
    }

    /**
     * Remove all listeners for an event, or all events if no name provided
     * @param eventName - Optional event name to clear
     */
    clear(eventName?: string): void {
        if (eventName) {
            delete this.events[eventName];
        } else {
            this.events = {};
            this.onceEvents.clear();
        }
    }

    /**
     * Get list of all event names
     * @returns Array of event names
     */
    getEventNames(): string[] {
        return Object.keys(this.events);
    }

    /**
     * Get number of listeners for an event
     * @param eventName - Name of the event
     * @returns Number of listeners
     */
    listenerCount(eventName: string): number {
        return this.events[eventName] ? this.events[eventName].length : 0;
    }

    /**
     * Check if event has any listeners
     * @param eventName - Name of the event
     * @returns True if event has listeners
     */
    hasListeners(eventName: string): boolean {
        return this.listenerCount(eventName) > 0;
    }
}

// Create singleton instance
export const EventBus = new EventBusClass();

// Common game events constants (optional but recommended)
export const GameEvents = {
    // Game lifecycle events
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_RESET: 'game:reset',
    GAME_OVER: 'game:over',
    GAME_WIN: 'game:win',
    LEVEL_START: 'level:start',
    LEVEL_COMPLETE: 'level:complete',
    LEVEL_CHANGED: 'level:changed',
    
    // World events
    WORLD_LOADED: 'world:loaded',
    WORLD_GENERATED: 'world:generated',
    SAVE_WORLD_PRESET: 'world:save_preset',
    LOAD_WORLD_PRESET: 'world:load_preset',
    
    // Player events
    PLAYER_MOVE: 'player:move',
    PLAYER_DAMAGE: 'player:damage',
    PLAYER_HEAL: 'player:heal',
    PLAYER_DEATH: 'player:death',
    PLAYER_SPAWN: 'player:spawn',
    PLAYER_COLLECT: 'player:collect',
    
    // Enemy events
    ENEMY_SPAWN: 'enemy:spawn',
    ENEMY_DEATH: 'enemy:death',
    ENEMY_DAMAGE: 'enemy:damage',
    
    // UI events
    UI_BUTTON_CLICK: 'ui:button:click',
    UI_MENU_OPEN: 'ui:menu:open',
    UI_MENU_CLOSE: 'ui:menu:close',
    SCORE_UPDATE: 'score:update',
    HEALTH_UPDATE: 'health:update',
    
    // Input events
    INPUT_KEY_PRESS: 'input:key:press',
    INPUT_KEY_RELEASE: 'input:key:release',
    INPUT_MOUSE_CLICK: 'input:mouse:click',
    INPUT_MOUSE_MOVE: 'input:mouse:move',
    INPUT_MOUSE_RELEASE: 'input:mouse:release',
    
    // Audio events
    AUDIO_PLAY: 'audio:play',
    AUDIO_STOP: 'audio:stop',
    AUDIO_VOLUME_CHANGE: 'audio:volume:change',
    
    // Resource events
    RESOURCE_LOADED: 'resource:loaded',
    RESOURCES_COMPLETE: 'resources:complete',
    RESOURCE_ERROR: 'resource:error',
    
    // Rendering events
    LAYER_DIRTY: 'render:layer:dirty',
    CAMERA_MOVE: 'render:camera:move',
    SPRITE_LOADED: 'render:sprite:loaded',
    
    // Menu events
    MENU_PLAY_CLICKED: 'menu:play:clicked',
    MENU_OPTIONS_CLICKED: 'menu:options:clicked',
    MENU_EXIT_CLICKED: 'menu:exit:clicked',
    MENU_BACK_CLICKED: 'menu:back:clicked',
    MENU_VIDEO_SETTINGS_CLICKED: 'menu:video_settings:clicked',
    MENU_AUDIO_SETTINGS_CLICKED: 'menu:audio_settings:clicked',
    MENU_CONTROLS_CLICKED: 'menu:controls:clicked',
    MENU_DEV_ROOM_CLICKED: 'menu:dev_room:clicked',
    MENU_START_GAME_CLICKED: 'menu:start_game:clicked',
    MENU_LEVEL_EDITOR_CLICKED: 'menu:level_editor:clicked',
    
    // Settings events
    SETTING_AUDIO_CHANGED: 'settings:audio:changed',
    SETTING_VIDEO_CHANGED: 'settings:video:changed',
    SETTING_KEYBIND_CHANGED: 'settings:keybind:changed',
    SETTING_ACCESSIBILITY_CHANGED: 'settings:accessibility:changed',
    SETTINGS_RESET: 'settings:reset',
    
    // World generation events
    WORLDGEN_CONFIG_MENU_TOGGLE: 'worldgen:config:toggle',
    WORLDGEN_CONFIG_CHANGED: 'worldgen:config:changed',
    WORLDGEN_THRESHOLD_CHANGED: 'worldgen:threshold:changed',
    WORLDGEN_REGENERATE: 'worldgen:regenerate',
    
    // Scene events
    SCENE_CHANGE: 'scene:change',
    
    // ========================================================================
    // ENTITY SYSTEM EVENTS
    // ========================================================================
    
    // Entity lifecycle events
    ENTITY_ADDED: 'entity:added',
    ENTITY_REMOVED: 'entity:removed',
    ENTITY_MOVED: 'entity:moved',
    ENTITY_DESTROYED: 'entity:destroyed',
    ENTITY_UPDATED: 'entity:updated',
    
    // Ant events
    ANT_SPAWNED: 'ant:spawned',
    ANT_STATE_CHANGED: 'ant:state:changed',
    ANT_DIED: 'ant:died',
    ANT_ATTACKED: 'ant:attacked',
    ANT_JOB_CHANGED: 'ant:job:changed',
    ANT_HUNGER_CHANGED: 'ant:hunger:changed',
    ANT_HUNGER_CRITICAL: 'ant:hunger:critical',
    ANT_STARVED: 'ant:starved',
    ANT_TARGET_ACQUIRED: 'ant:target:acquired',
    ANT_TARGET_LOST: 'ant:target:lost',
    ANT_PATH_UPDATED: 'ant:path:updated',
    ANT_TYPE_COUNT_CHANGED: 'ant:type:count:changed',
    
    // Population events
    POPULATION_CHANGED: 'population:changed',
    UI_POPULATION_TOGGLED: 'ui:population:toggled',
    
    // Queen events
    QUEEN_SPAWNED: 'queen:spawned',
    QUEEN_COMMAND_ISSUED: 'queen:command:issued',
    QUEEN_COMMAND_SELECTED: 'queen:command:selected',
    QUEEN_COMMAND_DESELECTED: 'queen:command:deselected',
    QUEEN_COMMAND_CANCELLED: 'queen:command:cancelled',
    QUEEN_COMMAND_AVAILABLE: 'queen:command:available',
    QUEEN_DEATH: 'queen:death',
    QUEEN_DIED: 'queen:died',
    QUEEN_POWER_USED: 'queen:power:used',
    QUEEN_POWER_UNLOCKED: 'queen:power:unlocked',
    QUEEN_POWER_UPGRADED: 'queen:power:upgraded',
    QUEEN_POWER_COOLDOWN_READY: 'queen:power:cooldown:ready',
    QUEEN_INTERACTED: 'queen:interacted',
    POWER_USED: 'power:used',
    POWER_COOLDOWN_TICK: 'power:cooldown:tick',
    POWER_UNLOCKED: 'power:unlocked',
    POWER_LOCKED: 'power:locked',
    CAMERA_FOLLOW_ENTITY: 'camera:follow:entity',
    ENTITY_HEALTH_CHANGED: 'entity:health:changed',
    
    // Boss events
    BOSS_SPAWNED: 'boss:spawned',
    BOSS_ATTACKED: 'boss:attacked',
    BOSS_DIED: 'boss:died',
    BOSS_TARGET_CHANGED: 'boss:target:changed',
    BOSS_PROJECTILE_FIRED: 'boss:projectile:fired',
    BOSS_STATE_CHANGED: 'boss:state:changed',
    BOSS_VISION_DETECTED: 'boss:vision:detected',
    
    // Resource events (extended)
    RESOURCE_SPAWNED: 'resource:spawned',
    RESOURCE_COLLECTED: 'resource:collected',
    RESOURCE_DEPOSITED: 'resource:deposited',
    RESOURCE_DEPLETED: 'resource:depleted',
    RESOURCE_SMELLED: 'resource:smelled',
    RESOURCE_UPDATED: 'resource:updated', // For UI updates
    
    // Building events
    BUILDING_PLACED: 'building:placed',
    BUILDING_PLACEMENT_STARTED: 'building:placement:started',
    BUILDING_PLACEMENT_CANCELLED: 'building:placement:cancelled',
    BUILDING_PLACEMENT_VALIDATE: 'building:placement:validate',
    BUILDING_PLACEMENT_REQUESTED: 'building:placement:requested',
    BUILDING_CONSTRUCTION_STARTED: 'building:construction:started',
    BUILDING_CONSTRUCTION_PROGRESS: 'building:construction:progress',
    BUILDING_COMPLETED: 'building:completed',
    BUILDING_DESTROYED: 'building:destroyed',
    BUILDING_LEVELED_UP: 'building:leveled_up',
    BUILDING_DAMAGED: 'building:damaged',
    
    // Projectile events
    PROJECTILE_SPAWNED: 'projectile:spawned',
    PROJECTILE_HIT: 'projectile:hit',
    PROJECTILE_DESTROYED: 'projectile:destroyed',
    
    // Power effect events
    LIGHTNING_STRIKE: 'power:lightning:strike',
    FIREBALL_EXPLODE: 'power:fireball:explode',
    BLACKHOLE_ACTIVATED: 'power:blackhole:activated',
    BLACKHOLE_PULL: 'power:blackhole:pull',
    TIDALWAVE_ACTIVATED: 'power:tidalwave:activated',
    TIDALWAVE_PUSH: 'power:tidalwave:push',
    FINALFLASH_ACTIVATED: 'power:finalflash:activated',
    SOOT_STAIN_CREATED: 'power:soot:created',
    BURN_EFFECT_APPLIED: 'power:burn:applied',
    
    // Combat events
    ENTITY_ATTACKED: 'entity:attacked',
    COMBAT_DAMAGE_DEALT: 'combat:damage:dealt',
    COMBAT_KNOCKBACK_APPLIED: 'combat:knockback:applied',
    COMBAT_KILL: 'combat:kill',
    
    // Inventory events
    ITEM_ADDED: 'item:added',
    ITEM_REMOVED: 'item:removed',
    INVENTORY_FULL: 'inventory:full',
    
    // Vision events
    ENTITY_DETECTED: 'entity:detected',
    ENTITY_LOST: 'entity:lost',
    
    // AI behavior events
    AI_STATE_CHANGED: 'ai:state:changed',
    AI_BEHAVIOR_CHANGED: 'ai:behavior:changed',
    AI_BEHAVIOR_COMPLETE: 'ai:behavior:complete',
    AI_TARGET_ACQUIRED: 'ai:target:acquired',
    AI_TARGET_LOST: 'ai:target:lost',
    
    // Job system events
    JOB_ASSIGNED: 'job:assigned',
    JOB_PRIORITIES_CHANGED: 'job:priorities:changed',
    TASK_ASSIGNED: 'task:assigned',
    TASK_COMPLETED: 'task:completed',
    
    // Hunger events
    ENTITY_HUNGRY: 'entity:hungry',
    ENTITY_STARVING: 'entity:starving',
    ENTITY_ATE: 'entity:ate',
    STARVATION_DAMAGE: 'starvation:damage'
} as const;

// Type for event names
export type GameEventName = typeof GameEvents[keyof typeof GameEvents];
