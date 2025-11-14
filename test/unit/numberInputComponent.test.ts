/**
 * Tests for NumberInputComponent
 * Following TDD - tests written BEFORE implementation
 * 
 * NumberInputComponent provides a text input box with increment/decrement arrows
 * for fine-tuning numeric values. Used for priority weights and threshold values.
 */

import { expect } from 'chai';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { createMockGraphics, setupWindowMock } from '../helpers/renderingMocks';
import { NumberInputComponent } from '../../src/rendering/components/NumberInputComponent';

// Setup window mock for p5.js constants
setupWindowMock();

describe('NumberInputComponent', () => {
    describe('Initialization', () => {
        it('should implement Renderable interface', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            expect(component.layer).to.equal(RenderLayer.UI);
            expect(component.depth).to.be.a('number');
            expect(component.render).to.be.a('function');
            expect(component.id).to.equal('test_input');
        });

        it('should initialize with position and value bounds', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            expect(component.x).to.equal(100);
            expect(component.y).to.equal(200);
            expect(component.getValue()).to.equal(0.5);
        });

        it('should clamp initial value to bounds', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 5, 'test_input');
            expect(component.getValue()).to.equal(1); // Clamped to max
            
            const component2 = new NumberInputComponent(100, 200, 0, 1, -1, 'test_input2');
            expect(component2.getValue()).to.equal(0); // Clamped to min
        });
    });

    describe('Value Management', () => {
        it('should set value within bounds', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.setValue(0.75);
            expect(component.getValue()).to.equal(0.75);
        });

        it('should clamp value to min bound', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.setValue(-0.5);
            expect(component.getValue()).to.equal(0);
        });

        it('should clamp value to max bound', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.setValue(1.5);
            expect(component.getValue()).to.equal(1);
        });

        it('should emit onChange callback when value changes', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            let callbackValue: number | null = null;
            
            component.onChange((value: number) => {
                callbackValue = value;
            });
            
            component.setValue(0.75);
            expect(callbackValue).to.equal(0.75);
        });

        it('should not emit onChange if value unchanged', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            let callbackCount = 0;
            
            component.onChange(() => {
                callbackCount++;
            });
            
            component.setValue(0.5); // Same value
            expect(callbackCount).to.equal(0);
        });
    });

    describe('Increment/Decrement', () => {
        it('should increment value by step amount (default 0.03)', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.increment();
            expect(component.getValue()).to.be.closeTo(0.53, 0.001);
        });

        it('should decrement value by step amount (default 0.03)', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.decrement();
            expect(component.getValue()).to.be.closeTo(0.47, 0.001);
        });

        it('should not increment beyond max bound', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.99, 'test_input');
            
            component.increment();
            expect(component.getValue()).to.equal(1);
        });

        it('should not decrement below min bound', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.01, 'test_input');
            
            component.decrement();
            expect(component.getValue()).to.equal(0);
        });

        it('should allow setting custom step amount', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            component.setStep(0.1);
            
            component.increment();
            expect(component.getValue()).to.be.closeTo(0.6, 0.001);
        });
    });

    describe('Mouse Interaction - Arrows', () => {
        it('should detect left arrow hover', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            // Left arrow at x - 25 (approximately)
            expect(component.isLeftArrowHovered(75, 200)).to.be.true;
            expect(component.isLeftArrowHovered(50, 200)).to.be.false;
        });

        it('should detect right arrow hover', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            // Right arrow at x + width + 10 (approximately)
            expect(component.isRightArrowHovered(190, 200)).to.be.true;
            expect(component.isRightArrowHovered(300, 200)).to.be.false;
        });

        it('should decrement on left arrow click', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleClick(75, 200); // Click left arrow
            expect(component.getValue()).to.be.closeTo(0.47, 0.001);
        });

        it('should increment on right arrow click', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleClick(190, 200); // Click right arrow
            expect(component.getValue()).to.be.closeTo(0.53, 0.001);
        });
    });

    describe('Mouse Interaction - Input Box', () => {
        it('should detect input box hover', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            expect(component.isMouseOver(150, 200)).to.be.true;
            expect(component.isMouseOver(100, 200)).to.be.true;
            expect(component.isMouseOver(50, 200)).to.be.false;
        });

        it('should set focused state when input box clicked', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleClick(150, 200);
            expect(component.isFocused()).to.be.true;
        });

        it('should unfocus when clicking outside', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleClick(150, 200); // Focus
            expect(component.isFocused()).to.be.true;
            
            component.handleClick(500, 500); // Click outside
            expect(component.isFocused()).to.be.false;
        });
    });

    describe('Text Input', () => {
        it('should accept numeric text input when focused', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            component.handleClick(150, 200); // Focus
            
            component.handleTextInput('0.75');
            expect(component.getValue()).to.equal(0.75);
        });

        it('should reject non-numeric text input', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            component.handleClick(150, 200); // Focus
            
            component.handleTextInput('abc');
            expect(component.getValue()).to.equal(0.5); // Unchanged
        });

        it('should clamp text input to bounds', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            component.handleClick(150, 200); // Focus
            
            component.handleTextInput('5');
            expect(component.getValue()).to.equal(1); // Clamped to max
        });

        it('should not accept text input when unfocused', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleTextInput('0.75');
            expect(component.getValue()).to.equal(0.5); // Unchanged
        });
    });

    describe('Hover States', () => {
        it('should track left arrow hover state', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleMouseMove(75, 200); // Over left arrow
            expect(component.isLeftArrowHovered(75, 200)).to.be.true;
        });

        it('should track right arrow hover state', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleMouseMove(190, 200); // Over right arrow
            expect(component.isRightArrowHovered(190, 200)).to.be.true;
        });

        it('should track input box hover state', () => {
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.setHovered(true);
            expect(component.isHovered()).to.be.true;
        });
    });

    describe('Rendering', () => {
        it('should render input box, arrows, and value text', () => {
            const mockGraphics = createMockGraphics();
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.render(mockGraphics);
            
            // Should draw rectangles (input box + arrows) and text
            expect(mockGraphics._rectDrawn).to.be.true;
            expect(mockGraphics._textDrawn).to.be.true;
        });

        it('should highlight arrows on hover', () => {
            const mockGraphics = createMockGraphics();
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleMouseMove(75, 200); // Hover left arrow
            component.render(mockGraphics);
            
            // Visual feedback should be rendered (checked via fill calls)
            expect(mockGraphics._fillSet).to.be.true;
        });

        it('should show focused state when input box active', () => {
            const mockGraphics = createMockGraphics();
            const component = new NumberInputComponent(100, 200, 0, 1, 0.5, 'test_input');
            
            component.handleClick(150, 200); // Focus
            component.render(mockGraphics);
            
            // Different stroke for focused state
            expect(mockGraphics._strokeSet).to.be.true;
        });
    });
});
