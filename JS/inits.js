class Initialization {
    constructor(envir, canvas) {
        this._environment = envir;
        this._canvas = canvas;
    }

    // modify everything here
    general() {
        let objects = this._test1();
        let engine = new NarrowCollisionEngine();
        engine.setBoundingRect(0, 0, this._canvas.width, this._canvas.height);
        let gravity = true;
        let pauseOn = true;

        this._environment.init(objects, engine, gravity, pauseOn);
    }

    _test1() {
        let objects = [];

        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 100);
        player.collidable = true;
        player.bound = true;
        player.lifespan.reset(3);

        let gam = this._createTestObject(new Vector(400, 400), new Vector(0,0), 'rgb(51, 204, 51)', 120, 1000000);

        objects.push(player);
        objects.push(gam);

        return objects;
    }

    _test2() {
        let objects = [];

        let gam1 = this._createTestObject2(new Vector(100, 400), new Vector(50, 0), 50, 1);
        let gam2 = this._createTestObject2(new Vector(500, 400), new Vector(-50, 0), 50, 1);
        let gam3 = this._createTestObject2(new Vector(300, 400), new Vector(0, 0), 50, 1);
        let gam4 = this._createTestObject2(new Vector(300, 200), new Vector(0, 50), 50, 1);
        let gam5 = this._createTestObject2(new Vector(700, 250), new Vector(-100, 0), 50, 1);
        let gam6 = this._createTestObject2(new Vector(100, 100), new Vector(30, 100), 50, 1);
        let gam7 = this._createTestObject2(new Vector(800, 150), new Vector(0, 50), 50, 1);
        let gam8 = this._createTestObject2(new Vector(800, 450), new Vector(0, -50), 50, 1);

        this.objects.push(gam1);
        this.objects.push(gam2);
        this.objects.push(gam3);
        this.objects.push(gam4);
        this.objects.push(gam5);
        this.objects.push(gam6);
        this.objects.push(gam7);
        this.objects.push(gam8);

        return objects;
    }

    _test3() {
        let objects = [];

        let player = new Player(new Circle(new Vector(430, 100), 30), 'rgb(0, 153, 255)', new Vector(0, 0), 20);
        player.collidable = true;

        let gam1 = this._createTestObject2(new Vector(100, 400), new Vector(50, 0), 30, 10);
        let gam2 = this._createTestObject2(new Vector(500, 400), new Vector(-50, 0), 30, 10);
        let gam3 = this._createTestObject2(new Vector(300, 400), new Vector(0, 0), 60, 100);
        let gam4 = this._createTestObject2(new Vector(300, 200), new Vector(0, 50), 10, 5);
        let gam5 = this._createTestObject2(new Vector(700, 250), new Vector(-200, 0), 40, 80);
        let gam6 = this._createTestObject2(new Vector(100, 100), new Vector(30, 100), 40, 80);
        let gam7 = this._createTestObject2(new Vector(800, 150), new Vector(0, 50), 100, 300);
        let gam8 = this._createTestObject2(new Vector(800, 450), new Vector(0, -50), 60, 100);

        this.objects.push(player);
        this.objects.push(gam1);
        this.objects.push(gam2);
        this.objects.push(gam3);
        this.objects.push(gam4);
        this.objects.push(gam5);
        this.objects.push(gam6);
        this.objects.push(gam7);
        this.objects.push(gam8);

        return objects;
    }

    _test4() {
        let objects = [];
        
        let gam1 = this._createTestObject2(new Vector(100, 100), new Vector(50, 50), 30, 10);
        let gam2 = this._createTestObject2(new Vector(500, 100), new Vector(-50, 50), 30, 10);
        let gam3 = this._createTestObject2(new Vector(100, 500), new Vector(50, -50), 30, 10);
        let gam4 = this._createTestObject2(new Vector(500, 500), new Vector(-50, -50), 30, 10);

        this.objects.push(gam1);
        this.objects.push(gam2);
        this.objects.push(gam3);
        this.objects.push(gam4);

        return objects;
    }

    _test5() {
        let objects = [];

        let gam1 = this._createTestObject2(new Vector(500, 300), new Vector(0, 1), 10, 400);
        let gam2 = this._createTestObject2(new Vector(525, 300), new Vector(0, 1), 10, 400);
        let gam3 = this._createTestObject2(new Vector(100, 300), new Vector(5000, 0), 10, 5);

        this.objects.push(gam1);
        this.objects.push(gam2);
        this.objects.push(gam3);

        return objects;
    }

    _createTestObject(position, velocity, color, size, mass) {
        let obj = new GameObject(new Circle(position, size), 'rgb(51, 204, 51)', velocity, mass);
        obj.collidable = true;
        //obj.bound = false;

        return obj;
    }
}