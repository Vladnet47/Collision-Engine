'use strict';

// ############################################ ENVIRONMENT ############################################ //

class Environment {
    constructor() {
        this._gameObjectsCurrent = [];
        this._gameObjectsNext = [];
        this._nObjects = 0;
        this._narrowColEngine;
        this._clearRect;
        this._globalEffects = {
            gravity: { on: false, constant: 500 }
        };

        this.debugTimer = new Timer(100);
    }

    set clearRect(rect) {
        this._clearRect = rect;
    }

    init(objects, engine, gravity, pauseOn) {
        this._gameObjectsNext = objects;
        this._narrowColEngine = engine;
        this._globalEffects.gravity.on = gravity;
        this._nObjects = this._gameObjectsNext.length;
        pause = pauseOn;
    }

    // add an array of objects
    addObject(obj) {
        this._gameObjectsNext.push(obj);
        this._nObjects++;
    }

    // Calculates the next position of each GameObject in the environment
    update() {
        this._gameObjectsCurrent = this._gameObjectsNext;
        this._gameObjectsNext = [];

        let changesCurrent = this._initChanges();
        this._behave(changesCurrent);
        this._collide(changesCurrent);
        this._updateChanges(changesCurrent);
        this._removeOutOfBounds();

        this._updateNext();
    }

    // Draws each GameObject in the environment
    render(context) {
        this._gameObjectsNext.forEach( function (gameObject) { drawCirc(context, gameObject); } );
    }

    _initChanges() {
        let changesCurrent = [];
        while (changesCurrent.push(new ChangesPosVel()) < this._nObjects) {}
        return changesCurrent;
    }

    _updateChanges(changesCurrent) {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            let change = changesCurrent[i];

            this._updateVelocity(current, change);
            this._updatePosition(current, change);
        }
    }

    _updateNext() {
        let number = this._nObjects;
        for (let i = 0; i < number; i++) {
            let current = this._gameObjectsCurrent[i];

            // if life ends, cause explosion
            if (current.lifespan.stop()) {
                current.explode = true;
            }

            // if current is supposed to explode, create explosion
            if (current.explode) {
                let exp = current.explosion;
                if (!exp.exploding) {
                    current.causeExplosion();
                }
                if (exp.timer.stop()) {
                    current.remove = true;
                }
            }

            // only keep current if it is not being removed
            if (!current.remove) {
                this._gameObjectsNext.push(current);
            } else {
                this._nObjects--;
            }
        }
    }

    // Updates positions of all GameObjects before collision
    _behave(changesCurrent) {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];

            if (!current.explode) {
                let change = changesCurrent[i];

                // global behavior
                if (this._globalEffects.gravity.on) {
                    change.add(this._updateGravity(i, current));
                }

                // individual behavior
                change.add(current.behave());

                // update velocity for collision
                this._updateVelocity(current, change);
            }
        }
    }

    _collide(changesCurrent) {
        if ( this._narrowColEngine == null ) 
            throw Error("No narrow collision engine specified");

        // reset engine
        this._narrowColEngine.reset();

        // check and record collisions
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            for (let j = i + 1; j < this._nObjects; j++) {
                let other = this._gameObjectsCurrent[j];

                // if objects are not exploding
                if (!current.explode && !other.explode) {
                    this._narrowColEngine.check(i, current, j, other);
                }
            }
        }
        
        // handle collisions
        let result = this._narrowColEngine.getChanges();

        // update collisions for all gameObjects
        for (let i = 0; i < result.length; i++) {
            changesCurrent[ result[i].index ].add( result[i].change );
        }
    }

    _removeOutOfBounds() {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];

            if (current.x - current.rad > this._clearRect.x + this._clearRect.width || current.x + current.rad < this._clearRect.x ||
                current.y - current.rad > this._clearRect.y + this._clearRect.height || current.y + current.rad < this._clearRect.x) {
                    current.remove = true;
            }
        }
    }

    _updateGravity(i, current) {
        let change = new ChangesPosVel();
        for (let j = 0; j < this._nObjects; j++) {
            if (i != j) {
                let other = this._gameObjectsCurrent[j];
                let dist = other.pos.add( multiplyVector(current.pos, -1) );
                let mag = dist.mag;

                if (mag > (current.rad + other.rad + 2)) {
                    let massSum = current.mass + other.mass;
                    let accel = this._globalEffects.gravity.constant * massSum / (current.mass * Math.pow(mag, 2));
                    let vectorResult = vectorToXY(accel, angleDxDy(dist.x, dist.y));
                    change.addAcc(vectorResult);
                }
            }
        }
        return change;
    }

    _updateVelocity(current, change) {
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

    _updatePosition(current, change) {
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

















