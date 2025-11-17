# Framerate Independence Implementation

## Date: November 17, 2025

## Objective
Make all game logic framerate independent by using actual delta time instead of assuming 60fps (16.67ms).

---

## Problem

**Before:** Game logic assumed constant 60fps with hardcoded `16.67` millisecond delta time:
```typescript
EntityManager.getInstance().update(16.67); // Assumes 60fps
this.spawnManager.update(16.67);
this.constructionManager.update(16.67);
ParticleSystem.getInstance().update(16.67);
```

**Impact:**
- Game runs faster on high refresh rate monitors (120Hz, 144Hz)
- Game runs slower on low-end hardware that can't maintain 60fps
- Movement speeds, timers, and animations tied to framerate
- Inconsistent gameplay experience across different hardware

---

## Solution

### 1. Delta Time Calculation in sketch.ts

**Added p5.js deltaTime global:**
```typescript
declare const deltaTime: any; // p5.js deltaTime in milliseconds
```

**Calculate actual delta time in draw() loop:**
```typescript
function draw() {
    // Calculate delta time (p5.js provides deltaTime in milliseconds)
    const dt = deltaTime || 16.67; // Fallback to 60fps if deltaTime not available
    
    // Pass to SceneManager
    SceneManager.getInstance().update(dt);
}
```

**Why p5.js deltaTime?**
- Built-in p5.js variable that tracks time since last frame
- Already in milliseconds (matches our convention)
- Automatically handles variable framerates

---

### 2. Update Chain Propagation

**IScene Interface:**
```typescript
update(deltaTime: number): void;
```

**SceneManager:**
```typescript
public update(deltaTime: number): void {
    if (this.currentScene) {
        this.currentScene.update(deltaTime);
    }
    // ... cross-scene system updates
}
```

**All Scenes Updated:**
- ✅ DevRoomScene - passes deltaTime to all subsystems
- ✅ MenuScene - accepts deltaTime (unused for UI animations)
- ✅ PauseMenuScene - accepts deltaTime
- ✅ EntityShowcaseScene - accepts deltaTime
- ✅ AudioSettingsScene - accepts deltaTime
- ✅ VideoSettingsScene - accepts deltaTime
- ✅ ControlsScene - accepts deltaTime
- ✅ BaseScene - abstract method updated
- ✅ BaseGameScene - abstract method updated

---

### 3. Systems Now Using Delta Time

**Entity System:**
```typescript
EntityManager.getInstance().update(deltaTime);
```

**Spawning System:**
```typescript
this.spawnManager.update(deltaTime);
```

**Construction System:**
```typescript
this.constructionManager.update(deltaTime);
```

**Particle System:**
```typescript
ParticleSystem.getInstance().update(deltaTime);
```

**Enemy Building Spawns:**
```typescript
this.updateEnemyBuildingSpawns(deltaTime);
```

---

## Delta Time Flow

```
p5.js draw() loop
    ↓
Calculate deltaTime (actual ms since last frame)
    ↓
SceneManager.update(deltaTime)
    ↓
Current Scene.update(deltaTime)
    ↓
┌─────────────────────────────────────────┐
│ DevRoomScene propagates to:             │
│ - EntityManager.update(deltaTime)       │
│ - SpawnManager.update(deltaTime)        │
│ - ConstructionManager.update(deltaTime) │
│ - ParticleSystem.update(deltaTime)      │
│ - updateEnemyBuildingSpawns(deltaTime)  │
└─────────────────────────────────────────┘
    ↓
Each entity: entity.update(deltaTime)
    ↓
Each component: component.update(deltaTime)
```

---

## Technical Details

### Delta Time Units
- **Milliseconds** - Consistent with original hardcoded values
- 16.67ms = 60fps (fallback value)
- Higher FPS = smaller deltaTime
- Lower FPS = larger deltaTime

### Fallback Behavior
```typescript
const dt = deltaTime || 16.67;
```
- If p5.js deltaTime unavailable (unlikely), defaults to 60fps
- Ensures game always runs even if deltaTime fails

