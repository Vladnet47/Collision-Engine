'use strict';

class NarrowCollisionEngine {
    constructor(boundingRect) {
        this._counter = 0; // debug
        this._size;
        this._colObjects;
        this._tBuffer = 0.001; // the value subtracted from the calculated t to prevent object overlap
        this._loss = { object: 0.7, bound: 0.5, tBuffer: 0.001 };

        // bounding rectangle
        this._boundingRect = boundingRect;
        this._bound = { top: 0, right: 0, bottom: 0, left: 0, horI: -10, verI: -11 };
    }

    // resets the collision object array
    reset() {
        this._counter++;
        this._size = 0;
        this._colObjects = [];
        this._updateSides();
    }

    // checks intersection of given object with bounding rectangle
    checkBound(i, current) {
        // get the current velocity with respect to deltaT
        let curVel = multiplyVector(current.vel, deltaT);

        // if given object does not react to bounding rectangle or if it is not moving,
        if (!current.bound) {return}

        let finalPos = current.pos.add( curVel );
        let curI, horT, verT;

        // check if colliding with horizontal (top or bottom side of bounding rectangle)
        if (finalPos.y - current.rad <= this._bound.top || finalPos.y + current.rad >= this._bound.bottom) {
            curI = this._record(i, current);
            horT = this._calculateBoundT(current, curVel, this._bound.horI);
            this._colObjects[curI].addPotential(this._bound.horI, horT);
        }

        // check if colliding with vertical (right or left side of bounding rectangle)
        if (finalPos.x - current.rad <= this._bound.left || finalPos.x + current.rad >= this._bound.right) {
            curI = this._record(i, current);
            verT = this._calculateBoundT(current, curVel, this._bound.verI);
            this._colObjects[curI].addPotential(this._bound.verI, verT);
        }

        //console.log(current.pos + " vertical = (" + verT + ") and horizontal = (" + horT + ")");
    }

    // records collision if it occurs
    // returns true if collision occurs, false if it doesn't
    check(i, current, j, other) {
        // stop calculating if one of the objects is non-collidable
        if (!current.collidable || !other.collidable) {
            return;
        }

        // find change in position for current frame (velocity * delta time)
        let curVel = multiplyVector(current.vel, deltaT);
        let othVel = multiplyVector(other.vel, deltaT);
        let dist = distance(other.pos, current.pos);
        let radSum = current.rad + other.rad;

        // if the objects are close enough to collide
        if (dist <= (radSum + curVel.mag + othVel.mag)) {
            // calculate time of intersection, which represents a percentage of current velocity
            let t = this._calculateT(current.pos, other.pos, curVel, othVel, radSum);

            // if intersection occurs within the current velocities, record both objects
            if (t <= 1) {
                let curI = this._record(i, current);
                let othI = this._record(j, other);
                this._colObjects[curI].addPotential(othI, t);
                this._colObjects[othI].addPotential(curI, t);

                //console.log("collided!");
            }
        }
    }

    // returns a list of changes for all objects that underwent collisions
    updateChanges() {
        for (let i = 0; i < this._size; i++) {
            this._markActive(i);
        }

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
    }

    _updateSides() {
        this._bound.top = this._boundingRect.y;
        this._bound.right = this._boundingRect.x + this._boundingRect.width;
        this._bound.bottom = this._boundingRect.y + this._boundingRect.height;
        this._bound.left = this._boundingRect.x;
    }

    // calculates game-effect response for each object that experiecned a collision
    // for instance, player takes damage from hitting an asteroid
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

    _calculateBoundT(current, curVel, side) {
        let posX = current.pos.x;
        let posY = current.pos.y;
        let rad = current.rad;

        // initialize both t values (either top and bottom, or right and left collision with bounding rect)
        let t1, t2, vel;

        if (side == this._bound.verI) {
            vel = Math.abs(curVel.x);
            t1 = (posX - rad - this._bound.left) / vel;
            t2 = (this._bound.right - rad - posX) / vel;
        } else {
            vel = Math.abs(curVel.y);
            t1 = (posY - rad - this._bound.top) / vel;
            t2 = (this._bound.bottom - rad - posY) / vel;
        }

        t1 = this._isLegalT(t1);
        t2 = this._isLegalT(t2);

        return (t1 > t2) ? t2 : t1;
    }

