// ############################################ ENVIRONMENT ############################################ //

function Environment() {
    this.gameObjects = [];
    this.globalEffects = {
        gravity: { on: false, acceleration: 100, terminalVelocity: 200 },
        friction: { on: false, coef: 0.3 }
    };


    // debug
    this.timer = 1;
    this.elapsedTime = 0;
}

// Calculates the next position of each gameObject in the environment
Environment.prototype.update = function(deltaTime) {
    this.behave(deltaTime);
    this.collide(deltaTime);
}

// Updates positions of all gameObjects before collision
Environment.prototype.behave = function(deltaTime) {
    for(index = 0, len = this.gameObjects.length; index < len; ++index) {

        let gameObject = this.gameObjects[index];
        let changeInVelocity = { instant: new vector(0,0), delta: new vector(0,0) };
        let changeInPosition = { instant: new vector(0,0), delta: new vector(0,0) };

        // CALCULATE CHANGE IN VELOCITY DUE TO GLOBAL EFFECTS
        if(this.globalEffects.gravity.on && gameObject.getVelocity().getY() <= this.globalEffects.gravity.terminalVelocity) {
            let magnitude = this.globalEffects.gravity.acceleration; //
            let change = convertToXY(magnitude, -90);

            changeInVelocity.delta.add(change);
        }

        // if(this.globalEffects.friction.on && gameObject.getCollision().ground) {
        //     let vel = gameObject.getVelocity().getX();
        //     let accel = this.globalEffects.gravity.acceleration * this.globalEffects.friction.coef; //
        //     let change = new vector(0,0);

        //     if( vel > accel*deltaTime ) {
        //         change = convertToXY(accel, 180);
        //     } else if ( vel < -accel*deltaTime ) {
        //         change = convertToXY(accel, 0);
        //     } else {
        //         change = convertToXY(-vel, 0);
        //     }

        //     changeInVelocity.add(change);
        // }

        // CALCULATE CHANGE IN VELOCITY DUE TO INDIVIDUAL MOVEMENT
        let indivChanges = gameObject.behave();
        changeInVelocity.instant.add(indivChanges.instant);
        changeInVelocity.delta.add(indivChanges.delta);

        // UPDATE POSITION AND VELOCITY
        
        this.updateVel(gameObject, changeInVelocity, deltaTime);
        changeInPosition.delta = vectorScalar(gameObject.getVelocity(), deltaTime);
        this.updatePos(gameObject, changeInPosition, deltaTime);
    }
}

// Determines which objects collided and handles collisions
Environment.prototype.collide = function(deltaTime) {
    for(index = 0, len = this.gameObjects.length; index < len; ++index) {

        let gameObject = this.gameObjects[index];
        let changeInVelocity = { instant: new vector(0,0), delta: new vector(0,0) };
        let changeInPosition = { instant: new vector(0,0), delta: new vector(0,0) };

        // CALCULATE CHANGE IN VELOCITY/POSITION DUE TO COLLISION
        maxHeight = 600;
        if( gameObject.getCollidable() && this.collisionLowerBound(gameObject, maxHeight) ) {
            let instantChanges = this.collisionLowerBoundCalc(gameObject, maxHeight);
            changeInPosition.instant.add( instantChanges.position );
            changeInVelocity.instant.add( instantChanges.velocity );

            gameObject.setCollision("ground", true);
        } else {
            gameObject.setCollision("ground", false);
        }

        // UPDATE COLLISION EFFECTS

        // UPDATE POSITION AND VELOCITY
        this.updateVel(gameObject, changeInVelocity, deltaTime);
        this.updatePos(gameObject, changeInPosition, deltaTime);

        //DEBUG

        // Timer
        let frequency = 1; // time in seconds
        if( this.timer >= frequency ) {
            console.log(this.checkYStats(gameObject));
            this.elapsedTime += this.timer;
            this.timer = 0;
        } else {
            this.timer += deltaTime;
        }

        // Available functions
        // console.log(this.checkCollision(gameObject));
        // console.log(this.checkXStats(gameObject));
        // console.log(this.checkYStats(gameObject));
    }
}

