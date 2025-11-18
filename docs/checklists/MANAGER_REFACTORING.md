# Manager Refactoring Checklist

## Quick Migration Guide: Converting to BaseManager

Use this checklist when refactoring a manager to use `BaseManager` pattern.

### Step 1: Update Imports
```diff
- import { EventBus, GameEvents } from '../utils/eventBus';
+ import { BaseManager } from './BaseManager';
+ import { GameEvents } from '../utils/eventBus';
```

### Step 2: Extend BaseManager
```diff
- export class AudioManager {
+ export class AudioManager extends BaseManager {
      private static instance: AudioManager;
-     private unsubscribeFunctions: Array<() => void>;
```

### Step 3: Call super() in Constructor
```diff
      private constructor() {
+         super(); // Must be first line
-         this.unsubscribeFunctions = [];
```

### Step 4: Replace EventBus.on() + push()
```diff
-         this.unsubscribeFunctions.push(
-             EventBus.on(GameEvents.SOME_EVENT, (data) => {
-                 this.handleEvent(data);
-             })
-         );
+         this.subscribe(GameEvents.SOME_EVENT, (data) => {
+             this.handleEvent(data);
+         });
```

### Step 5: Replace EventBus.once() + push()
```diff
-         this.unsubscribeFunctions.push(
-             EventBus.once(GameEvents.INIT, () => {
-                 this.initialize();
-             })
-         );
+         this.subscribeOnce(GameEvents.INIT, () => {
+             this.initialize();
+         });
```

### Step 6: Replace EventBus.emit()
```diff
-         EventBus.emit(GameEvents.STATE_CHANGED, newState);
+         this.emit(GameEvents.STATE_CHANGED, newState);
```

### Step 7: Update cleanup() Method
```diff
      public cleanup(): void {
-         this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
-         this.unsubscribeFunctions = [];
+         this.cleanupSubscriptions();
          // Other cleanup...
      }
```

## Complete Example

### BEFORE:
```typescript
import { EventBus, GameEvents } from '../utils/eventBus';

export class ResourceManager {
    private static instance: ResourceManager;
    private unsubscribeFunctions: Array<() => void>;
    private resources: Map<string, number>;
    
    private constructor() {
        this.unsubscribeFunctions = [];
        this.resources = new Map();
        
        // Setup listeners
        this.unsubscribeFunctions.push(
            EventBus.on(GameEvents.RESOURCE_COLLECTED, (type: string, amount: number) => {
                this.addResource(type, amount);
            })
        );
        
        this.unsubscribeFunctions.push(
            EventBus.on(GameEvents.RESOURCE_SPENT, (type: string, amount: number) => {
                this.removeResource(type, amount);
            })
        );
    }
    
    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }
    
    private addResource(type: string, amount: number): void {
        const current = this.resources.get(type) || 0;
        this.resources.set(type, current + amount);
        EventBus.emit(GameEvents.RESOURCE_CHANGED, type, current + amount);
    }
    
    private removeResource(type: string, amount: number): void {
        const current = this.resources.get(type) || 0;
        this.resources.set(type, Math.max(0, current - amount));
        EventBus.emit(GameEvents.RESOURCE_CHANGED, type, Math.max(0, current - amount));
    }
    
    public cleanup(): void {
        this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
        this.unsubscribeFunctions = [];
        this.resources.clear();
    }
}
```

### AFTER:
```typescript
import { BaseManager } from './BaseManager';
import { GameEvents } from '../utils/eventBus';

export class ResourceManager extends BaseManager {
    private static instance: ResourceManager;
    private resources: Map<string, number>;
    
    private constructor() {
        super(); // REQUIRED - Initialize BaseManager
        this.resources = new Map();
        
        // Setup listeners (auto-tracked)
        this.subscribe(GameEvents.RESOURCE_COLLECTED, (type: string, amount: number) => {
            this.addResource(type, amount);
        });
        
        this.subscribe(GameEvents.RESOURCE_SPENT, (type: string, amount: number) => {
            this.removeResource(type, amount);
        });
    }
    
    public static getInstance(): ResourceManager {
        if (!ResourceManager.instance) {
            ResourceManager.instance = new ResourceManager();
        }
        return ResourceManager.instance;
    }
    
    private addResource(type: string, amount: number): void {
        const current = this.resources.get(type) || 0;
        this.resources.set(type, current + amount);
        this.emit(GameEvents.RESOURCE_CHANGED, type, current + amount);
    }
    
    private removeResource(type: string, amount: number): void {
        const current = this.resources.get(type) || 0;
        this.resources.set(type, Math.max(0, current - amount));
        this.emit(GameEvents.RESOURCE_CHANGED, type, Math.max(0, current - amount));
    }
    
    public cleanup(): void {
        this.cleanupSubscriptions(); // One-line cleanup!
        this.resources.clear();
    }
}
```

### Line Count Savings: -12 lines

## Verification

After refactoring, verify:
- ✅ Manager still compiles (`npm run build`)
- ✅ All event listeners still work in game
- ✅ cleanup() properly unsubscribes (no memory leaks)
- ✅ No EventBus errors in console

## Managers to Refactor

Priority order (by EventBus usage):

1. ✅ **AudioManager** - DONE (example implementation)
2. ⬜ **ResourceManager** - High priority (~8 listeners)
3. ⬜ **PowerManager** - High priority (~6 listeners)
4. ⬜ **SpawnManager** - Medium priority (~4 listeners)
5. ⬜ **PathfindingManager** - Medium priority (~3 listeners)
6. ⬜ **BuildingManager** - Medium priority (~3 listeners)
7. ⬜ **EntityManager** - Medium priority (~2 listeners)
8. ⬜ **GameStateManager** - Low priority (singleton only, few listeners)
9. ⬜ **LevelLoader** - Low priority (singleton only)
10. ⬜ **InputManager** - Review needed (manual event handlers)

**Estimated Total Savings: ~100-120 lines across all managers**

## Testing Strategy

For each refactored manager:
1. Run full test suite: `npm test`
2. Manual gameplay test (at least 5 minutes)
3. Check browser console for EventBus errors
4. Verify cleanup on scene transitions

## Common Issues

### Issue: TypeScript Error "Cannot find name 'EventBus'"
**Fix:** You're using `EventBus.emit()` directly - replace with `this.emit()`

### Issue: TypeScript Error "Property 'unsubscribeFunctions' does not exist"
**Fix:** Remove all references to `unsubscribeFunctions` array - BaseManager handles it

### Issue: Events not firing
**Fix:** Make sure you called `super()` in constructor before subscribing

### Issue: Memory leak / events firing multiple times
**Fix:** Ensure `cleanup()` calls `this.cleanupSubscriptions()`
