import { expect } from 'chai';
import { QueenFactory } from '../../src/factories/QueenFactory';
import { Queen } from '../../src/classes/Queen';
import { Renderer } from '../../src/rendering/Renderer';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { EventBus, GameEvents } from '../../src/utils/eventBus';

describe('QueenFactory', () => {
    let renderer: Renderer;
    let mockP5: any;
    let mockSprite: any;

    beforeEach(() => {
        EventBus.clear();

        // Create mock p5 instance
        mockP5 = {
            createGraphics: () => ({
                clear: () => {},
                image: () => {},
                push: () => {},
                pop: () => {},
                translate: () => {},
                rotate: () => {},
                scale: () => {},
                tint: () => {},
                noTint: () => {}
            })
        };

        // Create mock sprite
        mockSprite = {
            width: 32,
            height: 32
        };

        renderer = new Renderer(mockP5, 800, 600);
    });

    afterEach(() => {
        EventBus.clear();
        QueenFactory.clearAll(); // Clear singleton state
    });

    describe('Factory Creation', () => {
        it('should create queen at specified position', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            expect(queen).to.be.instanceOf(Queen);
            expect(queen.gridX).to.equal(10);
            expect(queen.gridY).to.equal(15);
        });

        it('should create queen with faction ID', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 5, 5, 'player');

            expect(queen.getFactionId()).to.equal('player');
        });

        it('should create player-controlled queen by default', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 5, 5, 'player');

            expect(queen.isPlayerControlled()).to.be.true;
        });

        it('should initialize powers map', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 5, 5, 'player');

            const powers = queen.getPowers();
            expect(powers.size).to.be.greaterThan(0);
        });

        it('should emit CAMERA_FOLLOW_ENTITY event', (done) => {
            EventBus.once(GameEvents.CAMERA_FOLLOW_ENTITY, (entityId: string) => {
                expect(entityId).to.include('queen_');
                done();
            });

            QueenFactory.create(renderer, mockSprite, 5, 5, 'player');
        });
    });

    describe('Rendering Integration', () => {
        it('should register sprite with renderer', () => {
            QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            // Verify renderer has renderable on ENTITIES layer
            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);
        });

        it('should render on ENTITIES layer', () => {
            QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);
        });

        it('should update sprite position on ENTITY_MOVED', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            // Emit move event
            EventBus.emit('ENTITY_MOVED', queen.id, 20, 25);

            // Get sprite component
            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            const spriteComponent = renderables[0];

            // Should update position
            expect(spriteComponent.x).to.equal(20);
            expect(spriteComponent.y).to.equal(25);
            expect(spriteComponent.depth).to.equal(25); // Depth updates with Y
        });

        it('should update depth on ENTITY_MOVED', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            const sprite = renderables[0];
            const initialDepth = sprite.depth;

            // Move to different Y position
            EventBus.emit('ENTITY_MOVED', queen.id, 10, 30);

            const newDepth = sprite.depth;
            expect(newDepth).to.not.equal(initialDepth);
            expect(newDepth).to.equal(30);
        });

        it('should ignore ENTITY_MOVED from other entities', () => {
            QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            const sprite = renderables[0];

            // Store initial position
            const initialX = sprite.x;
            const initialY = sprite.y;

            // Emit move event for different entity
            EventBus.emit('ENTITY_MOVED', 'other_entity_123', 20, 25);

            // Position should not change
            expect(sprite.x).to.equal(initialX);
            expect(sprite.y).to.equal(initialY);
        });
    });

    describe('Cleanup', () => {
        it('should unregister sprite on queen death', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');
            
            let renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);

            // Trigger queen death
            EventBus.emit('ENTITY_DIED', queen.id);

            renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(0);
        });

        it('should cleanup on ENTITY_DESTROYED', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');
            
            let renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);

            queen.destroy();

            renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(0);
        });

        it('should have cleanup method attached', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            expect((queen as any)._cleanup).to.be.a('function');
        });

        it('should cleanup when calling _cleanup', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');
            
            let renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(1);

            (queen as any)._cleanup();

            renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(0);
        });
    });

    describe('Multiple Queens (Different Factions)', () => {
        it('should create queens for different factions independently', () => {
            const queen1 = QueenFactory.create(renderer, mockSprite, 10, 10, 'player');
            const queen2 = QueenFactory.create(renderer, mockSprite, 20, 20, 'enemy');

            expect(queen1.id).to.not.equal(queen2.id);
            expect(queen1.getFactionId()).to.equal('player');
            expect(queen2.getFactionId()).to.equal('enemy');
        });

        it('should register each queen sprite separately', () => {
            QueenFactory.create(renderer, mockSprite, 10, 10, 'player');
            QueenFactory.create(renderer, mockSprite, 20, 20, 'enemy');

            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            expect(renderables).to.have.lengthOf(2);
        });

        it('should handle movement of multiple queens independently', () => {
            const queen1 = QueenFactory.create(renderer, mockSprite, 10, 10, 'player');
            QueenFactory.create(renderer, mockSprite, 20, 20, 'enemy');

            const renderables = (renderer as any).renderables.get(RenderLayer.ENTITIES);
            const sprite1 = renderables[0];
            const sprite2 = renderables[1];

            // Move only queen1
            EventBus.emit('ENTITY_MOVED', queen1.id, 15, 15);

            // Only sprite1 should update
            expect(sprite1.x).to.equal(15);
            expect(sprite1.y).to.equal(15);
            // sprite2 should remain at original position
            expect(sprite2.x).to.equal(20);
            expect(sprite2.y).to.equal(20);
        });
    });

    describe('Component Integration', () => {
        it('should create queen with pathfinding component', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            expect(queen.getComponent('Pathfinding')).to.exist;
        });

        it('should create queen with health component', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            expect(queen.getComponent('Health')).to.exist;
        });

        it('should create queen with combat component', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 10, 15, 'player');

            expect(queen.getComponent('Combat')).to.exist;
        });
    });

    describe('Edge Cases', () => {
        it('should handle queen at grid origin', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 0, 0, 'player');

            expect(queen.gridX).to.equal(0);
            expect(queen.gridY).to.equal(0);
        });

        it('should handle negative grid positions', () => {
            const queen = QueenFactory.create(renderer, mockSprite, -5, -10, 'faction_1');

            expect(queen.gridX).to.equal(-5);
            expect(queen.gridY).to.equal(-10);
        });

        it('should handle very large grid positions', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 1000, 1000, 'faction_2');

            expect(queen.gridX).to.equal(1000);
            expect(queen.gridY).to.equal(1000);
        });

        it('should handle empty faction ID', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 5, 5, '');

            expect(queen.getFactionId()).to.equal('');
        });
    });

    describe('Singleton Pattern', () => {
        it('should enforce only one Queen per faction', () => {
            QueenFactory.create(renderer, mockSprite, 0, 0, 'player');

            // Attempt to create second Queen for same faction
            expect(() => {
                QueenFactory.create(renderer, mockSprite, 10, 10, 'player');
            }).to.throw('Queen already exists for faction \'player\'');
        });

        it('should allow multiple Queens for different factions', () => {
            const queen1 = QueenFactory.create(renderer, mockSprite, 0, 0, 'faction_1');
            const queen2 = QueenFactory.create(renderer, mockSprite, 50, 50, 'faction_2');

            expect(queen1.getFactionId()).to.equal('faction_1');
            expect(queen2.getFactionId()).to.equal('faction_2');
        });

        it('should get active Queen by faction', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 0, 0, 'player');

            const retrieved = QueenFactory.getQueen('player');
            expect(retrieved).to.equal(queen);
        });

        it('should return undefined for non-existent faction', () => {
            const retrieved = QueenFactory.getQueen('nonexistent');
            expect(retrieved).to.be.undefined;
        });

        it('should check if Queen exists for faction', () => {
            QueenFactory.create(renderer, mockSprite, 0, 0, 'player');

            expect(QueenFactory.hasQueen('player')).to.be.true;
            expect(QueenFactory.hasQueen('enemy')).to.be.false;
        });

        it('should get all active Queens', () => {
            const queen1 = QueenFactory.create(renderer, mockSprite, 0, 0, 'faction_1');
            const queen2 = QueenFactory.create(renderer, mockSprite, 50, 50, 'faction_2');

            const allQueens = QueenFactory.getAllQueens();
            expect(allQueens).to.have.lengthOf(2);
            expect(allQueens).to.include(queen1);
            expect(allQueens).to.include(queen2);
        });

        it('should remove Queen from active list on death', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 0, 0, 'player');

            expect(QueenFactory.hasQueen('player')).to.be.true;

            // Simulate death
            EventBus.emit('ENTITY_DIED', queen.id, 'queen');

            expect(QueenFactory.hasQueen('player')).to.be.false;
        });

        it('should remove Queen from active list on destroy', () => {
            const queen = QueenFactory.create(renderer, mockSprite, 0, 0, 'player');

            expect(QueenFactory.hasQueen('player')).to.be.true;

            queen.destroy();

            expect(QueenFactory.hasQueen('player')).to.be.false;
        });

        it('should allow creating new Queen after previous one dies', () => {
            const queen1 = QueenFactory.create(renderer, mockSprite, 0, 0, 'player');
            queen1.destroy();

            // Should not throw
            const queen2 = QueenFactory.create(renderer, mockSprite, 10, 10, 'player');
            expect(queen2).to.exist;
            expect(QueenFactory.getQueen('player')).to.equal(queen2);
        });

        it('should clear all Queens', () => {
            QueenFactory.create(renderer, mockSprite, 0, 0, 'faction_1');
            QueenFactory.create(renderer, mockSprite, 50, 50, 'faction_2');

            expect(QueenFactory.getAllQueens()).to.have.lengthOf(2);

            QueenFactory.clearAll();

            expect(QueenFactory.getAllQueens()).to.have.lengthOf(0);
            expect(QueenFactory.hasQueen('faction_1')).to.be.false;
            expect(QueenFactory.hasQueen('faction_2')).to.be.false;
        });
    });
});
