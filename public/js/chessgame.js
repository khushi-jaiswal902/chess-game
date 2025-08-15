const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
        const squareElement = document.createElement('div');
        squareElement.classList.add('square', (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark');

        squareElement.dataset.row = rowIndex;
        squareElement.dataset.col = squareIndex;

        if(square) {
            const pieceElement = document.createElement("div");
            pieceElement.classList.add("piece", square.color === 'w' ? 'white' : 'black');
            pieceElement.innerText = getPieceUnicode(square);
            pieceElement.draggable = playerRole === square.color;

            pieceElement.addEventListener("dragstart", (e) => {
                if(pieceElement.draggable) {
                    draggedPiece = pieceElement;
                    sourceSquare = {row: rowIndex, col: squareIndex};
                    e.dataTransfer.setData("text/plain", "");
                }
            });

            pieceElement.addEventListener("dragend", (e) => {
                draggedPiece = null;
                sourceSquare = null;
            });

            squareElement.appendChild(pieceElement);
        }
        squareElement.addEventListener("dragover", function(e) {
            e.preventDefault();
        });
        
        squareElement.addEventListener("drop", function(e) {
            e.preventDefault();
            if(draggedPiece) {
            const targetSource = {
                row: parseInt(squareElement.dataset.row),
                col: parseInt(squareElement.dataset.col),
            };

            handleMove(sourceSquare, targetSource);
        }
        });
        boardElement.appendChild(squareElement);

        });
    });

    if(playerRole === 'B') {
        boardElement.classList.add("flipped");
    }
    else {
        boardElement.classList.remove("flipped");
    }
    
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q', // Always promote to queen for simplicity
    };

    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        k: "♔",  // King
        q: "♕",  // Queen
        r: "♖",  // Rook
        b: "♗",  // Bishop
        n: "♘",  // Knight
        p: "♙",  // Pawn
        K: "♔",  // King
        Q: "♕",  // Queen
        R: "♖",  // Rook
        B: "♗",  // Bishop
        N: "♘",  // Knight
        P: "♙",  // Pawn
    
    };

    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function(role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function() {
    playerRole = null; // Spectators cannot move pieces
    renderBoard();
});

socket.on("boardState", function(fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function(move) {
    chess.move(move);
    renderBoard();
});

renderBoard();

