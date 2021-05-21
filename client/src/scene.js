import { sock, playerMe} from "./client.js"
import {FPS, LASER_SPD, SHIP_SIZE, TURN_SPEED, SHIP_THRUST, FRICTION, CANVAS_HEIGHT, CANVAS_WIDHT, NUM_STARS, MAP_HEIGHT, MAP_WIDTH, MAX_THRUST, MINI_MAP_SIZE, MINI_MAP_X_OFF, MINI_MAP_Y_OFF, LEADER_OFF_X, LEADER_OFF_Y, SCORE_OFF_X, SCORE_OFF_Y} from './const.js'

var starX = []
var starY = []
var starRad = []

var canvas = document.getElementById('game-canvas')
var ctx = canvas.getContext('2d', { alpha: false})
for (var i = 0; i < NUM_STARS; i++) {
    starX.push(Math.random() * MAP_WIDTH)
    starY.push(Math.random() * MAP_HEIGHT) 
    starRad.push(Math.random() * 1.3)
}


function drawScene(players) {

    //decrease playerMe destroyCounter if previously shot down ship
    if (playerMe.destroyedShip) {
        playerMe.destroyedShip = ((playerMe.destroyCounter--) < 0) ? false : true
    }

    //check for laser hits
    if (!playerMe.destroyedShip) {
        Object.keys(players).forEach(id => {
            let w = Math.abs(players[id].x - players[playerMe.id].laserX)
            let h = Math.abs(players[id].y - players[playerMe.id].laserY)
            let d = Math.ceil(Math.sqrt(Math.pow(w,2) + Math.pow(h,2)))
            if (d <= SHIP_SIZE - 4.5) {
                players[id].hit = true
                playerMe.destroyedShip = true
                playerMe.destroyCounter = 6
                sock.emit('shipDestroyed', playerMe.id)
                sock.emit('playerHit', id)
            }
        })
    }

    //check for collisions
    Object.keys(players).forEach(id => {
        if (id !== playerMe.id) {
            let w = Math.abs(players[id].x - playerMe.x)
            let h = Math.abs(players[id].y - playerMe.y)
            let d = Math.ceil(Math.sqrt(Math.pow(w,2)) + Math.pow(h,2))
            if (d <= SHIP_SIZE + 20) {
                players[playerMe.id].hit = true
                players[id].hit = true
                sock.emit('playerHit', id)
                sock.emit('playerHit', playerMe.id)
            }
        }
    })

    //clear canvas
    ctx.fillStyle = "black"
    ctx.fillRect(0,0,MAP_WIDTH, MAP_HEIGHT);
    ctx.setTransform(1,0,0,1, -(players[playerMe.id].x - CANVAS_WIDHT/2),-(players[playerMe.id].y - CANVAS_HEIGHT/2)) 
    
    //draw minimap
    ctx.strokeStyle = "white"
    ctx.strokeRect(players[playerMe.id].x + MINI_MAP_X_OFF, players[playerMe.id].y + MINI_MAP_Y_OFF, 145, 144) // last two numbers dictate end of map x/y direction

   
    //calculate leader
    var maxShipsDestroyed = 0
    var leader
    Object.keys(players).forEach(id => {

        if(players[id].shipsDestroyed > maxShipsDestroyed) {
            maxShipsDestroyed = players[id].shipsDestroyed
            leader = id
        }
    })

    //draw other players dots on minimap
    Object.keys(players).forEach(id => {
        let miniMapOffX = players[playerMe.id].x + MINI_MAP_X_OFF
        let miniMapOffY = players[playerMe.id].y + MINI_MAP_Y_OFF
        let miniMapScale = MINI_MAP_SIZE / MAP_WIDTH


        if (id === playerMe.id) {
            ctx.beginPath()
            ctx.strokeStyle = 'white'
            ctx.strokeRect(

                miniMapOffX + (players[playerMe.id].x * miniMapScale) - 10,
                miniMapOffY + (players[playerMe.id].y * miniMapScale) - 6,
                20, 12
            )
        } else if (leader && leader === id) {
            
            var crownStartX = miniMapOffX + (players[id].x * miniMapScale) - 5
            var crownStartY = miniMapOffY + (players[id].y * miniMapScale)
            ctx.strokeStyle = 'gold'
            ctx.beginPath()
            ctx.moveTo(crownStartX, crownStartY)
            ctx.lineTo(crownStartX,crownStartY - 8)
            ctx.lineTo(crownStartX + 2,crownStartY - 5)
            ctx.lineTo(crownStartX + 4,crownStartY - 8)
            ctx.lineTo(crownStartX + 7,crownStartY - 5)
            ctx.lineTo(crownStartX + 9,crownStartY - 8)
            ctx.lineTo(crownStartX + 9,crownStartY)
            ctx.closePath()
            ctx.stroke()

        } else {
            ctx.fillStyle = "white"
            ctx.beginPath()
            ctx.arc(
                miniMapOffX + (players[id].x * miniMapScale),
                miniMapOffY + (players[id].y * miniMapScale),
                3, 0, Math.PI * 2, false
            )
            ctx.fill()
        }
    })
   
  

    
    for (var i = 0; i < NUM_STARS; i++) {
        ctx.beginPath();
        ctx.arc(starX[i], starY[i], starRad[i], 0, 360);
        ctx.fillStyle = "hsla(200,100%,50%,0.8)";
        ctx.fill();
    }

    //draw ships and lasers
    Object.keys(players).forEach(id => {

        //draw lasers
        ctx.fillStyle = 'salmon'
        ctx.beginPath()
        ctx.arc(players[id].laserX, players[id].laserY, 5, 0, Math.PI * 2, false)
        ctx.fill()
        
        
        //draw ships
        if (!players[id].hit) {

            let rad = 15
            let cosAngle = Math.cos(players[id].a)
            let sinAngle = Math.sin(players[id].a)
            let cosAngleAmplitude = rad * Math.cos(players[id].a)
            let sinAngleAmplitude = rad * Math.sin(players[id].a)
            ctx.fillText(players[id].name, players[id].x + 20, players[id].y + 20)
            ctx.beginPath()
            ctx.strokeStyle = "white"
            ctx.fillStyle = "white" 
            ctx.lineWidth = 2
            ctx.moveTo( //nose of the ship
                players[id].x + cosAngleAmplitude,
                players[id].y - sinAngleAmplitude
            )
            ctx.lineTo( //rear left
                players[id].x - rad * (cosAngle + sinAngle),
                players[id].y + rad * (sinAngle - cosAngle)
            )
            ctx.moveTo( //nose of the ship
                players[id].x + cosAngleAmplitude,
                players[id].y - sinAngleAmplitude
            )
            ctx.lineTo( //rear right
                players[id].x - rad * (cosAngle - sinAngle),
                players[id].y + rad * (sinAngle + cosAngle)
            )
            ctx.stroke()
        }   
    }) 

    //write current player's score
    ctx.fillText(`Your current score: ${players[playerMe.id].shipsDestroyed}`, players[playerMe.id].x + SCORE_OFF_X, players[playerMe.id].y - SCORE_OFF_Y)
    
    //write current leader's score
    if (leader) {
        ctx.fillText(`Leader is ${players[leader].name} with ${players[leader].shipsDestroyed}`, players[playerMe.id].x - LEADER_OFF_X, players[playerMe.id].y - LEADER_OFF_Y)
    }
}


