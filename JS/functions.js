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

// Rounds vector components to a decimal
function vectorRound(vec, decimal) {
    let result = new Vector(0,0);
    result.setX( round( vec.getX(), decimal ) );
    result.setY( round( vec.getY(), decimal ) );
    return result;
}

// Returns a new vector that is 'vec1 + vec2'
function vectorSum(vec1, vec2) {
    let result = new Vector(0,0);
    result.add(vec1);
    result.add(vec2);
    return result;
}

// Returns a new vector that is 'vec1 - vec2'
function vectorDiff(vec1, vec2) {
    return ( vectorSum( vec1, vectorMult(vec2, -1) ) );
}

// Returns a new vector that is 'vec * scalar'
function vectorMult(vec, scalar) {
    let result = new Vector(0,0);
    result.setX( vec.getX() * scalar );
    result.setY( vec.getY() * scalar );
    return result;
}

function vectorDiv(vec, scalar) {
    return ( vectorMult( vec, 1/scalar ) );
}

// Returns the two dimensional cross product of given vectors
function vectorCross (vec1, vec2) {
    return vec1.getX() * vec2.getY() - vec1.getY() * vec2.getX();
}

// Given two ranges, returns true if ranges overlap
// Does not matter which is min and which is max
// Endpoints count as overlap
function rangeOverlap(min1, max1, min2, max2) {
    return( Math.min(min1, max1) <= Math.max(min2, max2) && Math.max(min1, max1) >= Math.min(min2, max2) );
}

// Returns true if segments overlap in the x-direction
function segOverlapX(seg1, seg2) {
    return( rangeOverlap( seg1.getPos1().getX(), seg1.getPos2().getX(), seg2.getPos1().getX(), seg2.getPos2().getX() ) );
}

// Returns true if segments overlap in the y-direction
function segOverlapY(seg1, seg2) {
    return( rangeOverlap( seg1.getPos1().getY(), seg1.getPos2().getY(), seg2.getPos1().getY(), seg2.getPos2().getY() ) );
}

// Returns point of intersection if two segments intersect, and false if they don't
function segSegIntersect(seg1, seg2) {
    let p1 = seg1.getPos1(),
        p2 = seg2.getPos1(),
        v1 = seg1.getVector(),
        v2 = seg2.getVector(),

        a = vectorDiff(p2, p1),
        b = vectorCross(v1, v2),
        num = vectorCross(a, v1);
        
    if (b == 0 && num == 0) {
        return false; // parallel and intersecting
    } else {
        t = vectorCross(a, vectorDiv(v2, b)), // a x v2 / b
        u = vectorCross(a, vectorDiv(v1, b)); // a x v1 / b

        if( 0 <= t && t <= 1 && 0 <= u && u <= 1 ) {
            let intersection = new Vector(0,0);
            intersection.add( p1 );
            intersection.add( vectorMult(v1, t) );
            return intersection; // not parallel and intersecting
        }
    }
    return false;

    // source 
        // https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
        // https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
}

function recSegIntersect(rec, seg) {
    let top = rec.getSegmentTop();
    let side = rec.getSegmentRight();
    if( segOverlapX(top, seg) && segOverlapY(side, seg) ) {
        return true;
    }
    return false;
}

function recRecIntersect(rec1, rec2) {
    let top1 = rec1.getSegmentTop();
    let side1 = rec1.getSegmentRight();
    let top2 = rec2.getSegmentTop();
    let side2 = rec2.getSegmentRight();

    if( segOverlapX(top1, top2) && segOverlapY(side1, side2) ) {
        return true;
    }
    return false;
}

function drawRect(context, gameObject) {
    context.fillStyle = gameObject.getColor();
    context.fillRect(gameObject.getPos().getX(), 
                     gameObject.getPos().getY(), 
                     gameObject.getDim().getX(), 
                     gameObject.getDim().getY());
}

function drawLine(context, Vector) {
    context.moveTo(0,0);
    context.lineTo(Vector.x, Vector.y);
    context.stroke();
}


