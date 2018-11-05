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
    get magnitude() {
        return Math.sqrt( Math.pow( this.x, 2 ) + Math.pow( this.y, 2 ) );
    }
    // returns counter clockwise from the x-axis
    get angle() {
        return Math.atan(this._y / this._x) * -180 / Math.PI;
    }

    add(other) {
        return new Vector(this._x + other.x, this._y + other.y);
    }
    addTo(other) {
        this._x += other.x;
        this._y += other.y;
    }

    toString() {
        return "(" + round(this.x, 3) + ", " + round(this.y, 3) + ")";
    }
}

// SEGMENT -----------------------------------------------------------------------------------------------
// Constructs line segment from two Vectors as endpoints
class Segment {
    constructor(position1, position2) {
        this._position1 = position1;
        this._position2 = position2;
    }

    get pos1() {
        return this._position1;
    }
    get pos2() {
        return this._position2;
    }
    get vector() {
        return new Vector( this._position2.x - this._position1.x, this._position2.y - this._position1.y );
    }
    get magnitude() {
        return this.vector.magnitude;
    }

    toString() {
        return "Endpoints of segment are " + this._position1.toString() + " and " + this._position2.toString();
    }
}



// CHANGESPOSVEL ---------------------------------------------------------------------------------------------
class ChangesPosVel {
    constructor() {
        this._position = { instant: new Vector(0, 0), delta: new Vector(0, 0) };
        this._velocity = { instant: new Vector(0, 0), delta: new Vector(0, 0) };
    }

    get posIns() {
        return this._position.instant;
    }
    get posDel() {
        return this._position.delta;
    }
    get velIns() {
        return this._velocity.instant;
    }
    get velDel() {
        return this._velocity.delta;
    }

    set posIns(other) {
        this._position.instant = other;
    }
    set posDel(other) {
        this._position.delta = other;
    }
    set velIns(other) {
        this._velocity.instant = other;
    }
    set velDel(other) {
        this._velocity.delta = other;
    }

    add(other) {
        this.addPosIns(other.posIns);
        this.addPosDel(other.posDel);
        this.addVelIns(other.velIns);
        this.addVelDel(other.velDel);
    }
    addPosIns(change) {
        this._position.instant.addTo(change);
    }
    addPosDel(change) {
        this._position.delta.addTo(change);
    }
    addVelIns(change) {
        this._velocity.instant.addTo(change);
    }
    addVelDel(change) {
        this._velocity.delta.addTo(change);
    }

    toString() {
        return this.printPos() + "\n" + this.printVel();
    }
    printPos() {
        return "Changes in Position --- instant: " + this._position.instant + " and delta: " + this._position.delta;
    }
    printVel() {
        return "Changes in Velocity --- instant: " + this._velocity.instant + " and delta: " + this._velocity.delta;
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

    addPos(change) {
        this._position.addTo(change);
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
        this._circle.addPos(change);
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