'use strict';

class Control {
    constructor(canvas) {
        this._buffer = 100;
        this._spawnBuffer = this._buffer - 30;
        this._boundingRect = new Rectangle( new Vector(0, 0), canvas.width, canvas.height );
        this._spawnRect = new Rectangle( new Vector(-this._spawnBuffer, -this._spawnBuffer), canvas.width + this._spawnBuffer*2, canvas.height + this._spawnBuffer*2 );
        this._clearRect = new Rectangle( new Vector(-this._buffer, -this._buffer), canvas.width + this._buffer*2, canvas.height + this._buffer*2 );
        this._environment = new Environment();

        this._asteroid = {  arr: [], spawning: false, groupFreq: new Timer(5), asterFreq: new Timer(0.4) };
    }

    load(name) {
        switch(name) {
            case "test":
                this._initTest("test1");
                return this._environment;
            default:
                console.log("No Such Load Level");
        }
    }

    spawn() {
        if (this._asteroid.groupFreq.stop()) {
            this._spawnAsteroidGroup();
        }
    }

    _spawnAsteroidGroup() {
        // if not spawning and timer stopped, initialize a new group of asteroids
        if (!this._asteroid.spawning) {
            if (this._asteroid.groupFreq.stop()) {
                this._asteroid.spawning = true;
                let segments = this._getStartAndTarget2(100, 5);
                let segS = segments.start;
                let segT = segments.target;
                let counter = round(Math.random() * (8 - 5) + 5, 0);

                // initialize asteroid array
                // horizontal segments
                if (segS.low.y == segS.high.y) {
                    this._fillAstArray(counter, "horizontal", segS.low.x, segS.high.x, segT.low.x, segT.high.x, segS.low.y, segT.low.y);
                } else { // vertical
                    this._fillAstArray(counter, "vertical", segS.low.y, segS.high.y, segT.low.y, segT.high.y, segS.low.x, segT.low.x);
                }
            }
        } 

        // if asteroid timer ran out, check asteroid array for asteroids. If one exists, spawn and reset timer
        else if (this._asteroid.asterFreq.stop()) {
            if (this._asteroid.arr.length == 0) {
                this._asteroid.spawning = false;
                this._asteroid.groupFreq.reset();
            } else {
                let info = this._asteroid.arr.shift();
                let asteroid = info.asteroid;
                this._asteroid.asterFreq.set(info.frequency);
                this._environment.addObject(asteroid);
            }
        }
    }

    // fills the asteroid array with counter number of asteroids at random freqeuncies
    _fillAstArray(counter, axis, low1, high1, low2, high2, oth1, oth2) {
        let frequency;

        for (let i = 0; i < counter; i++) {
            frequency = round( Math.random() * (0.7-0.4) + 0.4, 1 );
            // pick random x value on segment
            let distS = Math.random() * (high1 - low1) + low1;
            let distT = Math.random() * (high2 - low2) + low2;

            let start;
            let target;

            // get start and target points
            if (axis === "horizontal") {
                start = new Vector(distS, oth1);
                target = new Vector(distT, oth2);
            } else {
                start = new Vector(oth1, distS);
                target = new Vector(oth2, distT);
            }
            
            let asteroid = this._createAsteroid(start, target);
            // create asteroid
            this._asteroid.arr.push( { asteroid: asteroid, frequency: frequency } );
        }
    }

    _createAsteroid(start, target) {
        let traits = this._getAsteroidTraits(start, target);
        let velocity = traits.velocity;
        let size = traits.size;
        let mass = traits.mass;
        let asteroid = new Asteroid( new Circle(start, size), '#CEE776', velocity, mass );
        asteroid.collidable = true;
        asteroid.lifespan.set(Math.random() * 4 + 4);

        return asteroid;
    }

