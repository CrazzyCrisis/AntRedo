/**
 * Integration tests for setupEntitySpriteBinding helper
 * Tests the automatic sprite registration and event cleanup pattern
 */

import { expect } from 'chai';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { setupEntitySpriteBinding } from '../../src/utils/helpers';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { TILE_SIZE } from '../../src/world/TileSystem';

describe('setupEntitySpriteBinding Integration Tests', () => {
    let entity: GameObject;
    let mockSprite: any;
    let mockRenderer: any;
    let layerDirtyMarks: RenderLayer[] = [];
    
    // Grid to world conversion function

    beforeEach(() => {
        EventBus.clear();
        layerDirtyMarks = [];
        
        entity = new GameObject('test', 10, 10);
        
        mockSprite = {
            layer: RenderLayer.ENTITIES,
            depth: 0,
            updatePosition: (worldX: number, worldY: number) => {
                mockSprite.x = worldX;
                mockSprite.y = worldY;
            },
            x: 0,
            y: 0
        };
        
        mockRenderer = {
            register: (_renderable: any) => {
                return () => {}; // Unregister function
            },
            markLayerDirty: (layer: RenderLayer) => {
                layerDirtyMarks.push(layer);
            }
        };
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Sprite Registration', () => {
        it('should register sprite with renderer', () => {
            let registered = false;
            mockRenderer.register = () => {
                registered = true;
                return () => {};
            };
            
            setupEntitySpriteBinding(
                entity,
                mockSprite,
                mockRenderer,
                RenderLayer.ENTITIES,
            );
            
            expect(registered).to.be.true;
        });
    });

    describe('Movement Tracking', () => {
        it('should update sprite position when entity moves', () => {
            setupEntitySpriteBinding(
                entity,
                mockSprite,
                mockRenderer,
                RenderLayer.ENTITIES,
            );
            
            entity.moveTo(15, 20);
            
            expect(mockSprite.x).to.equal(15 * TILE_SIZE);
            expect(mockSprite.y).to.equal(20 * TILE_SIZE);
        });

        it('should mark layer dirty when entity moves', () => {
            setupEntitySpriteBinding(
                entity,
                mockSprite,
                mockRenderer,
                RenderLayer.ENTITIES,
            );
            
            entity.moveTo(12, 13);
            
            expect(layerDirtyMarks).to.include(RenderLayer.ENTITIES);
        });

        it('should track multiple movements', () => {
            setupEntitySpriteBinding(
                entity,
                mockSprite,
                mockRenderer,
                RenderLayer.ENTITIES,
            );
            
            entity.moveTo(11, 11);
            entity.moveTo(12, 12);
            entity.moveTo(13, 13);
            
            // Should have marked dirty 3 times
            expect(layerDirtyMarks).to.have.lengthOf(3);
            // Final position should be correct
            expect(mockSprite.x).to.equal(13 * TILE_SIZE);
            expect(mockSprite.y).to.equal(13 * TILE_SIZE);
        });
    });

    describe('Depth Sorting', () => {
        it('should update sprite depth based on Y position', () => {
            setupEntitySpriteBinding(
                entity,
                mockSprite,
                mockRenderer,
                RenderLayer.ENTITIES,
            );
            
            entity.moveTo(10, 25);
            
            // Depth should be worldY
            expect(mockSprite.depth).to.equal(25 * TILE_SIZE);
        });
    });

    describe('Cleanup on Destruction', () => {
        it('should unsubscribe from events when entity destroyed', () => {
            setupEntitySpriteBinding(
                entity,
                mockSprite,
                mockRenderer,
                RenderLayer.ENTITIES,
            );
            
            // Trigger cleanup
            EventBus.emit(GameEvents.ENTITY_DESTROYED, entity.id);
            
            // Move entity after destruction
            entity.moveTo(99, 99);
            
            // Sprite should NOT have updated (listener removed)
            expect(mockSprite.x).to.not.equal(99 * TILE_SIZE);
        });

        it('should call custom cleanup if entity has _cleanup', () => {
            let cleanupCalled = false;
            (entity as any)._cleanup = () => {
                cleanupCalled = true;
            };
            
            setupEntitySpriteBinding(
                entity,
                mockSprite,
                mockRenderer,
                RenderLayer.ENTITIES,
            );
            
            EventBus.emit(GameEvents.ENTITY_DESTROYED, entity.id);
            
            expect(cleanupCalled).to.be.true;
        });
    });

    describe('Multiple Entities', () => {
        it('should handle multiple entities with separate bindings', () => {
            const entity1 = new GameObject('entity1', 5, 5);
            const entity2 = new GameObject('entity2', 10, 10);
            
            const sprite1 = { ...mockSprite, x: 0, y: 0 };
            const sprite2 = { ...mockSprite, x: 0, y: 0 };
            
            setupEntitySpriteBinding(entity1, sprite1, mockRenderer, RenderLayer.ENTITIES);
            setupEntitySpriteBinding(entity2, sprite2, mockRenderer, RenderLayer.ENTITIES);
            
            entity1.moveTo(6, 6);
            entity2.moveTo(11, 11);
            
            expect(sprite1.x).to.equal(6 * TILE_SIZE);
            expect(sprite2.x).to.equal(11 * TILE_SIZE);
        });
    });
});
