# BaseManager Pattern

## Overview
`BaseManager` is an abstract base class that extracts common patterns from all singleton managers, reducing boilerplate and ensuring consistency.

## Features Provided
1. **EventBus Subscription Management** - Automatic tracking and cleanup
2. **Helper Methods** - `subscribe()`, `subscribeOnce()`, `emit()`
3. **Automatic Cleanup** - `cleanupSubscriptions()` for teardown

## Line Count Reduction
**Before BaseManager:**
- Manual `unsubscribeFunctions` array management
- Manual `EventBus.on()` + `push()` pattern
- Manual cleanup loop in `cleanup()`
- ~10-15 lines of boilerplate per manager

**After BaseManager:**
- `extends BaseManager` in class declaration
- `this.subscribe()` replaces `EventBus.on() + push()`
- `this.emit()` replaces `EventBus.emit()`
- `this.cleanupSubscriptions()` replaces manual loop
- **~8-12 lines saved per manager**

## Usage Pattern

### Basic Manager Implementation
```typescript
import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';

export class MyManager extends BaseManager {
    private static instance: MyManager;
    
    private constructor() {
        super(); // REQUIRED - initializes BaseManager
        
        // Setup event listeners (tracked automatically)
        this.subscribe(GameEvents.PLAYER_MOVE, (x: number, y: number) => {
            this.handlePlayerMove(x, y);
        });
        
        // One-time listeners
        this.subscribeOnce(GameEvents.GAME_START, () => {
            this.initialize();
        });
    }
    
    public static getInstance(): MyManager {
        if (!MyManager.instance) {
            MyManager.instance = new MyManager();
        }
        return MyManager.instance;
    }
    
    private handlePlayerMove(x: number, y: number): void {
        // Process move
        
        // Emit events easily
        this.emit(GameEvents.PLAYER_MOVED, x, y);
    }
    
    public cleanup(): void {
        this.cleanupSubscriptions(); // Unsubscribe all tracked listeners
        // Additional cleanup...
    }
}
```

### Comparison: Before vs After

**BEFORE (Manual Pattern):**
```typescript
export class AudioManager {
    private static instance: AudioManager;
    private unsubscribeFunctions: Array<() => void>; // Manual tracking
    
    private constructor() {
        this.unsubscribeFunctions = []; // Manual initialization
        
        // Manual subscription tracking
        this.unsubscribeFunctions.push(
            EventBus.on(GameEvents.SETTING_AUDIO_CHANGED, (settings: AudioSettings) => {
                this.handleSettingsChange(settings);
            })
        );
    }
    
    private setupEventListeners(): void {
        Object.entries(AUDIO_EVENT_MAPPINGS).forEach(([eventName, soundKey]) => {
            const unsubscribe = EventBus.on(eventName, () => { // Manual subscribe
                this.play(soundKey);
            });
            this.unsubscribeFunctions.push(unsubscribe); // Manual tracking
        });
    }
    
    private updateAllVolumes(): void {
        // ...
        EventBus.emit('AUDIO_VOLUME_CHANGED', { /* ... */ }); // Direct EventBus call
    }
    
    public cleanup(): void {
        // Manual cleanup loop
        this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        this.unsubscribeFunctions = [];
        this.stopAll();
    }
}
```

**AFTER (BaseManager Pattern):**
```typescript
export class AudioManager extends BaseManager { // Extend BaseManager
    private static instance: AudioManager;
    // No unsubscribeFunctions array needed!
    
    private constructor() {
        super(); // Initialize BaseManager
        
        // Automatic subscription tracking
        this.subscribe(GameEvents.SETTING_AUDIO_CHANGED, (settings: AudioSettings) => {
            this.handleSettingsChange(settings);
        });
    }
    
    private setupEventListeners(): void {
        Object.entries(AUDIO_EVENT_MAPPINGS).forEach(([eventName, soundKey]) => {
            this.subscribe(eventName, () => { // Automatic tracking
                this.play(soundKey);
            });
        });
    }
    
    private updateAllVolumes(): void {
        // ...
        this.emit('AUDIO_VOLUME_CHANGED', { /* ... */ }); // Helper method
    }
    
    public cleanup(): void {
        this.cleanupSubscriptions(); // One line cleanup!
        this.stopAll();
    }
}
```

**Line Count Savings:**
- ❌ Removed: `private unsubscribeFunctions` declaration (1 line)
- ❌ Removed: `this.unsubscribeFunctions = []` initialization (1 line)
- ❌ Removed: `.push()` calls (1 line per subscription × N)
- ❌ Removed: Manual cleanup loop (3 lines)
- ✅ Added: `extends BaseManager` (replaces class declaration)
- ✅ Added: `super()` call (1 line)
- ✅ Added: `this.cleanupSubscriptions()` (replaces loop)

**Result: ~8-12 lines saved per manager**

## Benefits

### 1. Reduced Boilerplate
- No manual subscription tracking arrays
- No repetitive `EventBus.on() + push()` pattern
- No manual cleanup loops

### 2. Consistency
- All managers use same subscription pattern
- Guaranteed cleanup on `cleanup()` call
- Less room for mistakes (forgetting to push/cleanup)

### 3. Maintainability
- Changes to subscription pattern happen in one place
- Clear separation of concerns
- Easy to add features to all managers at once

### 4. Type Safety
- TypeScript inheritance ensures proper implementation
- Abstract `cleanup()` forces subclasses to implement
- Protected methods prevent misuse

## Migration Checklist

Refactoring an existing manager to use BaseManager:

1. ✅ Import BaseManager: `import { BaseManager } from './BaseManager';`
2. ✅ Change class declaration: `export class XManager extends BaseManager`
3. ✅ Add `super()` call at start of constructor
4. ✅ Remove `private unsubscribeFunctions` declaration
5. ✅ Remove `this.unsubscribeFunctions = []` initialization
6. ✅ Replace `EventBus.on() + push()` with `this.subscribe()`
7. ✅ Replace `EventBus.once() + push()` with `this.subscribeOnce()`
8. ✅ Replace `EventBus.emit()` with `this.emit()`
9. ✅ Replace manual cleanup loop with `this.cleanupSubscriptions()`
10. ✅ Test that all event listeners still work

## Future Enhancements

Potential additions to BaseManager:
- **State management helpers** - Common state patterns
- **Timer management** - Automatic cleanup of intervals/timeouts
- **Async operation tracking** - Cancel pending operations on cleanup
- **Debug logging** - Optional event subscription logging
- **Performance monitoring** - Track event handler execution time

## Related Documentation
- `src/managers/BaseManager.ts` - Implementation
- `docs/examples/EVENTBUS_EXAMPLES.md` - EventBus patterns
- `docs/codeExamples/FACTORY_PATTERN.md` - Similar pattern extraction
