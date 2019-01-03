'use strict';

// ############################################ ENVIRONMENT ############################################ //

class Environment {
    constructor(spawnRect, renderRect) {
        this._currentObjects = [];
        this._nextObjects = [];
        this._nObjects = 0;
        this._colEngine;
        this._spawnRect = spawnRect;
        this._renderRect = renderRect;
        this._globalEffects = {
            gravity: { on: false, constant: 1000, minBuffer: 2 }
        };

        this._camera;
        this.timer = new Timer(2);
    }

    init(objects, engine, camera, gravity, pauseOn) {
        this._nextObjects = objects;
        this._colEngine = engine;
        this._camera = camera;
        this._globalEffects.gravity.on = gravity;
        this._nObjects = this._nextObjects.length;
        pause = pauseOn;
    }

    // add an array of objects
    addObject(obj) {
        this._nextObjects.push(obj);
        this._nObjects++;
    }

    // Calculates the next position of each GameObject in the environment
    update() {
        this._currentObjects = this._nextObjects;
        this._nextObjects = [];

        this._behave();
        this._collide();
        this._updateChanges();
        this._removeOutOfBounds();

        this._moveCamera();
        
        this._updateNext();
    }

    // Draws each GameObject in the environment
    render(context) {
        this._camera.bindTranslation( this._colEngine._boundingRect );

        for (let i = 0; i < this._nextObjects.length; i++) {
            let object = this._nextObjects[i];
            this._drawObj(context, object);
        }

        this._drawRect(context, this._colEngine._boundingRect);
        this._drawRect(context, this._spawnRect);

        this._camera.updatePos();
    }

    _drawObj(context, object) {
        // combine camera translation with zoom translation
        let changes = this._camera.getChanges(object.pos);

        // find final position and final radius of object
        let position = object.pos.add( changes.trans );
        let radius = object.rad * changes.scale;

        strokeCirc(context, position, radius, object.color);
    }

    _drawRect(context, rect) {
        let changes = this._camera.getChanges(rect.pos);

        let pos = new Vector(rect.pos.x + changes.trans.x, rect.pos.y + changes.trans.y);
        let width = rect.width * changes.scale;
        let height = rect.height * changes.scale;

        strokeRect(context, pos, width, height);
    }





    _updateChanges() {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._currentObjects[i];
            current.updateChanges();
        }
    }

    _moveCamera() {
        // set pivot point of camera to player position
        let object;
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._currentObjects[i];
            if (current instanceof Player) {
                object = current;
                break;
            }
        }

        // constant zoom based on event keys
        if (events.eDown) {
            this._camera.zoomIn()
        }

        if (events.qDown) {
            this._camera.zoomOut();
        }

        // get mouse position
        let mousePos = new Vector(events.mouseX, events.mouseY);

        // update camera if object is player
        if (defined(object)){
            this._camera.follow(object.pos, mousePos, object.vel, object.maxSpeed); //mousePos, 
            //this._camera.update(this._currentObjects, object.pos);
        } 
    }

    // Updates positions of all GameObjects before collision
    _behave() {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._currentObjects[i];

            if (!current.explode) {
                // global behavior
                if (this._globalEffects.gravity.on) {
                    this._updateGravity(i, current);
                }

                // DEBUGGER THAT ADDS VELOCITY TO PLAYER ------------------------------------------------------------------------------
                if (current instanceof Player) {
                    //current.changes.addVel(new Vector(50, 100));
                }
                
                // individual behavior
                current.changes.add( current.behave() );
                current.updateVelocity();
            }
        }
    }

    _collide() {
        if ( this._colEngine == null ) 
            throw Error("No narrow collision engine specified");

        // reset engine
        this._colEngine.reset();

        // check and record collisions
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._currentObjects[i];

            // if object is not exploding, check its collision with bounding rectangle and other objects
            if (!current.explode) {
                this._colEngine.checkBound(i, current);

                for (let j = i + 1; j < this._nObjects; j++) {
                    let other = this._currentObjects[j];
    
                    // if other is not exploding, check collision with current
                    if (!other.explode) {
                        this._colEngine.check(i, current, j, other);
                    }
                }
            }
        }
        
        // update collisions
        this._colEngine.updateChanges();
    }

    _updateNext() {
        let number = this._nObjects;
        for (let i = 0; i < number; i++) {
            let current = this._currentObjects[i];

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
                this._nextObjects.push(current);
            } else {
                this._nObjects--;
            }
        }
    }

    _removeOutOfBounds() {
        for (let i = 0; i < this._nObjects; i++) {
            let current = this._currentObjects[i];

            if (!objWithinRect(current, this._spawnRect)) {
                current.remove = true;
            }
        }
    }

    _updateGravity(index, current) {
        if (current.static) {
            return;
        }

        // for every object other than current
        for (let i = 0; i < this._nObjects; i++) {
            if (index != i) {
                let other = this._currentObjects[i];
                if (other.static) {
                    continue;
                }

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

















