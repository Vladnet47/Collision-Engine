// RECTANGLE --------------------------------------------------------------------------------------------- 
class Rectangle {
    constructor(position, dimensions) {
        this._position = position;
        this._dimensions = dimensions;
    }

    get center() {
        return new Vector( this._position.x + this._dimensions.x / 2, this._position.y + this._dimensions.y / 2 );
    }
    get tLeft() {
        return this._position;
    }
    get tRight() {
        return new Vector( this._position.x + this._dimensions.x , this._position.y );
    }
    get bLeft() {
        return new Vector( this._position.x, this._position.y + this._dimensions.y );
    }
    get bRight() {
        return new Vector( this._position.x + this._dimensions.x , this._position.y + this._dimensions.y );
    }
    get dim() {
        return this._dimensions;
    }
    get segTop() {
        return new Segment( this.tLeft, this.tRight );
    }
    get segRight() {
        return new Segment( this.tRight, this.bRight );
    }
    get segBot() {
        return new Segment( this.bLeft, this.bRight );
    }
    get segLeft() {
        return new Segment( this.tLeft, this.bLeft );
    }

    addPos(other) {
        this._position.add(other);
    }
    addDim(other) {
        this._dimensions.add(other);
    }

    toString() {
        return "Position: " + this.tLeft + " --- Dimensions: " + this.dim;
    }
}

// GAMEOBJECT ---------------------------------------------------------------------------------------------
class GameObject {
    constructor(rectangle, color, velocity, mass) {
        this._rectangle = rectangle;
        this._color = color;
        this._velocity = velocity;
        this._mass = mass;
        this._properties = {
            collidable: false, // GameObject will be scanned for collisions
            physics: false, // GameObject will not react to global events and collision physics
            colType: { ground: false } // Used to handle GameObject-specific collisions
        };
    }

    get rec() {
        return this._rectangle;
    }
    get pos() {
        return this._rectangle.tLeft;
    }
    get dim() {
        return this._rectangle.dim;
    }
    get color() {
        return this._color;
    }
    get vel() {
        return this._velocity;
    }
    get mass() {
        return this._mass;
    }
    get collidable() {
        return this._properties.collidable;
    }
    get physics() {
        return this._properties.physics;
    }
    get colType() {
        return this._properties.colType;
    }

    set collidable(state) {
        this._properties.collidable = state;
    }
    set physics(state) {
        this._properties.physics = state;
    }

    setCollision(type, state) {
        this._properties.colType[type] = state;
    }
    addVel(change) {
        this._velocity.add(change);
    }
    addPos(change) {
        this._rectangle.addPos(change);
    }
    behave() {
        return new ChangesPosVel();
    }
    collided() {
        return new ChangesPosVel();
    }
    toString() {
        return this._rectangle;
    }
}

// ENVIRONMENT INITIALIZATIONS AND SUCH --------------------------------------------------------------------------------------------- 
// class CollisionRecord {
//     constructor(index) {
//         this._index = index;
//         this._changes = new ChangesPosVel();
//         this._collisions = [];
//     }

//     get index() {
//         return this._index;
//     }

//     get cols() {
//         return this._collisions;
//     }

//     addCollision(col) {
//         this._collisions.push(col);
//     }

//     toString() {
//         let result = "This index " + this._index;
//         for(let index = 0; index < this._collisions.length; ++index) {
//             let col = this._collisions[index];
//             result += "\nCollided with index " + col.indexOther + " (" + col.typeThis + " --> " + col.typeOther + ")";
//         }
//         return result;
//     }
// }

// Stores information about a collision between two objects
// class CollisionRecordTEST {
//     constructor(index1, index2, seg1, seg2, type1, vel1, vel2, phys1, phys2) {
//         this._index1 = index1;
//         this._index2 = index2;
//         this._velocitySegment = seg1;
//         this._rectangleSegment = seg2;
//         this._type1 = type1;
//         this._velocity1 = vel1;
//         this._velocity2 = vel2;
//         this._physics1 = phys1;
//         this._physics2 = phys2;
//     }

//     get i1() {
//         return this._index1;
//     }
//     get i2() {
//         return this._index2;
//     }
//     get velSeg() {
//         return this._velocitySegment;
//     }
//     get recSeg() {
//         return this._rectangleSegment;
//     }
//     get type1() {
//         return this._type1;
//     }
//     get vel1() {
//         return this._velocity1;
//     }
//     get vel2() {
//         return this._velocity2;
//     }
//     get phys1() {
//         return this._physics1;
//     }
//     get phys2() {
//         return this._physics2;
//     }

//     toString() {
//         return "Index " + this._index1 + " collided with index " + this._index2;
//     }
// }

class Collision {
    constructor(indexOther, typeOther, offset) {
        this._indexOther = indexOther;
        this._typeOther = typeOther;
        this._offset = offset;
    }

    get i() {
        return this._indexOther;
    }
    get type() {
        return this._typeOther;
    }
    get offset() {
        return this._offset;
    }
}

