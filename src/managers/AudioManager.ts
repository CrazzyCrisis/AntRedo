/**
 * AudioManager - Centralized audio management
 * Handles music and sound effects with volume control and muting
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
    private musicVolume: number;
    private sfxVolume: number;
    private musicMuted: boolean;
    private sfxMuted: boolean;
    
    private loadedSounds: Set<string>;
    private currentMusic: string | null;
    private unsubscribeFunctions: Array<() => void>;
    
    // Store actual audio objects (p5.SoundFile)
    private musicTracks: Map<string, any>;
    private sfxSounds: Map<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private sounds: Map<SoundKey, any>; // All loaded sounds by key

    private constructor() {
        this.loadedSounds = new Set();
        this.musicTracks = new Map();
        this.sfxSounds = new Map();
        this.sounds = new Map();
        this.currentMusic = null;
        this.unsubscribeFunctions = [];
        
        // Load settings from SettingsManager
        const settingsManager = SettingsManager.getInstance();
        const audioSettings = settingsManager.getAudioSettings();
        
        this.masterVolume = audioSettings.masterVolume;
        this.musicVolume = audioSettings.musicVolume;
        this.sfxVolume = audioSettings.sfxVolume;
        this.musicMuted = !audioSettings.musicEnabled;
        this.sfxMuted = !audioSettings.sfxEnabled;
        
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
        this.musicVolume = settings.musicVolume;
        this.sfxVolume = settings.sfxVolume;
        this.musicMuted = !settings.musicEnabled;
        this.sfxMuted = !settings.sfxEnabled;
        
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
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            musicEnabled: !this.musicMuted,
            sfxEnabled: !this.sfxMuted
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
     * Get music volume
     */
    public getMusicVolume(): number {
        return this.musicVolume;
    }

    /**
     * Set music volume (0-1)
     */
    public setMusicVolume(volume: number): void {
        this.musicVolume = clamp(volume, 0, 1);
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
     * Get effective music volume (master * music * mute)
     */
    public getEffectiveMusicVolume(): number {
        if (this.musicMuted) return 0;
        return this.masterVolume * this.musicVolume;
    }

    /**
     * Get effective SFX volume (master * sfx * mute)
     */
    public getEffectiveSFXVolume(): number {
        if (this.sfxMuted) return 0;
        return this.masterVolume * this.sfxVolume;
    }

    // ============ Mute Control ============

    /**
     * Check if music is muted
     */
    public isMusicMuted(): boolean {
        return this.musicMuted;
    }

    /**
     * Set music mute state
     * @param muted - New mute state
     */
    public setMusicMuted(muted: boolean): void {
        this.musicMuted = muted;
        this.saveToSettings();
        this.updateAllVolumes();
    }

    /**
     * Mute music
     */
    public muteMusic(): void {
        this.setMusicMuted(true);
    }

    /**
     * Unmute music
     */
    public unmuteMusic(): void {
        this.setMusicMuted(false);
    }

    /**
     * Toggle music mute
     */
    public toggleMusicMute(): void {
        this.setMusicMuted(!this.musicMuted);
    }

    /**
     * Check if SFX is muted
     */
    public isSFXMuted(): boolean {
        return this.sfxMuted;
    }

    /**
     * Set SFX mute state
     * @param muted - New mute state
     */
    public setSFXMuted(muted: boolean): void {
        this.sfxMuted = muted;
        this.saveToSettings();
        this.updateAllVolumes();
    }

    /**
     * Mute SFX
     */
    public muteSFX(): void {
        this.setSFXMuted(true);
    }

    /**
     * Unmute SFX
     */
    public unmuteSFX(): void {
        this.setSFXMuted(false);
    }

    /**
     * Toggle SFX mute
     */
    public toggleSFXMute(): void {
        this.setSFXMuted(!this.sfxMuted);
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
        this.musicTracks.delete(soundId);
        this.sfxSounds.delete(soundId);
    }

    /**
     * Get list of loaded sounds
     */
    public getLoadedSounds(): string[] {
        return Array.from(this.loadedSounds);
    }

    // ============ Music Playback ============

    /**
     * Get currently playing music
     */
    public getCurrentMusic(): string | null {
        return this.currentMusic;
    }

    /**
     * Set current music (for tracking)
     */
    public setCurrentMusic(musicId: string): void {
        this.currentMusic = musicId;
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

        // Check if sound should be muted based on category
        const category = this.getSoundCategory(key);
        if (category === 'SFX' && this.sfxMuted) return;
        if (category === 'MUSIC' && this.musicMuted) return;
        if (category === 'UI' && this.sfxMuted) return; // UI uses SFX mute

        // Don't play if already playing (prevents overlapping)
        if (sound.isPlaying && sound.isPlaying()) {
            return;
        }

        // Calculate final volume
        const soundConfig = AUDIO_SOUNDS[key];
        const categoryVolume = category === 'MUSIC' ? this.musicVolume : this.sfxVolume;
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

    /**
     * Play background music with looping
     * @param key - Sound key for music track
     * @param loop - Whether to loop (default true)
     */
    public playMusic(key: SoundKey, loop: boolean = true): void {
        const sound = this.sounds.get(key);
        if (!sound) {
            return;
        }

        // Stop current music if different track
        if (this.currentMusic && this.currentMusic !== key) {
            const currentSound = this.sounds.get(this.currentMusic as SoundKey);
            if (currentSound && currentSound.isPlaying && currentSound.isPlaying()) {
                currentSound.stop();
            }
        }

        // Check if music is muted
        if (this.musicMuted) return;

        // Calculate volume
        const soundConfig = AUDIO_SOUNDS[key];
        const finalVolume = this.masterVolume * this.musicVolume * soundConfig.volume;

        sound.setVolume(finalVolume);
        
        if (loop) {
            sound.loop();
        } else {
            sound.play();
        }

        this.currentMusic = key;
    }

    /**
     * Stop currently playing music
     */
    public stopMusic(): void {
        if (this.currentMusic) {
            const sound = this.sounds.get(this.currentMusic as SoundKey);
            if (sound && sound.isPlaying && sound.isPlaying()) {
                sound.stop();
            }
            this.currentMusic = null;
        }
    }

    /**
     * Pause currently playing music
     */
    public pauseMusic(): void {
        if (this.currentMusic) {
            const sound = this.sounds.get(this.currentMusic as SoundKey);
            if (sound && sound.isPlaying && sound.isPlaying()) {
                sound.pause();
            }
        }
    }

    /**
     * Resume paused music
     */
    public resumeMusic(): void {
        if (this.currentMusic) {
            const sound = this.sounds.get(this.currentMusic as SoundKey);
            if (sound && sound.isPaused && sound.isPaused()) {
                sound.play();
            }
        }
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
    private getSoundCategory(key: SoundKey): 'SFX' | 'UI' | 'MUSIC' {
        for (const [category, sounds] of Object.entries(AUDIO_CATEGORIES)) {
            if ((sounds as readonly SoundKey[]).includes(key)) {
                return category as 'SFX' | 'UI' | 'MUSIC';
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
