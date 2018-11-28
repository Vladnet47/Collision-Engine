// ############################################ ENVIRONMENT ############################################ //

class Environment {
    constructor() {
        this._gameObjectsCurrent = [];
        this._gameObjectsNext = [];
        this._nObjects = 0;
        this._narrowColEngine;
        this._globalEffects = {
            gravity: { on: false, constant: 500 }
        };
    }

    init(objects, engine, gravity, pauseOn) {
        this._gameObjectsNext = objects;
        this._narrowColEngine = engine;
        this._globalEffects.gravity.on = gravity;
        this._nObjects = this._gameObjectsNext.length;
        pause = pauseOn;
    }

    // Calculates the next position of each GameObject in the environment
    update() {
        this._gameObjectsCurrent = this._gameObjectsNext;
        this._gameObjectsNext = [];

        let changesCurrent = this.initChanges();
        this.behave(changesCurrent);
        this.collide(changesCurrent);
        this.updateChanges(changesCurrent);

        this.updateNext();
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

    updateNext() {
        let number = this._nObjects;
        for (let i = 0; i < number; i++) {
            let current = this._gameObjectsCurrent[i];

            // if lifespan has exceeded, mark as dead
            if (!current.lifespan.increment(deltaT)) {
                current.dead = true;
            }

            // if current is dead, create an explosion in its place, then remove it from the gameObjects list
            if (current.dead) {
                let exp = current.explosion;
                if (!exp.exploding) {
                    current.explode();
                } else if (!exp.timer.increment(deltaT)) {
                    this._nObjects--;
                    continue;
                }
            } 
            
            this._gameObjectsNext.push(current);
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

            // if current is dead (just an explosion), do not update anything
            if (current.dead) { continue; }

            let change = changesCurrent[i];

            // GLOBAL BEHAVIOR
            if (this._globalEffects.gravity.on) {
                change.add(this._updateGravity(i, current));
            }

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
            for (let j = i + 1; j < this._nObjects; j++) {
                let current = this._gameObjectsCurrent[i];
                let other = this._gameObjectsCurrent[j];

                if (!current.dead && !other.dead) {
                    this._narrowColEngine.check(i, current, j, other);
                }
            }
        }
        
        // handle collisions
        let result = this._narrowColEngine.getChanges();

        for (let i = 0; i < result.length; i++) {
            changesCurrent[ result[i].index ].add( result[i].change );
        }
    }

    _updateGravity(i, current) {
        let change = new ChangesPosVel();
        for (let j = 0; j < this._nObjects; j++) {
            if (i != j) {
                let other = this._gameObjectsCurrent[j];
                let dist = other.pos.add( multiplyVector(current.pos, -1) );
                let mag = dist.mag;

                if (mag > (current.rad + other.rad + 0.01)) {
                    let massSum = current.mass + other.mass;
                    let accel = this._globalEffects.gravity.constant * massSum / (current.mass * Math.pow(mag, 2));
                    let vectorResult = vectorToXY(accel, dist.angle)
                    change.addAcc(vectorResult);
                }
            }
        }
        return change;
    }

    _explode(i, explosionType, duration) {

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

















