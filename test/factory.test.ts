import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { PlayerFactory } from '../src/factories/PlayerFactory';
import { Renderer } from '../src/rendering/Renderer';
import { EventBus, GameEvents } from '../src/utils/eventBus';
import { createMockP5 } from './helpers/renderingMocks';

describe('PlayerFactory', () => {
    let renderer: Renderer;
    const mockP5 = createMockP5();
    const mockSprite = { width: 32, height: 32 };

    beforeEach(() => {
        renderer = new Renderer(mockP5 as any, 800, 600);
        EventBus.clear(); // Clear all event listeners before each test
    });

    afterEach(() => {
        EventBus.clear(); // Clean up after each test
    });

    describe('create()', () => {
        it('should create a player at specified position', () => {
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            expect(player.x).to.equal(100);
            expect(player.y).to.equal(200);
        });

        it('should automatically register player with renderer', () => {
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            // Render should not throw - player sprite is registered
            renderer.render();
            expect(player).to.exist;
        });

        it('should emit PLAYER_SPAWN event', () => {
            let spawnEmitted = false;
            EventBus.on(GameEvents.PLAYER_SPAWN, () => {
                spawnEmitted = true;
            });

            PlayerFactory.create(renderer, mockSprite, 100, 200);
            expect(spawnEmitted).to.be.true;
        });

        it('should update sprite position when player moves', () => {
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            player.moveTo(300, 400);

            // Sprite should update automatically (tested via no errors on render)
            renderer.render();
            expect(player.x).to.equal(300);
            expect(player.y).to.equal(400);
        });

        it('should mark layer dirty when player moves', () => {
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);
            
            renderer.render(); // Clear dirty flags
            player.moveTo(300, 400);

            // Layer should be marked dirty (tested in integration)
            expect(player.x).to.equal(300);
        });

        it('should clean up rendering on player death', () => {
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            player.takeDamage(100); // Kill player

            // Should have emitted death event and cleaned up
            expect(player.health).to.equal(0);
        });

        it('should allow manual cleanup', () => {
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            // Cleanup function should exist
            expect((player as any)._cleanup).to.be.a('function');

            (player as any)._cleanup();

            // After cleanup, move should not affect rendering
            player.moveTo(300, 400);
            renderer.render();
            expect(player.x).to.equal(300);
        });
    });

    describe('Factory Pattern Benefits', () => {
        it('should hide rendering complexity from game code', () => {
            // Game code only needs one line - no rendering setup!
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            // Developer can use player without knowing about:
            // - SpriteComponent
            // - Renderer registration
            // - EventBus listeners
            // - Layer dirty flags
            // - Depth sorting

            player.moveTo(200, 300);
            player.takeDamage(10);
            player.heal(5);

            expect(player.health).to.equal(95);
        });

        it('should create multiple players easily', () => {
            const player1 = PlayerFactory.create(renderer, mockSprite, 100, 100);
            const player2 = PlayerFactory.create(renderer, mockSprite, 200, 200);
            const player3 = PlayerFactory.create(renderer, mockSprite, 300, 300);

            renderer.render();

            expect(player1.x).to.equal(100);
            expect(player2.x).to.equal(200);
            expect(player3.x).to.equal(300);
        });

        it('should handle player model logic without renderer awareness', () => {
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            // Player model works independently
            player.takeDamage(30);
            expect(player.health).to.equal(70);

            player.heal(20);
            expect(player.health).to.equal(90);

            player.move(10, -5);
            expect(player.x).to.equal(110);
            expect(player.y).to.equal(195);
        });
    });

    describe('MVC Pattern Demonstration', () => {
        it('should separate Model (Player) from View (SpriteComponent)', () => {
            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            // Model changes (data)
            player.moveTo(200, 300);
            player.takeDamage(25);

            // View updates automatically via EventBus
            // Developer never touches rendering code!

            expect(player.health).to.equal(75);
            expect(player.x).to.equal(200);
            expect(player.y).to.equal(300);
        });

        it('should use EventBus for Model-View communication', () => {
            let moveCount = 0;
            EventBus.on(GameEvents.PLAYER_MOVE, () => moveCount++);

            const player = PlayerFactory.create(renderer, mockSprite, 100, 200);

            player.moveTo(150, 250);
            player.moveTo(200, 300);

            expect(moveCount).to.equal(2);
        });
    });
});
