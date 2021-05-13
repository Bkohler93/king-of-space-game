const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { isBoolean } = require('util')

//create app
const app = express()

//server from client folder
app.use(express.static(`${__dirname}/../client`))

//add event listener for app
const server = http.createServer(app)
const io = socketio(server) //wrap around server. filter out requests related 
//                            to socketio, other request pass to express

//player array
var players = []
var lasers = []
var numlasers = 0;
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

function gameUpdate() {
    players.forEach(player => {
        if (player.hitCount > 0)
            player.hitCount++
            console.log(`hit count is ${player.hitCount}`)
            if (player.hitCount > 200) {
                player.hitCount = 0
                player.hit = false;
                console.log(`still counting`)
            }
    })
    io.emit('drawFullScene', players, lasers)
}

function resetPlayerShip(playerName) {
    players.forEach(player => {
        if (player.name === playerName  && player.hitCount === 0) {
            player.hit = true
            player.hitCount++;
            io.to(player.id).emit('spaceshipHit')
        }
    })
}

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



function processNewPlayer(player) {
    player.hitCount = 0
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
server.listen(8000, () =>{
    console.log("Server is listening on port 8000...")
})