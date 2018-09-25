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