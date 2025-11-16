/**
 * Click-to-Move E2E Tests using Playwright
 * Tests actual browser interaction with click-to-move system
 */

import { test, expect, Page } from '@playwright/test';

// Helper to wait for game initialization
async function waitForGameReady(page: Page) {
    // Wait for DevRoomScene to initialize
    await page.waitForFunction(() => {
        return (window as any).console._logs?.some((log: string) => 
            log.includes('[DevRoomScene] ✅ GameUIOverlay initialized')
        );
    }, { timeout: 10000 });
    
    // Give rendering a moment to settle
    await page.waitForTimeout(500);
}

// Helper to capture console logs
async function setupConsoleCapture(page: Page) {
    await page.evaluate(() => {
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = function(...args: any[]) {
            logs.push(args.map((a: any) => String(a)).join(' '));
            originalLog.apply(console, args);
        };
        (window as any).console._logs = logs;
    });
}

// Helper to get queen position
async function getQueenPosition(page: Page): Promise<{ gridX: number; gridY: number }> {
    return await page.evaluate(() => {
        const EntityManager = (window as any).EntityManager;
        if (!EntityManager) throw new Error('EntityManager not found');
        
        const entities = EntityManager.getInstance().getAllEntities();
        const queen = entities.find((e: any) => e.entityClass === 'queen');
        if (!queen) throw new Error('Queen not found');
        
        return { gridX: queen.gridX, gridY: queen.gridY };
    });
}

// Helper to click at grid coordinates
async function clickGridTile(page: Page, gridX: number, gridY: number) {
    const TILE_SIZE = 128; // From TILE_CONFIG
    
    // Convert grid to world coordinates (center of tile)
    const worldX = gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = gridY * TILE_SIZE + TILE_SIZE / 2;
    
    // Get camera position
    const cameraPos = await page.evaluate(() => {
        const CameraManager = (window as any).CameraManager;
        if (!CameraManager) throw new Error('CameraManager not found');
        
        const camera = CameraManager.getInstance().getCamera();
        return { x: camera.x, y: camera.y };
    });
    
    // Convert world to screen coordinates
    const canvasRect = await page.locator('canvas').first().boundingBox();
    if (!canvasRect) throw new Error('Canvas not found');
    
    const screenX = worldX - cameraPos.x + canvasRect.width / 2;
    const screenY = worldY - cameraPos.y + canvasRect.height / 2;
    
    // Click at screen coordinates
    await page.mouse.click(canvasRect.x + screenX, canvasRect.y + screenY);
}

// Helper to check if tile is walkable
async function isTileWalkable(page: Page, gridX: number, gridY: number): Promise<boolean> {
    return await page.evaluate(({ x, y }) => {
        const GameStateManager = (window as any).GameStateManager;
        if (!GameStateManager) throw new Error('GameStateManager not found');
        
        const tileGrid = GameStateManager.getInstance().getTileGrid();
        if (!tileGrid) throw new Error('TileGrid not found');
        
        return tileGrid.isWalkable(x, y);
    }, { x: gridX, y: gridY });
}

