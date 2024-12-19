const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const gameModeText = document.getElementById('gameMode');
const restartBtn = document.getElementById('restart');
const toggleModeBtn = document.getElementById('toggleMode');
const winnerText = document.getElementById('winnerText');

const WIDTH = 450;
const HEIGHT = 450;
const ROWS = 3;
const COLS = 3;
const SQUARE_SIZE = WIDTH / COLS;

const LINE_COLOR = '#17d6bd';
const CIRCLE_COLOR = '#efebe8';
const CROSS_COLOR = '#424242';
const LINE_WIDTH = 10;

let board = Array.from(Array(ROWS), () => Array(COLS).fill(0)); // 0 = empty, 1 = O, 2 = X
let currentPlayer = 1;
let gameOver = false;
let mode = 'PvAI'; // Modes: PvP or PvAI

// Draw initial board
drawBoard();

// Add Event Listeners
canvas.addEventListener('click', handlePlayerMove);
restartBtn.addEventListener('click', restartGame);
toggleModeBtn.addEventListener('click', toggleGameMode);

function drawBoard() {
	ctx.clearRect(0, 0, WIDTH, HEIGHT);
	// Draw grid lines
	for (let i = 1; i < ROWS; i++) {
		ctx.beginPath();
		ctx.moveTo(0, i * SQUARE_SIZE);
		ctx.lineTo(WIDTH, i * SQUARE_SIZE);
		ctx.moveTo(i * SQUARE_SIZE, 0);
		ctx.lineTo(i * SQUARE_SIZE, HEIGHT);
		ctx.strokeStyle = LINE_COLOR;
		ctx.lineWidth = LINE_WIDTH;
		ctx.stroke();
	}

	// Draw figures
	for (let row = 0; row < ROWS; row++) {
		for (let col = 0; col < COLS; col++) {
			const value = board[row][col];
			if (value === 1) drawCross(row, col);
			if (value === 2) drawCircle(row, col);
		}
	}
}

function drawCircle(row, col) {
	const x = col * SQUARE_SIZE + SQUARE_SIZE / 2;
	const y = row * SQUARE_SIZE + SQUARE_SIZE / 2;
	ctx.beginPath();
	ctx.arc(x, y, SQUARE_SIZE / 3, 0, Math.PI * 2);
	ctx.strokeStyle = CIRCLE_COLOR;
	ctx.lineWidth = LINE_WIDTH;
	ctx.stroke();
}

function drawCross(row, col) {
	const x = col * SQUARE_SIZE;
	const y = row * SQUARE_SIZE;
	ctx.beginPath();
	ctx.moveTo(x + 30, y + 30);
	ctx.lineTo(x + SQUARE_SIZE - 30, y + SQUARE_SIZE - 30);
	ctx.moveTo(x + 30, y + SQUARE_SIZE - 30);
	ctx.lineTo(x + SQUARE_SIZE - 30, y + 30);
	ctx.strokeStyle = CROSS_COLOR;
	ctx.lineWidth = LINE_WIDTH;
	ctx.stroke();
}

function handlePlayerMove(e) {
	if (gameOver) return;

	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	const col = Math.floor(x / SQUARE_SIZE);
	const row = Math.floor(y / SQUARE_SIZE);

	if (board[row][col] === 0) {
		board[row][col] = currentPlayer;
		drawBoard();

		if (checkWin(currentPlayer)) {
			winnerText.textContent = `Player ${
				currentPlayer === 1 ? 'X' : 'O'
			} Wins!`;
			gameOver = true;
			setTimeout(() => {
				restartGame();
			}, 3000);
			return;
		}

		if (isBoardFull()) {
			winnerText.textContent = "It's a Draw!";
			gameOver = true;
			setTimeout(() => {
				restartGame();
			}, 3000);
			return;
		}

		currentPlayer = currentPlayer === 1 ? 2 : 1;

		if (mode === 'PvAI' && currentPlayer === 2) {
			aiMove();
		}
	}
}

function aiMove() {
	const bestMove = minimax(board, 0, true, -Infinity, Infinity); // Depth starts at 0
	board[bestMove.row][bestMove.col] = 2; // AI is player 2
	drawBoard();

	if (checkWin(2)) {
		winnerText.textContent = 'AI Wins!';
		gameOver = true;
		setTimeout(() => {
			restartGame();
		}, 3000);
		return;
	}

	if (isBoardFull()) {
		winnerText.textContent = "It's a Draw!";
		gameOver = true;
		setTimeout(() => {
			restartGame();
		}, 3000);
		return;
	}

	currentPlayer = 1; // Player's turn
}

function minimax(tempBoard, depth, isMaximizing, alpha, beta) {
	if (checkWin(1)) return { score: -10 + depth };
	if (checkWin(2)) return { score: 10 - depth };
	if (isBoardFull()) return { score: 0 };

	if (isMaximizing) {
		let maxEval = { score: -Infinity };
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				if (tempBoard[row][col] === 0) {
					tempBoard[row][col] = 2; // AI move
					const eval = minimax(
						tempBoard,
						depth + 1,
						false,
						alpha,
						beta
					);
					tempBoard[row][col] = 0; // Undo move
					if (eval.score > maxEval.score) {
						maxEval = { score: eval.score, row, col };
					}
					alpha = Math.max(alpha, eval.score);
					if (beta <= alpha) break; // Prune branches
				}
			}
		}
		return maxEval;
	} else {
		let minEval = { score: Infinity };
		for (let row = 0; row < ROWS; row++) {
			for (let col = 0; col < COLS; col++) {
				if (tempBoard[row][col] === 0) {
					tempBoard[row][col] = 1; // Opponent move
					const eval = minimax(
						tempBoard,
						depth + 1,
						true,
						alpha,
						beta
					);
					tempBoard[row][col] = 0; // Undo move
					if (eval.score < minEval.score) {
						minEval = { score: eval.score, row, col };
					}
					beta = Math.min(beta, eval.score);
					if (beta <= alpha) break; // Prune branches
				}
			}
		}
		return minEval;
	}
}

function checkWin(player) {
	// Check rows, columns, and diagonals
	for (let i = 0; i < ROWS; i++) {
		if (board[i].every((val) => val === player)) return true;
		if (board.map((row) => row[i]).every((val) => val === player))
			return true;
	}
	if (board.map((row, i) => row[i]).every((val) => val === player))
		return true;
	if (board.map((row, i) => row[COLS - 1 - i]).every((val) => val === player))
		return true;
	return false;
}

function isBoardFull() {
	return board.flat().every((val) => val !== 0);
}

function restartGame() {
	board = Array.from(Array(ROWS), () => Array(COLS).fill(0));
	currentPlayer = 1;
	gameOver = false;
	winnerText.textContent = '';
	drawBoard();
}

function toggleGameMode() {
	mode = mode === 'PvAI' ? 'PvP' : 'PvAI';
	gameModeText.textContent = `Game Mode: ${mode}`;
	toggleModeBtn.textContent = `Switch Mode: ${
		mode === 'PvAI' ? 'PvP' : 'PvAI'
	}`;
	restartGame();
}