### Unused Parameters
Scenes that don't need deltaTime mark it with underscore:
```typescript
update(_deltaTime: number): void {
    // UI-only updates, no time-dependent logic
}
```

---

## Benefits

### ✅ Consistent Speed Across Framerates
- 30fps: deltaTime ≈ 33ms → entities move 2x per frame
- 60fps: deltaTime ≈ 16.67ms → entities move 1x per frame
- 120fps: deltaTime ≈ 8.33ms → entities move 0.5x per frame
- **Result:** Same world speed regardless of framerate

### ✅ Smooth on High Refresh Monitors
- 144Hz monitors get smoother rendering without speed boost
- Entities interpolate between positions properly
- No unfair advantage from high refresh rates

### ✅ Playable on Low-End Hardware
- If framerate drops to 30fps, game compensates automatically
- Entities move correct distance based on actual time elapsed
- No slowdown or speed reduction

### ✅ Accurate Timers
- Spawn intervals respect real time, not frame counts
- Construction progress accurate
- Cooldowns work correctly regardless of framerate

---

## Testing Checklist

Test at different framerates to verify framerate independence:

### High Framerate (120Hz+ Monitor)
- [ ] Entities move at normal speed (not faster)
- [ ] Spawn timers work correctly
- [ ] Combat feels normal
- [ ] Building construction progresses at correct rate
- [ ] Particle animations smooth

### Normal Framerate (60Hz)
- [ ] Same speed as before changes
- [ ] No regression in gameplay feel

### Low Framerate (Throttle CPU/GPU)
- [ ] Entities still move at correct speed
- [ ] Game doesn't slow down (just less smooth visually)
- [ ] Timers still accurate
- [ ] Physics still consistent

### FPS Drop Test
- [ ] Sudden FPS drops don't cause teleporting
- [ ] Entities smoothly adjust to variable framerate
- [ ] No visual artifacts from large deltaTime spikes

---

## Future Improvements

### Delta Time Clamping (Recommended)
Add max deltaTime to prevent large spikes:
```typescript
const dt = Math.min(deltaTime || 16.67, 100); // Cap at 100ms (10fps)
```
**Why:** If game freezes for 1 second, entities shouldn't teleport 1 second worth of movement in next frame.

### Frame Skipping for Physics
For very low framerates, consider multiple physics steps per render:
```typescript
if (deltaTime > 32) { // Below 30fps
    // Run physics twice with dt/2
}
```

### Interpolation for Smooth Rendering
Already partially implemented in movement system - consider expanding to all visual elements.

---

## Related Files

### Modified Files
- `src/sketch.ts` - Delta time calculation and propagation
- `src/scenes/IScene.ts` - Interface updated with deltaTime parameter
- `src/managers/SceneManager.ts` - Passes deltaTime to scenes
- `src/scenes/DevRoomScene.ts` - Propagates deltaTime to all subsystems
- `src/scenes/MenuScene.ts` - Accepts deltaTime (unused)
- `src/scenes/PauseMenuScene.ts` - Accepts deltaTime (unused)
- `src/scenes/EntityShowcaseScene.ts` - Accepts deltaTime
- `src/scenes/AudioSettingsScene.ts` - Accepts deltaTime (unused)
- `src/scenes/VideoSettingsScene.ts` - Accepts deltaTime (unused)
- `src/scenes/ControlsScene.ts` - Accepts deltaTime (unused)
- `src/scenes/BaseScene.ts` - Abstract method updated
- `src/scenes/BaseGameScene.ts` - Abstract method updated

### Systems Already Using Delta Time
- `src/managers/EntityManager.ts` - `update(deltaTime)`
- `src/managers/SpawnManager.ts` - `update(deltaTime)`
- `src/managers/ConstructionManager.ts` - `update(deltaTime)`
- `src/managers/ParticleSystem.ts` - `update(deltaTime)`
- `src/classes/GameObject.ts` - `update(deltaTime)`
- All components - `update(deltaTime)` interface

---

## Build Status

✅ **Build Successful**
```bash
npm run build
# TypeScript compilation: SUCCESS
# esbuild bundle: SUCCESS (932.4kb)
```

No compilation errors. All scenes properly implement new interface.
