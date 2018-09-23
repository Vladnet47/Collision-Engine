// ############################################ ENVIRONMENT ############################################ //

function Environment() {
    this.gameObjects = [];
    this.globalEffects = {
        gravity: { on: false, acceleration: 400, terminalVelocity: 400 },
        friction: { on: false, coef: 0.3 }
    };

    // debug
    this.timer = 1;
    this.elapsedTime = 0;
}

// Calculates the next position of each GameObject in the environment
Environment.prototype.update = function(deltaTime) {
    this.behave(deltaTime);
    this.collide(deltaTime);
}

// Updates positions of all GameObjects before collision
Environment.prototype.behave = function(deltaTime) {
    for(index = 0, len = this.gameObjects.length; index < len; ++index) {

        let gameObject = this.gameObjects[index];
        let changeInVelocity = { instant: new Vector(0,0), delta: new Vector(0,0) };
        let changeInPosition = { instant: new Vector(0,0), delta: new Vector(0,0) };

        // CALCULATE CHANGE IN VELOCITY DUE TO GLOBAL EFFECTS
        if(this.globalEffects.gravity.on && gameObject.getVelocity().getY() <= this.globalEffects.gravity.terminalVelocity) {
            let magnitude = this.globalEffects.gravity.acceleration; //
            let change = convertToXY(magnitude, -90);

            changeInVelocity.delta.add(change);
        }

        // if(this.globalEffects.friction.on && GameObject.getCollision().ground) {
        //     let vel = gameObject.getVelocity().getX();
        //     let accel = this.globalEffects.gravity.acceleration * this.globalEffects.friction.coef; //
        //     let change = new Vector(0,0);

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
        changeInPosition.delta = VectorScalar(gameObject.getVelocity(), deltaTime);
        this.updatePos(gameObject, changeInPosition, deltaTime);
    }
}

// Determines which objects collided and handles collisions
Environment.prototype.collide = function(deltaTime) {
    for(index = 0, len = this.gameObjects.length; index < len; ++index) {

        let gameObject = this.gameObjects[index];
        let changeInVelocity = { instant: new Vector(0,0), delta: new Vector(0,0) };
        let changeInPosition = { instant: new Vector(0,0), delta: new Vector(0,0) };

        // CALCULATE CHANGE IN VELOCITY/POSITION DUE TO COLLISION

        // Bottom line
        maxHeight = 600;
        if( gameObject.getCollidable() && this.collisionLowerBound(gameObject, maxHeight) ) {
            let instantChanges = this.collisionLowerBoundCalc(gameObject, maxHeight);
            changeInPosition.instant.add( instantChanges.position );
            changeInVelocity.instant.add( instantChanges.velocity );

            gameObject.setCollision("ground", true);
        } else {
            gameObject.setCollision("ground", false);
        }

        // Segment engine
        for(index2 = 0, len = this.gameObjects.length; index2 < len; ++index2) {
            if(index2 == index) {
                continue;
            }
            let other = this.gameObjects[index2];
            if( gameObject.getCollidable() && this.collisionRec(gameObject, other)) {
                let changes = this.collisionRecCalc(gameObject, other);
                changeInPosition.instant.add( changes.position.instant );
                changeInVelocity.instant.add( changes.velocity.instant );

                gameObject.setCollision("ground", true);
            } else {
                gameObject.setCollision("ground", false);
            }
        }
        

        // UPDATE COLLISION EFFECTS

        // UPDATE POSITION AND VELOCITY
        this.updateVel(gameObject, changeInVelocity, deltaTime);
        this.updatePos(gameObject, changeInPosition, deltaTime);

        //DEBUG

        // Timer
        // let frequency = 1; // time in seconds
        // if( this.timer >= frequency ) {
        //     console.log(this.printYStats(gameObject));
        //     this.elapsedTime += this.timer;
        //     this.timer = 0;
        // } else {
        //     this.timer += deltaTime;
        // }

        // Available functions
        // console.log(this.checkCollision(GameObject));
        // console.log(this.printXStats(GameObject));
        // console.log(this.printYStats(GameObject));
    }
}

Environment.prototype.updateVel = function(gameObject, changeInVelocity, deltaTime) {
    changeInVelocity.delta = VectorScalar(changeInVelocity.delta, deltaTime);
    gameObject.addToVelocity( changeInVelocity.delta );
    gameObject.addToVelocity( changeInVelocity.instant );
}

Environment.prototype.updatePos = function(gameObject, changeInPosition, deltaTime) {
    gameObject.addToPosition( changeInPosition.delta );
    gameObject.addToPosition( changeInPosition.instant );
}



// Draws each GameObject in the environment
Environment.prototype.render = function(context) {
    this.gameObjects.forEach( function(gameObject) {
        drawRect(context, gameObject);
    });
}

