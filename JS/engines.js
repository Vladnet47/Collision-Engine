class NarrowCollisionEngine {
    constructor() {
        this._size;
        this._colObjects;

        // bounding rectangle
        this._bound = { on: false, width: 0, height: 0 };
    }

    toggleBound(width, height) {
        if (!this._bound.on) {
            this._bound.width = width;
            this._bound.height = height;
        } else {
            this._bound.on = false;
        }
    }

    // resets the collision object array
    reset() {
        this._size = 0;
        this._colObjects = [];
    }

    // records collision if it occurs
    // returns true if collision occurs, false if it doesn't
    check(i, current, j, other) {
        let dist = distance(other.pos, current.pos);
        let radSum = current.rad + other.rad;

        // find change in position for current frame (velocity * delta time)
        let curVel = multiplyVector(current.vel, deltaT);
        let othVel = multiplyVector(other.vel, deltaT);

        // if the objects are close enough to collide
        if (dist < radSum + curVel.mag + othVel.mag) {
            // calculate time of intersection, which represents a percentage of current velocity
            let t = this._calculateT(current.pos, other.pos, curVel, othVel, radSum);

            // if intersection occurs within the current velocities, record both objects
            if (t >= 0 && t <= 1) {
                let curI = this._record(i, current);
                let othI = this._record(j, other);
                this._colObjects[curI].addCol(t, othI);
                this._colObjects[othI].addCol(t, curI);
                return true;
            }
        }
        return false;
    }

    // if collision occurs, returns the time of collision, relative to the starting position (t is between 0 and 1)
    // otherwise, return -1;
    _calculateT(curPos, othPos, curVel, othVel, radSum) {
        let velDiff = new Vector(curVel.x - othVel.x, curVel.y - othVel.y);
        let posDiff = new Vector(othPos.x - curPos.x, othPos.y - curPos.y);

        // quadratic formula to find intersection of two circles with velocities
        let a = Math.pow(velDiff.x, 2) + Math.pow(velDiff.y, 2);
        let b = -2 * vectorDot(posDiff, velDiff);
        let c = Math.pow(posDiff.x, 2) + Math.pow(posDiff.y, 2) - Math.pow(radSum, 2);
        let discriminant = Math.pow(b, 2) - 4 * a * c;

        let result = -1;
        if (discriminant >= 0) {
            let sqrtDisc = Math.sqrt(discriminant);
            let denom = 2 * a;

            let t1 = round( (sqrtDisc - b) / denom, 4 );
            let t2 = round( (-sqrtDisc - b) / denom, 4 );

            (t1 > t2) ? result = t2 : result = t1;
        }
        return result;
    }

    // takes environment index and gameObject
    // returns index of created collision object in this._colObjects, ordered by environment index
    _record(indexCur, current) {
        return this._recordHelper(indexCur, current, 0, this._size - 1);
    }

    _recordHelper(indexCur, current, low, high) {
        let mid = Math.floor((high + low + 1) / 2);

        if (mid > high) {
            let newObj = new CollisionObject(current, indexCur);
            this._colObjects.splice(mid, 0, newObj);
            this._size++;

            return mid;
        } else {
            let checkIndex = this._colObjects[mid].index;

            if (indexCur == checkIndex) { 
                return mid;
            } else if (indexCur < checkIndex) {
                return this._recordHelper(indexCur, current, low, mid - 1);
            } else {
                return this._recordHelper(indexCur, current, mid + 1, high);
            }
        }
    }

    // returns a list of changes for all objects that underwent collisions
    getChanges() {
        // get the position changes for each object in collision
        for (let i = 0; i < this._size; i++) {
            this._updatePosition(i);
        }

        // get the velocity changes for each object in collision
        let initialKE = this._calculateKE();
        for (let i = 0; i < this._size; i++) {
            this._updateVelocity(i);
        }
        let finalKE = this._calculateKE();

        // for debugging purposes - if kinetic energy not conserved, impulse was not properly distributed
        if (Math.round(initialKE) != Math.round(finalKE)) {
            console.log("Kinetic Energy not conserved");
        }

        return this._colObjects;
    }

    _updatePosition(curI) {
        let currentObj = this._colObjects[curI];
        let current = currentObj.object;

        // if current is updated or if there are no more collisions, do not calculate anything
        if (currentObj.updated || currentObj.empty || current.vel == 0) {
            return;
        }

        // get necessary components for current
        let curEarliestCol = currentObj.getEarliestCol();
        let othI = curEarliestCol.col;
        let curT = curEarliestCol.t;
        let curPosChange = multiplyVector(current.vel, deltaT * curT);

        // get necessary components for other
        let otherObj = this._colObjects[othI];
        let other = otherObj.object;
        let othEarliestCol = otherObj.getEarliestCol();
        let othT = othEarliestCol.t;

        // if other has earlier collision, update other
        if (othT < curT) {
            this._updatePosition(othI);
        }

        // if other is updated, it may change the collision between current and other
        if (otherObj.updated) {
            // calculate collision assuming other's updated position and zero velocity
            let othUpdatedPos = other.pos.add( otherObj.change.pos );
            let radSum = current.rad + other.rad;

            // if new position of current should not be changed, add position
            // otherwise, recalculate using updated other position and zero velocity
            if (radSum == distance(othUpdatedPos, current.pos.add(curPosChange))) {
                console.log("_updatePosition() didn't recalculate t");
                current.addPos(curPosChange);
            } else {
                // calculate new t of collision
                let newT = this._calculateT(current.pos, othUpdatedPos, multiplyVector(current.vel, deltaT), new Vector(0, 0), radSum);
            
                if (newT >= 0 && newT <= 1) {
                    // update the position of current
                    currentObj.addPos( multiplyVector(curPosChange, newT / curT) );

                    currentObj.markActive(othI);
                    otherObj.markActive(curI);
                } else { // if current no longer collides with other, recalculate using next shortest collision
                    currentObj.removeCol();
                    this._updatePosition(curI)
                }
            }
        } else if (othT == curT) { // if earliest collision for both current and other
            // update the positions of current and other
            let othPosChange = multiplyVector(other.vel, deltaT * othT);
            currentObj.addPos( curPosChange );
            otherObj.addPos( othPosChange );

            currentObj.markActive(othI);
            otherObj.markActive(curI);
        } 
    }

    _updateVelocity(curI) {
        let currentObj = this._colObjects[curI];
        let current = currentObj.object;
        let curUpdatedPos = current.pos.add(currentObj.change.pos);

        // if object did not move, do not calculate anything 
        if (current.vel == 0) {
            return;
        }

        let propogated = [curI];
        let colsI = currentObj.cols;

        for (let j = 0; j < colsI.length; j++) {
            let colI = colsI[j];
            let otherObj = this._colObjects[ colI ];
            let other = otherObj.object;
            let othUpdatedPos = other.pos.add(otherObj.change.pos);

            let impulse = this._calculateImpulse(curUpdatedPos, othUpdatedPos, current.vel, other.vel, current.mass, other.mass);
            this._propogate(colI, otherObj, impulse.other, propogated);
            // propogated.push(otherObj.index);
            // this._propogateHelper(currentObj, impulse.current, propogated);
        }
    }

    // calcultes impulse between two objects
    // returns an object in the form: { current: update, other: update }
    _calculateImpulse(curPos, othPos, curVel, othVel, curMass, othMass) {
        // find radius vector, from other to current
        let dist = new Vector(curPos.x - othPos.x, curPos.y - othPos.y);

        // find masses
        let massSum = curMass + othMass;

        // find projection of velocities onto radius vector
        let projCur = projectVector(curVel, dist);
        let projOth = projectVector(othVel, dist);

        // find the respective components from equation
        // v1 * (m1 - m2) / (m1 + m2)    +    v2 * (2 * m1) / (m1 + m2)    =    final v1
        let curComponent = multiplyVector(projCur, (curMass - othMass) / massSum );
        let othComponent = multiplyVector(projOth, (2 * othMass) / massSum );

        // calculte the final velocity of current
        let curFinal = curComponent.add(othComponent);

        // calculte the final velocity of other
        let othFinal = multiplyVector(curFinal, -1);
        othFinal.addTo(projCur);
        othFinal = multiplyVector(othFinal, curMass / othMass);
        othFinal.addTo(projOth);

        // calculate the change in velocity vector
        // first, make velocity along radius equal to 0 for both objects
        let negProjCur = multiplyVector(projCur, -1);
        let negProjOth = multiplyVector(projOth, -1);

        // second, add the final velocity along radius
        let curChange = negProjCur.add(curFinal);
        let othChange = negProjOth.add(othFinal);

        return { current: curChange , other: othChange };
    }

    // takes a velocity vector and a list of already propogated indeces
    // propogated the velocity vector to all unpropogated active collisions
    _propogate(curI, currentObj, velVector, propogated) {
        currentObj.addVel(velVector);
        propogated.push(curI);
        let current = currentObj.object;

        let colsI = this._getUnpropogated(currentObj, propogated);

        for (let i = 0; i < colsI.length; i++) {
            let colI = colsI[i];

            let otherObj = this._colObjects[colI];
            let other = otherObj.object;

            let radiusVector = new Vector (other.x - current.x, other.y - current.y);
            let projVector = projectVector(velVector, radiusVector);
            let propogatedCopy = this._makePropCopy(propogated, colsI, colI);

            this._propogate(colI, otherObj, projVector, propogatedCopy);
        }
    }

    // returns a list of active collisions that have not been already propogated
    _getUnpropogated(currentObj, propogated) {
        let cols = currentObj.cols;
        let unpropCols = [];
        
        for (let i = 0; i < cols.length; i++) {
            let found = false;
            let colI = cols[i];
            for (let j = 0; j < propogated.length; j++) {
                // if indeces are the same, then curI has already been propogated
                if (colI == propogated[j]) {
                    found = true;
                    break;
                } 
            }

            // if active collision was not already propogated, put it in the list
            if (!found) {
                unpropCols.push(colI);
            }
        }

        return unpropCols;
    }

    // makes a new array that includes all of the indeces in propogated and cols, excluding col from cols
    _makePropCopy(propogated, colsI, colI) {
        let copy = [];
        for (let i = 0; i < propogated.length; i++) {
            copy.push(propogated[i]);
        }

        for (let i = 0; i < colsI.length; i++) {
            if (colsI[i] != colI) {
                copy.push(colsI[i]);
            }
        }

        return copy;
    }

    // TESTING
    _calculateKE() {
        let sum = 0;
        for (let i = 0; i < this._size; i++) {
            let initialVel = this._colObjects[i].object.vel;
            let velChange = this._colObjects[i].change.vel;
            let vel = initialVel.add(velChange);
            let mass = this._colObjects[i].object.mass;
            sum += 0.5 * mass * vel.mag * vel.mag;
        }
        return sum;
    }
}