'use strict';

class Control {
    constructor(canvas) {
        this._buffer = 100;
        this._spawnBuffer = this._buffer - 30;
        this._boundingRect = new Rectangle( new Vector(0, 0), canvas.width, canvas.height );
        this._spawnRect = new Rectangle( new Vector(-this._spawnBuffer, -this._spawnBuffer), canvas.width + this._spawnBuffer*2, canvas.height + this._spawnBuffer*2 );
        this._clearRect = new Rectangle( new Vector(-this._buffer, -this._buffer), canvas.width + this._buffer*2, canvas.height + this._buffer*2 );
        this._environment = new Environment();
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

    spawnAsteroids() {
        let trajectory = this._getStartAndTarget();
        let start = trajectory.start;
        let target = trajectory.target;
        let traits = this._getAsteroidTraits(start, target);
        let velocity = traits.velocity;
        let size = traits.size;
        let mass = traits.mass;
        let asteroid = new Asteroid( new Circle(start, size), 'rgb(77, 51, 25)', velocity, mass );
        asteroid.collidable = true;

        this._environment.addObject(asteroid);
    }

    _getStartAndTarget() {
        let start;
        let target;
        let side = Math.floor( Math.random() * 4 );

        switch(side) {
            case 0: //top
                start = new Vector( Math.random() * this._spawnRect.width + this._spawnRect.x, this._spawnRect.y );
                target = new Vector( Math.random() * this._spawnRect.width + this._spawnRect.x, this._spawnRect.height + this._spawnRect.y );
                break;
            case 1: //right
                start = new Vector( this._spawnRect.width + this._spawnRect.x, Math.random() * this._spawnRect.height + this._spawnRect.y );
                target = new Vector( this._spawnRect.x, Math.random() * this._spawnRect.height + this._spawnRect.y );
                break;
            case 2: //bottom
                start = new Vector( Math.random() * this._spawnRect.width + this._spawnRect.x, this._spawnRect.height + this._spawnRect.y );
                target = new Vector( Math.random() * this._spawnRect.width + this._spawnRect.x, this._spawnRect.y );
                break;
            case 3: //left
                start = new Vector( this._spawnRect.x, Math.random() * this._spawnRect.height + this._spawnRect.y );
                target = new Vector( this._spawnRect.width + this._spawnRect.x, Math.random() * this._spawnRect.height + this._spawnRect.y );
                break;
        }

        return { start: start, target: target };
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

        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        player.collidable = true;
        player.bound = true;

        let planet = new Planet(new Circle(new Vector(400, 400), 120), 'rgb(51, 204, 51)', new Vector(0, 0), 1000000);
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