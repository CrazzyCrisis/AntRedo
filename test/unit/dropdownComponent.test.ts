import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { DropdownComponent } from '../../src/rendering/components/DropdownComponent';
import { RenderLayer } from '../../src/rendering/RenderLayer';

/**
 * Test Suite: DropdownComponent
 * 
 * Tests the dropdown selection UI component.
 * Used for multi-choice settings like colorblind modes, text sizes, etc.
 */
describe('DropdownComponent', () => {
    let dropdown: DropdownComponent;
    const mockSprite = { width: 150, height: 30 };
    const testOptions = ['Option 1', 'Option 2', 'Option 3'];

    beforeEach(() => {
        dropdown = new DropdownComponent(mockSprite, 400, 300, testOptions, 'test_dropdown');
    });

    describe('Initialization', () => {
        it('should implement Renderable interface', () => {
            expect(dropdown).to.have.property('layer');
            expect(dropdown).to.have.property('depth');
            expect(dropdown).to.have.property('render');
        });

        it('should initialize with correct position and sprite', () => {
            expect(dropdown.x).to.equal(400);
            expect(dropdown.y).to.equal(300);
            expect(dropdown.sprite).to.equal(mockSprite);
        });

        it('should initialize with provided options', () => {
            expect(dropdown.getOptions()).to.deep.equal(testOptions);
        });

        it('should initialize with first option selected', () => {
            expect(dropdown.getSelectedIndex()).to.equal(0);
            expect(dropdown.getSelectedValue()).to.equal('Option 1');
        });

        it('should initialize collapsed', () => {
            expect(dropdown.isExpanded()).to.be.false;
        });

        it('should be on UI layer', () => {
            expect(dropdown.layer).to.equal(RenderLayer.UI);
        });

        it('should have unique ID', () => {
            expect(dropdown.id).to.equal('test_dropdown');
        });
    });

    describe('Option Management', () => {
        it('should get all options', () => {
            const options = dropdown.getOptions();
            expect(options).to.deep.equal(testOptions);
        });

        it('should get options count', () => {
            expect(dropdown.getOptionsCount()).to.equal(3);
        });

        it('should handle empty options array', () => {
            const emptyDropdown = new DropdownComponent(mockSprite, 400, 300, [], 'empty');
            expect(emptyDropdown.getOptionsCount()).to.equal(0);
            expect(emptyDropdown.getSelectedIndex()).to.equal(-1);
        });

        it('should handle single option', () => {
            const singleDropdown = new DropdownComponent(mockSprite, 400, 300, ['Only One'], 'single');
            expect(singleDropdown.getOptionsCount()).to.equal(1);
            expect(singleDropdown.getSelectedValue()).to.equal('Only One');
        });
    });

    describe('Selection Management', () => {
        it('should get selected index', () => {
            expect(dropdown.getSelectedIndex()).to.equal(0);
        });

        it('should get selected value', () => {
            expect(dropdown.getSelectedValue()).to.equal('Option 1');
        });

        it('should set selected index', () => {
            dropdown.setSelectedIndex(1);
            expect(dropdown.getSelectedIndex()).to.equal(1);
            expect(dropdown.getSelectedValue()).to.equal('Option 2');
        });

        it('should set selected by value', () => {
            dropdown.setSelectedValue('Option 3');
            expect(dropdown.getSelectedIndex()).to.equal(2);
            expect(dropdown.getSelectedValue()).to.equal('Option 3');
        });

        it('should clamp index to valid range', () => {
            dropdown.setSelectedIndex(10);
            expect(dropdown.getSelectedIndex()).to.equal(2); // Max index

            dropdown.setSelectedIndex(-5);
            expect(dropdown.getSelectedIndex()).to.equal(0); // Min index
        });

        it('should ignore invalid value selection', () => {
            dropdown.setSelectedIndex(1);
            dropdown.setSelectedValue('Non-existent');
            expect(dropdown.getSelectedIndex()).to.equal(1); // Unchanged
        });

        it('should cycle through options', () => {
            dropdown.selectNext();
            expect(dropdown.getSelectedIndex()).to.equal(1);

            dropdown.selectNext();
            expect(dropdown.getSelectedIndex()).to.equal(2);

            dropdown.selectPrevious();
            expect(dropdown.getSelectedIndex()).to.equal(1);
        });

        it('should wrap to start when cycling past end', () => {
            dropdown.setSelectedIndex(2); // Last option
            dropdown.selectNext();
            expect(dropdown.getSelectedIndex()).to.equal(0); // Wrap to first
        });

        it('should wrap to end when cycling before start', () => {
            dropdown.setSelectedIndex(0); // First option
            dropdown.selectPrevious();
            expect(dropdown.getSelectedIndex()).to.equal(2); // Wrap to last
        });
    });

    describe('Expand/Collapse', () => {
        it('should start collapsed', () => {
            expect(dropdown.isExpanded()).to.be.false;
        });

        it('should expand', () => {
            dropdown.setExpanded(true);
            expect(dropdown.isExpanded()).to.be.true;
        });

        it('should collapse', () => {
            dropdown.setExpanded(true);
            dropdown.setExpanded(false);
            expect(dropdown.isExpanded()).to.be.false;
        });

        it('should toggle expansion', () => {
            dropdown.toggleExpanded();
            expect(dropdown.isExpanded()).to.be.true;

            dropdown.toggleExpanded();
            expect(dropdown.isExpanded()).to.be.false;
        });
    });

    describe('Mouse Interaction', () => {
        it('should detect mouse over main button', () => {
            expect(dropdown.isMouseOver(400, 300)).to.be.true;
        });

        it('should detect mouse outside main button', () => {
            expect(dropdown.isMouseOver(100, 100)).to.be.false;
        });

        it('should toggle expansion on main button click', () => {
            expect(dropdown.isExpanded()).to.be.false;

            dropdown.handleClick(400, 300);
            expect(dropdown.isExpanded()).to.be.true;

            dropdown.handleClick(400, 300);
            expect(dropdown.isExpanded()).to.be.false;
        });

        it('should detect mouse over option when expanded', () => {
            dropdown.setExpanded(true);

            // Option 1 should be below main button (y = 300 + 30 = 330)
            const optionIndex = dropdown.getOptionAtPosition(400, 330);
            expect(optionIndex).to.equal(0);
        });

        it('should select option when clicking on it', () => {
            dropdown.setExpanded(true);

            // Click on second option (y = 300 + 60)
            dropdown.handleClick(400, 360);
            expect(dropdown.getSelectedIndex()).to.equal(1);
            expect(dropdown.isExpanded()).to.be.false; // Should collapse after selection
        });

        it('should not change selection when clicking outside', () => {
            dropdown.setExpanded(true);
            const initialIndex = dropdown.getSelectedIndex();

            dropdown.handleClick(100, 100);
            expect(dropdown.getSelectedIndex()).to.equal(initialIndex);
        });
    });

    describe('onChange Callback', () => {
        it('should trigger callback when selection changes via setSelectedIndex', () => {
            let callbackValue = '';
            dropdown.onChange((value: string, _index: number) => {
                callbackValue = value;
            });

            dropdown.setSelectedIndex(1);
            expect(callbackValue).to.equal('Option 2');
        });

        it('should trigger callback when selection changes via setSelectedValue', () => {
            let callbackIndex = -1;
            dropdown.onChange((_value: string, index: number) => {
                callbackIndex = index;
            });

            dropdown.setSelectedValue('Option 3');
            expect(callbackIndex).to.equal(2);
        });

        it('should trigger callback when selecting via click', () => {
            let callbackValue = '';
            dropdown.onChange((value) => {
                callbackValue = value;
            });

            dropdown.setExpanded(true);
            dropdown.handleClick(400, 360); // Click second option
            expect(callbackValue).to.equal('Option 2');
        });

        it('should not trigger callback when setting to same index', () => {
            let callbackCount = 0;
            dropdown.onChange(() => {
                callbackCount++;
            });

            dropdown.setSelectedIndex(0); // Same as initial
            expect(callbackCount).to.equal(0);
        });

        it('should pass both value and index to callback', () => {
            let receivedValue = '';
            let receivedIndex = -1;

            dropdown.onChange((value, index) => {
                receivedValue = value;
                receivedIndex = index;
            });

            dropdown.setSelectedIndex(2);
            expect(receivedValue).to.equal('Option 3');
            expect(receivedIndex).to.equal(2);
        });
    });

    describe('Hover State', () => {
        it('should track hover state', () => {
            expect(dropdown.isHovered).to.be.false;

            dropdown.setHovered(true);
            expect(dropdown.isHovered).to.be.true;

            dropdown.setHovered(false);
            expect(dropdown.isHovered).to.be.false;
        });

        it('should update hover based on mouse position', () => {
            dropdown.handleMouseMove(400, 300);
            expect(dropdown.isHovered).to.be.true;

            dropdown.handleMouseMove(100, 100);
            expect(dropdown.isHovered).to.be.false;
        });

        it('should track hovered option when expanded', () => {
            dropdown.setExpanded(true);
            dropdown.handleMouseMove(400, 330); // First option
            expect(dropdown.getHoveredOption()).to.equal(0);

            dropdown.handleMouseMove(400, 360); // Second option
            expect(dropdown.getHoveredOption()).to.equal(1);

            dropdown.handleMouseMove(100, 100); // Outside
            expect(dropdown.getHoveredOption()).to.equal(-1);
        });
    });

    describe('Visual State', () => {
        it('should have scale property', () => {
            dropdown.scale = 1.5;
            expect(dropdown.scale).to.equal(1.5);
        });

        it('should calculate expanded height', () => {
            const height = dropdown.getExpandedHeight();
            expect(height).to.be.greaterThan(0);
        });
    });

    describe('Rendering', () => {
        it('should have render method', () => {
            expect(dropdown.render).to.be.a('function');
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
                triangle: () => {},
                CENTER: 0
            };

            expect(() => dropdown.render(mockGraphics)).to.not.throw();
        });

        it('should render differently when expanded', () => {
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
                triangle: () => {},
                CENTER: 0
            };

            dropdown.setExpanded(false);
            expect(() => dropdown.render(mockGraphics)).to.not.throw();

            dropdown.setExpanded(true);
            expect(() => dropdown.render(mockGraphics)).to.not.throw();
        });
    });

    describe('Label Support', () => {
        it('should support label text', () => {
            dropdown.setLabel('Colorblind Mode');
            expect(dropdown.getLabel()).to.equal('Colorblind Mode');
        });

        it('should initialize without label', () => {
            expect(dropdown.getLabel()).to.equal('');
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid expansion toggles', () => {
            for (let i = 0; i < 10; i++) {
                dropdown.toggleExpanded();
            }
            expect(dropdown.isExpanded()).to.be.false; // Even number of toggles
        });

        it('should collapse when clicking outside while expanded', () => {
            dropdown.setExpanded(true);
            dropdown.handleClick(100, 100); // Outside
            expect(dropdown.isExpanded()).to.be.false;
        });

        it('should handle option selection cycling', () => {
            for (let i = 0; i < 10; i++) {
                dropdown.selectNext();
            }
            // After 10 cycles: 0->1->2->0->1->2->0->1->2->0 (back to start)
            expect(dropdown.getSelectedIndex()).to.equal(1);
        });
    });
});
