# Factory Pattern for Entity Creation

## Overview
Factory classes abstract away rendering complexity, allowing developers to create game entities with a simple API like `PlayerFactory.create()` while all rendering setup happens automatically behind the scenes.

## Goals
- ✅ Simple API for developers: `const player = PlayerFactory.create(x, y)`
- ✅ Rendering handled automatically - no manual Renderer calls
- ✅ MVC separation maintained - Model returned, View registered internally
- ✅ Easy to extend - add new entity types with same pattern

## Pattern Structure

### 1. Entity Model (Pure Data)
```typescript
// src/classes/Player.ts
import { EventBus, GameEvents } from '../utils/eventBus';

export class Player {
    x: number;
    y: number;
    width: number = 32;
    height: number = 32;
    velocity: { x: number; y: number } = { x: 0, y: 0 };
    health: number = 100;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    
    move(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
        EventBus.emit(GameEvents.ENTITY_MOVED, this);
    }
    
    takeDamage(amount: number): void {
        this.health -= amount;
        EventBus.emit(GameEvents.PLAYER_DAMAGE, amount, this.health);
        
        if (this.health <= 0) {
            EventBus.emit(GameEvents.PLAYER_DEATH, this);
        }
    }
}
```

### 2. Factory Class (Hides Rendering)
```typescript
// src/factories/PlayerFactory.ts
import { Player } from '../classes/Player';
import { SpriteComponent } from '../rendering/components/SpriteComponent';
import { RenderLayer } from '../rendering/RenderLayer';
import { Renderer } from '../rendering/Renderer';

export class PlayerFactory {
    private static renderer: Renderer;
    
    static initialize(renderer: Renderer): void {
        this.renderer = renderer;
    }
    
    static create(x: number, y: number, sprite?: any): Player {
        // Create the model
        const player = new Player(x, y);
        
        // Create rendering component (hidden from developer)
        const spriteComponent = new SpriteComponent(
            player,
            sprite || this.getDefaultSprite(),
            RenderLayer.ENTITIES
        );
        
        // Register with renderer (automatic)
        this.renderer.register(spriteComponent);
        
        // Only return the model
        return player;
    }
    
    private static getDefaultSprite(): any {
        // Load or return cached sprite
        // Implementation depends on asset loading system
        return null; // Placeholder
    }
}
```

### 3. Multi-Layer Entities (Trees, Buildings)
```typescript
// src/factories/TreeFactory.ts
import { Tree } from '../classes/Tree';
import { TreeComponent } from '../rendering/components/TreeComponent';
import { Renderer } from '../rendering/Renderer';

export class TreeFactory {
    private static renderer: Renderer;
    
    static initialize(renderer: Renderer): void {
        this.renderer = renderer;
    }
    
    static create(x: number, y: number, treeType: string = 'oak'): Tree {
        const tree = new Tree(x, y, treeType);
        
        // TreeComponent internally creates two renderables:
        // - Base (trunk) on GROUND layer
        // - Top (foliage) on ABOVE_ENTITIES layer
        const treeComponent = new TreeComponent(
            tree,
            this.getTrunkSprite(treeType),
            this.getFoliageSprite(treeType)
        );
        
        // Register both parts (hidden from developer)
        this.renderer.register(treeComponent.getBaseRenderable());
        this.renderer.register(treeComponent.getTopRenderable());
        
        return tree;
    }
    
    private static getTrunkSprite(type: string): any {
        // Sprite loading logic
        return null;
    }
    
    private static getFoliageSprite(type: string): any {
        // Sprite loading logic
        return null;
    }
}
```

## Usage Pattern

### Developer Experience
```typescript
// src/sketch.ts or game manager
import { PlayerFactory } from './factories/PlayerFactory';
import { TreeFactory } from './factories/TreeFactory';
import { EnemyFactory } from './factories/EnemyFactory';

// Initialize factories once
function setup() {
    const renderer = new Renderer(800, 600);
    
    // Initialize all factories with renderer
    PlayerFactory.initialize(renderer);
    TreeFactory.initialize(renderer);
    EnemyFactory.initialize(renderer);
    
    // Now create entities easily - rendering handled automatically!
    const player = PlayerFactory.create(400, 300);
    const tree = TreeFactory.create(500, 200, 'oak');
    const enemy = EnemyFactory.create(600, 400, 'ant');
    
    // Developers only work with models
    player.move(10, 0);
    enemy.followTarget(player);
    
    // Rendering happens automatically via EventBus + Renderer
}
```

## Benefits

### For Developers
1. **Simple API** - Just call `Factory.create()`
2. **No rendering knowledge needed** - Focus on game logic
3. **Consistent pattern** - Same for all entity types
4. **Type-safe** - Returns properly typed model

### For the Codebase
1. **MVC maintained** - Models don't know about rendering
2. **Single responsibility** - Each class has one job
3. **Easy to test** - Mock factories in tests
4. **Centralized** - All rendering setup in one place per entity type

## Factory Registry Pattern (Advanced)

For managing many entities automatically:

```typescript
// src/factories/EntityRegistry.ts
export class EntityRegistry {
    private static entities: Map<string, any> = new Map();
    private static unsubscribers: Map<string, () => void> = new Map();
    
    static register(id: string, entity: any, unregister: () => void): void {
        this.entities.set(id, entity);
        this.unsubscribers.set(id, unregister);
    }
    
    static remove(id: string): void {
        const unsub = this.unsubscribers.get(id);
        if (unsub) {
            unsub(); // Unregister from renderer
        }
        this.entities.delete(id);
        this.unsubscribers.delete(id);
    }
    
    static get(id: string): any {
        return this.entities.get(id);
    }
    
    static clear(): void {
        this.unsubscribers.forEach(unsub => unsub());
        this.entities.clear();
        this.unsubscribers.clear();
    }
}
```

Enhanced factory with auto-registration:

```typescript
export class PlayerFactory {
    static create(x: number, y: number, id?: string): Player {
        const player = new Player(x, y);
        const spriteComponent = new SpriteComponent(player, sprite, RenderLayer.ENTITIES);
        
        // Register returns unsubscribe function
        const unregister = this.renderer.register(spriteComponent);
        
        // Auto-register with entity registry
        const entityId = id || `player_${Date.now()}`;
        EntityRegistry.register(entityId, player, unregister);
        
        return player;
    }
}
```

## Testing Factories

```typescript
// test/factories/PlayerFactory.test.ts
describe('PlayerFactory', () => {
    let mockRenderer: any;
    
    beforeEach(() => {
        mockRenderer = {
            register: sinon.stub().returns(() => {}) // Returns mock unsubscribe
        };
        PlayerFactory.initialize(mockRenderer);
    });
    
    it('should create player with correct position', () => {
        const player = PlayerFactory.create(100, 200);
        expect(player.x).to.equal(100);
        expect(player.y).to.equal(200);
    });
    
    it('should register sprite component with renderer', () => {
        PlayerFactory.create(100, 200);
        expect(mockRenderer.register.calledOnce).to.be.true;
    });
    
    it('should return player model only', () => {
        const player = PlayerFactory.create(100, 200);
        expect(player).to.be.instanceOf(Player);
    });
});
```

## Summary

The Factory Pattern achieves your goal:
- ✅ **Simple API**: `const player = PlayerFactory.create(x, y)`
- ✅ **Automatic rendering**: All complexity hidden in factory
- ✅ **MVC compliant**: Models returned, views handled internally
- ✅ **Easy to develop**: Other devs never touch Renderer directly
- ✅ **EventBus integrated**: Models emit events, rendering reacts automatically
