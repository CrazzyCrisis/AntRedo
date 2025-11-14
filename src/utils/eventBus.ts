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
    // Game lifecycle
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    GAME_WIN: 'game:win',
    LEVEL_START: 'level:start',
    LEVEL_COMPLETE: 'level:complete',
    
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
    
    // Scene events
    SCENE_CHANGE: 'scene:change'
} as const;

// Type for event names
export type GameEventName = typeof GameEvents[keyof typeof GameEvents];
