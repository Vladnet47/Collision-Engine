class NarrowCollisionEngine {
    constructor() {
        this._indeces = [];
        this._collisions = [];
        this._gameObjects = [];
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
        this._indeces = [];
        this._collisions = [];
        this._gameObjects = [];
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

        // calculate time of intersection, which represents a percentage of current velocity
        let t = this._calculateT(other, current, velGamX, velGamY, velOthX, velOthY, radSum);

        // if intersection occurs within the current velocities, record both objects
        if (t >= 0 && t <= 1) {
            this._record(i, j, current, other, t, 0, this._indeces.length - 1);
            this._record(j, i, other, current, t, 0, this._indeces.length - 1);
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

    // returns index of this._indeces
    _getIndex(i, low, high) {
        let mid = Math.floor((high + low + 1) / 2);
        let current = this._indeces[mid];

        if (i == current) {
            return mid;
        } else if (i < current) {
            return this._getIndex(i, low, mid - 1);
        } else {
            return this._getIndex(i, mid + 1, high);
        }
    }

    _record(indexCur, indexOth, current, other, t, low, high) {
        let mid = Math.floor((high + low + 1) / 2);
        let checkIndex = this._indeces[mid];

        // if indexCur exists in indeces, add collision information
        if (indexCur == checkIndex) {
            this._collisions[mid].push( {other: indexOth, t: t} );
        }
        
        // if reached the end, create new entry
        else if (low == this._indeces.length) {
            this._indeces.push(indexCur);
            this._collisions.push( [{other: indexOth, t: t}] );
            this._gameObjects.push(current);
        }

        // if reached the beginning, but bigger value, add at beginning + 1
        else if (mid == low && indexCur > checkIndex) {
            this._indeces.splice(mid + 1, 0, indexCur);
            this._collisions.splice(mid + 1, 0, [{other: indexOth, t: t}]);
            this._gameObjects.splice(mid + 1, 0, current);
        }

        // if reached the end, but smaller value, add at end
        else if (mid == high && indexCur < checkIndex) {
            this._indeces.splice(mid, 0, indexCur);
            this._collisions.splice(mid, 0, [{other: indexOth, t: t}]);
            this._gameObjects.splice(mid, 0, current);
        }

        // binary search
        else if (indexCur > checkIndex) {
            this._record(indexCur, indexOth, current, other, t, mid + 1, high);
        } else {
            this._record(indexCur, indexOth, current, other, t, low, mid - 1);
        }
    }

    // returns a list of changes for all objects that underwent collisions
    getChanges() {
        let listChanges = [];

        for (let i = 0; i < this._indeces.length; i++) {
            let change = new ChangesPosVel();
            let current = this._gameObjects[i];

            // find the object that current collided with
            let indexOth = this._collisions[i][0].other;
            let indexIndeces = this._getIndex( indexOth, 0, this._indeces.length - 1 );
            let other = this._gameObjects[ indexIndeces ];

            // this._findShortest();

            // retrieve the time of the collision
            let t = this._collisions[i][0].t;

            // get the change in position and velocity
            change.addPos( new Vector(current.vel.x * deltaT * t, current.vel.y * deltaT * t) );
            change.addVel( this._calculateImpulse(current, other) );

            listChanges.push({index: this._indeces[i], change: change});
        }

        return listChanges;
    }

    _findShortest() {

    }

    _calculateImpulse(current, other) {
        // find radius vector, from other to current
        let dist = new Vector(current.x - other.x, current.y - other.y);

        // find masses
        let massSum = current.mass + other.mass;

        // find projection of velocities onto radius vector
        let projCur = this._projectVector(current.vel, dist);
        let projOth = this._projectVector(other.vel, dist);

        // find the respective components from equation
        // v1 * (m1 - m2) / (m1 + m2)    +    v2 * (2 * m1) / (m1 + m2)    =    final v1
        let curComponent = multiplyVector(projCur, (current.mass - other.mass) / massSum );
        let othComponent = multiplyVector(projOth, (2 * other.mass) / massSum );

        // calculte the final velocities of current and other
        let curFinal = curComponent.add(othComponent);
        let othFinal = multiplyVector(other.vel, -1);
        othFinal.addTo(current.vel);
        othFinal.addTo(curFinal);

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
    _projectVector(v1, v2) {
        let dot = v1.x * v2.x + v1.y * v2.y;
        let projection = dot / ( Math.pow(v2.x, 2) + Math.pow(v2.y, 2) ); 
        return new Vector(v2.x * projection, v2.y * projection);
    }
}