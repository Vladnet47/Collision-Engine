'use strict';

// GLOBAL VARIABLES

var events = {
    // list of possible events
    leftArrowDown: false,
    rightArrowDown: false,
    upArrowDown: false,
    botArrowDown: false,
    spaceDown: false,
    aDown: false,
    wDown: false,
    sDown: false,
    dDown: false,

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
            39: function() { events.rightArrowDown = state },
            38: function() { events.upArrowDown = state },
            40: function() { events.botArrowDown = state },
            65: function() { events.aDown = state },
            87: function() { events.wDown = state },
            83: function() { events.sDown = state },
            68: function() { events.dDown = state }
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

class Timer {
    constructor(duration) {
        this._duration = duration * 1000;
        this._startTime = lastUpdate;
    }

    reset() {
        this._startTime = lastUpdate;
    }

    set(duration) {
        this._duration = duration * 1000;
        this._startTime = lastUpdate;
    }

    stop() {
        return !isNaN(this._duration) && (lastUpdate - this._startTime >= this._duration);
    }
}

var lastUpdate = Date.now();
var deltaT;

function updateDeltaT() {
    let currentTime = Date.now();
    deltaT = (currentTime - lastUpdate) / 1000;
    lastUpdate = currentTime;
}



var pause = false;

// ############################################ GAME LOOP ############################################ //

$(document).ready(function() {
    // initialize canvas
    let canvas = initCanvas();
    let context = canvas.getContext('2d');
    
    // initialize control and environment
    let control = new Control(canvas);
    let envir = control.load("test");

    events.checkEvents();

    // start the game loop
    loop();

    function loop() {
        if (!defined(envir)) {
            console.log("Environment is not defined");
            return;
        }

        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // get deltaTime and keyboard events
        updateDeltaT();

        // press space to unpause
        if (pause && events.spaceDown) { 
            pause = false;
        }

        // environment only updates if it isn't paused
        if (!pause) {
            envir.update();
        }
        envir.render(context);
        control.spawn();
        //spawn(control, asteroidTimer);
         
        requestAnimationFrame(loop);        
    }
})

function initCanvas() {
    let canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    return canvas;
}