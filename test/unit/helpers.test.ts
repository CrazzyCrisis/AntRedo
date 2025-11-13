import { expect } from 'chai';
import {
    randomInt,
    randomFloat,
    distance,
    clamp,
    lerp,
    mapRange,
    pointInRect,
    pointInCircle,
    rectIntersect,
    circleIntersect,
    randomChoice,
    shuffleArray,
    angleBetween,
    degToRad,
    radToDeg,
    normalizeAngle,
    deepClone,
    formatTime,
    percentage,
    worldToGrid,
    gridToWorld,
    gridToWorldCenter,
    getNeighbors4,
    getNeighbors8,
    vectorMagnitude,
    vectorNormalize,
    vectorLimit,
    manhattanDistance,
    inRange,
    wrap,
    hexToRgb,
    rgbToHex,
    lerpColor,
    FPSCounter,
    Timer,
    StateMachine,
    chunkArray,
    removeFromArray,
    weightedRandomChoice,
    arraysEqual,
    uniqueArray,
    sumArray,
    averageArray
} from '../../src/utils/helpers';

describe('Math Utilities', () => {
    describe('randomInt()', () => {
        it('should return integer within range', () => {
            for (let i = 0; i < 100; i++) {
                const result = randomInt(1, 10);
                expect(result).to.be.at.least(1);
                expect(result).to.be.at.most(10);
                expect(Number.isInteger(result)).to.be.true;
            }
        });

        it('should handle single value range', () => {
            const result = randomInt(5, 5);
            expect(result).to.equal(5);
        });
    });

    describe('randomFloat()', () => {
        it('should return float within range', () => {
            for (let i = 0; i < 100; i++) {
                const result = randomFloat(0, 1);
                expect(result).to.be.at.least(0);
                expect(result).to.be.at.most(1);
            }
        });
    });

    describe('distance()', () => {
        it('should calculate distance between two points', () => {
            expect(distance(0, 0, 3, 4)).to.equal(5);
            expect(distance(0, 0, 0, 0)).to.equal(0);
            expect(distance(1, 1, 4, 5)).to.equal(5);
        });
    });

    describe('clamp()', () => {
        it('should clamp value between min and max', () => {
            expect(clamp(5, 0, 10)).to.equal(5);
            expect(clamp(-5, 0, 10)).to.equal(0);
            expect(clamp(15, 0, 10)).to.equal(10);
        });
    });

    describe('lerp()', () => {
        it('should interpolate between values', () => {
            expect(lerp(0, 10, 0)).to.equal(0);
            expect(lerp(0, 10, 1)).to.equal(10);
            expect(lerp(0, 10, 0.5)).to.equal(5);
            expect(lerp(10, 20, 0.5)).to.equal(15);
        });
    });

    describe('mapRange()', () => {
        it('should map value from one range to another', () => {
            expect(mapRange(5, 0, 10, 0, 100)).to.equal(50);
            expect(mapRange(0, 0, 10, 0, 100)).to.equal(0);
            expect(mapRange(10, 0, 10, 0, 100)).to.equal(100);
        });
    });
});

describe('Collision Detection', () => {
    describe('pointInRect()', () => {
        it('should detect point inside rectangle', () => {
            expect(pointInRect(5, 5, 0, 0, 10, 10)).to.be.true;
            expect(pointInRect(0, 0, 0, 0, 10, 10)).to.be.true;
            expect(pointInRect(15, 15, 0, 0, 10, 10)).to.be.false;
        });
    });

    describe('pointInCircle()', () => {
        it('should detect point inside circle', () => {
            expect(pointInCircle(0, 0, 0, 0, 10)).to.be.true;
            expect(pointInCircle(5, 0, 0, 0, 10)).to.be.true;
            expect(pointInCircle(15, 0, 0, 0, 10)).to.be.false;
        });
    });

    describe('rectIntersect()', () => {
        it('should detect rectangle intersection', () => {
            expect(rectIntersect(0, 0, 10, 10, 5, 5, 10, 10)).to.be.true;
            expect(rectIntersect(0, 0, 10, 10, 20, 20, 10, 10)).to.be.false;
            expect(rectIntersect(0, 0, 10, 10, 0, 0, 10, 10)).to.be.true;
        });
    });

    describe('circleIntersect()', () => {
        it('should detect circle intersection', () => {
            expect(circleIntersect(0, 0, 5, 0, 0, 5)).to.be.true;
            expect(circleIntersect(0, 0, 5, 10, 0, 5)).to.be.true;
            expect(circleIntersect(0, 0, 5, 20, 0, 5)).to.be.false;
        });
    });
});

