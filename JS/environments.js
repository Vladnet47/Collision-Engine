// ############################################ ENVIRONMENT ############################################ //

class Environment {
    constructor(canvas) {
        this._gameObjectsCurrent = [];
        this._gameObjectsNext = [];
        this._narrowColEngine;
        this._broadColEngines;
        this._globalEffects = {
            gravity: { on: false, acceleration: 800, terminalVelocity: 600 },
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
        this._gameObjectsCurrent = this._gameObjectsNext;
        this._gameObjectsNext = [];
        this.behave(deltaTime);
        this.collideTEST(deltaTime);
    }

    // Updates positions of all GameObjects before collision
    behave(deltaTime) {
        for (let index = 0; index < this._gameObjectsCurrent.length; ++index) {
            let gameObject = this._gameObjectsCurrent[index];
            let changes = new ChangesPosVel();

            // CALCULATE CHANGE IN VELOCITY DUE TO GLOBAL EFFECTS
            if( gameObject.physics ) {
                // Gravity
                if (this._globalEffects.gravity.on && gameObject.vel.y <= this._globalEffects.gravity.terminalVelocity) {
                    changes.addVelDel( vectorToXY(this._globalEffects.gravity.acceleration, -90) );
                }
            }

            // CALCULATE CHANGE IN VELOCITY DUE TO INDIVIDUAL MOVEMENT
            changes.add(gameObject.behave());

            // UPDATE POSITION AND VELOCITY
            this.updateVel(gameObject, changes, deltaTime);
            changes.posDel = vectorMult(gameObject.vel, deltaTime);
            this.updatePos(gameObject, changes);
        }
    }

    // Determines which objects collided and handles collisions
    collideTEST(deltaTime) {
        if ( this._narrowColEngine == null ) { throw Error("No narrow collision engine specified"); }

        let iCurrent = 0;
        let max = this._gameObjectsCurrent.length;

        while(iCurrent < max) {
            let gameObject = this._gameObjectsCurrent[iCurrent];
            if ( !gameObject.collidable && !gameObject.physics ) { continue; }

            // List of objects that are undergoing a potential collision
            let potentialCols = [gameObject];
            let iOther = iCurrent + 1;

            // Create potentialCols by checking gameObject with all other objects (after it) in the list
            while(iOther < max) {
                let other = this._gameObjectsCurrent[iOther];

                if (other.collidable && this._narrowColEngine.potentialCollision(gameObject, other, deltaTime)) {
                    potentialCols.push(other);
                }
                iOther++;
            }

            // Update each gameObjects with its respective changes and remove from current gameObjects
            let numOfCols = potentialCols.length; // should be changes
            if(numOfCols < 2) {
                this._gameObjectsNext.push( this._gameObjectsCurrent.splice(iCurrent, 1)[0] );
                max--;
            } else {
                let changes = this._narrowColEngine.update(potentialCols, deltaTime);

                for (let iCol = 0; iCol < numOfCols; ++iCol) {
                    let col = potentialCols[iCol];
                    let changesCol = changes[iCol];

                    let iCurrentCol = this._gameObjectsCurrent.indexOf(col);
                    let gameObject = this._gameObjectsCurrent.splice(iCurrentCol, 1)[0];
                    this.updateVel(gameObject, changesCol, deltaTime);
                    this.updatePos(gameObject, changesCol);
                    this._gameObjectsNext.push( gameObject );
                    max--;
                }
            }
        }
    }

    collide(deltaTime) {
        for ( let index = 0; index < this._gameObjectsCurrent.length; ++index ) {
            let gameObject = this._gameObjectsCurrent[index];

            // ELIMINATE OBJECTS THAT ARE NOT COLLIDABLE AND DON'T PARTICIPATE IN PHYSICS CALCULATIONS
            if ( this._narrowColEngine.length == 0) { throw Error("No narrow collision engine in environment"); }
            if ( !gameObject.collidable && !gameObject.physics ) { continue; }

            let changes = new ChangesPosVel();

            // CALCULATE CHANGE IN VELOCITY/POSITION DUE TO NARROW COLLISION
            for (let indexOth = 0; indexOth < this._gameObjectsCurrent.length; ++indexOth) {
                if (indexOth == index) { continue; }

                let other = this._gameObjectsCurrent[indexOth];

                if (other.collidable && this._narrowColEngine.potentialCollision(gameObject, other, deltaTime)) {
                    changes.add( this._narrowColEngine.update(gameObject, other, deltaTime) );
                }
            }

            // UPDATE POSITION AND VELOCITY
            this.updateVel(gameObject, changes, deltaTime);
            this.updatePos(gameObject, changes);

            this._gameObjectsNext.push(gameObject);
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
        this._gameObjectsNext.forEach( function (gameObject) { drawRect(context, gameObject); } );
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
        this._collisionProps.onUniformGrid = false;

        let player = new Player(new Rectangle(new Vector(430, 0), new Vector(40, 40)), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        let platform1 = new Platform(new Rectangle(new Vector(200, 300), new Vector(200, 300)), 'rgb(230, 138, 0)', new Vector(0, 0), 100);
        let platform2 = new Platform(new Rectangle(new Vector(0, 600), new Vector(2000, 10)), 'rgb(153, 153, 102)', new Vector(0, 0), 100);
        let platform3 = new Platform(new Rectangle(new Vector(500, 100), new Vector(200, 300)), 'rgb(230, 138, 0)', new Vector(0, 0), 100);

        platform1.collidable = true;
        player.collidable = true;
        platform2.collidable = true;
        platform3.collidable = true;

        player.physics = true;

        this._gameObjectsNext.push(platform1);
        this._gameObjectsNext.push(platform2);
        this._gameObjectsNext.push(platform3);
        this._gameObjectsNext.push(player);

        this._narrowColEngine = new TierIII();
    }

    init2() {
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(50, 50), new Vector(100, 0) ) );
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(300, 148), new Vector(-50, 0) ) );

        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(50, 300), new Vector(50, 0) ) );
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(300, 350), new Vector(-50, 0) ) );
        
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(50, 550), new Vector(50, 0) ) );
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(400, 500), new Vector(-150, 0) ) );

        this._narrowColEngine = new TierIV();
    }

    init3() {
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(50, 50), new Vector(100, 0) ) );
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(300, 148), new Vector(25, 0) ) );

        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(50, 300), new Vector(50, 0) ) );
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(300, 350), new Vector(10, 0) ) );
        
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(50, 550), new Vector(150, 0) ) );
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(400, 500), new Vector(0, 0) ) );

        this._narrowColEngine = new TierIV();
    }

    init4() {
        let player1 = new Player(new Rectangle(new Vector(50, 200), new Vector(40, 40)), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        let player2 = new Player(new Rectangle(new Vector(500, 200), new Vector(40, 40)), 'rgb(0, 153, 255)', new Vector(0, 0), 100);

        player1.collidable = true;
        player1.physics = true;
        player2.collidable = true;
        player2.physics = true;

        this._gameObjectsNext.push(player1);
        this._gameObjectsNext.push(player2);
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(200, 210), new Vector(150, 0) ) );

        this._narrowColEngine = new TierIV();
    }

    makePlatformTEST(pos, vel) {
        let platform = new Platform(new Rectangle(pos, new Vector(100, 100)), 'rgb(230, 138, 0)', vel, 100);
        platform.collidable = true;
        platform.physics = true;
        return platform;
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

















