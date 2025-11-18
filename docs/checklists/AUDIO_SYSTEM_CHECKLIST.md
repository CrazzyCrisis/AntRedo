# Audio System Implementation Checklist

## ✅ COMPLETED - Core Implementation

The audio system has been implemented with the following features:

### Completed Components

#### ✅ Phase 1: Core Audio Manager (Controller Layer)
- ✅ AudioManager singleton with `getInstance()`
- ✅ Sound loading via `loadSound(key, soundFile)`
- ✅ Event-driven playback via `play(key)`
- ✅ Volume control (master, music, SFX)
- ✅ Mute controls (music and SFX separate)
- ✅ Integration with SettingsManager

#### ✅ Phase 2: Audio Configuration (Config-First)
- ✅ `audioConfig.ts` with AUDIO_SOUNDS definitions
- ✅ AUDIO_EVENT_MAPPINGS for event → sound mappings
- ✅ AUDIO_CATEGORIES for grouped volume control (SFX, UI, MUSIC)
- ✅ Integration with `defaultSettings.ts`

#### ✅ Phase 3: EventBus Integration
- ✅ `setupEventListeners()` auto-subscribes to mapped events
- ✅ Automatic playback on game events (ants, powers, buildings, UI, etc.)
- ✅ Proper cleanup with unsubscribe functions
- ✅ No overlap prevention (checks `isPlaying()`)

#### ✅ Phase 4: Settings Menu Integration
- ✅ AudioSettingsScene with sliders and toggles
- ✅ Master, Music, and SFX volume sliders
- ✅ Music and SFX mute toggles
- ✅ Real-time updates (changes apply immediately)
- ✅ Back button to return to menu
- ✅ Layout in `menuLayout.ts` (AUDIO_SETTINGS_LAYOUT)

#### ✅ Phase 5: Integration with p5.js
- ✅ Sound loading in `sketch.ts` preload phase
- ✅ AudioManager initialization in setup phase
- ✅ Silent failure if sound files don't exist (development-friendly)
- ✅ Scene navigation wired to AudioSettingsScene

### How It Works

**Event-Driven Pattern:**
```
1. Game entity emits event (e.g., ANT_ATTACKED)
2. AudioManager listens to event (via AUDIO_EVENT_MAPPINGS)
3. AudioManager plays corresponding sound (e.g., 'ANT_HIT')
4. Volume applied: masterVolume * categoryVolume * soundVolume
```

**Settings Integration:**
```
1. User adjusts slider in AudioSettingsScene
2. Slider onChange → AudioManager.setMasterVolume(value)
3. AudioManager updates SettingsManager
4. SettingsManager persists to localStorage
5. On reload, AudioManager reads from SettingsManager
```

**Architecture Compliance:**
- AudioManager = **Controller** (responds to events, coordinates playback)
- AudioSettingsScene = **View** (displays controls, emits input events)
- audioConfig.ts = **Centralized Config** (single source of truth)

---

## 📋 TODO - Remaining Enhancements (Optional)

## Phase 1: Core Audio Manager (Controller Layer)

### AudioManager Singleton
- [ ] Create `src/managers/AudioManager.ts`
- [ ] Implement singleton pattern with `getInstance()`
- [ ] Add `sounds: Map<string, p5.SoundFile>` for loaded sounds
- [ ] Add `volume: number` property (0-1 scale)
- [ ] Add `muted: boolean` property for mute toggle

### Sound Loading & Playback
- [ ] Implement `loadSound(name: string, path: string): void`
- [ ] Implement `play(name: string): void` with volume application
- [ ] Add check for `!sound.isPlaying()` to prevent overlapping sounds
- [ ] Add `stop(name: string): void` for stopping specific sounds
- [ ] Add `stopAll(): void` for stopping all sounds

### Volume Control
- [ ] Implement `setVolume(volume: number): void` with `clamp(volume, 0, 1)`
- [ ] Implement `getVolume(): number` getter
- [ ] Implement `setMuted(muted: boolean): void`
- [ ] Implement `isMuted(): boolean` getter
- [ ] Update all playing sounds when volume changes

## Phase 2: Audio Configuration (Config-First)

### Audio Config File
- [ ] Create `src/config/audioConfig.ts`
- [ ] Define `AUDIO_CONFIG.SOUNDS` object with sound definitions:
  ```typescript
  {
    ANT_HIT: { file: 'assets/sounds/ant_hit.wav', volume: 0.5 },
    ANT_DEATH: { file: 'assets/sounds/ant_death.wav', volume: 0.6 },
    // ... all sounds
  }
  ```
