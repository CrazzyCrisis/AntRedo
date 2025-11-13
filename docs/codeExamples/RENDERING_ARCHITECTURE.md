# Framebuffer Rendering System - Architecture

## Overview
A layer-based rendering system using p5.js framebuffers (createGraphics) for performance and flexibility.

## Key Concepts

### 1. Layers
Each layer renders to its own framebuffer, then composites in order:
- **BACKGROUND** (0) - Sky, distant terrain
- **GROUND** (1) - Floor tiles, grass
- **GROUND_DECORATIONS** (2) - Shadows, ground items
- **ENTITIES** (3) - Players, enemies, NPCs
- **ABOVE_ENTITIES** (4) - Tree tops, overhangs
- **UI** (5) - Health bars, menus
- **DEBUG** (6) - Collision boxes, grid

### 2. Dirty Flag System
Only redraw layers that changed:
- **Persistent layers** (background, tree tops) - rarely redraw
- **Dynamic layers** (entities) - redraw every frame
- **Event-driven** - redraw on state changes

### 3. Depth Sorting
Within entity layers, sort by Y-coordinate:
- Higher Y (further down screen) = closer to camera
- Draw in order: back to front
- Sprites naturally go behind trees/objects

### 4. Multi-Part Objects
Objects like trees split across layers:
- **Trunk** → GROUND layer (entities can go in front)
- **Foliage** → ABOVE_ENTITIES layer (always on top)

## EventBus Integration

### When to Use EventBus
**YES** - Use EventBus for:
- ✅ Game logic triggering render updates
- ✅ Cross-system communication (Model → View)
- ✅ Decoupling game state from rendering
- ✅ Optional listeners (debug overlay, particles)

**NO** - Don't use EventBus for:
- ❌ Renderer internal operations
- ❌ Every frame operations (too much overhead)
- ❌ Tight coupling scenarios (Camera ↔ Renderer)

### Recommended Pattern

**Direct References for Core Rendering:**
```typescript
class Renderer {
    private framebuffers: FramebufferManager; // Direct reference
    private camera?: Camera; // Direct reference
    
    setCamera(camera: Camera) {
        this.camera = camera; // Direct injection
    }
}
```

**EventBus for State Changes:**
```typescript
// Model emits when state changes
player.move(x, y) {
    this.x = x;
    this.y = y;
    EventBus.emit(GameEvents.ENTITY_MOVED, this.id, x, y);
}

// Renderer listens and marks layer dirty
EventBus.on(GameEvents.ENTITY_MOVED, () => {
    this.framebuffers.markDirty(RenderLayer.ENTITIES);
});
```

### Event Flow
```
[Player Model] 
    ↓ (move)
[EventBus.emit(ENTITY_MOVED)]
    ↓
[Renderer] → marks ENTITIES layer dirty
    ↓
[Next frame draw()]
    ↓
[Renderer.render()] → redraws dirty layers only
```

## MVC Pattern Application

### Model (Data)
```typescript
class Entity {
    x: number;
    y: number;
    // Emits events when state changes
}
```

### View (Rendering)
```typescript
class SpriteComponent implements Renderable {
    draw(ctx: p5.Graphics) {
        // Draws to framebuffer
    }
}
```

### Controller (Game Logic)
```typescript
class GameManager {
    update() {
        // Updates models
        // Models emit events
        // Renderer reacts automatically
    }
}
```

## Performance Benefits

1. **Static Layer Caching** - Background drawn once, reused
2. **Selective Redraws** - Only changed layers redraw
3. **GPU Acceleration** - Framebuffers use hardware
4. **Culling** - Only draw visible entities
5. **Dirty Flags** - Skip unchanged content

## Camera Integration

Camera transforms apply to framebuffers before drawing:
```typescript
// In Renderable.draw(ctx)
camera.applyTransform(ctx);
// Draw content
camera.resetTransform(ctx);
```

UI layer typically ignores camera (screen-space).

## Testing Strategy

1. **Unit Tests**
   - FramebufferManager dirty flags
   - Renderer registration/unregistration
   - Layer sorting logic
   - Camera visibility checks

2. **Integration Tests**
   - Entity movement → layer marked dirty
   - Camera movement → multiple layers marked dirty
   - Renderer.render() → correct composite

3. **Performance Tests**
   - 100+ entities rendering
   - Static layer cache effectiveness
   - Frame time with/without dirty flags
