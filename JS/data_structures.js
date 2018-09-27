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
        return "Endpoints of segment are " + this._position1 + " and " + this._position2;
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
        this._position.instant.add(change);
    }
    addPosDel(change) {
        this._position.delta.add(change);
    }
    addVelIns(change) {
        this._velocity.instant.add(change);
    }
    addVelDel(change) {
        this._velocity.delta.add(change);
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


// GAMEOBJECT ---------------------------------------------------------------------------------------------
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
    addVel(change) {
        this._velocity.add(change);
    }
    addPos(change) {
        this._rectangle.addPos(change);
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