# Ant Entity: Complete MVC Implementation

This document demonstrates the complete **Model-View-Controller** architecture for the Ant entity, showing how the three layers work together through the Factory Pattern.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      GAME CODE                              │
│  (Developer never touches rendering or events directly)     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │  AntFactory.create()
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                  CONTROLLER (Factory)                       │
│  - AntFactory: Bridges Model and View                       │
│  - Creates Ant model + SpriteComponent                      │
│  - Sets up EventBus listeners                               │
│  - Registers sprite with Renderer                           │
│  - Returns Model only (hides View)                          │
└────────┬───────────────────────────────┬────────────────────┘
         │                               │
         │ Creates                       │ Creates
         ↓                               ↓
┌──────────────────────┐      ┌──────────────────────────┐
│   MODEL (Data)       │      │   VIEW (Presentation)    │
│                      │      │                          │
│  Ant.ts              │      │  SpriteComponent.ts      │
│  - Position (x, y)   │      │  - sprite: p5.Image      │
│  - Faction ID        │      │  - position (x, y)       │
│  - 9 Components:     │      │  - layer: ENTITIES       │
│    • StateMachine    │      │  - depth: Y for sorting  │
│    • Pathfinding     │      │  - render(graphics)      │
│    • Health          │      │                          │
│    • Combat          │      │  Renderer.ts             │
│    • Inventory       │      │  - Layer management      │
│    • Vision          │      │  - Depth sorting         │
│    • AIBehavior      │      │  - Dirty flags           │
│    • AntJob          │      │  - Framebuffers          │
│    • Hunger          │      │                          │
│  - Methods:          │      │                          │
│    • setJob()        │      │                          │
│    • setAutonomous() │      │                          │
│    • isEnemy()       │      │                          │
│    • update()        │      │                          │
│    • destroy()       │      │                          │
└──────────────────────┘      └──────────────────────────┘
         │                               ↑
         │ Emits events                  │ Listens to events
         └──────────────┐    ┌───────────┘
                        ↓    ↓
                  ┌─────────────────┐
                  │   EventBus      │
                  │  (Communication) │
                  │                 │
                  │  • ENTITY_MOVED │
                  │  • ENTITY_DESTROYED │
                  │  • ANT_JOB_CHANGED │
                  │  • etc.         │
                  └─────────────────┘
```

---

## Usage Example

### Simple Usage (What Developers See)

```typescript
import { AntFactory } from './factories/AntFactory';
import { Renderer } from './rendering/Renderer';

// Setup
const renderer = new Renderer(p5Instance, 800, 600);
const antSprite = loadImage('assets/ant.png');

// CREATE ANT - One line, fully set up!
const ant = AntFactory.create(renderer, antSprite, 5, 10, 'player_faction');

// USE ANT - Pure model operations
ant.setJob(AntJobComponent.JOB_WARRIOR);
ant.setAutonomous(true);

// Update loop
ant.update(deltaTime); // Updates all 9 components

// Check state
if (ant.isWarrior()) {
    console.log('Warrior ant ready!');
}

// Rendering happens automatically - developer never touches it!
```

**That's it!** No rendering code needed. The Factory handles all View setup internally.

---

## What Happens Behind the Scenes

### 1. Factory Creation Process

```typescript
// When you call:
const ant = AntFactory.create(renderer, antSprite, 5, 10, 'player_faction');

// This happens internally:

// Step 1: Create Model
const ant = new Ant(5, 10, 'player_faction');
// ✅ Ant has all 9 components attached
// ✅ Default GATHERER job set
// ✅ Autonomous mode enabled

// Step 2: Create View
const spriteComponent = new SpriteComponent(
    antSprite,
    5,           // x position
    10,          // y position
    RenderLayer.ENTITIES,
    10,          // depth = Y for sorting
    32, 32,      // width, height
    -16, -16     // offset to center
);

// Step 3: Register with Renderer
const unregister = renderer.register(spriteComponent);
// ✅ Sprite now renders automatically on ENTITIES layer
// ✅ Sorted by depth (Y position)

// Step 4: Connect Model to View via EventBus
EventBus.on(GameEvents.ENTITY_MOVED, (id, newX, newY) => {
    if (id === ant.id) {
        spriteComponent.setPosition(newX, newY);
        spriteComponent.setDepth(newY); // Update sorting
        renderer.markLayerDirty(RenderLayer.ENTITIES);
    }
});

EventBus.once('ENTITY_DESTROYED', (id) => {
    if (id === ant.id) {
        unregister(); // Remove sprite
    }
});

// Step 5: Return Model Only
return ant; // Developer only sees this!
```

---

## Model Layer (Ant.ts)

### Responsibilities
- Store ant data (position, faction, components)
- Implement game logic (job management, autonomous mode)
- Emit events when state changes
- **Never touches rendering**

### Key Features

```typescript
export class Ant extends GameObject {
    private factionId: string;
    
