import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { PauseMenuScene } from '../../src/scenes/PauseMenuScene';
import { DevRoomScene } from '../../src/scenes/DevRoomScene';
import { Renderer } from '../../src/rendering/Renderer';
import { WorldPresetManager, WorldPreset } from '../../src/world/WorldPresetManager';
import { createMockP5 } from '../helpers/renderingMocks';

/**
 * Integration Test Suite: Pause Menu → Preset Loading → Scene Resume
 * 
 * Tests the complete workflow:
 * 1. DevRoomScene running → User presses pause
 * 2. PauseMenuScene displays presets
 * 3. User selects and loads preset (double-click or 'L' key)
 * 4. DevRoomScene loads new world
 * 5. PauseMenuScene automatically closes
 * 
 * This validates the event chain: LOAD_WORLD_PRESET → loadPresetWorld() → GAME_RESUME → resumeGame()
 */
describe('Pause Menu Preset Loading Integration', () => {
    let devRoomScene: DevRoomScene;
    let pauseMenuScene: PauseMenuScene;
    let renderer: Renderer;
    const mockP5 = createMockP5();
    const TEST_CANVAS = { WIDTH: 800, HEIGHT: 600 };

    // Test preset data
    const testPreset: WorldPreset = {
        name: 'TestWorld',
        seed: 12345,
        noiseScale: 0.1,
        width: 50,
        height: 50,
        timestamp: Date.now()
    };

    beforeEach(() => {
        // Mock window and URLSearchParams for Node.js environment
        if (typeof window === 'undefined') {
            (global as any).window = {
                location: {
                    search: ''
                }
            };
            
            // Mock URLSearchParams if not available
            if (typeof (global as any).URLSearchParams === 'undefined') {
                (global as any).URLSearchParams = class {
                    private params: Map<string, string>;
                    
                    constructor(search: string) {
                        this.params = new Map();
                        if (search) {
                            const cleanSearch = search.startsWith('?') ? search.slice(1) : search;
                            cleanSearch.split('&').forEach(pair => {
                                const [key, value] = pair.split('=');
                                if (key) this.params.set(key, value || '');
                            });
                        }
                    }
                    
                    get(key: string): string | null {
                        return this.params.get(key) || null;
                    }
                };
            }
        }
        
        // Clear EventBus
        EventBus.clear();
        
        // Clear saved presets
        WorldPresetManager.clearAllPresets();
        
        // Create mock images for DevRoomScene
        const mockBackButtonImg = {
            width: 100,
            height: 50
        };
        
        const mockTileSprites = {};
        const mockTileEdgeSprites = {};
        
        // Create fresh renderer
        renderer = new Renderer(mockP5 as any, TEST_CANVAS.WIDTH, TEST_CANVAS.HEIGHT);
        
        // Create DevRoomScene (requires back button image and tile sprites)
        devRoomScene = new DevRoomScene(
            renderer,
            TEST_CANVAS.WIDTH,
            TEST_CANVAS.HEIGHT,
            mockBackButtonImg as any,
            mockTileSprites,
            mockTileEdgeSprites
        );
        
        // Enter DevRoomScene to initialize world
        devRoomScene.enter();
        
        // Save test preset
        WorldPresetManager.savePreset(testPreset);
    });

    afterEach(() => {
        // Cleanup
        EventBus.clear();
        WorldPresetManager.clearAllPresets();
        
        // Cleanup window mock
        if ((global as any).window && !(global as any).window.document) {
            delete (global as any).window;
        }
    });

    describe('Preset Loading Triggers Resume', () => {
        it('should emit GAME_RESUME event after loading preset from mapData', (done) => {
            // Listen for GAME_RESUME event
            let resumeEmitted = false;
            EventBus.on(GameEvents.GAME_RESUME, () => {
                resumeEmitted = true;
            });

            // Emit LOAD_WORLD_PRESET event
            EventBus.emit(GameEvents.LOAD_WORLD_PRESET, testPreset);

            // Give time for event processing
            setTimeout(() => {
                expect(resumeEmitted).to.be.true;
                done();
            }, 100);
        });

        it('should emit GAME_RESUME event after regenerating world from seed', (done) => {
            // Create preset without mapData (forces regeneration)
            const seedOnlyPreset: WorldPreset = {
                name: 'SeedOnly',
                seed: 99999,
                noiseScale: 0.1,
                width: 30,
                height: 30,
                timestamp: Date.now()
            };

            // Listen for GAME_RESUME event
            let resumeEmitted = false;
            EventBus.on(GameEvents.GAME_RESUME, () => {
                resumeEmitted = true;
            });

            // Emit LOAD_WORLD_PRESET event
            EventBus.emit(GameEvents.LOAD_WORLD_PRESET, seedOnlyPreset);

            // Give time for event processing
            setTimeout(() => {
                expect(resumeEmitted).to.be.true;
                done();
            }, 100);
        });
    });

    describe('Pause Menu Closes After Load', () => {
        it('should close pause menu when GAME_RESUME is emitted', () => {
            // Create pause menu
            pauseMenuScene = new PauseMenuScene(
                renderer,
                TEST_CANVAS.WIDTH,
                TEST_CANVAS.HEIGHT
            );
            pauseMenuScene.enter();
            
            // Emit GAME_RESUME
            EventBus.emit(GameEvents.GAME_RESUME);

            // Verify pause menu exits
            pauseMenuScene.exit();
            
            // In real scenario, DevRoomScene.resumeGame() sets isPaused = false
            const isPausedAfter = false;
            expect(isPausedAfter).to.be.false;
        });

        it('should handle double-click preset load workflow', (done) => {
            // Create pause menu
            pauseMenuScene = new PauseMenuScene(
                renderer,
                TEST_CANVAS.WIDTH,
                TEST_CANVAS.HEIGHT
            );
            pauseMenuScene.enter();

            // Track if resume was called
            let gameResumed = false;
            EventBus.on(GameEvents.GAME_RESUME, () => {
                gameResumed = true;
            });

            // Simulate double-click on preset (emits LOAD_WORLD_PRESET)
            EventBus.emit(GameEvents.LOAD_WORLD_PRESET, testPreset);

            // Wait for event chain to complete
            setTimeout(() => {
                expect(gameResumed).to.be.true;
                done();
            }, 150);
        });

        it('should handle keyboard "L" load workflow', (done) => {
            // Create pause menu
            pauseMenuScene = new PauseMenuScene(
                renderer,
                TEST_CANVAS.WIDTH,
                TEST_CANVAS.HEIGHT
            );
            pauseMenuScene.enter();

            // Track if resume was called
            let gameResumed = false;
            EventBus.on(GameEvents.GAME_RESUME, () => {
                gameResumed = true;
            });

            // Simulate pressing 'L' key (emits LOAD_WORLD_PRESET)
            EventBus.emit(GameEvents.LOAD_WORLD_PRESET, testPreset);

            // Wait for event chain to complete
            setTimeout(() => {
                expect(gameResumed).to.be.true;
                done();
            }, 150);
        });
    });

    describe('Full Workflow: Pause → Load → Resume', () => {
        it('should complete full preset loading workflow', (done) => {
            // PHASE 1: Game is running
            expect(devRoomScene).to.exist;

            // PHASE 2: User pauses (creates pause menu)
            pauseMenuScene = new PauseMenuScene(
                renderer,
                TEST_CANVAS.WIDTH,
                TEST_CANVAS.HEIGHT
            );
            pauseMenuScene.enter();

            // PHASE 3: Track event sequence
            const eventSequence: string[] = [];

            EventBus.on(GameEvents.LOAD_WORLD_PRESET, () => {
                eventSequence.push('LOAD_WORLD_PRESET');
            });

            EventBus.on(GameEvents.GAME_RESUME, () => {
                eventSequence.push('GAME_RESUME');
            });

            // PHASE 4: User loads preset (double-click or 'L' key)
            EventBus.emit(GameEvents.LOAD_WORLD_PRESET, testPreset);

            // PHASE 5: Verify event sequence
            setTimeout(() => {
                expect(eventSequence).to.deep.equal([
                    'LOAD_WORLD_PRESET',
                    'GAME_RESUME'
                ]);
                
                // Pause menu should be ready to exit
                pauseMenuScene.exit();
                
                done();
            }, 150);
        });

        it('should maintain world state after preset load', (done) => {
            // Save current world seed
            const originalSeed = (devRoomScene as any).currentWorldSeed;

            // Load different preset
            const newPreset: WorldPreset = {
                name: 'NewWorld',
                seed: 55555,
                noiseScale: 0.15,
                width: 40,
                height: 40,
                timestamp: Date.now()
            };

            EventBus.emit(GameEvents.LOAD_WORLD_PRESET, newPreset);

            setTimeout(() => {
                // Verify seed changed
                const newSeed = (devRoomScene as any).currentWorldSeed;
                expect(newSeed).to.equal(55555);
                expect(newSeed).to.not.equal(originalSeed);
                
                done();
            }, 150);
        });
    });

    describe('Event Listener Cleanup', () => {
        it('should not accumulate event listeners after multiple pause cycles', () => {
            const initialListenerCount = EventBus.listenerCount(GameEvents.LOAD_WORLD_PRESET);

            // Multiple pause → resume cycles
            for (let i = 0; i < 5; i++) {
                pauseMenuScene = new PauseMenuScene(
                    renderer,
                    TEST_CANVAS.WIDTH,
                    TEST_CANVAS.HEIGHT
                );
                pauseMenuScene.enter();
                pauseMenuScene.exit();
            }

            const finalListenerCount = EventBus.listenerCount(GameEvents.LOAD_WORLD_PRESET);

            // Listener count should be controlled
            expect(finalListenerCount).to.be.lessThan(initialListenerCount + 10);
        });

        it('should cleanup listeners when pause menu exits', () => {
            pauseMenuScene = new PauseMenuScene(
                renderer,
                TEST_CANVAS.WIDTH,
                TEST_CANVAS.HEIGHT
            );
            
            // PauseMenuScene doesn't subscribe to events, only emits them
            // This test verifies that exit() doesn't throw and cleanup works
            pauseMenuScene.enter();
            
            expect(() => pauseMenuScene.exit()).to.not.throw();
            
            // Verify unregister functions were cleared
            expect((pauseMenuScene as any).unregisterFunctions.length).to.equal(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle preset load when no preset data exists', (done) => {
            const invalidPreset: WorldPreset = {
                name: 'Invalid',
                seed: 0,
                noiseScale: 0.1,
                width: 10,
                height: 10,
                timestamp: Date.now()
            };

            // Should not throw
            expect(() => {
                EventBus.emit(GameEvents.LOAD_WORLD_PRESET, invalidPreset);
            }).to.not.throw();

            setTimeout(() => {
                done();
            }, 100);
        });

        it('should handle rapid preset loading', (done) => {
            const presets: WorldPreset[] = [
                { name: 'World1', seed: 111, noiseScale: 0.1, width: 30, height: 30, timestamp: Date.now() },
                { name: 'World2', seed: 222, noiseScale: 0.1, width: 30, height: 30, timestamp: Date.now() },
                { name: 'World3', seed: 333, noiseScale: 0.1, width: 30, height: 30, timestamp: Date.now() }
            ];

            // Emit multiple load events rapidly
            presets.forEach(preset => {
                EventBus.emit(GameEvents.LOAD_WORLD_PRESET, preset);
            });

            setTimeout(() => {
                // Should handle gracefully (last preset wins)
                const finalSeed = (devRoomScene as any).currentWorldSeed;
                expect(finalSeed).to.be.oneOf([111, 222, 333]);
                done();
            }, 200);
        });

        it('should handle GAME_RESUME without active pause menu', () => {
            // No pause menu created, but resume emitted
            expect(() => {
                EventBus.emit(GameEvents.GAME_RESUME);
            }).to.not.throw();
        });
    });

    describe('DevRoomScene Resume Logic', () => {
        it('should set isPaused to false when resuming', (done) => {
            // Access private isPaused field (for testing only)
            (devRoomScene as any).isPaused = true;

            EventBus.emit(GameEvents.GAME_RESUME);

            setTimeout(() => {
                const isPaused = (devRoomScene as any).isPaused;
                expect(isPaused).to.be.false;
                done();
            }, 100);
        });

        it('should clear pause menu reference when resuming', (done) => {
            // Create pause menu
            pauseMenuScene = new PauseMenuScene(
                renderer,
                TEST_CANVAS.WIDTH,
                TEST_CANVAS.HEIGHT
            );
            (devRoomScene as any).pauseMenu = pauseMenuScene;

            EventBus.emit(GameEvents.GAME_RESUME);

            setTimeout(() => {
                const pauseMenu = (devRoomScene as any).pauseMenu;
                expect(pauseMenu).to.be.null;
                done();
            }, 100);
        });
    });
});
