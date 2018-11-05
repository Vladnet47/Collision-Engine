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

    init() {
        this._globalEffects.gravity.on = false;
        this._collisionProps.onUniformGrid = false;

        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        player.collidable = true;
        player.physics = true;

        this._gameObjectsNext.push(player);
    }

    // Calculates the next position of each GameObject in the environment
    update(deltaTime) {
        this._gameObjectsCurrent = this._gameObjectsNext;
        this._gameObjectsNext = [];
        this.behave(deltaTime);
        //this.collide(deltaTime);

        // dangerous line
        this._gameObjectsNext = this._gameObjectsCurrent;
    }

    // Updates positions of all GameObjects before collision
    behave(deltaTime) {
        for (let index = 0; index < this._gameObjectsCurrent.length; ++index) {
            let gameObject = this._gameObjectsCurrent[index];
            let changes = new ChangesPosVel();

            // CALCULATE CHANGE IN VELOCITY DUE TO GLOBAL EFFECTS
            if( gameObject.physics ) {
                // Gravity
            }

            // CALCULATE CHANGE IN VELOCITY DUE TO INDIVIDUAL MOVEMENT
            changes.add(gameObject.behave());

            // UPDATE POSITION AND VELOCITY
            this.updateVel(gameObject, changes, deltaTime);
            changes.posDel = vectorMult(gameObject.vel, deltaTime);
            this.updatePos(gameObject, changes);

            console.log( this.printXStats(gameObject) );
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
        this._gameObjectsNext.forEach( function (gameObject) { drawCirc(context, gameObject); } );
    }

   

    // DEBUG ---------------------------------------------------------------------------------------------------------
    // Checks if GameObject is undergoing a collision
    checkCollision(gameObject) {
        return ("Collision with ground is [" + gameObject.listCols.ground + "]");
    }
    printYStats(gameObject) {
        return ("[" + round(this.elapsedTime, 1) +
            "] Y: position is [" + round(gameObject.y, 2) +
            "] and velocity is [" + round(gameObject.vel.y, 2) + "]");
    }
    printXStats(gameObject) {
        return ("[" + round(this.elapsedTime, 1) +
            "] X: position is [" + round(gameObject.x, 2) +
            "] and velocity is [" + round(gameObject.vel.x, 2) + "]");
    }
}

















