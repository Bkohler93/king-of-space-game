const http = require('http')
const express = require('express')
const socketio = require('socket.io')

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

//when new client is connected, this event listener runs and creates 'sock' object
io.on('connection', (sock) => {
    console.log('Player connected')
    sock.emit('message', 'You are connected')

    //sock.emit sends to ONE client, io.emit sends to ALL clients
    //sock.on receieves
    sock.on('message', (text) => io.emit('message', text))
    sock.on('playerDetails', player => processNewPlayer(player))
})

// //after receiving player name
// io.on('playerDetails', elem => {
//     players.push(elem)
//     console.log('received player details')
//     io.emit('playerEntered', elem);
// })

function processNewPlayer(player) {
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