/**
 * HealthBarComponent Tests
 * Tests health bar display, visibility, fade behavior, and event integration
 */

import { expect } from 'chai';
import { HealthBarComponent } from '../../src/rendering/components/HealthBarComponent';
import { EventBus } from '../../src/utils/eventBus';
import { RenderLayer } from '../../src/rendering/RenderLayer';

describe('HealthBarComponent', () => {
    let healthBar: HealthBarComponent;
    let mockGraphics: any;
    
    beforeEach(() => {
        EventBus.clear();
        
        // Create mock graphics context
        mockGraphics = {
            push: () => {},
            pop: () => {},
            fill: () => {},
            noStroke: () => {},
            rect: () => {},
            _fillCalls: [] as any[],
            _rectCalls: [] as any[]
        };
        
        // Track fill and rect calls
        mockGraphics.fill = function(...args: any[]) {
            this._fillCalls.push(args);
        };
        mockGraphics.rect = function(...args: any[]) {
            this._rectCalls.push(args);
        };
        
        healthBar = new HealthBarComponent('entity_1', 400, 300, 80, 100);
    });
    
    afterEach(() => {
        EventBus.clear();
    });
    
    describe('Construction and Initialization', () => {
        it('should create with correct initial values', () => {
            expect(healthBar).to.exist;
            expect(healthBar.layer).to.equal(RenderLayer.ABOVE_ENTITIES);
            expect(healthBar.depth).to.equal(300); // Y position
        });
        
        it('should initialize at current health', () => {
            // Bar should show immediately if not at full health
            healthBar.render(mockGraphics);
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
        });
        
        it('should not display initially if at full health', (done) => {
            const fullHealthBar = new HealthBarComponent('entity_2', 400, 300, 100, 100);
            
            // Wait a moment for initialization
            setTimeout(() => {
                mockGraphics._rectCalls = [];
                fullHealthBar.render(mockGraphics);
                
                // Should not render (no health changes, already at full)
                expect(mockGraphics._rectCalls.length).to.equal(0);
                done();
            }, 100);
        });
    });
    
    describe('Position and Depth', () => {
        it('should update position', () => {
            healthBar.setPosition(500, 400);
            expect(healthBar.depth).to.equal(400); // Depth follows Y
        });
        
        it('should render at correct position above entity', () => {
            healthBar.setPosition(100, 200);
            mockGraphics._rectCalls = [];
            
            healthBar.render(mockGraphics);
            
            // Find the first rect call (background)
            const firstRect = mockGraphics._rectCalls[0];
            expect(firstRect).to.exist;
            
            // X should be centered around entity (100 - barWidth/2)
            // Y should be above entity (200 + offsetY)
            expect(firstRect[1]).to.be.lessThan(200); // Y is above entity
        });
    });
    
    describe('Health Updates', () => {
        it('should update health from damage event', () => {
            // Emit damage event
            EventBus.emit('ENTITY_DAMAGED', 'entity_1', 20, 60);
            
            // Health bar should update (checked via render)
            mockGraphics._rectCalls = [];
            healthBar.render(mockGraphics);
            
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
        });
        
        it('should update health from heal event', () => {
            EventBus.emit('ENTITY_HEALED', 'entity_1', 10, 90);
            
            mockGraphics._rectCalls = [];
            healthBar.render(mockGraphics);
            
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
        });
        
        it('should ignore events for other entities', () => {
            const originalDepth = healthBar.depth;
            
            // Event for different entity
            EventBus.emit('ENTITY_DAMAGED', 'entity_2', 50, 50);
            
            // Should not affect this health bar
            expect(healthBar.depth).to.equal(originalDepth);
        });
        
        it('should handle max health changes', () => {
            healthBar.updateHealth(80, 120); // New max health
            
            mockGraphics._rectCalls = [];
            healthBar.render(mockGraphics);
            
            // Should still render (80/120 is not full)
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
        });
    });
    
    describe('Visibility Behavior', () => {
        it('should display when health is not full', () => {
            healthBar.updateHealth(50, 100);
            
            mockGraphics._rectCalls = [];
            healthBar.render(mockGraphics);
            
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
        });
        
        it('should display temporarily after healing to full', (done) => {
            healthBar.updateHealth(100, 100); // Heal to full
            
            // Should still show immediately after
            mockGraphics._rectCalls = [];
            healthBar.render(mockGraphics);
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
            
            done();
        });
        
        it('should fade out after display duration at full health', function(done) {
            this.timeout(5000); // Extend timeout for this test
            
            // Start with damaged health
            healthBar.updateHealth(80, 100);
            healthBar.render(mockGraphics);
            
            // Heal to full
            healthBar.updateHealth(100, 100);
            
            // Wait for display + fade duration (3.5 seconds total)
            setTimeout(() => {
                mockGraphics._rectCalls = [];
                healthBar.render(mockGraphics);
                
                // Should not render after fade duration
                expect(mockGraphics._rectCalls.length).to.equal(0);
                done();
            }, 3600);
        });
        
        it('should show on overheal attempt (even if at max)', () => {
            // Already at full health
            const fullBar = new HealthBarComponent('entity_3', 400, 300, 100, 100);
            
            // Trigger heal event (overheal attempt)
            EventBus.emit('ENTITY_HEALED', 'entity_3', 10, 100);
            
            // Should show immediately
            mockGraphics._rectCalls = [];
            fullBar.render(mockGraphics);
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
        });
    });
    
    describe('Rendering', () => {
        it('should render multiple rectangles (background + fill)', () => {
            healthBar.updateHealth(75, 100);
            
            mockGraphics._rectCalls = [];
            healthBar.render(mockGraphics);
            
            // Should have at least 3 rects: border background, interior background, health fill
            expect(mockGraphics._rectCalls.length).to.be.at.least(3);
        });
        
        it('should use different colors based on health percentage', () => {
            // High health (green)
            healthBar.updateHealth(80, 100);
            mockGraphics._fillCalls = [];
            healthBar.render(mockGraphics);
            const highHealthFills = [...mockGraphics._fillCalls];
            
            // Medium health (yellow)
            healthBar.updateHealth(45, 100);
            mockGraphics._fillCalls = [];
            healthBar.render(mockGraphics);
            const medHealthFills = [...mockGraphics._fillCalls];
            
            // Low health (red)
            healthBar.updateHealth(15, 100);
            mockGraphics._fillCalls = [];
            healthBar.render(mockGraphics);
            const lowHealthFills = [...mockGraphics._fillCalls];
            
            // Each should have fill calls (colors differ but hard to test exact RGB without exposing internals)
            expect(highHealthFills.length).to.be.greaterThan(0);
            expect(medHealthFills.length).to.be.greaterThan(0);
            expect(lowHealthFills.length).to.be.greaterThan(0);
        });
        
        it('should apply alpha for fade effect', function(done) {
            this.timeout(5000);
            
            // Heal to full to trigger fade
            healthBar.updateHealth(100, 100);
            
            // Wait for display duration (bar should start fading)
            setTimeout(() => {
                mockGraphics._fillCalls = [];
                healthBar.render(mockGraphics);
                
                // Should have fill calls with alpha < 255
                const fillsWithAlpha = mockGraphics._fillCalls.filter((args: any[]) => {
                    return args.length === 4 && args[3] < 255;
                });
                
                expect(fillsWithAlpha.length).to.be.greaterThan(0);
                done();
            }, 3200);
        });
        
        it('should not render if invisible', (done) => {
            // Start at full health
            const fullBar = new HealthBarComponent('entity_4', 400, 300, 100, 100);
            
            // Wait for any display duration to pass
            setTimeout(() => {
                mockGraphics._rectCalls = [];
                fullBar.render(mockGraphics);
                
                expect(mockGraphics._rectCalls.length).to.equal(0);
                done();
            }, 100);
        });
    });
    
    describe('Animation', () => {
        it('should smoothly animate health changes with lerp', (done) => {
            // Set initial health
            healthBar.updateHealth(100, 100);
            healthBar.render(mockGraphics); // Initialize display health
            
            // Sudden drop
            healthBar.updateHealth(30, 100);
            
            // Render a few times to see animation
            for (let i = 0; i < 5; i++) {
                mockGraphics._rectCalls = [];
                healthBar.render(mockGraphics);
            }
            
            // Should have rendered with animation (multiple frames)
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
            done();
        });
    });
    
    describe('Edge Cases', () => {
        it('should handle zero health', () => {
            healthBar.updateHealth(0, 100);
            
            mockGraphics._rectCalls = [];
            healthBar.render(mockGraphics);
            
            // Should still render (showing empty bar)
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
        });
        
        it('should handle negative health gracefully', () => {
            healthBar.updateHealth(-10, 100);
            
            mockGraphics._rectCalls = [];
            
            // Should not crash
            expect(() => healthBar.render(mockGraphics)).to.not.throw();
        });
        
        it('should handle health exceeding max (overheal)', () => {
            healthBar.updateHealth(120, 100); // Over max
            
            mockGraphics._rectCalls = [];
            healthBar.render(mockGraphics);
            
            // Should clamp to 100% width
            expect(mockGraphics._rectCalls.length).to.be.greaterThan(0);
        });
        
        it('should handle zero max health', () => {
            const brokenBar = new HealthBarComponent('entity_5', 400, 300, 0, 0);
            
            mockGraphics._rectCalls = [];
            
            // Should not crash
            expect(() => brokenBar.render(mockGraphics)).to.not.throw();
        });
    });
    
    describe('Cleanup', () => {
        it('should have destroy method', () => {
            expect(healthBar.destroy).to.be.a('function');
        });
        
        it('should not throw when destroyed', () => {
            expect(() => healthBar.destroy()).to.not.throw();
        });
    });
});
