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
        this._duration = duration;
    }

    reset(duration) {
        this._duration = duration;
    }

    increment(change) {
        if (!isNaN(this._duration)) {
            this._duration -= change;
            return this._duration > 0;
        }
        return true;
    }
}

function updateDeltaT() {
    let currentTime = Date.now();
    deltaT = (currentTime - lastUpdate) / 1000;
    lastUpdate = currentTime;
}

var lastUpdate = Date.now();
var deltaT = 0;

var pause = false;

// ############################################ GAME LOOP ############################################ //

$(document).ready(function() {
    let canvas = initCanvas();
    let context = canvas.getContext('2d');
    
    let envir = new Environment();
    let init = new Initialization(envir, canvas);
    init.general();

    // let arr = [0, 1, 2, ,4, 5,6,7,8,9,10];
    // let indeces = [1,3,6];
    // console.log(arr[indeces]);
    loop();

    function loop() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        // get deltaTime and keyboard events
        updateDeltaT();
        events.checkEvents();

        // press space to unpause
        if (pause && events.spaceDown) { 
            pause = false;
        }

        // environment only updates if it isn't paused
        if (!pause) {
            envir.update();
        }
        envir.render(context);
        requestAnimationFrame(loop);

        try {
            
        } catch (err) {
            console.log( err.message );
        } finally {
            
        }        
    }
})

function initCanvas() {
    let canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    return canvas;
}