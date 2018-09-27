
// SETUP ---------------------------------------------------------------------------------------------
class Player extends GameObject{
    constructor(Rectangle, color, velocity, mass) {
        super(Rectangle, color, velocity, mass);
        this.traits = {
            move: { maxSpeed: 200, accel: 200 },
            jump: { speed: 400, maxJumps: 100, curJump: 0, letGo: false }
        };
    }
    // BEHAVIOR ---------------------------------------------------------------------------------------------
    behave() {
        let changes = new ChangesPosVel();
        changes.add(this.jumpPlatformer());
        changes.add(this.movePlatformer());
        return changes;
    }
    movePlatformer() {
        let changes = new ChangesPosVel();
        let playerVelocityX = this.vel.x;
        let playerVelocityABS = Math.abs(playerVelocityX);
        // if player is moving slower than its max speed, pressing the controls will increase speed respectively
        if (playerVelocityX < this.traits.move.maxSpeed && (events.rightArrowDown || events.dDown)) {
            changes.addVelDel(vectorToXY(this.traits.move.accel, 0));
        }
        if (playerVelocityX > -this.traits.move.maxSpeed && (events.leftArrowDown || events.aDown)) {
            changes.addVelDel(vectorToXY(this.traits.move.accel, 180));
        }
        // if player is moving faster than max speed, speed is reduced to max
        else if (playerVelocityABS > this.traits.move.maxSpeed) {
            let difference = playerVelocityABS - this.traits.move.maxSpeed;
            changes.addVelIns(vectorToXY(difference * getSign(playerVelocityX), 180));
        }
        return changes;
    }
    jumpPlatformer() {
        let changes = new ChangesPosVel();
        // Reset number of jumps once player touches ground
        if (this.colType.ground) {
            this.traits.jump.curJump = 0;
        }
        // Check if player let go of the space bar
        if (!events.spaceDown) {
            this.traits.jump.letGo = true;
        }
        // If spacebar is pressed
        // If spacebar was released after previous jump
        // If there are jumps available 
        // Then jump
        if (events.spaceDown && this.traits.jump.letGo && this.traits.jump.curJump < this.traits.jump.maxJumps) {
            this.traits.jump.curJump++;
            this.traits.jump.letGo = false;
            let currentVelocity = this.vel.y;
            changes.addVelIns(vectorToXY(this.traits.jump.speed + currentVelocity, 90));
        }
        return changes;
    }
    collided(type, segment) {
        GameObject.prototype.collided.call(this);
    }
}

class Platform extends GameObject {
    constructor(Rectangle, color, velocity, mass) {
        super(Rectangle, color, velocity, mass);
    }
}





