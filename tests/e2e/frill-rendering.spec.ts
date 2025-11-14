import { test, expect } from '@playwright/test';

test.describe('Tile Frill Rendering System', () => {
    let consoleMessages: { type: string; text: string }[] = [];
    
    test.beforeEach(async ({ page }) => {
        // Capture console messages
        consoleMessages = [];
        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text()
            });
        });
        
        // Navigate to the game
        await page.goto('http://127.0.0.1:5500/index.html');
        
        // Wait for p5.js canvas to be ready
        await page.waitForSelector('canvas', { timeout: 10000 });
        await page.waitForTimeout(1500); // Wait for initial assets to load
        
        // Get canvas dimensions for coordinate conversion
        const canvas = page.locator('canvas').first();
        const canvasBox = await canvas.boundingBox();
        if (canvasBox) {
            const centerX = canvasBox.x + canvasBox.width / 2;
            const centerY = canvasBox.y + canvasBox.height / 2;
            const halfWidth = canvasBox.width / 2;
            const halfHeight = canvasBox.height / 2;
            
            // Click Play button using config coordinates (offsetX: 0, offsetY: -0.10)
            // Convert normalized coords: pixelX = centerX + (offsetX * halfWidth), pixelY = centerY - (offsetY * halfHeight)
            await page.mouse.click(
                centerX + (0 * halfWidth),           // offsetX: 0
                centerY - (-0.10 * halfHeight)       // offsetY: -0.10
            );
        }
        
        // Wait for level select menu to appear
        await page.waitForTimeout(1000);
        
        // Click DevRoom button using config coordinates (offsetX: -0.4, offsetY: -0.2)
        if (canvasBox) {
            const centerX = canvasBox.x + canvasBox.width / 2;
            const centerY = canvasBox.y + canvasBox.height / 2;
            const halfWidth = canvasBox.width / 2;
            const halfHeight = canvasBox.height / 2;
            
            await page.mouse.click(
                centerX + (-0.4 * halfWidth),        // offsetX: -0.4
                centerY - (-0.2 * halfHeight)        // offsetY: -0.2
            );
        }
        
        // Wait for world generation and rendering to complete
        await page.waitForTimeout(3000);
    });

    test('should navigate to DevRoom and render world', async ({ page }) => {
        // Verify canvas exists and has content
        const hasCanvas = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return canvas && canvas.width > 0 && canvas.height > 0;
        });
        
        expect(hasCanvas).toBeTruthy();
    });

    test('should load tile edge sprites', async ({ page }) => {
        // Check console for sprite loading
        const spriteLoadLog = consoleMessages.find(m => 
            m.text.includes('Total edge sprites loaded')
        );
        
        console.log('All console messages:', consoleMessages.map(m => m.text));
        
        // If we have the log, verify count
        if (spriteLoadLog) {
            expect(spriteLoadLog.text).toContain('60');
        }
    });

    test('should detect and log frills at tile boundaries', async ({ page }) => {
        // Check for frill detection logs
        const frillLogs = consoleMessages.filter(m => 
            m.text.includes('Frill at') || 
            m.text.includes('hasFrill: true')
        );
        
        console.log('Frill detection logs found:', frillLogs.length);
        console.log('Sample logs:', frillLogs.slice(0, 3).map(m => m.text));
        
        // Should have at least some frill detections
        expect(frillLogs.length).toBeGreaterThan(0);
    });

    test('should log tile types and neighbors', async ({ page }) => {
        const tileTypeLog = consoleMessages.find(m => m.text.includes('Tile type:'));
        const neighborsLog = consoleMessages.find(m => m.text.includes('Neighbors:'));
        
        if (tileTypeLog) {
            console.log('Tile type log:', tileTypeLog.text);
        }
        if (neighborsLog) {
            console.log('Neighbors log:', neighborsLog.text);
        }
        
        // At least one should exist
        expect(tileTypeLog || neighborsLog).toBeTruthy();
    });

    test('should render sprite paths', async ({ page }) => {
        const spritePathLog = consoleMessages.find(m => 
            m.text.includes('Looking for sprite:') && m.text.includes('tileEdges_16x16')
        );
        
        const spriteExistsLog = consoleMessages.find(m => 
            m.text.includes('Sprite exists?')
        );
        
        if (spritePathLog) {
            console.log('Sprite path:', spritePathLog.text);
        }
        if (spriteExistsLog) {
            console.log('Sprite loaded:', spriteExistsLog.text);
        }
        
        // Should have sprite path lookups
        expect(spritePathLog).toBeDefined();
    });

    test('should execute rendering calls', async ({ page }) => {
        const renderingLog = consoleMessages.find(m => m.text.includes('Rendering frill sprite:'));
        const completionLog = consoleMessages.find(m => m.text.includes('Frill sprite image() call completed'));
        
        if (renderingLog || completionLog) {
            console.log('Rendering confirmed in console');
        }
        
        // Should have rendering activity
        expect(renderingLog || completionLog).toBeTruthy();
    });

    test('should capture full debug output', async ({ page }) => {
        // Find the main frill detection log
        const mainFrillLog = consoleMessages.find(m => m.text.startsWith('Frill at'));
        
        if (mainFrillLog) {
            console.log('\n=== FULL DEBUG OUTPUT ===');
            
            // Get index of main log
            const mainIndex = consoleMessages.findIndex(m => m.text === mainFrillLog.text);
            
            // Print surrounding logs (next 10 after the frill detection)
            console.log('Main frill detection:', mainFrillLog.text);
            for (let i = mainIndex + 1; i < Math.min(mainIndex + 15, consoleMessages.length); i++) {
                console.log(consoleMessages[i].text);
            }
            console.log('======================\n');
        }
        
        expect(mainFrillLog).toBeDefined();
    });

    test('should capture canvas screenshot with frills', async ({ page }) => {
        // Wait for rendering
        await page.waitForTimeout(500);
        
        // Get canvas element
        const canvas = await page.locator('canvas').first();
        expect(canvas).toBeDefined();
        
        // Take screenshot of canvas area
        await canvas.screenshot({ path: 'test-results/frill-rendering.png' });
        
        // Verify canvas exists and has content
        const hasCanvas = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            return canvas && canvas.width > 0 && canvas.height > 0;
        });
        
        expect(hasCanvas).toBeTruthy();
        console.log('\n✓ Screenshot saved to test-results/frill-rendering.png');
        console.log('✓ Open the screenshot to visually inspect frill rendering');
        console.log('✓ Check if frills appear on correct edges of tiles');
    });
});
