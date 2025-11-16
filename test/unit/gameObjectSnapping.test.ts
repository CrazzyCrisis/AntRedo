/**
 * GameObject Snap-to-Tile Tests
 * Verifies that entities snap to the correct tile when movement stops
 */

import { expect } from 'chai';
import { GameObject } from '../../src/classes/GameObject';
import { EventBus } from '../../src/utils/eventBus';

describe('GameObject Snap-to-Tile Behavior', () => {
    let gameObject: GameObject;

    beforeEach(() => {
        EventBus.clear();
        gameObject = new GameObject('test', 10, 10);
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Horizontal Movement Snapping', () => {
        it('should snap back when moving right only 20% through tile', () => {
            // Start at tile (10, 10)
            expect(gameObject.gridX).to.equal(10);

            // Move right briefly (20% = 9.6 pixels = ~2 frames)
            gameObject.requestMove(1, 0);
            gameObject.update(32); // ~2 frames at 60fps
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(10, 'Should snap back to starting tile (not far enough)');
        });

        it('should snap back when moving right 50% through tile', () => {
            // Start at tile (10, 10)
            expect(gameObject.gridX).to.equal(10);

            // Move right to 50% (24 pixels = ~5 frames)
            gameObject.requestMove(1, 0);
            gameObject.update(80); // ~5 frames at 60fps
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(10, 'Should snap back to starting tile (below 80% threshold)');
        });

        it('should snap back when moving right 75% through tile', () => {
            // Start at tile (10, 10)
            expect(gameObject.gridX).to.equal(10);

            // Move right to 75% (36 pixels = ~7 frames)
            gameObject.requestMove(1, 0);
            gameObject.update(112); // ~7 frames at 60fps
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(10, 'Should snap back to starting tile (still below 80%)');
        });

        it('should snap forward when moving right 85% through tile', () => {
            // Start at tile (10, 10)
            expect(gameObject.gridX).to.equal(10);

            // Move right to 85% (40.8 pixels = ~8 frames)
            gameObject.requestMove(1, 0);
            gameObject.update(135); // ~8 frames at 60fps
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(11, 'Should snap forward to next tile (over 80% threshold)');
        });

        it('should snap forward when moving right 95% through tile', () => {
            // Start at tile (10, 10)
            expect(gameObject.gridX).to.equal(10);

            // Move right to 95% (45.6 pixels = ~9 frames)
            gameObject.requestMove(1, 0);
            gameObject.update(150); // ~9 frames at 60fps
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(11, 'Should snap forward to next tile (very close to edge)');
        });

        it('should snap back when moving left only 20% through tile', () => {
            // Start at tile (10, 10)
            expect(gameObject.gridX).to.equal(10);

            // Move left briefly
            gameObject.requestMove(-1, 0);
            gameObject.update(32); // ~2 frames
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(10, 'Should snap back to starting tile');
        });

        it('should snap back when moving left 50% through tile', () => {
            // Start at tile (10, 10)
            expect(gameObject.gridX).to.equal(10);

            // Move left to 50%
            gameObject.requestMove(-1, 0);
            gameObject.update(80); // ~5 frames
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(10, 'Should snap back to starting tile');
        });

        it('should snap forward when moving left 85% through tile', () => {
            // Start at tile (10, 10)
            expect(gameObject.gridX).to.equal(10);

            // Move left to 85%
            gameObject.requestMove(-1, 0);
            gameObject.update(135); // ~8 frames
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(9, 'Should snap forward (left) to previous tile');
        });

        it('should NOT snap to perpendicular direction when moving horizontally', () => {
            // Start at tile (10, 10)
            const startY = gameObject.gridY;

            // Move right at various distances
            gameObject.requestMove(1, 0);
            gameObject.update(100);
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            // Y coordinate should NEVER change when moving horizontally
            expect(gameObject.gridY).to.equal(startY, 'Y should remain unchanged when moving horizontally');
        });
    });

    describe('Vertical Movement Snapping', () => {
        it('should snap back when moving down 20% through tile', () => {
            const startY = gameObject.gridY;

            gameObject.requestMove(0, 1);
            gameObject.update(32); // ~2 frames
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridY).to.equal(startY, 'Should snap back to starting tile');
        });

        it('should snap back when moving down 50% through tile', () => {
            const startY = gameObject.gridY;

            gameObject.requestMove(0, 1);
            gameObject.update(80); // ~5 frames
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridY).to.equal(startY, 'Should snap back to starting tile');
        });

        it('should snap forward when moving down 85% through tile', () => {
            const startY = gameObject.gridY;

            gameObject.requestMove(0, 1);
            gameObject.update(135); // ~8 frames to reach 85%
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridY).to.equal(startY + 1, 'Should snap forward to next tile');
        });

        it('should snap back when moving up 50% through tile', () => {
            const startY = gameObject.gridY;

            gameObject.requestMove(0, -1);
            gameObject.update(80); // ~5 frames
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridY).to.equal(startY, 'Should snap back to starting tile');
        });

        it('should snap forward when moving up 85% through tile', () => {
            const startY = gameObject.gridY;

            gameObject.requestMove(0, -1);
            gameObject.update(135); // ~8 frames
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridY).to.equal(startY - 1, 'Should snap forward (up) to previous tile');
        });

        it('should NOT snap to perpendicular direction when moving vertically', () => {
            const startX = gameObject.gridX;

            gameObject.requestMove(0, 1);
            gameObject.update(100);
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            // X coordinate should NEVER change when moving vertically
            expect(gameObject.gridX).to.equal(startX, 'X should remain unchanged when moving vertically');
        });
    });

    describe('Diagonal Movement Snapping', () => {
        it('should snap back when moving diagonally 50% through tile', () => {
            const startX = gameObject.gridX;
            const startY = gameObject.gridY;

            gameObject.requestMove(1, 1);
            gameObject.update(80); // ~5 frames = 50%
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(startX, 'Should snap back to starting X tile');
            expect(gameObject.gridY).to.equal(startY, 'Should snap back to starting Y tile');
        });

        it('should snap forward when moving diagonally 85% through tile', () => {
            const startX = gameObject.gridX;
            const startY = gameObject.gridY;

            gameObject.requestMove(1, 1);
            gameObject.update(135); // ~8 frames = 85%
            gameObject.requestMove(0, 0);
            
            gameObject.update(16);
            for (let i = 0; i < 100; i++) {
                gameObject.update(16);
            }
            
            expect(gameObject.gridX).to.equal(startX + 1, 'Should snap forward (right)');
            expect(gameObject.gridY).to.equal(startY + 1, 'Should snap forward (down)');
        });
    });

    describe('Edge Cases', () => {
        it('should not snap when already centered on tile', () => {
            // Entity starts centered on tile
            const startX = gameObject.gridX;
            const startY = gameObject.gridY;

            // No movement
            gameObject.requestMove(0, 0);
            gameObject.update(16);
            
            // Should remain in same position
            expect(gameObject.gridX).to.equal(startX);
            expect(gameObject.gridY).to.equal(startY);
        });

        it('should maintain last movement direction for snapping', () => {
            // Move right
            gameObject.requestMove(1, 0);
            gameObject.update(50);
            
            // Stop
            gameObject.requestMove(0, 0);
            
            // Check that last direction is stored
            expect((gameObject as any).lastMoveDirectionX).to.equal(1);
            expect((gameObject as any).lastMoveDirectionY).to.equal(0);
        });
    });
});
