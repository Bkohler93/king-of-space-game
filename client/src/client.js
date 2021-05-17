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
var canvas = document.getElementById('game-canvas')



//listeners
window.addEventListener('keydown', event => {
    if (event.code === 'Space')
        event.preventDefault()
})


submitChatButton.addEventListener('click', submitChat)
submitNameButton.addEventListener('click', sendPlayerDetails)
document.addEventListener('keydown', event => {
    const chatInput = document.getElementById('chat')

    if (! (document.activeElement === chatInput)) {
        switch(event.code) {
            case 'KeyC':
                openChat()
                break
            
        }
    }
})


/////FUNCTIONS
// function openChat() {

//     var chatBoxWrapper = document.querySelector('.chat-box-wrapper')
//     var chatInput = document.getElementById('chat')

//     if (! (document.activeElement === chatInput) ) {
//         if (!chatBoxWrapper.style.display) {
//             chatBoxWrapper.style.display = 'block'
//         } else chatBoxWrapper.style.display = ''
//     }
// }

function sendPlayerDetails() {

    var name = getSubmitNameText();
    
    if (!name) {
        alert('Please enter your name')
        return
    }
    var color = getPlayerColor();
    playerMe.name = name;
    playerMe.color = color;
    playerMe.hit = false;
    playerMe.hitCount= 0;
    
    //remove name input area
    var enterGamePrompt = document.getElementById('enter-game')
    var screenWrapper = document.querySelector('.screen-wrapper')
    enterGamePrompt.style.display = 'none'
    screenWrapper.style.backgroundColor = 'white'
    //submit player to server
    sock.emit('playerDetails', playerMe);
    animate(name)
}

function getSubmitNameText() {
    return document.getElementById('name').value;
}

function getPlayerColor() {
    
    var color = document.getElementsByName('color')

    for (let i = 0; i < color.length; i++) {
        if (color[i].checked) {
            return color[i].value
        }
    }
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