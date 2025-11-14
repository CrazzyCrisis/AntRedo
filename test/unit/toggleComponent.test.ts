import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { ToggleComponent } from '../../src/rendering/components/ToggleComponent';
import { RenderLayer } from '../../src/rendering/RenderLayer';

/**
 * Test Suite: ToggleComponent
 * 
 * Tests the boolean toggle switch UI component.
 * Used for enable/disable settings like mute, effects, etc.
 */
describe('ToggleComponent', () => {
    let toggle: ToggleComponent;
    const mockSprite = { width: 50, height: 30 };

    beforeEach(() => {
        toggle = new ToggleComponent(mockSprite, 400, 300, false, 'test_toggle');
    });

    describe('Initialization', () => {
        it('should implement Renderable interface', () => {
            expect(toggle).to.have.property('layer');
            expect(toggle).to.have.property('depth');
            expect(toggle).to.have.property('render');
        });

        it('should initialize with correct position and sprite', () => {
            expect(toggle.x).to.equal(400);
            expect(toggle.y).to.equal(300);
            expect(toggle.sprite).to.equal(mockSprite);
        });

        it('should initialize with off state', () => {
            expect(toggle.isOn()).to.be.false;
        });

        it('should initialize with on state when specified', () => {
            const onToggle = new ToggleComponent(mockSprite, 400, 300, true, 'on_toggle');
            expect(onToggle.isOn()).to.be.true;
        });

        it('should be on UI layer', () => {
            expect(toggle.layer).to.equal(RenderLayer.UI);
        });

        it('should have unique ID', () => {
            expect(toggle.id).to.equal('test_toggle');
        });
    });

    describe('State Management', () => {
        it('should get current state', () => {
            expect(toggle.isOn()).to.be.false;
        });

        it('should turn on', () => {
            toggle.setOn(true);
            expect(toggle.isOn()).to.be.true;
        });

        it('should turn off', () => {
            toggle.setOn(true);
            toggle.setOn(false);
            expect(toggle.isOn()).to.be.false;
        });

        it('should toggle state from off to on', () => {
            expect(toggle.isOn()).to.be.false;
            toggle.toggle();
            expect(toggle.isOn()).to.be.true;
        });

        it('should toggle state from on to off', () => {
            toggle.setOn(true);
            expect(toggle.isOn()).to.be.true;
            toggle.toggle();
            expect(toggle.isOn()).to.be.false;
        });

        it('should toggle multiple times', () => {
            toggle.toggle(); // off -> on
            toggle.toggle(); // on -> off
            toggle.toggle(); // off -> on
            expect(toggle.isOn()).to.be.true;
        });
    });

    describe('Mouse Interaction', () => {
        it('should detect mouse over toggle', () => {
            expect(toggle.isMouseOver(400, 300)).to.be.true;
        });

        it('should detect mouse outside toggle', () => {
            expect(toggle.isMouseOver(100, 100)).to.be.false;
        });

        it('should detect mouse at toggle edges', () => {
            // Left edge (x = 400 - 50/2 = 375)
            expect(toggle.isMouseOver(375, 300)).to.be.true;
            // Right edge (x = 400 + 50/2 = 425)
            expect(toggle.isMouseOver(425, 300)).to.be.true;
        });

        it('should toggle on click', () => {
            expect(toggle.isOn()).to.be.false;
            toggle.handleClick(400, 300);
            expect(toggle.isOn()).to.be.true;
        });

        it('should not toggle when clicking outside', () => {
            const initialState = toggle.isOn();
            toggle.handleClick(100, 100);
            expect(toggle.isOn()).to.equal(initialState);
        });

        it('should toggle multiple times on repeated clicks', () => {
            toggle.handleClick(400, 300); // off -> on
            toggle.handleClick(400, 300); // on -> off
            toggle.handleClick(400, 300); // off -> on
            expect(toggle.isOn()).to.be.true;
        });
    });

    describe('onChange Callback', () => {
        it('should trigger callback when state changes via setOn', () => {
            let callbackState = false;
            toggle.onChange((state) => {
                callbackState = state;
            });

            toggle.setOn(true);
            expect(callbackState).to.be.true;
        });

        it('should trigger callback when state changes via toggle', () => {
            let callbackState = false;
            toggle.onChange((state) => {
                callbackState = state;
            });

            toggle.toggle();
            expect(callbackState).to.be.true;
        });

        it('should trigger callback when state changes via click', () => {
            let callbackState = false;
            toggle.onChange((state) => {
                callbackState = state;
            });

            toggle.handleClick(400, 300);
            expect(callbackState).to.be.true;
        });

        it('should not trigger callback when setting to same state', () => {
            let callbackCount = 0;
            toggle.onChange(() => {
                callbackCount++;
            });

            toggle.setOn(false); // Same as initial state
            expect(callbackCount).to.equal(0);
        });

        it('should pass new state to callback', () => {
            let receivedState = false;
            toggle.onChange((state) => {
                receivedState = state;
            });

            toggle.setOn(true);
            expect(receivedState).to.be.true;

            toggle.setOn(false);
            expect(receivedState).to.be.false;
        });

        it('should trigger callback on multiple toggles', () => {
            let callbackCount = 0;
            toggle.onChange(() => {
                callbackCount++;
            });

            toggle.toggle();
            toggle.toggle();
            toggle.toggle();
            expect(callbackCount).to.equal(3);
        });
    });

    describe('Hover State', () => {
        it('should track hover state', () => {
            expect(toggle.isHovered).to.be.false;

            toggle.setHovered(true);
            expect(toggle.isHovered).to.be.true;

            toggle.setHovered(false);
            expect(toggle.isHovered).to.be.false;
        });

        it('should update hover based on mouse position', () => {
            toggle.handleMouseMove(400, 300);
            expect(toggle.isHovered).to.be.true;

            toggle.handleMouseMove(100, 100);
            expect(toggle.isHovered).to.be.false;
        });
    });

    describe('Visual State', () => {
        it('should have scale property', () => {
            toggle.scale = 2.0;
            expect(toggle.scale).to.equal(2.0);
        });

        it('should affect mouse detection with scale', () => {
            toggle.scale = 2.0;
            
            // With scale 2.0, width is 100 (50 * 2)
            // So edges are at 400 ± 50 = 350 and 450
            expect(toggle.isMouseOver(350, 300)).to.be.true;
            expect(toggle.isMouseOver(450, 300)).to.be.true;
        });
    });

    describe('Rendering', () => {
        it('should have render method', () => {
            expect(toggle.render).to.be.a('function');
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
                ellipse: () => {}
            };

            expect(() => toggle.render(mockGraphics)).to.not.throw();
        });

        it('should render differently for on/off states', () => {
            const mockGraphics = {
                push: () => {},
                pop: () => {},
                translate: () => {},
                rect: () => {},
                fill: () => {},
                noFill: () => {},
                stroke: () => {},
                strokeWeight: () => {},
                ellipse: () => {}
            };

            // Should not throw for either state
            toggle.setOn(false);
            expect(() => toggle.render(mockGraphics)).to.not.throw();

            toggle.setOn(true);
            expect(() => toggle.render(mockGraphics)).to.not.throw();
        });
    });

    describe('Label Support', () => {
        it('should support label text', () => {
            toggle.setLabel('Music Volume');
            expect(toggle.getLabel()).to.equal('Music Volume');
        });

        it('should initialize without label', () => {
            expect(toggle.getLabel()).to.equal('');
        });

        it('should allow changing label', () => {
            toggle.setLabel('Label 1');
            expect(toggle.getLabel()).to.equal('Label 1');

            toggle.setLabel('Label 2');
            expect(toggle.getLabel()).to.equal('Label 2');
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid clicks', () => {
            for (let i = 0; i < 100; i++) {
                toggle.handleClick(400, 300);
            }
            // Should be off after even number of clicks
            expect(toggle.isOn()).to.be.false;
        });

        it('should handle simultaneous state changes', () => {
            toggle.setOn(true);
            toggle.toggle();
            toggle.setOn(false);
            expect(toggle.isOn()).to.be.false;
        });
    });
});
