//-------------------------------------SYSTEM------------------------------------//

var events = {
    leftArrowDown: false,
    rightArrowDown: false,
    spacePressed: false
}
// checks all necesary external inputs, such as keys and mouse
function checkEvents() {
    $(document).keydown(function(event) { logEvents(event, true); })
    $(document).keypress(function(event) { logEvents(event, true); })
    $(document).keyup(function(event) { logEvents(event, false); })
}

// updates the current states (true or false) of the events in the game object section
function logEvents(event, state) {
    let heldDown = {
        32: function() { events.spacePressed = state },
        37: function() { events.leftArrowDown = state },
        39: function() { events.rightArrowDown = state }
        
    }
//    
//    let pressed = {
//    }
    
    // checks to see if a key exists. If the key is found, the function is returned and run. If
    // the key is not found, the return becomes 'undefined' which makes the if statement condition false
    keyHeldDown = heldDown[event.which]
    //keyPressed = pressed[event.which]
    
    if(keyHeldDown)
        keyHeldDown();
//    if(keyPressed) {
//        keyPressed();
//    }
        
}









//---------------------------BASIC OBJECT PROPERTIES-----------------------------//

function vector(x, y) {
    this.x = x;
    this.y = y;
}
vector.prototype.add = function(other) {
    this.x += other.getX();
    this.y += other.getY();
}
vector.prototype.set = function(replacement) {
    this.setX(replacement.getX());
    this.setY(replacement.getY());
}
vector.prototype.setX = function(x) {
    this.x = x;
}
vector.prototype.setY = function(y) {
    this.y = y;
}
vector.prototype.getX = function() {
    return this.x;
}
vector.prototype.getY = function() {
    return this.y;
}
vector.prototype.print = function() {
    return ("(" + Math.round(this.getX()) + ", " + Math.round(this.getY()) + ")");
}

function rectangle(position, height, width, color) {
    // physical attributes
    this.position = position;
    this.height = height;
    this.width = width;
    this.color = color;
    
    // functions
    this.checkCollision = function(){};
}

function gameObject(x, y, height, width, color) {
    this.rectangle = new rectangle(new vector(x, y), height, width, color);
    this.velocity = new vector(0,0);
    this.effects = {
        gravity: false,
        ground: false
    };
}
gameObject.prototype.setVelocity = function(speed, direction) {
    this.velocity.set(convertToXYVector(speed, direction));
}
gameObject.prototype.addVelocity = function(acceleration, direction) {
    this.velocity.add(convertToXYVector(acceleration, direction));
}
gameObject.prototype.act = function() {
    
    //Movement
    this.velocity.setX(0);
    if(events.rightArrowDown) {
        this.velocity.setX(1);
    }
    if(events.leftArrowDown) {
        this.velocity.setX(-1);
    }
    
    //Jumping
    if(events.spacePressed && this.effects.ground) {
        this.effects.ground = false;
        this.addVelocity(3, 90);
    }
    
    //Gravity
    if(this.effects.gravity && !this.effects.ground) {
        this.addVelocity(0.1, -90);
    }
    
    this.rectangle.position.add(this.velocity);
}
gameObject.prototype.collide = function(height) {
    this.collisionLowerBound(height);
}
gameObject.prototype.draw = function(context) {
    drawRect(context, this.rectangle);
}


function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function convertToXYVector(speed, direction) {
    let x = Math.cos(toRadians(direction)) * speed;
    // since vertical axis is flipped in canvas, the negative sign corrects input direction
    let y = Math.sin(toRadians(-direction)) * speed;
    return (new vector(x,y));
}











//-------------------------------------ACTION-------------------------------------//






//-----------------------------------COLLISION-------------------------------------//

// prevents object from falling below the bottom of the screen
gameObject.prototype.collisionLowerBound = function(height) {
    if((this.rectangle.position.getY() + this.rectangle.height) > height) {
        
        // raise position
        this.rectangle.position.set(new vector(this.rectangle.position.getX(), height-this.rectangle.height))
        
        // reset motion
        this.velocity.setY(0);
        
        // signal that player has reached ground
        this.effects.ground = true;
    }
}






//------------------------------------DRAWING--------------------------------------//

function drawRect(context, rectangle) {
    setFillColor(context, rectangle.color);
    context.fillRect(rectangle.position.getX(), rectangle.position.getY(), rectangle.height, rectangle.width);
}

function drawLine(context, vector) {
    context.moveTo(0,0);
    context.lineTo(vector.x, vector.y);
    context.stroke();
}

// takes parameters in readable form for 'context' object - a string
// (for example) color = "rgb(0, 102, 204)"
function setFillColor(context, color) {
    context.fillStyle = color;
}









//################################## GAME LOOP ###################################//

$(document).ready(function() {
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    
    let player = new gameObject(10, 10, 20, 20, 'rgb(0, 102, 204)');
    player.effects.gravity = true;

    update();

    function update() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        checkEvents();
        
        player.act();
        
        //console.log(player.velocity.print());
        
        player.collide(canvas.height);
        
        //console.log(player.velocity.print());

        player.draw(context);
        
        requestAnimationFrame(update);
    }
})




//window.onload = function() {
// let counter = 0;    
//    
// function callback(timestamp) {
//     console.log(counter);
//     counter++;
//     requestAnimationFrame(callback);
// }
//    
// requestAnimationFrame(callback);
//}



