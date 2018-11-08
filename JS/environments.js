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
        player.physics = true;

        let gam1 = new GameObject(new Circle(new Vector(600, 300), 60), 'rgb(51, 204, 51)', new Vector(0, 0), 100);
        gam1.collidable = true;
        gam1.physics = true;

        let gam2 = new GameObject(new Circle(new Vector(20, 20), 10), 'rgb(51, 204, 51)', new Vector(100, 100), 100);
        gam2.collidable = true;
        gam2.physics = true;

        this._gameObjectsNext.push(player);
        this._gameObjectsNext.push(gam1);
        // this._gameObjectsNext.push(gam2);
        this._nObjects = this._gameObjectsNext.length;

        this._narrowColEngine = new NarrowCollisionEngine();
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
        let i = 0;
        while (changesCurrent.push(new ChangesPosVel()) < this._nObjects) {
            i++;
        }
        return changesCurrent;
    }

    updateChanges(changesCurrent) {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            let change = changesCurrent[i];

            this.updateVelocity(current, change);
            this.updatePosition(current, change);

            if (current instanceof Player) {
                console.log("velocity after = " + current.vel.mag);
            }
        }
    }

    updateVelocity(gameObject, change) {
        if (change.velDel.x != 0 || change.velDel.y != 0) {
            change.velDel = multiplyVector(change.velDel, deltaT);
        }
        gameObject.addVel( change.velDel.add(change.velIns) );
        change.velDel.clear();
        change.velIns.clear();
    }

    updatePosition(gameObject, change) {
        if (gameObject.vel.x != 0 || gameObject.vel.y != 0) {
            change.posDel = multiplyVector(gameObject.vel, deltaT);
        }
        gameObject.addPos( change.posDel.add(change.posIns) );
        change.posDel.clear()
        change.posIns.clear();
    }



    // Updates positions of all GameObjects before collision
    behave(changesCurrent) {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            let change = changesCurrent[i];

            // GLOBAL BEHAVIOR

            // INDIVIDUAL BEHAVIOR
            change.add(current.behave());

            // update velocity for collision
            this.updateVelocity(current, change);
        }
    }

    collide(changesCurrent) {
        if ( this._narrowColEngine == null ) 
            throw Error("No narrow collision engine specified");

        this._narrowColEngine.reset();

        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            if (current.collidable == false) continue;

            // check for collisions
            for (let j = i + 1; j < this._nObjects; j++) {
                let other = this._gameObjectsCurrent[j]
                if (other.collidable == false) continue;

                this._narrowColEngine.check(i, current, j, other);
            }
        }

        // handle collisions
        let listChanges = this._narrowColEngine.getChanges();
        for (let k = 0; k < listChanges.length; k++) {
            let index = listChanges[k].index;
            let change = listChanges[k].change;

            changesCurrent[index].add(change);
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

















