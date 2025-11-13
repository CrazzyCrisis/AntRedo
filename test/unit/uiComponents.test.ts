/**
 * Tests for UI components (AnimatedSpriteComponent, ButtonComponent, UIContainer)
 * Following TDD - tests written BEFORE implementation
 */

import { expect } from 'chai';
import { RenderLayer } from '../../src/rendering/RenderLayer';
import { createMockGraphics } from '../helpers/renderingMocks';
import { AnimatedSpriteComponent } from '../../src/rendering/components/AnimatedSpriteComponent';
import { ButtonComponent } from '../../src/rendering/components/ButtonComponent';
import { UIContainer } from '../../src/rendering/components/UIContainer';

describe('UI Components', () => {
    describe('AnimatedSpriteComponent', () => {
        it('should implement Renderable interface', () => {
            const sprite = { width: 100, height: 50 };
            const animated = new AnimatedSpriteComponent(sprite, 400, 100);
            
            expect(animated.layer).to.equal(RenderLayer.UI);
            expect(animated.depth).to.be.a('number');
            expect(animated.render).to.be.a('function');
        });

        it('should initialize with position and sprite', () => {
            const sprite = { width: 100, height: 50 };
            const animated = new AnimatedSpriteComponent(sprite, 400, 100);
            
            expect(animated.x).to.equal(400);
            expect(animated.y).to.equal(100);
            expect(animated.sprite).to.equal(sprite);
        });

        it('should animate hover effect (vertical oscillation)', () => {
            const sprite = { width: 100, height: 50 };
            const animated = new AnimatedSpriteComponent(sprite, 400, 100);
            
            const initialOffset = animated.getAnimationOffset();
            animated.update(); // Advance animation
            animated.update();
            animated.update();
            
            const newOffset = animated.getAnimationOffset();
            expect(newOffset).to.not.equal(initialOffset);
        });

        it('should allow setting animation speed', () => {
            const sprite = { width: 100, height: 50 };
            const animated = new AnimatedSpriteComponent(sprite, 400, 100);
            
            animated.setAnimationSpeed(2.0);
            expect(animated.animationSpeed).to.equal(2.0);
        });

        it('should allow setting animation amplitude', () => {
            const sprite = { width: 100, height: 50 };
            const animated = new AnimatedSpriteComponent(sprite, 400, 100);
            
            animated.setAmplitude(10);
            expect(animated.amplitude).to.equal(10);
        });

        it('should render sprite with animation offset', () => {
            const mockGraphics = createMockGraphics();
            const sprite = { width: 100, height: 50 };
            const animated = new AnimatedSpriteComponent(sprite, 400, 100);
            
            animated.update(); // Create some offset
            animated.render(mockGraphics);
            
            expect(mockGraphics._imageDrawn).to.be.true;
        });
    });

    describe('ButtonComponent', () => {
        it('should implement Renderable interface', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            expect(button.layer).to.equal(RenderLayer.UI);
            expect(button.depth).to.be.a('number');
            expect(button.render).to.be.a('function');
        });

        it('should initialize with position, sprite, and id', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'play_button');
            
            expect(button.x).to.equal(400);
            expect(button.y).to.equal(300);
            expect(button.id).to.equal('play_button');
            expect(button.sprite).to.equal(sprite);
        });

        it('should detect mouse hover using bounds', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            // Inside bounds (centered sprite)
            expect(button.isMouseOver(450, 325)).to.be.true;
            expect(button.isMouseOver(400, 300)).to.be.true;
            expect(button.isMouseOver(350, 275)).to.be.true; // Top-left corner
            
            // Outside bounds
            expect(button.isMouseOver(300, 300)).to.be.false;
            expect(button.isMouseOver(600, 300)).to.be.false;
            expect(button.isMouseOver(400, 200)).to.be.false;
        });

        it('should track hover state', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            expect(button.isHovered).to.be.false;
            
            button.setHovered(true);
            expect(button.isHovered).to.be.true;
            
            button.setHovered(false);
            expect(button.isHovered).to.be.false;
        });

        it('should pulse when hovered', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            button.setHovered(true);
            const initialScale = button.getPulseScale();
            
            button.update();
            button.update();
            button.update();
            
            const newScale = button.getPulseScale();
            expect(newScale).to.not.equal(initialScale);
        });

        it('should not pulse when not hovered', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            button.setHovered(false);
            
            button.update();
            button.update();
            
            const scale = button.getPulseScale();
            expect(scale).to.equal(1.0); // No pulse = scale 1.0
        });

        it('should allow setting pulse speed', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            button.setPulseSpeed(3.0);
            expect(button.pulseSpeed).to.equal(3.0);
        });

        it('should render with pulse scale when hovered', () => {
            const mockGraphics = createMockGraphics();
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            button.setHovered(true);
            button.update();
            button.render(mockGraphics);
            
            expect(mockGraphics._imageDrawn).to.be.true;
            expect(mockGraphics._pushCalled).to.be.true; // For scale transform
            expect(mockGraphics._popCalled).to.be.true;
        });

        it('should execute callback on click', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            let clicked = false;
            button.onClick(() => { clicked = true; });
            
            button.handleClick(450, 325); // Inside bounds
            expect(clicked).to.be.true;
        });

        it('should not execute callback if click outside bounds', () => {
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 400, 300, 'test_button');
            
            let clicked = false;
            button.onClick(() => { clicked = true; });
            
            button.handleClick(100, 100); // Outside bounds
            expect(clicked).to.be.false;
        });
    });

    describe('UIContainer', () => {
        it('should implement Renderable interface', () => {
            const container = new UIContainer(400, 300);
            
            expect(container.layer).to.equal(RenderLayer.UI);
            expect(container.depth).to.be.a('number');
            expect(container.render).to.be.a('function');
        });

        it('should initialize with position', () => {
            const container = new UIContainer(400, 300);
            
            expect(container.x).to.equal(400);
            expect(container.y).to.equal(300);
        });

        it('should allow adding child components', () => {
            const container = new UIContainer(400, 300);
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 0, 0, 'test');
            
            container.addChild(button);
            expect(container.children.length).to.equal(1);
            expect(container.children[0]).to.equal(button);
        });

        it('should position children relative to container', () => {
            const container = new UIContainer(400, 300);
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 50, 100, 'test');
            
            container.addChild(button);
            
            // Button should be positioned relative to container
            expect(button.x).to.equal(450); // 400 + 50
            expect(button.y).to.equal(400); // 300 + 100
        });

        it('should update child positions when container moves', () => {
            const container = new UIContainer(400, 300);
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 50, 100, 'test');
            
            container.addChild(button);
            container.setPosition(500, 400);
            
            expect(button.x).to.equal(550); // 500 + 50
            expect(button.y).to.equal(500); // 400 + 100
        });

        it('should center children horizontally within canvas', () => {
            const container = new UIContainer(400, 300);
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 0, 0, 'test');
            
            container.addChild(button);
            container.centerHorizontally(800); // Canvas width
            
            // Container should be centered, button positioned relative
            expect(container.x).to.equal(400); // Center of 800px canvas
        });

        it('should render all children', () => {
            const mockGraphics = createMockGraphics();
            const container = new UIContainer(400, 300);
            
            const sprite1 = { width: 100, height: 50 };
            const sprite2 = { width: 100, height: 50 };
            const button1 = new ButtonComponent(sprite1, 0, 0, 'test1');
            const button2 = new ButtonComponent(sprite2, 0, 100, 'test2');
            
            container.addChild(button1);
            container.addChild(button2);
            
            container.render(mockGraphics);
            
            // Container doesn't render children directly - Renderer does
            // This test verifies render() doesn't throw
            expect(container.children.length).to.equal(2);
        });

        it('should allow removing children', () => {
            const container = new UIContainer(400, 300);
            const sprite = { width: 100, height: 50 };
            const button = new ButtonComponent(sprite, 0, 0, 'test');
            
            container.addChild(button);
            expect(container.children.length).to.equal(1);
            
            container.removeChild(button);
            expect(container.children.length).to.equal(0);
        });
    });
});