    constructor(gridX: number, gridY: number, factionId: string) {
        super('ant', gridX, gridY);
        this.factionId = factionId;
        this.initializeComponents();
    }
    
    private initializeComponents(): void {
        // Attach all 9 components
        this.addComponent('StateMachine', new StateMachineComponent(EntityState.IDLE));
        this.addComponent('Pathfinding', new PathfindingComponent(2.0));
        this.addComponent('Health', new HealthComponent(100));
        this.addComponent('Combat', new CombatComponent(10, 2.5, 1000));
        this.addComponent('Inventory', new InventoryComponent(10));
        this.addComponent('Vision', new VisionComponent(8, 360));
        this.addComponent('AIBehavior', new AIBehaviorComponent(true));
        this.addComponent('AntJob', new AntJobComponent([1,1,1,1], AntJobComponent.JOB_GATHERER));
        this.addComponent('Hunger', new HungerComponent(100));
    }
    
    // Job Management
    setJob(jobType: number): void {
        const jobComponent = this.getComponent('AntJob') as AntJobComponent;
        jobComponent?.setJob(jobType);
        // EventBus emission handled by component
    }
    
    // AI Control
    setAutonomous(autonomous: boolean): void {
        const aiComponent = this.getComponent('AIBehavior') as AIBehaviorComponent;
        aiComponent?.setAutonomous(autonomous);
    }
    
    // Faction System
    isEnemy(other: Ant): boolean {
        return this.factionId !== other.getFactionId();
    }
    
    // Update all components
    update(deltaTime: number): void {
        super.update(deltaTime); // Updates all 9 components
    }
}
```

### Model Events Emitted

- `ANT_CREATED` - Ant spawned
- `ANT_JOB_CHANGED` - Job switched (Gatherer → Warrior, etc.)
- `AI_STATE_CHANGED` - Autonomous mode toggled
- `ENTITY_MOVED` - Position changed
- `ENTITY_DESTROYED` - Ant died/removed

---

## View Layer (SpriteComponent.ts + Renderer.ts)

### Responsibilities
- Display ant sprite on screen
- Handle sorting by depth (Y position)
- Listen to Model events and update visuals
- **Never modifies Model data**

### SpriteComponent

```typescript
export class SpriteComponent implements Renderable {
    public layer: RenderLayer;
    public depth: number;
    
    private sprite: any;
    private x: number;
    private y: number;
    
    // Updates sprite position (called by Factory event listener)
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    
    // Updates depth for proper sorting
    setDepth(depth: number): void {
        this.depth = depth;
    }
    
    // Renders to graphics context (called by Renderer)
    render(graphics: any): void {
        graphics.image(this.sprite, this.x, this.y, 32, 32);
    }
}
```

### Renderer System

```typescript
export class Renderer {
    private renderables: Map<RenderLayer, Renderable[]>;
    
    // Register sprite (returns unregister function)
    register(renderable: Renderable): () => void {
        this.renderables.get(renderable.layer)?.push(renderable);
        this.markLayerDirty(renderable.layer);
        
        return () => this.unregister(renderable);
    }
    
