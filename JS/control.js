'use strict';

// controls what enters the environment
class Control {
    constructor(canvas) {
        // buffer between bounding rect and clearing rect
        this._buffer = 100;

        // buffer between bounding rect and spawning rect
        this._spawnBuffer = this._buffer - 30;

        // all rectangles: bounding rect keeps objects inside game, spawning rect provides spawning locations, clearing rect removes stray objects
        this._boundingRect = new Rectangle( new Vector(0, 0), canvas.width, canvas.height );
        this._spawnRect = new Rectangle( new Vector(-this._spawnBuffer, -this._spawnBuffer), canvas.width + this._spawnBuffer*2, canvas.height + this._spawnBuffer*2 );
        this._clearRect = new Rectangle( new Vector(-this._buffer, -this._buffer), canvas.width + this._buffer*2, canvas.height + this._buffer*2 );
        
        // the environment for current game
        this._environment = new Environment();

        // spawning details
        this._toggleSpawn = { asteroids: true }
        this._asteroids = { arr: [], spawning: false,
                            groupFreq: new Timer(5), indivFreq: new Timer(0.4),
                            min: { range: 200, mult: 0.5, count: 5, life: 4, gfreq: 2, ifreq: 0.4, speed: 200, mass: 80, size: 20 }, 
                            max: { range: 800, mult: 3, count: 6, life: 8, gfreq: 3, ifreq: 0.5, speed: 500, mass: 200, size: 40 } };
    }

    // load a level with the given name
    load(name) {
        switch(name) {
            case "test":
                this._initTest("test1");
                return this._environment;
            default:
                console.log("No Such Load Level");
        }
    }

    // spawns objects
    // to toggle spawning, modify this._toggleSpawn
    spawn() {
        if (this._toggleSpawn.asteroids) {
            if (this._asteroids.groupFreq.stop()) {
                this._fillAstArray();
                this._asteroids.groupFreq.set( random(this._asteroids.min.gfreq, this._asteroids.max.gfreq) );
            }

            this._spawnAstGroup();
        }
    }

    _spawnAstGroup() {
        if (this._asteroids.arr.length > 0 && this._asteroids.indivFreq.stop()) {
            let info = this._asteroids.arr.shift();
            let asteroid = info.asteroid;
            asteroid.lifespan.reset()
            this._asteroids.indivFreq.set(info.frequency);
            this._environment.addObject(asteroid);
        }
    }

    _fillAstArray() {
        let segments = this._getStartAndTarget( random(this._asteroids.min.range, this._asteroids.max.range), 
                                                random(this._asteroids.min.mult , this._asteroids.max.mult, 1));
        let segS = segments.start;
        let segT = segments.target;
        let count = random(this._asteroids.min.count, this._asteroids.max.count);

        // initialize asteroid array
        // horizontal segments
        if (segS.low.y == segS.high.y) {
            this._asteroids.arr = this._getArray(count, "horizontal", segS.low.x, segS.high.x, segT.low.x, segT.high.x, segS.low.y, segT.low.y);
        } else { // vertical
            this._asteroids.arr = this._getArray(count, "vertical", segS.low.y, segS.high.y, segT.low.y, segT.high.y, segS.low.x, segT.low.x);
        }


        // // if not spawning and timer stopped, initialize a new group of asteroids
        // if (!this._asteroids.spawning) {
        //     if (this._asteroids.groupFreq.stop()) {
                
        //     }
        // } 

        // // if asteroid timer ran out, check asteroid array for asteroids. If one exists, spawn and reset timer
        // else if (this._asteroids.indivFreq.stop()) {
        //     if (this._asteroids.arr.length == 0) {
        //         this._asteroids.spawning = false;
        //         //this._asteroids.groupFreq.set( random(this._asteroids.min.gfreq, this._asteroids.max.gfreq) );
        //     } else {
        //         let info = this._asteroids.arr.shift();
        //         let asteroid = info.asteroid;
        //         asteroid.lifespan.reset()
        //         this._asteroids.indivFreq.set(info.frequency);
        //         this._environment.addObject(asteroid);
        //     }
        // }
    }