Environment.prototype.updateVel = function(gameObject, changeInVelocity, deltaTime) {
    changeInVelocity.delta = vectorScalar(changeInVelocity.delta, deltaTime);
    gameObject.addToVelocity( changeInVelocity.delta );
    gameObject.addToVelocity( changeInVelocity.instant );
}

Environment.prototype.updatePos = function(gameObject, changeInPosition, deltaTime) {
    gameObject.addToPosition( changeInPosition.delta );
    gameObject.addToPosition( changeInPosition.instant );
}



// Draws each gameObject in the environment
Environment.prototype.render = function(context) {
    this.gameObjects.forEach( function(gameObject) {
        drawRect(context, gameObject.getColor(), gameObject.getRectangle());
    });
}

// COLLISION ENGINES ----------------------------------------------------------------------------------------------

// Checks if gameObject has reached the desired height
// Returns true if it has, false if it has not
Environment.prototype.collisionLowerBound = function(gameObject, maxHeight) {
    let objectHeight = gameObject.getRectangle().getDimensions().getY();

    if((gameObject.getPosition().getY() + objectHeight) >= maxHeight) {
        return true;
    }
    return false;
}

// Returns an object containing the changes in position and velocity of the gameObject after collision
// Return in the form { position: vector, velocity: vector } 
Environment.prototype.collisionLowerBoundCalc = function(gameObject, maxHeight) {
    let objectPosition = gameObject.getRectangle().getPosition().getY();
    let objectHeight = gameObject.getRectangle().getDimensions().getY();
    let difference = objectPosition + objectHeight - maxHeight;

    let instantChanges = { position: convertToXY( difference , 90 ),
                           velocity: convertToXY( gameObject.getVelocity().getY(), 90 ) };
 
    return instantChanges;
}

// INITIALIZATION ------------------------------------------------------------------------------------------------

// Standard 2D platformer
Environment.prototype.init1 = function() {
    this.globalEffects.gravity.on = true;
    this.globalEffects.friction.on = true;

    let player = new Player( new rectangle( new vector(10, 10), new vector(20, 20) ), 'rgb(0, 102, 204)', new vector(0,0), 100 );
    player.setCollidable(true);

    this.gameObjects.push(player);
}

// DEBUG ---------------------------------------------------------------------------------------------------------
// Checks if gameObject is undergoing a collision
Environment.prototype.checkCollision = function(gameObject) {
    return ("Collision with ground is [" + gameObject.properties.collision.ground + "]");
}

Environment.prototype.checkYStats = function(gameObject) {
    return ("[" + round(this.elapsedTime, 1) + 
            "] Y: position is [" + gameObject.getRectangle().getPosition().getY() + 
            "] and velocity is [" + gameObject.getVelocity().getY() + "]");
}

Environment.prototype.checkXStats = function(gameObject) {
    return ("[" + round(this.elapsedTime, 1) + 
            "] X: position is [" + gameObject.getRectangle().getPosition().getX() + 
            "] and velocity is [" + gameObject.getVelocity().getX() + "]");
}







// ############################################ SYSTEM ############################################ //

var events = {
    // list of possible events
    leftArrowDown: false,
    rightArrowDown: false,
    spaceDown: false,
    aDown: false,
    dDown: false,

    // checks external inputs from keyboard and mouse
    checkEvents: function() {
        $(document).keydown(function(event) { events.logEvents(event, true); })
        $(document).keyup(function(event) { events.logEvents(event, false); })
    },

    // updates the current states (true or false) of the possible events
    logEvents: function(event, state) {
        let keys = {
            32: function() { events.spaceDown = state },
            37: function() { events.leftArrowDown = state },
            39: function() { events.rightArrowDown = state },
            65: function() { events.aDown = state },
            68: function() { events.dDown = state }
        }
    
        // Each key on the keyboard has a number code which is stored ih 'event.which'.
        // 'key' is set equal to the function at the 'event.which' index of 'keys'.
        // If 'event.which' index does not exist in 'keys', then the if statement below returns
        // false, since 'key' becomes an undefined function. 
        // Otherwise, if 'event.which' does exist, the if statement returns true and the function stored in 'key' is called.
        let key = keys[event.which];
        if(key)
            key();
    }
};

