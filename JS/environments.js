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
            gravity: { on: false, constant: 1000, minBuffer: 2 }
        };

        this._camera;
    }

    set clearRect(rect) {
        this._clearRect = rect;
    }

    init(objects, engine, camera, gravity, pauseOn) {
        this._gameObjectsNext = objects;
        this._narrowColEngine = engine;
        this._camera = camera;
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

        this._behave();
        this._collide();
        this._updateChanges();
        this._camera.update(this._gameObjectsCurrent);
        this._removeOutOfBounds();
        
        this._updateNext();
    }

    // Draws each GameObject in the environment
    render(context) {
        this._gameObjectsNext.forEach( function (gameObject) { strokeCirc(context, gameObject); } );
    }

    _updateChanges() {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            current.updateVelocity();
            current.updatePosition();
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
    _behave() {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];

            if (!current.explode) {
                // global behavior
                if (this._globalEffects.gravity.on) {
                    this._updateGravity(i, current);
                }

                // DEBUGGER THAT ADDS VELOCITY TO PLAYER ------------------------------------------------------------------------------
                if (current instanceof Player) {
                    //current.changes.addVel(new Vector(0, 20));
                }
                
                // individual behavior
                current.changes.add( current.behave() );
                current.updateVelocity();
            }
        }
    }

    _collide() {
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
        
        // update collisions
        this._narrowColEngine.updateChanges();
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

    _updateGravity(index, current) {
        // for every object other than current
        for (let i = 0; i < this._nObjects; i++) {
            if (index != i) {
                let other = this._gameObjectsCurrent[i];

                // get distance between object centers
                let dist = other.pos.add( multiplyVector(current.pos, -1) );
                let mag = dist.mag;

                // if distance greater than sum of radii + minBuffer, calculate current's acceleration due to gravity of other
                if (mag > (current.rad + other.rad + this._globalEffects.gravity.minBuffer)) {
                    let accel = this._globalEffects.gravity.constant * (current.mass + other.mass) / (current.mass * Math.pow(mag, 2));
                    current.changes.addAcc( vectorToXY(accel, angleDxDy(dist.x, dist.y)) );
                }
            }
        }
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

















