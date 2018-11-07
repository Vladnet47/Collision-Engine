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

        let gam1 = new GameObject(new Circle(new Vector(600, 300), 60), 'rgb(51, 204, 51)', new Vector(0, 0), 100);
        gam1.collidable = true;
        gam1.physics = true;

        // let gam2 = new GameObject(new Circle(new Vector(20, 20), 10), 'rgb(51, 204, 51)', new Vector(0, 20), 100);
        // gam2.collidable = true;
        // gam2.physics = true;

        this._gameObjectsNext.push(player);
        this._gameObjectsNext.push(gam1);
        // this._gameObjectsNext.push(gam2);
        this._nObjects = this._gameObjectsNext.length;

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
                // changes.velDel.addTo(new Vector(0, 10));
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

                if (current instanceof Player) {
                    this.testCol(current, other, deltaTime)
                }
                

                //this._narrowColEngine.record(current, i, other, j) ? current.color = 'rgb(255, 71, 26)' : current.color = 'rgb(0, 153, 255)';
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

    testCol(current, other, deltaTime) {
        // find distance from gameObject and other, respectively
        let distX = other.x - current.x;
        let distY = other.y - current.y;
        let dist = magnitude(distX, distY);

        // find gameObject velocity
        let velGamX = current.vel.x * deltaTime;
        let velGamY = current.vel.y * deltaTime;
        let velGam = current.vel.mag * deltaTime;

        // find other velocity
        let velOthX = other.vel.x * deltaTime;
        let velOthY = other.vel.y * deltaTime;
        let velOth = other.vel.mag * deltaTime;
        
        // find sum of radii
        let radSum = current.rad + other.rad;

        // BROAD PHASE
        // if the objects are too far apart, return
        if (dist > radSum + velGam + velOth) {
            return;
        }

        let velDiffX = -(velOthX - velGamX);
        let velDiffY = -(velOthY - velGamY);
        let posDiffX = other.x - current.x;
        let posDiffY = other.y - current.y;

        let a = Math.pow(velDiffX, 2) + Math.pow(velDiffY, 2);
        let b = -2 * (posDiffX * velDiffX + posDiffY * velDiffY);
        let c = Math.pow(posDiffX, 2) + Math.pow(posDiffY, 2) - Math.pow(radSum, 2);
        let discriminant = Math.pow(b, 2) - 4 * a * c;

        if (discriminant >= 0) {
            let t;
            let sqrtDisc = Math.sqrt(discriminant);

            let t1 = (-b + sqrtDisc) / (2 * a);
            let t2 = (-b - sqrtDisc) / (2 * a);

            (t1 > t2) ? t = t2 : t = t1;
            
            if (t >= 0 && t <= 1) {
                pause = true;
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

