var systemTime = {
    lastUpdate: Date.now(),

    // calculates the time between frames, in seconds
    getDeltaTime: function() {
        let currentUpdate = Date.now();
        let deltaTime = currentUpdate - systemTime.lastUpdate;
        systemTime.lastUpdate = currentUpdate;
    
        return deltaTime / 1000;
    },
}

function round(value, decimal) {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
}

function roundVector(vect, decimal) {
    let result = new vector(0,0);
    result.setX( round( vect.getX(), decimal ) );
    result.setY( round( vect.getY(), decimal ) );
    return result;
}

function vectorScalar(vect, scalar) {
    let result = new vector(0,0);
    result.setX( vect.getX() * scalar );
    result.setY( vect.getY() * scalar );
    return result;
}

// returns 1 if positive, -1 if negative and 0 if equal to zero
function getSign(value) {
    let sign = 0;
    if(value != 0) {
        sign = value / Math.abs(value);
    }
    return sign;
}













// ############################################ BASIC DATA STRUCTURES ############################################ //

// VECTOR ---------------------------------------------------------------------------------------------

function vector(x, y) {
    this.x = x;
    this.y = y;
}
vector.prototype.add = function(other) {
    this.x += other.getX();
    this.y += other.getY();
}
vector.prototype.set = function(other) {
    this.setX(other.getX());
    this.setY(other.getY());
}
vector.prototype.setX = function(x) {
    this.x = x;
}
vector.prototype.setY = function(y) {
    this.y = y;
}
vector.prototype.getX = function() {
    return this.x;
}
vector.prototype.getY = function() {
    return this.y;
}
vector.prototype.print = function() {
    return ("(" + round(this.getX(), 3) + ", " + round(this.getY(), 3) + ")");
}

// HELPER FUNCTIONS ---------------------------------------------------------------------------------------------

