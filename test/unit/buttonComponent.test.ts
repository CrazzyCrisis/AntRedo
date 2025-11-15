import { expect } from 'chai';
import { ButtonComponent } from '../../src/rendering/components/ButtonComponent';

describe('ButtonComponent', () => {
    describe('Mock Sprite Handling', () => {
        it('should accept mock sprite with only width/height properties', () => {
            const mockSprite = { width: 100, height: 40 };
            
            const button = new ButtonComponent(
                mockSprite as any,
                400,
                300,
                'test_button'
            );
            
            expect(button.sprite).to.deep.equal(mockSprite);
            expect(button.x).to.equal(400);
            expect(button.y).to.equal(300);
        });

        it('should render without crashing with mock sprite', () => {
            const mockSprite = { width: 100, height: 40 };
            const button = new ButtonComponent(mockSprite as any, 400, 300, 'test_button');
            
            // Mock p5.js graphics context
            const mockGraphics = {
                push: () => {},
                pop: () => {},
                fill: () => {},
                stroke: () => {},
                strokeWeight: () => {},
                noStroke: () => {},
                rect: () => {},
                textAlign: () => {},
                textSize: () => {},
                text: () => {},
                CENTER: 'CENTER'
            };
            
            // Should not throw
            expect(() => button.render(mockGraphics)).to.not.throw();
        });

        it('should use isMouseOver with mock sprite dimensions', () => {
            const mockSprite = { width: 100, height: 40 };
            const button = new ButtonComponent(mockSprite as any, 400, 300, 'test_button');
            button.scale = 1.0;
            
            // Center should be inside
            expect(button.isMouseOver(400, 300)).to.be.true;
            
            // Edges should be inside
            expect(button.isMouseOver(350, 300)).to.be.true; // Left edge
            expect(button.isMouseOver(450, 300)).to.be.true; // Right edge
            expect(button.isMouseOver(400, 280)).to.be.true; // Top edge
            expect(button.isMouseOver(400, 320)).to.be.true; // Bottom edge
            
            // Outside bounds should be false
            expect(button.isMouseOver(349, 300)).to.be.false; // Left of button
            expect(button.isMouseOver(451, 300)).to.be.false; // Right of button
            expect(button.isMouseOver(400, 279)).to.be.false; // Above button
            expect(button.isMouseOver(400, 321)).to.be.false; // Below button
        });

        it('should handle real p5.js image sprite', () => {
            // Mock a real p5.js image with pixels property
            const realSprite = {
                width: 100,
                height: 40,
                pixels: new Uint8Array(100 * 40 * 4) // RGBA pixel data
            };
            
            const button = new ButtonComponent(realSprite as any, 400, 300, 'test_button');
            
            const mockGraphics = {
                push: () => {},
                pop: () => {},
                translate: () => {},
                scale: () => {},
                image: () => {} // Should be called for real images
            };
            
            // Should not throw
            expect(() => button.render(mockGraphics)).to.not.throw();
        });

        it('should apply scale to mock sprite dimensions', () => {
            const mockSprite = { width: 100, height: 40 };
            const button = new ButtonComponent(mockSprite as any, 400, 300, 'test_button');
            button.scale = 2.0;
            
            // With scale 2.0, bounds should be doubled (200x80)
            expect(button.isMouseOver(400, 300)).to.be.true; // Center
            expect(button.isMouseOver(300, 300)).to.be.true; // Left edge (400 - 100)
            expect(button.isMouseOver(500, 300)).to.be.true; // Right edge (400 + 100)
            expect(button.isMouseOver(400, 260)).to.be.true; // Top edge (300 - 40)
            expect(button.isMouseOver(400, 340)).to.be.true; // Bottom edge (300 + 40)
            
            // Outside scaled bounds
            expect(button.isMouseOver(299, 300)).to.be.false;
            expect(button.isMouseOver(501, 300)).to.be.false;
        });

        it('should pulse with hover state using mock sprite', () => {
            const mockSprite = { width: 100, height: 40 };
            const button = new ButtonComponent(mockSprite as any, 400, 300, 'test_button');
            button.setPulseSpeed(0.1);
            
            button.setHovered(true);
            button.update();
            
            const pulseScale = button.getPulseScale();
            // Pulse should be slightly above 1.0 after first update
            expect(pulseScale).to.be.greaterThan(1.0);
            expect(pulseScale).to.be.lessThan(1.1);
        });
    });
});