describe('Array Utilities', () => {
    describe('randomChoice()', () => {
        it('should pick element from array', () => {
            const arr = [1, 2, 3, 4, 5];
            const result = randomChoice(arr);
            expect(arr).to.include(result);
        });
    });

    describe('shuffleArray()', () => {
        it('should return new shuffled array', () => {
            const original = [1, 2, 3, 4, 5];
            const shuffled = shuffleArray(original);
            
            expect(shuffled).to.have.lengthOf(5);
            expect(shuffled).to.have.members(original);
            expect(original).to.deep.equal([1, 2, 3, 4, 5]); // Original unchanged
        });
    });

    describe('chunkArray()', () => {
        it('should split array into chunks', () => {
            const result = chunkArray([1, 2, 3, 4, 5, 6], 2);
            expect(result).to.deep.equal([[1, 2], [3, 4], [5, 6]]);
        });

        it('should handle uneven chunks', () => {
            const result = chunkArray([1, 2, 3, 4, 5], 2);
            expect(result).to.deep.equal([[1, 2], [3, 4], [5]]);
        });
    });

    describe('removeFromArray()', () => {
        it('should remove element from array', () => {
            const arr = [1, 2, 3, 4, 5];
            removeFromArray(arr, 3);
            expect(arr).to.deep.equal([1, 2, 4, 5]);
        });

        it('should handle non-existent element', () => {
            const arr = [1, 2, 3];
            removeFromArray(arr, 5);
            expect(arr).to.deep.equal([1, 2, 3]);
        });
    });

    describe('weightedRandomChoice()', () => {
        it('should pick weighted element', () => {
            const items = ['a', 'b', 'c'];
            const weights = [1, 0, 0]; // Only 'a' should be picked
            
            for (let i = 0; i < 10; i++) {
                const result = weightedRandomChoice(items, weights);
                expect(result).to.equal('a');
            }
        });
    });

    describe('arraysEqual()', () => {
        it('should compare arrays', () => {
            expect(arraysEqual([1, 2, 3], [1, 2, 3])).to.be.true;
            expect(arraysEqual([1, 2, 3], [1, 2, 4])).to.be.false;
            expect(arraysEqual([1, 2], [1, 2, 3])).to.be.false;
        });
    });

    describe('uniqueArray()', () => {
        it('should remove duplicates', () => {
            expect(uniqueArray([1, 2, 2, 3, 3, 3])).to.deep.equal([1, 2, 3]);
            expect(uniqueArray([1, 1, 1, 1])).to.deep.equal([1]);
        });
    });

    describe('sumArray()', () => {
        it('should sum array values', () => {
            expect(sumArray([1, 2, 3, 4, 5])).to.equal(15);
            expect(sumArray([])).to.equal(0);
        });
    });

    describe('averageArray()', () => {
        it('should calculate average', () => {
            expect(averageArray([1, 2, 3, 4, 5])).to.equal(3);
            expect(averageArray([10, 20])).to.equal(15);
            expect(averageArray([])).to.equal(0);
        });
    });
});

