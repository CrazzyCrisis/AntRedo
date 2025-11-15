/**
 * Tests for sprite file existence - Verify all frill sprites exist on disk
 */

import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { TileFrillSystem } from '../src/world/TileEdgeSystem';
import { TileType } from '../src/world/TileSystem';

describe('TileFrillSystem - File Existence', () => {
    const projectRoot = path.resolve(__dirname, '..');

    describe('Sprite Files', () => {
        it('should have all 10 GRASS frill sprites on disk', () => {
            const paths = TileFrillSystem.getFrillSpritePaths(TileType.GRASS);
            
            console.log('\n=== CHECKING GRASS SPRITE FILES ===');
            const results: Array<{path: string, exists: boolean}> = [];
            
            paths.forEach(spritePath => {
                const fullPath = path.join(projectRoot, spritePath);
                const exists = fs.existsSync(fullPath);
                results.push({ path: spritePath, exists });
                console.log(`${exists ? '✓' : '✗'} ${spritePath}`);
            });

            const missingFiles = results.filter(r => !r.exists);
            if (missingFiles.length > 0) {
                console.log('\nMissing files:');
                missingFiles.forEach(f => console.log(`  - ${f.path}`));
            }

            expect(results.every(r => r.exists), 'All 10 GRASS sprites should exist').to.be.true;
        });

        it('should have all sprite files for each supported tile type', () => {
            const supportedTypes = [
                { type: TileType.GRASS, name: 'GRASS' },
                { type: TileType.DIRT, name: 'DIRT' },
                { type: TileType.MOSS, name: 'MOSS' },
                { type: TileType.SAND, name: 'SAND' },
                { type: TileType.STONE, name: 'STONE' },
                { type: TileType.WATER, name: 'WATER' }
            ];

            console.log('\n=== CHECKING ALL TILE TYPE SPRITE FILES ===');
            const allResults: Array<{tileType: string, missing: string[]}> = [];

            supportedTypes.forEach(({ type, name }) => {
                const paths = TileFrillSystem.getFrillSpritePaths(type);
                const missingFiles: string[] = [];

                paths.forEach(spritePath => {
                    const fullPath = path.join(projectRoot, spritePath);
                    if (!fs.existsSync(fullPath)) {
                        missingFiles.push(spritePath);
                    }
                });

                if (missingFiles.length > 0) {
                    console.log(`${name}: ${missingFiles.length} missing`);
                    allResults.push({ tileType: name, missing: missingFiles });
                } else {
                    console.log(`${name}: ✓ All 10 files exist`);
                }
            });

            if (allResults.length > 0) {
                console.log('\n=== MISSING FILES SUMMARY ===');
                allResults.forEach(result => {
                    console.log(`\n${result.tileType}:`);
                    result.missing.forEach(file => console.log(`  - ${file}`));
                });
            }

            expect(allResults).to.have.lengthOf(0, 'All sprite files should exist for all supported tile types');
        });

        it('should have base directory structure', () => {
            const baseDir = path.join(projectRoot, 'assets', 'images', 'tileEdges_16x16');
            
            console.log('\n=== CHECKING DIRECTORY STRUCTURE ===');
            console.log(`Base path: ${baseDir}`);
            
            expect(fs.existsSync(baseDir), 'Base directory should exist').to.be.true;
            
            const folders = ['grass', 'dirt', 'moss', 'sand', 'stone', 'water'];
            folders.forEach(folder => {
                const folderPath = path.join(baseDir, folder);
                const exists = fs.existsSync(folderPath);
                console.log(`${exists ? '✓' : '✗'} ${folder}/`);
                expect(exists, `Folder ${folder} should exist`).to.be.true;
            });
        });

        it('should have exactly 10 files in each tile type folder', () => {
            const folders = ['grass', 'dirt', 'moss', 'sand', 'stone', 'water'];
            const baseDir = path.join(projectRoot, 'assets', 'images', 'tileEdges_16x16');

            console.log('\n=== FILE COUNT PER FOLDER ===');
            
            folders.forEach(folder => {
                const folderPath = path.join(baseDir, folder);
                if (fs.existsSync(folderPath)) {
                    const files = fs.readdirSync(folderPath)
                        .filter(file => file.endsWith('.png'));
                    
                    console.log(`${folder}: ${files.length} PNG files`);
                    
                    if (files.length !== 10) {
                        console.log('  Files found:', files);
                    }
                    
                    expect(files).to.have.lengthOf(10, `${folder} should have exactly 10 PNG files`);
                }
            });
        });

        it('should verify corner sprites specifically exist', () => {
            const cornerSuffixes = ['tl', 'tr', 'bl', 'br'];
            const baseDir = path.join(projectRoot, 'assets', 'images', 'tileEdges_16x16');

            console.log('\n=== CHECKING CORNER SPRITES (THE CRITICAL ONES) ===');
            
            const folders = ['grass', 'dirt', 'moss', 'sand', 'stone', 'water'];
            const missingCorners: Array<{tile: string, corner: string}> = [];

            folders.forEach(folder => {
                cornerSuffixes.forEach(suffix => {
                    const filename = `${folder}_${suffix}.png`;
                    const fullPath = path.join(baseDir, folder, filename);
                    const exists = fs.existsSync(fullPath);
                    
                    console.log(`${exists ? '✓' : '✗'} ${folder}/${filename}`);
                    
                    if (!exists) {
                        missingCorners.push({ tile: folder, corner: suffix });
                    }
                });
            });

            if (missingCorners.length > 0) {
                console.log('\n=== MISSING CORNER SPRITES ===');
                missingCorners.forEach(({ tile, corner }) => {
                    console.log(`  - ${tile}_${corner}.png`);
                });
            }

            expect(missingCorners).to.have.lengthOf(0, 'All corner sprites should exist');
        });

        it('should verify full frill sprites exist', () => {
            const baseDir = path.join(projectRoot, 'assets', 'images', 'tileEdges_16x16');
            const folders = ['grass', 'dirt', 'moss', 'sand', 'stone', 'water'];

            console.log('\n=== CHECKING FULL FRILL SPRITES ===');
            
            folders.forEach(folder => {
                const filename = `${folder}_full.png`;
                const fullPath = path.join(baseDir, folder, filename);
                const exists = fs.existsSync(fullPath);
                
                console.log(`${exists ? '✓' : '✗'} ${folder}/${filename}`);
                
                expect(exists, `${filename} should exist`).to.be.true;
            });
        });
    });
});
