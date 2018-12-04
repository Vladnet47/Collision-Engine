'use strict';

// VECTOR ---------------------------------------------------------------------------------------------
class Vector {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get mag() {
        return magnitude(this._x, this._y);
    }

    // returns sum of this vector and other
    add(other) {
        if (defined(other)) {
            return new Vector(this._x + other.x, this._y + other.y);
        } else {
            return new Vector(this._x, this._y);
        }
    }

    // adds other vector to this vector
    addTo(other) {
        if (defined(other)) {
            this._x += other.x;
            this._y += other.y;
        } 
    }

    clear() {
        this._x = 0;
        this._y = 0;
    }

    toString() {
        return "(" + this._x + ", " + this._y + ")";
    }
}

class Rectangle {
    constructor(position, width, height) {
        this._position = position;
        this._width = width;
        this._height = height;
    }

    get x() {
        return this._position.x;
    }
    get y() {
        return this._position.y;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
}

class Circle {
    constructor(position, radius) {
        this._position = position;
        this._radius = radius;
    }

    get pos() {
        return this._position;
    }
    get rad() {
        return this._radius;
    }

    resize(factor) {
        this._radius *= factor;
    }

    toString() {
        return "Circle radius = " + this._radius + " and position = " + this._position.toString();
    }
}


// CHANGESPOSVEL ---------------------------------------------------------------------------------------------
class ChangesToMotion {
    constructor() {
        this._position;
        this._velocity;
        this._acceleration;
    }

    get pos() {
        return this._position;
    }
    get vel() {
        return this._velocity;
    }
    get acc() {
        return this._acceleration;
    }

    add(changesOther) { //---------------------------------------------------------------------------TRY TO REMOVE THIS
        this.addPos(changesOther.pos);
        this.addVel(changesOther.vel);
        this.addAcc(changesOther.acc);
    }
    addPos(posVector) {
        (defined(this._position)) ? this._position.addTo( posVector ) : this._position = posVector;
    }
    addVel(velVector) {
        (defined(this._velocity)) ? this._velocity.addTo( velVector ) : this._velocity = velVector;
    }
    addAcc(accVector) {
        (defined(this._acceleration)) ? this._acceleration.addTo( accVector ) : this._acceleration = accVector;
    }

    clear() {
        this.clearPos();
        this.clearVel();
        this.clearAcc();
    }
    clearPos() {
        if (defined(this._position)) {
            this._position.clear();
        }
    }
    clearVel() {
        if (defined(this._velocity)) {
            this._velocity.clear();
        }
    }
    clearAcc() {
        if (defined(this._acceleration)) {
            this._acceleration.clear();
        }
    }

    toString() {
        return ("Changes in position = " + this._position.toString() + 
                ", velocity = " + this._velocity.toString() + 
                ", and acceleration = " + this._acceleration.toString() );
    }
}

// GAMEOBJECT ---------------------------------------------------------------------------------------------
class GameObject {
    constructor(circle, color, velocity, mass) {
        this._circle = circle;
        this._color = color;
        this._velocity = velocity;
        this._mass = mass;

        // changes due to behavior and collision
        this._changes = new ChangesToMotion();

        this._properties = {
            collidable: false, // GameObject will be scanned for collisions
            bound: false,
            lifespan: new Timer("inf"),
            explode: false,
            remove: false,
        };

        this._explosion = {
            exploding: false,
            color: "rgb(255, 102, 0)",
            factor: 2.0,
            timer: new Timer(1),
        }
    }

    get x() {
        return this._circle.pos.x;
    }
    get y() {
        return this._circle.pos.y;
    }
    get pos() {
        return this._circle.pos;
    }
    get rad() {
        return this._circle.rad;
    }
    get color() {
        return this._color;
    }
    get vel() {
        return this._velocity;
    }
    get mass() {
        return this._mass;
    }
    get changes() {
        return this._changes;
    }
    get collidable() {
        return this._properties.collidable;
    }
    get bound() {
        return this._properties.bound;
    }
    get lifespan() {
        return this._properties.lifespan;
    }
    get remove() {
        return this._properties.remove;
    }
    get explode() {
        return this._properties.explode;
    }
    get explosion() {
        return this._explosion;
    }

    set color(color) {
        this._color = color;
    }
    set collidable(state) {
        this._properties.collidable = state;
    }
    set bound(state) {
        this._properties.bound = state;
    }
    set remove(state) {
        this._properties.remove = state;
    } 
    set explode(state) {
        this._properties.explode = state;
    }

    updateChanges() {
        // convert acceleration into velocity change and update velocity
        this._changes.addVel( multiplyVector(this._changes.acc, deltaT) );
        this._velocity.addTo( this._changes.vel );

        // convert velocity into position change and update position
        this._changes.addPos( multiplyVector(this._velocity, deltaT) );
        this.pos.addTo( this._changes.pos );

        // set all changes to motion = zero
        this._changes.clear();
    }

    updateVelocity() {
        this._changes.addVel( multiplyVector(this._changes.acc, deltaT) );
        this._velocity.addTo( this._changes.vel );
        this._changes.clearAcc();
        this._changes.clearVel();
    }

    updatePosition() {
        this._changes.addPos( multiplyVector(this._velocity, deltaT) );
        this.pos.addTo( this._changes.pos );
        this._changes.clearPos();
    }

    causeExplosion() {
        this._collidable = false;
        this._explosion.exploding = true;
        this._explosion.timer.reset();
        this._velocity.addTo( multiplyVector(this._velocity, -1) );
        this._color = this._explosion.color;
        this._circle.resize( this._explosion.factor );
    }

    behave() {
        return new ChangesToMotion();
    }
    collided() {}
    toString() {
        return this.circle.toString();
    }
}

class CollisionObject {
    constructor(gameObject, envirIndex) {
        this._gameObject = gameObject;
        this._index = envirIndex;


        // information about other objects
        this._shortestT = 1;

        this._potentialT = []; // tValues of collisions
        this._potentialCols = []; // all potential collisions
        this._activeCols = []; // all final collisions
    }

    get index() {
        return this._index;
    }
    get object() {
        return this._gameObject;
    }
    get change() {
        return this._gameObject.changes;
    }
    get hasPotential() {
        return this._potentialCols.length > 0;
    }
    get hasActive() {
        return this._activeCols.length > 0;
    }
    get activeCols() {
        return this._activeCols;
    }
    get shortestT() {
        return this._shortestT;
    }

    addPotential(index, t) {
        if (!this.hasPotential || t < this._potentialT[0]) {
            this._shortestT = t;
        }
        this._addPotential(index, t, 0, this._potentialCols.length - 1);
    }
    addActive(index) {
        this._activeCols.push(index);
    }

    popPotential() {
        let t = this._potentialT.shift();
        let i = this._potentialCols.shift();
        return { t: t, i: i };
    }

    _addPotential(index, t, low, high) {
        let mid = Math.floor((high + low + 1) / 2);

        if (mid > high) {
            this._potentialT.splice(mid, 0, t);
            this._potentialCols.splice(mid, 0, index);
        } else {
            if (index != this._potentialCols[mid]) {
                if (t <= this._potentialT[mid]) {
                    this._addPotential(index, t, low, mid - 1);
                } else {
                    this._addPotential(index, t, mid + 1, high);
                }
            }
        }
    }
}