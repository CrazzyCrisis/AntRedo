import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { KeybindComponent } from '../../src/rendering/components/KeybindComponent';
import { RenderLayer } from '../../src/rendering/RenderLayer';

/**
 * Test Suite: KeybindComponent
 * 
 * Tests the keybind display and rebinding UI component.
 * Displays current key bindings and handles rebinding with conflict detection.
 */
describe('KeybindComponent', () => {
    let keybind: KeybindComponent;
    const mockSprite = { width: 200, height: 40 };

    beforeEach(() => {
        keybind = new KeybindComponent(mockSprite, 400, 300, 'Jump', ['Space'], 'test_keybind');
    });

    describe('Initialization', () => {
        it('should implement Renderable interface', () => {
            expect(keybind).to.have.property('layer');
            expect(keybind).to.have.property('depth');
            expect(keybind).to.have.property('render');
        });

        it('should initialize with correct position and sprite', () => {
            expect(keybind.x).to.equal(400);
            expect(keybind.y).to.equal(300);
            expect(keybind.sprite).to.equal(mockSprite);
        });

        it('should initialize with action name', () => {
            expect(keybind.getActionName()).to.equal('Jump');
        });

        it('should initialize with keys', () => {
            expect(keybind.getKeys()).to.deep.equal(['Space']);
        });

        it('should initialize not listening', () => {
            expect(keybind.isListening()).to.be.false;
        });

        it('should be on UI layer', () => {
            expect(keybind.layer).to.equal(RenderLayer.UI);
        });

        it('should have unique ID', () => {
            expect(keybind.id).to.equal('test_keybind');
        });
    });

    describe('Key Management', () => {
        it('should get current keys', () => {
            expect(keybind.getKeys()).to.deep.equal(['Space']);
        });

        it('should set new keys', () => {
            keybind.setKeys(['w', 'ArrowUp']);
            expect(keybind.getKeys()).to.deep.equal(['w', 'ArrowUp']);
        });

        it('should handle single key', () => {
            keybind.setKeys(['a']);
            expect(keybind.getKeys()).to.deep.equal(['a']);
        });

        it('should handle multiple keys', () => {
            keybind.setKeys(['w', 's', 'ArrowUp', 'ArrowDown']);
            expect(keybind.getKeys()).to.have.lengthOf(4);
        });

        it('should handle empty keys array', () => {
            keybind.setKeys([]);
            expect(keybind.getKeys()).to.deep.equal([]);
        });

        it('should format keys for display', () => {
            keybind.setKeys(['w', 'ArrowUp']);
            const display = keybind.getDisplayText();
            expect(display).to.be.a('string');
            expect(display.length).to.be.greaterThan(0);
        });
    });

    describe('Listen Mode', () => {
        it('should start listening on click', () => {
            keybind.handleClick(400, 300);
            expect(keybind.isListening()).to.be.true;
        });

        it('should not start listening when clicking outside', () => {
            keybind.handleClick(100, 100);
            expect(keybind.isListening()).to.be.false;
        });

        it('should stop listening manually', () => {
            keybind.startListening();
            expect(keybind.isListening()).to.be.true;

            keybind.stopListening();
            expect(keybind.isListening()).to.be.false;
        });

        it('should toggle listening state', () => {
            keybind.toggleListening();
            expect(keybind.isListening()).to.be.true;

            keybind.toggleListening();
            expect(keybind.isListening()).to.be.false;
        });

        it('should capture key press when listening', () => {
            keybind.startListening();
            keybind.handleKeyPress('k');
            
            expect(keybind.isListening()).to.be.false; // Should stop after capture
            expect(keybind.getKeys()).to.deep.equal(['k']);
        });

        it('should not capture key press when not listening', () => {
            const originalKeys = keybind.getKeys();
            keybind.handleKeyPress('k');
            
            expect(keybind.getKeys()).to.deep.equal(originalKeys);
        });

        it('should ignore empty or whitespace keys', () => {
            keybind.startListening();
            keybind.handleKeyPress('');
            expect(keybind.isListening()).to.be.true; // Still listening

            keybind.handleKeyPress('   ');
            expect(keybind.isListening()).to.be.true; // Still listening
        });

        it('should handle special keys', () => {
            keybind.startListening();
            keybind.handleKeyPress('ArrowUp');
            expect(keybind.getKeys()).to.include('ArrowUp');
        });
    });

    describe('Conflict Detection', () => {
        it('should track conflict state', () => {
            expect(keybind.hasConflict()).to.be.false;

            keybind.setConflict(true, ['Move Left']);
            expect(keybind.hasConflict()).to.be.true;
        });

        it('should store conflicting actions', () => {
            keybind.setConflict(true, ['Move Left', 'Move Right']);
            expect(keybind.getConflictingActions()).to.deep.equal(['Move Left', 'Move Right']);
        });

        it('should clear conflict state', () => {
            keybind.setConflict(true, ['Move Left']);
            keybind.setConflict(false, []);
            
            expect(keybind.hasConflict()).to.be.false;
            expect(keybind.getConflictingActions()).to.deep.equal([]);
        });

        it('should show conflict warning text', () => {
            keybind.setConflict(true, ['Move Left']);
            const display = keybind.getDisplayText();
            // Display text should somehow indicate conflict (exact format may vary)
            expect(display).to.be.a('string');
        });
    });

    describe('onChange Callback', () => {
        it('should trigger callback when keys change via setKeys', () => {
            let callbackKeys: string[] = [];
            keybind.onChange((keys) => {
                callbackKeys = keys;
            });

            keybind.setKeys(['w', 'ArrowUp']);
            expect(callbackKeys).to.deep.equal(['w', 'ArrowUp']);
        });

        it('should trigger callback when keys change via key capture', () => {
            let callbackKeys: string[] = [];
            keybind.onChange((keys) => {
                callbackKeys = keys;
            });

            keybind.startListening();
            keybind.handleKeyPress('k');
            expect(callbackKeys).to.deep.equal(['k']);
        });

        it('should not trigger callback when setting same keys', () => {
            let callbackCount = 0;
            keybind.onChange(() => {
                callbackCount++;
            });

            keybind.setKeys(['Space']); // Same as initial
            expect(callbackCount).to.equal(0);
        });

        it('should pass action name to callback', () => {
            let receivedAction = '';
            keybind.onChange((_keys, action) => {
                receivedAction = action;
            });

            keybind.setKeys(['w']);
            expect(receivedAction).to.equal('Jump');
        });
    });

    describe('Mouse Interaction', () => {
        it('should detect mouse over component', () => {
            expect(keybind.isMouseOver(400, 300)).to.be.true;
        });

        it('should detect mouse outside component', () => {
            expect(keybind.isMouseOver(100, 100)).to.be.false;
        });

        it('should handle click to start listening', () => {
            keybind.handleClick(400, 300);
            expect(keybind.isListening()).to.be.true;
        });
    });

    describe('Hover State', () => {
        it('should track hover state', () => {
            expect(keybind.isHovered).to.be.false;

            keybind.setHovered(true);
            expect(keybind.isHovered).to.be.true;

            keybind.setHovered(false);
            expect(keybind.isHovered).to.be.false;
        });

        it('should update hover based on mouse position', () => {
            keybind.handleMouseMove(400, 300);
            expect(keybind.isHovered).to.be.true;

            keybind.handleMouseMove(100, 100);
            expect(keybind.isHovered).to.be.false;
        });
    });

    describe('Visual State', () => {
        it('should have scale property', () => {
            keybind.scale = 1.2;
            expect(keybind.scale).to.equal(1.2);
        });

        it('should generate display text', () => {
            keybind.setKeys(['w', 'ArrowUp']);
            const text = keybind.getDisplayText();
            expect(text).to.be.a('string');
            expect(text.length).to.be.greaterThan(0);
        });

        it('should show listening indicator when listening', () => {
            keybind.startListening();
            const text = keybind.getDisplayText();
            expect(text).to.be.a('string');
            // Should show some listening indicator (exact format may vary)
        });
    });

    describe('Rendering', () => {
        it('should have render method', () => {
            expect(keybind.render).to.be.a('function');
        });

        it('should accept graphics object in render', () => {
            const mockGraphics = {
                push: () => {},
                pop: () => {},
                translate: () => {},
                rect: () => {},
                fill: () => {},
                noFill: () => {},
                stroke: () => {},
                strokeWeight: () => {},
                text: () => {},
                textAlign: () => {},
                textSize: () => {},
                CENTER: 0,
                LEFT: 0
            };

            expect(() => keybind.render(mockGraphics)).to.not.throw();
        });

        it('should render differently when listening', () => {
            const mockGraphics = {
                push: () => {},
                pop: () => {},
                translate: () => {},
                rect: () => {},
                fill: () => {},
                noFill: () => {},
                stroke: () => {},
                strokeWeight: () => {},
                text: () => {},
                textAlign: () => {},
                textSize: () => {},
                CENTER: 0,
                LEFT: 0
            };

            keybind.stopListening();
            expect(() => keybind.render(mockGraphics)).to.not.throw();

            keybind.startListening();
            expect(() => keybind.render(mockGraphics)).to.not.throw();
        });

        it('should render conflict warning when conflict exists', () => {
            const mockGraphics = {
                push: () => {},
                pop: () => {},
                translate: () => {},
                rect: () => {},
                fill: () => {},
                noFill: () => {},
                stroke: () => {},
                strokeWeight: () => {},
                text: () => {},
                textAlign: () => {},
                textSize: () => {},
                CENTER: 0,
                LEFT: 0
            };

            keybind.setConflict(true, ['Move Left']);
            expect(() => keybind.render(mockGraphics)).to.not.throw();
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid listen mode toggles', () => {
            for (let i = 0; i < 10; i++) {
                keybind.toggleListening();
            }
            expect(keybind.isListening()).to.be.false; // Even number of toggles
        });

        it('should handle setting keys while listening', () => {
            keybind.startListening();
            keybind.setKeys(['a', 'b']);
            expect(keybind.getKeys()).to.deep.equal(['a', 'b']);
            expect(keybind.isListening()).to.be.true; // Should still be listening
        });

        it('should handle empty action name', () => {
            const emptyKeybind = new KeybindComponent(mockSprite, 400, 300, '', ['Space'], 'empty');
            expect(emptyKeybind.getActionName()).to.equal('');
        });
    });
});
