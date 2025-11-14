/**
 * AudioManager - Centralized audio management
 * Handles music and sound effects with volume control and muting
 * Singleton pattern with SettingsManager integration
 */

import { EventBus, GameEvents } from '../utils/eventBus';
import { SettingsManager } from './SettingsManager';
import { AudioSettings } from '../config/defaultSettings';
import { clamp } from '../utils/helpers';

export class AudioManager {
    private static instance: AudioManager;
    
    private masterVolume: number;
    private musicVolume: number;
    private sfxVolume: number;
    private musicMuted: boolean;
    private sfxMuted: boolean;
    
    private loadedSounds: Set<string>;
    private currentMusic: string | null;
    
    // Store actual audio objects (p5.SoundFile would go here in browser)
    private musicTracks: Map<string, any>;
    private sfxSounds: Map<string, any>;

    private constructor() {
        this.loadedSounds = new Set();
        this.musicTracks = new Map();
        this.sfxSounds = new Map();
        this.currentMusic = null;
        
        // Load settings from SettingsManager
        const settingsManager = SettingsManager.getInstance();
        const audioSettings = settingsManager.getAudioSettings();
        
        this.masterVolume = audioSettings.masterVolume;
        this.musicVolume = audioSettings.musicVolume;
        this.sfxVolume = audioSettings.sfxVolume;
        this.musicMuted = !audioSettings.musicEnabled;
        this.sfxMuted = !audioSettings.sfxEnabled;
        
        // Listen for settings changes
        EventBus.on(GameEvents.SETTING_AUDIO_CHANGED, (settings: AudioSettings) => {
            this.handleSettingsChange(settings);
        });
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

    /**
     * Play music
     * In browser, this would use p5.SoundFile
     */
    public playMusic(musicId: string, shouldLoop: boolean = true): void {
        try {
            this.currentMusic = musicId;
            // Placeholder: In browser, load and play p5.SoundFile
            // const music = loadSound(path);
            // music.setVolume(this.getEffectiveMusicVolume());
            // if (shouldLoop) music.loop(); else music.play();
            console.log(`Playing music: ${musicId}, loop: ${shouldLoop}`);
        } catch (error) {
            console.error(`Failed to play music: ${musicId}`, error);
        }
    }

    /**
     * Stop currently playing music
     */
    public stopMusic(): void {
        this.currentMusic = null;
        // Placeholder: In browser, stop p5.SoundFile
    }

    /**
     * Pause music
     */
    public pauseMusic(): void {
        // Placeholder: In browser, pause p5.SoundFile
    }

    /**
     * Resume music
     */
    public resumeMusic(): void {
        // Placeholder: In browser, resume p5.SoundFile
    }

    // ============ SFX Playback ============

    /**
     * Play sound effect
     * In browser, this would use p5.SoundFile
     */
    public playSFX(sfxId: string): void {
        try {
            // Placeholder: In browser, load and play p5.SoundFile
            // const sfx = loadSound(path);
            // sfx.setVolume(this.getEffectiveSFXVolume());
            // sfx.play();
        } catch (error) {
            console.error(`Failed to play SFX: ${sfxId}`, error);
        }
    }

    /**
     * Stop all sound effects
     */
    public stopAllSFX(): void {
        // Placeholder: In browser, stop all SFX p5.SoundFiles
    }
}
