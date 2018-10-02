
class NarrowCollisionEngine {
    constructor() {}

    // Relatively inexpensive test for potential collision
    potentialCollision() {
        return false;
    }

    // Returns ChangesPosVel object with all necesary changes to position and velocity
    update() {
        let changes = new ChangesPosVel();
        return changes;
    }
}

// Establishes an imaginary line at y = maxHeight that prevents the player from going any lower
class LowerBound extends NarrowCollisionEngine {
    constructor(maxHeight) {
        super();
        this._maxHeight = maxHeight;
    }

    potentialCollision(gameObject) {
        return (gameObject.pos.y + gameObject.dim.y >= this._maxHeight);
    }

    update(gameObject) {
        let changes = new ChangesPosVel();
        changes.addPosIns(vectorToXY(gameObject.pos.y + gameObject.dim.y - this._maxHeight, 90));
        changes.addVelIns(vectorToXY(gameObject.vel.y, 90));
        return changes;
    }
}

// Checks intersection of gameObject rectangle with each segment of other object
class TierII extends NarrowCollisionEngine {
    constructor() {
        super();
    }

    potentialCollision(gameObject, other) {
        return ( recRecIntersect(gameObject.rec, other.rec) );
    }

    update(gameObject, other) {
        let changes = new ChangesPosVel(),
            type = this.segmentType(gameObject, other);

        if (type == "vertical") {
            let offset = this.offsetCalc( gameObject.pos.x, gameObject.dim.x, other.pos.x, other.rec.tRight.x );
            changes.addPosIns( vectorToXY(offset, 0) );
            changes.addVelIns( vectorToXY(-gameObject.vel.x, 0) );
        } else if (type == "horizontal") {
            let offset = this.offsetCalc( gameObject.pos.y, gameObject.dim.y, other.pos.y, other.rec.bRight.y );
            changes.addPosIns( vectorToXY(offset, -90) );
            changes.addVelIns( vectorToXY(-gameObject.vel.y, -90) );
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
}

// Checks intersection of velocity vectors of the gameObject with each segment of other
class TierIII extends NarrowCollisionEngine {
    constructor() {
        super();
        this._type = ["top", "right", "bottom", "left"];
        this._potentialColls = [];
        this._pos = [];
        this._segGam = [];
        this._segOth = [];
    }

    potentialCollision(gameObject, other, deltaTime) {
        this.init(gameObject, other, deltaTime);

        this._potentialColls = [];

        for (let iGam = 0; iGam < this._segGam.length; ++iGam) {
            let segGamCurrent = this._segGam[iGam];

            for (let iOth = 0; iOth < this._segOth.length; ++iOth) {
                let segOthCurrent = this._segOth[iOth];

                if ( segSegInRange( segGamCurrent, segOthCurrent ) ) {
                    this._potentialColls.push( { indexGam: iGam, indexOth: iOth } );
                }
            }
        }

        return this._potentialColls.length > 0;
    }

    update(gameObject, other) {
        let changes = new ChangesPosVel(),
            type = this.segmentType();

        let offset = 0, curVel = 0, angle = 0, offsetAid = 0;

        if( type != "none") {
            this.updateGameObject(gameObject, type);
            
            if (type == "top" || type == "bottom") {
                offset = this.offsetCalc( gameObject.pos.y, gameObject.dim.y, other.pos.y, other.rec.bRight.y );
                curVel = gameObject.vel.y;
                angle = -90;
            } if (type == "right" || type == "left") {
                offset = this.offsetCalc( gameObject.pos.x, gameObject.dim.x, other.pos.x, other.rec.tRight.x );;
                curVel = gameObject.vel.x;
            }

            // GameObject will be (offsetAid) pixels away from other object, to prevent clipping during next environment update
            offsetAid = getSign(offset) * 0.01;
        }

        changes.addPosIns(vectorToXY(offset + offsetAid, angle));
        changes.addVelIns(vectorToXY(-curVel, angle));

        return changes;
    }

    // Returns the type of segment the gameObject collided with
    segmentType() {
        let maxMagnitude = 0,
            result = "none";

        for (let index = 0; index < this._potentialColls.length; ++index) {
            let iGam = this._potentialColls[index].indexGam,
                iOth = this._potentialColls[index].indexOth;

            let intersection = segSegIntersect( this._segGam[iGam], this._segOth[iOth] );

            if(intersection) {
                let posCur = this._pos[iGam],
                    vec = new Vector( intersection.x - posCur.x, intersection.y - posCur.y ),
                    curMagnitude = vec.magnitude;

                if( curMagnitude > maxMagnitude ) {
                    result = this._type[iOth];
                    maxMagnitude = curMagnitude;
                }
            }
        }
        
        return result;
    }

    updateGameObject(gameObject, type) {
        if (type == "top") {
            gameObject.setCollision("ground", true);
        }
    }

    // Given coordinate and dimension of gameObject and left and right dimensions of other, calculates the offset required
    // to move the gameObject out of other1-other2 range
    offsetCalc(g, dimG, other1, other2) {
        let a = Math.min(other1, other2),
            b = Math.max(other1, other2);
        return (a < g && g <= b) ? b-g : a-g-dimG;
    }

    // Creates 
    init(gameObject, other, deltaTime) {
        let vel = vectorMult(gameObject.vel, -deltaTime);
        this._pos = [ gameObject.pos, gameObject.rec.tRight, gameObject.rec.bRight, gameObject.rec.bLeft ];
        this._segGam = [ this.consVelSegment(this._pos[0], vel), this.consVelSegment(this._pos[1], vel), 
                         this.consVelSegment(this._pos[2], vel), this.consVelSegment(this._pos[3], vel) ];
        this._segOth = [ other.rec.segTop, other.rec.segRight, other.rec.segBot, other.rec.segLeft ];
    }

    // Constructs line segment from the position vector and along the velocity vector
    consVelSegment(pos, vel) {
        return new Segment( pos, new Vector(pos.x + vel.x, pos.y + vel.y) );
    }
}

class TierIV extends NarrowCollisionEngine {
    constructor() {
        super();
        this._type = ["top", "right", "bottom", "left"];
        this._potentialColls = [];
        this._pos = [];
        this._segGam = [];
        this._segOth = [];
        this._tierIII = new TierIII();
    }

    potentialCollision(gameObject, other, deltaTime) {
        this.init(gameObject, other, deltaTime);

        this._potentialColls = [];

        for (let iGam = 0; iGam < this._segGam.length; ++iGam) {
            let segGamCurrent = this._segGam[iGam];

            for (let iOth = 0; iOth < this._segOth.length; ++iOth) {
                let segOthCurrent = this._segOth[iOth];

                if ( segSegInRange( segGamCurrent, segOthCurrent ) ) {
                    this._potentialColls.push( { indexGam: iGam, indexOth: iOth } );
                }
            }
        }

        return this._potentialColls.length > 0;
    }

    update(potentialCols, deltaTime) {
        let changes = [],
            numOfCols = potentialCols.length;

        changes.push( new ChangesPosVel() );

        for(let col = 1; col < numOfCols; ++col) {
            changes.push( new ChangesPosVel() );
            let gameObject = potentialCols[0],
                other = potentialCols[col];
        
            if ( other.physics ) {
                this.init(gameObject, other, deltaTime);
                let type = this.segmentType();  
                let offsetGam = 0, offsetOth = 0, curVelGam = 0, curVelOth = 0, angle = 0;

                if (type == "none") { continue; } // if there is not actually a collision, do not calculate the rest

                // this.updateGameObject(gameObject, type);

                if (type == "right" || type == "left") {
                    let offset = this.offsetCalc( gameObject.pos.x, gameObject.dim.x, other.pos.x, other.rec.tRight.x );
                    curVelGam = gameObject.vel.x;
                    curVelOth = other.vel.x;
                    let gamX = getSign(curVelGam);
                    let othX = getSign(curVelOth);

                    if( gamX == othX || gamX == 0 || othX == 0 ) { // same direction x (plus no velocity case)
                        if ( Math.abs(curVelGam) > Math.abs(curVelOth) ) {
                            let offsetAid = getSign(offset) * 0.01;
                            changes[col].addPosIns( vectorToXY(-offset - offsetAid, angle) );
                            changes[col].addVelIns( vectorToXY(curVelGam - curVelOth, angle) );
                        } else if ( Math.abs(curVelGam) < Math.abs(curVelOth) ) {
                            let offsetAid = getSign(offset) * 0.01;
                            changes[0].addPosIns( vectorToXY(offset + offsetAid, angle) );
                            changes[0].addVelIns( vectorToXY(curVelOth - curVelGam, angle) );
                        }
                        
                    } else if ( gamX != othX) { // opposite direction x
                        let posRatio = gameObject.vel.magnitude / vectorSum( gameObject.vel, vectorMult( other.vel, -1 ) ).magnitude;

                        offsetGam = offset * posRatio;
                        offsetOth = -offset * (1 - posRatio);
        
                        let offsetAid = getSign(offset) * 0.005;
                        changes[0].addPosIns( vectorToXY(offsetGam + offsetAid, angle) );
                        changes[0].addVelIns( vectorToXY(-curVelGam, angle) );
                        changes[col].addPosIns( vectorToXY(offsetOth - offsetAid, angle) );
                        changes[col].addVelIns( vectorToXY(-curVelOth, angle) );
                    }
                }    
            } else {
                //changes.add( this._tierIII.update( gameObject, other ) ); // if other doesn't have physics calculation, only calculate gameObject
            }
        }

        return changes;
    }

    init(gameObject, other, deltaTime) {
        let vel = vectorMult( vectorSum( gameObject.vel, vectorMult(other.vel, -1) ), -deltaTime);
        this._pos = [ gameObject.pos, gameObject.rec.tRight, gameObject.rec.bRight, gameObject.rec.bLeft ];
        this._segGam = [ this.consVelSegment(this._pos[0], vel), this.consVelSegment(this._pos[1], vel), 
                         this.consVelSegment(this._pos[2], vel), this.consVelSegment(this._pos[3], vel) ];
        this._segOth = [ other.rec.segTop, other.rec.segRight, other.rec.segBot, other.rec.segLeft ];
    }

    // Constructs line segment from the position vector and along the velocity vector
    consVelSegment(pos, vel) {
        return new Segment( pos, new Vector(pos.x + vel.x, pos.y + vel.y) );
    }

    // Returns the type of segment the gameObject collided with
    segmentType() {
        let maxMagnitude = 0,
            result = "none";

        for (let iGam = 0; iGam < this._segGam.length; ++iGam) {
            for (let iOth = 0; iOth < this._segGam.length; ++iOth) {
                
                let intersection = segSegIntersect( this._segGam[iGam], this._segOth[iOth] );

                if(intersection) {
                    let posCur = this._pos[iGam],
                        vec = new Vector( intersection.x - posCur.x, intersection.y - posCur.y ),
                        curMagnitude = vec.magnitude;

                    if( curMagnitude > maxMagnitude ) {
                        result = this._type[iOth];
                        maxMagnitude = curMagnitude;
                    }
                }
            }
        }
        return result;
    }

    // Given coordinate and dimension of gameObject and left and right dimensions of other, calculates the offset required
    // to move the gameObject out of other1-other2 range
    offsetCalc(g, dimG, other1, other2) {
        let a = Math.min(other1, other2),
            b = Math.max(other1, other2);
        return (a < g && g <= b) ? b-g : a-g-dimG;
    }

    
    
}