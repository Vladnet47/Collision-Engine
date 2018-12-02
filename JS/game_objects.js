'use strict';

// SETUP ---------------------------------------------------------------------------------------------
class Player extends GameObject {
    constructor(circle, color, velocity, mass) {
        super(circle, color, velocity, mass);
        this.traits = {
            move: { maxSpeed: 200, accel: 1000 },
            boost: { speed: 500, delay: 3, letGo: false }
        };
        this.lifespan.set("inf");
    }
    // BEHAVIOR ---------------------------------------------------------------------------------------------
    behave() {
        let changes = new ChangesPosVel();
        changes.add(this.move());
        changes.add(this.boost());
        return changes;
    }
    move() {
        let changes = new ChangesPosVel();
        let angle = -1;

        // if velocity is already greater than the max, return changes
        // if (this.vel.mag >= this.traits.move.accel) {
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
            changes.addAcc( vectorToXY(this.traits.move.accel, angle) );
        }

        return changes;
    }
    boost() {
        let changes = new ChangesPosVel();
        return changes;
    }

    // locks speed at maximum
    reduce(changes) {
        if (this.vel.mag > this.traits.move.maxSpeed) {
            changes.addVel( vectorToXY(this.vel.mag - this.traits.move.maxSpeed, -angleDxDy(this.vel.x, this.vel.y) ) );
        }
        return changes;
    }

    collided(other) {
    }
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





