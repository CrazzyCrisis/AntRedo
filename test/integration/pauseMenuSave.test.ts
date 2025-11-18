/**
 * Integration tests for PauseMenuScene save functionality
 * Tests that Ctrl+S triggers save dialog only when pause menu is open
 */

import { expect } from 'chai';
import { EventBus, GameEvents } from '../../src/utils/eventBus';
import { PauseMenuScene } from '../../src/scenes/PauseMenuScene';

describe('PauseMenuScene - Save World Preset', () => {
    let pauseMenu: PauseMenuScene;
    let mockRenderer: any;
    let savePresetEmitted: boolean;
    let emittedPresetName: string | null;

    beforeEach(() => {
        // Clear EventBus
        EventBus.clear();

        // Reset test state
        savePresetEmitted = false;
        emittedPresetName = null;

        // Mock renderer
        mockRenderer = {
            register: () => () => {},
            markLayerDirty: () => {}
        };

        // Create pause menu scene
        pauseMenu = new PauseMenuScene(mockRenderer, 800, 600);

        // Listen for save preset event
        EventBus.on(GameEvents.SAVE_WORLD_PRESET, (presetName: string) => {
            savePresetEmitted = true;
            emittedPresetName = presetName;
        });

        // Mock window.prompt to return a test name
        (global as any).prompt = () => 'TestPreset';
    });

    afterEach(() => {
        EventBus.clear();
        delete (global as any).prompt;
    });

    describe('Ctrl+S Detection', () => {
        it('should NOT trigger save when S is pressed without Ctrl', () => {
            // Mock keyIsDown to return false for Control key
            (global as any).window = {
                keyIsDown: (keyCode: number) => {
                    if (keyCode === 17) return false; // Control not pressed
                    return false;
                }
            };

            // Press 'S' without Ctrl
            pauseMenu.handleKeyPress('s');

            // Should NOT emit save event
            expect(savePresetEmitted).to.be.false;
            expect(emittedPresetName).to.be.null;
        });

        it('should trigger save when Ctrl+S is pressed', () => {
            // Mock keyIsDown to return true for Control key
            (global as any).window = {
                keyIsDown: (keyCode: number) => {
                    if (keyCode === 17) return true; // Control pressed
                    return false;
                }
            };

            // Press 'S' with Ctrl
            pauseMenu.handleKeyPress('s');

            // Should emit save event
            expect(savePresetEmitted).to.be.true;
            expect(emittedPresetName).to.equal('TestPreset');
        });

        it('should trigger save when Ctrl+Shift+S is pressed', () => {
            // Mock keyIsDown to return true for Control key
            (global as any).window = {
                keyIsDown: (keyCode: number) => {
                    if (keyCode === 17) return true; // Control pressed
                    if (keyCode === 16) return true; // Shift pressed
                    return false;
                }
            };

            // Press 'S' (uppercase due to Shift) with Ctrl
            pauseMenu.handleKeyPress('S');

            // Should emit save event
            expect(savePresetEmitted).to.be.true;
            expect(emittedPresetName).to.equal('TestPreset');
        });

        it('should NOT trigger save when only Ctrl is pressed', () => {
            // Mock keyIsDown to return true for Control key
            (global as any).window = {
                keyIsDown: (keyCode: number) => {
                    if (keyCode === 17) return true; // Control pressed
                    return false;
                }
            };

            // Press some other key with Ctrl
            pauseMenu.handleKeyPress('a');

            // Should NOT emit save event
            expect(savePresetEmitted).to.be.false;
        });

        it('should handle missing keyIsDown function gracefully', () => {
            // No keyIsDown function available
            (global as any).window = {};

            // Press 'S' - should not crash
            pauseMenu.handleKeyPress('s');

            // Should NOT emit save event
            expect(savePresetEmitted).to.be.false;
        });

        it('should NOT save if user cancels the prompt', () => {
            // Mock prompt to return null (cancelled)
            (global as any).prompt = () => null;

            // Mock keyIsDown to return true for Control key
            (global as any).window = {
                keyIsDown: (keyCode: number) => keyCode === 17
            };

            // Press Ctrl+S
            pauseMenu.handleKeyPress('s');

            // Should NOT emit save event (cancelled)
            expect(savePresetEmitted).to.be.false;
        });

        it('should NOT save if user enters empty name', () => {
            // Mock prompt to return empty string
            (global as any).prompt = () => '   ';

            // Mock keyIsDown to return true for Control key
            (global as any).window = {
                keyIsDown: (keyCode: number) => keyCode === 17
            };

            // Press Ctrl+S
            pauseMenu.handleKeyPress('s');

            // Should NOT emit save event (empty name)
            expect(savePresetEmitted).to.be.false;
        });
    });

    describe('Other Key Bindings', () => {
        it('should resume game when pause key is pressed', () => {
            let resumeEmitted = false;
            EventBus.on(GameEvents.GAME_RESUME, () => {
                resumeEmitted = true;
            });

            // Press Escape (typically pause key)
            pauseMenu.handleKeyPress('Escape');

            // Should emit resume event
            expect(resumeEmitted).to.be.true;
        });

        it('should not interfere with other key presses', () => {
            // Press various other keys
            const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'w', 'x', 'y', 'z'];
            
            keys.forEach(key => {
                pauseMenu.handleKeyPress(key);
            });

            // Should never trigger save
            expect(savePresetEmitted).to.be.false;
        });
    });
});
