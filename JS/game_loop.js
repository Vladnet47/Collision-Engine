var events = {
    // list of possible events
    leftArrowDown: false,
    rightArrowDown: false,
    spaceDown: false,
    aDown: false,
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
            65: function() { events.aDown = state },
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

var systemTime = {
    lastUpdate: Date.now(),

    // calculates the time between frames, in seconds
    getDeltaTime: function() {
        let currentUpdate = Date.now();
        let deltaTime = currentUpdate - systemTime.lastUpdate;
        systemTime.lastUpdate = currentUpdate;
    
        return deltaTime / 1000;
    },
}

// ############################################ GAME LOOP ############################################ //

$(document).ready(function() {
    let canvas = initCanvas();
    let context = canvas.getContext('2d');
    
    let envir = new Environment(canvas);
    envir.init1();

    loop();

    function loop() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        let deltaTime = systemTime.getDeltaTime();
        events.checkEvents();

        try {
            envir.update(deltaTime);
            envir.render(context);
        } catch (err) {
            console.log( err.message );
        } finally {
            requestAnimationFrame(loop);
        }

        // let seg1 = new Segment(new Vector(0,0), new Vector(1,0));
        // let seg2 = new Segment(new Vector(1,0), new Vector(2,0));

        // let seg3 = new Segment(new Vector(0,0), new Vector(2,0));
        // let seg4 = new Segment(new Vector(1,0), new Vector(5,9));

        // let seg5 = new Segment(new Vector(0,0), new Vector(2,2));
        // let seg6 = new Segment(new Vector(0,1), new Vector(1,2));
        
        // let res1 = segSegIntersect(seg1, seg2);
        // let res2 = segSegIntersect(seg3, seg4);
        
        // if(res1) {
        //     console.log(res1);
        // }
        // if (res2) {
        //     console.log(res2);
        // }
    }
})

function initCanvas() {
    let canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    return canvas;
}