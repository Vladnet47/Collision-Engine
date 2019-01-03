'use strict';

// controls what enters the environment
class Control {
    constructor(canvas) {
        // buffer between bounding rect and spawning rect
        this._buffer = 100;

        // all rectangles: bounding rect keeps objects inside game, spawning rect spawns and clears objects
        this._renderRect;
        this._boundingRect;
        this._spawnRect;
        this._initRectangles(canvas, 2000, 2000);
        
        // the environment for current game
        this._environment = new Environment(this._spawnRect, this._renderRect);
        this._colEngine = new NarrowCollisionEngine(this._boundingRect);
        this._camera = new Camera(this._renderRect, this._boundingRect, this._spawnRect);
        this._spawner = new Spawner(this._environment, this._spawnRect);
        
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

    spawn() {
        this._spawner.spawn();
    }

    _initRectangles(canvas, width, height) {
        this._renderRect = new Rectangle( new Vector(0, 0), canvas.width, canvas.height );
        this._boundingRect = new Rectangle( new Vector(0, 0), width, height );
        this._spawnRect = new Rectangle( new Vector(-this._buffer, -this._buffer), width + this._buffer*2, height + this._buffer*2 );
    }

    _initTest(name) {
        // set properties
        let gravity = true;
        let pauseOn = true;

        // initialize game objects
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

        let background = this._initBackground();
        for (let i = 0; i < background.length; i++) {
            objects.push(background[i]);
        }

        // center the camera position on player
        for (let i = 0; i < objects.length; i++) {
            let object = objects[i];
            if (object instanceof Player) {
                this._camera.follow(object.pos);
                break;
            }
        }
        
        // initialize environment
        this._environment.init(objects, this._colEngine, this._camera, gravity, pauseOn);

        // toggle spawning
        this._spawner.toggleAsteroid(false);
    }

    _initBackground() {
        let dots = [];
        for (let i = 200; i < this._boundingRect.width; i+=200) {
            for (let j = 200; j < this._boundingRect.height; j+=200) {
                let dot = new GameObject(new Circle(new Vector(i, j), 1), 'rgb(51, 204, 51)', new Vector(0, 0), 1);
                dot.collidable = false;
                dot.static = true;
                dots.push(dot);
            }
        }
        return dots;
    }

    _test0() {
        let objects = [];
        let gam1 = this._initTestObj(new Vector(100, 100), new Vector(0, -25), 50, 1);
        let gam2 = this._initTestObj(new Vector(100, 300), new Vector(0, -75), 50, 1);

        objects.push(gam1);
        objects.push(gam2);

        return objects;
    }

    _test1() {
        let objects = [];

        let player = this._initPlayer(new Vector(1000, 1000), new Vector(0, 0), 30, 100);

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

        let gam1 = this._initTestObj(new Vector(100, 400), new Vector(50, 0), 50, 1);
        let gam2 = this._initTestObj(new Vector(500, 400), new Vector(-50, 0), 50, 1);
        let gam3 = this._initTestObj(new Vector(300, 400), new Vector(0, 0), 50, 1);
        let gam4 = this._initTestObj(new Vector(300, 200), new Vector(0, 50), 50, 1);
        let gam5 = this._initTestObj(new Vector(700, 250), new Vector(-100, 0), 50, 1);
        let gam6 = this._initTestObj(new Vector(100, 100), new Vector(30, 100), 50, 1);
        let gam7 = this._initTestObj(new Vector(800, 150), new Vector(0, 50), 50, 1);
        let gam8 = this._initTestObj(new Vector(800, 450), new Vector(0, -50), 50, 1);

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

        let player = this._initPlayer(new Vector(430, 100), new Vector(0, 0), 30, 20);
        let gam1 = this._initTestObj(new Vector(100, 400), new Vector(50, 0), 30, 10);
        let gam2 = this._initTestObj(new Vector(500, 400), new Vector(-50, 0), 30, 10);
        let gam3 = this._initTestObj(new Vector(300, 400), new Vector(0, 0), 60, 100);
        let gam4 = this._initTestObj(new Vector(300, 200), new Vector(0, 50), 10, 5);
        let gam5 = this._initTestObj(new Vector(700, 250), new Vector(-200, 0), 40, 80);
        let gam6 = this._initTestObj(new Vector(100, 100), new Vector(30, 100), 40, 80);
        let gam7 = this._initTestObj(new Vector(800, 150), new Vector(0, 50), 100, 300);
        let gam8 = this._initTestObj(new Vector(800, 450), new Vector(0, -50), 60, 100);

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
        
        let gam1 = this._initTestObj(new Vector(100, 100), new Vector(50, 50), 30, 10);
        let gam2 = this._initTestObj(new Vector(500, 100), new Vector(-50, 50), 30, 10);
        let gam3 = this._initTestObj(new Vector(100, 500), new Vector(50, -50), 30, 10);
        let gam4 = this._initTestObj(new Vector(500, 500), new Vector(-50, -50), 30, 10);

        objects.push(gam1);
        objects.push(gam2);
        objects.push(gam3);
        objects.push(gam4);

        return objects;
    }

    _test5() {
        let objects = [];

        let gam1 = this._initTestObj(new Vector(500, 300), new Vector(0, 1), 10, 400);
        let gam2 = this._initTestObj(new Vector(525, 300), new Vector(0, 1), 10, 400);
        let gam3 = this._initTestObj(new Vector(100, 300), new Vector(5000, 0), 10, 5);

        objects.push(gam1);
        objects.push(gam2);
        objects.push(gam3);

        return objects;
    }

    _test6() {
        let objects = [];

        let objects = [];

        let gam1 = this._initTestObj(new Vector(500, 300), new Vector(0, 1), 10, 400);
        let gam2 = this._initTestObj(new Vector(525, 300), new Vector(0, 1), 10, 400);
        let gam3 = this._initTestObj(new Vector(100, 300), new Vector(5000, 0), 10, 5);

        objects.push(gam1);
        objects.push(gam2);
        objects.push(gam3);

        return objects;
    }

    _initTestObj(position, velocity, size, mass, color) {
        let obj = new GameObject(new Circle(position, size), 'rgb(51, 204, 51)', velocity, mass);
        obj.collidable = true;
        obj.bound = true;

        return obj;
    }

    _initPlayer(position, velocity, size, mass, color) {
        let obj = new Player(new Circle(position, size), '#CC1201', velocity, mass);
        obj.collidable = true;
        obj.bound = true;

        return obj;
    }
}





























class Spawner {
    constructor(environment, spawnRect) {
        this._environment = environment;
        this._spawnRect = spawnRect;
        this._spawnArr = [];
        this._toggleSpawn = { asteroids: false }

        this._asteroids = { groupFreq: new Timer(5), 
                            min: { range: 200, mult: 0.5, count: 10, life: 6, gfreq: 8, ifreq: 0.4, speed: 200, mass: 80, size: 20 }, 
                            max: { range: 800, mult: 3, count: 20, life: 10, gfreq: 12, ifreq: 1.2, speed: 500, mass: 200, size: 40 } };
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

    _translate(initialPos, point) {
        let translation = new Vector(this._spawnRect.x - initialPos.x, this._spawnRect.y - initialPos.y);
        point.addTo(translation);
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

        return { initialPos: new Vector(this._spawnRect.x, this._spawnRect.y), type: type, count: count, direc: direc, indivFreq: indivFreq };
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

                // update start and target based on current location of spawn rectangle,
                // since it moves due to the camera
                let initialPos = group.initialPos;
                this._translate(initialPos, start);
                this._translate(initialPos, target);

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

























// controls the movement of the screen
// actions that involve objects are called from Environment
class Camera {
    constructor(renderRect, boundingRect, spawnRect) {
        // information about camera
        // center represents the center of the screen
        // ingamePos represents the ingame position of the camera (the center position does not translate because camera moves the background)
        this._ingamePos = new Vector(0, 0);
        this._center = renderRect.center;


        // information about rectangles 
        this._renderRect = renderRect;
        this._boundingRect = boundingRect;
        this._spawnRect = spawnRect; 

        // information that various camera types require
        this._info = { 
            pivot: { prop: 0.2, maxDist: 100, curTime: 0, time: 2, focus: 3 },
            lead: { velDist: 100, curTime: 0, time: 1, zoom: 2 },
            grav: { 
                const: 200, // gravity constants
                velDist: 400, // shift due to velocity and deadzone radius
                targetPriority: 0.6, // when calculating average point, how much to prioritize target position
                prop: 0.2, zoom: 4, curTime: 0, time: 1, maxDist: 100 // zoom information
            },
        };

        // equations that define camera's motion over time
        this._eq = { cos: { amp: 0, per: 0 } };
        
        this._properties = {
            translation: new Vector(0,0),
            rotation: 0,
            zoom: { factor: 1, max: 2, min: 0.5, rate: 0.01 },
        }
    }

    get ingamePos() {
        return this._ingamePos;
    }

    get center() {
        return multiplyVector(this._center, 1 / this._properties.zoom.factor);
    }

    updatePos() {
        this._ingamePos = new Vector(this._properties.translation.x, this._properties.translation.y);
    }


    getChanges(pos) {
        let middle = this._ingamePos.add(this._center);
        let dist = distance(middle, pos);
        let angle = angleDxDy(pos.x - middle.x, pos.y - middle.y);
        let zoomTrans = vectorToXY(dist * (this._properties.zoom.factor - 1), angle);

        let totalTrans = new Vector(-this._properties.translation.x + zoomTrans.x, -this._properties.translation.y + zoomTrans.y);

        return { trans: totalTrans, scale: this._properties.zoom.factor };
    }

    zoomIn() {
        this._properties.zoom.factor += Math.min(this._properties.zoom.rate, this._properties.zoom.max - this._properties.zoom.factor);
    }

    zoomOut() {
        this._properties.zoom.factor -= Math.min(this._properties.zoom.rate, this._properties.zoom.factor - this._properties.zoom.min);
    }

    // binds the translation to the given rectangle
    bindTranslation(rect) {
        let correction = new Vector(0, 0);

        // get the update to this._center based on zoom
        // when zoom > 1, the viewing rectangle decreases
        // when zoom < 1, the viewing rectangle increases
        let zoomCenterDiff = this.center.add( multiplyVector(this._center, -1) );

        // get the coordinates of the top, right, bottom, and left of the camera view
        let renderLeft = this._properties.translation.x - zoomCenterDiff.x;
        let renderRight = this._properties.translation.x + this._center.x * 2 + zoomCenterDiff.x;
        let renderTop = this._properties.translation.y - zoomCenterDiff.y;
        let renderBottom = this._properties.translation.y + this._center.y * 2 + zoomCenterDiff.y;

        // update right and left
        if (renderLeft < rect.x) {
            correction.addTo( new Vector(rect.x - renderLeft, 0) );
        } else if (renderRight > rect.x + rect.width) {
            correction.addTo( new Vector((rect.x + rect.width) - renderRight, 0));
        }

        // update top and bottom
        if (renderTop < rect.y) {
            correction.addTo( new Vector(0, rect.y - renderTop) );
        } else if (renderBottom > rect.y + rect.height) {
            correction.addTo( new Vector(0, (rect.y + rect.height) - renderBottom));
        }

        this._properties.translation.addTo( correction );
    }







    // CAMERA OPERATIONS -----------------------------------------------------------------------------------------
    // shift: translates camera by translation
    // follow: translates camera to point
    // pivot: translates camera to point between start and target (at proportion of distance)
    // lead: translates camera to point ahead of start (point based on velocity)
    // responsive: follows player around smoothly, leading based on average of target and point based on velocity

    // shifts the camera position by given translation
    shift(trans) {
        if (!defined(trans)) {
            console.log("Camera shift: translation not defined!");
            return;
        } 

        this._properties.translation.addTo( trans );
    }

    // follows the point
    follow(point) {
        if (!defined(point)) {
            console.log("Camera follow: point not defined!");
            return;
        }

        this.shift( new Vector(point.x - (this._ingamePos.x + this._center.x), point.y - (this._ingamePos.y + this._center.y)) );
    }

    // follows a point between start and target based on pivot focus proportion
    pivot(start, target) {
        if (!defined(start) || !defined(target)) {
            console.log("Camera pivot: start or target not defined!");
            return;
        }

        // get and update focus based on whether or not event key is held down
        let focusInfo = this._focus(this._info.pivot.curTime, this._info.pivot.time, this._info.pivot.focus, events.spaceDown)
        let focus = focusInfo.focus;
        this._info.pivot.curTime = focusInfo.time;

        // get pivot point between start and target that is based on focus
        let targetProp = this._bindPropToDist(this._info.pivot.prop, distance(start, target), this._info.pivot.maxDist, focus);
        let targetPoint = this._pivot(start, target, targetProp);

        this.follow( targetPoint );
    }

    // get point in front of start that is based on velocity
    lead(start, vel, maxVel) {
        if (!defined(start) || !defined(vel)) {
            console.log("Camera border: point or velocity not defined!");
            return;
        }

        // get and update zoom based on whether or not event key is held down
        let focusInfo = this._focus(this._info.lead.curTime, this._info.lead.time, this._info.lead.zoom, events.spaceDown)
        let focus = focusInfo.zoom;
        this._info.lead.curTime = focusInfo.time;

        // find the point ahead of start in direction of velocity
        let velPoint = this._velPivot(start, this._info.lead.velDist * focus, vel.angle, vel.mag / maxVel);

        this.follow( velPoint );
    }

    // 
    responsive(start, target, vel, maxVel) {
        let mag = vel.mag;

        // get and update zoom based on whether or not event key is held down
        let zoomInfo = this._focus(this._info.grav.curTime, this._info.grav.time, this._info.grav.zoom, events.spaceDown)
        let zoom = zoomInfo.zoom;
        this._info.grav.curTime = zoomInfo.time;

        // get pivot point between start and target that is based on zoom
        let targetProp = this._bindPropToDist(this._info.grav.prop, distance(start, target), this._info.grav.maxDist, zoom);
        let targetPoint = this._pivot(start, target, targetProp);

        // make camera zoom out proportionally to velocity (the faster, the more zoomed out)
        this._properties.zoom.value = (mag / maxVel) * (this._properties.zoom.min - 1) + 1;

        // get point in front of start that is based on velocity
        let velPoint = this._velPivot(start, this._info.grav.velDist, vel.angle, mag / maxVel);  ///// MAKE DEPENDENT ON ZOOM AS WELL?

        // get point in the middle of velPoint and targetPoint
        let avgPoint = this._pivot(velPoint, targetPoint, this._info.grav.targetPriority);

        // gravitate from center to the middle point
        let finalPoint = this._gravitate( this._center, avgPoint, this._info.grav.const );

        // update this translation
        this.follow( finalPoint );
    }

    





    // returns a point between start and target at a proportion of the distance from start
    _pivot(start, target, proportion) {
        return new Vector( start.x + (target.x - start.x) * proportion, start.y + (target.y - start.y) * proportion );
    }

    // returns translation due to gravitational attraction (start -> target)
    _gravitate(start, target, constant) {
        let dist = new Vector(target.x - start.x, target.y - start.y);
        let mag = constant * Math.pow(deltaT, 2) * dist.mag;
        return start.add( vectorToXY(mag, dist.angle) );
    }

    // returns a focus between 1 and focusConst
    // curTime and maxTime determine the proportion of focus between 1 and focusConst
    // if increase is true, focus will increase
    // if increase if false, focus will decrease
    _focus(curTime, maxTime, focusConst, increasing) {
        let focus = 1 + ((focusConst < 1) ? 0 : this._equationDecay(curTime, maxTime, focusConst - 1));
        let time = (increasing) ? ((curTime + deltaT > maxTime) ? maxTime : curTime + deltaT) : ((curTime - deltaT < 0) ? 0 : curTime - deltaT);

        return { time: time, focus: focus };
    }

    // pivots the camera around the start at a distance that is proportional to velocity / maxVelocity
    _velPivot(start, distance, angle, proportion) {
        let velDirec = vectorToXY(distance * proportion, angle);
        return start.add(velDirec) ;
    }

    

    // binds the given proportion to maxDist
    // if proportion * distance is greater than max distance, returns proportion that makes it equal to max distance
    _bindPropToDist(prop, dist, maxDist, zoom) {
        return (dist == 0) ? 0 : Math.min(maxDist / dist * zoom, prop * zoom);
    }

    

    



    // initialize the amplitude, period, and integral at 0 for the 
    _initEquationCos() {
        this._eq.cos.amp = 1 / this._info.grav.time;
        this._eq.cos.per = 2 * Math.PI / this._info.grav.time;
    }

    // returns the integral from 0 -> time of the cosine curve given by: 
    //
    // f(t) = amp * cos(period * time) + amp
    //
    // where amp and period are set such that total area under curve is equal to distance
    _equationCos(time, range) {
        let equation = this._eq.cos.amp * (time - Math.cos(this._eq.cos.per * time) / this._eq.cos.per + Math.pow(this._eq.cos.per, -1));
        //console.log("time = " + round(time, 2) + " and integral = " + round(equation, 2));
        return range * equation;
    }

    _equationSin(time, range) {
        let equation = sin(2 * Math.PI * time) * range;
        return equation;
    }

    _equationConst(time, maxTime, range) {
        return range * time / maxTime;
    }

    _equationDecay(time, maxTime, range) {
        return range * (2 -  Math.pow(2, (1 - time / maxTime)));
    }
}