function animate(playerId) {
    
    var shootTimer = 0;
    var spaceship = newSpaceship()


    //set up event handlers
    document.addEventListener("keydown", (event) => keyDown(event));
    document.addEventListener("keyup", (event) => keyUp(event));

    //listeners
    sock.on('spaceshipHit', () => {
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
            spaceship.laser = {
                
                x: spaceship.x + (spaceship.r + 1) * Math.cos(spaceship.a),
                y: spaceship.y - (spaceship.r + 1) * Math.sin(spaceship.a),
                dx: (LASER_SPD + Math.abs(spaceship.thrust.x))  * Math.cos(spaceship.a),
                dy: -1 * (LASER_SPD + Math.abs(spaceship.thrust.y)) * Math.sin(spaceship.a)
            }
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
        spaceship.x = Math.floor(spaceship.x)
        if (spaceship.x < CANVAS_WIDHT / 2) {
            spaceship.x = CANVAS_WIDHT / 2
            spaceship.thrust.x = 0;
        } else if (spaceship.x > MAP_WIDTH-(CANVAS_WIDHT/2)) {
            spaceship.x = MAP_WIDTH - (CANVAS_WIDHT/2)
            spaceship.thrust.x = 0;
        }

        spaceship.y -= spaceship.thrust.y
        spaceship.y = Math.floor(spaceship.y)
        if (spaceship.y < CANVAS_HEIGHT / 2) {
            spaceship.y = CANVAS_HEIGHT / 2
            spaceship.thrust.y = 0;
        } else if (spaceship.y > MAP_HEIGHT - (CANVAS_HEIGHT/2)){
            spaceship.y = MAP_HEIGHT - (CANVAS_HEIGHT/2)
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
                spaceship.laser.x = Math.floor(spaceship.laser.x)
                spaceship.laser.y += spaceship.laser.dy
                spaceship.laser.y = Math.floor(spaceship.laser.y)
            }
        }
       
        playerMe.x = spaceship.x
        playerMe.y = spaceship.y
        playerMe.a = spaceship.a
        
        //emit data
        if (shootTimer <= (FPS * 2) && spaceship.shoot) {
            sock.emit('submitPlayerDataAndLaser', playerId, spaceship.x,spaceship.y,
                spaceship.a, spaceship.laser.x, spaceship.laser.y)
        } else {
            sock.emit('submitPlayerDataAndLaser', playerId, spaceship.x, spaceship.y, spaceship.a, -5, -5)
        }
    }
}

export {animate, drawScene}