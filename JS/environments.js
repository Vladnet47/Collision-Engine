// ############################################ ENVIRONMENT ############################################ //

class Environment {
    constructor(canvas) {
        this._gameObjectsCurrent = [];
        this._gameObjectsNext = [];
        this._nObjects = 0;
        this._narrowColEngine;
        this._broadColEngine;
        this._globalEffects = {
            gravity: { on: false, strength: 1.0 }
        };

        this._collisionProps = {
            width: canvas.width,
            height: canvas.height,
        };
    }

    init() {
        this._globalEffects.gravity.on = false;
        this._collisionProps.onUniformGrid = false;

        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        player.collidable = true;
        player.physics = true;

        let gam = new GameObject(new Circle(new Vector(600, 300), 60), 'rgb(51, 204, 51)', new Vector(0, 0), 100);
        gam.collidable = true;
        gam.physics = true;

        this._gameObjectsNext.push(player);
        this._gameObjectsNext.push(gam);
        this._nObjects = 2;

        this._narrowColEngine = new NarrowCollisionEngine();
    }

    // Calculates the next position of each GameObject in the environment
    update(deltaTime) {
        this._gameObjectsCurrent = this._gameObjectsNext;
        this._gameObjectsNext = [];
        this.behave(deltaTime);
        this.collide(deltaTime);

        // dangerous line
        this._gameObjectsNext = this._gameObjectsCurrent;
    }

    // Updates positions of all GameObjects before collision
    behave(deltaTime) {
        for (let index = 0; index < this._nObjects; ++index) {
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
        }
    }

    collide(deltaTime) {
        if ( this._narrowColEngine == null ) 
            throw Error("No narrow collision engine specified");

        this._narrowColEngine.reset();

        for (let i = 0; i < this._nObjects; i++) {
            let current = this._gameObjectsCurrent[i];
            if (current.collidable == false || current.physics == false) continue;

            // check for collisions
            for (let j = i + 1; j < this._nObjects; j++) {
                let other = this._gameObjectsCurrent[j]
                if (other.collidable == false) continue;

                this._narrowColEngine.record(current, i, other, j) ? current.color = 'rgb(255, 71, 26)': current.color = 'rgb(0, 153, 255)';
            }

            // handle collisions
            let listChanges = this._narrowColEngine.getChanges();
            for (let k = 0; k < listChanges.length; k++) {
                current = this._gameObjectsCurrent[listChanges[k].index];
                let changes = listChanges[k].changes;

                this.updateVel(current, changes, deltaTime);
                this.updatePos(current, changes);
            }
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

















