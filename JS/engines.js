class NarrowCollisionEngine {
    constructor() {
        this._size;

        // all indeces match up to eachother (like a matrix)
        this._gameObjects; // list of the gameObjects involved in collisions
        this._iGameObjects; // list of indeces where the gameObjects are stored in the environment (used to match them later)
        this._tValues; // list of times for shortest collisions (between 0 and 1, 1 being the full velocity of gameObject)
        this._iCollisions; // list of indeces of shortest collisions for each gameObject (index points to another gameObject)
        this._updated; // list of boolean values that indicate that gameObject is updated 

        this._changes; 

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

        this._gameObjects = [];
        this._iGameObjects = [];
        this._tValues = [];
        this._iCollisions = [];
        this._updated = []; 
        this._changes = [];
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
            this._record(i, j, current, t, 0, this._size - 1);
            this._record(j, i, other, t, 0, this._size - 1);
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

    _record(indexCur, indexOth, current, t, low, high) {
        let mid = Math.floor((high + low + 1) / 2);
        let checkIndex = this._iGameObjects[mid];

        // if indexCur exists in indeces, add collision information
        if (indexCur == checkIndex) {
            this._iCollisions[mid].push(indexOth);
            this._tValues[mid].push(t);
        }
        
        // if reached the end, create new entry
        else if (low == this._size) {
            this._gameObjects.push(current);
            this._iGameObjects.push(indexCur);
            this._iCollisions.push([indexOth]);
            this._tValues.push([t]);
            this._size++;
        }

        // if reached the beginning, but bigger value, add at beginning + 1
        else if (mid == low && indexCur > checkIndex) {
            this._gameObjects.splice(mid + 1, 0, current);
            this._iGameObjects.splice(mid + 1, 0, indexCur);
            this._iCollisions.splice(mid + 1, 0, [indexOth]);
            this._tValues.splice(mid + 1, 0, [t]);
            this._size++;
        }

        // if reached the end, but smaller value, add at end
        else if (mid == high && indexCur < checkIndex) {
            this._gameObjects.splice(mid, 0, current);
            this._iGameObjects.splice(mid, 0, indexCur);
            this._iCollisions.splice(mid, 0, [indexOth]);
            this._tValues.splice(mid, 0, [t]);
            this._size++;
        }

        // binary search
        else if (indexCur > checkIndex) {
            this._record(indexCur, indexOth, current, t, mid + 1, high);
        } else {
            this._record(indexCur, indexOth, current, t, low, mid - 1);
        }
    }

    // returns a list of changes for all objects that underwent collisions
    getChanges() {
        for (let i = 0; i < this._size; i++) {
            this._changes.push(new ChangesPosVel());
            this._updated.push(false);
        }

        // get the changes for each object in collision
        for (let curI = 0; curI < this._size; curI++) {
            this._updateChanges(curI);
        }

        return { indeces: this._iGameObjects, changes: this._changes, size: this._size };
    }

    _updateChanges(curI) {
        // if current is updated or if there are no more collisions for current, do not calculate anything
        if (this._updated[curI] || this._tValues[curI].length == 0) {
            return;
        }

        // get the shortest collision for current, and smallest t value
        let curShortestColI = this._getShortestCol(curI);
        let othI = this._getIndex( this._iCollisions[curI][curShortestColI], 0, this._size - 1 ); // index of shortest collision
        let curT = this._tValues[curI][curShortestColI];

        // get the smallest t value for other
        let othShortestColI = this._getShortestCol(othI)
        let othT = this._tValues[othI][othShortestColI];

        let current = this._gameObjects[curI];
        let other = this._gameObjects[othI];

        // if other has a shorter collision, update other first
        if (othT < curT) {
            console.log("|othT < curT| current = " + current.mass + " [" + curI + "] and other = " + other.mass + " [" + othI + "]");
            this._updateChanges(othI);
        }

        // if other is updated
        if (this._updated[othI]) {
            console.log("|other updated| current = " + current.mass + " [" + curI + "] and other = " + other.mass + " [" + othI + "]");
            // calculate collision assuming other's updated position and zero velocity
            let othUpdatedPos = other.pos.add( this._changes[othI].pos );
            let othUpdatedVel = other.vel.add( this._changes[othI].vel );
            let newT = this._calculateT(current.pos, othUpdatedPos, current.vel, othUpdatedVel, current.rad + other.rad);

            if (curI == 0) {
                curI = 0;
            }
            
            // if current still collides with other, update current
            if (newT >= 0 && newT <= 1) {
                // calculate impulse as if both objects are moving
                let curPosChange = multiplyVector(current.vel, deltaT * newT);

                // update the position of current
                this._changes[curI].addPos( curPosChange );

                // calculate the impulse between current and other
                let curUpdatedPos = current.pos.add(curPosChange);
                let impulse = this._calculateImpulse(curUpdatedPos, othUpdatedPos, current.vel, othUpdatedVel, current.mass, other.mass, newT);

                // update the velocities of current and other
                this._changes[curI].addVel( impulse.current );
                this._changes[othI].addVel( impulse.other );

                this._updated[curI] = true;
            } 

            // if current no longer collides with other, recalculate current with the next shortest collision
            else {
                // remove current's collision with other
                this._removeCol(curI, othT);

                // update current and the next shortest collision
                this._updateChanges(curI)
            }
        }

        

        // if this is the shortest collision for both current and other, then update both
        else if (othT == curT) {
            console.log("|othT == curT| current = " + current.mass + " [" + curI + "] and other = " + other.mass + " [" + othI + "]");
            // update the positions of current and other
            let curPosChange = multiplyVector(current.vel, deltaT * curT);
            let othPosChange = multiplyVector(other.vel, deltaT * curT);
            this._changes[curI].addPos( curPosChange );
            this._changes[othI].addPos( othPosChange );

            // calculate the impulse between current and other
            let curUpdatedPos = current.pos.add(curPosChange);
            let othUpdatedPos = other.pos.add(othPosChange);
            let curUpdatedVel = current.vel.add( this._changes[curI].vel );
            let othUpdatedVel = other.vel.add( this._changes[othI].vel );
            let impulse = this._calculateImpulse(curUpdatedPos, othUpdatedPos, curUpdatedVel, othUpdatedVel, current.mass, other.mass, curT);

            // update the velocities of current and other
            this._changes[curI].addVel( impulse.current );
            this._changes[othI].addVel( impulse.other );
            
            // mark both current and other as updated
            this._updated[curI] = true;
            this._updated[othI] = true;
        } 
    }

    // returns the index of the shortest collision index of this._tValues for current
    // returns -1 if no more collisions exist
    _getShortestCol(curI) {
        let tArr = this._tValues[curI];
        let colI = 0;
        let smallestT = tArr[0];
        for (let i = 1; i < tArr.length; i++) {
            if (tArr[i] < smallestT) {
                smallestT = tArr[i];
                colI = i;
            }
        }
        return colI;
    }

    // removes the collision at given index of nested array inside this._iCollisions
    _removeCol(curI, colI) {
        this._tValues[curI].splice(colI, 1);
        this._iCollisions[curI].splice(colI, 1);
    }

    // removes all collisions at curI but the one at colI
    _removeAllCol(curI, colI) {
        this._tValues[curI] = [this._tValues[curI][colI]];
        this._iCollisions[curI] = [this._iCollisions[curI][colI]];
    }

    // returns index of this._iGameObjects
    _getIndex(i, low, high) {
        let mid = Math.floor((high + low + 1) / 2);
        let current = this._iGameObjects[mid];

        if (i == current) {
            return mid;
        } else if (i < current) {
            return this._getIndex(i, low, mid - 1);
        } else {
            return this._getIndex(i, mid + 1, high);
        }
    }

    // calcultes impulse between two objects
    // returns an object in the form: { current: update, other: update }
    _calculateImpulse(curPos, othPos, curVel, othVel, curMass, othMass, t) {
        // find radius vector, from other to current
        let dist = new Vector(curPos.x - othPos.x, curPos.y - othPos.y);

        // find masses
        let massSum = curMass + othMass;

        // find projection of velocities onto radius vector
        let projCur = this._projectVector(curVel, dist);
        let projOth = this._projectVector(othVel, dist);

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

    // projects v1 onto v2
    _projectVector(v1, v2) {
        let dot = v1.x * v2.x + v1.y * v2.y;
        let projection = dot / ( Math.pow(v2.x, 2) + Math.pow(v2.y, 2) ); 
        return new Vector(v2.x * projection, v2.y * projection);
    }
}