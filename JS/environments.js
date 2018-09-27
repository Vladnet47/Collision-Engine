// ############################################ ENVIRONMENT ############################################ //

class Environment {
    constructor(canvas) {
        this._gameObjects = [];
        this._globalEffects = {
            gravity: { on: false, acceleration: 400, terminalVelocity: 400 },
            friction: { on: false, coef: 0.3 }
        };

        this._collisionProps = {
            width: canvas.width,
            height: canvas.height,
            
            // Uniform grid
            onUniformGrid: false,
            numColumns: 4,
            numRows: 3,
            columnWidth: 0,
            rowHeight: 0
        };
        
        // debug
        this.timer = 1;
        this.elapsedTime = 0;
    }

    // Calculates the next position of each GameObject in the environment
    update(deltaTime) {
        this.behave(deltaTime);
        this.collide(deltaTime);
    }

    // Updates positions of all GameObjects before collision
    behave(deltaTime) {
        for (let index = 0; index < this._gameObjects.length; ++index) {
            let gameObject = this._gameObjects[index];
            let changes = new ChangesPosVel();

            // CALCULATE CHANGE IN VELOCITY DUE TO GLOBAL EFFECTS
            if (this._globalEffects.gravity.on && gameObject.vel.y <= this._globalEffects.gravity.terminalVelocity) {
                if (gameObject instanceof Player) {
                    changes.addVelDel( vectorToXY(this._globalEffects.gravity.acceleration, -90) );
                }
            }

            // if(this._globalEffects.friction.on && GameObject.colType.ground) {
            //     let vel = gameObject.vel.x;
            //     let accel = this._globalEffects.gravity.acceleration * this._globalEffects.friction.coef; //
            //     let change = new Vector(0,0);
            //     if( vel > accel*deltaTime ) {
            //         change = vectorToXY(accel, 180);
            //     } else if ( vel < -accel*deltaTime ) {
            //         change = vectorToXY(accel, 0);
            //     } else {
            //         change = vectorToXY(-vel, 0);
            //     }
            //     changeInVelocity.add(change);
            // }

            // CALCULATE CHANGE IN VELOCITY DUE TO INDIVIDUAL MOVEMENT
            changes.add(gameObject.behave());
            // UPDATE POSITION AND VELOCITY
            this.updateVel(gameObject, changes, deltaTime);
            changes.posDel = vectorMult(gameObject.vel, deltaTime);
            this.updatePos(gameObject, changes);
        }
    }

