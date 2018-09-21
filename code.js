// ############################################ ENVIRONMENT ############################################ //

function Environment() {
    this.gameObjects = [];
    this.globalEffects = {
        gravity: { on: false, acceleration: 50 },
        friction: { on: false, coef: 0.5 }
    };
}

// Calculates the next position of each gameObject in the environment
Environment.prototype.update = function(deltaTime) {
    for(index = 0, len = this.gameObjects.length; index < len; ++index) {
        
        let gameObject = this.gameObjects[index];
        let changeInVelocity = new vector(0,0);
        let changeInPosition = new vector(0,0);

        // CALCULATE CHANGE IN VELOCITY DUE TO GLOBAL EFFECTS
        if(this.globalEffects.gravity.on) {
            let magnitude = this.globalEffects.gravity.acceleration * deltaTime;
            let change = convertToXY(magnitude, -90);

            changeInVelocity.add(change);
        }

        if(this.globalEffects.friction.on && gameObject.getCollision().ground) {
            let vel = gameObject.getVelocity().getX();
            let accel = this.globalEffects.gravity.acceleration * this.globalEffects.friction.coef * deltaTime;
            let change = new vector(0,0);

            if( vel > accel ) {
                change = convertToXY(accel, 180);
            } else if ( vel < -accel ) {
                change = convertToXY(accel, 0);
            } else {
                change = convertToXY(-vel, 0);
            }

            changeInVelocity.add(change);
        }

        // CALCULATE CHANGE IN VELOCITY DUE TO INDIVIDUAL MOVEMENT
        changeInVelocity.add( gameObject.behave(deltaTime) );
        
        // CALCULATE CHANGE IN VELOCITY/POSITION DUE TO COLLISION
        maxHeight = 600;
        if( gameObject.getCollidable && this.collisionLowerBound(gameObject, changeInVelocity, maxHeight) ) {
            let changes = this.collisionLowerBoundCalc(gameObject, changeInVelocity, maxHeight);
            changeInPosition.add( changes.position );
            changeInVelocity.add( changes.velocity );

            gameObject.setCollision("ground", true);
        } else {
            gameObject.setCollision("ground", false);
        }

        // UPDATE VELOCITY
        gameObject.addToVelocity(changeInVelocity);

        // UPDATE POSITION
        gameObject.addToPosition(gameObject.getVelocity());
        gameObject.addToPosition(changeInPosition);

        // UPDATE COLLISION EFFECTS
        console.log(gameObject.getVelocity().getX());
    }
}

// Draws each gameObject in the environment
Environment.prototype.render = function(context) {
    this.gameObjects.forEach( function(gameObject) {
        drawRect(context, gameObject.getColor(), gameObject.getRectangle())
    });
}

// COLLISION ENGINES ----------------------------------------------------------------------------------------------

// Checks if gameObject has reached the desired height
// Returns true if it has, false if it has not
Environment.prototype.collisionLowerBound = function(gameObject, changeInVelocity, maxHeight) {
    let gameObjectHeight = gameObject.getRectangle().getDimensions().getY();

    if((gameObject.getPosition().getY() + changeInVelocity.getY() + gameObjectHeight) > maxHeight) {
        return true;
    }
    return false;
}

// Returns an object containing the changes in position and velocity of the gameObject after collision
// Return in the form { position: vector, velocity: vector } 
Environment.prototype.collisionLowerBoundCalc = function(gameObject, changeInVelocity, maxHeight) {
    let nextPosition = gameObject.getRectangle().getPosition().getY() + changeInVelocity.getY();
    let diffInPos = nextPosition - maxHeight;
    let gameObjectHeight = gameObject.getRectangle().getDimensions().getY();

    let changes = { position: convertToXY( round( diffInPos + gameObjectHeight , 0), 90 ),
                   velocity: convertToXY( gameObject.getVelocity().getY() + changeInVelocity.getY(), 90 )};

    return changes;
}

// INITIALIZATION ------------------------------------------------------------------------------------------------

// Standard 2D platformer
Environment.prototype.init1 = function() {
    this.globalEffects.gravity.on = true;
    //this.globalEffects.friction.on = true;

    let player = new Player( new rectangle( new vector(10, 10), new vector(20, 20) ), 'rgb(0, 102, 204)', new vector(0,0), 100 );
    player.setCollidable(true);

    this.gameObjects.push(player);
}

// DEBUG ---------------------------------------------------------------------------------------------------------
// Checks if gameObject is undergoing a collision
Environment.prototype.checkCollision = function(gameObject) {
    return ("Collision event is [" + gameObject.properties.collision.ground + "]");
}

Environment.prototype.compareVelocities = function(v1, v2) {
    return (v1.getX() + v2.getX());
}







// ############################################ SYSTEM ############################################ //

var events = {
    // list of possible events
    leftArrowDown: false,
    rightArrowDown: false,
    spaceDown: false,

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
            39: function() { events.rightArrowDown = state } 
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
    }
}

function round(value, decimal) {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
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
vector.prototype.multScalar = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
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
rectangle.prototype.print = function() {
    return ( "Position: " + this.getPosition() + " --- Dimensions: " + this.getDimensions());
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
        move: { maxSpeed: 5, accel: 50 },
        jump: { speed: 10, numOf: 1 }
    }
}

// make gameObject the 'super' class, and specify player's constructor
Player.prototype = Object.create(gameObject.prototype);
Player.prototype.constructor = Player;

// BEHAVIOR ---------------------------------------------------------------------------------------------


Player.prototype.behave = function(deltaTime) {
    //Movement
    return (this.controls(deltaTime));
        
    //Jumping
    // if(events.spaceDown && this.effects.ground) {
    //     this.effects.ground = false;
    //     this.addVelocity(3, 90);
    // }
}

Player.prototype.controls = function(deltaTime) {
    let changeInVelocity = new vector(0,0);
    
    if(events.rightArrowDown && this.getVelocity().getX() < this.traits.move.maxSpeed) {
        changeInVelocity.add( convertToXY( this.traits.move.accel * deltaTime, 0) );
    } else if (events.leftArrowDown && this.getVelocity().getX() > -this.traits.move.maxSpeed) {
        changeInVelocity.add( convertToXY( this.traits.move.accel * deltaTime, 180) );
    }

    return changeInVelocity;
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