    // returns start and target segments
    _getStartAndTarget2(length, spread) {
        let low1;
        let low2;
        let high1;
        let high2;

        let side = Math.floor( Math.random() * 4 );
        let segment1;
        let segment2;

        switch(side) {
            case 0: //top
                segment1 = this._getSegment(length, this._spawnRect.x, this._spawnRect.x + this._spawnRect.width);
                segment2 = this._getSegment(length * spread, this._spawnRect.x, this._spawnRect.x + this._spawnRect.width);
                low1 = new Vector(segment1.low, this._spawnRect.y);
                high1 = new Vector(segment1.high, this._spawnRect.y);
                low2 = new Vector(segment2.low, this._spawnRect.y + this._spawnRect.height);
                high2 = new Vector(segment2.high, this._spawnRect.y + this._spawnRect.height);
                break;
            case 1: //right
                segment1 = this._getSegment(length, this._spawnRect.y, this._spawnRect.y + this._spawnRect.height);
                segment2 = this._getSegment(length * spread, this._spawnRect.y, this._spawnRect.y + this._spawnRect.height);
                low1 = new Vector(this._spawnRect.x + this._spawnRect.width, segment1.low);
                high1 = new Vector(this._spawnRect.x + this._spawnRect.width, segment1.high);
                low2 = new Vector(this._spawnRect.x, segment2.low);
                high2 = new Vector(this._spawnRect.x, segment2.high);
                break;
            case 2: //bottom
                segment1 = this._getSegment(length, this._spawnRect.x, this._spawnRect.x + this._spawnRect.width);
                segment2 = this._getSegment(length * spread, this._spawnRect.x, this._spawnRect.x + this._spawnRect.width);
                low1 = new Vector(segment1.low, this._spawnRect.y + this._spawnRect.height);
                high1 = new Vector(segment1.high, this._spawnRect.y + this._spawnRect.height);
                low2 = new Vector(segment2.low, this._spawnRect.y);
                high2 = new Vector(segment2.high, this._spawnRect.y);
                break;
            case 3: //left
                segment1 = this._getSegment(length, this._spawnRect.y, this._spawnRect.y + this._spawnRect.height);
                segment2 = this._getSegment(length * spread, this._spawnRect.y, this._spawnRect.y + this._spawnRect.height);
                low1 = new Vector(this._spawnRect.x, segment1.low);
                high1 = new Vector(this._spawnRect.x, segment1.high);
                low2 = new Vector(this._spawnRect.x + this._spawnRect.width, segment2.low);
                high2 = new Vector(this._spawnRect.x + this._spawnRect.width, segment2.high);
                break;
        }

        return { start:{low: low1, high: high1}, target:{low: low2, high: high2} };
    }

    // returns low and high endpoints of segment of length between p1 and p2
    // p2 > p1
    _getSegment(length, p1, p2) {
        let low;
        let high;

        let center = Math.random() * (p2-p1) + p1;
        let halfLength = length / 2;

        if (length >= p2 - p1) {
            low = p1;
            high = p2;
        } else if (center - halfLength < p1) {
            low = p1;
            high = p1 + length;
        } else if (center + halfLength > p2) {
            low = p2 - length;
            high = p2;
        } else {
            low = center - halfLength;
            high = center + halfLength;
        }

        return { low: low, high: high };
    }

    _getAsteroidTraits(start, target) {
        let min = 200;
        let max = 400;

        let angle = angleDxDy(target.x - start.x, target.y - start.y);
        let magnitude = Math.random() * (max-min) + min;
        let velocity = vectorToXY(magnitude, angle);
        let size = magnitude / 10;
        let mass = magnitude * 5;

        return { velocity: velocity, size: size, mass: mass };
    }

    _initTest(name) {
        // set properties
        let gravity = true;
        let pauseOn = true;

        // set objects based on the test
        let objects;
        switch(name) {
            case "test0":
                objects = this._test0();
                break;
            case "test1": 
                objects = this._test1();
                break;
            case "test2": 
                objects = this._test2();
                break;
            case "test3": 
                objects = this._test3();
                break;
            case "test4":
                objects = this._test4();
                break;
            case "test5":
                objects = this._test5();
                break;
            default: console.log("Control: no such test")
        }

        // set the engine
        let engine = new NarrowCollisionEngine();
        engine.setBoundingRect(this._boundingRect);
        
        this._environment.init(objects, engine, gravity, pauseOn);
        this._environment.clearRect = this._clearRect;
    }

    _test0() {
        let objects = [];
        let gam1 = this._createTestObject(new Vector(100, 100), new Vector(0, -25), 50, 1);
        let gam2 = this._createTestObject(new Vector(100, 300), new Vector(0, -75), 50, 1);

        objects.push(gam1);
        objects.push(gam2);

        return objects;
    }

