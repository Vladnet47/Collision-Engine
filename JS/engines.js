class NarrowCollisionEngine {
    constructor() {
        this._indeces = [];
        this._collisions = [];
        this._gameObjects = [];
    }

    // empties collisions and indeces
    reset() {
        this._indeces = [];
        this._collisions = [];
    }

    // returns true if current and other intersect, and updates collisions and indeces.
    // by default, tests for circle-circle intersection
    check(i, current, j, other) {
        // find distance from gameObject and other, direction from gameObject to other
        let distX = other.x - current.x;
        let distY = other.y - current.y;
        let dist = magnitude(distX, distY);

        // find gameObject velocity
        let velGamX = current.vel.x * deltaT;
        let velGamY = current.vel.y * deltaT;
        let velGam = current.vel.mag * deltaT;

        // find other velocity
        let velOthX = other.vel.x * deltaT;
        let velOthY = other.vel.y * deltaT;
        let velOth = other.vel.mag * deltaT;
        
        // find sum of radii
        let radSum = current.rad + other.rad;

        // BROAD PHASE
        // if the objects are too far apart, return
        if (dist > radSum + velGam + velOth) {
            return false;
        }

        let t = this._calculateT(other, current, velGamX, velGamY, velOthX, velOthY, radSum);

        if (t >= 0 && t <= 1) {
            this._record(i, current, j, other, t);
            return true;
        }
        return false;
    }

    _calculateT(other, current, velGamX, velGamY, velOthX, velOthY, radSum) {
        let velDiffX = -(velOthX - velGamX);
        let velDiffY = -(velOthY - velGamY);
        let posDiffX = other.x - current.x;
        let posDiffY = other.y - current.y;

        let a = Math.pow(velDiffX, 2) + Math.pow(velDiffY, 2);
        let b = -2 * (posDiffX * velDiffX + posDiffY * velDiffY);
        let c = Math.pow(posDiffX, 2) + Math.pow(posDiffY, 2) - Math.pow(radSum, 2);
        let discriminant = Math.pow(b, 2) - 4 * a * c;

        let t = -1;
        if (discriminant >= 0) {
            let sqrtDisc = Math.sqrt(discriminant);

            let t1 = (-b + sqrtDisc) / (2 * a);
            let t2 = (-b - sqrtDisc) / (2 * a);

            (t1 > t2) ? t = t2 : t = t1;
        }

        return t;
    }

    // records items in increasing index order
    _record(i, current, j, other, t) {
        let last = this._indeces.length - 1;
        let indexI = this._getIndex(i, 0, last);
        let indexJ = this._getIndex(j, 0, last);

        if (indexI == indexJ) {
            (i > j) ? indexI++ : indexJ++;
        }

        // update current
        if (indexI > last) {                            // if current doesn't exist belongs at the end
            this._indeces.push(i);
            this._collisions.push( [{other: j, t: t}] );
            this._gameObjects.push(current);
        } else if (this._indeces[indexI] == i) {        // if current exists
            this._collisions[indexI].push( {other: j, t: t} );
        } else {                                        // if current doesn't exist and belongs somewhere in the middle
            this._indeces.splice(indexI, 0, i);
            this._collisions.splice(indexI, 0, [{other: j, t: t}]);
            this._gameObjects.splice(indexI, 0, current);
        }

        last++;

        if (indexJ > last) {                            // if other doesn't exist belongs at the end
            this._indeces.push(j);
            this._collisions.push( [{other: i, t: t}] );
            this._gameObjects.push(other);
        } else if (this._indeces[indexJ] == j) {        // if other exists
            this._collisions[indexJ].push( {other: i, t: t} );
        } else {                                        // if other doesn't exist and belongs somewhere in the middle
            this._indeces.splice(indexJ, 0, j);
            this._collisions.splice(indexJ, 0, [{other: i, t: t}]);
            this._gameObjects.splice(indexJ, 0, other);
        }
    }

    // returns index of this._indeces if i exists
    // otherwise, returns index of this._indeces where it should be to keep it sorted
    _getIndex(i, low, high) {
        if (low >= high) {
            return (i > this._indeces[low]) ? low + 1 : low;
        } else {
            let mid = Math.floor((high + low + 1) / 2);
            let current = this._indeces[mid];

            if (i == current) {
                return mid;
            } else {
                return (i > current) ? this._getIndex(i, mid + 1, high) : this._getIndex(i, low, mid - 1);
            }
        }
    }

    // returns a list of changes for all objects that underwent collisions
    getChanges() {
        let listChanges = [];

        for (let i = 0; i < this._indeces.length; i++) {
            let change = new ChangesPosVel();
            let current = this._gameObjects[i];
            let other = this._gameObjects[ this._collisions[i][0].other ];

            // this._findShortest();
            let t = this._collisions[i][0].t;

            let velCurX = current.vel.x;
            let velCurY = current.vel.y;

            // get the change in position
            change.posIns = new Vector(velCurX * deltaT * t, velCurY * deltaT * t);

            change.velIns = this._calculateImpulse(current, other);

            listChanges.push({index: i, change: change});
        }

        return listChanges;
    }

    _findShortest() {

    }

    _calculateImpulse(current, other) {
        // find radius vector, from other to current
        let distX = current.x - other.x;
        let distY = current.y - other.y;

        // find current velocity
        let velCurX = current.vel.x;
        let velCurY = current.vel.y;

        // find other velocity
        let velOthX = other.vel.x;
        let velOthY = other.vel.y;

        // find masses
        let massCur = current.mass;
        let massOth = other.mass;
        let massSum = massCur + massOth;

        // find projection of velocities onto radius vector
        let projCur = this._projectVector(velCurX, velCurY, distX, distY);
        let projOth = this._projectVector(velOthX, velOthY, distX, distY);

        // find the respective components from equation
        // v1 * (m1 - m2) / (m1 + m2)    +    v2 * (2 * m1) / (m1 + m2)    =    final v1
        let curComponent = multiplyVector(projCur, (massCur - massOth) / massSum );
        let othComponent = multiplyVector(projOth, (2 * massCur) / massSum );

        // calculte the final velocities of current and other
        let curFinal = curComponent.add(othComponent);
        // let othFinal = multiplyVector(other.vel, -1);
        // othFinal.addTo(current.vel);
        // othFinal.addTo(curFinal);

        // calculate the change in velocity vector
        // first, set velocity along radius to 0
        // second, add the final velocity along radius
        let negProjCur = multiplyVector(projCur, -1);
        //let negProjOth = multiplyVector(projOth, -1);

        let curChange = negProjCur.add(curFinal);
        // let othChange = negProjOth.add(othFinal);

        return curChange;
    }

    // projects x onto y
    _projectVector(x1, y1, x2, y2) {
        let dot = x1 * x2 + y1 * y2;
        let projection = dot / ( Math.pow(x2, 2) + Math.pow(y2, 2) ); 
        return new Vector(x2 * projection, y2 * projection);
    }
}