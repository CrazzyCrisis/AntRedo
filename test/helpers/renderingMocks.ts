/**
 * Reusable test helpers and mocks for rendering system tests.
 * Minimizes redundant code across test files.
 */

import { Renderable } from '../../src/rendering/Renderable';
import { RenderLayer } from '../../src/rendering/RenderLayer';

// Mock p5.js constants globally for Node.js test environment
// These must be available before any component files are imported
if (typeof (global as any).CENTER === 'undefined') {
    (global as any).CENTER = 'center';
    (global as any).LEFT = 'left';
    (global as any).RIGHT = 'right';
    (global as any).TOP = 'top';
    (global as any).BOTTOM = 'bottom';
    (global as any).BASELINE = 'baseline';
}

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
        textWidth: function(text: string) {
            // Mock text width calculation - roughly 8 pixels per character
            return text.length * 8;
        },
        line: function(_x1: number, _y1: number, _x2: number, _y2: number) {
            this._lineDrawn = true;
        },
        ellipse: function() {
            this._ellipseDrawn = true;
        },
        triangle: function() {
            this._triangleDrawn = true;
        },
        noSmooth: function() {
            this._noSmoothCalled = true;
        },
        smooth: function() {
            this._smoothCalled = true;
        },
        strokeJoin: function() {
            this._strokeJoinSet = true;
        },
        strokeCap: function() {
            this._strokeCapSet = true;
        },
        // Tracking flags
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
        _textAlignSet: false,
        _lineDrawn: false,
        _ellipseDrawn: false,
        _triangleDrawn: false,
        _noSmoothCalled: false,
        _smoothCalled: false,
        _strokeJoinSet: false,
        _strokeCapSet: false
    };
}

/**
 * Creates a mock p5.SoundFile object with all necessary methods
 */
export function createMockSound() {
    return {
        _volume: 1.0,
        _isPlaying: false,
        _isPaused: false,
        _isLooping: false,
        
        setVolume: function(vol: number) {
            this._volume = vol;
        },
        
        play: function() {
            this._isPlaying = true;
            this._isPaused = false;
        },
        
        stop: function() {
            this._isPlaying = false;
            this._isPaused = false;
            this._isLooping = false;
        },
        
        pause: function() {
            this._isPaused = true;
            this._isPlaying = false;
        },
        
        loop: function() {
            this._isPlaying = true;
            this._isPaused = false;
            this._isLooping = true;
        },
        
        isPlaying: function() {
            return this._isPlaying;
        },
        
        isPaused: function() {
            return this._isPaused;
        },
        
        isLooping: function() {
            return this._isLooping;
        }
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