    _test1() {
        let objects = [];

        let player = new Player(new Circle(new Vector(430, 100), 30), '#CC1201', new Vector(0, 0), 100);
        player.collidable = true;
        player.bound = true;

        let planet = new Planet(new Circle(new Vector(400, 400), 120), '#8BA821', new Vector(0, 0), 1000000);
        planet.collidable = true;

        objects.push(player);
        objects.push(planet);

        return objects;
    }

    _test2() {
        let objects = [];

        let gam1 = this._createTestObject(new Vector(100, 400), new Vector(50, 0), 50, 1);
        let gam2 = this._createTestObject(new Vector(500, 400), new Vector(-50, 0), 50, 1);
        let gam3 = this._createTestObject(new Vector(300, 400), new Vector(0, 0), 50, 1);
        let gam4 = this._createTestObject(new Vector(300, 200), new Vector(0, 50), 50, 1);
        let gam5 = this._createTestObject(new Vector(700, 250), new Vector(-100, 0), 50, 1);
        let gam6 = this._createTestObject(new Vector(100, 100), new Vector(30, 100), 50, 1);
        let gam7 = this._createTestObject(new Vector(800, 150), new Vector(0, 50), 50, 1);
        let gam8 = this._createTestObject(new Vector(800, 450), new Vector(0, -50), 50, 1);

        objects.push(gam1);
        objects.push(gam2);
        objects.push(gam3);
        objects.push(gam4);
        objects.push(gam5);
        objects.push(gam6);
        objects.push(gam7);
        objects.push(gam8);

        return objects;
    }

    _test3() {
        let objects = [];

        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 20);
        player.collidable = true;
        player.bound = true;

        let gam1 = this._createTestObject(new Vector(100, 400), new Vector(50, 0), 30, 10);
        let gam2 = this._createTestObject(new Vector(500, 400), new Vector(-50, 0), 30, 10);
        let gam3 = this._createTestObject(new Vector(300, 400), new Vector(0, 0), 60, 100);
        let gam4 = this._createTestObject(new Vector(300, 200), new Vector(0, 50), 10, 5);
        let gam5 = this._createTestObject(new Vector(700, 250), new Vector(-200, 0), 40, 80);
        let gam6 = this._createTestObject(new Vector(100, 100), new Vector(30, 100), 40, 80);
        let gam7 = this._createTestObject(new Vector(800, 150), new Vector(0, 50), 100, 300);
        let gam8 = this._createTestObject(new Vector(800, 450), new Vector(0, -50), 60, 100);

        objects.push(player);
        objects.push(gam1);
        objects.push(gam2);
        objects.push(gam3);
        objects.push(gam4);
        objects.push(gam5);
        objects.push(gam6);
        objects.push(gam7);
        objects.push(gam8);

        return objects;
    }

    _test4() {
        let objects = [];
        
        let gam1 = this._createTestObject(new Vector(100, 100), new Vector(50, 50), 30, 10);
        let gam2 = this._createTestObject(new Vector(500, 100), new Vector(-50, 50), 30, 10);
        let gam3 = this._createTestObject(new Vector(100, 500), new Vector(50, -50), 30, 10);
        let gam4 = this._createTestObject(new Vector(500, 500), new Vector(-50, -50), 30, 10);

        objects.push(gam1);
        objects.push(gam2);
        objects.push(gam3);
        objects.push(gam4);

        return objects;
    }

    _test5() {
        let objects = [];

        let gam1 = this._createTestObject(new Vector(500, 300), new Vector(0, 1), 10, 400);
        let gam2 = this._createTestObject(new Vector(525, 300), new Vector(0, 1), 10, 400);
        let gam3 = this._createTestObject(new Vector(100, 300), new Vector(5000, 0), 10, 5);

        objects.push(gam1);
        objects.push(gam2);
        objects.push(gam3);

        return objects;
    }

    _createTestObject(position, velocity, size, mass, color) {
        let obj = new GameObject(new Circle(position, size), 'rgb(51, 204, 51)', velocity, mass);
        obj.collidable = true;
        obj.bound = true;

        return obj;
    }
}