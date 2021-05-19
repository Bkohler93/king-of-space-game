const http = require('http')
const express = require('express')
const socketio = require('socket.io')

//create app
const app = express()

//serve from client folder
app.use(express.static(`${__dirname}/../client`))

//add event listener for app
const server = http.createServer(app)
const io = socketio(server) //wrap around server. filter out requests related 
//                            to socketio, other request pass to express

//player array
var players = []
var lasers = []
var numlasers = 0
var leader
const FPS = 30

function laser(name, x, y) {
    return {
        name:name,
        x:x,
        y:y
    }
}

//when new client is connected, this event listener runs and creates 'sock' object
io.on('connection', (sock) => {
    const userId = sock.id
    sock.emit('info', userId)
    sock.emit('message', 'You are connected')

    //sock.emit sends to ONE client, io.emit sends to ALL clients
    //sock.on receieves
    sock.on('message', (text) => io.emit('message', text))
    sock.on('playerDetails', (player) => processNewPlayer(player))
    sock.on('submitPlayerDataAndLaser', (playerName, x, y, a, laserX, laserY) =>
        addPlayerSceneWithLaser(playerName, x, y, a, laserX, laserY))
    sock.on('playerHit', (playerName) => resetPlayerShip(playerName))
    sock.on('shipDestroyed', (playerName) => addDestroyCount(playerName))

    setInterval(gameUpdate, 1000 / FPS)

    sock.on('disconnect', () => {
        let index = 0
        players.forEach((player) => {
            if (player.id === sock.id) {
                console.log (`Player ${player.name} has disconnected`)
                players.splice(index, 1)
                lasers.splice(index, 1)
            }
            index++
        })
    })        
})

//send all scene data, check if player hitTimer is over (respawns if it is)
function gameUpdate() {
    var maxHits = 0;
    players.forEach(player => {
        if (player.hitCount > 0) {
            player.hitCount++
            if (player.hitCount > 200) {
                player.hitCount = 0
                player.hit = false;
            }
        }

        if (player.destroyCount > 0) {
            player.destroyCount++
            if (player.destroyCount > 200) {
                player.destroyCount = 0
            }
        }
        if (player.shipsDestroyed > maxHits) {
            maxHits = player.shipsDestroyed;
            leader = player
        }
    })
    
    if (leader && leader.shipsDestroyed === 0) {
        leader =  null
    }

    io.emit('drawFullScene', players, lasers, leader)
}

//executes upon receiving hit from a socket with playername that is hit. 
// send result to hit player
function resetPlayerShip(playerName) {
    
    players.forEach(player => {
        if (player.name === playerName  && player.hitCount === 0) {
            player.hit = true
            player.shipsDestroyed = 0 //reset killstreak
            player.hitCount++;
            io.to(player.id).emit('spaceshipHit')
        }
    })
}

//executes when player lands a shot on another player
function addDestroyCount(playerName) {

    players.forEach(player => {
        if (player.name === playerName && player.destroyCount === 0) {
            player.shipsDestroyed++
            player.destroyCount++
        }
    })
}
//populate each player object with lasers and new positions
function addPlayerSceneWithLaser(playerName, x, y, a, laserX, laserY) {
    players.forEach(player => {
        if (player.name === playerName) {
            player.x = x
            player.y = y
            player.a = a
            player.ready = true
            lasers.forEach(laser => {
                if (laser.name === player.name) {
                    laser.x = laserX
                    laser.y = laserY
                }
            })
        }
    })
}


//store player and laser object into arrays
//send notification in chat to all players
function processNewPlayer(player) {
    player.hitCount = 0
    player.shipsDestroyed = 0
    player.destroyCount = 0
    players.push(player)
    var newLaser = laser(player.name, -5, -5)
    lasers.push(newLaser)
    io.emit('playerEntered', player)
}

//check to be sure server is running
server.on('error', (err) => {
    console.error(err)
})

//server needs to listen on port 
server.listen(process.env.PORT || 8021, () =>{
    console.log("Server is listening on port 8021...")
})