- [ ] Define `AUDIO_CONFIG.EVENT_MAPPINGS` for event → sound mappings:
  ```typescript
  {
    [GameEvents.ANT_ATTACKED]: 'ANT_HIT',
    [GameEvents.ANT_DIED]: 'ANT_DEATH',
    // ... all mappings
  }
  ```
- [ ] Define `AUDIO_CONFIG.DEFAULT_VOLUME = 0.5`
- [ ] Define `AUDIO_CONFIG.DEFAULT_MUTED = false`

### Sound Categories (Optional)
- [ ] Add `AUDIO_CONFIG.CATEGORIES` for grouped volume control:
  ```typescript
  {
    SFX: ['ANT_HIT', 'ANT_DEATH', 'BUILDING_PLACE'],
    MUSIC: ['MENU_THEME', 'BATTLE_THEME'],
    UI: ['BUTTON_CLICK', 'BUTTON_HOVER']
  }
  ```
- [ ] Add category-specific volume properties in AudioManager
- [ ] Implement `setCategoryVolume(category: string, volume: number): void`

## Phase 3: EventBus Integration

### Event Listeners
- [ ] Implement `setupEventListeners()` in AudioManager constructor
- [ ] Subscribe to all game events using `AUDIO_CONFIG.EVENT_MAPPINGS`
- [ ] Use loop to auto-subscribe: `Object.entries(EVENT_MAPPINGS).forEach(...)`
- [ ] Store unsubscribe functions for cleanup: `unsubscribeFunctions: Array<() => void>`

### Event-Driven Playback
- [ ] Subscribe to `GameEvents.ANT_ATTACKED` → play ant hit sound
- [ ] Subscribe to `GameEvents.ANT_DIED` → play ant death sound
- [ ] Subscribe to `GameEvents.BUILDING_PLACED` → play building place sound
- [ ] Subscribe to `GameEvents.FIREBALL_LAUNCHED` → play fireball sound
- [ ] Subscribe to `GameEvents.TIDALWAVE_CAST` → play tidalwave sound
- [ ] Subscribe to `GameEvents.BLACKHOLE_CREATED` → play blackhole sound
- [ ] Subscribe to `GameEvents.FINAL_FLASH_CAST` → play final flash sound
- [ ] Subscribe to `GameEvents.BUTTON_CLICKED` → play UI click sound
- [ ] Subscribe to `GameEvents.BUTTON_HOVERED` → play UI hover sound

## Phase 4: Settings Menu Integration