// Returns a vector with x and y components calculated from magnitude and direction.
// Direction is given in degrees
function convertToXY(magnitude, direction) {
    let x = Math.cos(toRadians(direction)) * magnitude;
    let y = Math.sin(toRadians(-direction)) * magnitude;
    return ( new vector(x, y) );
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// RECTANGLE ---------------------------------------------------------------------------------------------

function rectangle(position, dimensions) {
    this.position = position;
    this.dimensions = dimensions;
}

rectangle.prototype.getPosition = function() {
    return this.position;
}
rectangle.prototype.getCenter = function() {
    return new vector( this.position.getX() + this.width/2,
                       this.position.getY() + this.height/2 )
}
rectangle.prototype.getDimensions = function() {
    return this.dimensions;
}

rectangle.prototype.setPosition = function(other) {
    this.position = other;
}
rectangle.prototype.print = function() {
    return ( "Position: " + this.getPosition().print() + " --- Dimensions: " + this.getDimensions().print());
}

// GAMEOBJECT ---------------------------------------------------------------------------------------------

function gameObject(rectangle, color, velocity, mass) {
    this.rectangle = rectangle;
    this.color = color;
    this.velocity = velocity;
    this.mass = mass;
    this.properties = { 
        collidable: false, 
        collision: { ground: false }
    }
}

gameObject.prototype.getPosition = function() {
    return this.rectangle.getPosition();
}
gameObject.prototype.getRectangle = function() {
    return this.rectangle;
}
gameObject.prototype.getColor = function() {
    return this.color;
}
gameObject.prototype.getVelocity = function() {
    return this.velocity;
}
gameObject.prototype.getMass = function() {
    return this.mass;
}
gameObject.prototype.getCollidable = function() {
    return this.properties.collidable;
}
gameObject.prototype.getCollision = function() {
    return this.properties.collision;
}


gameObject.prototype.setCollidable = function(state) {
    this.properties.collidable = state;
}
gameObject.prototype.setCollision = function(type, state) {
    this.properties.collision[type] = state;
}
gameObject.prototype.addToVelocity = function(changeInVelocity) {
    this.velocity.add(changeInVelocity);
}
gameObject.prototype.addToPosition = function(changeInPosition) {
    this.rectangle.position.add(changeInPosition);
}

gameObject.prototype.behave = function() {
    return new vector(0,0);
}
gameObject.prototype.collide = function() {

}










// ############################################ GAMEOBJECTS ############################################ //

// SETUP ---------------------------------------------------------------------------------------------

function Player(rectangle, color, velocity, mass) {
    gameObject.call(this, rectangle, color, velocity, mass);

    this.traits = {
        move: { maxSpeed: 100, accel: 100 },
        jump: { speed: 100, maxJumps: 2, curJump: 0, letGo: false }
    }
}

// make gameObject the 'super' class, and specify player's constructor
Player.prototype = Object.create(gameObject.prototype);
Player.prototype.constructor = Player;

// BEHAVIOR ---------------------------------------------------------------------------------------------


Player.prototype.behave = function() {
    let indivChanges = { instant: new vector(0,0), delta: new vector(0,0) };
    
    // Jump
    let jumpChanges = this.jumpPlatformer();
    indivChanges.instant.add(jumpChanges.instant);
    indivChanges.delta.add(jumpChanges.delta);

    // Movement
    let movementChanges = this.movePlatformer();
    indivChanges.instant.add(movementChanges.instant);
    indivChanges.delta.add(movementChanges.delta);

    return indivChanges;
}

Player.prototype.movePlatformer = function() {
    let indivChanges = { instant: new vector(0,0), delta: new vector(0,0) };
    let playerVelocityX = this.getVelocity().getX();
    let playerVelocityABS = Math.abs(playerVelocityX);

    // if player is moving slower than its max speed, pressing the controls will increase speed respectively
    if ( playerVelocityX < this.traits.move.maxSpeed && (events.rightArrowDown || events.dDown) ) {
        indivChanges.delta.add( convertToXY( this.traits.move.accel, 0 ) );
    } 
    if ( playerVelocityX > -this.traits.move.maxSpeed && (events.leftArrowDown || events.aDown) ) {
        indivChanges.delta.add( convertToXY( this.traits.move.accel, 180 ) );
    }
    // if player is moving faster than max speed, speed is reduced to max
    else if ( playerVelocityABS > this.traits.move.maxSpeed ) {
        let difference = playerVelocityABS - this.traits.move.maxSpeed;
        indivChanges.instant.add( convertToXY( difference * getSign(playerVelocityX) , 180 ) );
    }

    return indivChanges;
}

Player.prototype.jumpPlatformer = function() {
    let indivChanges = { instant: new vector(0,0), delta: new vector(0,0) };

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
        console.log("here");
        this.traits.jump.curJump++;
        this.traits.jump.letGo = false;
        let currentVelocity = this.getVelocity().getY();

        if(-currentVelocity < this.traits.jump.speed) {
            indivChanges.instant.add( convertToXY( this.traits.jump.speed + currentVelocity, 90 ) );
        }  
    }

    return indivChanges;
}

// COLLISION ---------------------------------------------------------------------------------------------





// ############################################ RENDERING ############################################ //

function drawRect(context, color, rectangle) {
    context.fillStyle = color;
    context.fillRect(rectangle.getPosition().getX(), 
                     rectangle.getPosition().getY(), 
                     rectangle.getDimensions().getX(), 
                     rectangle.getDimensions().getY());
}

function drawLine(context, vector) {
    context.moveTo(0,0);
    context.lineTo(vector.x, vector.y);
    context.stroke();
}





// ############################################ GAME LOOP ############################################ //

$(document).ready(function() {
    let canvas = initCanvas();
    let context = canvas.getContext('2d');
    //let debug = document.getElementById('debug');
    
    let envir = new Environment();
    envir.init1();

    tick();

    function tick() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        let deltaTime = systemTime.getDeltaTime();
        events.checkEvents();

        envir.update(deltaTime);
        envir.render(context);
        
        requestAnimationFrame(tick);
    }
})

function initCanvas() {
    let canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    return canvas;
}






// HELPFUL SNIPPETS ----------------------------------------------------------------------

// Calls the "super" (gameObject) method from Player
// gameObject.prototype.behave.call(this);