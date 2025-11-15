/**
 * AudioManager - Centralized audio management
 * Handles BGM and sound effects with volume control and muting
 * Singleton pattern with SettingsManager integration
 * Event-driven: automatically plays sounds in response to game events
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { SettingsManager } from './SettingsManager';
import { AudioSettings } from '../config/defaultSettings';
import { clamp } from '../utils/helpers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AUDIO_SOUNDS, AUDIO_EVENT_MAPPINGS, AUDIO_CATEGORIES, SoundKey } from '../config/audioConfig';

export class AudioManager {
    private static instance: AudioManager;
    
    private masterVolume: number;
    private BGMVolume: number;
    private sfxVolume: number;
    private voiceVolume: number;
    private systemVolume: number;
    
    private loadedSounds: Set<string>;
    private currentBGM: string | null;
    private unsubscribeFunctions: Array<() => void>;
    
    // Store actual audio objects (p5.SoundFile)
    private BGMTracks: Map<string, any>;
    private sfxSounds: Map<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private sounds: Map<SoundKey, any>; // All loaded sounds by key

    private constructor() {
        this.loadedSounds = new Set();
        this.BGMTracks = new Map();
        this.sfxSounds = new Map();
        this.sounds = new Map();
        this.currentBGM = null;
        this.unsubscribeFunctions = [];
        
        // Load settings from SettingsManager
        const settingsManager = SettingsManager.getInstance();
        const audioSettings = settingsManager.getAudioSettings();
        
        this.masterVolume = audioSettings.masterVolume;
        this.BGMVolume = audioSettings.bgmVolume;
        this.sfxVolume = audioSettings.sfxVolume;
        this.voiceVolume = audioSettings.voiceVolume;
        this.systemVolume = audioSettings.systemVolume;
        
        // Listen for settings changes
        this.unsubscribeFunctions.push(
            EventBus.on(GameEvents.SETTING_AUDIO_CHANGED, (settings: AudioSettings) => {
                this.handleSettingsChange(settings);
            })
        );
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * Handle audio settings changes from SettingsManager
     */
    private handleSettingsChange(settings: AudioSettings): void {
        this.masterVolume = settings.masterVolume;
        this.BGMVolume = settings.bgmVolume;
        this.sfxVolume = settings.sfxVolume;
        this.voiceVolume = settings.voiceVolume;
        this.systemVolume = settings.systemVolume;
        
        // Update volumes of currently playing sounds
        this.updateAllVolumes();
    }

    /**
     * Update volumes of all playing sounds
     */
    private updateAllVolumes(): void {
        // In browser, this would update p5.SoundFile volumes
        // For now, this is a placeholder for when we integrate p5.sound
    }

    /**
     * Save current audio state to SettingsManager
     */
    private saveToSettings(): void {
        const settingsManager = SettingsManager.getInstance();
        settingsManager.setAudioSettings({
            masterVolume: this.masterVolume,
            bgmVolume: this.BGMVolume,
            sfxVolume: this.sfxVolume,
            voiceVolume: this.voiceVolume,
            systemVolume: this.systemVolume
        });
    }

    // ============ Volume Control ============

    /**
     * Get master volume
     */
    public getMasterVolume(): number {
        return this.masterVolume;
    }

    /**
     * Set master volume (0-1)
     */
    public setMasterVolume(volume: number): void {
        this.masterVolume = clamp(volume, 0, 1);
        this.saveToSettings();
        this.updateAllVolumes();
    }

    /**
     * Get BGM volume
     */
    public getBGMVolume(): number {
        return this.BGMVolume;
    }

    /**
     * Set BGM volume (0-1)
     */
    public setBGMVolume(volume: number): void {
        this.BGMVolume = clamp(volume, 0, 1);
        this.saveToSettings();
        this.updateAllVolumes();
    }

    /**
     * Get SFX volume
     */
    public getSFXVolume(): number {
        return this.sfxVolume;
    }

    /**
     * Set SFX volume (0-1)
     */
    public setSFXVolume(volume: number): void {
        this.sfxVolume = clamp(volume, 0, 1);
        this.saveToSettings();
        this.updateAllVolumes();
    }

    /**
     * Get voice volume
     */
    public getVoiceVolume(): number {
        return this.voiceVolume;
    }

    /**
     * Set voice volume (0-1)
     */
    public setVoiceVolume(volume: number): void {
        this.voiceVolume = clamp(volume, 0, 1);
        this.saveToSettings();
        this.updateAllVolumes();
    }

    /**
     * Get system volume
     */
    public getSystemVolume(): number {
        return this.systemVolume;
    }

    /**
     * Set system volume (0-1)
     */
    public setSystemVolume(volume: number): void {
        this.systemVolume = clamp(volume, 0, 1);
        this.saveToSettings();
        this.updateAllVolumes();
    }
    
    /**
     * Get effective BGM volume (master * BGM * mute)
     */
    public getEffectiveBGMVolume(): number {
        return this.masterVolume * this.BGMVolume;
    }

    /**
     * Get effective SFX volume (master * sfx * mute)
     */
    public getEffectiveSFXVolume(): number {
        return this.masterVolume * this.sfxVolume;
    }

    /**
     * get effective voice volume (master * voice)
     */
    public getEffectiveVoiceVolume(): number {
        return this.masterVolume * this.voiceVolume;
    }

    /**
     * Get effective system volume (master * system)
     */
    public getEffectiveSystemVolume(): number {
        return this.masterVolume * this.systemVolume;
    }

    // ============ Sound Management ============

    /**
     * Register a loaded sound (for tracking)
     */
    public registerSound(soundId: string): void {
        this.loadedSounds.add(soundId);
    }

    /**
     * Check if sound is loaded
     */
    public isSoundLoaded(soundId: string): boolean {
        return this.loadedSounds.has(soundId);
    }

    /**
     * Unload sound
     */
    public unloadSound(soundId: string): void {
        this.loadedSounds.delete(soundId);
        this.BGMTracks.delete(soundId);
        this.sfxSounds.delete(soundId);
    }

    /**
     * Get list of loaded sounds
     */
    public getLoadedSounds(): string[] {
        return Array.from(this.loadedSounds);
    }

    // ============ BGM Playback ============

    /**
     * Get currently playing BGM
     */
    public getCurrentBGM(): string | null {
        return this.currentBGM;
    }

    /**
     * Set current BGM (for tracking)
     */
    public setCurrentBGM(BGMId: string): void {
        this.currentBGM = BGMId;
    }

    // ============ Event-Driven Sound Loading & Playback ============

    /**
     * Initialize audio system - call after p5.js preload
     * Sets up event listeners for automatic sound playback
     */
    public initialize(): void {
        this.setupEventListeners();
        console.log('AudioManager initialized with event-driven playback');
    }

    /**
     * Load a sound file by key
     * @param key - Sound key from AUDIO_SOUNDS
     * @param soundFile - Loaded p5.SoundFile
     */
    public loadSound(key: SoundKey, soundFile: any): void {
        this.sounds.set(key, soundFile);
        this.registerSound(key);
    }

    /**
     * Play a sound by key
     * @param key - Sound key to play
     */
    public play(key: SoundKey): void {
        const sound = this.sounds.get(key);
        if (!sound) {
            // Silently fail if sound not loaded (asset may not exist yet)
            return;
        }

        // check volumne levels, if at 0, don't play
        const category = this.getSoundCategory(key);
        if (category === 'BGM' && this.getEffectiveBGMVolume() === 0) return;
        if (category === 'SFX' && this.getEffectiveSFXVolume() === 0) return;
        if (category === 'VOICE' && this.getEffectiveVoiceVolume() === 0) return;
        if (category === 'SYSTEM' || category === 'UI' && this.getEffectiveSystemVolume() === 0) return;

        // Don't play if already playing (prevents overlapping)
        if (sound.isPlaying && sound.isPlaying()) {
            return;
        }

        // Calculate final volume
        const soundConfig = AUDIO_SOUNDS[key];
        const categoryVolume = category === 'BGM' ? this.BGMVolume : category === 'SFX' ? this.sfxVolume : category === 'VOICE' ? this.voiceVolume : this.systemVolume;
        const finalVolume = this.masterVolume * categoryVolume * soundConfig.volume;

        sound.setVolume(finalVolume);
        sound.play();
    }

    /**
     * Stop a specific sound by key
     * @param key - Sound key to stop
     */
    public stopSound(key: SoundKey): void {
        const sound = this.sounds.get(key);
        if (sound && sound.isPlaying && sound.isPlaying()) {
            sound.stop();
        }
    }

    /**
     * Stop all loaded sounds
     */
    public stopAll(): void {
        this.sounds.forEach(sound => {
            if (sound && sound.isPlaying && sound.isPlaying()) {
                sound.stop();
            }
        });
    }

    // ============ BGM Specific Controls ============

    /**
     * Play background BGM with looping
     * @param key - Sound key for BGM track
     * @param loop - Whether to loop (default true)
     */
    public playBGM(key: SoundKey, loop: boolean = true): void {
        const sound = this.sounds.get(key);
        if (!sound) {
            return;
        }

        // Stop current BGM if different track
        if (this.currentBGM && this.currentBGM !== key) {
            const currentSound = this.sounds.get(this.currentBGM as SoundKey);
            if (currentSound && currentSound.isPlaying && currentSound.isPlaying()) {
                currentSound.stop();
            }
        }

        // Check if BGM is muted
        if (this.isBGMMuted()) {
            return;
        } 

        // Calculate volume
        const soundConfig = AUDIO_SOUNDS[key];
        const finalVolume = this.masterVolume * this.BGMVolume * soundConfig.volume;

        sound.setVolume(finalVolume);
        
        if (loop) {
            sound.loop();
        } else {
            sound.play();
        }

        this.currentBGM = key;
    }

    /**
     * Stop currently playing BGM
     */
    public stopBGM(): void {
        if (this.currentBGM) {
            const sound = this.sounds.get(this.currentBGM as SoundKey);
            if (sound && sound.isPlaying && sound.isPlaying()) {
                sound.stop();
            }
            this.currentBGM = null;
        }
    }

    /**
     * Pause currently playing BGM
     */
    public pauseBGM(): void {
        if (this.currentBGM) {
            const sound = this.sounds.get(this.currentBGM as SoundKey);
            if (sound && sound.isPlaying && sound.isPlaying()) {
                sound.pause();
            }
        }
    }

    /**
     * Resume paused BGM
     */
    public resumeBGM(): void {
        if (this.currentBGM) {
            const sound = this.sounds.get(this.currentBGM as SoundKey);
            if (sound && sound.isPaused && sound.isPaused()) {
                sound.play();
            }
        }
    }

    /**
     * check if BGM is muted, fires event if so
     * @returns true if muted, false otherwise
     */
    public isBGMMuted(): boolean {
        if (this.getEffectiveBGMVolume() === 0) {
            EventBus.emit('BGM_MUTED');
            return true;
        } return false;
    }

    // ============== SFX SPECIFIC CONTROLS ==============

    /**
     * check if SFX is muted, fires event if so
     * @returns true if muted, false otherwise
     */
    public isSFXMuted(): boolean {
        if (this.getEffectiveSFXVolume() === 0) {
            EventBus.emit('SFX_MUTED');
            return true;
        } return false;
    }

    /**
     * Setup event listeners for automatic sound playback
     * Maps game events to sound effects
     */
    private setupEventListeners(): void {
        // Subscribe to all mapped events
        Object.entries(AUDIO_EVENT_MAPPINGS).forEach(([eventName, soundKey]) => {
            const unsubscribe = EventBus.on(eventName, () => {
                this.play(soundKey);
            });
            this.unsubscribeFunctions.push(unsubscribe);
        });
    }

    /**
     * Get category of a sound
     * @param key - Sound key
     * @returns Category name
     */
    private getSoundCategory(key: SoundKey): 'SFX' | 'UI' | 'BGM' | 'VOICE' | 'SYSTEM' {
        for (const [category, sounds] of Object.entries(AUDIO_CATEGORIES)) {
            if ((sounds as readonly SoundKey[]).includes(key)) {
                return category as 'SFX' | 'UI' | 'BGM' | 'VOICE' | 'SYSTEM';
            }
        }
        return 'SFX'; // Default to SFX
    }

    /**
     * Cleanup - unsubscribe from all events
     */
    public cleanup(): void {
        this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        this.unsubscribeFunctions = [];
        this.stopAll();
    }
}