    // Render all layers with depth sorting
    render(): void {
        const layers = [BACKGROUND, GROUND, ENTITIES, UI, DEBUG];
        
        layers.forEach(layer => {
            if (this.isLayerDirty(layer)) {
                const renderables = this.renderables.get(layer);
                
                // Sort by depth (Y position for ENTITIES)
                renderables.sort((a, b) => a.depth - b.depth);
                
                // Clear framebuffer
                const framebuffer = this.getFramebuffer(layer);
                framebuffer.clear();
                
                // Render all sprites on this layer
                renderables.forEach(r => r.render(framebuffer));
                
                this.markLayerClean(layer);
            }
        });
        
        // Composite all layers to main canvas
        this.compositeLayers();
    }
}
```

### Layer System

- **7 Render Layers** with automatic depth sorting:
  1. `BACKGROUND` - Sky, background tiles
  2. `GROUND` - Terrain tiles
  3. `GROUND_DECORATIONS` - Grass, rocks, resources
  4. `ENTITIES` - **Ants render here** (sorted by Y)
  5. `ABOVE_ENTITIES` - Projectiles, effects
  6. `UI` - Buttons, menus
  7. `DEBUG` - Vision cones, hitboxes

- **Dirty Flag Optimization**:
  - Only redraws layers when they change
  - `markLayerDirty()` triggers redraw
  - Massive performance boost

---

## Controller Layer (AntFactory.ts)

### Responsibilities
- Create and wire up Model + View
- Set up EventBus communication
- Provide clean API for game code
- **Hide all rendering complexity**

### Complete Factory Code

```typescript
export class AntFactory {
    static create(
        renderer: Renderer,
        sprite: any,
        gridX: number,
        gridY: number,
        factionId: string,
        jobType: number = AntJobComponent.JOB_GATHERER
    ): Ant {
        // 1. CREATE MODEL
        const ant = new Ant(gridX, gridY, factionId);
        if (jobType !== AntJobComponent.JOB_GATHERER) {
            ant.setJob(jobType);
        }

        // 2. CREATE VIEW
        const spriteComponent = new SpriteComponent(
            sprite, gridX, gridY,
            RenderLayer.ENTITIES,
            gridY, // depth
            32, 32, -16, -16 // size and centering
        );

        // 3. REGISTER WITH RENDERER
        const unregister = renderer.register(spriteComponent);

        // 4. CONNECT MODEL → VIEW (Movement)
        const moveListener = EventBus.on(
            GameEvents.ENTITY_MOVED,
            (entityId: string, newX: number, newY: number) => {
                if (entityId === ant.id) {
                    spriteComponent.setPosition(newX, newY);
                    spriteComponent.setDepth(newY);
                    renderer.markLayerDirty(RenderLayer.ENTITIES);
                }
            }
        );

        // 5. CLEANUP ON DESTROY
        const destroyListener = EventBus.once('ENTITY_DESTROYED', (entityId: string) => {
            if (entityId === ant.id) {
                unregister();
                EventBus.off(GameEvents.ENTITY_MOVED, moveListener);
            }
        });

        // 6. MANUAL CLEANUP FUNCTION
        (ant as any)._cleanup = () => {
            unregister();
            EventBus.off(GameEvents.ENTITY_MOVED, moveListener);
            EventBus.off('ENTITY_DESTROYED', destroyListener);
        };

        // 7. RETURN MODEL ONLY
        return ant;
    }
}
```

### Factory Benefits

1. **Encapsulation**: Rendering details hidden from game code
2. **Reusability**: Create hundreds of ants with one line
3. **Maintainability**: Rendering changes don't affect game logic
4. **Testability**: Model and View tested independently
5. **Clean API**: Developers only see `create()` and Model methods

---

## EventBus Communication

### How Model and View Stay in Sync

```typescript
// MODEL emits state changes
class Ant {
    moveTo(x: number, y: number): void {
        this.gridX = x;
        this.gridY = y;
        
        // Emit event - Model doesn't know about View
        EventBus.emit(GameEvents.ENTITY_MOVED, this.id, x, y);
    }
}

// FACTORY listens and updates View
const moveListener = EventBus.on(
    GameEvents.ENTITY_MOVED,
    (entityId, newX, newY) => {
        if (entityId === ant.id) {
            spriteComponent.setPosition(newX, newY); // Update View
            renderer.markLayerDirty(RenderLayer.ENTITIES); // Trigger redraw
        }
    }
);

// Result: Model changes → Event → View updates automatically!
```

### Key Events

| Event | Emitted By | Listened By | Purpose |
|-------|-----------|-------------|---------|
| `ENTITY_MOVED` | Ant Model | Factory | Update sprite position |
| `ENTITY_DESTROYED` | Ant Model | Factory | Remove sprite, cleanup |
| `ANT_JOB_CHANGED` | AntJobComponent | Game Systems | Job switch logic |
| `AI_STATE_CHANGED` | AIBehaviorComponent | UI | Update controls |
| `HEALTH_CHANGED` | HealthComponent | UI | Update health bar |

---

## Complete Usage Scenarios

### Scenario 1: Create and Command Ant

```typescript
// Create warrior ant
const ant = AntFactory.create(renderer, sprite, 10, 15, 'player_faction', AntJobComponent.JOB_WARRIOR);

// Give commands
ant.setAutonomous(false); // Player control
ant.moveTo(20, 25); // Move ant
// ✅ Sprite updates automatically via ENTITY_MOVED event

// Switch to builder
ant.setJob(AntJobComponent.JOB_BUILDER);
// ✅ AntJobComponent emits ANT_JOB_CHANGED event

// Update every frame
function gameLoop() {
    ant.update(deltaTime); // Updates all 9 components
    renderer.render(); // Draws all sprites
}
```

### Scenario 2: Multiple Ants with Different Factions

```typescript
// Player faction
const playerAnt1 = AntFactory.create(renderer, sprite, 0, 0, 'player');
const playerAnt2 = AntFactory.create(renderer, sprite, 5, 5, 'player');

// Enemy faction
const enemyAnt1 = AntFactory.create(renderer, sprite, 50, 50, 'enemy');
const enemyAnt2 = AntFactory.create(renderer, sprite, 55, 55, 'enemy');

