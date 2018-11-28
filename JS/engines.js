class NarrowCollisionEngine {
    constructor() {
        this._size;
        this._colObjects;
        this._lossConstant = { object: 0.7, bound: 0.1, minImpulse: 100 };

        // bounding rectangle
        this._bound = { top: 0, right: 0, bottom: 0, left: 0, horI: -10, verI: -11 };
    }

    setBoundingRect(x, y, width, height) {
        this._bound.top = y;
        this._bound.right = x + width;
        this._bound.bottom = y + height;
        this._bound.left = x;
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

        // check intersection with bounding rectangle
        this._checkBound(i, current, curVel);
        this._checkBound(j, other, othVel);

        // stop calculating if one of the objects is non-collidable
        if (!current.collidable || !other.collidable) {
            return;
        }
        
        let dist = distance(other.pos, current.pos);
        let radSum = current.rad + other.rad;

        // if the objects are close enough to collide
        if (dist <= (radSum + curVel.mag + othVel.mag)) {
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
        for (let i = 0; i < this._size; i++) {
            this._updateVelocity(i);
        }

        // call onCollided() for every object
        for (let i = 0; i < this._size; i++) {
            this._callCollided(i);
        }

        return this._colObjects;
    }

    _callCollided(curI) {
        let currentObj = this._colObjects[curI];
        let activeCols = currentObj.activeCols;

        for (let i = 0; i < activeCols.length; i++) {
            let othI = activeCols[i];
            if (othI != this._bound.horI && othI != this._bound.verI) {
                currentObj.object.collided( this._colObjects[othI].object );
            }
        }
    }

    _checkBound(i, current, curVel) {
        if (!current.bound || curVel.mag == 0) {return}

        let finalPos = current.pos.add( curVel );

        // check if colliding with horizontal
        if (finalPos.y - current.rad <= this._bound.top || finalPos.y + current.rad >= this._bound.bottom) {
            let boundT = this._calculateBoundT(current, curVel, this._bound.horI);
            let curI = this._record(i, current);
            this._colObjects[curI].addPotentialCol(boundT, this._bound.horI);
        }

        // check if colliding with vertical
        if (finalPos.x - current.rad <= this._bound.left || finalPos.x + current.rad >= this._bound.right) {
            let boundT = this._calculateBoundT(current, curVel, this._bound.verI);
            let curI = this._record(i, current);
            this._colObjects[curI].addPotentialCol(boundT, this._bound.verI);
        }
    }

    _calculateBoundT(current, curVel, side) {
        let posX = current.pos.x;
        let posY = current.pos.y;
        let rad = current.rad;

        if (side == this._bound.verI) {
            let tLeft = (posX - rad - this._bound.left) / curVel.x;
            let tRight = (this._bound.right - rad - posX) / curVel.x;
            return Math.min( Math.abs(tLeft), Math.abs(tRight) );
        } else {
            let tTop = (this._bound.top - posY + rad) / curVel.y;
            let tBottom = (this._bound.bottom - posY - rad) / curVel.y;
            return Math.min( Math.abs(tTop), Math.abs(tBottom) );
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

            let t1 = round( (sqrtDisc - b) / denom, 4 ) - 0.0001;
            let t2 = round( (-sqrtDisc - b) / denom, 4 ) - 0.0001;

            return (t1 > t2) ? t2 : t1;
        } else {
            return -10;
        }
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
        if (!currentObj.noActiveCols || currentObj.noPotentialCols || current.vel.x == 0 && current.vel.y == 0) {
            return;
        }

        // get necessary components for current
        let curEarliestCol = currentObj.getEarliestCol();
        let othI = curEarliestCol.col;
        let curT = curEarliestCol.t;
        let curPosChange = multiplyVector(current.vel, deltaT * curT);

        if (othI == this._bound.horI || othI == this._bound.verI) {
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
            let dist = distance(othUpdatedPos, current.pos.add(curPosChange));

            // if new position of current should not be changed, add position
            // otherwise, recalculate using updated other position and zero velocity
            if (radSum == dist) {
                current.addPos(curPosChange);
            } else if (radSum > dist) {
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
        // if illegal index, return
        if (curI < 0) {
            return;
        }

        // get information about current and active collisions
        let currentObj = this._colObjects[curI];
        let current = currentObj.object;
        let activeCols = currentObj.activeCols;

        // go through each active collision
        for (let i = 0; i < activeCols.length; i++) {
            let othI = activeCols[i];
            let impulse;
            let prop = [];

            if (othI == this._bound.horI || othI == this._bound.verI) {
                impulse = this._calculateBoundImpulse(othI, current.vel);
            } else {
                let otherObj = this._colObjects[othI];
                let other = otherObj.object;
                let curUpdatedPos = current.pos.add(currentObj.change.pos);
                let othUpdatedPos = other.pos.add(otherObj.change.pos);

                impulse = this._calculateImpulse(curUpdatedPos, othUpdatedPos, current.vel, other.vel, current.mass, other.mass);
                prop.push(othI);
            }

            let angle = impulse.angle;
            let min = angle - 90;
            let max = angle + 90;

            this._propogate(curI, currentObj, impulse, prop, min, max);
        }
    }

    _propogate(curI, currentObj, impulse, prop, min, max) {
        if (curI < 0) {
            return;
        }

        let current = currentObj.object;
        let unprop = this._getUnpropogated(currentObj, prop);

        currentObj.addVel(impulse);
        prop.push(curI);

        for (let i = 0; i < unprop.length; i++) {
            let othI = unprop[i];

            if (othI != this._bound.horI && othI != this._bound.verI) {
                let otherObj = this._colObjects[othI];
                let other = otherObj.object;

                let radiusVector = new Vector(other.x - current.x, other.y - current.y);
                impulse = projectVector(impulse, radiusVector);

                let angle = impulse.angle;
                if (angle > min && angle < max) {
                    this._propogate(othI, otherObj, impulse, prop, min, max);
                }
            }
        }

        prop.pop();
    }

    _calculateBoundImpulse(sideI, curVel) {
        let curChange;

        if (sideI == this._bound.horI) {
            let repulse = curVel.y * this._lossConstant.bound;
            if ( Math.abs(repulse) < this._lossConstant.minImpulse ) {
                curChange = new Vector(0, -curVel.y - (curVel.y * this._lossConstant.minImpulse) / Math.abs(curVel.y));
            } else {
                curChange = new Vector(0, -curVel.y - repulse);
            }
        } else {
            let repulse = curVel.x * this._lossConstant.bound;
            if ( Math.abs(repulse) < this._lossConstant.minImpulse ) {
                curChange = new Vector(-curVel.x - (curVel.x * this._lossConstant.minImpulse) / Math.abs(curVel.x), 0);
            } else {
                curChange = new Vector(-curVel.x - repulse, 0);
            }
        }

        return curChange;
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
        let curComponent = multiplyVector(projCur, this._lossConstant.object * (curMass - othMass) / massSum );
        let othComponent = multiplyVector(projOth, this._lossConstant.object * (2 * othMass) / massSum );

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
        let curChange = negProjCur.add(curFinal);


        return curChange;
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
    _calculateTotalKE() {
        let sum = 0;
        for (let i = 0; i < this._size; i++) {
            let initialVel = this._colObjects[i].object.vel;
            let velChange = this._colObjects[i].change.vel;
            let vel = initialVel.add(velChange);
            let mass = this._colObjects[i].object.mass;
            sum += this._calculateKE(vel, mass);
        }
        return sum;
    }

    _calculateKE(velocity, mass) {
        return 0.5 * mass * Math.pow(velocity.mag, 2);
    }
}