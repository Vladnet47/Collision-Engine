class NarrowCollisionEngine {
    constructor() {
        this._size;
        this._colObjects;

        // bounding rectangle
        this._bound = { on: false, top: 0, right: 0, bottom: 0, left: 0, index: -100 };
    }

    toggleBound(tlPos, width, height) {
        if (!this._bound.on) {
            this._bound.on = true;
            this._bound.top = tlPos.y;
            this._bound.right = tlPos.x + width;
            this._bound.bottom = tlPos.y + height;
            this._bound.left = tlPos.x;
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
        // find change in position for current frame (velocity * delta time)
        let curVel = multiplyVector(current.vel, deltaT);
        let othVel = multiplyVector(other.vel, deltaT);

        if (this._bound.on) {
            this._checkBound(i, current, j, other, curVel, othVel);
        }

        // if one of the objects is not collidable, then return
        if (current.collidable == false || other.collidable == false) {
            return false;
        }
        
        let dist = distance(other.pos, current.pos);
        let radSum = current.rad + other.rad;

        // if the objects are close enough to collide
        if (dist < radSum + curVel.mag + othVel.mag) {
            // calculate time of intersection, which represents a percentage of current velocity
            let t = this._calculateT(current.pos, other.pos, curVel, othVel, radSum);

            // if intersection occurs within the current velocities, record both objects
            if (t >= 0 && t <= 1) {
                let curI = this._record(i, current);
                let othI = this._record(j, other);
                this._colObjects[curI].addPotentialCol(t, othI);
                this._colObjects[othI].addPotentialCol(t, curI);
                return true;
            }
        }
        return false;
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

    // if bounding rect is on, check if current or other hit the sides
    _checkBound(i, current, j, other, curVel, othVel) {
        if (curVel.mag > 0) {
            let curSides = this._getSides(current.pos, curVel, current.rad);
            if (curSides.length > 0) {
                let boundT = this._calculateBoundT(current.pos, curVel, current.rad, curSides);
                let curI = this._record(i, current);
                this._colObjects[curI].addPotentialCol(boundT.t, this._bound.index);
                this._colObjects[curI].addBoundCols(boundT.sides);
            }
        }
        
        if (othVel.mag > 0) {
            let othSides = this._getSides(other.pos, othVel, other.rad);
            if (othSides.length > 0) {
                let boundT = this._calculateBoundT(other.pos, othVel, other.rad, othSides);
                let othI = this._record(j, other);
                this._colObjects[othI].addPotentialCol(boundT.t, this._bound.index);
                this._colObjects[othI].addBoundCols(boundT.sides);
            }
        }
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

        if (discriminant >= 0) {
            let sqrtDisc = Math.sqrt(discriminant);
            let denom = 2 * a;

            let t1 = round( (sqrtDisc - b) / denom, 4 );
            let t2 = round( (-sqrtDisc - b) / denom, 4 );

            return (t1 > t2) ? t2 : t1;
        } else {
            return -1;
        }
    }

    // returns the t value and sides for final collision in the form { t, side(s) }
    // if this is called, then there MUST be a collision with one of the sides
    _calculateBoundT(curPos, curVel, rad, sides) {
        let t = 1;
        let finalSides = [];

        for (let i = 0; i < sides.length; i++) {
            let curSide = sides[i];
            let tempT;

            // calculate t for curSide
            if (curSide === "left") {
                tempT = (this._bound.left - curPos.x + rad) / curVel.x;
            } else if (curSide === "right") {
                tempT = (this._bound.right - curPos.x - rad) / curVel.x;
            } else if (curSide === "top") {
                tempT = (this._bound.top - curPos.y + rad) / curVel.y;
            } else {
                tempT = (this._bound.bottom - curPos.y - rad) / curVel.y;
            }

            if (tempT < t) { // if t smaller, replace sides
                t = tempT;
                finalSides = [curSide];
            } else { // if t is equal, add side
                finalSides.push(curSide);
            }
        }

        return { t: t, sides: finalSides };
    }

    _getSides(curPos, curVel, curRad) {
        let finalPos = curPos.add( multiplyVector(curVel, deltaT) );
        let result = [];

        // if left or right
        if (finalPos.x - curRad <= this._bound.left) {
            result.push("left");
        } else if (finalPos.x + curRad >= this._bound.right) {
            result.push("right");
        }

        // if top or bottom
        if (finalPos.y - curRad <= this._bound.top) {
            result.push("top");
        } else if (finalPos.y + curRad >= this._bound.bottom) {
            result.push("bottom");
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

    _updatePosition(curI) {
        let currentObj = this._colObjects[curI];
        let current = currentObj.object;

        // if current is updated or if there are no more collisions, do not calculate anything
        if (!currentObj.noActiveCols || currentObj.noPotentialCols || current.vel == 0) {
            return;
        }

        // get necessary components for current
        let curEarliestCol = currentObj.getEarliestCol();
        let othI = curEarliestCol.col;
        let curT = curEarliestCol.t;
        let curPosChange = multiplyVector(current.vel, deltaT * curT);

        if (othI == this._bound.index) {
            currentObj.addPos( curPosChange );
            currentObj.addCol(othI);
            return;
        }

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
        if (!otherObj.noActiveCols) {
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

                    currentObj.addCol(othI);
                    otherObj.addCol(curI);
                } else { // if current no longer collides with other, recalculate using next shortest collision
                    currentObj.removePotentialCol();
                    this._updatePosition(curI)
                }
            }
        } else if (othT == curT) { // if earliest collision for both current and other
            // update the positions of current and other
            let othPosChange = multiplyVector(other.vel, deltaT * othT);
            currentObj.addPos( curPosChange );
            otherObj.addPos( othPosChange );

            currentObj.addCol(othI);
            otherObj.addCol(curI);
        } 
    }

    _updateVelocity(curI) {
        let currentObj = this._colObjects[curI];
        let current = currentObj.object;

        // if object did not move, do not calculate anything 
        if (current.vel == 0) {
            return;
        }

        // get current's updated position
        let curUpdatedPos = current.pos.add(currentObj.change.pos);

        // add current index to propogated, so that it does not propogate the impulse back to itself
        let propogated = [curI];
        let activeCols = currentObj.activeCols;

        for (let j = 0; j < activeCols.length; j++) {
            // get the other object involved in the collision
            let indexCol = activeCols[j];
            let impulse;

            if (indexCol == this._bound.index) {
                let sides = currentObj.boundCols;
                impulse = this._calculateBoundImpulse(sides, current.vel);
                currentObj.addVel(impulse);
            } else {
                let otherObj = this._colObjects[indexCol];
                let other = otherObj.object;

                // get other's updated position
                let othUpdatedPos = other.pos.add(otherObj.change.pos);

                // calculate the impulse from current to other
                impulse = this._calculateImpulse(othUpdatedPos, curUpdatedPos, other.vel, current.vel, other.mass, current.mass);

                // add other to list of propogated, so that it does not propogate impulse back to itself
                propogated.push(indexCol);

                // propogate impulse to all of other's collisions
                this._propogate(otherObj, impulse, propogated);
            }
        }
    }

    // calcultes impulse between two objects
    // returns the impulse from other to current (a change in velocity vector)
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
        // let othFinal = multiplyVector(curFinal, -1);
        // othFinal.addTo(projCur);
        // othFinal = multiplyVector(othFinal, curMass / othMass);
        // othFinal.addTo(projOth);

        // calculate the change in velocity vector
        // first, make velocity along radius equal to 0 for both objects
        let negProjCur = multiplyVector(projCur, -1);
        // let negProjOth = multiplyVector(projOth, -1);

        // second, add the final velocity along radius
        let curChange = negProjCur.add(curFinal);
        // let othChange = negProjOth.add(othFinal);

        return curChange;
    }

    _calculateBoundImpulse(sides, curVel) {
        let curChange = new Vector(0,0);
        for (let i = 0; i < sides.length; i++) {
            let curSide = sides[i];
            if (curSide === "top" || curSide === "bottom") {
                curChange.addTo( new Vector(0, curVel.y * -2) );
            } else {
                curChange.addTo( new Vector(curVel.x * -2, 0) );
            }
        }
        return curChange;
    }

    // takes a velocity vector and a list of already propogated indeces
    // propogated the velocity vector to all unpropogated active collisions
    _propogate(currentObj, velVector, propogated) {
        // update the current object
        currentObj.addVel(velVector);
        let current = currentObj.object;

        // get array of all unpropogated collisions
        let unpropCols = this._getUnpropogated(currentObj, propogated);
        let numUnpropCols = unpropCols.length;

        // append unpropCols to propogated
        for (let i = 0; i < numUnpropCols; i++) {
            propogated.push(unpropCols[i]);
        }

        // propogate the velocity vector to all unpropogated active collisions
        for (let i = 0; i < numUnpropCols; i++) {
            let indexCol = unpropCols[i];

            let otherObj = this._colObjects[indexCol];
            let other = otherObj.object; // where bug happens ===============================================

            let radiusVector = new Vector(other.x - current.x, other.y - current.y);
            let projVector = projectVector(velVector, radiusVector);

            this._propogate(otherObj, projVector, propogated);
        }

        // remove unpropCols from propogated
        for (let i = 0; i < numUnpropCols; i++) {
            propogated.pop();
        }
    }

    // returns a list of active collisions that have not been already propogated
    _getUnpropogated(currentObj, propogated) {
        let activeCols = currentObj.activeCols;
        let unpropCols = [];
        let found = false;
        
        for (let i = 0; i < activeCols.length; i++) {
            let indexCol = activeCols[i];
            for (let j = 0; j < propogated.length; j++) {
                // if indeces are the same, then curI has already been propogated
                if (indexCol == propogated[j]) {
                    found = true;
                    break;
                } 
            }

            // if active collision was not already propogated, put it in the list
            if (!found) {
                unpropCols.push(indexCol);
            }
            found = false;
        }

        return unpropCols;
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