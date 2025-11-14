/**
 * Tests for GameStateManager
 * Following TDD - tests written BEFORE implementation
 */

import { expect } from 'chai';
import { GameStateManager } from '../../src/managers/GameStateManager';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { TileGrid } from '../../src/world/TileGrid';
import { Tile, TileType } from '../../src/world/TileSystem';

describe('GameStateManager', () => {
    let gameState: GameStateManager;

    beforeEach(() => {
        EventBus.clear();
        (GameStateManager as any).instance = null;
        gameState = GameStateManager.getInstance();
    });

    describe('Singleton Pattern', () => {
        it('should return same instance on multiple getInstance calls', () => {
            const instance1 = GameStateManager.getInstance();
            const instance2 = GameStateManager.getInstance();
            expect(instance1).to.equal(instance2);
        });
    });

    describe('Game State', () => {
        it('should initialize with default game state', () => {
            expect(gameState.isPlaying()).to.be.false;
            expect(gameState.isPaused()).to.be.false;
            expect(gameState.getCurrentLevel()).to.equal(0);
        });

        it('should set playing state', () => {
            gameState.setPlaying(true);
            expect(gameState.isPlaying()).to.be.true;
        });

        it('should set paused state', () => {
            gameState.setPaused(true);
            expect(gameState.isPaused()).to.be.true;
        });

        it('should emit event when game starts', () => {
            let eventEmitted = false;
            EventBus.on(GameEvents.GAME_START, () => {
                eventEmitted = true;
            });

            gameState.startGame();
            expect(eventEmitted).to.be.true;
            expect(gameState.isPlaying()).to.be.true;
        });

        it('should emit event when game pauses', () => {
            let eventEmitted = false;
            EventBus.on(GameEvents.GAME_PAUSE, () => {
                eventEmitted = true;
            });

            gameState.pauseGame();
            expect(eventEmitted).to.be.true;
            expect(gameState.isPaused()).to.be.true;
        });

        it('should emit event when game resumes', () => {
            gameState.pauseGame();
            
            let eventEmitted = false;
            EventBus.on(GameEvents.GAME_RESUME, () => {
                eventEmitted = true;
            });

            gameState.resumeGame();
            expect(eventEmitted).to.be.true;
            expect(gameState.isPaused()).to.be.false;
        });
    });

    describe('Level Management', () => {
        it('should set current level', () => {
            gameState.setLevel(3);
            expect(gameState.getCurrentLevel()).to.equal(3);
        });

        it('should emit event when level changes', () => {
            let emittedLevel = 0;
            EventBus.on(GameEvents.LEVEL_CHANGED, (level: number) => {
                emittedLevel = level;
            });

            gameState.setLevel(5);
            expect(emittedLevel).to.equal(5);
        });

        it('should not emit event when setting to same level', () => {
            gameState.setLevel(2);
            
            let eventCount = 0;
            EventBus.on(GameEvents.LEVEL_CHANGED, () => {
                eventCount++;
            });

            gameState.setLevel(2);
            expect(eventCount).to.equal(0);
        });
    });

    describe('TileGrid Management', () => {
        it('should initialize with no tile grid', () => {
            expect(gameState.getTileGrid()).to.be.null;
        });

        it('should set tile grid', () => {
            const tiles = [[new Tile(0, 0, TileType.GRASS).toData()]];
            const grid = new TileGrid(tiles);

            gameState.setTileGrid(grid);
            expect(gameState.getTileGrid()).to.equal(grid);
        });

        it('should emit event when tile grid is set', () => {
            let emittedGrid: TileGrid | null = null;
            EventBus.on(GameEvents.WORLD_LOADED, (grid: TileGrid) => {
                emittedGrid = grid;
            });

            const tiles = [[new Tile(0, 0, TileType.GRASS).toData()]];
            const grid = new TileGrid(tiles);
            gameState.setTileGrid(grid);

            expect(emittedGrid).to.equal(grid);
        });

        it('should allow clearing tile grid', () => {
            const tiles = [[new Tile(0, 0, TileType.GRASS).toData()]];
            const grid = new TileGrid(tiles);
            
            gameState.setTileGrid(grid);
            expect(gameState.getTileGrid()).to.not.be.null;

            gameState.clearTileGrid();
            expect(gameState.getTileGrid()).to.be.null;
        });
    });

    describe('World Dimensions', () => {
        it('should return world dimensions from tile grid', () => {
            const tiles = [
                [new Tile(0, 0, TileType.GRASS).toData(), new Tile(1, 0, TileType.GRASS).toData()],
                [new Tile(0, 1, TileType.GRASS).toData(), new Tile(1, 1, TileType.GRASS).toData()]
            ];
            const grid = new TileGrid(tiles);
            gameState.setTileGrid(grid);

            const dimensions = gameState.getWorldDimensions();
            expect(dimensions.width).to.equal(2);
            expect(dimensions.height).to.equal(2);
        });

        it('should return zero dimensions when no grid loaded', () => {
            const dimensions = gameState.getWorldDimensions();
            expect(dimensions.width).to.equal(0);
            expect(dimensions.height).to.equal(0);
        });
    });

    describe('State Reset', () => {
        it('should reset all state', () => {
            gameState.setLevel(5);
            gameState.startGame();
            gameState.setPaused(true);
            
            const tiles = [[new Tile(0, 0, TileType.GRASS).toData()]];
            gameState.setTileGrid(new TileGrid(tiles));

            gameState.reset();

            expect(gameState.getCurrentLevel()).to.equal(0);
            expect(gameState.isPlaying()).to.be.false;
            expect(gameState.isPaused()).to.be.false;
            expect(gameState.getTileGrid()).to.be.null;
        });

        it('should emit reset event', () => {
            let eventEmitted = false;
            EventBus.on(GameEvents.GAME_RESET, () => {
                eventEmitted = true;
            });

            gameState.reset();
            expect(eventEmitted).to.be.true;
        });
    });

    describe('Integration with TileGrid', () => {
        it('should allow querying tile properties through game state', () => {
            const tiles = [
                [new Tile(0, 0, TileType.GRASS).toData(), new Tile(1, 0, TileType.WATER).toData()],
                [new Tile(0, 1, TileType.STONE).toData(), new Tile(1, 1, TileType.SAND).toData()]
            ];
            const grid = new TileGrid(tiles);
            gameState.setTileGrid(grid);

            // Entities can query through game state
            const tileGrid = gameState.getTileGrid();
            expect(tileGrid).to.not.be.null;
            expect(tileGrid!.isWalkable(0, 0)).to.be.true;  // Grass
            expect(tileGrid!.isWalkable(1, 0)).to.be.false; // Water
        });
    });
});