    // Determines which objects collided and handles collisions
    collide(deltaTime) {
        for (let index = 0; index < this._gameObjects.length; ++index) {
            let gameObject = this._gameObjects[index];
            let changes = new ChangesPosVel();

            // CALCULATE CHANGE IN VELOCITY/POSITION DUE TO COLLISION
            // Bottom line
            let maxHeight = 600;
            if (gameObject.collidable && this.collisionLowerBound(gameObject, maxHeight)) {
                gameObject.setCollision("ground", true);
                changes.add(this.collisionLowerBoundCalc(gameObject, maxHeight));
            } else {
                gameObject.setCollision("ground", false);
            }

            // Uniform Grid
            if (this._collisionProps.onUniformGrid) {
                this.uniformGrid();
            }

            // Collision Engine
            if (gameObject instanceof Player) {
                for (let indexCols = 0; indexCols < this._gameObjects.length; ++indexCols) {
                    if (indexCols == index) {
                        continue;
                    }
                    let other = this._gameObjects[indexCols];
                    if (gameObject.collidable && recRecIntersect(gameObject.rec, other.rec)) {
                        changes.add(this.collisionRecSegCalc(gameObject, other));
                    }
                }
            }

            // UPDATE POSITION AND VELOCITY
            this.updateVel(gameObject, changes, deltaTime);
            this.updatePos(gameObject, changes);
            
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

    updateVel(gameObject, changes, deltaTime) {
        changes.velDel = vectorMult(changes.velDel, deltaTime);
        gameObject.addVel(changes.velDel);
        gameObject.addVel(changes.velIns);
    }

    updatePos(gameObject, changes) {
        gameObject.addPos(changes.posDel);
        gameObject.addPos(changes.posIns);
    }

    // Draws each GameObject in the environment
    render(context) {
        this._gameObjects.forEach( function (gameObject) { drawRect(context, gameObject); } );
    }

    // COLLISION ENGINES ----------------------------------------------------------------------------------------------
    
    // BROAD PHASE ----------------------------------------------------
    // Uniform grid
    columnSize() {
        return (round(this._collisionProps.width / this._collisionProps.numColumns, 1));
    }

    rowSize() {
        return (round(this._collisionProps.height / this._collisionProps.numRows, 1));
    }

    uniformGrid() {
        if (this._collisionProps.columnWidth == 0 || this._collisionProps.rowHeight == 0) {
            this._collisionProps.columnWidth = this.columnSize();
            this._collisionProps.rowHeight = this.rowSize();
        }
        for (col = 0; col < this._collisionProps.numColumns; col += this._collisionProps.columnWidth) {
            for (row = 0; row < this._collisionProps.numRows; row += this._collisionProps.rowHeight) {
                let gridTile = new Rectangle(new Vector(col, row), new Vector(this._collisionProps.columnWidth, this._collisionProps.rowHeight));
            }
        }
    }

    // NARROW PHASE ---------------------------------------------------
    // Imaginary line
    collisionLowerBound(gameObject, maxHeight) {
        return (gameObject.pos.y + gameObject.dim.y >= maxHeight);
    }

    // Returns an object containing the changes in position and velocity of the GameObject after collision
    // Return in the form { position: Vector, velocity: Vector } 
    collisionLowerBoundCalc(gameObject, maxHeight) {
        let changes = new ChangesPosVel();
        changes.addPosIns(vectorToXY(gameObject.pos.y + gameObject.dim.y - maxHeight, 90));
        changes.addVelIns(vectorToXY(gameObject.vel.y, 90));
        return changes;
    }

    // Tier 2 Collision Engine
    // Handles moving gameObject and stationary other
    collisionRecSegCalc(gameObject, other) {
        let changes = new ChangesPosVel(),
            type = this.segmentType(gameObject, other);

        if (type == "vertical") {
            let offset = this.offsetCalc( gameObject.pos.x, gameObject.dim.x, other.pos.x, other.rec.tRight.x );
            changes.addPosIns(vectorToXY(offset, 0));
            changes.addVelIns(vectorToXY(-gameObject.vel.x, 0));
        } else if (type == "horizontal") {
            let offset = this.offsetCalc( gameObject.pos.y, gameObject.dim.y, other.pos.y, other.rec.bRight.y );
            changes.addPosIns(vectorToXY(offset, -90));
            changes.addVelIns(vectorToXY(-gameObject.vel.y, -90));
        }
        return changes;
    }
    
    // Return the type of segment the gameObject collided with
    segmentType(gameObject, other) {
        if ( recSegIntersect(gameObject.rec, other.rec.segRight) || recSegIntersect(gameObject.rec, other.rec.segLeft) ) {
            return "vertical";
        } else if ( recSegIntersect(gameObject.rec, other.rec.segTop) || recSegIntersect(gameObject.rec, other.rec.segBot) ) {
            return "horizontal";
        } else {
            throw Error(gameObject.constructor.name + " did not intersect with any segments of " + other.constructor.name + " [segmentType]");
        }
    }

    // Given coordinate and dimension of gameObject and left and right dimensions of other, calculates the offset required
    // to move the gameObject out of other1-other2 range
    offsetCalc(g, dimG, other1, other2) {
        let a = Math.min(other1, other2),
            b = Math.max(other1, other2);
        return (a < g && g <= b) ? b-g : a-g-dimG;
    }

    // Tier 3 Collision Engine
    // Handles moving gameObject and stationary other, using previous position segment intersection
    collisionSegSegCalc(gameObject, other) {
        let changes = new ChangesPosVel();
        let result = this.collisionSegCalc(gameObject, other);
    }
    getFirstCollidedVertex(gameObject, other) {
        let seg1 = new Segment(new Vector(0, 0), new Vector(0, 0));
        seg1.constructFromVector(gameObject.pos, gameObject.vel);
    }

    // INITIALIZATION ------------------------------------------------------------------------------------------------
    // Standard 2D platformer
    init1() {
        this._globalEffects.gravity.on = true;
        //this._globalEffects.friction.on = true;
        this._collisionProps.onUniformGrid = false;
        let player = new Player(new Rectangle(new Vector(500, 300), new Vector(40, 40)), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        let platform1 = new Platform(new Rectangle(new Vector(200, 200), new Vector(300, 300)), 'rgb(255, 153, 102)', new Vector(0, 0), 100);
        platform1.collidable = true;
        player.collidable = true;
        this._gameObjects.push(platform1);
        this._gameObjects.push(player);
    }

    // DEBUG ---------------------------------------------------------------------------------------------------------
    // Checks if GameObject is undergoing a collision
    checkCollision(gameObject) {
        return ("Collision with ground is [" + gameObject.colType.ground + "]");
    }
    printYStats(gameObject) {
        return ("[" + round(this.elapsedTime, 1) +
            "] Y: position is [" + gameObject.pos.y +
            "] and velocity is [" + gameObject.vel.y + "]");
    }
    printXStats(gameObject) {
        return ("[" + round(this.elapsedTime, 1) +
            "] X: position is [" + gameObject.pos.x +
            "] and velocity is [" + gameObject.vel.x + "]");
    }
}





