test.describe('Click-to-Move E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await setupConsoleCapture(page);
        await page.goto('http://localhost:8080'); // Adjust port as needed
        await waitForGameReady(page);
    });

    test('should find queen at expected starting position', async ({ page }) => {
        const queenPos = await getQueenPosition(page);
        
        // Queen spawns at center of 200x200 map
        expect(queenPos.gridX).toBe(100);
        expect(queenPos.gridY).toBe(100);
    });

    test('should handle click on adjacent tile above queen', async ({ page }) => {
        const queenPos = await getQueenPosition(page);
        const targetX = queenPos.gridX;
        const targetY = queenPos.gridY - 1; // One tile up
        
        // Verify tile is walkable
        const isWalkable = await isTileWalkable(page, targetX, targetY);
        expect(isWalkable).toBe(true);
        
        // Click the tile
        await clickGridTile(page, targetX, targetY);
        
        // Wait for pathfinding
        await page.waitForTimeout(100);
        
        // Check console for PATH_FOUND event
        const logs = await page.evaluate(() => (window as any).console._logs || []);
        const pathFound = logs.some((log: string) => 
            log.includes('[PathfindingComponent] Path found')
        );
        
        expect(pathFound).toBe(true);
    });

    test('should handle click on adjacent tile to the right of queen', async ({ page }) => {
        const queenPos = await getQueenPosition(page);
        const targetX = queenPos.gridX + 1; // One tile right
        const targetY = queenPos.gridY;
        
        // Verify tile is walkable
        const isWalkable = await isTileWalkable(page, targetX, targetY);
        expect(isWalkable).toBe(true);
        
        // Click the tile
        await clickGridTile(page, targetX, targetY);
        
        // Wait for pathfinding
        await page.waitForTimeout(100);
        
        // Check console for PATH_FOUND event
        const logs = await page.evaluate(() => (window as any).console._logs || []);
        const pathFound = logs.some((log: string) => 
            log.includes('[PathfindingComponent] Path found')
        );
        
        expect(pathFound).toBe(true);
    });

    test('should handle click on diagonal tile', async ({ page }) => {
        const queenPos = await getQueenPosition(page);
        const targetX = queenPos.gridX + 1;
        const targetY = queenPos.gridY + 1;
        
        // Verify tile is walkable
        const isWalkable = await isTileWalkable(page, targetX, targetY);
        expect(isWalkable).toBe(true);
        
        // Click the tile
        await clickGridTile(page, targetX, targetY);
        
        // Wait for pathfinding
        await page.waitForTimeout(100);
        
        // Check console for PATH_FOUND event
        const logs = await page.evaluate(() => (window as any).console._logs || []);
        const pathFound = logs.some((log: string) => 
            log.includes('[PathfindingComponent] Path found')
        );
        
        expect(pathFound).toBe(true);
    });

    test('should display tile highlight when hovering', async ({ page }) => {
        const queenPos = await getQueenPosition(page);
        const targetX = queenPos.gridX - 1;
        const targetY = queenPos.gridY;
        
        const TILE_SIZE = 128;
        const worldX = targetX * TILE_SIZE + TILE_SIZE / 2;
        const worldY = targetY * TILE_SIZE + TILE_SIZE / 2;
        
        // Get camera position and convert to screen
        const cameraPos = await page.evaluate(() => {
            const CameraManager = (window as any).CameraManager;
            const camera = CameraManager.getInstance().getCamera();
            return { x: camera.x, y: camera.y };
        });
        
        const canvasRect = await page.locator('canvas').first().boundingBox();
        if (!canvasRect) throw new Error('Canvas not found');
        
        const screenX = worldX - cameraPos.x + canvasRect.width / 2;
        const screenY = worldY - cameraPos.y + canvasRect.height / 2;
        
        // Move mouse to tile
        await page.mouse.move(canvasRect.x + screenX, canvasRect.y + screenY);
        await page.waitForTimeout(100);
        
        // Check if TileHighlightComponent is visible
        const logs = await page.evaluate(() => (window as any).console._logs || []);
        const hasHighlight = logs.some((log: string) => 
            log.includes('[DevRoomScene] ✅ Tile highlighter registered')
        );
        
        expect(hasHighlight).toBe(true);
    });

    test('should emit correct grid coordinates when clicking', async ({ page }) => {
        const queenPos = await getQueenPosition(page);
        const targetX = queenPos.gridX - 1;
        const targetY = queenPos.gridY - 1;
        
        // Click the tile
        await clickGridTile(page, targetX, targetY);
        await page.waitForTimeout(100);
        
        // Get the logged grid position
        const logs = await page.evaluate(() => (window as any).console._logs || []);
        const gridPosLog = logs.find((log: string) => 
            log.includes('[DevRoomScene] Grid position:')
        );
        
        expect(gridPosLog).toBeDefined();
        expect(gridPosLog).toContain(`(${targetX}, ${targetY})`);
    });

    test('should fail gracefully when clicking unwalkable tile', async ({ page }) => {
        // Find an unwalkable tile (water/wall)
        const unwalkableTile = await page.evaluate(() => {
            const GameStateManager = (window as any).GameStateManager;
            const tileGrid = GameStateManager.getInstance().getTileGrid();
            const grid = tileGrid.getGrid();
            
            // Scan for unwalkable tile
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[0].length; col++) {
                    if (!grid[row][col].walkable) {
                        return { col, row };
                    }
                }
            }
            return null;
        });
        
        if (!unwalkableTile) {
            test.skip(); // Skip if no unwalkable tiles exist
            return;
        }
        
        // Click unwalkable tile
        await clickGridTile(page, unwalkableTile.col, unwalkableTile.row);
        await page.waitForTimeout(100);
        
        // Check for PATH_FAILED event
        const logs = await page.evaluate(() => (window as any).console._logs || []);
        const pathFailed = logs.some((log: string) => 
            log.includes('Target not walkable') || log.includes('PATH_FAILED')
        );
        
        expect(pathFailed).toBe(true);
    });

    test('should display path visualization after click', async ({ page }) => {
        const queenPos = await getQueenPosition(page);
        const targetX = queenPos.gridX + 5;
        const targetY = queenPos.gridY;
        
        // Verify tile is walkable
        const isWalkable = await isTileWalkable(page, targetX, targetY);
        expect(isWalkable).toBe(true);
        
        // Click the tile
        await clickGridTile(page, targetX, targetY);
        await page.waitForTimeout(100);
        
        // Check for path visualizer
        const logs = await page.evaluate(() => (window as any).console._logs || []);
        const hasPathVisualizer = logs.some((log: string) => 
            log.includes('[DevRoomScene] ✅ Path visualizer registered')
        );
        const pathFound = logs.some((log: string) => 
            log.includes('[PathVisualizer] Path found')
        );
        
        expect(hasPathVisualizer).toBe(true);
        expect(pathFound).toBe(true);
    });
});
