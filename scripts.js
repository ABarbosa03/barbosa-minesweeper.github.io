document.addEventListener('DOMContentLoaded', () => {
    const setupDiv = document.getElementById('setup');
    const gameBoardDiv = document.getElementById('gameBoard');
    const difficultySelect = document.getElementById('difficulty');
    const customSettings = document.getElementById('customSettings');
    const startGameButton = document.getElementById('startGame');

    difficultySelect.addEventListener('change', () => {
        if (difficultySelect.value === 'custom') {
            customSettings.style.display = 'block';
        } else {
            customSettings.style.display = 'none';
        }
    });

    startGameButton.addEventListener('click', () => {
        let rows, columns, mines;

        switch (difficultySelect.value) {
            case 'easy':
                rows = 8;
                columns = 8;
                mines = 10;
                break;
            case 'medium':
                rows = 16;
                columns = 16;
                mines = 40;
                break;
            case 'hard':
                rows = 16;
                columns = 30;
                mines = 99;
                break;
            case 'veryHard':
                rows = 24;
                columns = 24;
                mines = 110;
                break;
            case 'hardcore':
                rows = 30;
                columns = 30;
                mines = 130;
                break;
            case 'legend':
                rows = 40;
                columns = 40;
                mines = 160;
                break;
            case 'custom':
                rows = parseInt(document.getElementById('rows').value);
                columns = parseInt(document.getElementById('columns').value);
                mines = parseInt(document.getElementById('mines').value);
                break;
            default:
                return;
        }

        setupDiv.classList.add('hidden');
        gameBoardDiv.classList.remove('hidden');
        startGame(rows, columns, mines);
    });

    function startGame(rows, columns, mines) {
        gameBoardDiv.innerHTML = '';
        const board = [];

        for (let r = 0; r < rows; r++) {
            const row = [];
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('row');
            for (let c = 0; c < columns; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.column = c;
                cell.addEventListener('click', () => onCellClick(r, c));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    onCellRightClick(r, c);
                });
                rowDiv.appendChild(cell);
                row.push({ hasMine: false, revealed: false, flagged: false });
            }
            gameBoardDiv.appendChild(rowDiv);
            board.push(row);
        }

        placeMines(board, rows, columns, mines);
        gameBoardDiv.dataset.board = JSON.stringify(board);
    }

    function placeMines(board, rows, columns, mines) {
        let placedMines = 0;
        while (placedMines < mines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * columns);
            if (!board[r][c].hasMine) {
                board[r][c].hasMine = true;
                placedMines++;
            }
        }
    }

    function onCellClick(row, column) {
        if (!window.timerStarted) {
            startTimer();
            window.timerStarted = true;
        }

        const gameBoardDiv = document.getElementById('gameBoard');
        let board = JSON.parse(gameBoardDiv.dataset.board);
        let cell = board[row][column];

        if (cell.revealed || cell.flagged) {
            return;
        }

        if (cell.hasMine && !window.firstClickDone) {
            // Recalcular el tablero si la primera selección tiene mina
            do {
                board = createNewBoard(window.rows, window.columns, window.mineCountOriginal);
                cell = board[row][column];
            } while (cell.hasMine);
            gameBoardDiv.dataset.board = JSON.stringify(board);
        }

        window.firstClickDone = true;

        if (cell.hasMine) {
            showGameOverModal();
            revealBoard(board, true);
            return;
        }

        revealCell(board, row, column);
        gameBoardDiv.dataset.board = JSON.stringify(board);

        if (checkWin(board)) {
            showWinModal();
            revealBoard(board);
        }
    }

    function onCellRightClick(row, column) {
        const board = JSON.parse(gameBoardDiv.dataset.board);
        const cell = board[row][column];
        const cellDiv = document.querySelector(`.cell[data-row='${row}'][data-column='${column}']`);

        if (cell.revealed) {
            return;
        }

        cell.flagged = !cell.flagged;
        cellDiv.classList.toggle('flagged', cell.flagged);
        gameBoardDiv.dataset.board = JSON.stringify(board);
    }

    function revealCell(board, row, column) {
        const cell = board[row][column];
        if (cell.revealed || cell.flagged) {
            return;
        }

        cell.revealed = true;
        const cellDiv = document.querySelector(`.cell[data-row='${row}'][data-column='${column}']`);
        cellDiv.classList.add('revealed');

        if (cell.hasMine) {
            cellDiv.textContent = '💣';
            return;
        }

        const mineCount = countAdjacentMines(board, row, column);
        if (mineCount > 0) {
            cellDiv.textContent = mineCount;
        } else {
            revealAdjacentCells(board, row, column);
        }
    }

    function countAdjacentMines(board, row, column) {
        let count = 0;
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = column - 1; c <= column + 1; c++) {
                if (r >= 0 && r < board.length && c >= 0 && c < board[0].length && board[r][c].hasMine) {
                    count++;
                }
            }
        }
        return count;
    }

    function revealAdjacentCells(board, row, column) {
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = column - 1; c <= column + 1; c++) {
                if (r >= 0 && r < board.length && c >= 0 && c < board[0].length) {
                    revealCell(board, r, c);
                }
            }
        }
    }

    function revealBoard(board, showMines = false) {
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[0].length; c++) {
                const cell = board[r][c];
                if (showMines && cell.hasMine) {
                    const cellDiv = document.querySelector(`.cell[data-row='${r}'][data-column='${c}']`);
                    cellDiv.textContent = '💣';
                    cellDiv.classList.add('revealed');
                } else if (!cell.revealed) {
                    revealCell(board, r, c);
                }
            }
        }
    }

    function checkWin(board) {
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[0].length; c++) {
                const cell = board[r][c];
                if (!cell.hasMine && !cell.revealed) {
                    return false;
                }
            }
        }
        return true;
    }

    function showGameOverModal() {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = `
        <div class="modal-content">
          <h2>Game Over!</h2>
          <p>You clicked on a mine. Better luck next time!</p>
          <button id="restartGame">Restart</button>
        </div>
      `;
        document.body.appendChild(modal);
        document.getElementById('restartGame').addEventListener('click', () => {
            document.body.removeChild(modal);
            setupDiv.classList.remove('hidden');
            gameBoardDiv.classList.add('hidden');
        });
    }

    function showWinModal() {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = `
        <div class="modal-content">
          <h2>Congratulations!</h2>
          <p>You have successfully cleared all the mines!</p>
          <button id="restartGameWin">Restart</button>
        </div>
      `;
        document.body.appendChild(modal);
        document.getElementById('restartGameWin').addEventListener('click', () => {
            document.body.removeChild(modal);
            setupDiv.classList.remove('hidden');
            gameBoardDiv.classList.add('hidden');
        });
    }

    function createNewBoard(rows, columns, mines) {
        const board = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < columns; c++) {
                row.push({ hasMine: false, revealed: false, flagged: false });
            }
            board.push(row);
        }
        placeMines(board, rows, columns, mines);
        return board;
    }
});