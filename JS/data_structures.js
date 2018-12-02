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

// CHANGESPOSVEL ---------------------------------------------------------------------------------------------
class ChangesPosVel {
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

    add(changesOther) {
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

class CollisionObject {
    constructor(gameObject, envirIndex) {
        this._gameObject = gameObject;
        this._index = envirIndex;

        // information about other objects
        this._tValues = []; // tValues of collisions
        this._numPotentialCols = 0;
        this._potentialCols = []; // all potential collisions

        this._numActiveCols = 0;
        this._activeCols = []; // all final collisions

        this._change = new ChangesPosVel();
    }

    get object() {
        return this._gameObject;
    }
    get index() {
        return this._index;
    }
    get noPotentialCols() {
        return this._numPotentialCols == 0;
    }
    get noActiveCols() {
        return this._numActiveCols == 0;
    }
    get potentialCols() {
        return this._potentialCols;
    }
    get activeCols() {
        return this._activeCols;
    }
    get change() {
        return this._change;
    }

    // has to do with changes
    addPos(posVector) {
        this._change.addPos(posVector);
    }
    addVel(velVector) {
        this._change.addVel(velVector);
    }

    // has to do with collisions
    // inserts information about collision based on tValue, smallest to largest
    addPotentialCol(t, index) {
        this._addPotentialCol(t, index, 0, this._numPotentialCols - 1);
    }
    _addPotentialCol(t, index, low, high) {
        let mid = Math.floor((high + low + 1) / 2);

        if (mid > high) {
            this._tValues.splice(mid, 0, t);
            this._potentialCols.splice(mid, 0, index);
            this._numPotentialCols++;
        } else {
            let checkT = this._tValues[mid];

            if (t <= checkT) {
                this._addPotentialCol(t, index, low, mid - 1);
            } else {
                this._addPotentialCol(t, index, mid + 1, high);
            }
        }
    }

    getEarliestCol() {
        if (this._numPotentialCols > 0) {
            return { t: this._tValues[0], col: this._potentialCols[0] };
        } else {
            console.log("CollisionObject.getEarliestCol() no other collision");
        }
    }
    removePotentialCol() {
        this._tValues.splice(0, 1);
        this._potentialCols.splice(0, 1);
        this._numPotentialCols--;
    }

    addCol(index) {
        this._activeCols.push(index);
        this._numActiveCols++;
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


// GAMEOBJECT ---------------------------------------------------------------------------------------------
class GameObject {
    constructor(circle, color, velocity, mass) {
        this._circle = circle;
        this._color = color;
        this._velocity = velocity;
        this._mass = mass;

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

    addVel(change) {
        this._velocity.addTo(change);
    }

    addPos(change) {
        this._circle.pos.addTo(change);
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
        return new ChangesPosVel();
    }
    collided() {}
    toString() {
        return this.circle.toString();
    }
}