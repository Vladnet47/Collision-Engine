// ############################################ ENVIRONMENT ############################################ //

function Environment(canvas) {
    this.gameObjects = [];
    this.globalEffects = {
        gravity: { on: false, acceleration: 400, terminalVelocity: 400 },
        friction: { on: false, coef: 0.3 }
    };

    this.collisionProps = {
        width: canvas.width,
        height: canvas.height,
        
        // Uniform grid
        onUniformGrid: false,
        numColumns: 4,
        numRows: 3,
        columnWidth: 0,
        rowHeight: 0
    }

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
        let changes = new ChangesPosVel();

        // CALCULATE CHANGE IN VELOCITY DUE TO GLOBAL EFFECTS
        if(this.globalEffects.gravity.on && gameObject.getVel().getY() <= this.globalEffects.gravity.terminalVelocity) {
            if(gameObject instanceof Player) {
                changes.addVelDel( convertToXY(this.globalEffects.gravity.acceleration, -90) );
            }
        }

        // if(this.globalEffects.friction.on && GameObject.getCollision().ground) {
        //     let vel = gameObject.getVel().getX();
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
        changes.add( gameObject.behave() );

        // UPDATE POSITION AND VELOCITY

        this.updateVel(gameObject, changes, deltaTime);
        changes.setPosDel( vectorMult(gameObject.getVel(), deltaTime) );
        this.updatePos(gameObject, changes, deltaTime);
    }
}

