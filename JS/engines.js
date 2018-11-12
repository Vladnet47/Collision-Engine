class NarrowCollisionEngine {
    constructor() {
        // all indeces match up to eachother (like a matrix)
        this._gameObjects; // list of the gameObjects involved in collisions
        this._iGameObjects; // list of indeces where the gameObjects are stored in the environment (used to match them later)
        this._tValues; // list of times for shortest collisions (between 0 and 1, 1 being the full velocity of gameObject)
        this._iCollisions; // list of indeces of shortest collisions for each gameObject (index points to another gameObject)
        this._updated; // list of boolean values that indicate that gameObject is updated 

        this._size;

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
        this._gameObjects = [];
        this._iGameObjects = [];
        this._tValues = [];
        this._iCollisions = [];
        this._updated = []; 

        this._size = 0;
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
        let t = this._calculateT(current, other, velGam, velOth, radSum);

        // if intersection occurs within the current velocities, record both objects
        if (t >= 0 && t <= 1) {
            this._record(i, j, current, t, 0, this._size - 1);
            this._record(j, i, other, t, 0, this._size - 1);
            return true;
        }
        return false;
    }

    _calculateT(current, other, curVel, othVel, radSum) {
        let velDiffX = curVel.x - othVel.x;
        let velDiffY = curVel.y - othVel.y;
        let posDiffX = other.x - current.x;
        let posDiffY = other.y - current.y;

        let a = Math.pow(velDiffX, 2) + Math.pow(velDiffY, 2);
        let b = -2 * (posDiffX * velDiffX + posDiffY * velDiffY);
        let c = Math.pow(posDiffX, 2) + Math.pow(posDiffY, 2) - Math.pow(radSum, 2);
        let discriminant = Math.pow(b, 2) - 4 * a * c;

        if (discriminant >= 0) {
            let sqrtDisc = Math.sqrt(discriminant);

            let t1 = (-b + sqrtDisc) / (2 * a);
            let t2 = (-b - sqrtDisc) / (2 * a);

            return (t1 > t2) ? t2 : t1;
        }
        return -1;
    }

    _record(indexCur, indexOth, current, t, low, high) {
        let mid = Math.floor((high + low + 1) / 2);
        let checkIndex = this._iGameObjects[mid];

        // if indexCur exists in indeces, add collision information
        if (indexCur == checkIndex) {
            // if t is smaller than the existing one, replace
            if (t < this._tValues) {
                this._iCollisions[mid].push(indexOth);
                this._tValues[mid].push(t);
            }
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
        let listChanges = [];

        for (let curI = 0; curI < this._size; curI++) {
            // find the object that current collided with
            let iShortestCol = this._getShortestCol(curI);
            let othI = this._getIndex( this._iCollisions[curI][iShortestCol], 0, this._size - 1 );

            // retrieve the time of the collision
            let t = this._tValues[curI][iShortestCol];

            // get the change in position and velocity
            this._updateChanges(curI, othI, t, listChanges);
        }

        return listChanges;
    }

    _updateChanges(curI, othI, t, listChanges) {
        // do not calculate if gameObject is already updated
        if (this._updated[curI]) {
            return;
        }

        let othShortestI = this._getShortestCol(othI)
        let otherT = this._tValues[othI][othShortestI];
        
        if (otherT < t) {
            this._updateChanges(othI, this._iCollisions[othI][othShortestI], otherT, listChanges);
            // recalculate collision with other
            let current = this._gameObjects[curI];
            let other = this._gameObjects[othI];
            let newT = this._calculateT(current, other, current.vel, new Vector(0,0), current.rad + other.rad); // need to update position of other
            if (newT >= 0 && newT <= 1) {
                let changeCur = new ChangesPosVel();
                let impulse = this._calculateImpulse(current, other, current.vel, other.vel, newT); // update position of other
            } else {
                while (this._tValues[curI].length > 0) {
                }
            }
            
            // if no collision
                // let newT = smallestT( curI );
                // this._update(curI, nextOthI, newT, )
            // need to have a history of t values, or else a non-collision would allow gameObject to complete velocity
            
        } else if (otherT == t) {
            let changeCur = new ChangesPosVel();
            let changeOth = new ChangesPosVel();
            let current = this._gameObjects[curI];
            let other = this._gameObjects[othI];

            let impulse = this._calculateImpulse(current, other, current.vel, other.vel, t);

            changeCur.addPos( multiplyVector(current.vel, deltaT * t) );
            changeOth.addPos( multiplyVector(other.vel, deltaT * t) );
            changeCur.addVel( impulse.current );
            changeOth.addVel( impulse.other );

            listChanges.push({index: this._iGameObjects[curI], change: changeCur});
            listChanges.push({index: this._iGameObjects[othI], change: changeOth});

            this._updated[curI] = true;
            this._updated[othI] = true;
        }
    }

    // returns index of smallest t value in nested array at given index of this._tValues
    _getShortestCol(curI) {
        let tArr = this._tValues[curI];
        let indexT = 0;
        let smallestT = tArr[0];
        for (let i = 1; i < tArr.length; i++) {
            if (tArr[i] < smallestT) {
                smallestT = tArr[i];
                indexT = i;
            }
        }
        return indexT;
    }

    // removes the collision at given index of nested array inside this._iCollisions
    _removeCol(curI, colI) {
        this._tValues[curI].splice(colI, 1);
        this._iCollisions[curI].splice(colI, 1);
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

    _calculateImpulse(current, other, curVel, othVel, t) {
        // find radius vector, from other to current

        // this recalculates position again --------------------------------------------------------
        let tempCurVel = multiplyVector(curVel, t * deltaT);
        let tempOthVel = multiplyVector(othVel, t * deltaT);
        let dist = new Vector((current.x + tempCurVel.x) - (other.x + tempOthVel.x), (current.y + tempCurVel.y) - (other.y + tempOthVel.y));
        dist.addTo( vectorToXY(0.02, dist.angle ));

        // find masses
        let massSum = current.mass + other.mass;

        // find projection of velocities onto radius vector
        let projCur = this._projectVector(curVel, dist);
        let projOth = this._projectVector(othVel, dist);

        // find the respective components from equation
        // v1 * (m1 - m2) / (m1 + m2)    +    v2 * (2 * m1) / (m1 + m2)    =    final v1
        let curComponent = multiplyVector(projCur, (current.mass - other.mass) / massSum );
        let othComponent = multiplyVector(projOth, (2 * other.mass) / massSum );

        // calculte the final velocities of current and other
        let curFinal = curComponent.add(othComponent);
        let othFinal = multiplyVector(curFinal, -1);
        othFinal.addTo(projCur);
        othFinal = multiplyVector(othFinal, current.mass / other.mass);
        othFinal.addTo(projOth);

        // calculate the change in velocity vector
        // first, set velocity along radius to 0
        // second, add the final velocity along radius
        let negProjCur = multiplyVector(projCur, -1);
        let negProjOth = multiplyVector(projOth, -1);

        let curChange = negProjCur.add(curFinal);
        let othChange = negProjOth.add(othFinal);

        return { current: curChange , other: othChange };
    }

    // projects x onto y
    _projectVector(v1, v2) {
        let dot = v1.x * v2.x + v1.y * v2.y;
        let projection = dot / ( Math.pow(v2.x, 2) + Math.pow(v2.y, 2) ); 
        return new Vector(v2.x * projection, v2.y * projection);
    }
}