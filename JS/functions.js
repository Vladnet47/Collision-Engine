'use strict';

// returns true if the value is defined
function defined(value) {
    return (typeof value !== "undefined");
}

// Returns the value rounded to the nearest decimal
function round(value, decimal) {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
}

// Returns the distance between two points, given as vectors
function distance(v1, v2) {
    return magnitude(v1.x - v2.x, v1.y - v2.y);
}

function angleDxDy(dx, dy) {
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    return -((360 + angle) % 360);
}

// returns magnitude of hypotenuse, given sides x and y of a right angle triangle
function magnitude(x, y) {
    return Math.sqrt( Math.pow(x, 2) + Math.pow(y, 2) );
}

// returns a vector of magnitude and angle, in degrees
function vectorToXY(magnitude, angle) {
    let x = Math.cos( toRadians(angle) ) * magnitude;
    let y = Math.sin( toRadians(-angle) ) * magnitude;
    return new Vector(x, y);
}

// multiplies vector by a scalar
function multiplyVector(v1, scalar) {
    return (defined(v1)) ? new Vector( v1.x * scalar, v1.y * scalar ) : v1;
}

// projects v1 onto v2
function projectVector(v1, v2) {
    let projection = vectorDot(v1, v2) / ( Math.pow(v2.x, 2) + Math.pow(v2.y, 2) ); 
    return multiplyVector(v2, projection);
}

// returns two dimensional dot product of two vectors
function vectorDot (v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

// converts from radians to degrees
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// draws a rectangle if gameObject has bounding rectangle
function drawRect(context, gameObject) {
    context.fillStyle = gameObject.color;
    context.fillRect(gameObject.pos.x, 
                     gameObject.pos.y, 
                     gameObject.dim.x, 
                     gameObject.dim.y);
}

// draws a cicrle if gameObject has bounding circle
function drawCirc(context, gameObject) {
    context.beginPath();
    context.arc(gameObject.x, gameObject.y, gameObject.rad, 0, 2 * Math.PI, false);
    context.fillStyle = gameObject.color;
    context.fill();
}

function drawLine(context, Vector) {
    context.moveTo(0,0);
    context.lineTo(Vector.x, Vector.y);
    context.stroke();
}


