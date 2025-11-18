# Animation System Implementation Checklist

**Goal:** Implement grid-based spritesheet animation system with EventBus integration for state-driven animations.

**Status:** 🟡 Ready for Review  
**Estimated Effort:** ~3-4 hours  
**Priority:** Medium

---

## 📋 Overview

### Key Features
- **Grid-based frame selection** (Godot-style) - specify row/column for each frame
- **Variable frame/grid dimensions** - each spritesheet can have different sizes
- **Frame-based timing** - animations advance per game frame (default: every 5 frames)
- **EventBus integration** - state changes automatically trigger animation switches
- **Config-first design** - all animation data lives in config files, not code

### Animation States (Phase 1)
- `idle` - Standing still
- `walk` - Moving
- `attack` - Combat action
- `gather` - Collecting resources
- `build` - Construction action
- `die` - Death animation

---

## 🎯 Implementation Phases

### **Phase 1: Core System** (Steps 1-4)
Foundation components and configuration

### **Phase 2: Integration** (Steps 5-9)
Connect to existing entity system

### **Phase 3: Testing** (Steps 10, 14)
Validate functionality

### **Phase 4: Expansion** (Steps 11-13)
Polish and extend to other entities

---

## ✅ Detailed Steps

### **Step 1: Create AnimatedSpriteSheetComponent**
**File:** `src/rendering/components/AnimatedSpriteSheetComponent.ts`

**Requirements:**
- Implement `Renderable` interface (layer, depth, render())
- Grid-based frame extraction using p5.js `graphics.copy()`
- Support variable frame dimensions (width/height per animation)
- Frame-based timing (not time-based)
- Multiple animation states with loop/one-shot support

**Key Methods:**
```typescript
constructor(spritesheet: any, x: number, y: number)
addAnimation(name: string, config: AnimationConfig)
playAnimation(name: string, force?: boolean)
update() // Advance frame counter
render(graphics: any) // Extract and draw current frame
setPosition(x: number, y: number)
setDepth(depth: number)
```

**AnimationConfig Structure:**
```typescript
{
    row: number,           // Grid row (0-indexed)
    startCol: number,      // Starting column (0-indexed)
    endCol: number,        // Ending column (inclusive)
    frameWidth: number,    // Width of each frame in pixels
    frameHeight: number,   // Height of each frame in pixels
    speed: number,         // Frames to wait between animation frames (default: 5)
    loop: boolean          // Loop animation or play once
}
```

**Notes:**
- Each animation can have different frame dimensions
- Support negative offsets for proper entity centering
- Handle null/missing spritesheets gracefully (magenta placeholder like SpriteComponent)

---

### **Step 2: Create Animation Configuration File**
**File:** `src/config/animationConfig.ts`

**Requirements:**
- Config-first philosophy: ALL animation data in this file
- Separate configs per entity type (ants by job, queen, boss, etc.)
- Frame dimensions, row/column positions, speed, loop settings
- Easy to modify without touching code

**Structure:**
```typescript
export const ANT_ANIMATIONS = {
    DEFAULT: {
        idle: {
            row: 0,
            startCol: 0,
            endCol: 1,
            frameWidth: 32,
            frameHeight: 32,
            speed: 8,
            loop: true
        },
        walk: { /* ... */ },
        attack: { /* ... */ },
        gather: { /* ... */ },
        build: { /* ... */ },
        die: { /* ... */ }
    },
    WARRIOR: {
        idle: { /* ... */ },
        walk: { /* ... */ },
        // etc.
    },
    SCOUT: { /* ... */ },
    FARMER: { /* ... */ },
    BUILDER: { /* ... */ },
    SPITTER: { /* ... */ }
};

export const QUEEN_ANIMATIONS = { /* ... */ };
export const BOSS_ANIMATIONS = { /* ... */ };

// Job type to animation config mapping
export const JOB_TO_ANIMATION_MAP = {
    [AntJobComponent.JOB_GATHERER]: ANT_ANIMATIONS.DEFAULT,
    [AntJobComponent.JOB_WARRIOR]: ANT_ANIMATIONS.WARRIOR,
    [AntJobComponent.JOB_SCOUT]: ANT_ANIMATIONS.SCOUT,
    [AntJobComponent.JOB_FARMER]: ANT_ANIMATIONS.FARMER,
    [AntJobComponent.JOB_BUILDER]: ANT_ANIMATIONS.BUILDER,
    [AntJobComponent.JOB_SPITTER]: ANT_ANIMATIONS.SPITTER
};
```

**Notes:**
- Variable dimensions allow each animation to have different frame sizes
- Speed is configurable per animation (fast attacks, slow idles)
- Initially use placeholder values, tune during testing

