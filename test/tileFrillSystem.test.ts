/**
 * Tests for TileFrillSystem - Frill overlay sprite system
 */

import { expect } from 'chai';
import { TileFrillSystem } from '../src/world/TileEdgeSystem';
import { TileType } from '../src/world/TileSystem';

describe('TileFrillSystem - Sprite Path Generation', () => {
    describe('getFrillSpritePaths()', () => {
        it('should return exactly 10 paths for GRASS tile', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.GRASS);
            
            console.log('\n=== GRASS FRILL PATHS ===');
            console.log(`Total paths: ${paths.length}`);
            paths.forEach((path, idx) => console.log(`  [${idx}] ${path}`));
            
            expect(paths).to.have.lengthOf(10, 'Should return all 10 frill variations');
        });

        it('should return exactly 10 paths for each supported tile type', () => {
            const supportedTypes = [
                TileType.GRASS,
                TileType.DIRT,
                TileType.MOSS,
                TileType.SAND,
                TileType.STONE,
                TileType.WATER
            ];

            supportedTypes.forEach(tileType => {
                const paths = TileFrillSystem.getFrillSpritePaths(tileType);
                expect(paths).to.have.lengthOf(10, 
                    `TileType ${TileType[tileType]} should return 10 paths`);
            });
        });

        it('should include base sprite (no suffix) in paths', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.GRASS);
            const baseSprite = 'assets/images/tileEdges_16x16/grass/grass.png';
            
            expect(paths).to.include(baseSprite, 'Should include base grass.png');
        });

        it('should include all 4 cardinal edge sprites', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.GRASS);
            
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_t.png', 'Should include top edge');
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_b.png', 'Should include bottom edge');
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_l.png', 'Should include left edge');
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_r.png', 'Should include right edge');
        });

        it('should include all 4 corner sprites', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.GRASS);
            
            console.log('\n=== CHECKING CORNER SPRITES ===');
            console.log('All paths:', paths);
            
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_tl.png', 'Should include top-left corner');
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_tr.png', 'Should include top-right corner');
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_bl.png', 'Should include bottom-left corner');
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_br.png', 'Should include bottom-right corner');
        });

        it('should include full frill sprite', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.GRASS);
            
            expect(paths).to.include('assets/images/tileEdges_16x16/grass/grass_full.png', 'Should include full frill');
        });

        it('should return empty array for unsupported tile types', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.PEBBLE_1);
            
            expect(paths).to.be.an('array').that.is.empty;
        });

        it('should return all paths with correct structure', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.DIRT);
            
            // All paths should start with base path
            paths.forEach(path => {
                expect(path).to.match(/^assets\/images\/tileEdges_16x16\//);
            });
            
            // All paths should end with .png
            paths.forEach(path => {
                expect(path).to.match(/\.png$/);
            });
        });

        it('should generate unique paths (no duplicates)', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.GRASS);
            const uniquePaths = new Set(paths);
            
            expect(uniquePaths.size).to.equal(paths.length, 
                'All paths should be unique (no duplicates)');
        });

        it('should match expected filename pattern', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.GRASS);
            
            const expectedPatterns = [
                /grass\.png$/,        // base
                /grass_t\.png$/,      // top
                /grass_b\.png$/,      // bottom
                /grass_l\.png$/,      // left
                /grass_r\.png$/,      // right
                /grass_tl\.png$/,     // top-left
                /grass_tr\.png$/,     // top-right
                /grass_bl\.png$/,     // bottom-left
                /grass_br\.png$/,     // bottom-right
                /grass_full\.png$/    // full
            ];

            expectedPatterns.forEach((pattern, idx) => {
                const matchFound = paths.some(path => pattern.test(path));
                expect(matchFound, `Pattern ${idx} (${pattern}) should match at least one path`).to.be.true;
            });
        });
    });

    describe('supportsFrills()', () => {
        it('should return true for all supported tile types', () => {
            const supportedTypes = [
                TileType.GRASS,
                TileType.DIRT,
                TileType.MOSS,
                TileType.SAND,
                TileType.STONE,
                TileType.WATER
            ];

            supportedTypes.forEach(tileType => {
                expect(TileFrillSystem.supportsFrills(tileType)).to.be.true;
            });
        });

        it('should return false for unsupported tile types', () => {
            const unsupportedTypes = [
                TileType.PEBBLE_1,
                TileType.SAND_DARK
            ];

            unsupportedTypes.forEach(tileType => {
                expect(TileFrillSystem.supportsFrills(tileType)).to.be.false;
            });
        });
    });

    describe('Total Sprite Count', () => {
        it('should generate 60 total sprite paths across all supported tiles', () => {
            const supportedTypes = [
                TileType.GRASS,
                TileType.DIRT,
                TileType.MOSS,
                TileType.SAND,
                TileType.STONE,
                TileType.WATER
            ];

            let totalPaths = 0;
            const allPaths: string[] = [];

            console.log('\n=== TOTAL SPRITE PATH COUNT ===');
            supportedTypes.forEach(tileType => {
                const paths = TileFrillSystem.getFrillSpritePaths(tileType);
                console.log(`${TileType[tileType]}: ${paths.length} paths`);
                totalPaths += paths.length;
                allPaths.push(...paths);
            });
            console.log(`Total: ${totalPaths} paths`);
            console.log(`Expected: 60 paths (6 types × 10 variations)`);

            expect(totalPaths).to.equal(60, 'Should generate 60 total paths (6 types × 10 variations)');
            
            // Verify all paths are unique across all tile types
            const uniquePaths = new Set(allPaths);
            expect(uniquePaths.size).to.equal(60, 'All 60 paths should be unique');
        });
    });
});
