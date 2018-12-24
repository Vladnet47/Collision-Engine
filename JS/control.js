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
        this._spawner = new Spawner();
        this._camera = new Camera();
    }

    // load a level with the given name
    load(name) {
        switch(name) {
            case "test":
                this._initTest("test2");
                return this._environment;
            default:
                console.log("No Such Load Level");
        }
    }

    spawn() {
        this._spawner.spawn();
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
        this._camera.init(objects);

        // set the engine
        let engine = new NarrowCollisionEngine();
        engine.setBoundingRect(this._boundingRect);
        
        // initialize environment
        this._environment.init(objects, engine, this._camera, gravity, pauseOn);
        this._environment.clearRect = this._clearRect;

        // initialize spawner
        this._spawner.init(this._environment, this._spawnRect);
        this._spawner.toggleAsteroid(false);
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





























class Spawner {
    constructor() {
        this._environment;
        this._spawnRect;
        this._spawnArr = [];
        this._toggleSpawn = { asteroids: false }

        this._asteroids = { groupFreq: new Timer(5), 
                            min: { range: 200, mult: 0.5, count: 5, life: 4, gfreq: 4, ifreq: 0.4, speed: 200, mass: 80, size: 20 }, 
                            max: { range: 800, mult: 3, count: 15, life: 8, gfreq: 8, ifreq: 1, speed: 500, mass: 200, size: 40 } };
    }

    init(environment, spawnRect) {
        this._environment = environment;
        this._spawnRect = spawnRect;
    }

    // toggle asteroid spawn on or off
    toggleAsteroid(state) {
        this._toggleSpawn.asteroids = state;
    }

    // spawns objects from spawn array
    spawn() {
        // add groups to spawn array
        this._addGroup();

        // spawn groups that are in spawn array
        let index = 0;
        let length = this._spawnArr.length;

        while (index < length) {
            let group = this._spawnArr[index];
            if (group.count > 0) {
                this._spawnGroup(group);
                index++;
            } else {
                // if group empty, remove it from the spawn array
                this._spawnArr.splice(index, 1);
                length--;
            }
        }
    }

    // adds a group to the spawn array
    // only if spawn is toggled on and group spawn timer has run out
    _addGroup() {
        // add new asteroid group if timer ran out
        if (this._toggleSpawn.asteroids && this._asteroids.groupFreq.stop()) {
            this._spawnArr.push( this._initGroup("asteroid") );
            this._asteroids.groupFreq.set( random(this._asteroids.min.gfreq, this._asteroids.max.gfreq) );
        }
    }

    // initializes a group of type objects
    // randomizes count and direction of group
    _initGroup(type) {
        let count, direc;
        let indivFreq = new Timer(0);
        
        // calculate starting and ending position for group
        switch(type) {
            case "asteroid":
                // get the count
                count = random(this._asteroids.min.count, this._asteroids.max.count);

                // get start and target position
                let range = random(this._asteroids.min.range, this._asteroids.max.range);
                let spread = random(this._asteroids.min.mult , this._asteroids.max.mult, 1);
                direc = this._getDirection(range, spread); 
                break;
            default:
                console.log("Spawner: group of type '" + type + "' does not exist");
                return;
        }

        return { type: type, count: count, direc: direc, indivFreq: indivFreq };
    }

    // spawns the next member of the given group if the individual spawn timer has run out
    _spawnGroup(group) {
        if (!group.indivFreq.stop()) {
            return;
        }

        group.count--;
        switch(group.type) {
            case "asteroid": 
                // set the individual asteroid spawn timer to the spawn frequency
                let freq = random( this._asteroids.min.ifreq, this._asteroids.max.ifreq, 1 );
                group.indivFreq.set(freq);

                // pick random x value on segment
                let direc = group.direc;
                let distS = Math.random() * (direc.high1 - direc.low1) + direc.low1;
                let distT = Math.random() * (direc.high2 - direc.low2) + direc.low2;
    
                let start;
                let target;
    
                // get start and target points for asteroid
                if (direc.axis == "horizontal") {
                    start = new Vector(distS, direc.oth1);
                    target = new Vector(distT, direc.oth2);
                } else {
                    start = new Vector(direc.oth1, distS);
                    target = new Vector(direc.oth2, distT);
                }
                let asteroid = this._getAsteroid(start, target);

                // add asteroid to the environment
                this._environment.addObject(asteroid);
                break;
        }
    }

    // returns an asteroid with randomized velocity, size, mass, and lifespan
    _getAsteroid(start, target) {
        let traits = this._getAsteroidTraits(start, target);
        let velocity = traits.velocity;
        let size = traits.size;
        let mass = traits.mass;
        let asteroid = new Asteroid( new Circle(start, size), '#CEE776', velocity, mass );
        asteroid.collidable = true;
        asteroid.lifespan.set( random(this._asteroids.min.life, this._asteroids.max.life) );

        return asteroid;
    }

    // calculates the proper velocity, size, and mass of asteroid
    // faster asteroids are smaller and less massive
    // slower asteroids are bigger and more massive
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

    // returns the direction parameters
    // picks a random start side on spawn rectangle
    // picks the opposite side as target
    // start range is of given length
    // target range is of given length * given spread
    _getDirection(length, spread) {
        let side = Math.floor( Math.random() * 4 );
        let start, target, low1, high1, low2, high2;

        // get information about starting and ending range, based on the side 
        switch(side) {
            case 0: //top
                start = this._getSegment(length, this._spawnRect.x, this._spawnRect.x + this._spawnRect.width);
                target = this._getSegment(length * spread, this._spawnRect.x, this._spawnRect.x + this._spawnRect.width);
                low1 = new Vector(start.low, this._spawnRect.y);
                high1 = new Vector(start.high, this._spawnRect.y);
                low2 = new Vector(target.low, this._spawnRect.y + this._spawnRect.height);
                high2 = new Vector(target.high, this._spawnRect.y + this._spawnRect.height);
                break;
            case 1: //right
                start = this._getSegment(length, this._spawnRect.y, this._spawnRect.y + this._spawnRect.height);
                target = this._getSegment(length * spread, this._spawnRect.y, this._spawnRect.y + this._spawnRect.height);
                low1 = new Vector(this._spawnRect.x + this._spawnRect.width, start.low);
                high1 = new Vector(this._spawnRect.x + this._spawnRect.width, start.high);
                low2 = new Vector(this._spawnRect.x, target.low);
                high2 = new Vector(this._spawnRect.x, target.high);
                break;
            case 2: //bottom
                start = this._getSegment(length, this._spawnRect.x, this._spawnRect.x + this._spawnRect.width);
                target = this._getSegment(length * spread, this._spawnRect.x, this._spawnRect.x + this._spawnRect.width);
                low1 = new Vector(start.low, this._spawnRect.y + this._spawnRect.height);
                high1 = new Vector(start.high, this._spawnRect.y + this._spawnRect.height);
                low2 = new Vector(target.low, this._spawnRect.y);
                high2 = new Vector(target.high, this._spawnRect.y);
                break;
            case 3: //left
                start = this._getSegment(length, this._spawnRect.y, this._spawnRect.y + this._spawnRect.height);
                target = this._getSegment(length * spread, this._spawnRect.y, this._spawnRect.y + this._spawnRect.height);
                low1 = new Vector(this._spawnRect.x, start.low);
                high1 = new Vector(this._spawnRect.x, start.high);
                low2 = new Vector(this._spawnRect.x + this._spawnRect.width, target.low);
                high2 = new Vector(this._spawnRect.x + this._spawnRect.width, target.high);
                break;
        }

        // initialize the direction parameters
        let direction;
        if (side == 0 || side == 2) {
            direction = { low1: low1.x, high1: high1.x, low2: low2.x, high2: high2.x, oth1: low1.y, oth2: low2.y, axis: "horizontal" };
        } else {
            direction = { low1: low1.y, high1: high1.y, low2: low2.y, high2: high2.y, oth1: low1.x, oth2: low2.x, axis: "vertical" };
        }

        return direction;
    }

    // returns low and high endpoints of segment of given length between given endpoints
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