    // if collision occurs, returns the time of collision (t) from starting position
    // if collition occurs in current frame, returns t value between 0 and 1 (proportion of current velocity)
    // if collision does not occur in current frame, returns 10
    _calculateT(curPos, othPos, curVel, othVel, radSum) {
        let velDiff = new Vector(curVel.x - othVel.x, curVel.y - othVel.y);
        let posDiff = new Vector(othPos.x - curPos.x, othPos.y - curPos.y);

        // quadratic formula to find intersection of two circles with velocities
        let a = Math.pow(velDiff.x, 2) + Math.pow(velDiff.y, 2);
        let b = -2 * vectorDot(posDiff, velDiff);
        let c = Math.pow(posDiff.x, 2) + Math.pow(posDiff.y, 2) - Math.pow(radSum, 2);
        let discriminant = Math.pow(b, 2) - 4 * a * c;

        // initialize both t values to be illegal by default
        let t1, t2;

        // if discriminant is positive, then there must be a collision at one or two points
        if (discriminant >= 0) {
            let sqrtDisc = Math.sqrt(discriminant);
            let denom = 2 * a;

            // find the two t values based on the quadratic equation, and check if they are legal
            t1 = (sqrtDisc - b) / denom;
            t2 = (-sqrtDisc - b) / denom; 
        } 

        t1 = this._isLegalT(t1);
        t2 = this._isLegalT(t2);

        return (t1 > t2) ? t2 : t1;
    }