// Determines which objects collided and handles collisions
Environment.prototype.collide = function(deltaTime) {
    for (index = 0; index < this.gameObjects.length; ++index) {

        let gameObject = this.gameObjects[index];
        let changes = new ChangesPosVel();

        // CALCULATE CHANGE IN VELOCITY/POSITION DUE TO COLLISION
        // Bottom line
        maxHeight = 600;
        if ( gameObject.isCollidable() && this.collisionLowerBound(gameObject, maxHeight) ) {
            gameObject.setCollision("ground", true);
            changes.add( this.collisionLowerBoundCalc( gameObject, maxHeight ));
        } else {
            gameObject.setCollision("ground", false);
        }

        // Uniform Grid
        if (this.collisionProps.onUniformGrid) {
            this.uniformGrid();
        }

        // Collision Engine
        if (gameObject instanceof Player) {
            for (indexCols = 0; indexCols < this.gameObjects.length; ++indexCols) {
                if (indexCols == index) {
                    continue;
                } 

                let other = this.gameObjects[indexCols];
                if ( gameObject.isCollidable() && recRecIntersect( gameObject.getRec(), other.getRec() ) ) {
                    changes.add( this.collisionRecSegCalc( gameObject, other ) );
                }
            }
        }

        // UPDATE POSITION AND VELOCITY
        this.updateVel(gameObject, changes, deltaTime);
        this.updatePos(gameObject, changes, deltaTime);
        
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

Environment.prototype.updateVel = function(gameObject, changes, deltaTime) {
    changes.setVelDel( vectorMult(changes.getVelDel(), deltaTime) );
    gameObject.addVel( changes.getVelDel() );
    gameObject.addVel( changes.getVelIns() );
}

Environment.prototype.updatePos = function(gameObject, changes, deltaTime) {
    gameObject.addPos( changes.getPosDel() );
    gameObject.addPos( changes.getPosIns() );
}

// Draws each GameObject in the environment
Environment.prototype.render = function(context) {
    this.gameObjects.forEach( function(gameObject) {
        drawRect(context, gameObject);
    });
}

// COLLISION ENGINES ----------------------------------------------------------------------------------------------

// BROAD PHASE ----------------------------------------------------

// Uniform grid
Environment.prototype.columnSize = function() {
    return ( round(this.collisionProps.width / this.collisionProps.numColumns, 1) );
}
Environment.prototype.rowSize = function() {
    return ( round(this.collisionProps.height / this.collisionProps.numRows, 1) );
}
Environment.prototype.uniformGrid = function() {
    if(this.collisionProps.columnWidth == 0 || this.collisionProps.rowHeight == 0) {
        this.collisionProps.columnWidth = this.columnSize();
        this.collisionProps.rowHeight = this.rowSize();
    }

    for(col = 0; col < this.collisionProps.numColumns; col += this.collisionProps.columnWidth) {
        for(row = 0; row < this.collisionProps.numRows; row += this.collisionProps.rowHeight) {
            let gridTile = new Rectangle( new Vector(col, row), 
                                          new Vector(this.collisionProps.columnWidth, this.collisionProps.rowHeight) );
        }
    }
}

// NARROW PHASE ---------------------------------------------------

// Imaginary line
Environment.prototype.collisionLowerBound = function(gameObject, maxHeight) {
    return ( gameObject.getPos().getY() + gameObject.getDim().getY() >= maxHeight );
}

// Returns an object containing the changes in position and velocity of the GameObject after collision
// Return in the form { position: Vector, velocity: Vector } 
Environment.prototype.collisionLowerBoundCalc = function(gameObject, maxHeight) {
    let changes = new ChangesPosVel();
    let objectPosition = gameObject.getPos().getY();
    let objectHeight = gameObject.getDim().getY();

    changes.addPosIns( convertToXY( objectPosition + objectHeight - maxHeight, 90) );
    changes.addVelIns( convertToXY( gameObject.getVel().getY(), 90 ) );
    
    return changes;
}


// Handles moving gameObject and stationary other
Environment.prototype.collisionRecSegCalc = function(gameObject, other) {
    let changes = new ChangesPosVel();
    let segmentCalc = this.collisionSegCalc(gameObject, other);

    if ( segmentCalc.type == "vertical" ) {
        let g1 = gameObject.getPos().getX();
        let g2 = g1 + gameObject.getDim().getX();
        let o1 = other.getPos().getX();
        let o2 = o1 + other.getDim().getX();

        let overlapLeft = (g2 < o2) ? Math.min(o1 - g2, 0) : 0;
        let overlapRight = (g1 < o1) ? 0 : Math.max(o2 - g1, 0);

        let pos = (overlapLeft != 0) ? overlapLeft : overlapRight;

        changes.addPosIns( convertToXY( pos, 0 ) );
        changes.addVelIns( convertToXY( -gameObject.getVel().getX(), 0 ) );
    } else if ( segmentCalc.type == "horizontal" ) {
        let g1 = gameObject.getPos().getY();
        let g2 = g1 + gameObject.getDim().getY();
        let o1 = other.getPos().getY();
        let o2 = o1 + other.getDim().getY();

        let overlapLeft = (g2 < o2) ? Math.min(o1 - g2, 0) : 0;
        let overlapRight = (g1 < o1) ? 0 : Math.max(o2 - g1, 0);

        let pos = (overlapLeft != 0) ? overlapLeft : overlapRight;

        changes.addPosIns( convertToXY( pos, -90 ) );
        changes.addVelIns( convertToXY( -gameObject.getVel().getY(), -90 ) );
    } else if ( segmentCalc.type == "error" ) {
        throw Error( gameObject.constructor.name + " did not intersect with any segments of " + other.constructor.name + " [collisionRecCalc]");
    }
    
    return changes;
}

// Return { type of segment, segment } the gameObject collided with
Environment.prototype.collisionSegCalc = function(gameObject, other) {
    let top = other.getRec().getSegmentTop();
    let right = other.getRec().getSegmentRight();
    let left = other.getRec().getSegmentLeft();
    let bottom = other.getRec().getSegmentBottom();

    if ( recSegIntersect(gameObject.getRec(), right) ) {
        return { type: "vertical", segment: right };
    }
    if ( recSegIntersect(gameObject.getRec(), left) ) {
        return { type: "vertical", segment: left };
    }
    if ( recSegIntersect(gameObject.getRec(), top) ) {
        return { type: "horizontal", segment: top };
    } 
    if ( recSegIntersect(gameObject.getRec(), bottom) ) {
        return { type: "horizontal", segment: bottom };
    }
    return { type: "error", segment: bottom };
}


// Handles moving gameObject and stationary other, using previous position segment intersection
Environment.prototype.collisionSegSegCalc = function(gameObject, other) {
    let changes = new ChangesPosVel();
    let result = this.collisionSegCalc(gameObject, other);
}

Environment.prototype.getFirstCollidedVertex = function(gameObject, other) {
    let seg1 = new Segment(new Vector(0,0), new Vector(0,0));
    seg1.constructFromVector(gameObject.getPos(), gameObject.getVel());
}



// INITIALIZATION ------------------------------------------------------------------------------------------------

// Standard 2D platformer
Environment.prototype.init1 = function() {
    this.globalEffects.gravity.on = true;
    //this.globalEffects.friction.on = true;

    this.collisionProps.onUniformGrid = false;

    let player = new Player( new Rectangle( new Vector(500, 300), new Vector(40, 40) ), 
                             'rgb(0, 153, 255)', 
                             new Vector(0,0), 
                             100 );
    let platform1 = new Platform( new Rectangle( new Vector(200, 200), new Vector(300, 300) ), 
                                  'rgb(255, 153, 102)', 
                                  new Vector(0,0), 
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
            "] Y: position is [" + gameObject.getPos().getY() + 
            "] and velocity is [" + gameObject.getVel().getY() + "]");
}

Environment.prototype.printXStats = function(gameObject) {
    return ("[" + round(this.elapsedTime, 1) + 
            "] X: position is [" + gameObject.getPos().getX() + 
            "] and velocity is [" + gameObject.getVel().getX() + "]");
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

// Returns the value rounded to the nearest decimal
function round(value, decimal) {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
}

// Returns 1 if value is positive, -1 if negative and 0 if equal to zero
function getSign(value) {
    let sign = 0;
    if(value != 0) {
        sign = value / Math.abs(value);
    }
    return sign;
}

// Rounds vector components to a decimal
function vectorRound(vec, decimal) {
    let result = new Vector(0,0);
    result.setX( round( vec.getX(), decimal ) );
    result.setY( round( vec.getY(), decimal ) );
    return result;
}

// Returns a new vector that is 'vec1 + vec2'
function vectorSum(vec1, vec2) {
    let result = new Vector(0,0);
    result.add(vec1);
    result.add(vec2);
    return result;
}

// Returns a new vector that is 'vec1 - vec2'
function vectorDiff(vec1, vec2) {
    return ( vectorSum( vec1, vectorMult(vec2, -1) ) );
}

// Returns a new vector that is 'vec * scalar'
function vectorMult(vec, scalar) {
    let result = new Vector(0,0);
    result.setX( vec.getX() * scalar );
    result.setY( vec.getY() * scalar );
    return result;
}

function vectorDiv(vec, scalar) {
    return ( vectorMult( vec, 1/scalar ) );
}

// Returns the two dimensional cross product of given vectors
function vectorCross (vec1, vec2) {
    return vec1.getX() * vec2.getY() - vec1.getY() * vec2.getX();
}

// Given two ranges, returns true if ranges overlap
// Does not matter which is min and which is max
// Endpoints count as overlap
function rangeOverlap(min1, max1, min2, max2) {
    return( Math.min(min1, max1) <= Math.max(min2, max2) && Math.max(min1, max1) >= Math.min(min2, max2) );
}

// Returns true if segments overlap in the x-direction
function segOverlapX(seg1, seg2) {
    return( rangeOverlap( seg1.getPos1().getX(), seg1.getPos2().getX(), seg2.getPos1().getX(), seg2.getPos2().getX() ) );
}

// Returns true if segments overlap in the y-direction
function segOverlapY(seg1, seg2) {
    return( rangeOverlap( seg1.getPos1().getY(), seg1.getPos2().getY(), seg2.getPos1().getY(), seg2.getPos2().getY() ) );
}

// Returns point of intersection if two segments intersect, and false if they don't
function segSegIntersect(seg1, seg2) {
    let p1 = seg1.getPos1(),
        p2 = seg2.getPos1(),
        v1 = seg1.getVector(),
        v2 = seg2.getVector(),

        a = vectorDiff(p2, p1),
        b = vectorCross(v1, v2),
        num = vectorCross(a, v1);
        
    if (b == 0 && num == 0) {
        return false; // parallel and intersecting
    } else {
        t = vectorCross(a, vectorDiv(v2, b)), // a x v2 / b
        u = vectorCross(a, vectorDiv(v1, b)); // a x v1 / b

        if( 0 <= t && t <= 1 && 0 <= u && u <= 1 ) {
            let intersection = new Vector(0,0);
            intersection.add( p1 );
            intersection.add( vectorMult(v1, t) );
            return intersection; // not parallel and intersecting
        }
    }
    return false;

    // source 
        // https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
        // https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
}

function recSegIntersect(rec, seg) {
    let top = rec.getSegmentTop();
    let side = rec.getSegmentRight();
    if( segOverlapX(top, seg) && segOverlapY(side, seg) ) {
        return true;
    }
    return false;
}

function recRecIntersect(rec1, rec2) {
    let top1 = rec1.getSegmentTop();
    let side1 = rec1.getSegmentRight();
    let top2 = rec2.getSegmentTop();
    let side2 = rec2.getSegmentRight();

    if( segOverlapX(top1, top2) && segOverlapY(side1, side2) ) {
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
Vector.prototype.toString = function() {
    return "(" + round(this.getX(), 3) + ", " + round(this.getY(), 3) + ")";
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
// Returns a Vector the same length of the segment, from pos1 to pos2
Segment.prototype.getVector = function() {
    return new Vector(this.pos2.getX() - this.pos1.getX(), this.pos2.getY() - this.pos1.getY());
}
Segment.prototype.getMagnitude = function() {
    return this.getVector().getMagnitude();
}
Segment.prototype.toString = function() {
    return "Endpoints of segment are " + this.pos1 + " and " + this.pos2;
}

// CHANGESPOSVEL ---------------------------------------------------------------------------------------------

function ChangesPosVel() {
    this.pos = { instant: new Vector(0,0), delta: new Vector(0,0) };
    this.vel = { instant: new Vector(0,0), delta: new Vector(0,0) };
}

ChangesPosVel.prototype.getPosIns = function() {
    return this.pos.instant;
}
ChangesPosVel.prototype.getPosDel = function() {
    return this.pos.delta;
}
ChangesPosVel.prototype.getVelIns = function() {
    return this.vel.instant;
}
ChangesPosVel.prototype.getVelDel = function() {
    return this.vel.delta;
}
ChangesPosVel.prototype.setVelDel = function(velDel) {
    this.vel.delta = velDel;
}
ChangesPosVel.prototype.setPosDel = function(posDel) {
    this.pos.delta = posDel;
}
ChangesPosVel.prototype.add = function(other) {
    this.addPosIns(other.getPosIns());
    this.addPosDel(other.getPosDel());
    this.addVelIns(other.getVelIns());
    this.addVelDel(other.getVelDel());
}
ChangesPosVel.prototype.addPosIns = function(change) {
    this.pos.instant.add(change);
}
ChangesPosVel.prototype.addPosDel = function(change) {
    this.pos.delta.add(change);
}
ChangesPosVel.prototype.addVelIns = function(change) {
    this.vel.instant.add(change);
}
ChangesPosVel.prototype.addVelDel = function(change) {
    this.vel.delta.add(change);
}
ChangesPosVel.prototype.toString = function() {
    return this.printPos() + "\n" + this.printVel();
}
ChangesPosVel.prototype.printPos = function() {
    return "Changes in Position --- instant: " + this.pos.instant + " and delta: " + this.pos.delta;
}
ChangesPosVel.prototype.printVel = function() {
    return "Changes in Velocity --- instant: " + this.vel.instant + " and delta: " + this.vel.delta;
}

// RECTANGLE ---------------------------------------------------------------------------------------------

function Rectangle(position, dimensions) {
    this.position = position;
    this.dimensions = dimensions;
}

Rectangle.prototype.getPos = function() {
    return this.position;
}
Rectangle.prototype.getCenter = function() {
    return new Vector( this.position.getX() + this.width/2,
                       this.position.getY() + this.height/2 )
}
Rectangle.prototype.getDim = function() {
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
Rectangle.prototype.toString = function() {
    return "Position: " + this.getPos() + " --- Dimensions: " + this.getDim();
}

// GameObject ---------------------------------------------------------------------------------------------

function GameObject(rectangle, color, velocity, mass) {
    this.rectangle = rectangle;
    this.color = color;
    this.velocity = velocity;
    this.mass = mass;
    this.properties = { 
        collidable: false, 
        collision: { ground: false }
    }
}

GameObject.prototype.getRec = function() {
    return this.rectangle;
}
GameObject.prototype.getPos = function() {
    return this.rectangle.getPos();
}
GameObject.prototype.getDim = function() {
    return this.rectangle.getDim();
}
GameObject.prototype.getColor = function() {
    return this.color;
}
GameObject.prototype.getVel = function() {
    return this.velocity;
}
GameObject.prototype.getMass = function() {
    return this.mass;
}
GameObject.prototype.isCollidable = function() {
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
GameObject.prototype.addVel = function(changeInVelocity) {
    this.velocity.add(changeInVelocity);
}
GameObject.prototype.addPos = function(changeInPosition) {
    this.rectangle.position.add(changeInPosition);
}
GameObject.prototype.behave = function() {
    return new ChangesPosVel();
}
GameObject.prototype.collided = function() {
    return new ChangesPosVel();
}
GameObject.prototype.toString = function() {
    return this.rectangle;
}










// ############################################ GameObjectS ############################################ //

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



// ############################################ RENDERING ############################################ //

function drawRect(context, gameObject) {
    context.fillStyle = gameObject.getColor();
    context.fillRect(gameObject.getPos().getX(), 
                     gameObject.getPos().getY(), 
                     gameObject.getDim().getX(), 
                     gameObject.getDim().getY());
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
    
    let envir = new Environment(canvas);
    envir.init1();

    loop();

    function loop() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        let deltaTime = systemTime.getDeltaTime();
        events.checkEvents();

        try {
            envir.update(deltaTime);
            envir.render(context);
        } catch (err) {
            console.log( err.message );
        } finally {
            requestAnimationFrame(loop);
        }

        // let seg1 = new Segment(new Vector(0,0), new Vector(1,0));
        // let seg2 = new Segment(new Vector(1,0), new Vector(2,0));

        // let seg3 = new Segment(new Vector(0,0), new Vector(2,0));
        // let seg4 = new Segment(new Vector(1,0), new Vector(5,9));

        // let seg5 = new Segment(new Vector(0,0), new Vector(2,2));
        // let seg6 = new Segment(new Vector(0,1), new Vector(1,2));
        
        // let res1 = segSegIntersect(seg1, seg2);
        // let res2 = segSegIntersect(seg3, seg4);
        
        // if (res2) {
        //     console.log(res2.print());
        // }
    }
})

function initCanvas() {
    let canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    return canvas;
}