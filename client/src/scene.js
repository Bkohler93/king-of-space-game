

function animate() {
    
    const FPS = 60 //fps
    const LASER_SPD = 450 //pixels per second
    const SHIP_SIZE = 30 //ship height in pixels
    const TURN_SPEED = 360 // degrees/second
    const SHIP_THRUST = 5 // acceleration, pixels/second
    const FRICTION = 0.7 // friction coefficient of space (0 = no fric, 1 = lots of frict)
    var shootTimer = 0;
    
    var canvas = document.getElementById('game-canvas')
    var ctx = canvas.getContext("2d")

    var spaceship = newSpaceship()


    //set up event handlers
    document.addEventListener("keydown", (event) => keyDown(event));
    document.addEventListener("keyup", (event) => keyUp(event));

    //game loop
    setInterval(update, 1000 / FPS)


    function keyDown(event) {
        switch(event.code) {
            case 'KeyA':    //rotate left
                spaceship.rot = TURN_SPEED / 180 * Math.PI / FPS
                break
            case 'KeyW':    //thrust forward
                spaceship.thrusting = true;
                break
            case 'KeyD':    // rotate right
                spaceship.rot =  -TURN_SPEED / 180 * Math.PI / FPS
                break
            case 'Space':
                console.log("shoot")
                shootLaser()
                break
        }
    }
    
    function keyUp(event) {
        switch(event.code) {
            case 'KeyA':    // stop rotating left
                spaceship.rot = 0 
                break
            case 'KeyW':    //stop thrust forward
                spaceship.thrusting = false
                break
            case 'KeyD':    //stop rotating right
                spaceship.rot = 0 
                break
            case 'Space':   //allow shoooting again
                break
        }
    }
    
    function newSpaceship() {
        return {
            x: Math.random() * (canvas.width - SHIP_SIZE),
            y: Math.random() * (canvas.height - SHIP_SIZE),
            r: SHIP_SIZE / 2,
            a: 90 / 180 * Math.PI,   //convert to radians
            rot: 0,
            thrusting: false,   //currently thrusting/not
            thrust: {       //magnitude of thrust
                x: 0,
                y: 0
            },
            laser: {},
            shoot: false
        }
    }

    function shootLaser () {
        console.log(shootTimer)
        if (shootTimer === 0) {
            spaceship.laser = {
                x: spaceship.x + 1 * spaceship.r * Math.cos(spaceship.a),
                y: spaceship.y + 1 * spaceship.r * Math.sin(spaceship.a),
                dx: LASER_SPD * Math.cos(spaceship.a) / FPS,
                dy: -LASER_SPD * Math.sin(spaceship.a) / FPS,
            }
            console.log(spaceship.laser.x)
            spaceship.shoot = true;
        }
    }

    function update() {
        //draw spaceship
        ctx.fillStyle = "black"
        ctx.fillRect(0,0,canvas.width, canvas.height);

        // thrust the ship
        if (spaceship.thrusting) {
            spaceship.thrust.x += SHIP_THRUST * Math.cos(spaceship.a) / FPS
            spaceship.thrust.y += SHIP_THRUST * Math.sin(spaceship.a) / FPS
        } else {
            spaceship.thrust.x -= FRICTION * spaceship.thrust.x / FPS
            spaceship.thrust.y -= FRICTION * spaceship.thrust.y / FPS
        }

        //draw ship
        ctx.strokeStyle = "white"
        ctx.lineWidth = SHIP_SIZE / 20
        ctx.beginPath() 
        ctx.moveTo( //nose of the ship
            spaceship.x + spaceship.r * Math.cos(spaceship.a),
            spaceship.y - spaceship.r * Math.sin(spaceship.a)
        )
        ctx.lineTo( //rear left
            spaceship.x - spaceship.r * (Math.cos(spaceship.a) + Math.sin(spaceship.a)),
            spaceship.y + spaceship.r * (Math.sin(spaceship.a) - Math.cos(spaceship.a))
        )
        ctx.moveTo( //nose of the ship
            spaceship.x + spaceship.r * Math.cos(spaceship.a),
            spaceship.y - spaceship.r * Math.sin(spaceship.a)
        )
        ctx.lineTo( //rear right
            spaceship.x - spaceship.r * (Math.cos(spaceship.a) - Math.sin(spaceship.a)),
            spaceship.y + spaceship.r * (Math.sin(spaceship.a) + Math.cos(spaceship.a))
        )
        ctx.stroke()


        //check if fire bullet
        if (shootTimer > 0 && shootTimer < (FPS * 2)) {
            ctx.fillStyle = "salmon"
            ctx.beginPath()
            ctx.arc(spaceship.laser.x, spaceship.laser.y, SHIP_SIZE / 10, 0, Math.PI * 2, false)
            ctx.fill()
        }

        //rotate ship
        spaceship.a += spaceship.rot

        //move ship
        spaceship.x += spaceship.thrust.x
        spaceship.y -= spaceship.thrust.y

        //laser travel
        if (shootTimer <= (FPS * 2) && spaceship.shoot) {
            spaceship.laser.x += spaceship.laser.dx
            spaceship.laser.y += spaceship.laser.dy

            shootTimer++
            if (shootTimer === (FPS * 2)) {
                shootTimer = 0
                spaceship.shoot = false
                delete spaceship.laser
            }
        }
    }
}

export {animate}