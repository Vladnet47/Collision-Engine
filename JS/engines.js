
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
    }

    potentialCollision(gameObject, other, deltaTime) {
        this._pos = this.getPosVectors(gameObject);
        this._segGam = this.getVelSegments(gameObject, deltaTime);
        this._segOth = this.getRecSegments(other);

        for (let index1 = 0; index1 < 4; ++index1) {
            let segGamCurrent = this._segGam[index1];

            for (let index2 = 0; index2 < 4; ++index2) {
                let segOthCurrent = this._segOth[index2];
                if ( segOverlapX( segGamCurrent, segOthCurrent ) && segOverlapY( segGamCurrent, segOthCurrent ) ) {
                    return true;
                }
            }
        }
        return false;
    }

    update(gameObject, other) {
        let changes = new ChangesPosVel(),
        type = this.segmentType();

        if (type == "top") {
            gameObject.setCollision("ground", true);
            let offset = other.rec.segTop.pos1.y - gameObject.rec.bLeft.y;
            let curVel = gameObject.vel.y;

            changes.addPosIns(vectorToXY(offset, -90));
            if(curVel > 0) {
                changes.addVelIns(vectorToXY(-curVel, -90));
            }
        } else if (type == "right") {
            let offset = other.rec.segRight.pos1.x - gameObject.rec.tLeft.x;
            let curVel = gameObject.vel.x;

            changes.addPosIns(vectorToXY(offset, 0));
            if(curVel < 0) {
                changes.addVelIns(vectorToXY(-curVel, 0));
            }
        } else if (type == "bottom") {
            let offset = other.rec.segBot.pos1.y - gameObject.rec.tLeft.y;
            let curVel = gameObject.vel.y;

            changes.addPosIns(vectorToXY(offset, -90));
            if(curVel < 0) {
                changes.addVelIns(vectorToXY(-curVel, -90));
            }
        } else if (type == "left") {
            let offset = other.rec.segLeft.pos1.x - gameObject.rec.tRight.x;
            let curVel = gameObject.vel.x;

            changes.addPosIns(vectorToXY(offset, 0));
            if(curVel > 0) {
                changes.addVelIns(vectorToXY(-curVel, 0));
            }
        }

        return changes;
    }

    // Returns the type of segment the gameObject collided with
    segmentType() {
        let type = ["top", "right", "bottom", "left"];
        let maxMagnitude = 0;
        let colType = "none";

        for (let index1 = 0; index1 < 4; ++index1) {
            let segGamCurrent = this._segGam[index1];

            for (let index2 = 0; index2 < 4; ++index2) {
                let segOthCurrent = this._segOth[index2];
                let intersection = segSegIntersect(segGamCurrent, segOthCurrent);

                if(intersection) {
                    let posCurrent = this._pos[index1];
                    let vec = new Vector( intersection.x - posCurrent.x, intersection.y - posCurrent.y );
                    let curMag = vec.magnitude;

                    if( curMag > maxMagnitude ) {
                        colType = type[index2];
                        maxMagnitude = curMag;
                    }
                }
            }
        }
        
        return colType;
    }
    
    // Returns an array of the four vertices of the gameObject rectangle [top left, top right, bottom left, bottom right]
    getPosVectors(gameObject) {
        return [ gameObject.pos, gameObject.rec.tRight, gameObject.rec.bRight, gameObject.rec.bLeft ];
    }

    // Returns an array of the change-in-position segments from each point [top left, top right, bottom left, bottom right]
    getVelSegments(gameObject, deltaTime) {
        let vel = vectorMult(gameObject.vel, -deltaTime); // change in position between this frame and last one
        return [ this.consVelSegment(this._pos[0], vel), this.consVelSegment(this._pos[1], vel), 
                 this.consVelSegment(this._pos[2], vel), this.consVelSegment(this._pos[3], vel) ]
    }

    // Constructs line segment from the position vector and along the velocity vector
    consVelSegment(pos, vel) {
        return new Segment( pos, new Vector(pos.x + vel.x, pos.y + vel.y) );
    }

    // Returns an array of the four segments making up the other rectangle [top, right, bottom, left]
    getRecSegments(other) {
        return [ other.rec.segTop, other.rec.segRight, other.rec.segBot, other.rec.segLeft ];
    }
}