    // fills the asteroid array with counter number of asteroids at random freqeuncies
    _getArray(counter, axis, low1, high1, low2, high2, oth1, oth2) {
        let arr = [];
        let frequency;

        for (let i = 0; i < counter; i++) {
            frequency = random( this._asteroids.min.ifreq, this._asteroids.max.ifreq, 1 );

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
            arr.push( { asteroid: asteroid, frequency: frequency } );
        }

        return arr;
    }

    _createAsteroid(start, target) {
        let traits = this._getAsteroidTraits(start, target);
        let velocity = traits.velocity;
        let size = traits.size;
        let mass = traits.mass;
        let asteroid = new Asteroid( new Circle(start, size), '#CEE776', velocity, mass );
        asteroid.collidable = true;
        asteroid.lifespan.set( random(this._asteroids.min.life, this._asteroids.max.life) );

        return asteroid;
    }

    _getAsteroidTraits(start, target) {
        let angle = angleDxDy(target.x - start.x, target.y - start.y);
        let speed = random(this._asteroids.min.speed, this._asteroids.max.speed, 1);
        let velocity = vectorToXY(speed, angle);

        // find ratio of speed to its range
        let ratio = 1 - (speed - this._asteroids.min.speed) / (this._asteroids.max.speed - this._asteroids.min.speed);

        // size and mass are inversely proportional to speed (small object moves faster)
        let size = (this._asteroids.max.size - this._asteroids.min.size) * ratio + this._asteroids.min.size;
        let mass = (this._asteroids.max.mass - this._asteroids.min.mass) * ratio + this._asteroids.min.mass;

        return { velocity: velocity, size: size, mass: mass };
    }

    // returns start and target segments
    _getStartAndTarget(length, spread) {
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

        // set the camera position, centered on player
        let camera = new Camera();
        camera.init(objects);

        // set the engine
        let engine = new NarrowCollisionEngine();
        engine.setBoundingRect(this._boundingRect);
        
        this._environment.init(objects, engine, camera, gravity, pauseOn);
        this._environment.clearRect = this._clearRect;
    }

    _test0() {
        let objects = [];
        // let gam1 = this._createTestObject(new Vector(100, 100), new Vector(0, -25), 50, 1);
        // let gam2 = this._createTestObject(new Vector(100, 300), new Vector(0, -75), 50, 1);

        // objects.push(gam1);
        // objects.push(gam2);

        return objects;
    }

    _test1() {
        let objects = [];

        let player = new Player(new Circle(new Vector(500, 350), 30), '#CC1201', new Vector(0, 50), 100);
        player.collidable = true;
        player.bound = true;

        let planet = new Planet(new Circle(new Vector(300, 500), 120), '#8BA821', new Vector(0, 0), 1000000);
        planet.collidable = true;

        let planet2 = new Planet(new Circle(new Vector(700, 200), 80), '#8BA821', new Vector(0, 0), 500000);
        planet2.collidable = true;

        objects.push(player);
        objects.push(planet);
        objects.push(planet2);

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



































class Camera {
    constructor() {
        this._center = new Vector(0,0);
    }

    init(objects) {
        this._initTopDown(objects);
    }

    update(objects) {
        this._updateTopDown(objects);
    }

    // centers the camera on the player, or (0, 0) if player doesn't exist
    _initTopDown(objects) {
        for (let i = 0; i < objects.length; i++) {
            let current = objects[i];
            if (current instanceof Player) {
                this._center.addTo(current.pos);
            }
        }
    }

    // updates camera so that it is centered on player
    _updateTopDown(objects) {
        // calculate the players motion
        let translation;
        for (let i = 0; i < objects.length; i++) {
            let current = objects[i];
            if (current instanceof Player) {
                let magnitude = distance(this._center, current.pos);
                let angle = angleDxDy(this._center.x - current.pos.x, this._center.y - current.pos.y);
                translation = vectorToXY(magnitude, angle);
                break;
            }
        }

        // translate all gameobjects by player's motion
        if (defined(translation)) {
            for (let i = 0; i < objects.length; i++) {
                let current = objects[i];
                this._translate(current, translation);
            }
        }
    }

    // Behaviors
    _translate(object, translation) {
        object.pos.addTo(translation);
    }

    _zoom() {

    }
}