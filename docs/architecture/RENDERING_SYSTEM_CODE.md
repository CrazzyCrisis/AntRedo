# Framebuffer Rendering System - Code Snippets

## Table of Contents
1. [RenderLayer Enum](#renderlayer-enum)
2. [Interfaces](#interfaces)
3. [FramebufferManager](#framebuffermanager)
4. [Renderer](#renderer)
5. [Camera](#camera)
6. [Renderable Components](#renderable-components)
7. [EventBus Integration](#eventbus-integration)
8. [Usage Examples](#usage-examples)

---

## RenderLayer Enum

```typescript
// src/rendering/RenderLayer.ts
export enum RenderLayer {
    BACKGROUND = 0,
    GROUND = 1,
    GROUND_DECORATIONS = 2,
    ENTITIES = 3,
    ABOVE_ENTITIES = 4,
    UI = 5,
    DEBUG = 6
}

export interface LayerConfig {
    layer: RenderLayer;
    needsRedraw: boolean;
    persistent: boolean;
    alpha?: number;
    blend?: BLEND | DARKEST | LIGHTEST | DIFFERENCE | MULTIPLY | EXCLUSION | SCREEN | REPLACE | OVERLAY | HARD_LIGHT | SOFT_LIGHT | DODGE | BURN | ADD | REMOVE | SUBTRACT;
}
```

---

## Interfaces

```typescript
// src/rendering/Renderable.ts
import { RenderLayer } from './RenderLayer';

export interface Renderable {
    layer: RenderLayer;
    getDepth(): number;
    draw(ctx: p5.Graphics): void;
    isVisible(): boolean;
}
```

---

## FramebufferManager

```typescript
// src/rendering/FramebufferManager.ts
import { RenderLayer, LayerConfig } from './RenderLayer';

declare const createGraphics: any;
declare const BLEND: any;
declare const image: any;
declare const tint: any;
declare const blendMode: any;
declare const push: any;
declare const pop: any;
declare const clear: any;

export class FramebufferManager {
    private buffers: Map<RenderLayer, any> = new Map();
    private layerConfigs: Map<RenderLayer, LayerConfig> = new Map();
    private width: number;
    private height: number;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.initializeBuffers();
    }
    
    private initializeBuffers(): void {
        for (let layer = RenderLayer.BACKGROUND; layer <= RenderLayer.DEBUG; layer++) {
            const buffer = createGraphics(this.width, this.height);
            this.buffers.set(layer, buffer);
            
            this.layerConfigs.set(layer, {
                layer,
                needsRedraw: true,
                persistent: this.isPersistentLayer(layer),
                alpha: 255,
                blend: BLEND
            });
        }
    }
    
    private isPersistentLayer(layer: RenderLayer): boolean {
        return layer === RenderLayer.BACKGROUND || 
               layer === RenderLayer.ABOVE_ENTITIES;
    }
    
    getBuffer(layer: RenderLayer): any {
        return this.buffers.get(layer);
    }
    
    markDirty(layer: RenderLayer): void {
        const config = this.layerConfigs.get(layer);
        if (config) {
            config.needsRedraw = true;
        }
    }
    
    needsRedraw(layer: RenderLayer): boolean {
        const config = this.layerConfigs.get(layer);
        return config ? config.needsRedraw : true;
    }
    
    clearDirty(layer: RenderLayer): void {
        const config = this.layerConfigs.get(layer);
        if (config && !config.persistent) {
            config.needsRedraw = false;
        }
    }
    
    setLayerAlpha(layer: RenderLayer, alpha: number): void {
        const config = this.layerConfigs.get(layer);
        if (config) {
            config.alpha = alpha;
            this.markDirty(layer);
        }
    }
    
    setBlendMode(layer: RenderLayer, mode: any): void {
        const config = this.layerConfigs.get(layer);
        if (config) {
            config.blend = mode;
            this.markDirty(layer);
        }
    }
    
    composite(): void {
        clear();
        
        for (let layer = RenderLayer.BACKGROUND; layer <= RenderLayer.DEBUG; layer++) {
            const buffer = this.buffers.get(layer);
            const config = this.layerConfigs.get(layer);
            
            if (!buffer || !config) continue;
            
            push();
            tint(255, config.alpha);
            blendMode(config.blend);
            image(buffer, 0, 0);
            pop();
        }
    }
    
    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        
        this.buffers.forEach((buffer, layer) => {
            buffer.remove();
            const newBuffer = createGraphics(width, height);
            this.buffers.set(layer, newBuffer);
            this.markDirty(layer);
        });
    }
    
    clear(layer?: RenderLayer): void {
        if (layer !== undefined) {
            const buffer = this.buffers.get(layer);
            if (buffer) {
                buffer.clear();
                this.markDirty(layer);
            }
        } else {
            this.buffers.forEach(buffer => buffer.clear());
        }
    }
}
```

---

## Renderer

```typescript
// src/rendering/Renderer.ts
import { EventBus, GameEvents } from '../utils/eventBus';
import { RenderLayer } from './RenderLayer';
import { FramebufferManager } from './FramebufferManager';
import { Renderable } from './Renderable';
import { Camera } from './Camera';

export class Renderer {
    private renderables: Map<RenderLayer, Renderable[]> = new Map();
    private framebuffers: FramebufferManager;
    private camera?: Camera;
    
    constructor(width: number, height: number) {
        this.framebuffers = new FramebufferManager(width, height);
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        EventBus.on(GameEvents.ENTITY_MOVED, () => {
            this.framebuffers.markDirty(RenderLayer.ENTITIES);
        });
        
        EventBus.on('tile:changed', () => {
            this.framebuffers.markDirty(RenderLayer.GROUND);
        });
        
        EventBus.on('camera:moved', () => {
            for (let layer = RenderLayer.BACKGROUND; layer <= RenderLayer.ABOVE_ENTITIES; layer++) {
                this.framebuffers.markDirty(layer);
            }
        });
    }
    
    register(renderable: Renderable): () => void {
        const layer = renderable.layer;
        if (!this.renderables.has(layer)) {
            this.renderables.set(layer, []);
        }
        
        this.renderables.get(layer)!.push(renderable);
        this.framebuffers.markDirty(layer);
        
        return () => this.unregister(renderable);
    }
    
    unregister(renderable: Renderable): void {
        const layer = renderable.layer;
        const items = this.renderables.get(layer);
        if (items) {
            const index = items.indexOf(renderable);
            if (index > -1) {
                items.splice(index, 1);
                this.framebuffers.markDirty(layer);
            }
        }
    }
    
    render(): void {
        for (let layer = RenderLayer.BACKGROUND; layer <= RenderLayer.DEBUG; layer++) {
            if (!this.framebuffers.needsRedraw(layer)) {
                continue;
            }
            
            const buffer = this.framebuffers.getBuffer(layer);
            const items = this.renderables.get(layer) || [];
            
            buffer.clear();
            
            if (layer === RenderLayer.ENTITIES || layer === RenderLayer.ABOVE_ENTITIES) {
                items.sort((a, b) => a.getDepth() - b.getDepth());
            }
            
            if (this.camera && layer !== RenderLayer.UI && layer !== RenderLayer.DEBUG) {
                this.camera.applyTransform(buffer);
            }
            
            items.forEach(item => {
                if (item.isVisible()) {
                    item.draw(buffer);
                }
            });
            
            if (this.camera && layer !== RenderLayer.UI && layer !== RenderLayer.DEBUG) {
                this.camera.resetTransform(buffer);
            }
            
            this.framebuffers.clearDirty(layer);
        }
        
        this.framebuffers.composite();
    }
    
    setCamera(camera: Camera): void {
        this.camera = camera;
    }
    
    setLayerAlpha(layer: RenderLayer, alpha: number): void {
        this.framebuffers.setLayerAlpha(layer, alpha);
    }
    
    setLayerBlendMode(layer: RenderLayer, mode: any): void {
        this.framebuffers.setBlendMode(layer, mode);
    }
    
    clear(layer?: RenderLayer): void {
        if (layer !== undefined) {
            this.renderables.delete(layer);
        } else {
            this.renderables.clear();
        }
        this.framebuffers.clear(layer);
    }
}
```

---

## Camera

```typescript
// src/rendering/Camera.ts
import { EventBus } from '../utils/eventBus';
import { pointInRect } from '../utils/helpers';

export class Camera {
    x: number = 0;
    y: number = 0;
    width: number;
    height: number;
    zoom: number = 1;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
    
    follow(target: { x: number; y: number }, lerpAmount: number = 0.1): void {
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;
        
        const oldX = this.x;
        const oldY = this.y;
        
        this.x += (targetX - this.x) * lerpAmount;
        this.y += (targetY - this.y) * lerpAmount;
        
        if (Math.abs(oldX - this.x) > 0.1 || Math.abs(oldY - this.y) > 0.1) {
            EventBus.emit('camera:moved', this.x, this.y);
        }
    }
    
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        EventBus.emit('camera:moved', this.x, this.y);
    }
    
    applyTransform(ctx: any): void {
        ctx.push();
        ctx.translate(-this.x, -this.y);
        ctx.scale(this.zoom);
    }
    
    resetTransform(ctx: any): void {
        ctx.pop();
    }
    
    isVisible(x: number, y: number, w: number = 0, h: number = 0): boolean {
        return pointInRect(
            x, y,
            this.x, this.y,
            this.width, this.height
        );
    }
    
    screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
    
    worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
}
```

---

## Renderable Components

```typescript
// src/rendering/components/SpriteComponent.ts
import { Renderable } from '../Renderable';
import { RenderLayer } from '../RenderLayer';

export class SpriteComponent implements Renderable {
    constructor(
        private entity: { x: number; y: number; width?: number; height?: number },
        private sprite: any,
        public layer: RenderLayer = RenderLayer.ENTITIES
    ) {}
    
    getDepth(): number {
        return this.entity.y;
    }
    
    draw(ctx: any): void {
        const w = this.entity.width || this.sprite.width;
        const h = this.entity.height || this.sprite.height;
        ctx.image(this.sprite, this.entity.x, this.entity.y, w, h);
    }
    
    isVisible(): boolean {
        return true; // Add camera culling later
    }
}

// src/rendering/components/TreeComponent.ts
export class TreeComponent {
    private baseRenderable: Renderable;
    private topRenderable: Renderable;
    
    constructor(
        private tree: { x: number; y: number },
        private trunkSprite: any,
        private foliageSprite: any
    ) {
        this.baseRenderable = {
            layer: RenderLayer.GROUND,
            getDepth: () => this.tree.y,
            draw: (ctx) => ctx.image(this.trunkSprite, this.tree.x, this.tree.y),
            isVisible: () => true
        };
        
        this.topRenderable = {
            layer: RenderLayer.ABOVE_ENTITIES,
            getDepth: () => this.tree.y,
            draw: (ctx) => ctx.image(this.foliageSprite, this.tree.x, this.tree.y - 20),
            isVisible: () => true
        };
    }
    
    getBaseRenderable(): Renderable {
        return this.baseRenderable;
    }
    
    getTopRenderable(): Renderable {
        return this.topRenderable;
    }
}
```

---

## EventBus Integration

```typescript
// Add to GameEvents in eventBus.ts
export const GameEvents = {
    // ... existing events ...
    
    // Rendering events
    ENTITY_MOVED: 'entity:moved',
    TILE_CHANGED: 'tile:changed',
    CAMERA_MOVED: 'camera:moved',
    UI_UPDATE: 'ui:update',
    LAYER_CHANGED: 'layer:changed'
};

// In your Entity/Model classes
class Entity {
    move(x: number, y: number): void {
        this.x = x;
        this.y = y;
        EventBus.emit(GameEvents.ENTITY_MOVED, this);
    }
}

// In your Tile/World classes
class World {
    setTile(col: number, row: number, tileType: string): void {
        this.tiles[col][row] = tileType;
        EventBus.emit('tile:changed', col, row);
    }
}
```

---

## Usage Examples

```typescript
// src/sketch.ts
import { CONFIG } from './config';
import { Renderer } from './rendering/Renderer';
import { Camera } from './rendering/Camera';
import { SpriteComponent } from './rendering/components/SpriteComponent';
import { RenderLayer } from './rendering/RenderLayer';

let renderer: Renderer;
let camera: Camera;
let player: any;

function setup() {
    createCanvas(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    
    // Initialize rendering system
    renderer = new Renderer(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    camera = new Camera(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    renderer.setCamera(camera);
    
    // Create player
    player = { x: 400, y: 300, width: 32, height: 32 };
    
    // Register player sprite
    const playerSprite = loadImage('assets/player.png');
    const playerComponent = new SpriteComponent(player, playerSprite, RenderLayer.ENTITIES);
    renderer.register(playerComponent);
    
    // Register background
    // Register ground tiles
    // Register trees, etc.
}

function draw() {
    // Update camera to follow player
    camera.follow(player, 0.1);
    
    // Render everything
    renderer.render();
}

// Player movement triggers events automatically
function keyPressed() {
    if (keyCode === 37) { // LEFT
        player.x -= 5;
        EventBus.emit(GameEvents.ENTITY_MOVED);
    }
    // etc.
}
```

---

## Debug Visualization

```typescript
// Show layer framebuffers for debugging
function showLayerDebug() {
    const layers = [
        RenderLayer.BACKGROUND,
        RenderLayer.GROUND,
        RenderLayer.ENTITIES
    ];
    
    layers.forEach((layer, index) => {
        const buffer = framebufferManager.getBuffer(layer);
        image(buffer, index * 200, 0, 200, 150);
    });
}
```
