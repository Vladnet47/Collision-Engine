// ############################################ ENVIRONMENT ############################################ //

class Environment {
    constructor(canvas) {
        this._gameObjectsCurrent = [];
        this._gameObjectsNext = [];
        this._nObjects = 0;
        this._narrowColEngine;
        this._broadColEngine;
        this._globalEffects = {
            gravity: { on: false, strength: 1.0 }
        };

        this._collisionProps = {
            width: canvas.width,
            height: canvas.height,
        };
    }

    init() {
        this._globalEffects.gravity.on = false;
        this._collisionProps.onUniformGrid = false;

        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        player.collidable = true;

        let gam1 = new GameObject(new Circle(new Vector(600, 300), 60), 'rgb(51, 204, 51)', new Vector(0, 0), 1000);
        gam1.collidable = true;

        let gam2 = new GameObject(new Circle(new Vector(500, 500), 10), 'rgb(51, 204, 51)', new Vector(0, 0), 100);
        gam2.collidable = true;

        let gam3 = new GameObject(new Circle(new Vector(400, 300, 20), 20), 'rgb(51, 204, 51)', new Vector(0, 0), 80);
        gam3.collidable = true;

        let gam4 = new GameObject(new Circle(new Vector(200, 200), 40), 'rgb(51, 204, 51)', new Vector(0, 0), 60);
        gam4.collidable = true;

        this._gameObjectsNext.push(player);
        this._gameObjectsNext.push(gam1);
        //this._gameObjectsNext.push(gam2);
        //this._gameObjectsNext.push(gam3);
        //this._gameObjectsNext.push(gam4);
        this._nObjects = this._gameObjectsNext.length;

        this._narrowColEngine = new NarrowCollisionEngine();
        this._narrowColEngine.toggleBound(new Vector(0,0), this._collisionProps.width, this._collisionProps.height);
    }

    initTest1() {
        let gam1 = this._createTestObject2(new Vector(100, 400), new Vector(50, 0), 50, 1);
        let gam2 = this._createTestObject2(new Vector(500, 400), new Vector(-50, 0), 50, 1);
        let gam3 = this._createTestObject2(new Vector(300, 400), new Vector(0, 0), 50, 1);
        let gam4 = this._createTestObject2(new Vector(300, 200), new Vector(0, 50), 50, 1);
        let gam5 = this._createTestObject2(new Vector(700, 250), new Vector(-100, 0), 50, 1);
        let gam6 = this._createTestObject2(new Vector(100, 100), new Vector(30, 100), 50, 1);
        let gam7 = this._createTestObject2(new Vector(800, 150), new Vector(0, 50), 50, 1);
        let gam8 = this._createTestObject2(new Vector(800, 450), new Vector(0, -50), 50, 1);

        this._gameObjectsNext.push(gam1);
        this._gameObjectsNext.push(gam2);
        this._gameObjectsNext.push(gam3);
        this._gameObjectsNext.push(gam4);
        this._gameObjectsNext.push(gam5);
        this._gameObjectsNext.push(gam6);
        this._gameObjectsNext.push(gam7);
        this._gameObjectsNext.push(gam8);

        this._nObjects = this._gameObjectsNext.length;

        this._narrowColEngine = new NarrowCollisionEngine();
        this._narrowColEngine.toggleBound(new Vector(0,0), this._collisionProps.width, this._collisionProps.height);


        pause = true;
    }

    initTest2() {
        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 20);
        player.collidable = true;

        let gam1 = this._createTestObject2(new Vector(100, 400), new Vector(50, 0), 30, 10);
        let gam2 = this._createTestObject2(new Vector(500, 400), new Vector(-50, 0), 30, 10);
        let gam3 = this._createTestObject2(new Vector(300, 400), new Vector(0, 0), 60, 100);
        let gam4 = this._createTestObject2(new Vector(300, 200), new Vector(0, 50), 10, 5);
        let gam5 = this._createTestObject2(new Vector(700, 250), new Vector(-200, 0), 40, 80);
        let gam6 = this._createTestObject2(new Vector(100, 100), new Vector(30, 100), 40, 80);
        let gam7 = this._createTestObject2(new Vector(800, 150), new Vector(0, 50), 100, 300);
        let gam8 = this._createTestObject2(new Vector(800, 450), new Vector(0, -50), 60, 100);

        this._gameObjectsNext.push(player);
        this._gameObjectsNext.push(gam1);
        this._gameObjectsNext.push(gam2);
        this._gameObjectsNext.push(gam3);
        this._gameObjectsNext.push(gam4);
        this._gameObjectsNext.push(gam5);
        this._gameObjectsNext.push(gam6);
        this._gameObjectsNext.push(gam7);
        this._gameObjectsNext.push(gam8);

        this._nObjects = this._gameObjectsNext.length;

        this._narrowColEngine = new NarrowCollisionEngine();
        this._narrowColEngine.toggleBound(new Vector(0,0), this._collisionProps.width, this._collisionProps.height);

