// Vector ---------------------------------------------------------------------------------------------
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

    add(other) {
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
    constructor(pos1, pos2) {
        this._pos1 = pos1;
        this._pos2 = pos2;
    }

    get pos1() {
        return this._pos1;
    }
    get pos2() {
        return this._pos2;
    }
    get vector() {
        return new Vector( this._pos2.x - this.pos1._x, this._pos2.y - this._pos1.y );
    }
    get magnitude() {
        return this.vector.magnitude;
    }

    // Constructs line segment over a Vector, given a position Vector
    constructFromVector(pos, vec) {
        this._pos1 = pos;
        this._pos2 = new Vector(pos.x + vec.x, pos.y + vec.y);
    }

    toString() {
        return "Endpoints of segment are " + this._pos1 + " and " + this._pos2;
    }
}



// CHANGESPOSVEL ---------------------------------------------------------------------------------------------
class ChangesPosVel {
    constructor() {
        this._pos = { instant: new Vector(0, 0), delta: new Vector(0, 0) };
        this._vel = { instant: new Vector(0, 0), delta: new Vector(0, 0) };
    }

    get posIns() {
        return this._pos.instant;
    }
    get posDel() {
        return this._pos.delta;
    }
    get velIns() {
        return this._vel.instant;
    }
    get velDel() {
        return this._vel.delta;
    }

    set posIns(other) {
        this._pos.instant = other;
    }
    set posDel(other) {
        this._pos.delta = other;
    }
    set velIns(other) {
        this._vel.instant = other;
    }
    set velDel(other) {
        this._vel.delta = other;
    }

    add(other) {
        this.addPosIns(other.posIns);
        this.addPosDel(other.posDel);
        this.addVelIns(other.velIns);
        this.addVelDel(other.velDel);
    }
    addPosIns(change) {
        this._pos.instant.add(change);
    }
    addPosDel(change) {
        this._pos.delta.add(change);
    }
    addVelIns(change) {
        this._vel.instant.add(change);
    }
    addVelDel(change) {
        this._vel.delta.add(change);
    }

    toString() {
        return this.printPos() + "\n" + this.printVel();
    }
    printPos() {
        return "Changes in Position --- instant: " + this._pos.instant + " and delta: " + this._pos.delta;
    }
    printVel() {
        return "Changes in Velocity --- instant: " + this._vel.instant + " and delta: " + this._vel.delta;
    }
}


// RECTANGLE --------------------------------------------------------------------------------------------- 
class Rectangle {
    constructor(position, dimensions) {
        this._position = position;
        this._dimensions = dimensions;
    }

    get center() {
        return new Vector( this._position.x + this._dimensions.x / 2, this._position.y + this._dimensions.y / 2 );
    }
    get tLeft() {
        return this._position;
    }
    get tRight() {
        return new Vector( this._position.x + this._dimensions.x , this._position.y );
    }
    get bLeft() {
        return new Vector( this._position.x, this._position.y + this._dimensions.y );
    }
    get bRight() {
        return new Vector( this._position.x + this._dimensions.x , this._position.y + this._dimensions.y );
    }
    get dim() {
        return this._dimensions;
    }
    get segTop() {
        return new Segment( this.tLeft, this.tRight );
    }
    get segRight() {
        return new Segment( this.tRight, this.bRight );
    }
    get segBot() {
        return new Segment( this.bLeft, this.bRight );
    }
    get segLeft() {
        return new Segment( this.tLeft, this.bLeft );
    }

    addPos(other) {
        this._position.add(other);
    }
    addDim(other) {
        this._dimensions.add(other);
    }

    toString() {
        return "Position: " + this.tLeft + " --- Dimensions: " + this.dim;
    }
}


// GameObject ---------------------------------------------------------------------------------------------
class GameObject {
    constructor(rectangle, color, velocity, mass) {
        this._rectangle = rectangle;
        this._color = color;
        this._velocity = velocity;
        this._mass = mass;
        this._properties = {
            collidable: false,
            colType: { ground: false }
        };
    }

    get rec() {
        return this._rectangle;
    }
    get pos() {
        return this._rectangle.tLeft;
    }
    get dim() {
        return this._rectangle.dim;
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
    get colType() {
        return this._properties.colType;
    }

    set collidable(state) {
        this._properties.collidable = state;
    }


    setCollision(type, state) {
        this._properties.colType[type] = state;
    }
    addVel(changeInVelocity) {
        this._velocity.add(changeInVelocity);
    }
    addPos(changeInPosition) {
        this._rectangle.addPos(changeInPosition);
    }
    behave() {
        return new ChangesPosVel();
    }
    collided() {
        return new ChangesPosVel();
    }
    toString() {
        return this._rectangle;
    }
}