---

### **Step 3: Add EventBus Integration**
**Modify:** `AnimatedSpriteSheetComponent.ts` (from Step 1)

**Requirements:**
- Subscribe to `ENTITY_STATE_CHANGED` event
- Map `EntityState` enum to animation names
- Automatically switch animations on state changes
- Cleanup EventBus subscriptions on destruction

**State-to-Animation Mapping:**
```typescript
EntityState.IDLE → 'idle'
EntityState.MOVING → 'walk'
EntityState.ATTACKING → 'attack'
EntityState.GATHERING → 'gather'
EntityState.BUILDING → 'build'
EntityState.DEAD → 'die'
```

**Key Method:**
```typescript
setOwnerEntity(entityId: string, stateComponent: StateMachineComponent)
// Setup EventBus listener for this entity's state changes
```

**Notes:**
- Allow manual animation override for special cases
- Only switch if animation actually changes (avoid spam)
- Store unsubscribe function for cleanup

---

### **Step 4: Load Spritesheets in Preload**
**File:** `src/sketch.ts`

**Requirements:**
- Load all spritesheets in `preload()` function
- Store in global object for factory access
- Follow existing pattern (like `menuImages`, `tileSprites`)

**Spritesheets to Load:**
- `assets/spriteSheets/Default.png`
- `assets/spriteSheets/Warrior.png`
- `assets/spriteSheets/Scout.png`
- `assets/spriteSheets/Farmer.png`
- `assets/spriteSheets/Builder.png`
- `assets/spriteSheets/Spitter.png`
- `assets/spriteSheets/Queen.png`

**Code Pattern:**
```typescript
const entitySpritesheets: { [key: string]: any } = {};

function preload() {
    // ... existing loads ...
    
    entitySpritesheets.default = loadImage('assets/spriteSheets/Default.png');
    entitySpritesheets.warrior = loadImage('assets/spriteSheets/Warrior.png');
    // etc.
}
```

**Notes:**
- Lowercase keys for consistency
- Add to existing preload, don't replace
- Export for factory imports

---

### **Step 5: Update AntFactory**
**File:** `src/factories/AntFactory.ts`

**Requirements:**
- Replace `SpriteComponent` with `AnimatedSpriteSheetComponent`
- Select spritesheet based on ant's job type
- Load animations from `animationConfig.ts`
- Setup state-to-animation mapping
- Use `setupEntitySpriteBinding()` helper (may need updates)

**Pattern:**
```typescript
// Get job-specific spritesheet and animations
const jobType = ant.getComponent('AntJob').currentJob;
const spritesheet = getSpritesheetForJob(jobType); // Helper function
const animations = JOB_TO_ANIMATION_MAP[jobType];

// Create animated sprite component
const animSprite = new AnimatedSpriteSheetComponent(spritesheet, worldX, worldY);

// Add all animations for this job
Object.entries(animations).forEach(([name, config]) => {
    animSprite.addAnimation(name, config);
});

// Setup state mapping
const stateMachine = ant.getComponent('StateMachine');
animSprite.setOwnerEntity(ant.id, stateMachine);

// Start with idle animation
animSprite.playAnimation('idle');

// Register with renderer (using helper)
setupEntitySpriteBinding(ant, animSprite, renderer, RenderLayer.ENTITIES);
```

**Notes:**
- Maintain backward compatibility during transition
- Helper function to map job type → spritesheet
- Ensure EntityManager still calls update()

---

### **Step 6: Extend setupEntitySpriteBinding Helper**
**File:** `src/utils/helpers.ts`

**Requirements:**
- Support both `SpriteComponent` AND `AnimatedSpriteSheetComponent`
- Type guard to check component type
- Call `update()` method for animated sprites (frame advancement)
- Maintain existing behavior for static sprites

**Implementation:**
```typescript
export function setupEntitySpriteBinding(
    entity: any,
    sprite: SpriteComponent | AnimatedSpriteSheetComponent,
    renderer: Renderer,
    layer: RenderLayer
): void {
    // ... existing registration code ...
    
    // NEW: If animated sprite, ensure update() is called
    if ('playAnimation' in sprite) { // Type guard for AnimatedSpriteSheetComponent
        const originalUpdate = entity.update?.bind(entity);
        entity.update = (deltaTime: number) => {
            if (originalUpdate) originalUpdate(deltaTime);
            sprite.update(); // Advance animation frame
        };
    }
    
    // ... existing event listeners and cleanup ...
}
```

**Notes:**
- Use duck typing (`'playAnimation' in sprite`) to detect animated sprites
- Don't break existing non-animated entities
- Animation update happens every frame entity updates

