import { expect } from 'chai';
import { ControlsScene } from '../../src/scenes/ControlsScene';
import { Renderer } from '../../src/rendering/Renderer';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { InputManager } from '../../src/managers/InputManager';
import { SettingsManager } from '../../src/managers/SettingsManager';
import { EventBus, GameEvents } from '../../src/utils/eventBus';

// Mock p5.Graphics
const createMockGraphics = () => ({
    background: () => {},
    fill: () => {},
    rect: () => {},
    ellipse: () => {},
    stroke: () => {},
    strokeWeight: () => {},
    noStroke: () => {},
    push: () => {},
    pop: () => {},
    textAlign: () => {},
    textSize: () => {},
    text: () => {},
    circle: () => {},
    arc: () => {},
    triangle: () => {},
    createGraphics: (_w: number, _h: number) => createMockGraphics(),
    CENTER: 'center',
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top',
    BOTTOM: 'bottom',
});

describe('ControlsScene', () => {
    let scene: ControlsScene;
    let renderer: Renderer;
    let inputManager: InputManager;
    let settingsManager: SettingsManager;
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;

    // Mock sprites
    const mockKeybindSprite = { width: 200, height: 40 };
    const mockButtonSprite = { width: 100, height: 40 };

    beforeEach(() => {
        // Clear EventBus
        EventBus.clear();

        // Reset localStorage
        (global as any).localStorage = {
            data: {} as Record<string, string>,
            getItem(key: string): string | null {
                return this.data[key] || null;
            },
            setItem(key: string, value: string): void {
                this.data[key] = value;
            },
            removeItem(key: string): void {
                delete this.data[key];
            },
            clear(): void {
                this.data = {};
            }
        };

        // Create SettingsManager first (singleton)
        (SettingsManager as any).instance = null;
        settingsManager = SettingsManager.getInstance();

        // Create InputManager (singleton)
        (InputManager as any).instance = null;
        inputManager = InputManager.getInstance();

        // Create renderer
        renderer = new Renderer(createMockGraphics() as any, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Create scene with mock sprites
        scene = new ControlsScene(renderer, CANVAS_WIDTH, CANVAS_HEIGHT, {
            keybindSprite: mockKeybindSprite,
            buttonSprite: mockButtonSprite
        });
    });

    afterEach(() => {
        EventBus.clear();
    });

    describe('Scene Lifecycle', () => {
        it('should implement IScene interface', () => {
            expect(scene).to.have.property('enter');
            expect(scene).to.have.property('exit');
            expect(scene).to.have.property('update');
            expect(scene).to.have.property('handleMouseClick');
            expect(scene).to.have.property('handleMouseMove');
        });

        it('should create components on enter()', () => {
            scene.enter();
            expect(scene['keybindComponents']).to.be.an('array');
            expect(scene['keybindComponents'].length).to.be.greaterThan(0);
            expect(scene['backButton']).to.exist;
        });

        it('should register components with renderer on enter()', () => {
            const initialRenderables = renderer['renderables'].get(RenderLayer.UI)?.length || 0;
            scene.enter();
            renderer['renderables'].get(RenderLayer.UI)?.length || 0;
            expect(renderer['renderables'].get(RenderLayer.UI)?.length || 0).to.be.greaterThan(initialRenderables);
        });

        it('should unregister components on exit()', () => {
            scene.enter();
            renderer['renderables'].get(RenderLayer.UI)?.length || 0;
            scene.exit();
            const afterExit = renderer['renderables'].get(RenderLayer.UI)?.length || 0;
            expect(afterExit).to.equal(0);
        });

        it('should clean up event listeners on exit()', () => {
            scene.enter();
            const listenersBefore = EventBus.listenerCount(GameEvents.SETTING_KEYBIND_CHANGED);
            scene.exit();
            const listenersAfter = EventBus.listenerCount(GameEvents.SETTING_KEYBIND_CHANGED);
            expect(listenersAfter).to.be.lessThan(listenersBefore);
        });
    });

    describe('Component Initialization', () => {
        it('should create keybind component for moveUp action', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            expect(moveUpKeybind).to.exist;
            expect(moveUpKeybind?.getKeys()).to.deep.equal(['w', 'ArrowUp']);
        });

        it('should create keybind component for moveDown action', () => {
            scene.enter();
            const moveDownKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveDown');
            expect(moveDownKeybind).to.exist;
            expect(moveDownKeybind?.getKeys()).to.deep.equal(['s', 'ArrowDown']);
        });

        it('should create keybind component for moveLeft action', () => {
            scene.enter();
            const moveLeftKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveLeft');
            expect(moveLeftKeybind).to.exist;
            expect(moveLeftKeybind?.getKeys()).to.deep.equal(['a', 'ArrowLeft']);
        });

        it('should create keybind component for moveRight action', () => {
            scene.enter();
            const moveRightKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveRight');
            expect(moveRightKeybind).to.exist;
            expect(moveRightKeybind?.getKeys()).to.deep.equal(['d', 'ArrowRight']);
        });

        it('should create keybind components for all actions', () => {
            scene.enter();
            const expectedActions = ['moveUp', 'moveDown', 'moveLeft', 'moveRight', 'interact', 'openInventory', 'pause'];
            const actualActions = scene['keybindComponents'].map(k => k.getActionName());
            expectedActions.forEach(action => {
                expect(actualActions).to.include(action);
            });
        });

        it('should position components using layout constants', () => {
            scene.enter();
            // Just verify components have positions (layout constants control exact positions)
            scene['keybindComponents'].forEach(keybind => {
                expect(keybind.x).to.be.a('number');
                expect(keybind.y).to.be.a('number');
            });
        });
    });

    describe('InputManager Integration', () => {
        it('should update InputManager when keybind changes', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            expect(moveUpKeybind).to.exist;

            // Simulate keybind change
            moveUpKeybind!.setKeys(['t']);

            // Verify InputManager updated
            expect(inputManager.getKeyBinding('moveUp')).to.deep.equal(['t']);
        });

        it('should detect conflicts with InputManager', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Initially 's' is bound to moveDown
            let conflicts = inputManager.getConflicts('s');
            expect(conflicts).to.include('moveDown');
            expect(conflicts).to.not.include('moveUp');
            
            // After rebinding moveUp to 's' with force=true, 's' should only be in moveUp
            moveUpKeybind!.setKeys(['s']);
            conflicts = inputManager.getConflicts('s');
            expect(conflicts).to.include('moveUp');
            // Note: force=true in rebind removes 's' from moveDown, so only moveUp has it now
        });

        it('should update keybind component when InputManager changes externally', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Change keybind externally via InputManager
            inputManager.rebindKey('moveUp', 'g', true);

            // Emit settings change event
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');

            // Verify component updated
            expect(moveUpKeybind!.getKeys()).to.deep.equal(['g']);
        });

        it('should handle keybind reset', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Change keybind
            moveUpKeybind!.setKeys(['x']);
            expect(inputManager.getKeyBinding('moveUp')).to.deep.equal(['x']);

            // Reset all keybinds
            inputManager.resetToDefaults();

            // Emit settings change event
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');

            // Verify component reset to defaults
            expect(moveUpKeybind!.getKeys()).to.deep.equal(['w', 'ArrowUp']);
        });

        it('should save keybind changes to SettingsManager', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Change keybind
            moveUpKeybind!.setKeys(['y']);

            // Verify SettingsManager has updated keybinds
            const settings = settingsManager.getAllSettings();
            expect(settings.keyBindings.moveUp).to.deep.equal(['y']);
        });

        it('should load initial keybinds from InputManager', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Verify initial keys match InputManager
            const inputManagerKeys = inputManager.getKeyBinding('moveUp');
            expect(moveUpKeybind!.getKeys()).to.deep.equal(inputManagerKeys);
        });
    });

    describe('EventBus Integration', () => {
        it('should listen to SETTING_KEYBIND_CHANGED events', () => {
            scene.enter();
            const listenerCount = EventBus.listenerCount(GameEvents.SETTING_KEYBIND_CHANGED);
            expect(listenerCount).to.be.greaterThan(0);
        });

        it('should sync components when SETTING_KEYBIND_CHANGED is emitted', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Change keybind externally
            inputManager.rebindKey('moveUp', 'z', true);
            
            // Emit event
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');

            // Verify component synced
            expect(moveUpKeybind!.getKeys()).to.deep.equal(['z']);
        });

        it('should emit MENU_BACK_CLICKED when back button clicked', () => {
            let emitted = false;
            EventBus.on(GameEvents.MENU_BACK_CLICKED, () => emitted = true);
            
            scene.enter();
            
            // Simulate back button click
            const backButton = scene['backButton'];
            const x = backButton.x;
            const y = backButton.y;
            scene.handleMouseClick(x, y);

            expect(emitted).to.be.true;
        });

        it('should not emit events when clicking empty space', () => {
            let backEmitted = false;
            EventBus.on(GameEvents.MENU_BACK_CLICKED, () => backEmitted = true);
            
            scene.enter();
            scene.handleMouseClick(0, 0); // Top-left corner

            expect(backEmitted).to.be.false;
        });
    });

    describe('Mouse interaction', () => {
        it('should handle hover on keybind components', () => {
            scene.enter();
            const keybind = scene['keybindComponents'][0];
            
            scene.handleMouseMove(keybind.x, keybind.y);
            
            expect(keybind['isHovered']).to.be.true;
        });

        it('should handle hover exit on keybind components', () => {
            scene.enter();
            const keybind = scene['keybindComponents'][0];
            
            scene.handleMouseMove(keybind.x, keybind.y);
            expect(keybind['isHovered']).to.be.true;
            
            scene.handleMouseMove(0, 0);
            expect(keybind['isHovered']).to.be.false;
        });

        it('should start listening mode on keybind click', () => {
            scene.enter();
            const keybind = scene['keybindComponents'][0];
            
            scene.handleMouseClick(keybind.x, keybind.y);
            
            expect(keybind['listening']).to.be.true;
        });

        it('should stop listening mode on second click', () => {
            scene.enter();
            const keybind = scene['keybindComponents'][0];
            
            scene.handleMouseClick(keybind.x, keybind.y); // Start listening
            expect(keybind['listening']).to.be.true;
            
            scene.handleMouseClick(keybind.x, keybind.y); // Stop listening
            expect(keybind['listening']).to.be.false;
        });

        it('should handle back button click', () => {
            scene.enter();
            const backButton = scene['backButton'];
            
            let clicked = false;
            EventBus.on(GameEvents.MENU_BACK_CLICKED, () => clicked = true);
            
            scene.handleMouseClick(backButton.x, backButton.y);
            
            expect(clicked).to.be.true;
        });

        it('should handle back button hover', () => {
            scene.enter();
            const backButton = scene['backButton'];
            
            scene.handleMouseMove(backButton.x, backButton.y);
            
            expect(backButton['isHovered']).to.be.true;
        });

        it('should handle multiple keybind hovers', () => {
            scene.enter();
            const keybind1 = scene['keybindComponents'][0];
            const keybind2 = scene['keybindComponents'][1];
            
            scene.handleMouseMove(keybind1.x, keybind1.y);
            expect(keybind1['isHovered']).to.be.true;
            expect(keybind2['isHovered']).to.be.false;
            
            scene.handleMouseMove(keybind2.x, keybind2.y);
            expect(keybind1['isHovered']).to.be.false;
            expect(keybind2['isHovered']).to.be.true;
        });

        it('should only allow one keybind in listening mode at a time', () => {
            scene.enter();
            const keybind1 = scene['keybindComponents'][0];
            const keybind2 = scene['keybindComponents'][1];
            
            scene.handleMouseClick(keybind1.x, keybind1.y); // Start listening on keybind1
            expect(keybind1['listening']).to.be.true;
            
            scene.handleMouseClick(keybind2.x, keybind2.y); // Start listening on keybind2
            // handleMouseClick calls handleClick on keybind2 (which toggles it to listening)
            // Then the "stop all others" logic stops keybind1
            expect(keybind1['listening']).to.be.false;
            expect(keybind2['listening']).to.be.true;
        });
    });

    describe('Update Loop', () => {
        it('should update button pulse animations', () => {
            scene.enter();
            const backButton = scene['backButton'];
            
            // Hover to enable pulse
            scene.handleMouseMove(backButton.x, backButton.y);
            
            const scaleBefore = backButton.getPulseScale();
            scene.update();
            const scaleAfter = backButton.getPulseScale();
            
            expect(scaleAfter).to.not.equal(scaleBefore);
        });
    });

    describe('Persistence', () => {
        it('should persist keybind changes to localStorage', () => {
            scene.enter();
            
            // Simulate user rebinding (goes through InputManager)
            inputManager.rebindKey('moveUp', 'm', true);

            // Check localStorage via SettingsManager
            const settings = settingsManager.getKeyBindings();
            expect(settings.moveUp).to.deep.equal(['m']);
        });

        it('should load keybinds from localStorage on scene enter', () => {
            // Set custom keybind via SettingsManager (proper way)
            settingsManager.setKeyBindings({
                moveUp: ['j'],
                moveDown: ['k'],
                moveLeft: ['h'],
                moveRight: ['l'],
                interact: ['e'],
                openInventory: ['i'],
                pause: ['Escape'],
                jump: [' ']
            });

            // Reload InputManager to pick up changes
            (SettingsManager as any).instance = null;
            settingsManager = SettingsManager.getInstance();
            (InputManager as any).instance = null;
            inputManager = InputManager.getInstance();

            // Create new scene
            const newRenderer = new Renderer(createMockGraphics() as any, CANVAS_WIDTH, CANVAS_HEIGHT);
            const newScene = new ControlsScene(newRenderer, CANVAS_WIDTH, CANVAS_HEIGHT, {
                keybindSprite: mockKeybindSprite,
                buttonSprite: mockButtonSprite
            });
            
            newScene.enter();
            
            const moveUpKeybind = newScene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            expect(moveUpKeybind!.getKeys()).to.deep.equal(['j']);
        });
    });

    describe('Conflict Handling', () => {
        it('should show conflict warning when binding conflicts', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Manually add 's' to moveUp WITHOUT force to create conflict
            inputManager.addKeyBinding('moveUp', 's', false);
            // Now 's' is in both moveUp and moveDown
            
            // Sync the keybind to update UI
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');

            // Check for conflict state using method
            expect(moveUpKeybind!.hasConflict()).to.be.true;
        });

        it('should show conflicting action names', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Rebind both actions to 'z' - the second one will create a conflict
            inputManager.rebindKey('moveUp', 'z', true); // moveUp = ['z']
            inputManager.rebindKey('moveDown', 'z', true); // moveDown = ['z'], removes from moveUp
            // Now only moveDown has 'z', so no conflict exists!
            
            // Different approach: add without removing
            // Start fresh: rebind moveUp to unique key 'z'
            inputManager.rebindKey('moveUp', 'z', true); // moveUp = ['z'] only
            // Force-add 'z' to moveDown (this removes from moveUp!)
            // We need addKeyBinding without it removing from others
            
            // The real issue: force=true in addKeyBinding removes the key from other actions!
            // We need to manually set the keybindings to create a conflict state
            // Let's directly manipulate InputManager state
            const currentMoveDown = inputManager.getKeyBinding('moveDown');
            inputManager['keyBindings'].moveDown = [...currentMoveDown, 'z'];
            // Now manually trigger the event
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');

            const conflicts = moveUpKeybind!.getConflictingActions();
            expect(conflicts).to.include('moveDown');
        });

        it('should clear conflict warning when conflict resolved', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Create conflict
            inputManager.addKeyBinding('moveUp', 's', false);
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');
            expect(moveUpKeybind!.hasConflict()).to.be.true;
            
            // Resolve conflict by rebinding to a unique key
            inputManager.rebindKey('moveUp', 'm', true);
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');
            expect(moveUpKeybind!.hasConflict()).to.be.false;
        });

        it('should update conflict status on external keybind change', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Set key that will conflict when another action changes
            moveUpKeybind!.setKeys(['x']);
            expect(moveUpKeybind!.hasConflict()).to.be.false;

            // Change another action to conflict
            inputManager.rebindKey('moveDown', 'x', true);
            // Emit event for moveDown change
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveDown');
            
            // Also need to sync moveUp to detect the conflict!
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');

            // Verify conflict detected
            expect(moveUpKeybind!.hasConflict()).to.be.true;
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid keybind changes', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            moveUpKeybind!.setKeys(['a']);
            moveUpKeybind!.setKeys(['b']);
            moveUpKeybind!.setKeys(['c']);
            moveUpKeybind!.setKeys(['d']);
            
            expect(inputManager.getKeyBinding('moveUp')).to.deep.equal(['d']);
        });

        it('should handle clicking outside all components', () => {
            scene.enter();
            
            // Should not throw
            expect(() => scene.handleMouseClick(-100, -100)).to.not.throw();
        });

        it('should handle multiple enter/exit cycles', () => {
            scene.enter();
            scene.exit();
            scene.enter();
            scene.exit();
            scene.enter();
            
            expect(scene['keybindComponents'].length).to.be.greaterThan(0);
            expect(scene['backButton']).to.exist;
        });

        it('should handle scene sync when settings reset', () => {
            scene.enter();
            const moveUpKeybind = scene['keybindComponents'].find((k: any) => k.getActionName() === 'moveUp');
            
            // Change keybind
            moveUpKeybind!.setKeys(['z']);
            expect(moveUpKeybind!.getKeys()).to.deep.equal(['z']);

            // Reset settings
            settingsManager.resetSettings();
            EventBus.emit(GameEvents.SETTING_KEYBIND_CHANGED, 'moveUp');

            // Verify component reset
            expect(moveUpKeybind!.getKeys()).to.deep.equal(['w', 'ArrowUp']);
        });

        it('should handle empty key input gracefully', () => {
            scene.enter();
            const keybind = scene['keybindComponents'][0];
            
            // Try to set empty key (should be ignored by KeybindComponent)
            keybind.setKeys(['']);
            
            // Should still have valid keys
            expect(keybind.getKeys().length).to.be.greaterThan(0);
        });
    });
});