// COLLISION ENGINES ----------------------------------------------------------------------------------------------

// Checks if GameObject has reached the desired height
// Returns true if it has, false if it has not
Environment.prototype.collisionLowerBound = function(gameObject, maxHeight) {
    let objectHeight = gameObject.getDimensions().getY();

    if((gameObject.getPosition().getY() + objectHeight) >= maxHeight) {
        return true;
    }
    return false;
}

// Returns an object containing the changes in position and velocity of the GameObject after collision
// Return in the form { position: Vector, velocity: Vector } 
Environment.prototype.collisionLowerBoundCalc = function(gameObject, maxHeight) {
    let objectPosition = gameObject.getPosition().getY();
    let objectHeight = gameObject.getDimensions().getY();
    let difference = objectPosition + objectHeight - maxHeight;

    let instantChanges = { position: convertToXY( difference , 90 ),
                           velocity: convertToXY( gameObject.getVelocity().getY(), 90 ) };
 
    return instantChanges;
}


Environment.prototype.collisionRec = function(gameObject, other) {
    return recRecIntersect( gameObject.getRectangle(), other.getRectangle() );
}

Environment.prototype.collisionRecCalc = function(gameObject, other) {
    let top = other.getRectangle().getSegmentTop();
    let right = other.getRectangle().getSegmentRight();
    let left = other.getRectangle().getSegmentLeft();
    let bottom = other.getRectangle().getSegmentBottom();

    if (recSegIntersect(gameObject.getRectangle(), top)) {
        return gameObject.collided("top", top);
    } else if (recSegIntersect(gameObject.getRectangle(), right)) {
        return gameObject.collided("right", right);
    } else if (recSegIntersect(gameObject.getRectangle(), left)) {
        return gameObject.collided("left", left);
    } else if (recSegIntersect(gameObject.getRectangle(), bottom)) {
        return gameObject.collided("bottom", bottom);
    }
}

Environment.prototype.getSegment = function(gameObject, other) {

}

// INITIALIZATION ------------------------------------------------------------------------------------------------

// Standard 2D platformer
Environment.prototype.init1 = function() {
    this.globalEffects.gravity.on = true;
    //this.globalEffects.friction.on = true;

    let player = new Player( new Rectangle( new Vector(50, 500), new Vector(40, 40) ), 
                             'rgb(0, 153, 255)', 
                             new Vector(0,-300), 
                             100 );
    let platform1 = new Platform( new Rectangle( new Vector(200, 200), new Vector(100, 300) ), 
                                  'rgb(255, 153, 102)', 
                                  new Vector(20,0), 
                                  100 );
    platform1.setCollidable(true);
    player.setCollidable(true);

    this.gameObjects.push(platform1);
    this.gameObjects.push(player);
}

// DEBUG ---------------------------------------------------------------------------------------------------------
// Checks if GameObject is undergoing a collision
Environment.prototype.checkCollision = function(gameObject) {
    return ("Collision with ground is [" + gameObject.properties.collision.ground + "]");
}

Environment.prototype.printYStats = function(gameObject) {
    return ("[" + round(this.elapsedTime, 1) + 
            "] Y: position is [" + gameObject.getPosition().getY() + 
            "] and velocity is [" + gameObject.getVelocity().getY() + "]");
}

Environment.prototype.printXStats = function(gameObject) {
    return ("[" + round(this.elapsedTime, 1) + 
            "] X: position is [" + gameObject.getPosition().getX() + 
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

// returns 1 if value is positive, -1 if negative and 0 if equal to zero
function getSign(value) {
    let sign = 0;
    if(value != 0) {
        sign = value / Math.abs(value);
    }
    return sign;
}

// rounds Vector to a decimal
function VectorRound(vect, decimal) {
    let result = new Vector(0,0);
    result.setX( round( vect.getX(), decimal ) );
    result.setY( round( vect.getY(), decimal ) );
    return result;
}

// multiplies the Vector by the scalar
function VectorScalar(vect, scalar) {
    let result = new Vector(0,0);
    result.setX( vect.getX() * scalar );
    result.setY( vect.getY() * scalar );
    return result;
}

// Given two ranges, returns true if ranges overlap
// Does not matter which is min and which is max
// Endpoints do not count as overlap
function rangeOverlap(min1, max1, min2, max2) {
    return( Math.min(min1, max1) < Math.max(min2, max2) && Math.max(min1, max1) > Math.min(min2, max2) );
}

function segSegIntersect() {

}

function recSegIntersect(rec, seg) {
    let top = rec.getSegmentTop();
    let side = rec.getSegmentRight();

    if( rangeOverlap( top.getPos1().getX(), top.getPos2().getX(), seg.getPos1().getX(), seg.getPos2().getX() ) &&
        rangeOverlap( side.getPos1().getY(), side.getPos2().getY(), seg.getPos1().getY(), seg.getPos2().getY() ) ) {
        return true;
    }
    return false;
}

function recRecIntersect(rec1, rec2) {
    let top1 = rec1.getSegmentTop();
    let side1 = rec1.getSegmentRight();
    let top2 = rec2.getSegmentTop();
    let side2 = rec2.getSegmentRight();

    if( rangeOverlap( top1.getPos1().getX(), top1.getPos2().getX(), top2.getPos1().getX(), top2.getPos2().getX() ) &&
        rangeOverlap( side1.getPos1().getY(), side1.getPos2().getY(), side2.getPos1().getY(), side2.getPos2().getY() ) ) {
        return true;
    }
    return false;
}















// ############################################ BASIC DATA STRUCTURES ############################################ //

// Vector ---------------------------------------------------------------------------------------------

function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.add = function(other) {
    this.x += other.getX();
    this.y += other.getY();
}
Vector.prototype.set = function(other) {
    this.setX(other.getX());
    this.setY(other.getY());
}
Vector.prototype.setX = function(x) {
    this.x = x;
}
Vector.prototype.setY = function(y) {
    this.y = y;
}
Vector.prototype.getX = function() {
    return this.x;
}
Vector.prototype.getY = function() {
    return this.y;
}
Vector.prototype.getMagnitude = function() {
    return Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2) );
}
Vector.prototype.print = function() {
    return ("(" + round(this.getX(), 3) + ", " + round(this.getY(), 3) + ")");
}

