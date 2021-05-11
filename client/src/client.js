import {animate} from './scene.js'

//connect to server
const sock = io();

animate()

//from server
sock.on('message', logChat) //receive chat
sock.on('playerEntered', logNewPlayer)  //receive new player


//DOM elements
const submitNameButton = document.getElementById('submit-name')
const submitChatButton = document.getElementById('send-chat')
const chatWindow = document.getElementById('chat-box-wrapper')
var canvas = document.getElementById('game-canvas')

//Game variables
const player = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    dx: 0,
    dy: 0, 
}


//listeners
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

function openChat() {

    var chatBoxWrapper = document.querySelector('.chat-box-wrapper')
    var chatInput = document.getElementById('chat')

    if (! (document.activeElement === chatInput) ) {
        if (!chatBoxWrapper.style.display) {
            chatBoxWrapper.style.display = 'block'
        } else chatBoxWrapper.style.display = ''
    }
}


function sendPlayerDetails() {

    var name = getSubmitNameText();
    var color = getPlayerColor();
    if (!name) {
        alert('Please enter your name')
        return
    }
    player.name = name;
    player.color = color;

    //remove name input area
    var enterGamePrompt = document.getElementById('enter-game')
    var screenWrapper = document.querySelector('.screen-wrapper')
    enterGamePrompt.style.display = 'none'
    screenWrapper.style.backgroundColor = 'white'

    //submit player to server
    sock.emit('playerDetails', {name:name, color:color});
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

    var text = player.name +  ': ' + chatInput.value
    chatInput.value = ''
    console.log(text)
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

