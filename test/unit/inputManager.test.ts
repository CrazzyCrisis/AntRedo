import { expect } from 'chai';
import { EventBus } from '../../src/utils/eventBus';
import { GameEvents } from '../../src/utils/eventBus';
import { InputManager } from '../../src/managers/InputManager';
import { SettingsManager } from '../../src/managers/SettingsManager';
import { DEFAULT_SETTINGS } from '../../src/config/defaultSettings';

// Mock localStorage for Node.js environment
class LocalStorageMock {
    private store: { [key: string]: string } = {};

    getItem(key: string): string | null {
        return this.store[key] || null;
    }

    setItem(key: string, value: string): void {
        this.store[key] = value;
    }

    removeItem(key: string): void {
        delete this.store[key];
    }

    clear(): void {
        this.store = {};
    }
}

describe('InputManager', () => {
    let inputManager: InputManager;
    let settingsManager: SettingsManager;

    beforeEach(() => {
        // Setup localStorage mock
        (global as any).localStorage = new LocalStorageMock();
        
        // Clear EventBus
        EventBus.clear();
        
        // Reset singleton instances
        (SettingsManager as any).instance = null;
        (InputManager as any).instance = null;
        
        // Initialize fresh instances
        settingsManager = SettingsManager.getInstance();
        settingsManager.resetToDefaults(); // Start with known state
        inputManager = InputManager.getInstance();
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance on multiple calls', () => {
            const instance1 = InputManager.getInstance();
            const instance2 = InputManager.getInstance();
            expect(instance1).to.equal(instance2);
        });

        it('should initialize only once', () => {
            const instance1 = InputManager.getInstance();
            const instance2 = InputManager.getInstance();
            // Both should return the same keybind values (not necessarily same reference)
            expect(instance1.getKeyBinding('moveUp')).to.deep.equal(instance2.getKeyBinding('moveUp'));
        });
    });

    describe('Initialization', () => {
        it('should load keybinds from SettingsManager on creation', () => {
            const moveUpKeys = inputManager.getKeyBinding('moveUp');
            expect(moveUpKeys).to.deep.equal(DEFAULT_SETTINGS.keyBindings.moveUp);
        });

        it('should have all default keybinds available', () => {
            const actions: Array<keyof typeof DEFAULT_SETTINGS.keyBindings> = [
                'moveUp', 'moveDown', 'moveLeft', 'moveRight',
                'jump', 'interact', 'pause', 'openInventory'
            ];

            actions.forEach(action => {
                const keys = inputManager.getKeyBinding(action);
                expect(keys).to.be.an('array');
                expect(keys.length).to.be.greaterThan(0);
            });
        });
    });

    describe('Key Binding Queries', () => {
        it('should return correct keys for an action', () => {
            const moveUpKeys = inputManager.getKeyBinding('moveUp');
            expect(moveUpKeys).to.deep.equal(['w', 'ArrowUp']);
        });

        it('should return empty array for non-existent action', () => {
            const keys = inputManager.getKeyBinding('nonExistentAction' as any);
            expect(keys).to.deep.equal([]);
        });

        it('should check if a key is bound to an action', () => {
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.true;
            expect(inputManager.isKeyBoundToAction('ArrowUp', 'moveUp')).to.be.true;
            expect(inputManager.isKeyBoundToAction('s', 'moveUp')).to.be.false;
        });

        it('should get action for a given key', () => {
            const action = inputManager.getActionForKey('w');
            expect(action).to.equal('moveUp');
        });

        it('should return null for unbound key', () => {
            const action = inputManager.getActionForKey('unbound_key');
            expect(action).to.be.null;
        });

        it('should handle case-sensitive keys', () => {
            // Default bindings are lowercase
            expect(inputManager.isKeyBoundToAction('W', 'moveUp')).to.be.false;
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.true;
        });
    });

    describe('Key Rebinding', () => {
        it('should rebind a single key to an action', () => {
            const result = inputManager.rebindKey('moveUp', 't');
            expect(result.success).to.be.true;
            expect(inputManager.isKeyBoundToAction('t', 'moveUp')).to.be.true;
        });

        it('should replace all existing bindings when rebinding', () => {
            inputManager.rebindKey('moveUp', 't');
            const keys = inputManager.getKeyBinding('moveUp');
            expect(keys).to.deep.equal(['t']);
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.false;
            expect(inputManager.isKeyBoundToAction('ArrowUp', 'moveUp')).to.be.false;
        });

        it('should detect conflicts when rebinding', () => {
            // Try to bind 'w' to moveDown (already bound to moveUp)
            const result = inputManager.rebindKey('moveDown', 'w');
            expect(result.success).to.be.false;
            expect(result.conflict).to.equal('moveUp');
        });

        it('should allow rebinding with force flag despite conflicts', () => {
            const result = inputManager.rebindKey('moveDown', 'w', true);
            expect(result.success).to.be.true;
            expect(inputManager.isKeyBoundToAction('w', 'moveDown')).to.be.true;
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.false;
        });

        it('should emit SETTING_KEYBIND_CHANGED event on successful rebind', (done) => {
            EventBus.on(GameEvents.SETTING_KEYBIND_CHANGED, (action: string, keys: string[]) => {
                expect(action).to.equal('moveUp');
                expect(keys).to.deep.equal(['t']);
                done();
            });

            inputManager.rebindKey('moveUp', 't');
        });

        it('should not emit event on failed rebind', (done) => {
            let eventEmitted = false;

            EventBus.on(GameEvents.SETTING_KEYBIND_CHANGED, () => {
                eventEmitted = true;
            });

            // Try to bind conflicting key
            inputManager.rebindKey('moveDown', 'w');

            // Wait a bit to ensure event doesn't fire
            setTimeout(() => {
                expect(eventEmitted).to.be.false;
                done();
            }, 10);
        });

        it('should save to SettingsManager on successful rebind', () => {
            inputManager.rebindKey('moveUp', 't');
            const savedBindings = settingsManager.getKeyBindings();
            expect(savedBindings.moveUp).to.deep.equal(['t']);
        });
    });

    describe('Multi-Key Binding', () => {
        it('should add additional key to existing bindings', () => {
            const result = inputManager.addKeyBinding('moveUp', 'q');
            expect(result.success).to.be.true;
            
            const keys = inputManager.getKeyBinding('moveUp');
            expect(keys).to.include('w');
            expect(keys).to.include('ArrowUp');
            expect(keys).to.include('q');
        });

        it('should detect conflicts when adding keys', () => {
            const result = inputManager.addKeyBinding('moveDown', 'w');
            expect(result.success).to.be.false;
            expect(result.conflict).to.equal('moveUp');
        });

        it('should allow adding with force flag despite conflicts', () => {
            const result = inputManager.addKeyBinding('moveDown', 'w', true);
            expect(result.success).to.be.true;
            expect(inputManager.isKeyBoundToAction('w', 'moveDown')).to.be.true;
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.false;
        });

        it('should not add duplicate keys to same action', () => {
            const result = inputManager.addKeyBinding('moveUp', 'w');
            expect(result.success).to.be.true; // Success but no duplication
            
            const keys = inputManager.getKeyBinding('moveUp');
            const wCount = keys.filter(k => k === 'w').length;
            expect(wCount).to.equal(1);
        });

        it('should remove specific key from action', () => {
            inputManager.removeKeyBinding('moveUp', 'w');
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.false;
            expect(inputManager.isKeyBoundToAction('ArrowUp', 'moveUp')).to.be.true;
        });

        it('should not remove last key from action', () => {
            // Remove all but one key
            inputManager.removeKeyBinding('moveUp', 'w');
            const result = inputManager.removeKeyBinding('moveUp', 'ArrowUp');
            
            expect(result.success).to.be.false;
            expect(inputManager.isKeyBoundToAction('ArrowUp', 'moveUp')).to.be.true;
        });

        it('should emit event when adding key', (done) => {
            EventBus.on(GameEvents.SETTING_KEYBIND_CHANGED, (action: string, keys: string[]) => {
                expect(action).to.equal('moveUp');
                expect(keys).to.include('q');
                done();
            });

            inputManager.addKeyBinding('moveUp', 'q');
        });

        it('should emit event when removing key', (done) => {
            EventBus.on(GameEvents.SETTING_KEYBIND_CHANGED, (action: string, keys: string[]) => {
                expect(action).to.equal('moveUp');
                expect(keys).to.not.include('w');
                done();
            });

            inputManager.removeKeyBinding('moveUp', 'w');
        });
    });

    describe('Reset Functionality', () => {
        it('should reset all keybinds to defaults', () => {
            // Modify some bindings
            inputManager.rebindKey('moveUp', 'i');
            inputManager.rebindKey('jump', 'k');

            // Reset
            inputManager.resetToDefaults();

            // Verify defaults restored
            expect(inputManager.getKeyBinding('moveUp')).to.deep.equal(DEFAULT_SETTINGS.keyBindings.moveUp);
            expect(inputManager.getKeyBinding('jump')).to.deep.equal(DEFAULT_SETTINGS.keyBindings.jump);
        });

    it('should emit SETTING_KEYBIND_CHANGED for all actions on reset', () => {
        const emittedActions: string[] = [];

        EventBus.on(GameEvents.SETTING_KEYBIND_CHANGED, (action: string) => {
            emittedActions.push(action);
        });

        inputManager.resetToDefaults();

        // Verify all actions were emitted
        const expectedActions = Object.keys(DEFAULT_SETTINGS.keyBindings);
        expect(emittedActions.length).to.equal(expectedActions.length);
    });        it('should save to SettingsManager on reset', () => {
            inputManager.rebindKey('moveUp', 'i');
            inputManager.resetToDefaults();

            const savedBindings = settingsManager.getKeyBindings();
            expect(savedBindings.moveUp).to.deep.equal(DEFAULT_SETTINGS.keyBindings.moveUp);
        });
    });

    describe('EventBus Integration', () => {
    it('should respond to SETTINGS_RESET event', () => {
        // Modify bindings
        inputManager.rebindKey('moveUp', 'i');

        // Trigger global reset
        EventBus.emit(GameEvents.SETTINGS_RESET);

        // Check bindings restored
        const keys = inputManager.getKeyBinding('moveUp');
        expect(keys).to.deep.equal(DEFAULT_SETTINGS.keyBindings.moveUp);
    });        it('should reload keybinds when settings reset externally', () => {
            // Modify via InputManager
            inputManager.rebindKey('moveUp', 't');
            expect(inputManager.getKeyBinding('moveUp')).to.deep.equal(['t']);

            // External reset via SettingsManager
            settingsManager.resetToDefaults();

            // InputManager should reload defaults
            const keys = inputManager.getKeyBinding('moveUp');
            expect(keys).to.deep.equal(DEFAULT_SETTINGS.keyBindings.moveUp);
        });
    });

    describe('Conflict Detection', () => {
        it('should detect all conflicting actions for a key', () => {
            const conflicts = inputManager.getConflicts('w');
            expect(conflicts).to.include('moveUp');
        });

        it('should return empty array for unbound key', () => {
            const conflicts = inputManager.getConflicts('unbound_key');
            expect(conflicts).to.be.an('array').that.is.empty;
        });

        it('should remove conflicts when using force rebind', () => {
            // 'w' is initially bound to moveUp
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.true;
            
            // Force bind 'w' to moveDown - should remove from moveUp
            inputManager.addKeyBinding('moveDown', 'w', true);
            expect(inputManager.isKeyBoundToAction('w', 'moveDown')).to.be.true;
            expect(inputManager.isKeyBoundToAction('w', 'moveUp')).to.be.false;
            
            // Force bind 'w' to jump - should remove from moveDown
            inputManager.addKeyBinding('jump', 'w', true);
            expect(inputManager.isKeyBoundToAction('w', 'jump')).to.be.true;
            expect(inputManager.isKeyBoundToAction('w', 'moveDown')).to.be.false;
            
            // At the end, 'w' should only be bound to jump
            const conflicts = inputManager.getConflicts('w');
            expect(conflicts).to.deep.equal(['jump']);
        });
    });

    describe('Action Checking', () => {
        it('should check if action is currently pressed (placeholder)', () => {
            // This will be implemented when integrating with actual input system
            const isPressed = inputManager.isActionPressed('moveUp');
            expect(isPressed).to.be.a('boolean');
        });

        it('should check if action was just pressed this frame (placeholder)', () => {
            const wasPressed = inputManager.isActionJustPressed('moveUp');
            expect(wasPressed).to.be.a('boolean');
        });

        it('should check if action was just released this frame (placeholder)', () => {
            const wasReleased = inputManager.isActionJustReleased('moveUp');
            expect(wasReleased).to.be.a('boolean');
        });
    });

    describe('Input State Tracking', () => {
        it('should update input state on key press', () => {
            inputManager.handleKeyPress('w');
            // Currently a placeholder - will verify once implemented
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
        });

        it('should update input state on key release', () => {
            inputManager.handleKeyPress('w');
            inputManager.handleKeyRelease('w');
            expect(inputManager.isActionPressed('moveUp')).to.be.false;
        });

        it('should handle multiple keys for same action', () => {
            inputManager.handleKeyPress('w');
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
            
            inputManager.handleKeyRelease('w');
            inputManager.handleKeyPress('ArrowUp');
            expect(inputManager.isActionPressed('moveUp')).to.be.true;
        });

        it('should clear just pressed flags on update', () => {
            inputManager.handleKeyPress('w');
            expect(inputManager.isActionJustPressed('moveUp')).to.be.true;
            
            inputManager.update(); // Clears "just pressed" state
            expect(inputManager.isActionJustPressed('moveUp')).to.be.false;
            expect(inputManager.isActionPressed('moveUp')).to.be.true; // Still pressed
        });

        it('should clear just released flags on update', () => {
            inputManager.handleKeyPress('w');
            inputManager.handleKeyRelease('w');
            expect(inputManager.isActionJustReleased('moveUp')).to.be.true;
            
            inputManager.update();
            expect(inputManager.isActionJustReleased('moveUp')).to.be.false;
        });
    });

    describe('Key Validation', () => {
        it('should reject empty key strings', () => {
            const result = inputManager.rebindKey('moveUp', '');
            expect(result.success).to.be.false;
        });

        it('should reject whitespace-only keys', () => {
            const result = inputManager.rebindKey('moveUp', '   ');
            expect(result.success).to.be.false;
        });

        it('should accept special keys like ArrowUp, Space, etc', () => {
            const result = inputManager.rebindKey('moveUp', 'Space');
            expect(result.success).to.be.true;
            expect(inputManager.isKeyBoundToAction('Space', 'moveUp')).to.be.true;
        });
    });

    describe('Keybind Export/Import', () => {
        it('should export all current keybinds', () => {
            const exported = inputManager.exportKeybinds();
            expect(exported).to.be.an('object');
            expect(exported.moveUp).to.deep.equal(DEFAULT_SETTINGS.keyBindings.moveUp);
        });

        it('should import keybinds from object', () => {
            const customBindings = {
                moveUp: ['i'],
                moveDown: ['k'],
                moveLeft: ['j'],
                moveRight: ['l'],
                jump: ['space'],
                interact: ['e'],
                pause: ['Escape'],
                openInventory: ['Tab']
            };

            inputManager.importKeybinds(customBindings);
            expect(inputManager.getKeyBinding('moveUp')).to.deep.equal(['i']);
            expect(inputManager.getKeyBinding('moveLeft')).to.deep.equal(['j']);
        });

        it('should emit events for all actions on import', () => {
            const customBindings = {
                moveUp: ['i'],
                moveDown: ['k'],
                moveLeft: ['j'],
                moveRight: ['l'],
                jump: ['space'],
                interact: ['e'],
                pause: ['Escape'],
                openInventory: ['Tab']
            };

            const emittedActions: string[] = [];
            EventBus.on(GameEvents.SETTING_KEYBIND_CHANGED, (action: string) => {
                emittedActions.push(action);
            });

            inputManager.importKeybinds(customBindings);

            // Verify all actions emitted
            expect(emittedActions.length).to.equal(Object.keys(customBindings).length);
        });
    });
});
