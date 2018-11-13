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
    // returns counter clockwise from the x-axis
    get angle() {
        return Math.atan(this._y / this._x) * -180 / Math.PI;
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
        return "(" + round(this.x, 3) + ", " + round(this.y, 3) + ")";
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
        (defined(this._position)) ? this._position.addTo(posVector) : this._position = posVector;
    }
    addVel(velVector) {
        (defined(this._velocity)) ? this._velocity.addTo(velVector) : this._velocity = velVector;
    }
    addAcc(accVector) {
        (defined(this._acceleration)) ? this._acceleration.addTo(accVector) : this._acceleration = accVector;
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
            physics: false, // GameObject will not react to global events and collision physics
            colType: { ground: false } // Used to handle GameObject-specific collisions
        };
    }

    get x() {
        return this._circle.pos.x + this._circle.rad;
    }
    get y() {
        return this._circle.pos.y + this._circle.rad;
    }
    get pos() {
        return this._circle.pos.add(new Vector(this._circle.rad, this._circle.rad));
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
    get physics() {
        return this._properties.physics;
    }
    get listCols() {
        return this._properties.colType;
    }

    set color(color) {
        this._color = color;
    }
    set collidable(state) {
        this._properties.collidable = state;
    }
    set physics(state) {
        this._properties.physics = state;
    }

    setCollision(type, state) {
        this._properties.colType[type] = state;
    }
    addVel(change) {
        this._velocity.addTo(change);
    }
    addPos(change) {
        this._circle.pos.addTo(change);
    }
    behave() {
        return new ChangesPosVel();
    }
    collided() {
        return new ChangesPosVel();
    }
    toString() {
        return this.circle.toString();
    }
}