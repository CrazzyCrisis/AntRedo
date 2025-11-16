import { expect } from 'chai';
import { WaterParticleComponent } from '../../src/rendering/components/WaterParticleComponent';
import { RenderLayer } from '../../src/rendering/RenderLayer';

describe('WaterParticleComponent', () => {
    let particle: WaterParticleComponent;
    const mockGraphics: any = {
        noStroke: () => {},
        fill: () => {},
        ellipse: () => {},
        _ellipseCalls: [] as any[],
        _fillCalls: [] as any[]
    };

    beforeEach(() => {
        // Reset mock tracking
        mockGraphics._ellipseCalls = [];
        mockGraphics._fillCalls = [];
        
        // Track calls
        mockGraphics.ellipse = (x: number, y: number, w: number, h: number) => {
            mockGraphics._ellipseCalls.push({ x, y, w, h });
        };
        mockGraphics.fill = (...args: any[]) => {
            mockGraphics._fillCalls.push(args);
        };
        
        particle = new WaterParticleComponent(100, 200, '#3366CC');
    });

    describe('initialization', () => {
        it('should be on VISUAL_EFFECTS layer', () => {
            expect(particle.layer).to.equal(RenderLayer.VISUAL_EFFECTS);
        });

        it('should have depth 999', () => {
            expect(particle.depth).to.equal(999);
        });

        it('should not be finished initially', () => {
            expect(particle.isFinished()).to.be.false;
        });
    });

    describe('render()', () => {
        it('should call graphics ellipse method', () => {
            particle.render(mockGraphics);
            
            expect(mockGraphics._ellipseCalls.length).to.be.greaterThan(0);
        });

        it('should call graphics fill method', () => {
            particle.render(mockGraphics);
            
            expect(mockGraphics._fillCalls.length).to.be.greaterThan(0);
        });

        it('should draw at initial position on first render', () => {
            particle.render(mockGraphics);
            
            const firstCall = mockGraphics._ellipseCalls[0];
            // Position should be near initial (100, 200) but may have moved slightly
            expect(firstCall.x).to.be.closeTo(100, 20);
            expect(firstCall.y).to.be.closeTo(200, 20);
        });

        it('should update position between renders', () => {
            particle.render(mockGraphics);
            const pos1 = mockGraphics._ellipseCalls[0];
            
            mockGraphics._ellipseCalls = [];
            
            // Wait a bit
            const wait = Date.now() + 50;
            while (Date.now() < wait) {}
            
            particle.render(mockGraphics);
            const pos2 = mockGraphics._ellipseCalls[0];
            
            // Position should have changed (particles float upward)
            expect(pos2.y).to.not.equal(pos1.y);
        });
    });

    describe('lifecycle', () => {
        it('should expire after lifetime', function(this: any) {
            this.timeout(2000);
            
            // Render continuously for 1 second
            const endTime = Date.now() + 1000;
            while (Date.now() < endTime) {
                particle.render(mockGraphics);
            }
            
            expect(particle.isFinished()).to.be.true;
        });

        it('should not render when finished', () => {
            // Force expire
            for (let i = 0; i < 100; i++) {
                particle.render(mockGraphics);
            }
            
            mockGraphics._ellipseCalls = [];
            particle.render(mockGraphics);
            
            expect(mockGraphics._ellipseCalls.length).to.equal(0);
        });
    });
});
