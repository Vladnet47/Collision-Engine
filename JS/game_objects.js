'use strict';

// SETUP ---------------------------------------------------------------------------------------------
class Player extends GameObject {
    constructor(circle, color, velocity, mass) {
        super(circle, color, velocity, mass);
        this._traits = {
            move: { maxSpeed: 400, accel: 400 },
            boost: { speed: 500, delay: 3, letGo: false }
        };
        this.lifespan.set("inf");
    }

    get maxSpeed() {
        return this._traits.move.maxSpeed;
    }

    // BEHAVIOR ---------------------------------------------------------------------------------------------
    behave() {
        let changes = new ChangesToMotion();
        changes.add(this.move());
        changes.add(this.boost());
        return changes;
    }
    move() {
        let changes = new ChangesToMotion();
        let angle = -1;

        // if velocity is already greater than the max, return changes
        // if (this.vel.mag >= this._traits.move.accel) {
        //     return changes;
        // }
        
        // find direction from buttom presses
        if (events.rightArrowDown || events.dDown) {
            if (events.upArrowDown || events.wDown) {
                angle = 45;
            } else {
                (events.botArrowDown || events.sDown) ? angle = 315 : angle = 0;
            }
        } else if (events.upArrowDown || events.wDown) {
            (events.leftArrowDown || events.aDown) ? angle = 135 : angle = 90;
        } else if (events.leftArrowDown || events.aDown) {
            (events.botArrowDown || events.sDown) ? angle = 225 : angle = 180;
        } else if (events.botArrowDown || events.sDown) {
            angle = 270;
        }

        // add delta velocity in direction
        if (angle > -1) {
            changes.addAcc( vectorToXY(this._traits.move.accel, angle) );
        }

        changes = this.reduce(changes);

        return changes;
    }
    boost() {
        let changes = new ChangesToMotion();
        return changes;
    }

    // locks speed at maximum
    reduce(changes) {
        if (this.vel.mag > this._traits.move.maxSpeed) {
            changes.addVel( vectorToXY(this.vel.mag - this._traits.move.maxSpeed, angleDxDy(this.vel.x, this.vel.y) - 180) );
        }
        return changes;
    }

    collided(other) {
        if (other instanceof Planet || other instanceof Asteroid) {
            //this._traits.cameraMarker = true;
        }
    }

    // _updateCamera() {
    //     // update marker for camera that smoothes camera motion, if it is centered on player
    //     if (this._traits.colliding) {
    //         this._traits.cameraMarker = true;
    //         this._traits.colliding = false;
    //     } else {
    //         this._traits.colliding = false;
    //     }
    // }
}

class Planet extends GameObject {
    constructor(circle, color, velocity, mass) {
        super(circle, color, velocity, mass);
    }
}

class Asteroid extends GameObject {
    constructor(circle, color, velocity, mass) {
        super(circle, color, velocity, mass);
        this.lifespan.set(3);
    }

    collided(other) {
        if (other instanceof Player || other instanceof Planet) {
            this.explode = true;
        }
    }
}





