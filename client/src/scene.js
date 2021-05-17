import { sock, playerMe} from "./client.js"
import {FPS, LASER_SPD, SHIP_SIZE, TURN_SPEED, SHIP_THRUST, FRICTION, CANVAS_HEIGHT, CANVAS_WIDHT, NUM_STARS, MAP_HEIGHT, MAP_WIDTH, MAX_THRUST, MINI_MAP_SIZE, MINI_MAP_X_OFF, MINI_MAP_Y_OFF} from './const.js'

// const FPS = 30 //fps
// const LASER_SPD = 450 //pixels per second
// const SHIP_SIZE = 30 //ship height in pixels
// const TURN_SPEED = 360 // degrees/second
// const SHIP_THRUST = 5 // acceleration, pixels/second
// const FRICTION = 0.7 // friction coefficient of space (0 = no fric, 1 = lots of frict)
// const CANVAS_HEIGHT = 600
// const CANVAS_WIDHT = 1000


var starX = []
var starY = []
var starRad = []

var canvas = document.getElementById('game-canvas')
var ctx = canvas.getContext('2d')
for (var i = 0; i < NUM_STARS; i++) {
    starX.push(Math.random() * MAP_WIDTH)
    starY.push(Math.random() * MAP_HEIGHT) 
    starRad.push(Math.random() * 1.3)
}


function drawScene(players, lasers) {
    //clear canvas
    ctx.fillStyle = "black"
    ctx.fillRect(0,0,MAP_WIDTH, MAP_HEIGHT);
    ctx.setTransform(1,0,0,1, -(playerMe.x - CANVAS_WIDHT/2),-(playerMe.y - CANVAS_HEIGHT/2)) 
    
    //draw minimap
    ctx.strokeStyle = "white"
    ctx.strokeRect(playerMe.x + MINI_MAP_X_OFF, playerMe.y + MINI_MAP_Y_OFF, 138, 144) // last two numbers dictate end of map x/y direction


    //origin x = -(playerMe.x - canvas_width/2)
    //origin y = -(playerMe.y - canvas_height/2)

        
    for (var i = 0; i < NUM_STARS; i++) {
        ctx.beginPath();
        ctx.arc(starX[i], starY[i], starRad[i], 0, 360);
        ctx.fillStyle = "hsla(200,100%,50%,0.8)";
        ctx.fill();
    }

    //for each player draw ships
    players.forEach( (player) => {
        

        //draw and check for laser hits
        lasers.forEach(laser => {
            if (laser.x < 0 || laser.y < 0) {
                
            }

            else if (laser.name === player.name) {
                ctx.fillStyle = "salmon"
                ctx.beginPath()
                ctx.arc(laser.x, laser.y, 5, 0, Math.PI * 2, false)
                ctx.fill()
            }

            //check if laser hits inside hit boxes
            // if (player.x === laser.x && player.y === laser.y)
            //     console.log('hit')
            else if (!player.hit && player.hitCount === 0) {
                let w = Math.abs(player.x - laser.x)
                let h = Math.abs(player.y - laser.y)
                let d = Math.ceil(Math.sqrt(Math.pow(w,2) + Math.pow(h,2)))
                if (d <= SHIP_SIZE - 4.5) {
                    player.hit = true
                    sock.emit('playerHit', player.name)
                } 
            }
        })

        //check for player collisions
        if (playerMe.name !== player.name){
            let w = Math.abs(player.x - playerMe.x)
            let h = Math.abs(player.y - playerMe.y)
            let d = Math.ceil(Math.sqrt(Math.pow(w,2)) + Math.pow(h,2))
            if (d <= SHIP_SIZE + 20) {
                playerMe.hit = true
                player.hit = true
                sock.emit('playerHit', player.name)
                sock.emit('playerHit', playerMe.name)
            }
        }
        
        let rad = 15
        if (player.name === playerMe.name && !player.hit) {
            ctx.fillStyle = "white"
            ctx.beginPath()
            ctx.arc(
                player.x,
                player.y,
                5, 0, Math.PI * 2, false
            )
            ctx.fill()

        }

        //draw mini map dot
        if (playerMe.name === player.name) {

            ctx.strokeStyle = "white"
            ctx.strokeRect(
                playerMe.x + MINI_MAP_X_OFF +( player.x * MINI_MAP_SIZE /  MAP_WIDTH) - 10,
                playerMe.y + MINI_MAP_Y_OFF + ( player.y * MINI_MAP_SIZE /  MAP_WIDTH) - 6,
                20, 12
            )
        } else {
            ctx.fillStyle = "white"
            ctx.beginPath()
            ctx.arc(
                playerMe.x + MINI_MAP_X_OFF +( player.x * MINI_MAP_SIZE /  MAP_WIDTH),
                playerMe.y + MINI_MAP_Y_OFF + ( player.y * MINI_MAP_SIZE /  MAP_WIDTH),
                3, 0, Math.PI * 2, false
            )
            ctx.fill()
        }


        //draw ship
        if (!player.hit){
            ctx.fillText(player.name, player.x + 20, player.y + 20)
            ctx.strokeStyle = "white"
            ctx.fillStyle = "white" 
            ctx.lineWidth = 2
            ctx.beginPath()  
            ctx.moveTo( //nose of the ship
                player.x + rad * Math.cos(player.a),
                player.y - rad * Math.sin(player.a)
            )
            ctx.lineTo( //rear left
                player.x - rad * (Math.cos(player.a) + Math.sin(player.a)),
                player.y + rad * (Math.sin(player.a) - Math.cos(player.a))
            )
            ctx.moveTo( //nose of the ship
                player.x + rad * Math.cos(player.a),
                player.y - rad * Math.sin(player.a)
            )
            ctx.lineTo( //rear right
                player.x - rad * (Math.cos(player.a) - Math.sin(player.a)),
                player.y + rad * (Math.sin(player.a) + Math.cos(player.a))
            )
            ctx.stroke()   
        }
    })

}


