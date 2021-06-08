const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.static(`${__dirname}/../client`));
const server = http.createServer(app);
const io = socketio(server); // socket.io wraps around server. filters out requests related
//                            to socket.io, other request pass to express
const uri =
  "mongodb+srv://cs290kingofspace:kingofspace1234@kingofspace.o5a9z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const client = new MongoClient(uri);

const FPS = 30;
//players object
var players = {};
var deadPlayers = {};

//use database
async function main() {
  //can someone store the uri value to the right as environment
  //variable... couldnt get it to workhttps://king-of-space.herokuapp.com/
  try {
    await client.connect();

    //DATABASE INQUIRIES HERE
    // const leaderboard = await findOneListingByName(client);
    // console.log(`== stored leaderboard data:`);
    // console.log(leaderboard);

    await updateLeaderboardExistingScore(client, ["Jenny", 10]);
    await updateLeaderboardNewScore(client, ["brett", 12]);

    await deleteLeaderboardScore(client, "brett");
  } catch (error) {
    console.log(error);
  } finally {
    await client.close();
  }
}
main().catch(console.error);

//C(rud) -- most likely don't need to use this function
async function createListing(client, newListing) {
  const result = await client
    .db("king-of-space")
    .collection("leaderboard")
    .insertOne(newListing);

  console.log(`New listing created with id: ${result.insertedId}`);
}

//c(R)ud
async function storeLeaders(client) {
  const result = await client
    .db("king-of-space")
    .collection("leaderboard")
    .findOne({ name: "leaderboard info" });

  if (result) {
    console.log("== Found 'leaders' in collection 'leaderboard'");
  } else {
    console.log(`== 'leaders' not found`);
  }

  return result.leaders;
}

//cr(U)d
async function updateLeaderboardExistingScore(client, nameAndNewScoreArr) {
  const result = await client
    .db("king-of-space")
    .collection("leaderboard")
    .updateOne(
      { name: "leaderboard info", "leaders.name": nameAndNewScoreArr[0] },
      { $set: { "leaders.$.score": nameAndNewScoreArr[1] } }
    );

  console.log(`${result.matchedCount} document(s) matched query critiera`);
  console.log(`${result.modifiedCount} documents was/were updated`);
}

//cru(D)
async function deleteLeaderboardScore(client, name) {
  const result = await client
    .db("king-of-space")
    .collection("leaderboard")
    .updateOne(
      { name: "leaderboard info" },
      { $pull: { leaders: { name: name } } }
    );

  console.log(`${result.matchedCount} document(s) matched query critiera`);
  console.log(`${result.modifiedCount} documents was/were updated`);
}

async function updateLeaderboardNewScore(client, nameAndScoreArr) {
  const result = await client
    .db("king-of-space")
    .collection("leaderboard")
    .updateOne(
      {
        name: "leaderboard info",
      },
      {
        $push: {
          leaders: { name: nameAndScoreArr[0], score: nameAndScoreArr[1] },
        },
      }
    );

  console.log(`${result.matchedCount} document(s) matched query critiera`);
  console.log(`${result.modifiedCount} documents was/were updated`);
}

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach((db) => {
    console.log(`- ${db.name}`);
  });
  findOneListingByName(client, "leaderboard");
}

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
    if (deadPlayers[id] < 30) {
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
  deadPlayers[playerId] = 30;
  players[playerId].hit = true;
  players[playerId].shipsDestroyed = 0;
  io.to(playerId).emit("spaceshipHit");
}

//executes when player lands a shot on another player
function addDestroyCount(playerId) {
  players[playerId].shipsDestroyed++;
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

//server needs to listen on port
port = process.env.PORT || 8022;
server.listen(port, function () {
  console.log("Server is listening on port " + port);
});

/*server.listen(process.env.PORT || 8022, () =>{
    console.log("Server is listening on port 8022...")
})*/
