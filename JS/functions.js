// returns true if the value is defined
function defined(value) {
    return (typeof value !== "undefined");
}

// Returns the value rounded to the nearest decimal
function round(value, decimal) {
    return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
}

// Returns 1 if value is positive, -1 if negative and 0 if equal to zero
function getSign(value) {
    let sign = 0;
    if(value != 0) {
        sign = value / Math.abs(value);
    }
    return sign;
}

// Returns the distance between two points, given as vectors
function distance(x1, y1, x2, y2) {
    return magnitude(x1 - x2, y1- y2);
}

function magnitude(x, y) {
    return Math.sqrt( Math.pow(x, 2) + Math.pow(y, 2) );
}

// returns the angle in degrees between the two given vectors
// function angleVector(vec1, vec2) {
//     return ()
// }

// Rounds vector components to a decimal
function vectorRound(vec, decimal) {
    return new Vector( round( vec.x, decimal ), round( vec.y, decimal ) );
}

// Returns a new vector that is 'vec * scalar'
function multiplyVector(vec, scalar) {
    return new Vector( vec.x * scalar, vec.y * scalar );
}

// projects v1 onto v2
function projectVector(v1, v2) {
    let dot = v1.x * v2.x + v1.y * v2.y;
    let projection = dot / ( Math.pow(v2.x, 2) + Math.pow(v2.y, 2) ); 
    return new Vector(v2.x * projection, v2.y * projection);
}

// Returns the two dimensional cross product of given vectors
function vectorCross (vec1, vec2) {
    return vec1.x * vec2.y - vec1.y * vec2.x;
}

// Returns a Vector with x and y components calculated from mag and direction.
// Direction is given in degrees
function vectorToXY(mag, direction) {
    let x = Math.cos(toRadians(direction)) * mag;
    let y = Math.sin(toRadians(-direction)) * mag;
    return ( new Vector(x, y) );
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Given two ranges, returns true if ranges overlap
// Does not matter which is min and which is max
// Endpoints count as overlap
function rangeOverlap(min1, max1, min2, max2) {
    return( Math.min(min1, max1) <= Math.max(min2, max2) && Math.max(min1, max1) >= Math.min(min2, max2) );
}

// Returns true if segments fall within eachother's x-range and y-range
// Note: this does not necesarily mean they intersect
function segSegInRange(seg1, seg2) {
    return rangeOverlap( seg1.pos1.y, seg1.pos2.y, seg2.pos1.y, seg2.pos2.y ) && rangeOverlap( seg1.pos1.x, seg1.pos2.x, seg2.pos1.x, seg2.pos2.x );

}

// Returns point of intersection if two segments intersect, and false if they don't
function segSegIntersect(seg1, seg2) {
    let a = vectorDiff(seg2.pos1, seg1.pos1),
        b = vectorCross(seg1.vector, seg2.vector),
        num = vectorCross(a, seg1.vector);
        
    if (b == 0 && num == 0) {
        return false; // parallel and intersecting
    } else {
        t = vectorCross(a, multiplyVector(seg2.vector, -b)), // a x v2 / b
        u = vectorCross(a, multiplyVector(seg1.vector, -b)); // a x v1 / b

        if( 0 <= t && t <= 1 && 0 <= u && u <= 1 ) {
            let intersection = new Vector(0,0);
            intersection.add( seg1.pos1 );
            intersection.add( multiplyVector(seg1.vector, t) );
            return intersection; // not parallel and intersecting
        }
    }
    return false;

    // source 
        // https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
        // https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
}

function recSegIntersect(rec, seg) {
    let top = rec.segTop;
    let side = rec.segRight;
    if( segOverlapX(top, seg) && segOverlapY(side, seg) ) {
        return true;
    }
    return false;
}

function recRecIntersect(rec1, rec2) {
    let top1 = rec1.segTop;
    let side1 = rec1.segRight;
    let top2 = rec2.segTop;
    let side2 = rec2.segRight;

    if( segOverlapX(top1, top2) && segOverlapY(side1, side2) ) {
        return true;
    }
    return false;
}

function drawRect(context, gameObject) {
    context.fillStyle = gameObject.color;
    context.fillRect(gameObject.pos.x, 
                     gameObject.pos.y, 
                     gameObject.dim.x, 
                     gameObject.dim.y);
}

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