---

### **Step 7: Add ENTITY_STATE_CHANGED Event**
**File:** `src/utils/eventBus.ts`

**Requirements:**
- Add new event constant to `GameEvents`
- Document payload structure
- Follow existing event naming conventions

**Code:**
```typescript
export const GameEvents = {
    // ... existing events ...
    
    // Entity state changes
    ENTITY_STATE_CHANGED: 'ENTITY_STATE_CHANGED', // Payload: (entityId: string, oldState: EntityState, newState: EntityState)
} as const;
```

**Notes:**
- Used by AnimatedSpriteSheetComponent to auto-switch animations
- Emitted by StateMachineComponent (Step 8)

---

### **Step 8: Update StateMachineComponent**
**File:** `src/classes/components/StateMachineComponent.ts`

**Requirements:**
- Emit `ENTITY_STATE_CHANGED` event in `setState()` method
- Include entity ID from `this.owner.id`
- Only emit if state actually changed (avoid spam)
- Follow existing EventBus patterns

**Implementation:**
```typescript
setState(newState: EntityState): void {
    if (this.currentState === newState) return; // No change, skip
    
    const oldState = this.currentState;
    this.currentState = newState;
    
    // Emit state change event for animation system
    if (this.owner?.id) {
        EventBus.emit(GameEvents.ENTITY_STATE_CHANGED, this.owner.id, oldState, newState);
    }
}
```

**Notes:**
- Check for owner existence (safety)
- Emit AFTER state changes (animations see new state)

---

### **Step 9: Update factoryImports.ts**
**File:** `src/imports/factoryImports.ts`

**Requirements:**
- Export `AnimatedSpriteSheetComponent`
- Export animation config (once created)
- Export `entitySpritesheets` from sketch.ts
- Maintain existing exports

**Code:**
```typescript
// Rendering components
export { AnimatedSpriteSheetComponent } from '../rendering/components/AnimatedSpriteSheetComponent';
export { SpriteComponent } from '../rendering/components/SpriteComponent';

// Animation config
export { 
    ANT_ANIMATIONS, 
    QUEEN_ANIMATIONS, 
    JOB_TO_ANIMATION_MAP 
} from '../config/animationConfig';

// Spritesheets (from sketch.ts)
export { entitySpritesheets } from '../sketch';
```

**Notes:**
- Reduces imports in factory files
- Follows existing barrel export pattern

---

### **Step 10: Write Unit Tests (TDD)**
**File:** `test/unit/animatedSpriteSheet.test.ts`

**Requirements:**
- **TDD: Write tests BEFORE implementing component**
- Test frame extraction from grid
- Test animation state switching
- Test loop vs one-shot animations
- Test frame advancement (frame-based timing)
- Test EventBus integration (state changes trigger animations)
- Mock p5.js graphics functions

**Test Cases:**
1. Constructor initializes correctly
2. `addAnimation()` stores animation config
3. `playAnimation()` switches active animation
4. `update()` advances frame counter based on speed
5. Frame wraps around for looping animations
6. One-shot animations stop at last frame
7. `render()` extracts correct frame from grid (test graphics.copy() call)
8. EventBus listener switches animation on state change
9. Variable frame dimensions work correctly
10. Cleanup unsubscribes from EventBus

**Notes:**
- Follow existing test patterns (see `test/unit/uiComponents.test.ts`)
- Use Chai assertions
- Mock p5.js with test stubs

---

### **Step 11: Add Animation Helper Utilities**
**File:** `src/utils/helpers.ts`

**Requirements:**
- Add helper functions for common animation operations
- Follow existing helper patterns (pure functions, well-documented)

**Functions:**
```typescript
/**
 * Calculate flat index from grid position
 * @param row - Grid row (0-indexed)
 * @param col - Grid column (0-indexed)
 * @param gridWidth - Total columns in grid
 * @returns Flat frame index
 */
export function calculateFrameIndex(row: number, col: number, gridWidth: number): number;

/**
 * Create animation config object
 * @param row - Grid row
 * @param startCol - Starting column
 * @param endCol - Ending column (inclusive)
 * @param frameWidth - Frame width in pixels
 * @param frameHeight - Frame height in pixels
 * @param speed - Frames between animation frames (default: 5)
 * @param loop - Loop animation (default: true)
 * @returns Animation config object
 */
export function createAnimationData(
    row: number, 
    startCol: number, 
    endCol: number, 
    frameWidth: number, 
    frameHeight: number, 
    speed?: number, 
    loop?: boolean
): AnimationConfig;
```

