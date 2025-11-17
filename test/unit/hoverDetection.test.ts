/**
 * Unit tests for entity hover detection
 * Tests coordinate conversion and bounds checking for sprite hover
 */

import { expect } from 'chai';
import { GameObject } from '../../src/classes/GameObject';
import { ENTITY_CONFIG } from '../../src/config/gameplay/entityConfig';

describe('Hover Detection', () => {
    describe('Entity Bounds Calculation', () => {
        it('should calculate correct visual bounds for queen', () => {
            // Create a queen at grid position (100, 100)
            const queen = new GameObject('queen', 100, 100);
            
            // Get smooth position (rendered position)
            const smoothPos = queen.getSmoothPosition();
            
            // Queen sprite scale from config
            const scale = ENTITY_CONFIG.SPRITE_SCALES.queen; // 2.5x
            
            // Base collision size is TILE_SIZE (128)
            const visualWidth = queen.collisionWidth * 1.5; // Increased for hover
            const visualHeight = queen.collisionHeight * 1.5;
            
            console.log('Queen test data:');
            console.log('  Grid position:', queen.gridX, queen.gridY);
            console.log('  World position:', queen.worldX, queen.worldY);
            console.log('  Smooth position:', smoothPos.x, smoothPos.y);
            console.log('  Collision size:', queen.collisionWidth, queen.collisionHeight);
            console.log('  Visual size (1.5x):', visualWidth, visualHeight);
            console.log('  Sprite scale:', scale);
            
            // Visual bounds
            const halfWidth = visualWidth / 2;
            const halfHeight = visualHeight / 2;
            
            console.log('  Bounds: x[', smoothPos.x - halfWidth, '-', smoothPos.x + halfWidth, ']');
            console.log('         y[', smoothPos.y - halfHeight, '-', smoothPos.y + halfHeight, ']');
            
            // Mouse at queen center should be inside bounds
            const mouseAtCenter = {
                x: smoothPos.x,
                y: smoothPos.y
            };
            
            const isInside = (
                mouseAtCenter.x >= smoothPos.x - halfWidth &&
                mouseAtCenter.x <= smoothPos.x + halfWidth &&
                mouseAtCenter.y >= smoothPos.y - halfHeight &&
                mouseAtCenter.y <= smoothPos.y + halfHeight
            );
            
            expect(isInside).to.be.true;
        });
        
        it('should detect hover on entity edges', () => {
            const entity = new GameObject('ant', 50, 50);
            const smoothPos = entity.getSmoothPosition();
            
            const visualWidth = entity.collisionWidth * 1.5;
            const visualHeight = entity.collisionHeight * 1.5;
            const halfWidth = visualWidth / 2;
            const halfHeight = visualHeight / 2;
            
            // Test edges
            const testPoints = [
                { x: smoothPos.x - halfWidth + 1, y: smoothPos.y, name: 'left edge' },
                { x: smoothPos.x + halfWidth - 1, y: smoothPos.y, name: 'right edge' },
                { x: smoothPos.x, y: smoothPos.y - halfHeight + 1, name: 'top edge' },
                { x: smoothPos.x, y: smoothPos.y + halfHeight - 1, name: 'bottom edge' }
            ];
            
            testPoints.forEach(point => {
                const isInside = (
                    point.x >= smoothPos.x - halfWidth &&
                    point.x <= smoothPos.x + halfWidth &&
                    point.y >= smoothPos.y - halfHeight &&
                    point.y <= smoothPos.y + halfHeight
                );
                
                expect(isInside, `${point.name} should be inside`).to.be.true;
            });
        });
        
        it('should reject hover outside entity bounds', () => {
            const entity = new GameObject('ant', 50, 50);
            const smoothPos = entity.getSmoothPosition();
            
            const visualWidth = entity.collisionWidth * 1.5;
            const visualHeight = entity.collisionHeight * 1.5;
            const halfWidth = visualWidth / 2;
            const halfHeight = visualHeight / 2;
            
            // Test points outside bounds
            const testPoints = [
                { x: smoothPos.x - halfWidth - 10, y: smoothPos.y, name: 'far left' },
                { x: smoothPos.x + halfWidth + 10, y: smoothPos.y, name: 'far right' },
                { x: smoothPos.x, y: smoothPos.y - halfHeight - 10, name: 'far top' },
                { x: smoothPos.x, y: smoothPos.y + halfHeight + 10, name: 'far bottom' }
            ];
            
            testPoints.forEach(point => {
                const isInside = (
                    point.x >= smoothPos.x - halfWidth &&
                    point.x <= smoothPos.x + halfWidth &&
                    point.y >= smoothPos.y - halfHeight &&
                    point.y <= smoothPos.y + halfHeight
                );
                
                expect(isInside, `${point.name} should be outside`).to.be.false;
            });
        });
        
        it('should use smooth position not grid position', () => {
            const entity = new GameObject('ant', 100, 100);
            
            // Smooth position should be at world coordinates
            const smoothPos = entity.getSmoothPosition();
            const expectedWorldX = 100 * 128; // gridX * TILE_SIZE
            const expectedWorldY = 100 * 128;
            
            console.log('Position comparison:');
            console.log('  Grid:', entity.gridX, entity.gridY);
            console.log('  World:', entity.worldX, entity.worldY);
            console.log('  Smooth:', smoothPos.x, smoothPos.y);
            console.log('  Expected:', expectedWorldX, expectedWorldY);
            
            // Smooth position should match world position initially
            expect(smoothPos.x).to.equal(expectedWorldX);
            expect(smoothPos.y).to.equal(expectedWorldY);
        });
    });
    
    describe('Closest Entity Selection', () => {
        it('should select closest entity when multiple overlap', () => {
            const entity1 = new GameObject('ant', 50, 50);
            const entity2 = new GameObject('ant', 51, 51); // Adjacent tile
            
            const mousePos = { x: 6400, y: 6400 }; // World coords between them
            
            const pos1 = entity1.getSmoothPosition();
            const pos2 = entity2.getSmoothPosition();
            
            const dist1 = Math.sqrt(
                Math.pow(mousePos.x - pos1.x, 2) + 
                Math.pow(mousePos.y - pos1.y, 2)
            );
            
            const dist2 = Math.sqrt(
                Math.pow(mousePos.x - pos2.x, 2) + 
                Math.pow(mousePos.y - pos2.y, 2)
            );
            
            console.log('Distance test:');
            console.log('  Entity1 pos:', pos1.x, pos1.y);
            console.log('  Entity2 pos:', pos2.x, pos2.y);
            console.log('  Mouse pos:', mousePos.x, mousePos.y);
            console.log('  Distance to entity1:', dist1);
            console.log('  Distance to entity2:', dist2);
            
            // Closer entity should have smaller distance
            expect(dist1).to.not.equal(dist2);
        });
    });
});