### Settings Scene Updates
- [ ] Add audio section to `SettingsScene` (or create if doesn't exist)
- [ ] Add `SliderWithArrowsComponent` for master volume (0-1 range)
- [ ] Add checkbox/toggle button for mute
- [ ] Add sliders for category volumes (SFX, Music, UI) if using categories

### Volume Slider Setup
- [ ] Create volume slider sprite in `menuLayout.ts` or inline
- [ ] Position slider in settings menu layout (use normalized coordinates)
- [ ] Set initial value to `AudioManager.getInstance().getVolume()`
- [ ] Register `onChange(value)` callback to call `AudioManager.getInstance().setVolume(value)`

### Mute Toggle Setup
- [ ] Create mute button/checkbox component
- [ ] Position in settings menu layout
- [ ] Set initial state to `AudioManager.getInstance().isMuted()`
- [ ] Register `onClick()` callback to toggle: `AudioManager.getInstance().setMuted(!isMuted)`
- [ ] Update button visual state when mute changes

### Settings Persistence
- [ ] Save volume to localStorage: `localStorage.setItem('audioVolume', volume.toString())`
- [ ] Save mute state to localStorage: `localStorage.setItem('audioMuted', muted.toString())`
- [ ] Load settings on AudioManager init:
  ```typescript
  const savedVolume = localStorage.getItem('audioVolume');
  if (savedVolume) this.volume = parseFloat(savedVolume);
  ```
- [ ] Load mute state: `const savedMuted = localStorage.getItem('audioMuted')`

### Settings Events
- [ ] Emit `GameEvents.AUDIO_VOLUME_CHANGED` when volume changes
- [ ] Emit `GameEvents.AUDIO_MUTED` when mute toggled
- [ ] Settings menu listens to these events to update UI if changed elsewhere

## Phase 5: Integration with p5.js

### Preload Phase
- [ ] Call `AudioManager.getInstance()` in `sketch.ts` preload
- [ ] Loop through `AUDIO_CONFIG.SOUNDS` and call `loadSound()` for each
- [ ] Show loading progress if many sounds (optional)

### Setup Phase
- [ ] Load saved settings from localStorage in AudioManager constructor
- [ ] Apply initial volume/mute state to all loaded sounds
- [ ] Emit `GameEvents.AUDIO_INITIALIZED` when ready

### Testing Audio
- [ ] Add debug mode button to test individual sounds
- [ ] Add console logs to verify sounds load correctly
- [ ] Test volume changes apply to currently playing sounds

## Phase 6: Testing

### Unit Tests
- [ ] Create `test/unit/audioManager.test.ts`
- [ ] Test `setVolume()` clamps to [0, 1]
- [ ] Test `setMuted()` toggles state
- [ ] Test `play()` doesn't play if muted
- [ ] Test `play()` doesn't overlap if sound already playing
- [ ] Test EventBus integration (mock EventBus.on calls)

### Integration Tests
- [ ] Test settings menu slider changes AudioManager volume
- [ ] Test mute toggle affects playback
- [ ] Test localStorage persistence (save/load)
- [ ] Test volume changes apply to active sounds

### Manual Testing
- [ ] Test all game events trigger correct sounds
- [ ] Test volume slider in settings changes all sound volumes
- [ ] Test mute button silences all sounds
- [ ] Test settings persist after page reload
- [ ] Test sounds don't overlap when event fires rapidly

## Phase 7: Polish & Optimization

### Sound Pooling (Optional)
- [ ] Implement sound pooling for frequently played sounds (ant hits, etc.)
- [ ] Create multiple instances of common sounds to allow overlapping
- [ ] Rotate through pool when playing to prevent cutoff

### Fade Effects (Optional)
- [ ] Implement `fadeIn(name: string, duration: number): void`
- [ ] Implement `fadeOut(name: string, duration: number): void`
- [ ] Use for music transitions between scenes

### Spatial Audio (Optional)
- [ ] Add `playAtPosition(name: string, x: number, y: number, listenerX: number, listenerY: number): void`
- [ ] Calculate volume based on distance from listener (camera center)
- [ ] Calculate panning based on horizontal position

### Performance
- [ ] Unload unused sounds to free memory (scene-specific sounds)
- [ ] Preload only essential sounds, lazy-load others
- [ ] Add `MAX_CONCURRENT_SOUNDS` limit to prevent audio overload

## Phase 8: Documentation

### Code Documentation
- [ ] Add JSDoc comments to all AudioManager public methods
- [ ] Document audio config structure in `audioConfig.ts`
- [ ] Add usage examples in comments

### User Documentation
- [ ] Update README with audio setup instructions
- [ ] Document how to add new sounds (config + event mapping)
- [ ] Document settings menu audio controls

### Architecture Documentation
- [ ] Update `docs/architecture/` with AudioManager pattern
- [ ] Add audio system diagram showing EventBus → AudioManager flow
- [ ] Document why AudioManager is Controller layer (responds to events, no state)

## Notes

**MVC Compliance:**
- AudioManager is **Controller layer** - responds to events, coordinates audio playback
- Settings menu is **View layer** - displays controls, emits input events
- Audio config is **centralized config** - single source of truth for all audio settings

**EventBus Pattern:**
- Entities/powers emit game events (ANT_ATTACKED, FIREBALL_LAUNCHED, etc.)
- AudioManager subscribes to events and plays corresponding sounds
- Settings menu emits AUDIO_VOLUME_CHANGED when user adjusts volume
- Fully decoupled - entities don't know about audio

**Testing Strategy:**
- Mock p5.SoundFile for unit tests (no actual audio playback needed)
- Test AudioManager logic in isolation
- Integration tests verify settings menu ↔ AudioManager connection
- Manual testing for actual audio experience

**Performance Considerations:**
- Lazy-load sounds not needed immediately (menu sounds vs gameplay sounds)
- Use sound pooling for frequently triggered sounds to prevent cutoff
- Limit concurrent sounds to prevent browser audio context overload
- Unload scene-specific sounds when switching scenes
