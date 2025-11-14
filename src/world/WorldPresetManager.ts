/**
 * WorldPresetManager - Save and load world presets
 * Stores both seeds and full map data in localStorage
 */

import { TileData } from './TileSystem';

export interface WorldPreset {
    name: string;
    seed: number;
    noiseScale: number;
    width: number;
    height: number;
    mapData?: TileData[][];  // Optional: full map data for exact recreation
    timestamp: number;
}

export class WorldPresetManager {
    private static readonly STORAGE_KEY = 'antredo_world_presets';
    private static readonly MAX_PRESETS = 20;  // Limit to prevent storage overflow

    /**
     * Save a world preset
     */
    static savePreset(preset: WorldPreset): void {
        const presets = this.loadAllPresets();
        
        // Check if preset with same name exists
        const existingIndex = presets.findIndex(p => p.name === preset.name);
        if (existingIndex !== -1) {
            // Update existing
            presets[existingIndex] = preset;
        } else {
            // Add new
            presets.push(preset);
            
            // Enforce max limit (remove oldest)
            if (presets.length > this.MAX_PRESETS) {
                presets.sort((a, b) => a.timestamp - b.timestamp);
                presets.shift();
            }
        }
        
        this.saveToStorage(presets);
    }

    /**
     * Load all presets
     */
    static loadAllPresets(): WorldPreset[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];
            
            const presets = JSON.parse(data) as WorldPreset[];
            // Sort by timestamp (newest first)
            return presets.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Failed to load presets:', error);
            return [];
        }
    }

    /**
     * Load a specific preset by name
     */
    static loadPreset(name: string): WorldPreset | null {
        const presets = this.loadAllPresets();
        return presets.find(p => p.name === name) || null;
    }

    /**
     * Delete a preset
     */
    static deletePreset(name: string): void {
        const presets = this.loadAllPresets();
        const filtered = presets.filter(p => p.name !== name);
        this.saveToStorage(filtered);
    }

    /**
     * Clear all presets
     */
    static clearAllPresets(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    /**
     * Get preset names
     */
    static getPresetNames(): string[] {
        return this.loadAllPresets().map(p => p.name);
    }

    /**
     * Check if preset name exists
     */
    static presetExists(name: string): boolean {
        return this.getPresetNames().includes(name);
    }

    private static saveToStorage(presets: WorldPreset[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
        } catch (error) {
            console.error('Failed to save presets:', error);
        }
    }
}
