import {animate, drawScene} from './scene.js'

//connect to server
const sock = io();

//Game variables
const playerMe = {name: ""}

//from server
sock.on('message', logChat) //receive chat
sock.on('playerEntered', logNewPlayer)  //receive new player
sock.on('drawFullScene', drawScene) //draw scene with all players
sock.on('info', registerId) 

//DOM elements
const submitNameButton = document.getElementById('submit-name')
const submitChatButton = document.getElementById('send-chat')
const orangeButton = document.getElementById('submit-orange')
const greenButton = document.getElementById('submit-green')
const blueButton = document.getElementById('submit-blue')
var canvas = document.getElementById('game-canvas')
var color = 0

//listeners
window.addEventListener('keydown', event => {
    if (event.code === 'Space')
        event.preventDefault()
})

submitChatButton.addEventListener('click', submitChat)
submitNameButton.addEventListener('click', sendPlayerDetails)
orangeButton.addEventListener('click', setOrange)
greenButton.addEventListener('click', setGreen)
blueButton.addEventListener('click', setBlue)

function setOrange() {
   playerMe.color = "orange"
   console.log("== playerMe.color:", playerMe.color)
   orangeButton.style.backgroundColor = "orange"
   greenButton.style.backgroundColor = "#efefef"
   blueButton.style.backgroundColor = "#efefef"
}

function setGreen() {
   playerMe.color = "green"
   console.log("== playerMe.color:", playerMe.color)
   orangeButton.style.backgroundColor = "#efefef"
   greenButton.style.backgroundColor = "green"
   blueButton.style.backgroundColor = "#efefef"
}

function setBlue() {
   playerMe.color = "#3486eb"
   console.log("== playerMe.color:", playerMe.color)
   orangeButton.style.backgroundColor = "#efefef"
   greenButton.style.backgroundColor = "#efefef"
   blueButton.style.backgroundColor = "#3486eb"
}

function sendPlayerDetails() {

    var name = getSubmitNameText();
    console.log("playerMe.color:", playerMe.color)
    
    if (!name) {
        alert('Please enter your name and color')
        return
    }
    else if(playerMe.color != "orange" && playerMe.color != "green" && playerMe.color != "#3486eb") {
       alert('Please enter your name and color')
       return
    }
    playerMe.name = name;
    playerMe.hit = false;
    
    //remove name input area
    var enterGamePrompt = document.getElementById('enter-game')
    var screenWrapper = document.querySelector('.screen-wrapper')
    enterGamePrompt.style.display = 'none'
    screenWrapper.style.backgroundColor = 'white'

    //submit player to server
    sock.emit('playerDetails', playerMe);
    animate(playerMe.id)
}

function getSubmitNameText() {
    return document.getElementById('name').value;
}

function submitChat() {
    var chatInput = document.getElementById('chat')
    if (!chatInput.value) return

    var text = playerMe.name +  ': ' + chatInput.value
    chatInput.value = ''
    sock.emit('message', text)
}


function logChat(text) {
    
    const chatList = document.getElementById('chats')
    const newChat = document.createElement('li')
    newChat.textContent = text

    chatList.appendChild(newChat)
    var chatHeight = chatList.scrollHeight
    
    //show most recent chat
    chatList.scrollTo(0, chatHeight)
}

function logNewPlayer(player) {

    const newPlayerMessage = document.createElement('li')
    const chatList = document.getElementById('chats')
    newPlayerMessage.textContent = `${player.name} has connected.`
    newPlayerMessage.style.color = String(player.color);
    chatList.appendChild(newPlayerMessage)
    chatList.scrollTop = parent.scrollHeight
}

function registerId(userId) {
    playerMe.id = userId
    console.log(`user id is ${userId}`)
}


export {sock, playerMe}
