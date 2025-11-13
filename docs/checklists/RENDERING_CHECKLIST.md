# Framebuffer Rendering System - Implementation Checklist

## Phase 1: Core Rendering Infrastructure
- [ ] Create `RenderLayer` enum with 7 layers (background → debug)
- [ ] Create `LayerConfig` interface for layer properties
- [ ] Implement `Renderable` interface for drawable objects
- [ ] Create `FramebufferManager` class
  - [ ] Initialize framebuffers for each layer
  - [ ] Implement dirty flag system
  - [ ] Add layer alpha/blend mode controls
  - [ ] Implement `composite()` method
  - [ ] Add resize handling

## Phase 2: Renderer System
- [ ] Create `Renderer` class
  - [ ] Register/unregister renderables by layer
  - [ ] Implement depth sorting for entity layers
  - [ ] Add visibility culling
  - [ ] Connect to FramebufferManager
  - [ ] Implement selective layer redraws

## Phase 3: Camera System
- [ ] Create `Camera` class
  - [ ] Implement viewport bounds
  - [ ] Add smooth follow/lerp
  - [ ] Implement transform application to framebuffers
  - [ ] Add visibility checking

## Phase 4: Renderable Components
- [ ] Create `SpriteComponent` for basic sprites
- [ ] Create multi-part components (e.g., `TreeComponent`)
  - [ ] Base/trunk on GROUND layer
  - [ ] Top/foliage on ABOVE_ENTITIES layer
- [ ] Implement component draw methods with framebuffer context

## Phase 5: EventBus Integration
- [ ] Add rendering events to `GameEvents`
  - [ ] `ENTITY_MOVED` → mark ENTITIES layer dirty
  - [ ] `TILE_CHANGED` → mark GROUND layer dirty
  - [ ] `CAMERA_MOVED` → mark world layers dirty
  - [ ] `UI_UPDATE` → mark UI layer dirty
- [ ] Set up Renderer event listeners
- [ ] Emit events from game entities when state changes

## Phase 6: Integration & Testing
- [ ] Update `sketch.ts` to use new Renderer
- [ ] Initialize framebuffers in `setup()`
- [ ] Call `renderer.render()` in `draw()`
- [ ] Write unit tests for Renderer
- [ ] Write unit tests for FramebufferManager
- [ ] Write unit tests for Camera
- [ ] Performance test with 100+ entities

## Phase 7: Advanced Features (Optional)
- [ ] Add parallax scrolling for background layers
- [ ] Implement layer effects (blur, tint, filter)
- [ ] Add day/night cycle with layer alpha transitions
- [ ] Implement screen shake effect
- [ ] Add layer debug visualization (show framebuffers)

---

## Implementation Order
1. Start with Phase 1 (infrastructure)
2. Move to Phase 2 (basic rendering)
3. Add Phase 3 (camera) before Phase 4
4. Implement Phase 4 (components)
5. Connect Phase 5 (EventBus) throughout
6. Complete Phase 6 (testing)
7. Phase 7 as needed

## Reference Files
- Code snippets: `RENDERING_SYSTEM_CODE.md`
- Architecture notes: `RENDERING_ARCHITECTURE.md`
