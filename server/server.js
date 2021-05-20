const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const FPS = 30

//create app
const app = express()

//serve from client folder
app.use(express.static(`${__dirname}/../client`))

//add event listener for app
const server = http.createServer(app)
const io = socketio(server) //wrap around server. filter out requests related 
//                            to socketio, other request pass to express

//players object
var players = {}
var deadPlayers ={}


//when new client is connected, this event listener runs and creates 'sock' object
io.on('connection', (sock) => {
    const userId = sock.id
    players[userId] = {}
    sock.emit('info', userId)
    sock.emit('message', 'You are connected')

    //sock.emit sends to ONE client, io.emit sends to ALL clients
    //sock.on receieves
    sock.on('message', (text) => io.emit('message', text))
    sock.on('playerDetails', (player) => processNewPlayer(player))
    sock.on('submitPlayerDataAndLaser', (playerId, x, y, a, laserX, laserY) =>
        addPlayerSceneWithLaser(playerId, x, y, a, laserX, laserY))
    sock.on('playerHit', (playerId) => resetPlayerShip(playerId))
    sock.on('shipDestroyed', (playerId) => addDestroyCount(playerId))

    setInterval(gameUpdate, 1000 / FPS)

    sock.on('disconnect', () => {
        console.log(`Player ${players[sock.id].name} has disconnected`)
        delete players[sock.id]

    })        
})

//send all scene data, check if player hitTimer is over (respawns if it is)
function gameUpdate() {

    Object.keys(deadPlayers).forEach(id => {
        deadPlayers[id]--
        if (deadPlayers[id] < 30) {
            players[id].hit = false
            delete deadPlayers[id]
        }
    })

    io.emit('drawFullScene', players)
}

//executes upon receiving hit from a socket with playername that is hit. 
// send result to hit player
function resetPlayerShip(playerId) {

    deadPlayers[playerId] = 30
    players[playerId].hit = true
    players[playerId].shipsDestroyed = 0
    io.to(playerId).emit('spaceshipHit')
}

//executes when player lands a shot on another player
function addDestroyCount(playerId) {

    players[playerId].shipsDestroyed++
}
//populate each player object with lasers and new positions
function addPlayerSceneWithLaser(playerId, x, y, a, laserX, laserY) {
    players[playerId].x = x
    players[playerId].y = y
    players[playerId].a = a
    players[playerId].ready = true
    players[playerId].laserX = laserX
    players[playerId].laserY = laserY
}


//store player and laser object into arrays
//send notification in chat to all players
function processNewPlayer(player) {
    players[player.id].name = player.name
    players[player.id].hitCount = 0
    players[player.id].shipsDestroyed = 0
    players[player.id].destroyCount = 0

    io.emit('playerEntered', players[player.id])
}

//check to be sure server is running
server.on('error', (err) => {
    console.error(err)
})

//server needs to listen on port 
server.listen(process.env.PORT || 8022, () =>{
    console.log("Server is listening on port 8022...")
})