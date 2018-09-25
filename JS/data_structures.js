// Vector ---------------------------------------------------------------------------------------------

function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.add = function(other) {
    this.x += other.getX();
    this.y += other.getY();
}
Vector.prototype.set = function(other) {
    this.setX(other.getX());
    this.setY(other.getY());
}
Vector.prototype.setX = function(x) {
    this.x = x;
}
Vector.prototype.setY = function(y) {
    this.y = y;
}
Vector.prototype.getX = function() {
    return this.x;
}
Vector.prototype.getY = function() {
    return this.y;
}
Vector.prototype.getMagnitude = function() {
    return Math.sqrt( Math.pow(this.x, 2) + Math.pow(this.y, 2) );
}
Vector.prototype.toString = function() {
    return "(" + round(this.getX(), 3) + ", " + round(this.getY(), 3) + ")";
}

// HELPER FUNCTIONS ---------------------------------------------------------------------------------------------

// Returns a Vector with x and y components calculated from magnitude and direction.
// Direction is given in degrees
function convertToXY(magnitude, direction) {
    let x = Math.cos(toRadians(direction)) * magnitude;
    let y = Math.sin(toRadians(-direction)) * magnitude;
    return ( new Vector(x, y) );
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// SEGMENT -----------------------------------------------------------------------------------------------

// Constructs line segment from two Vectors as endpoints
function Segment(pos1, pos2) {
    this.pos1 = pos1;
    this.pos2 = pos2;
}

// Constructs line segment over a Vector, given a position Vector
Segment.prototype.constructFromVector = function(pos, vec) {
    let temp = new Vector(0,0);
    temp.add(pos);
    temp.add(vec);

    this.pos1 = pos;
    this.pos2 = temp;
}

Segment.prototype.getPos1 = function() {
    return this.pos1;
}
Segment.prototype.getPos2 = function() {
    return this.pos2;
}
// Returns a Vector the same length of the segment, from pos1 to pos2
Segment.prototype.getVector = function() {
    return new Vector(this.pos2.getX() - this.pos1.getX(), this.pos2.getY() - this.pos1.getY());
}
Segment.prototype.getMagnitude = function() {
    return this.getVector().getMagnitude();
}
Segment.prototype.toString = function() {
    return "Endpoints of segment are " + this.pos1 + " and " + this.pos2;
}

// CHANGESPOSVEL ---------------------------------------------------------------------------------------------

function ChangesPosVel() {
    this.pos = { instant: new Vector(0,0), delta: new Vector(0,0) };
    this.vel = { instant: new Vector(0,0), delta: new Vector(0,0) };
}

ChangesPosVel.prototype.getPosIns = function() {
    return this.pos.instant;
}
ChangesPosVel.prototype.getPosDel = function() {
    return this.pos.delta;
}
ChangesPosVel.prototype.getVelIns = function() {
    return this.vel.instant;
}
ChangesPosVel.prototype.getVelDel = function() {
    return this.vel.delta;
}
ChangesPosVel.prototype.setVelDel = function(velDel) {
    this.vel.delta = velDel;
}
ChangesPosVel.prototype.setPosDel = function(posDel) {
    this.pos.delta = posDel;
}
ChangesPosVel.prototype.add = function(other) {
    this.addPosIns(other.getPosIns());
    this.addPosDel(other.getPosDel());
    this.addVelIns(other.getVelIns());
    this.addVelDel(other.getVelDel());
}
ChangesPosVel.prototype.addPosIns = function(change) {
    this.pos.instant.add(change);
}
ChangesPosVel.prototype.addPosDel = function(change) {
    this.pos.delta.add(change);
}
ChangesPosVel.prototype.addVelIns = function(change) {
    this.vel.instant.add(change);
}
ChangesPosVel.prototype.addVelDel = function(change) {
    this.vel.delta.add(change);
}
ChangesPosVel.prototype.toString = function() {
    return this.printPos() + "\n" + this.printVel();
}
ChangesPosVel.prototype.printPos = function() {
    return "Changes in Position --- instant: " + this.pos.instant + " and delta: " + this.pos.delta;
}
ChangesPosVel.prototype.printVel = function() {
    return "Changes in Velocity --- instant: " + this.vel.instant + " and delta: " + this.vel.delta;
}

// RECTANGLE --------------------------------------------------------------------------------------------- 

function Rectangle(position, dimensions) {
    this.position = position;
    this.dimensions = dimensions;
}

Rectangle.prototype.getCenter = function() {
    return new Vector( this.position.getX() + this.width/2,
                       this.position.getY() + this.height/2 )
}
Rectangle.prototype.getPosTL = function() {
    let result = new Vector(0,0);
    result.add(this.position);
    return result;
}
Rectangle.prototype.getPosTR = function() {

}
Rectangle.prototype.getPosBL = function() {
    
}
Rectangle.prototype.getPosBR = function() {
    
}
Rectangle.prototype.getDim = function() {
    return this.dimensions;
}
Rectangle.prototype.getSegmentTop = function() { //ask dad about inheritance
    return new Segment( this.position, new Vector(this.position.getX() + this.dimensions.getX(), this.position.getY()) );
}
Rectangle.prototype.getSegmentRight = function() {
    return new Segment( new Vector(this.position.getX() + this.dimensions.getX(), this.position.getY()),
                        new Vector(this.position.getX() + this.dimensions.getX(), this.position.getY() + this.dimensions.getY()) );
}
Rectangle.prototype.getSegmentBottom = function() {
    return new Segment( new Vector(this.position.getX(), this.position.getY() + this.dimensions.getY()),
                        new Vector(this.position.getX() + this.dimensions.getX(), this.position.getY() + this.dimensions.getY()) );
}
Rectangle.prototype.getSegmentLeft = function() {
    return new Segment( this.position, new Vector(this.position.getX(), this.position.getY() + this.dimensions.getY()) );
}
Rectangle.prototype.setPosition = function(other) {
    this.position = other;
}
Rectangle.prototype.toString = function() {
    return "Position: " + this.getPosTL() + " --- Dimensions: " + this.getDim();
}

// GameObject ---------------------------------------------------------------------------------------------

function GameObject(rectangle, color, velocity, mass) {
    this.rectangle = rectangle;
    this.color = color;
    this.velocity = velocity;
    this.mass = mass;
    this.properties = { 
        collidable: false, 
        collision: { ground: false }
    }
}

GameObject.prototype.getRec = function() {
    return this.rectangle;
}
GameObject.prototype.getPos = function() {
    return this.rectangle.getPosTL();
}
GameObject.prototype.getDim = function() {
    return this.rectangle.getDim();
}
GameObject.prototype.getColor = function() {
    return this.color;
}
GameObject.prototype.getVel = function() {
    return this.velocity;
}
GameObject.prototype.getMass = function() {
    return this.mass;
}
GameObject.prototype.isCollidable = function() {
    return this.properties.collidable;
}
GameObject.prototype.getCollision = function() {
    return this.properties.collision;
}
GameObject.prototype.setCollidable = function(state) {
    this.properties.collidable = state;
}
GameObject.prototype.setCollision = function(type, state) {
    this.properties.collision[type] = state;
}
GameObject.prototype.addVel = function(changeInVelocity) {
    this.velocity.add(changeInVelocity);
}
GameObject.prototype.addPos = function(changeInPosition) {
    this.rectangle.position.add(changeInPosition);
}
GameObject.prototype.behave = function() {
    return new ChangesPosVel();
}
GameObject.prototype.collided = function() {
    return new ChangesPosVel();
}
GameObject.prototype.toString = function() {
    return this.rectangle;
}
