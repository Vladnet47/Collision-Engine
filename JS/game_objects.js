
// SETUP ---------------------------------------------------------------------------------------------

function Player(Rectangle, color, velocity, mass) {
    GameObject.call(this, Rectangle, color, velocity, mass);

    this.traits = {
        move: { maxSpeed: 200, accel: 200 },
        jump: { speed: 400, maxJumps: 10, curJump: 0, letGo: false }
    }
}

function Platform(Rectangle, color, velocity, mass) {
    GameObject.call(this, Rectangle, color, velocity, mass);
}

// make GameObject the 'super' class, and specify player's constructor
Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player;
Platform.prototype = Object.create(GameObject.prototype);
Platform.prototype.constructor = Platform;

// BEHAVIOR ---------------------------------------------------------------------------------------------

Player.prototype.behave = function() {
    let changes = new ChangesPosVel();

    changes.add( this.jumpPlatformer() );
    changes.add( this.movePlatformer() );

    return changes;
}

Player.prototype.movePlatformer = function() {
    let changes = new ChangesPosVel();
    let playerVelocityX = this.getVel().getX();
    let playerVelocityABS = Math.abs(playerVelocityX);

    // if player is moving slower than its max speed, pressing the controls will increase speed respectively
    if ( playerVelocityX < this.traits.move.maxSpeed && (events.rightArrowDown || events.dDown) ) {
        changes.addVelDel( convertToXY( this.traits.move.accel, 0 ) );
    } 
    if ( playerVelocityX > -this.traits.move.maxSpeed && (events.leftArrowDown || events.aDown) ) {
        changes.addVelDel( convertToXY( this.traits.move.accel, 180 ) );
    }
    // if player is moving faster than max speed, speed is reduced to max
    else if ( playerVelocityABS > this.traits.move.maxSpeed ) {
        let difference = playerVelocityABS - this.traits.move.maxSpeed;
        changes.addVelIns( convertToXY( difference * getSign(playerVelocityX) , 180 ) );
    }

    return changes;
}

Player.prototype.jumpPlatformer = function() {
    let changes = new ChangesPosVel();

    // Reset number of jumps once player touches ground
    if(this.properties.collision.ground) {
        this.traits.jump.curJump = 0;
    }

    // Check if player let go of the space bar
    if(!events.spaceDown) {
        this.traits.jump.letGo = true;
    }

    // If spacebar is pressed
    // If spacebar was released after previous jump
    // If there are jumps available 
    // Then jump
    if( events.spaceDown && this.traits.jump.letGo && this.traits.jump.curJump < this.traits.jump.maxJumps) {
        this.traits.jump.curJump++;
        this.traits.jump.letGo = false;
        let currentVelocity = this.getVel().getY();

        changes.addVelIns( convertToXY( this.traits.jump.speed + currentVelocity, 90 ) );
    }

    return changes;
}

Player.prototype.collided = function(type, segment) {
    GameObject.prototype.collided.call(this);
}