// Check if enemy
if (playerAnt1.isEnemy(enemyAnt1)) {
    console.log('Enemy detected!');
}

// All 4 ants render automatically, sorted by Y position
```

### Scenario 3: Cleanup and Removal

```typescript
const ant = AntFactory.create(renderer, sprite, 10, 10, 'player');

// Option 1: Destroy via model (triggers cleanup automatically)
ant.destroy();
// ✅ Emits ENTITY_DESTROYED event
// ✅ Factory listener removes sprite
// ✅ EventBus listeners cleaned up

// Option 2: Manual cleanup (before destroy)
(ant as any)._cleanup();
// ✅ Sprite removed from renderer
// ✅ Event listeners removed
// ✅ Model still exists (can destroy later)
```

---

## Testing the MVC Layers

### Model Tests (test/unit/ant.test.ts)

```typescript
describe('Ant Model', () => {
    it('should change job', () => {
        const ant = new Ant(0, 0, 'faction_1');
        ant.setJob(AntJobComponent.JOB_WARRIOR);
        
        const job = (ant.getComponent('AntJob') as AntJobComponent)?.getCurrentJob();
        expect(job).to.equal(AntJobComponent.JOB_WARRIOR);
    });
    
    // No rendering tests - pure data/logic testing
});
```

### View Tests (test/unit/spriteComponent.test.ts)

```typescript
describe('SpriteComponent', () => {
    it('should render sprite at position', () => {
        const sprite = new SpriteComponent(mockSprite, 10, 20, RenderLayer.ENTITIES, 20);
        
        sprite.render(mockGraphics);
        
        // Verify graphics.image() called with correct position
    });
    
    // No game logic tests - pure rendering testing
});
```

### Factory Tests (test/integration/antFactory.test.ts)

```typescript
describe('AntFactory', () => {
    it('should create ant with sprite', () => {
        const ant = AntFactory.create(renderer, sprite, 5, 10, 'faction_1');
        
        // Model exists
        expect(ant.gridX).to.equal(5);
        
        // Sprite registered
        const renderables = renderer.getRenderables(RenderLayer.ENTITIES);
        expect(renderables).to.have.lengthOf(1);
    });
    
    it('should update sprite on movement', () => {
        const ant = AntFactory.create(renderer, sprite, 5, 10, 'faction_1');
        
        EventBus.emit(GameEvents.ENTITY_MOVED, ant.id, 15, 20);
        
        const sprite = renderer.getRenderables(RenderLayer.ENTITIES)[0];
        expect(sprite.x).to.equal(15);
        expect(sprite.y).to.equal(20);
    });
    
    // Integration tests - verify Model + View work together
});
```

---

## Performance Considerations

### Dirty Flag System

```typescript
// Only redraw when needed
EventBus.emit(GameEvents.ENTITY_MOVED, ant.id, newX, newY);
// ↓
spriteComponent.setPosition(newX, newY);
renderer.markLayerDirty(RenderLayer.ENTITIES);
// ↓
// Next render() call redraws ENTITIES layer only
// Other layers (BACKGROUND, GROUND, UI) skip redraw
```

### Depth Sorting

```typescript
// Ants sort by Y position each frame
renderables.sort((a, b) => a.depth - b.depth);

// Ant at Y=10 renders before ant at Y=20
// Creates proper layering (ants behind trees, etc.)
```

### Multiple Ants

- 100+ ants: No problem (dirty flags optimize redraw)
- Each ant: Own sprite component
- Renderer: Batches all sprites per layer
- Sorting: O(n log n) per layer, only when dirty

---

## Summary

### MVC Benefits Demonstrated

✅ **Separation of Concerns**
- Model: Pure game logic (Ant.ts)
- View: Pure rendering (SpriteComponent.ts, Renderer.ts)
- Controller: Coordination (AntFactory.ts)

✅ **Clean API**
- Developers call `AntFactory.create()` - one line!
- No rendering code in game logic
- Easy to understand and use

✅ **Maintainability**
- Change rendering? Edit SpriteComponent only
- Change game logic? Edit Ant only
- Factory stays stable

✅ **Testability**
- Model tests: No rendering needed
- View tests: No game logic needed
- Factory tests: Integration verification

✅ **Scalability**
- Add new entities? Copy Factory pattern
- Add new components? Attach in Model
- Add new rendering features? Extend View

✅ **EventBus Communication**
- Loose coupling between layers
- Easy to add new listeners
- Clear event flow

---

## Next Steps

1. **Queen Entity**: Player-controlled with power system
2. **Boss Entity**: AI-controlled with patrol/chase
3. **Resource Entity**: Gatherable resources
4. **Building Entity**: Constructible structures
5. **Projectile Entity**: Homing/straight projectiles

**All follow the same MVC + Factory pattern!**
