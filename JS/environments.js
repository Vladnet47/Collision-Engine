// ############################################ ENVIRONMENT ############################################ //

class Environment {
    constructor(canvas) {
        this._gameObjects = [];
        this._narrowColEngines = [];
        this._broadColEngines = [];
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
                if(gameObject instanceof Player) {
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
        for ( let index = 0; index < this._gameObjects.length; ++index ) {
            let gameObject = this._gameObjects[index];
            let changes = new ChangesPosVel();

            // CALCULATE CHANGE IN VELOCITY/POSITION DUE TO NARROW COLLISION
            for (let indexCol = 0; indexCol < this._narrowColEngines.length; ++indexCol) {
                let curEngine = this._narrowColEngines[indexCol];
                
                for (let indexOth = 0; indexOth < this._gameObjects.length; ++indexOth) {
                    if (indexOth == index) {
                        continue;
                    }

                    let other = this._gameObjects[indexOth];

                    if( gameObject.collidable && curEngine.potentialCollision(gameObject, other, deltaTime) ) {
                        changes.add( curEngine.update(gameObject, other, deltaTime) );
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

    // INITIALIZATION ------------------------------------------------------------------------------------------------
    // Standard 2D platformer
    init1() {
        this._globalEffects.gravity.on = true;
        //this._globalEffects.friction.on = true;
        this._collisionProps.onUniformGrid = false;

        let player = new Player(new Rectangle(new Vector(500, 0), new Vector(40, 40)), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        let platform1 = new Platform(new Rectangle(new Vector(200, 300), new Vector(200, 300)), 'rgb(230, 138, 0)', new Vector(0, 0), 100);
        let platform2 = new Platform(new Rectangle(new Vector(0, 600), new Vector(2000, 10)), 'rgb(153, 153, 102)', new Vector(0, 0), 100);
        platform1.collidable = true;
        player.collidable = true;
        platform2.collidable = true;
        this._gameObjects.push(platform1);
        this._gameObjects.push(platform2);
        this._gameObjects.push(player);

        this._narrowColEngines.push(new TierIII());
    }

    // DEBUG ---------------------------------------------------------------------------------------------------------
    // Checks if GameObject is undergoing a collision
    checkCollision(gameObject) {
        return ("Collision with ground is [" + gameObject.colType.ground + "]");
    }
    printYStats(gameObject) {
        return ("[" + round(this.elapsedTime, 1) +
            "] Y: position is [" + round(gameObject.pos.y, 2) +
            "] and velocity is [" + round(gameObject.vel.y, 2) + "]");
    }
    printXStats(gameObject) {
        return ("[" + round(this.elapsedTime, 1) +
            "] X: position is [" + round(gameObject.pos.x, 2) +
            "] and velocity is [" + round(gameObject.vel.x, 2) + "]");
    }
}





