        pause = true;
    }

    initTest3() {
        let gam1 = this._createTestObject2(new Vector(100, 100), new Vector(50, 50), 30, 10);
        let gam2 = this._createTestObject2(new Vector(500, 100), new Vector(-50, 50), 30, 10);
        let gam3 = this._createTestObject2(new Vector(100, 500), new Vector(50, -50), 30, 10);
        let gam4 = this._createTestObject2(new Vector(500, 500), new Vector(-50, -50), 30, 10);

        this._gameObjectsNext.push(gam1);
        this._gameObjectsNext.push(gam2);
        this._gameObjectsNext.push(gam3);
        this._gameObjectsNext.push(gam4);

        this._nObjects = this._gameObjectsNext.length;

        this._narrowColEngine = new NarrowCollisionEngine();
        this._narrowColEngine.toggleBound(new Vector(0,0), this._collisionProps.width, this._collisionProps.height);

        pause = true;
    }

    initTest4() {
        let gam1 = this._createTestObject2(new Vector(500, 300), new Vector(0, 1), 10, 400);
        let gam2 = this._createTestObject2(new Vector(525, 300), new Vector(0, 1), 10, 400);
        let gam3 = this._createTestObject2(new Vector(100, 300), new Vector(5000, 0), 10, 5);

        this._gameObjectsNext.push(gam1);
        this._gameObjectsNext.push(gam2);
        this._gameObjectsNext.push(gam3);

        this._nObjects = this._gameObjectsNext.length;

        this._narrowColEngine = new NarrowCollisionEngine();
        this._narrowColEngine.toggleBound(new Vector(0,0), this._collisionProps.width, this._collisionProps.height);

        pause = true;
    }

    initTest5() {
        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 20);
        player.collidable = true;

        let gam = new GameObject(new Circle(new Vector(400, 400), 120), 'rgb(51, 204, 51)', new Vector(0, 0), 1000000);
        gam.collidable = true;

        this._gameObjectsNext.push(player);
        this._gameObjectsNext.push(gam);

        this._nObjects = this._gameObjectsNext.length;

        this._narrowColEngine = new NarrowCollisionEngine();
        this._narrowColEngine.toggleBound(new Vector(0,0), this._collisionProps.width, this._collisionProps.height);

        pause = true;
    }

    _createTestObject2(position, velocity, size, mass) {
        let obj = new GameObject(new Circle(position, size), 'rgb(51, 204, 51)', velocity, mass);
        obj.collidable = true;

        return obj;
    }

    // Calculates the next position of each GameObject in the environment
    update() {
        this._gameObjectsCurrent = this._gameObjectsNext;
        this._gameObjectsNext = [];

        let changesCurrent = this.initChanges();
        this.behave(changesCurrent);
        this.collide(changesCurrent);
        this.updateChanges(changesCurrent);

        this._gameObjectsNext = this._gameObjectsCurrent;
    }

    initChanges() {
        let changesCurrent = [];
        while (changesCurrent.push(new ChangesPosVel()) < this._nObjects) {}
        return changesCurrent;
    }

    updateChanges(changesCurrent) {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            let change = changesCurrent[i];

            this.updateVelocity(current, change);
            this.updatePosition(current, change);
        }
    }

    updateVelocity(current, change) {
        let accel;

        // convert acceleration to velocity
        if (defined(change.acc)) {
            accel = multiplyVector(change.acc, deltaT);
        } 

        // update current and clear change
        if (defined(change.vel)) {
            change.vel.add( accel );
            current.addVel( change.vel );
        } else {
            current.addVel( accel );
        }

        change.clearAcc();
    }

    updatePosition(current, change) {
        let vel = multiplyVector(current.vel, deltaT);

        // add current change in velocity to current velocity
        if (defined(change.vel)) {
            vel.add( multiplyVector(change.vel, deltaT) );
        } 

        // update current and clear change
        if (defined(change.pos)) {
            change.pos.add(vel);
            current.addPos( change.pos );
        } else {
            current.addPos( vel );     
        }

        change.clear();
    }



    // Updates positions of all GameObjects before collision
    behave(changesCurrent) {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            let change = changesCurrent[i];

            // GLOBAL BEHAVIOR

            // INDIVIDUAL BEHAVIOR
            change.add(current.behave());

            if (current instanceof Player) {
                console.log(current.vel.mag);
            }

            // update velocity for collision
            this.updateVelocity(current, change);
        }
    }

    collide(changesCurrent) {
        if ( this._narrowColEngine == null ) 
            throw Error("No narrow collision engine specified");

        this._narrowColEngine.reset();

        for (let i = 0; i < this._nObjects; i++) {
            for (let j = i + 1; j < this._nObjects; j++) {
                this._narrowColEngine.check(i, this._gameObjectsCurrent[i], j, this._gameObjectsCurrent[j]);
            }
        }

        // handle collisions
        let result = this._narrowColEngine.getChanges();

        for (let i = 0; i < result.length; i++) {
            changesCurrent[ result[i].index ].add( result[i].change );
        }
    }

    // Draws each GameObject in the environment
    render(context) {
        this._gameObjectsNext.forEach( function (gameObject) { drawCirc(context, gameObject); } );
    }

    // DEBUG ---------------------------------------------------------------------------------------------------------
    printYStats(gameObject) {
        return ("[" + round(this.elapsedTime, 1) +
            "] Y: position is [" + round(gameObject.y, 2) +
            "] and velocity is [" + round(gameObject.vel.y, 2) + "]");
    }
    printXStats(gameObject) {
        return ("[" + round(this.elapsedTime, 1) +
            "] X: position is [" + round(gameObject.x, 2) +
            "] and velocity is [" + round(gameObject.vel.x, 2) + "]");
    }
}

















