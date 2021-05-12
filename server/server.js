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
const FPS = 30


//when new client is connected, this event listener runs and creates 'sock' object
io.on('connection', (sock) => {
    var userId = sock.id
    console.log('Player connected')
    sock.emit('message', 'You are connected')

    //sock.emit sends to ONE client, io.emit sends to ALL clients
    //sock.on receieves
    sock.on('message', (text) => io.emit('message', text))
    sock.on('playerDetails', (player, userId) => processNewPlayer(player))
    sock.on('submitPlayerDataAndLaser', (playerName, x, y, a, laserX, laserY) =>
        addPlayerSceneWithLaser(playerName, x, y, a, laserX, laserY))
    sock.on('submitPlayerData', (playerName, x,y,a) => 
        addPlayerSceneNoLaser(playerName, x, y, a))

    setInterval(gameUpdate, 1000 / FPS)

    sock.on('disconnect', () => {
        let index = 0
        players.forEach((player) => {
            if (player.userId = sock.id) {
                console.log (`Player ${player.name} has disconnected`)
                players.splice(index, 1)
            }
            index++
        })
    })        
})

function gameUpdate() {
    io.emit('drawFullScene', players)
}

function addPlayerSceneWithLaser(playerName, x, y, a, laserX, laserY) {
    players.forEach(player => {
        if (player.name === playerName) {
            player.x = x
            player.y = y
            player.a = a
            player.laserX = laserX
            player.laserY = laserY
            player.ready = true
        }
    })
}

function addPlayerSceneNoLaser(playerName, x, y, a) {
    players.forEach(player => {
        if (player.name === playerName) {
            player.x = x
            player.y = y
            player.a = a
        }
    })
}


function processNewPlayer(player, userId) {
    player.userId = userId
    players.push(player)
    console.log('received player details')
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