**Notes:**
- Add JSDoc with examples
- Test these functions in helper tests
- Optional: Add to helpers export

---

### **Step 12: Update Other Factories**
**Files:** 
- `src/factories/QueenFactory.ts`
- `src/factories/BossFactory.ts`
- (Optional) `src/factories/ProjectileFactory.ts`

**Requirements:**
- Apply same pattern as AntFactory
- Use entity-specific animation configs
- Queen uses `Queen.png` spritesheet
- Boss uses spider sprites (if applicable)

**Notes:**
- Follow AntFactory implementation exactly
- Can be done incrementally (start with Queen)
- Projectile animation is optional (Phase 4)

---

### **Step 13: Document Animation System**
**File:** `docs/architecture/ANIMATION_SYSTEM.md`

**Requirements:**
- Explain AnimatedSpriteSheetComponent architecture
- Grid-based frame extraction (Godot-style)
- State-driven animation via EventBus
- Configuration pattern (animationConfig.ts)
- Usage examples for adding new animated entities
- Frame timing explanation
- Troubleshooting guide

**Sections:**
1. Overview
2. Architecture Diagram
3. Configuration Guide (adding new animations)
4. EventBus Integration
5. Factory Integration Pattern
6. Performance Considerations
7. Common Issues & Solutions

**Notes:**
- Include code examples
- Reference checklist for implementation steps
- Add to docs/architecture/ directory

---

### **Step 14: Integration Testing**
**Environment:** Browser

**Test Cases:**
1. ✅ Create test ant with animated sprite
2. ✅ Verify animations play correctly (frame advancement)
3. ✅ Test state transitions (idle→walk→attack→gather→build→die)
4. ✅ Check performance (spawn 50+ animated entities)
5. ✅ Verify no memory leaks (EventBus cleanup on entity destruction)
6. ✅ Test with different job types (warrior, scout, farmer, builder, spitter, default)
7. ✅ Regression test: ensure static sprites still work (resources, buildings, projectiles)
8. ✅ Window resize handling (animations still render correctly)
9. ✅ Animation speed adjustments (test different speed values)
10. ✅ One-shot animations (die animation doesn't loop)

**Notes:**
- Use DevRoom scene for testing
- Check browser console for errors
- Monitor frame rate (should stay smooth with many entities)
- Test on different browsers (Chrome, Firefox)

---

## 📊 Success Criteria

- [ ] Ants display animated sprites instead of static images
- [ ] Animations change automatically based on entity state
- [ ] Multiple ants with different job types show different animations
- [ ] Performance remains smooth with 50+ animated entities
- [ ] No memory leaks or EventBus subscription issues
- [ ] Configuration file is easy to modify for new animations
- [ ] Static sprites (resources, buildings) continue working unchanged
- [ ] Unit tests pass with >90% coverage
- [ ] Documentation is clear and includes examples

---

## 🚧 Known Considerations

### Variable Spritesheet Dimensions
- Each spritesheet can have different grid sizes
- Frame dimensions specified per animation in config
- No assumptions about uniform frame sizes

### EventBus Cleanup
- AnimatedSpriteSheetComponent must unsubscribe on destruction
- Factory cleanup already handled by `setupEntitySpriteBinding()`
- Test for memory leaks with entity creation/destruction cycles

### Backward Compatibility
- Existing entities with `SpriteComponent` must continue working
- `setupEntitySpriteBinding()` supports both component types
- Gradual migration (start with ants, then queen, then boss)

### Performance
- `graphics.copy()` for frame extraction (potential bottleneck)
- Consider caching extracted frames if performance issues arise
- Frame-based timing keeps animation speed consistent

### Animation Config Accuracy
- Placeholder values initially (need to inspect spritesheets)
- Iterative tuning during testing phase
- Config-first design makes adjustments easy

---

## 📝 Notes

- **TDD Workflow:** Write tests first (Step 10), then implement component (Step 1)
- **Config-First:** All animation data in config file, not hardcoded
- **Incremental Rollout:** Start with ants, expand to other entities
- **Godot-Style Selection:** Row/column selection, variable dimensions
- **Frame-Based Timing:** Consistent animation speed regardless of frame rate

---

## 🔗 Related Documents

- `docs/codeExamples/FACTORY_PATTERN.md` - Factory implementation patterns
- `docs/examples/EVENTBUS_EXAMPLES.md` - EventBus usage patterns
- `docs/architecture/RENDERING_SYSTEM_CODE.md` - Rendering architecture
- `.github/copilot-instructions.md` - Project coding standards

---

**Checklist Created:** November 15, 2025  
**Last Updated:** November 15, 2025  
**Status:** 🟡 Ready for Team Review
