import { expect } from 'chai';
import { SliderWithArrowsComponent } from '../../src/rendering/components/SliderWithArrowsComponent';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { createMockGraphics, resetMockGraphics, setupWindowMock } from '../helpers/renderingMocks';

/**
 * Unit tests for SliderWithArrowsComponent
 * Following TDD - write tests first, then implement component
 * 
 * SliderWithArrowsComponent combines:
 * - SliderComponent (drag interaction)
 * - Left/Right arrow buttons (±1% increments by default)
 * - Hover highlighting on arrows
 * - All interaction modes working together
 */

// Setup window mock for p5.js constants
setupWindowMock();

describe('SliderWithArrowsComponent', () => {
    let mockGraphics: any;
    const mockSprite = { width: 200, height: 20 };
    
    beforeEach(() => {
        mockGraphics = createMockGraphics();
        resetMockGraphics(mockGraphics);
    });

    describe('Initialization', () => {
        it('should implement Renderable interface', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            expect(slider).to.have.property('layer');
            expect(slider).to.have.property('depth');
            expect(slider).to.have.property('render');
            expect(slider.layer).to.equal(RenderLayer.UI);
        });

        it('should initialize with position, value range, and arrows', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            expect(slider.x).to.equal(400);
            expect(slider.y).to.equal(300);
            expect(slider.getValue()).to.equal(0.5);
            expect(slider.id).to.equal('test_slider');
        });

        it('should clamp initial value to bounds', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 1.5, 'test_slider');
            expect(slider.getValue()).to.equal(1);
            
            const slider2 = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, -0.5, 'test_slider2');
            expect(slider2.getValue()).to.equal(0);
        });

        it('should have default arrow step of 1% (0.01)', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.incrementByArrow();
            expect(slider.getValue()).to.be.closeTo(0.51, 0.001);
        });
    });

    describe('Value Management', () => {
        it('should get and set value', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.setValue(0.75);
            expect(slider.getValue()).to.equal(0.75);
        });

        it('should clamp setValue to bounds', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.setValue(2);
            expect(slider.getValue()).to.equal(1);
            
            slider.setValue(-1);
            expect(slider.getValue()).to.equal(0);
        });

        it('should emit onChange callback when value changes', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            let callbackValue = -1;
            slider.onChange((value: number) => {
                callbackValue = value;
            });
            
            slider.setValue(0.8);
            expect(callbackValue).to.equal(0.8);
        });

        it('should not emit onChange if value unchanged', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            let callbackCount = 0;
            slider.onChange(() => {
                callbackCount++;
            });
            
            slider.setValue(0.5); // Same as initial
            expect(callbackCount).to.equal(0);
        });
    });

    describe('Arrow Increment/Decrement', () => {
        it('should increment by arrow step (1% by default)', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.incrementByArrow();
            expect(slider.getValue()).to.be.closeTo(0.51, 0.001);
        });

        it('should decrement by arrow step (1% by default)', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.decrementByArrow();
            expect(slider.getValue()).to.be.closeTo(0.49, 0.001);
        });

        it('should not increment beyond max bound', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.99, 'test_slider');
            
            slider.incrementByArrow();
            expect(slider.getValue()).to.equal(1);
            
            slider.incrementByArrow(); // Try again
            expect(slider.getValue()).to.equal(1); // Should stay at 1
        });

        it('should not decrement below min bound', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.01, 'test_slider');
            
            slider.decrementByArrow();
            expect(slider.getValue()).to.equal(0);
            
            slider.decrementByArrow(); // Try again
            expect(slider.getValue()).to.equal(0); // Should stay at 0
        });

        it('should allow setting custom arrow step', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.setArrowStep(0.05); // 5% step
            slider.incrementByArrow();
            expect(slider.getValue()).to.be.closeTo(0.55, 0.001);
        });

        it('should emit onChange when using arrows', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            let callbackValue = -1;
            slider.onChange((value: number) => {
                callbackValue = value;
            });
            
            slider.incrementByArrow();
            expect(callbackValue).to.be.closeTo(0.51, 0.001);
        });
    });

    describe('Mouse Interaction - Slider Track', () => {
        it('should detect mouse over slider track', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            // Mouse over center of track
            expect(slider.isMouseOverTrack(400, 300)).to.be.true;
            
            // Mouse outside track
            expect(slider.isMouseOverTrack(100, 100)).to.be.false;
        });

        it('should start dragging on track mouse down', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.handleMouseDown(400, 300);
            expect(slider.isDragging()).to.be.true;
        });

        it('should update value while dragging', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.handleMouseDown(400, 300);
            slider.handleMouseMove(450, 300); // Move right
            
            expect(slider.getValue()).to.be.greaterThan(0.5);
        });

        it('should stop dragging on mouse up', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.handleMouseDown(400, 300);
            expect(slider.isDragging()).to.be.true;
            
            slider.handleMouseUp();
            expect(slider.isDragging()).to.be.false;
        });
    });

    describe('Mouse Interaction - Arrows', () => {
        it('should detect mouse over left arrow', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            // Left arrow is to the left of track
            const leftArrowX = 400 - 100 - 20; // x - trackWidth/2 - arrowSize
            const leftArrowY = 300;
            
            expect(slider.isMouseOverLeftArrow(leftArrowX, leftArrowY)).to.be.true;
        });

        it('should detect mouse over right arrow', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            // Right arrow is to the right of track
            const rightArrowX = 400 + 100 + 20; // x + trackWidth/2 + arrowSize
            const rightArrowY = 300;
            
            expect(slider.isMouseOverRightArrow(rightArrowX, rightArrowY)).to.be.true;
        });

        it('should decrement value when left arrow clicked', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            const leftArrowX = 400 - 100 - 20;
            slider.handleClick(leftArrowX, 300);
            
            expect(slider.getValue()).to.be.closeTo(0.49, 0.001);
        });

        it('should increment value when right arrow clicked', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            const rightArrowX = 400 + 100 + 20;
            slider.handleClick(rightArrowX, 300);
            
            expect(slider.getValue()).to.be.closeTo(0.51, 0.001);
        });

        it('should not respond to arrow clicks when dragging', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.handleMouseDown(400, 300); // Start dragging
            
            const leftArrowX = 400 - 100 - 20;
            slider.handleClick(leftArrowX, 300); // Try to click arrow
            
            // Value should still be around 0.5 (drag position), not 0.49 (arrow decrement)
            expect(slider.getValue()).to.be.closeTo(0.5, 0.05);
        });
    });

    describe('Hover States', () => {
        it('should track left arrow hover', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            const leftArrowX = 400 - 100 - 20;
            slider.handleMouseMove(leftArrowX, 300);
            
            expect(slider.isLeftArrowHovered()).to.be.true;
            expect(slider.isRightArrowHovered()).to.be.false;
        });

        it('should track right arrow hover', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            const rightArrowX = 400 + 100 + 20;
            slider.handleMouseMove(rightArrowX, 300);
            
            expect(slider.isRightArrowHovered()).to.be.true;
            expect(slider.isLeftArrowHovered()).to.be.false;
        });

        it('should track track hover', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.handleMouseMove(400, 300);
            
            expect(slider.isTrackHovered()).to.be.true;
            expect(slider.isLeftArrowHovered()).to.be.false;
            expect(slider.isRightArrowHovered()).to.be.false;
        });

        it('should clear hover when mouse moves away', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            const leftArrowX = 400 - 100 - 20;
            slider.handleMouseMove(leftArrowX, 300);
            expect(slider.isLeftArrowHovered()).to.be.true;
            
            slider.handleMouseMove(0, 0); // Move far away
            expect(slider.isLeftArrowHovered()).to.be.false;
        });
    });

    describe('Rendering', () => {
        it('should render slider track, handle, and arrows', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.render(mockGraphics);
            
            // Should draw slider elements
            expect(mockGraphics._fillSet).to.be.true;
            expect(mockGraphics._strokeSet).to.be.true;
            expect(mockGraphics._rectDrawn).to.be.true;
        });

        it('should highlight arrows on hover', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            const leftArrowX = 400 - 100 - 20;
            slider.handleMouseMove(leftArrowX, 300);
            
            slider.render(mockGraphics);
            
            // Should have drawn highlighting
            expect(mockGraphics._fillSet).to.be.true;
        });

        it('should show dragging state visually', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.handleMouseDown(400, 300);
            slider.render(mockGraphics);
            
            // Should render with dragging indication
            expect(mockGraphics._rectDrawn).to.be.true;
        });
    });

    describe('Edge Cases', () => {
        it('should handle min === max', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0.5, 0.5, 0.5, 'test_slider');
            
            slider.incrementByArrow();
            expect(slider.getValue()).to.equal(0.5);
            
            slider.decrementByArrow();
            expect(slider.getValue()).to.equal(0.5);
        });

        it('should handle very small arrow steps', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            slider.setArrowStep(0.001);
            slider.incrementByArrow();
            expect(slider.getValue()).to.be.closeTo(0.501, 0.0001);
        });

        it('should handle negative ranges', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, -1, 1, 0, 'test_slider');
            
            slider.incrementByArrow();
            expect(slider.getValue()).to.be.closeTo(0.01, 0.001);
            
            slider.setValue(0);
            slider.decrementByArrow();
            expect(slider.getValue()).to.be.closeTo(-0.01, 0.001);
        });

        it('should handle rapid arrow clicks', () => {
            const slider = new SliderWithArrowsComponent(mockSprite as any, 400, 300, 0, 1, 0.5, 'test_slider');
            
            for (let i = 0; i < 10; i++) {
                slider.incrementByArrow();
            }
            
            expect(slider.getValue()).to.be.closeTo(0.6, 0.01);
        });
    });
});