describe('Angle and Trigonometry', () => {
    describe('angleBetween()', () => {
        it('should calculate angle between points', () => {
            expect(angleBetween(0, 0, 1, 0)).to.equal(0);
            expect(angleBetween(0, 0, 0, 1)).to.be.closeTo(Math.PI / 2, 0.001);
        });
    });

    describe('degToRad()', () => {
        it('should convert degrees to radians', () => {
            expect(degToRad(0)).to.equal(0);
            expect(degToRad(180)).to.be.closeTo(Math.PI, 0.001);
            expect(degToRad(90)).to.be.closeTo(Math.PI / 2, 0.001);
        });
    });

    describe('radToDeg()', () => {
        it('should convert radians to degrees', () => {
            expect(radToDeg(0)).to.equal(0);
            expect(radToDeg(Math.PI)).to.be.closeTo(180, 0.001);
            expect(radToDeg(Math.PI / 2)).to.be.closeTo(90, 0.001);
        });
    });

    describe('normalizeAngle()', () => {
        it('should normalize angle to 0-2π range', () => {
            expect(normalizeAngle(0)).to.equal(0);
            expect(normalizeAngle(Math.PI * 3)).to.be.closeTo(Math.PI, 0.001);
            expect(normalizeAngle(-Math.PI / 2)).to.be.closeTo(Math.PI * 1.5, 0.001);
        });
    });
});

describe('Grid Utilities', () => {
    describe('worldToGrid()', () => {
        it('should convert world coordinates to grid', () => {
            const result = worldToGrid(15, 25, 10);
            expect(result).to.deep.equal({ col: 1, row: 2 });
        });
    });

    describe('gridToWorld()', () => {
        it('should convert grid coordinates to world', () => {
            const result = gridToWorld(2, 3, 10);
            expect(result).to.deep.equal({ x: 20, y: 30 });
        });
    });

    describe('gridToWorldCenter()', () => {
        it('should convert grid to world center', () => {
            const result = gridToWorldCenter(2, 3, 10);
            expect(result).to.deep.equal({ x: 25, y: 35 });
        });
    });

    describe('getNeighbors4()', () => {
        it('should return 4 neighbors', () => {
            const neighbors = getNeighbors4(5, 5);
            expect(neighbors).to.have.lengthOf(4);
            expect(neighbors).to.deep.include({ col: 5, row: 4 }); // top
            expect(neighbors).to.deep.include({ col: 6, row: 5 }); // right
            expect(neighbors).to.deep.include({ col: 5, row: 6 }); // bottom
            expect(neighbors).to.deep.include({ col: 4, row: 5 }); // left
        });
    });

    describe('getNeighbors8()', () => {
        it('should return 8 neighbors', () => {
            const neighbors = getNeighbors8(5, 5);
            expect(neighbors).to.have.lengthOf(8);
        });
    });
});

describe('Vector Utilities', () => {
    describe('vectorMagnitude()', () => {
        it('should calculate vector magnitude', () => {
            expect(vectorMagnitude(3, 4)).to.equal(5);
            expect(vectorMagnitude(0, 0)).to.equal(0);
        });
    });

    describe('vectorNormalize()', () => {
        it('should normalize vector', () => {
            const result = vectorNormalize(3, 4);
            expect(result.x).to.be.closeTo(0.6, 0.001);
            expect(result.y).to.be.closeTo(0.8, 0.001);
        });

        it('should handle zero vector', () => {
            const result = vectorNormalize(0, 0);
            expect(result).to.deep.equal({ x: 0, y: 0 });
        });
    });

    describe('vectorLimit()', () => {
        it('should limit vector magnitude', () => {
            const result = vectorLimit(10, 0, 5);
            expect(result.x).to.equal(5);
            expect(result.y).to.equal(0);
        });

        it('should not change vector below limit', () => {
            const result = vectorLimit(3, 0, 5);
            expect(result.x).to.equal(3);
            expect(result.y).to.equal(0);
        });
    });

    describe('manhattanDistance()', () => {
        it('should calculate Manhattan distance', () => {
            expect(manhattanDistance(0, 0, 3, 4)).to.equal(7);
            expect(manhattanDistance(1, 1, 4, 5)).to.equal(7);
        });
    });
});