class CollisionRecord {
    constructor(gameObject, index) {
        this._index = index;
        this._gameObject = gameObject;
        this._collisions = [];
    }

    get i() {
        return this._index;
    }
    get gam() {
        return this._gameObject;
    }
    get cols() {
        return this._collisions;
    }

    addCollision(collision) {
        this._collisions.push(collision);
    }

    toString() {
        let length = this._collisions.length;
        let message = "[" + this._index + "] " + this._gameObject.constructor.name + " had " + length + " collision(s)";
        if (length > 0) {
            message += " with the " + this._collisions[0].type + " side of index " + this._collisions[0].i;
            for (let index = 1; index < length; ++index) {
                message += ", " + this._collisions[index].type + " side of index " + this._collisions[index].i;
            }
        }
        return message;
    }
}

// A two dimensional linked-list that assists collision handling
class CollisionObject {
    constructor(index, vel, lockedX) {
        this._index = index;
        this._rightObject;
        this._rightOffset;
        this._leftObject;
        this._leftOffset;
        this._velocity = vel;
        this._posChange = new Vector(0,0);
        this._lockedX = lockedX;
    }

    get i() {
        return this._index;
    }
    get rObject() {
        return this._rightObject;
    }
    get rOffset() {
        return this._rightOffset;
    }
    get lObject() {
        return this._leftObject;
    }
    get lOffset() {
        return this._leftOffset;
    }
    get vel() {
        return this._velocity;
    }
    get posChange() {
        return this._posChange;
    }
    get lockedX() {
        return this.lockedX;
    }

    set lockedX(state) {
        this.lockedX = state;
    }

    addRight(index, offset) {
        this._rightObject = index;
        this._rightOffset = offset;
    }
    addLeft(index, offset) {
        this._leftObject = index;
        this._leftOffset = offset;
    }
    addPos(vector) {
        this._posChange.add(vector);
    }
}

class collisionGroup {
    constructor() {
        this._indeces = [];
        this._collisionObject;
    }

    addObject(otherObject) {
        if (!this._collisionObject) {
            this._collisionObject = otherObject;
            this._indeces.push(otherObject.i);
        } else if ( this.checkIndex(otherObject.i) ) {
            
        }
    }

    checkIndex(index) {
        for (let i = 0; i < this._indeces.length; ++i) {
            if (this._indeces[i] == index) { return true };
        }
        return false;
    }
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

    init5() {
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(50, 50), new Vector(50, 0) ) );
        this._gameObjectsNext.push( this.makePlatformTEST( new Vector(300, 100), new Vector(-50, 0) ) );

        this._narrowColEngine = new NewModelTest();
    }

    makePlatformTEST(pos, vel) {
        let platform = new Platform(new Rectangle(pos, new Vector(100, 100)), 'rgb(230, 138, 0)', vel, 100);
        platform.collidable = true;
        platform.physics = true;
        return platform;
    }




    class Player extends GameObject {
        constructor(rectangle, color, velocity, mass) {
            super(rectangle, color, velocity, mass);
            this.traits = {
                move: { maxSpeed: 200, accel: 1000 },
                jump: { speed: 500, maxJumps: 4, curJump: 0, letGo: false }
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









    // COLLISION METHODS ------------------------------------------------------------------------------------------------------
    collide2(deltaT) {
        if ( this._narrowColEngine == null ) { throw Error("No narrow collision engine specified"); }


        // Test check potential cols
        let potential = this._narrowColEngine.update(this._gameObjectsCurrent, deltaT);

        for(let index = 0; index < potential.length; ++index) {
            let record = potential[index];
            console.log(record.toString());
        }
        

        this._gameObjectsNext = this._gameObjectsCurrent;
    }

    // Determines which objects collided and handles collisions
    collideTEST(deltaT) {
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

                if (other.collidable && this._narrowColEngine.potentialCollision(gameObject, other, deltaT)) {
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
                let changes = this._narrowColEngine.update(potentialCols, deltaT);

                for (let iCol = 0; iCol < numOfCols; ++iCol) {
                    let col = potentialCols[iCol];
                    let changesCol = changes[iCol];

                    let iCurrentCol = this._gameObjectsCurrent.indexOf(col);
                    let gameObject = this._gameObjectsCurrent.splice(iCurrentCol, 1)[0];
                    this.updateVel(gameObject, changesCol, deltaT);
                    this.updatePos(gameObject, changesCol);
                    this._gameObjectsNext.push( gameObject );
                    max--;
                }
            }
        }
    }

    collide(deltaT) {
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

                if (other.collidable && this._narrowColEngine.potentialCollision(gameObject, other, deltaT)) {
                    changes.add( this._narrowColEngine.update(gameObject, other, deltaT) );
                }
            }

            // UPDATE POSITION AND VELOCITY
            this.updateVel(gameObject, changes, deltaT);
            this.updatePos(gameObject, changes);

            this._gameObjectsNext.push(gameObject);
        }
    }
