require("dotenv").config();
const http = require("http");
const exphbs = require("express-handlebars");
const express = require("express");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const Leader = require("../models/leader");

const router = express.Router();
const app = express();
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(express.static(`${__dirname}/../client`));
const server = http.createServer(app);
const io = socketio(server); // socket.io wraps around server. filters out requests related
//                            to socket.io, other request pass to express
// mongodb+srv://cs290kingofspace:kingofspace1234@kingofspace.o5a9z.mongodb.net/leaderboard?retryWrites=true&w=majority
//connect to mongoDB
mongoose.connect("mongodb+srv://cs290kingofspace:kingofspace1234@kingofspace.o5a9z.mongodb.net/leaderboard?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

//test connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDb connection error:"));

router.get("/", function (req, res) {
  res.status(200).render("mainPage", { layout: "main" });
});

router.get("/leaderboard", async function (req, res) {
  try {
    const leaders = await Leader.find({}).lean();
    leaders.sort((a, b) => b.score - a.score);
    res.status(200).render("leaderPage", {
      layout: "leaderBoard",
      leaders: leaders,
    });

    // Leader.find({})
    //   .lean()
    //   .then((result) => {
    //     result.sort((a, b) => b.score - a.score);
    //     res.status(200).render("leaderPage", {
    //       layout: "leaderBoard",
    //       leaders: result,
    //     });
    //   });
  } catch (err) {
    console.log("Catch an error: ", err);
  }
});

const FPS = 30;
const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;
const SHIP_SIZE = 30;

//players object
var players = {};
var deadPlayers = {};

//when new client is connected, this event listener runs and creates 'sock' object
io.on("connection", (sock) => {
  const userId = sock.id;
  players[userId] = {};
  sock.emit("info", userId);
  sock.emit("message", "You are connected");

  //sock.emit sends to ONE client, io.emit sends to ALL clients
  //sock.on receieves from any client
  sock.on("message", (text) => io.emit("message", text));
  sock.on("playerDetails", (player) => processNewPlayer(player));
  sock.on("submitPlayerDataAndLaser", (playerId, x, y, a, laserX, laserY) =>
    addPlayerSceneWithLaser(playerId, x, y, a, laserX, laserY)
  );
  sock.on("playerHit", (playerId) => resetPlayerShip(playerId));
  sock.on("shipDestroyed", (playerId) => addDestroyCount(playerId));

  setInterval(gameUpdate, 1000 / FPS);
  setInterval(scoreUpdate, 3000); //updates every 3 seconds

  sock.on("disconnect", () => {
    console.log(`Player ${players[sock.id].name} has disconnected`);
    delete players[sock.id];
  });
});

//send all scene data, check if player hitTimer is over (respawns if it is)
function gameUpdate() {
  Object.keys(deadPlayers).forEach((id) => {
    deadPlayers[id]--;
    if (deadPlayers[id] < 0) {
      players[id].hit = false;
      delete deadPlayers[id];
    }
  });

  io.emit("drawFullScene", players);
}

//update player scoreboard, emit out leaderboard
function scoreUpdate() {
  var playerScores = [];

  for (let key in players) {
    if (players[key].hasOwnProperty("name")) {
      playerScores.push([players[key].name, players[key].shipsDestroyed]);
    }
  }

  playerScores.sort((first, second) => second[1] - first[1]);

  io.emit("updateScoreboard", playerScores);
}

//executes upon receiving hit from a socket with playername that is hit.
// send result to hit player
function resetPlayerShip(playerId) {
  deadPlayers[playerId] = 100;
  players[playerId].hit = true;
  players[playerId].shipsDestroyed = 0;
  players[playerId].x = Math.floor(Math.random() * (MAP_WIDTH - SHIP_SIZE));
  players[playerId].y = Math.floor(Math.random() * (MAP_HEIGHT - SHIP_SIZE));
  io.to(playerId).emit("spaceshipHit", [
    players[playerId].x,
    players[playerId].y,
  ]);
}

//executes when player lands a shot on another player
function addDestroyCount(playerId) {
  players[playerId].shipsDestroyed++;

  Leader.find({ name: players[playerId].name }).then((leader) => {
    if (!leader[0]) {
      const leader = new Leader({
        name: players[playerId].name,
        score: players[playerId].shipsDestroyed,
      });

      leader.save();
    } else if (players[playerId].shipsDestroyed > leader[0].score) {
      leader[0].score = players[playerId].shipsDestroyed;
      leader[0].save();
    }
  });
}

//populate each player object with lasers and new positions
function addPlayerSceneWithLaser(playerId, x, y, a, laserX, laserY) {
  players[playerId].x = x;
  players[playerId].y = y;
  players[playerId].a = a;
  players[playerId].ready = true;
  players[playerId].laserX = laserX;
  players[playerId].laserY = laserY;
}

//store player and laser object into arrays
//send notification in chat to all players
function processNewPlayer(player) {
  players[player.id].name = player.name;
  players[player.id].hitCount = 0;
  players[player.id].shipsDestroyed = 0;
  players[player.id].destroyCount = 0;

  io.emit("playerEntered", players[player.id]);
}

//check to be sure server is running
server.on("error", (err) => {
  console.error(err);
});

app.use("/", router);

//server needs to listen on port
port = process.env.PORT || 8022;
server.listen(port, function () {
  console.log("Server is listening on port " + port);
});