// HELPER FUNCTIONS ---------------------------------------------------------------------------------------------

// Returns a Vector with x and y components calculated from magnitude and direction.
// Direction is given in degrees
function convertToXY(magnitude, direction) {
    let x = Math.cos(toRadians(direction)) * magnitude;
    let y = Math.sin(toRadians(-direction)) * magnitude;
    return ( new Vector(x, y) );
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// SEGMENT -----------------------------------------------------------------------------------------------

// Constructs line segment from two Vectors as endpoints
function Segment(pos1, pos2) {
    this.pos1 = pos1;
    this.pos2 = pos2;
}

// Constructs line segment over a Vector, given a position Vector
Segment.prototype.constructFromVector = function(pos, vec) {
    let temp = new Vector(0,0);
    temp.add(pos);
    temp.add(vec);

    this.pos1 = pos;
    this.pos2 = temp;
}

Segment.prototype.getPos1 = function() {
    return this.pos1;
}
Segment.prototype.getPos2 = function() {
    return this.pos2;
}
Segment.prototype.print = function() {
    return "Endpoints of segment are " + this.pos1.print() + " and " + this.pos2.print();
}


// Rectangle ---------------------------------------------------------------------------------------------

function Rectangle(position, dimensions) {
    this.position = position;
    this.dimensions = dimensions;
}

Rectangle.prototype.getPosition = function() {
    return this.position;
}
Rectangle.prototype.getCenter = function() {
    return new Vector( this.position.getX() + this.width/2,
                       this.position.getY() + this.height/2 )
}
Rectangle.prototype.getDimensions = function() {
    return this.dimensions;
}
Rectangle.prototype.getSegmentTop = function() { //ask dad about inheritance
    let temp = new Vector(this.position.getX() + this.dimensions.getX(), this.position.getY());
    return new Segment( this.position, temp );
}
Rectangle.prototype.getSegmentRight = function() {
    let temp1 = new Vector(this.position.getX() + this.dimensions.getX(), this.position.getY());
    let temp2 = new Vector(this.position.getX() + this.dimensions.getX(), this.position.getY() + this.dimensions.getY());
    return new Segment( temp1, temp2 );
}
Rectangle.prototype.getSegmentBottom = function() {
    let temp1 = new Vector(this.position.getX(), this.position.getY() + this.dimensions.getY());
    let temp2 = new Vector(this.position.getX() + this.dimensions.getX(), this.position.getY() + this.dimensions.getY());
    return new Segment( temp1, temp2 );
}
Rectangle.prototype.getSegmentLeft = function() {
    let temp = new Vector(this.position.getX(), this.position.getY() + this.dimensions.getY());
    return new Segment( this.position, temp );
}


Rectangle.prototype.setPosition = function(other) {
    this.position = other;
}
Rectangle.prototype.print = function() {
    return ( "Position: " + this.getPosition().print() + " --- Dimensions: " + this.getDimensions().print());
}

// GameObject ---------------------------------------------------------------------------------------------

function GameObject(Rectangle, color, velocity, mass) {
    this.Rectangle = Rectangle;
    this.color = color;
    this.velocity = velocity;
    this.mass = mass;
    this.properties = { 
        collidable: false, 
        collision: { ground: false }
    }
}

GameObject.prototype.getPosition = function() {
    return this.Rectangle.getPosition();
}
GameObject.prototype.getDimensions = function() {
    return this.Rectangle.getDimensions();
}
GameObject.prototype.getRectangle = function() {
    return this.Rectangle;
}
GameObject.prototype.getColor = function() {
    return this.color;
}
GameObject.prototype.getVelocity = function() {
    return this.velocity;
}
GameObject.prototype.getMass = function() {
    return this.mass;
}
GameObject.prototype.getCollidable = function() {
    return this.properties.collidable;
}
GameObject.prototype.getCollision = function() {
    return this.properties.collision;
}


GameObject.prototype.setCollidable = function(state) {
    this.properties.collidable = state;
}
GameObject.prototype.setCollision = function(type, state) {
    this.properties.collision[type] = state;
}
GameObject.prototype.addToVelocity = function(changeInVelocity) {
    this.velocity.add(changeInVelocity);
}
GameObject.prototype.addToPosition = function(changeInPosition) {
    this.Rectangle.position.add(changeInPosition);
}

GameObject.prototype.behave = function() {
    return { instant: new Vector(0,0), delta: new Vector(0,0) };
}
GameObject.prototype.collided = function() {
    return { position: { instant: new Vector(0,0), delta: new Vector(0,0) }, 
             velocity: { instant: new Vector(0,0), delta: new Vector(0,0) } };
}










// ############################################ GameObjectS ############################################ //

// SETUP ---------------------------------------------------------------------------------------------

function Player(Rectangle, color, velocity, mass) {
    GameObject.call(this, Rectangle, color, velocity, mass);

    this.traits = {
        move: { maxSpeed: 200, accel: 50 },
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
Platform.prototype.constructor = Player;

// BEHAVIOR ---------------------------------------------------------------------------------------------

Player.prototype.behave = function() {
    let indivChanges = { instant: new Vector(0,0), delta: new Vector(0,0) };
    
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
    let indivChanges = { instant: new Vector(0,0), delta: new Vector(0,0) };
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
    let indivChanges = { instant: new Vector(0,0), delta: new Vector(0,0) };

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
        let currentVelocity = this.getVelocity().getY();

        indivChanges.instant.add( convertToXY( this.traits.jump.speed + currentVelocity, 90 ) );
    }

    return indivChanges;
}

// COLLISION ---------------------------------------------------------------------------------------------

Player.prototype.collided = function(type, segment) {
    if(type == "top") {
        let difference = this.getPosition().getY() + this.getDimensions().getY() - segment.getPos1().getY();

        return { position: { instant: convertToXY( difference , 90 ), delta: new Vector(0,0) }, 
                 velocity: { instant: convertToXY( this.getVelocity().getY(), 90 ), delta: new Vector(0,0) } };
    }

    if(type == "right") {
        let difference = segment.getPos1().getX() - this.getPosition().getX();

        return { position: { instant: convertToXY( difference , 0 ), delta: new Vector(0,0) }, 
                 velocity: { instant: convertToXY( this.getVelocity().getX(), 0 ), delta: new Vector(0,0) } };
    }

    if(type == "left") {
        let difference = this.getPosition().getX() + this.getDimensions().getX() - segment.getPos1().getX();

        return { position: { instant: convertToXY( difference , 180 ), delta: new Vector(0,0) }, 
                 velocity: { instant: convertToXY( this.getVelocity().getX(), 180 ), delta: new Vector(0,0) } };
    }

    if(type == "bottom") {
        let difference = segment.getPos1().getY() - this.getPosition().getX();

        return { position: { instant: convertToXY( difference , -90 ), delta: new Vector(0,0) }, 
                 velocity: { instant: convertToXY( this.getVelocity().getY(), -90 ), delta: new Vector(0,0) } };
    }

    GameObject.prototype.collided.call(this);
}



// ############################################ RENDERING ############################################ //

function drawRect(context, gameObject) {
    context.fillStyle = gameObject.getColor();
    context.fillRect(gameObject.getPosition().getX(), 
                     gameObject.getPosition().getY(), 
                     gameObject.getDimensions().getX(), 
                     gameObject.getDimensions().getY());
}

function drawLine(context, Vector) {
    context.moveTo(0,0);
    context.lineTo(Vector.x, Vector.y);
    context.stroke();
}





// ############################################ GAME LOOP ############################################ //

$(document).ready(function() {
    let canvas = initCanvas();
    let context = canvas.getContext('2d');
    
    let envir = new Environment();
    envir.init1();

    loop();

    function loop() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        let deltaTime = systemTime.getDeltaTime();
        events.checkEvents();

        envir.update(deltaTime);
        envir.render(context);

        requestAnimationFrame(loop);
    }
})

function initCanvas() {
    let canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    return canvas;
}






// HELPFUL SNIPPETS ----------------------------------------------------------------------

// Calls the "super" (GameObject) method from Player
// GameObject.prototype.behave.call(this);