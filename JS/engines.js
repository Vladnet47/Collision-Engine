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

    // empties collisions and indeces
    reset() {
        this._size = 0;

        this._colObjects = [];
    }

    // returns true if current and other intersect, and updates collisions and indeces.
    // by default, tests for circle-circle intersection
    check(i, current, j, other) {
        // find distance from gameObject and other, direction from gameObject to other
        let dist = new Vector(other.x - current.x, other.y - current.y);
        
        // find velocities of current and other, times delta time
        let velGam = multiplyVector(current.vel, deltaT);
        let velOth = multiplyVector(other.vel, deltaT);
        
        // find sum of radii
        let radSum = current.rad + other.rad;

        // if the objects are too far apart, do not check for colision
        if (dist.mag > radSum + velGam.mag + velOth.mag) {
            return false;
        }

        // calculate time of intersection, which represents a percentage of current velocity
        let t = this._calculateT(current.pos, other.pos, current.vel, other.vel, radSum);

        // if intersection occurs within the current velocities, record both objects
        if (t >= 0 && t <= 1) {
            if (current.mass == 1 || current.mass == 2 || current.mass == 3) {
                current.mass;
            }
            this._record(i, j, current, t);
            this._record(j, i, other, t);
            return true;
        }
        return false;
    }

    // if collision occurs, returns the time of collision, relative to the starting position (t is between 0 and 1)
    // otherwise, return -1;
    _calculateT(curPos, othPos, curVel, othVel, radSum) {
        let velDiffX = curVel.x * deltaT - othVel.x * deltaT;
        let velDiffY = curVel.y * deltaT - othVel.y * deltaT;
        let posDiffX = othPos.x - curPos.x;
        let posDiffY = othPos.y - curPos.y;

        let a = Math.pow(velDiffX, 2) + Math.pow(velDiffY, 2);
        let b = -2 * (posDiffX * velDiffX + posDiffY * velDiffY);
        let c = Math.pow(posDiffX, 2) + Math.pow(posDiffY, 2) - Math.pow(radSum, 2);
        let discriminant = Math.pow(b, 2) - 4 * a * c;

        if (discriminant >= 0) {
            let sqrtDisc = Math.sqrt(discriminant);

            let t1 = (-b + sqrtDisc) / (2 * a);
            let t2 = (-b - sqrtDisc) / (2 * a);

            return (t1 > t2) ? round(t2, 4) : round(t1, 4);
        }
        return -1;
    }

    _record(indexCur, indexOth, current, t) { // ------------------------------------------------ trace this
        this._recordHelper(indexCur, indexOth, current, t, 0, this._size - 1);
    }

    _recordHelper(indexCur, indexOth, current, t, low, high) {
        let mid = Math.floor((high + low + 1) / 2);

        if (mid > high) { // if belongs at the very end
            let currentObj = new CollisionObject(current, indexCur);
            currentObj.addCol(t, indexOth);

            this._colObjects.splice(mid, 0, currentObj);
            this._size++;
        } else { // if belongs somewhere in the middle
            let checkObj = this._colObjects[mid];
            let checkIndex = checkObj.index;

            if (indexCur == checkIndex) { 
                checkObj.addCol(t, indexOth);
            } else if (indexCur < checkIndex) {
                this._recordHelper(indexCur, indexOth, current, t, low, mid - 1);
            } else {
                this._recordHelper(indexCur, indexOth, current, t, mid + 1, high);
            }
        }
    }

    // returns a list of changes for all objects that underwent collisions
    getChanges() {
        // get the changes for each object in collision
        for (let i = 0; i < this._size; i++) {
            this._updatePosition(i);
        }

        let initialKE = this._calculateKE();
        for (let i = 0; i < this._size; i++) {
            this._updateVelocity(i);
        }
        let finalKE = this._calculateKE();

        if (Math.round(initialKE) != Math.round(finalKE)) {
            console.log("Kinetic Energy not conserved");
        }

        return this._colObjects;
    }

    _updatePosition(curI) {
        let currentObj = this._colObjects[ curI ];

        // if current is updated or if there are no more collisions for current, do not calculate anything
        if (currentObj.updated || currentObj.tValues.length == 0) {
            return;
        }

        // get the shortest collision for current, and smallest t value
        let curShortestCol = this._getShortestCol(curI);
        let othI = this._getIndex(curShortestCol.col);
        let curT = curShortestCol.t;

        // get the smallest t value for other
        let othShortestCol = this._getShortestCol(othI)
        let othT = othShortestCol.t;

        let otherObj = this._colObjects[ othI ];
        let current = currentObj.object;
        let other = otherObj.object;

        // if other has a shorter collision, update other first
        if (othT < curT) {
            this._updatePosition(othI);
        }

        // if other is updated
        if (otherObj.updated) {
            // calculate collision assuming other's updated position and zero velocity
            let othUpdatedPos = other.pos.add( otherObj.change.pos );
            let newT = this._calculateT(current.pos, othUpdatedPos, current.vel, new Vector(0, 0), current.rad + other.rad);
            
            // if current still collides with other, update current
            if (newT >= 0 && newT <= 1) {
                let curPosChange = multiplyVector(current.vel, deltaT * newT);

                // update the position of current
                currentObj.addPos( curPosChange );

                // POSITION DEBUGGER --------------------------------------------------------------------------------------
                // currentObj.addVel( multiplyVector(current.vel, -1) );
                currentObj.markActive(this._colObjects[othI].index);
                otherObj.markActive(this._colObjects[curI].index);

                currentObj.markUpdated();
            } 

            // if current no longer collides with other, recalculate current with the next shortest collision
            else {
                // remove current's shortest collision
                this._removeCol(curI, curShortestCol.col);

                // update current with the next shortest collision
                this._updatePosition(curI)
            }
        }

        // if this is the shortest collision for both current and other, then update both
        else if (othT == curT) {
            // update the positions of current and other
            let curPosChange = multiplyVector(current.vel, deltaT * curT);
            let othPosChange = multiplyVector(other.vel, deltaT * othT);
            currentObj.addPos( curPosChange );
            otherObj.addPos( othPosChange );

            // TEMPORARY DEBUGGER --------------------------------------------------------------------------------------
            // currentObj.addVel( multiplyVector(current.vel, -1) );
            // otherObj.addVel( multiplyVector(other.vel, -1) );
            
            currentObj.markActive(this._colObjects[othI].index);
            otherObj.markActive(this._colObjects[curI].index);

            // mark both current and other as updated
            currentObj.markUpdated();
            otherObj.markUpdated();

            
        } 
    }

    // returns the environment index of the shortest collision of the collision object at the given index
    _getShortestCol(index) {
        let tValues = this._colObjects[index].tValues;
        let colsI = this._colObjects[index].indeces;

        let othI = 0;
        let smallestT = tValues[0];

        for (let i = 1; i < tValues.length; i++) {
            if (tValues[i] < smallestT) {
                smallestT = tValues[i];
                othI = i;
            }
        }

        return { t: smallestT, col: colsI[othI] };
    }

    // removes the collision with environmental index of other from the colObject at index
    _removeCol(index, othI) {
        let currentObj = this._colObjects[index];
        let indeces = currentObj.indeces;
        for (let i = 0; i < indeces.length; i++) {
            if (indeces[i] == othI) {
                currentObj.removeCol(i);
            }
        }
    }

    _getIndex(i) {
        return this._getIndexHelper(i, 0, this._size - 1);
    }

    // returns index of this._iGameObjects
    _getIndexHelper(i, low, high) { // -------------------------------------------------------------------------------------
        let mid = Math.floor((high + low + 1) / 2);
        let checkObj = this._colObjects[mid];
        let checkIndex = checkObj.index;

        if (i == checkIndex) {
            return mid;
        } else if (i < checkIndex) {
            return this._getIndexHelper(i, low, mid - 1);
        } else {
            return this._getIndexHelper(i, mid + 1, high);
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


    _updateVelocity(curI) {
        let currentObj = this._colObjects[curI];
        let current = currentObj.object;
        let curUpdatedPos = current.pos.add(currentObj.change.pos);

        // if object did not move, do not calculate anything 
        if (current.vel == 0) {
            return;
        }

        let propogated = [currentObj.index];
        let colsI = currentObj.cols;

        for (let j = 0; j < colsI.length; j++) {
            let colI = colsI[j];
            let otherObj = this._colObjects[ this._getIndex(colI) ];
            let other = otherObj.object;
            let othUpdatedPos = other.pos.add(otherObj.change.pos);

            let impulse = this._calculateImpulse(curUpdatedPos, othUpdatedPos, current.vel, other.vel, current.mass, other.mass);
            this._propogateHelper(otherObj, impulse.other, propogated);
            // propogated.push(otherObj.index);
            // this._propogateHelper(currentObj, impulse.current, propogated);
        }
    }

    // takes a velocity vector and a list of already propogated indeces
    // propogated the velocity vector to all unpropogated active collisions
    _propogateHelper(currentObj, velVector, propogated) {
        currentObj.addVel(velVector);
        propogated.push(currentObj.index);
        let current = currentObj.object;

        let colsI = this._getUnpropogated(currentObj, propogated);

        for (let i = 0; i < colsI.length; i++) {
            let colI = colsI[i];

            let otherObj = this._colObjects[ this._getIndex(colI) ];
            let other = otherObj.object;

            let radiusVector = new Vector (other.x - current.x, other.y - current.y);
            let projVector = projectVector(velVector, radiusVector);
            let propogatedCopy = this._makePropCopy(propogated, colsI, colI);

            this._propogateHelper(otherObj, projVector, propogatedCopy);
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




    // DEBUGGING
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