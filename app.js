const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');
const { title } = require('process');

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "W";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.render("index" , {title: "Chess Game"});
});

io.on("connection", function (uniqueSocket) {
    console.log("connected");

    if(!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "W");
    }
    else if(!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "B");
    }
    else {
        uniqueSocket.emit("spectatorRole");
    }

    uniqueSocket.on("disconnect", function() {
        if(uniqueSocket.id === players.white) {
            delete players.white;
        }
        else if(uniqueSocket.id === players.black) {
            delete players.black;
        }
    });

    uniqueSocket.on("move", (move) => {
        try {
            if(chess.turn() === "W" && uniqueSocket.id === players.white) return;
            if(chess.turn() === "B" && uniqueSocket.id === players.black) return;
                const result = chess.move(move);
                if(result) {
                    currentPlayer = chess.turn();
                    io.emit("move", move);
                    io.emit("boardState", chess.fen());
                } else {
                    console.log("Invalid move :", move);
                    uniqueSocket.emit("invalidMove", move);
                }
            } catch(err) {
                console.log(err);
                uniqueSocket.emit("InvalidMove", move);
            }
        
    });
});



server.listen(3000, function () {
    console.log("Listening on port 3000");
});