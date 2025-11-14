import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { SliderComponent } from '../../src/rendering/components/SliderComponent';
import { RenderLayer } from '../../src/rendering/RenderLayer';

/**
 * Test Suite: SliderComponent
 * 
 * Tests the interactive slider UI component for numeric value selection.
 * Used for volume controls, camera smoothing, and other numeric settings.
 */
describe('SliderComponent', () => {
    let slider: SliderComponent;
    const mockSprite = { width: 200, height: 20 };

    beforeEach(() => {
        slider = new SliderComponent(mockSprite, 400, 300, 0, 1, 0.5, 'test_slider');
    });

    describe('Initialization', () => {
        it('should implement Renderable interface', () => {
            expect(slider).to.have.property('layer');
            expect(slider).to.have.property('depth');
            expect(slider).to.have.property('render');
        });

        it('should initialize with correct position and sprite', () => {
            expect(slider.x).to.equal(400);
            expect(slider.y).to.equal(300);
            expect(slider.sprite).to.equal(mockSprite);
        });

        it('should initialize with correct value range', () => {
            expect(slider.getMin()).to.equal(0);
            expect(slider.getMax()).to.equal(1);
            expect(slider.getValue()).to.equal(0.5);
        });

        it('should be on UI layer', () => {
            expect(slider.layer).to.equal(RenderLayer.UI);
        });

        it('should have unique ID', () => {
            expect(slider.id).to.equal('test_slider');
        });
    });

    describe('Value Management', () => {
        it('should get current value', () => {
            expect(slider.getValue()).to.equal(0.5);
        });

        it('should set value within range', () => {
            slider.setValue(0.75);
            expect(slider.getValue()).to.equal(0.75);
        });

        it('should clamp value to min', () => {
            slider.setValue(-0.5);
            expect(slider.getValue()).to.equal(0);
        });

        it('should clamp value to max', () => {
            slider.setValue(1.5);
            expect(slider.getValue()).to.equal(1);
        });

        it('should handle value at min boundary', () => {
            slider.setValue(0);
            expect(slider.getValue()).to.equal(0);
        });

        it('should handle value at max boundary', () => {
            slider.setValue(1);
            expect(slider.getValue()).to.equal(1);
        });
    });

    describe('Range Management', () => {
        it('should set custom range', () => {
            const customSlider = new SliderComponent(mockSprite, 400, 300, 10, 100, 50, 'custom');
            expect(customSlider.getMin()).to.equal(10);
            expect(customSlider.getMax()).to.equal(100);
            expect(customSlider.getValue()).to.equal(50);
        });

        it('should handle negative ranges', () => {
            const negSlider = new SliderComponent(mockSprite, 400, 300, -10, 10, 0, 'neg');
            expect(negSlider.getMin()).to.equal(-10);
            expect(negSlider.getMax()).to.equal(10);
            expect(negSlider.getValue()).to.equal(0);
        });

        it('should handle decimal ranges', () => {
            const decimalSlider = new SliderComponent(mockSprite, 400, 300, 0, 0.1, 0.05, 'decimal');
            expect(decimalSlider.getValue()).to.be.closeTo(0.05, 0.001);
        });
    });

    describe('Mouse Interaction', () => {
        it('should detect mouse over track', () => {
            expect(slider.isMouseOver(400, 300)).to.be.true;
        });

        it('should detect mouse outside track', () => {
            expect(slider.isMouseOver(100, 100)).to.be.false;
        });

        it('should detect mouse at track edges', () => {
            // Left edge (x = 400 - 200/2 = 300)
            expect(slider.isMouseOver(300, 300)).to.be.true;
            // Right edge (x = 400 + 200/2 = 500)
            expect(slider.isMouseOver(500, 300)).to.be.true;
        });
    });

    describe('Dragging Behavior', () => {
        it('should start dragging on mouse down', () => {
            slider.handleMouseDown(400, 300);
            expect(slider.isDragging()).to.be.true;
        });

        it('should not start dragging if mouse outside', () => {
            slider.handleMouseDown(100, 100);
            expect(slider.isDragging()).to.be.false;
        });

        it('should update value while dragging', () => {
            slider.handleMouseDown(400, 300);
            
            // Drag to right edge (should be max value)
            slider.handleMouseDrag(500, 300);
            expect(slider.getValue()).to.equal(1);
            
            // Drag to left edge (should be min value)
            slider.handleMouseDrag(300, 300);
            expect(slider.getValue()).to.equal(0);
        });

        it('should update value to mouse position proportionally', () => {
            slider.handleMouseDown(400, 300);
            
            // Drag to 3/4 position (300 + 150 = 450)
            slider.handleMouseDrag(450, 300);
            expect(slider.getValue()).to.be.closeTo(0.75, 0.05);
        });

        it('should stop dragging on mouse up', () => {
            slider.handleMouseDown(400, 300);
            expect(slider.isDragging()).to.be.true;
            
            slider.handleMouseUp();
            expect(slider.isDragging()).to.be.false;
        });

        it('should not update value when not dragging', () => {
            const initialValue = slider.getValue();
            slider.handleMouseDrag(450, 300);
            expect(slider.getValue()).to.equal(initialValue);
        });

        it('should clamp drag value to track bounds', () => {
            slider.handleMouseDown(400, 300);
            
            // Drag way past right edge
            slider.handleMouseDrag(1000, 300);
            expect(slider.getValue()).to.equal(1);
            
            // Drag way past left edge
            slider.handleMouseDrag(-1000, 300);
            expect(slider.getValue()).to.equal(0);
        });
    });

    describe('onChange Callback', () => {
        it('should trigger callback when value changes via setValue', () => {
            let callbackValue = 0;
            slider.onChange((value) => {
                callbackValue = value;
            });
            
            slider.setValue(0.8);
            expect(callbackValue).to.equal(0.8);
        });

        it('should trigger callback when value changes via drag', () => {
            let callbackValue = 0;
            slider.onChange((value) => {
                callbackValue = value;
            });
            
            slider.handleMouseDown(400, 300);
            slider.handleMouseDrag(500, 300);
            expect(callbackValue).to.equal(1);
        });

        it('should not trigger callback when setting to same value', () => {
            let callbackCount = 0;
            slider.onChange(() => {
                callbackCount++;
            });
            
            slider.setValue(0.5); // Same as initial value
            expect(callbackCount).to.equal(0);
        });

        it('should pass new value to callback', () => {
            let receivedValue = 0;
            slider.onChange((value) => {
                receivedValue = value;
            });
            
            slider.setValue(0.25);
            expect(receivedValue).to.equal(0.25);
        });
    });

    describe('Visual State', () => {
        it('should calculate handle position based on value', () => {
            slider.setValue(0);
            const posMin = slider.getHandlePosition();
            
            slider.setValue(1);
            const posMax = slider.getHandlePosition();
            
            slider.setValue(0.5);
            const posMid = slider.getHandlePosition();
            
            expect(posMin).to.be.lessThan(posMid);
            expect(posMid).to.be.lessThan(posMax);
        });

        it('should return handle position as pixel X coordinate', () => {
            slider.setValue(0.5);
            const handlePos = slider.getHandlePosition();
            
            // Should be near center of slider (400)
            expect(handlePos).to.be.closeTo(400, 10);
        });

        it('should scale with custom scale property', () => {
            slider.scale = 2.0;
            expect(slider.scale).to.equal(2.0);
        });
    });

    describe('Hover State', () => {
        it('should track hover state', () => {
            expect(slider.isHovered).to.be.false;
            
            slider.setHovered(true);
            expect(slider.isHovered).to.be.true;
            
            slider.setHovered(false);
            expect(slider.isHovered).to.be.false;
        });

        it('should update hover based on mouse position', () => {
            slider.handleMouseMove(400, 300);
            expect(slider.isHovered).to.be.true;
            
            slider.handleMouseMove(100, 100);
            expect(slider.isHovered).to.be.false;
        });
    });

    describe('Rendering', () => {
        it('should have render method', () => {
            expect(slider.render).to.be.a('function');
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
            
            expect(() => slider.render(mockGraphics)).to.not.throw();
        });
    });

    describe('Edge Cases', () => {
        it('should handle min === max', () => {
            const sameSlider = new SliderComponent(mockSprite, 400, 300, 5, 5, 5, 'same');
            expect(sameSlider.getValue()).to.equal(5);
            sameSlider.setValue(10);
            expect(sameSlider.getValue()).to.equal(5); // Clamped to max
        });

        it('should handle very small ranges', () => {
            const tinySlider = new SliderComponent(mockSprite, 400, 300, 0, 0.001, 0.0005, 'tiny');
            expect(tinySlider.getValue()).to.be.closeTo(0.0005, 0.00001);
        });

        it('should handle very large ranges', () => {
            const largeSlider = new SliderComponent(mockSprite, 400, 300, 0, 10000, 5000, 'large');
            expect(largeSlider.getValue()).to.equal(5000);
        });
    });
});