function animate(playerName) {
    
    
    
    var shootTimer = 0;
    var spaceship = newSpaceship()



    //set up event handlers
    document.addEventListener("keydown", (event) => keyDown(event));
    document.addEventListener("keyup", (event) => keyUp(event));

    //listeners
    sock.on('spaceshipHit', () => {
        console.log('received')
        spaceship.x = Math.floor(Math.random() * (MAP_WIDTH - SHIP_SIZE))
        spaceship.y = Math.floor(Math.random() * (MAP_HEIGHT - SHIP_SIZE))
    })

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
            x: Math.floor(Math.random() * (MAP_WIDTH - SHIP_SIZE)),
            y: Math.floor(Math.random() * (MAP_HEIGHT - SHIP_SIZE)),
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
        if (shootTimer === 0) {
            console.log('fire')
            console.log(`thrust xi s ${spaceship.thrust.x} and y is ${spaceship.thrust.y}`)
            spaceship.laser = {
                
                x: spaceship.x + (spaceship.r + 1) * Math.cos(spaceship.a),
                y: spaceship.y - (spaceship.r + 1) * Math.sin(spaceship.a),
                // dx: ((spaceship.dx + LASER_SPD) * Math.cos(spaceship.a)) / FPS,
                // dy: (-(spaceship.dy + LASER_SPD) * Math.sin(spaceship.a)) / FPS,
                dx: (LASER_SPD + Math.abs(spaceship.thrust.x))  * Math.cos(spaceship.a),
                dy: -1 * (LASER_SPD + Math.abs(spaceship.thrust.y)) * Math.sin(spaceship.a)
            }
            console.log(`laser thrust x is ${spaceship.laser.dx} y is ${spaceship.laser.dy}`)
            spaceship.shoot = true;
        }
    }

    function update() {
        
        // thrust the ship
        if (spaceship.thrusting) {
            spaceship.thrust.x += SHIP_THRUST * Math.cos(spaceship.a) / FPS
            spaceship.thrust.y += SHIP_THRUST * Math.sin(spaceship.a) / FPS
        } else {

            spaceship.thrust.x -= FRICTION * spaceship.thrust.x / FPS
            spaceship.thrust.y -= FRICTION * spaceship.thrust.y / FPS
        }

        if (Math.abs(spaceship.thrust.x) > MAX_THRUST) {
            spaceship.thrust.x = (spaceship.thrust.x < 0) ?  -MAX_THRUST : MAX_THRUST
        }
        if (Math.abs(spaceship.thrust.y) > MAX_THRUST) {
            spaceship.thrust.y = (spaceship.thrust.y < 0) ? -MAX_THRUST : MAX_THRUST
        }

        //rotate ship
        spaceship.a += spaceship.rot
        
        //move ship
        spaceship.x += spaceship.thrust.x
        if (spaceship.x < SHIP_SIZE) {
            spaceship.x = SHIP_SIZE
            spaceship.thrust.x = 0;
        }
        else if (spaceship.x > MAP_WIDTH-(CANVAS_WIDHT/2)) {
            spaceship.x = MAP_WIDTH - (CANVAS_WIDHT/2)
            spaceship.thrust.x = 0;
        }
       
        

        spaceship.y -= spaceship.thrust.y
        if (spaceship.y < 0 + SHIP_SIZE) {
            spaceship.y = SHIP_SIZE
            spaceship.thrust.y = 0;
        }

        else if (spaceship.y > MAP_HEIGHT - (CANVAS_HEIGHT/2)){
            spaceship.y = MAP_HEIGHT - (CANVAS_HEIGHT/2) - 1
            spaceship.thrust.y = 0;
        } 

        //laser travel
        if (shootTimer <= (FPS * 2) && spaceship.shoot) {
            shootTimer++
            if (shootTimer === (FPS * 2)) {
                shootTimer = 0
                spaceship.shoot = false
                delete spaceship.laser
            } else {
                spaceship.laser.x += spaceship.laser.dx
                spaceship.laser.y += spaceship.laser.dy
            }
        }
       
        playerMe.x = spaceship.x
        playerMe.y = spaceship.y

        //emit data
        if (shootTimer <= (FPS * 2) && spaceship.shoot) {
            sock.emit('submitPlayerDataAndLaser', playerName, spaceship.x,spaceship.y,
                spaceship.a, spaceship.laser.x, spaceship.laser.y)
        } else {
            sock.emit('submitPlayerDataAndLaser', playerName, spaceship.x, spaceship.y, spaceship.a, -5, -5)
        }
        
    }
}

export {animate, drawScene}