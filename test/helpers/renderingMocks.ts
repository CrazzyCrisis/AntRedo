/**
 * Reusable test helpers and mocks for rendering system tests.
 * Minimizes redundant code across test files.
 */

import { Renderable } from '../../src/rendering/Renderable';
import { RenderLayer } from '../../src/rendering/RenderLayer';

/**
 * Setup global window mock for p5.js constants
 */
export function setupWindowMock() {
    if (typeof (global as any).window === 'undefined') {
        (global as any).window = {
            CENTER: 'center',
            TOP: 'top',
            BOTTOM: 'bottom',
            LEFT: 'left',
            RIGHT: 'right'
        };
    }
}

/**
 * Creates a mock p5.Graphics object with tracking capabilities
 */
export function createMockGraphics(width: number = 800, height: number = 600) {
    return {
        width,
        height,
        clear: function() { 
            this._cleared = true; 
        },
        image: function() { 
            this._imageDrawn = true; 
        },
        push: function() { 
            this._pushCalled = true; 
        },
        pop: function() { 
            this._popCalled = true; 
        },
        translate: function(x: number, y: number) {
            this._translateX = x;
            this._translateY = y;
        },
        scale: function(x: number, y: number) {
            this._scaleX = x;
            this._scaleY = y;
        },
        fill: function() {
            this._fillSet = true;
        },
        stroke: function() {
            this._strokeSet = true;
        },
        strokeWeight: function() {
            this._strokeWeightSet = true;
        },
        noStroke: function() {
            this._noStrokeCalled = true;
        },
        rect: function() {
            this._rectDrawn = true;
        },
        circle: function() {
            this._circleDrawn = true;
        },
        text: function() {
            this._textDrawn = true;
        },
        textSize: function() {
            this._textSizeSet = true;
        },
        textAlign: function() {
            this._textAlignSet = true;
        },
        _cleared: false,
        _imageDrawn: false,
        _pushCalled: false,
        _popCalled: false,
        _translateX: 0,
        _translateY: 0,
        _scaleX: 1,
        _scaleY: 1,
        _fillSet: false,
        _strokeSet: false,
        _strokeWeightSet: false,
        _noStrokeCalled: false,
        _rectDrawn: false,
        _circleDrawn: false,
        _textDrawn: false,
        _textSizeSet: false,
        _textAlignSet: false
    };
}

/**
 * Creates a mock p5 instance with createGraphics method
 */
export function createMockP5(_width: number = 800, _height: number = 600) {
    return {
        createGraphics: (w: number, h: number) => createMockGraphics(w, h),
        image: function() {}
    };
}

/**
 * Reset tracking flags on a mock graphics object
 */
export function resetMockGraphics(graphics: any): void {
    graphics._cleared = false;
    graphics._imageDrawn = false;
    graphics._pushCalled = false;
    graphics._popCalled = false;
    graphics._translateX = 0;
    graphics._translateY = 0;
    graphics._scaleX = 1;
    graphics._scaleY = 1;
    graphics._fillSet = false;
    graphics._strokeSet = false;
    graphics._strokeWeightSet = false;
    graphics._noStrokeCalled = false;
    graphics._rectDrawn = false;
    graphics._circleDrawn = false;
    graphics._textDrawn = false;
    graphics._textSizeSet = false;
    graphics._textAlignSet = false;
}

/**
 * Mock Renderable implementation for testing
 */
export class MockRenderable implements Renderable {
    public renderCalled = false;
    
    constructor(
        public layer: RenderLayer,
        public depth: number,
        public x: number = 0,
        public y: number = 0
    ) {}
    
    render(_graphics: any): void {
        this.renderCalled = true;
    }
}