describe('Utility Functions', () => {
    describe('inRange()', () => {
        it('should check if value is in range', () => {
            expect(inRange(5, 0, 10)).to.be.true;
            expect(inRange(0, 0, 10)).to.be.true;
            expect(inRange(10, 0, 10)).to.be.true;
            expect(inRange(-1, 0, 10)).to.be.false;
            expect(inRange(11, 0, 10)).to.be.false;
        });
    });

    describe('wrap()', () => {
        it('should wrap value around range', () => {
            expect(wrap(15, 0, 10)).to.equal(5);
            expect(wrap(-5, 0, 10)).to.equal(5);
            expect(wrap(5, 0, 10)).to.equal(5);
        });
    });

    describe('deepClone()', () => {
        it('should deep clone object', () => {
            const obj = { a: 1, b: { c: 2 } };
            const clone = deepClone(obj);
            
            expect(clone).to.deep.equal(obj);
            expect(clone).to.not.equal(obj);
            expect(clone.b).to.not.equal(obj.b);
        });
    });

    describe('formatTime()', () => {
        it('should format time as MM:SS', () => {
            expect(formatTime(0)).to.equal('00:00');
            expect(formatTime(65)).to.equal('01:05');
            expect(formatTime(600)).to.equal('10:00');
        });
    });

    describe('percentage()', () => {
        it('should calculate percentage', () => {
            expect(percentage(50, 100)).to.equal(50);
            expect(percentage(25, 100)).to.equal(25);
            expect(percentage(0, 100)).to.equal(0);
            expect(percentage(50, 0)).to.equal(0);
        });
    });
});

describe('Color Utilities', () => {
    describe('hexToRgb()', () => {
        it('should convert hex to RGB', () => {
            expect(hexToRgb('#ff0000')).to.deep.equal({ r: 255, g: 0, b: 0 });
            expect(hexToRgb('#00ff00')).to.deep.equal({ r: 0, g: 255, b: 0 });
            expect(hexToRgb('#0000ff')).to.deep.equal({ r: 0, g: 0, b: 255 });
        });

        it('should handle hex without #', () => {
            expect(hexToRgb('ff0000')).to.deep.equal({ r: 255, g: 0, b: 0 });
        });
    });

    describe('rgbToHex()', () => {
        it('should convert RGB to hex', () => {
            expect(rgbToHex(255, 0, 0)).to.equal('#ff0000');
            expect(rgbToHex(0, 255, 0)).to.equal('#00ff00');
            expect(rgbToHex(0, 0, 255)).to.equal('#0000ff');
        });
    });

    describe('lerpColor()', () => {
        it('should interpolate between colors', () => {
            expect(lerpColor('#000000', '#ffffff', 0)).to.equal('#000000');
            expect(lerpColor('#000000', '#ffffff', 1)).to.equal('#ffffff');
        });
    });
});

describe('Classes', () => {
    describe('FPSCounter', () => {
        it('should track FPS', () => {
            const counter = new FPSCounter();
            
            for (let i = 0; i < 60; i++) {
                counter.update();
            }
            
            const fps = counter.getFPS();
            expect(fps).to.be.at.least(1);
        });
    });

    describe('Timer', () => {
        it('should track elapsed time', () => {
            const timer = new Timer(1000);
            timer.start();
            
            expect(timer.isFinished()).to.be.false;
            
            timer.update(500);
            expect(timer.getProgress()).to.equal(0.5);
            
            timer.update(500);
            expect(timer.isFinished()).to.be.true;
            expect(timer.getProgress()).to.equal(1);
        });

        it('should stop and reset', () => {
            const timer = new Timer(1000);
            timer.start();
            timer.update(500);
            
            timer.stop();
            timer.update(500);
            expect(timer.getProgress()).to.equal(0.5);
            
            timer.reset();
            expect(timer.getProgress()).to.equal(0);
        });
    });

    describe('StateMachine', () => {
        it('should manage states', () => {
            const sm = new StateMachine<'idle' | 'running' | 'jumping'>('idle');
            
            expect(sm.is('idle')).to.be.true;
            expect(sm.getCurrentState()).to.equal('idle');
            
            sm.setState('running');
            expect(sm.is('running')).to.be.true;
            expect(sm.wasState('idle')).to.be.true;
            
            sm.setState('jumping');
            expect(sm.is('jumping')).to.be.true;
            expect(sm.wasState('running')).to.be.true;
            expect(sm.getPreviousState()).to.equal('running');
        });
    });
});