    // returns the given t - tBuffer if given t is allowed, -1 otherwise
    // t is allowed if: t >= 0 and t <= 1
    _isLegalT(t) {
        if (t >= 0 && t <= 1) {
            t -= this._tBuffer;
            return (t > 0) ? round(t, 4) : 0;
        }
        return 10;
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

    _markActive(curI) {
        let currentObj = this._colObjects[curI];

        if (currentObj.hasPotential) {
            let shortestCol = currentObj.popPotential();
            let curT = shortestCol.t;
            let othI = shortestCol.i;

            if (curT > currentObj.shortestT) {
                // if current object already has active collision and it happens sooner, do not continue calculating
                if (currentObj.hasActive) {
                    return;
                } else {
                    currentObj.updateShortestT(curT);
                }
            }

            // if other is bounding rectangle, mark active and check the next potential collision
            if (othI == this._bound.horI || othI == this._bound.verI) {
                currentObj.addActive(othI);
                this._markActive(curI);
                return;
            }

            // since other is not a wall, get the object
            let otherObj = this._colObjects[curI];

            // if current collided with other sooner than other with current, something went wrong
            if (curT < otherObj.shortesT) {
                console.log("MarkActive: ERROR current t was not recorded in other");
                return;
            }

            // if current is also other's shortest collision, mark other as active, then check next potential collision
            if (curT == otherObj.shortestT) {
                currentObj.addActive(othI);
                this._markActive(curI);
                return;
            }

            // if other object has a collision that occurs sooner
            if (curT > otherObj.shortestT) {
                let current = currentObj.object;
                let other = otherObj.object;

                // update other
                this._markActive(othI);

                // calculate other object's next position
                let othNewPos = other.pos.add( multiplyVector(other.vel, deltaT * otherObj.shortestT) );

                // re-calculate current t based on other object's next position
                let newCurT = this._calculateT(current.pos, othNewPos, current.vel, new Vector(0,0), current.rad + other.rad);

                // if current and other still collide
                if (newCurT <= 1) {
                    // if the new t is shorter than the current t, or if current doesn't have any more potential collisions
                    // mark other as active and update current's shortestT
                    if (newCurT <= curT || !currentObj.hasPotential) {
                        currentObj.addActive(othI);
                        currentObj.updateShortestT(newCurT);
                        this._markActive(curI);
                    } else { // if new collision happens later, 
                        console.log("shit");

                        // let nextCurCol = currentObj.popPotential();
                        // let nextCurT = nextCurCol.t;

                        // if (newCurT < nextCurT) {
                        //     currentObj.addActive(othI);
                        //     return;
                        // } else if (newCurT == nextCurT) {
                        //     currentObj.addActive(othI);

                        // }
                    }
                } else { // if they don't
                    this._markActive(curI);
                }




                
                
                // compare new t with current.popPotential()
                    // if new t is smaller, mark each other active
                    // if new t is the same 


                    // what does popPotential return if no potential cols left?
                    // what happens when shortestT is no longer the shortestT?
            }
        }




        // while (currentObj.hasPotential) {
        //     let shortestCol = currentObj.popPotential();
        //     let curT = shortestCol.t;
        //     let othI = shortestCol.i;

           

        //     // if t of current collision is not the shortest, break,
        //     // since all of the subsequent ones will be greater
        //     if (curT != currentObj.shortestT) {
        //         break;
        //     }

        //     // if bound
        //     if (othI == this._bound.horI || othI == this._bound.verI) {
        //         currentObj.addActive(othI);
        //         continue;
        //     }

        //     // if object
        //     let otherObj = this._colObjects[othI];
        //     if (curT == otherObj.shortestT) {
        //         currentObj.addActive(othI);
        //     } 
            
        //     // if other object has shorter collision
        //     else if (curT > otherObj.shortestT) {
        //         console.log("shit");
        //         // recalculate T with the same other
        //         // if new t is less than current shortest

        //         // if new t is greater than current shortest
        //     }
        // }
    }

    _updatePosition(curI) {
        let currentObj = this._colObjects[curI];
        let current = currentObj.object;

        // if current has no active collisions or is stationary, do not update position
        if (!currentObj.hasActive || current.vel.x == 0 && current.vel.y == 0) {
            return;
        }

        let curPosChange = multiplyVector(current.vel, deltaT * currentObj.shortestT);

        currentObj.change.addPos( curPosChange );
    }

    _updateVelocity(curI) {
        // if illegal index, return
        if (curI < 0) {
            return;
        }

        // get information about current and active collisions
        let currentObj = this._colObjects[curI];
        let current = currentObj.object;
        let curUpdatedPos = current.pos.add(currentObj.change.pos);
        let activeCols = currentObj.activeCols;

        // go through each active collision
        for (let i = 0; i < activeCols.length; i++) {
            let othI = activeCols[i];
            let velChange;
            let prop = [];

            if (othI == this._bound.horI || othI == this._bound.verI) {
                velChange = this._calcBoundVelChange(othI, current.vel);
            } else {
                let otherObj = this._colObjects[othI];
                let other = otherObj.object;
                let othUpdatedPos = other.pos.add(otherObj.change.pos);

                velChange = this._calculateImpulse(curUpdatedPos, othUpdatedPos, current.vel, other.vel, current.mass, other.mass);
            }

            prop.push(othI);
            let impulse = multiplyVector(velChange, current.mass);
            let angle = angleDxDy(impulse.x, impulse.y);
            let min = (angle - 90) % 360;
            let max = (angle + 90) % 360;

            this._propogate(curI, currentObj, impulse, prop, min, max);
        }
    }

    _propogate(curI, currentObj, impulse, prop, min, max) {
        if (curI < 0) {
            return;
        }

        let current = currentObj.object;
        let unprop = this._getUnpropogated(currentObj, prop);

        currentObj.change.addVel( multiplyVector(impulse, 1/current.mass));
        prop.push(curI);

        for (let i = 0; i < unprop.length; i++) {
            let othI = unprop[i];
            let projImpulse;

            if (othI != this._bound.horI && othI != this._bound.verI) {
                let otherObj = this._colObjects[othI];
                let other = otherObj.object;

                let radiusVector = new Vector(other.x - current.x, other.y - current.y);
                projImpulse = projectVector(impulse, radiusVector);

                let angle = angleDxDy(projImpulse.x, projImpulse.y);
                if (angle > min && angle < max) {
                    this._propogate(othI, otherObj, projImpulse, prop, min, max);
                }
            }

            else {
                projImpulse = this._calcBoundImpulse(othI, impulse);
                let angle = angleDxDy(projImpulse.x, projImpulse.y);
                let min = (angle - 90) % 360;
                let max = (angle + 90) % 360;
                let newProp = [othI];

                for (let i = 0; i < prop.length; i++) {
                    if (prop[i] == this._bound.verI || prop[i] == this._bound.horI) {
                        newProp.push(prop[i]);
                    }
                }

                this._propogate(curI, currentObj, projImpulse, newProp, min, max);
            }
        }
    }

    _calcBoundImpulse(sideI, curVel) {
        return (sideI == this._bound.horI) ? new Vector(0, -curVel.y * this._loss.bound) : new Vector(-curVel.x * this._loss.bound, 0);
    }

    _calcBoundVelChange(sideI, curVel) {
        let impulse = this._calcBoundImpulse(sideI, curVel);
        (sideI == this._bound.horI) ? impulse.addTo( new Vector(0, -curVel.y)) : impulse.addTo( new Vector(-curVel.x, 0));
        return impulse;
    }

    // calcultes impulse between two objects
    // returns the impulse from other to current (a change in velocity vector)
    _calculateImpulse(curPos, othPos, curVel, othVel, curMass, othMass) {
        // find radius vector, from other to current
        let radVector = new Vector(curPos.x - othPos.x, curPos.y - othPos.y);

        // find projection of velocities onto radius vector
        let projCur = projectVector(curVel, radVector);
        let projOth = projectVector(othVel, radVector);

        // find the respective components from equation
        // v1 * (m1 - m2) / (m1 + m2)    +    v2 * (2 * m1) / (m1 + m2)    =    final v1
        let massSum = curMass + othMass;
        let curComponent = multiplyVector(projCur, this._loss.object * (curMass - othMass) / massSum );
        let othComponent = multiplyVector(projOth, this._loss.object * (2 * othMass) / massSum );

        // calculte the velocity change of current
        let velChange = curComponent.add(othComponent);
        velChange.addTo( multiplyVector(projCur, -1) );

        return velChange;
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


// POSITION DEBUGGER
// ----------------------------------------------------------------------------------------------------------------
        // for (let i = 0; i < this._size; i++) {
        //     for (let j = i + 1; j < this._size; j++) {
        //         let current = this._colObjects[i].object;
        //         let other = this._colObjects[j].object;
        //         let curPos = round( current.changes.pos.add(current.pos), 1);
        //         let othPos = round( other.changes.pos.add(other.pos), 1);

        //         if (current instanceof Player) {
        //             console.log("Player position is: " + curPos + " and Planet position is: " + othPos + " and t = " + this._colObjects[i].shortestT);
        //         }

        //         let dist = distance(curPos, othPos);
        //         if (dist < current.rad + other.rad) {
        //             console.log("POSITION: objects overlapping...");
        //         }
        //     }
        // }

        
        // for (let i = 0; i < this._size; i++) {
        //     let object = this._colObjects[i];
        //     let current = object.object;

        //     if (current instanceof Player) {
        //         let nextPos = current.changes.pos.add(current.pos);

        //         if (nextPos.y - current.rad <= this._bound.top) {
        //             console.log("POSITION: bound overlapping..." + this._counter);
        //         }
        //     }
        // }
        // ----------------------------------------------------------------------------------------------------------------


        // VELOCITY DEBUGGER
        // ----------------------------------------------------------------------------------------------------------------
        // for (let i = 0; i < this._size; i++) {
        //     for (let j = i + 1; j < this._size; j++) {
        //         let current = this._colObjects[i].object;
        //         let other = this._colObjects[j].object;
        //         let curPos = multiplyVector( current.changes.vel.add(current.vel), deltaT );
        //         curPos.addTo( current.changes.pos );
        //         curPos.addTo( current.pos );
        //         let othPos = multiplyVector( other.changes.vel.add(other.vel), deltaT );
        //         othPos.addTo( other.changes.pos );
        //         othPos.addTo( other.pos );

        //         let dist = distance(curPos, othPos);
        //         if (dist <= current.rad + other.rad) {
        //             console.log("VELOCITY: objects overlapping...");
        //         }
        //     }
        // }

        // ----------------------------------------------------------------------------------------------------------------
        // for (let i = 0; i < this._size; i++) {
        //     let object = this._colObjects[i];
        //     let current = object.object;

        //     if (current instanceof Player) {
        //         let nextPos = multiplyVector( current.changes.vel.add(current.vel), deltaT );
        //         nextPos.addTo( current.changes.pos );
        //         nextPos.addTo( current.pos );

        //         if (nextPos.y - current.rad <= this._bound.top) {
        //             console.log("VELOCITY: bound overlapping..." + this._counter);
        //         }
        //     }
        // }
        // ----------------------------------------------------------------------------------------------------------------