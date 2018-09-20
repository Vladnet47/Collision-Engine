//-------------------------------------SYSTEM------------------------------------//

var events = {
    // list of possible events
    leftArrowDown: false,
    rightArrowDown: false,
    spaceDown: false,

    // checks external inputs from keyboard and mouse
    checkEvents: function() {
        $(document).keydown(function(event) { events.logEvents(event, true); })
        $(document).keyup(function(event) { events.logEvents(event, false); })
    },

    // updates the current states (true or false) of the possible events
    logEvents: function(event, state) {
        let keys = {
            32: function() { events.spaceDown = state },
            37: function() { events.leftArrowDown = state },
            39: function() { events.rightArrowDown = state } 
        }
    
        // Each key on the keyboard has a number code which is stored ih 'event.which'.
        // 'key' is set equal to the function at the 'event.which' index of 'keys'.
        // If 'event.which' index does not exist in 'keys', then the if statement below returns
        // false, since 'key' becomes an undefined function. 
        // Otherwise, if 'event.which' does exist, the if statement returns true and the function stored in 'key' is called.
        let key = keys[event.which];
        if(key)
            key();
    }
};

var systemTime = {
    lastUpdate: Date.now(),

    // calculates the time between frames, in milliseconds
    getDeltaTime: function() {
        let currentUpdate = Date.now();
        let deltaTime = currentUpdate - this.lastUpdate;
        this.lastUpdate = currentUpdate;
    
        return deltaTime;
    }
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
    //Gravity
    if(this.effects.gravity && !this.effects.ground) {
        this.addVelocity(0.1, -90);
    }
    
    this.rectangle.position.add(this.velocity);
}
gameObject.prototype.collide = function() {
}
gameObject.prototype.render = function(context) {
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

function player(x, y, height, width, color) {
    gameObject.call(this, x, y, height, width, color);
}

player.prototype = Object.create(gameObject.prototype);

player.prototype.constructor = player;


player.prototype.act = function() {
    //Movement
    this.velocity.setX(0);
    
    if(events.rightArrowDown) {
        this.velocity.setX(1);
    }
    
    if(events.leftArrowDown) {
        this.velocity.setX(-1);
    }
        
    //Jumping
    if(events.spaceDown && this.effects.ground) {
        this.effects.ground = false;
        this.addVelocity(3, 90);
    }
    
    // Calls the "super" (gameObject) method
    gameObject.prototype.act.call(this);
}





//-----------------------------------COLLISION-------------------------------------//

player.prototype.collide = function(height) {
    gameObject.prototype.collisionLowerBound.call(this, height);
}




// All the different collision engines go here:

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
    let debug = document.getElementById('debug');
    
    let player1 = new player(10, 10, 20, 20, 'rgb(0, 102, 204)');
    player1.effects.gravity = true;

    update();

    function update() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        events.checkEvents();
        
        player1.act();
        
        player1.collide(canvas.height);
        
        //debug.innerHTML = ("Velocity: " + player1.velocity.print());

        console.log(systemTime.getDeltaTime());

        player1.render(context);
        
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



