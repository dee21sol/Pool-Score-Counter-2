// Game state
const gameState = {
    players: [],
    currentPlayerIndex: 0,
    remainingBalls: [3,4,5,6,7,8,9,10,11,12,13,14,15],
    ball3OnTable: true,
    gameStarted: false,
    history: [],
    historyIndex: -1,
    dataCollection: []
};

// Player statistics
const playerStats = {};

// DOM elements
let playerSetup, gameInterface, playersScoreboard, remainingBallsSum;
let ballButtons, nextPlayerBtn, newGameBtn, startGameBtn;
let undoBtn, redoBtn, toggleDataPageBtn, dataCollectionPage;
let dataCollectionContent, resetDataBtn;

// Initialize DOM elements
function initializeElements() {
    playerSetup = document.getElementById('playerSetup');
    gameInterface = document.getElementById('gameInterface');
    playersScoreboard = document.getElementById('playersScoreboard');
    remainingBallsSum = document.getElementById('remainingBallsSum');
    ballButtons = document.querySelectorAll('.ball-btn');
    nextPlayerBtn = document.getElementById('nextPlayer');
    newGameBtn = document.getElementById('newGame');
    startGameBtn = document.getElementById('startGame');
    undoBtn = document.getElementById('undoBtn');
    redoBtn = document.getElementById('redoBtn');
    toggleDataPageBtn = document.getElementById('toggleDataPageBtn');
    dataCollectionPage = document.getElementById('dataCollectionPage');
    dataCollectionContent = document.getElementById('dataCollectionContent');
    resetDataBtn = document.getElementById('resetDataBtn');
}

// Initialize event listeners
function initializeEventListeners() {
    document.getElementById('2players').addEventListener('click', () => setupPlayers(2));
    document.getElementById('3players').addEventListener('click', () => setupPlayers(3));
    document.getElementById('4players').addEventListener('click', () => setupPlayers(4));
    startGameBtn.addEventListener('click', startGame);
    nextPlayerBtn.addEventListener('click', nextPlayer);
    newGameBtn.addEventListener('click', resetGame);
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    resetDataBtn.addEventListener('click', resetDataCollection);
    toggleDataPageBtn.addEventListener('click', toggleDataPage);
}

function setupPlayers(count) {
    document.getElementById('player3Container').classList.toggle('hidden', count < 3);
    document.getElementById('player4Container').classList.toggle('hidden', count < 4);
    document.getElementById('playerInputs').classList.remove('hidden');
    gameState.playerCount = count;
}

function startGame() {
    gameState.players = [];
    for (let i = 1; i <= gameState.playerCount; i++) {
        const name = document.getElementById(`player${i}`).value.trim() || `Player ${i}`;
        gameState.players.push({
            name,
            score: 0,
            ballsPocketed: [],
            ballsFouled: [],
            eliminated: false,
            pointsNeeded: 0
        });
    }
    
    gameState.gameStarted = true;
    gameState.currentPlayerIndex = 0;
    gameState.remainingBalls = [3,4,5,6,7,8,9,10,11,12,13,14,15];
    gameState.ball3OnTable = true;
    gameState.history = [];
    gameState.historyIndex = -1;
    
    playerSetup.classList.add('hidden');
    gameInterface.classList.remove('hidden');
    updateScoreboard();
    updateBallButtons();
}

function updateScoreboard() {
    playersScoreboard.innerHTML = '';
    const highestScore = Math.max(...gameState.players.map(p => p.score));
    
    gameState.players.forEach((player, index) => {
        // Calculate points needed to win
        const pointsNeeded = Math.max(0, highestScore - player.score);
        player.pointsNeeded = pointsNeeded;
        
        // Check if player can't reach highest score
        const remainingBallsValue = gameState.remainingBalls.reduce((sum, ball) => {
            return sum + (ball === 3 ? 6 : ball);
        }, 0);
        
        if (player.score < highestScore && remainingBallsValue < pointsNeeded) {
            player.eliminated = true;
        }
        
        const playerCard = document.createElement('div');
        playerCard.className = `player-card bg-gray-800 p-2 rounded-lg ${index === gameState.currentPlayerIndex ? 'current-player' : ''} ${player.eliminated ? 'eliminated' : ''}`;
        playerCard.innerHTML = `
            <div class="player-name" data-index="${index}">
                <h3 class="text-sm font-semibold ${player.score === highestScore && !player.eliminated ? 'text-green-400' : ''}">
                    ${player.name} ${player.eliminated ? '(Eliminated)' : ''}
                </h3>
            </div>
            <div class="text-xl font-bold my-1">${player.score} pts</div>
            <div class="text-xs ${player.pointsNeeded > 0 ? 'text-yellow-400' : 'text-green-400'}">
                ${player.pointsNeeded > 0 ? `Needs ${player.pointsNeeded} points to win` : 'Winning!'}
            </div>
            <div class="text-xs mt-1">
                <div>Pocketed: ${player.ballsPocketed.join(', ') || 'None'}</div>
                <div>Fouled: ${player.ballsFouled.join(', ') || 'None'}</div>
            </div>
        `;
        
        // Add click event to player name to change turn
        playerCard.querySelector('.player-name').addEventListener('click', () => {
            if (!player.eliminated) {
                gameState.currentPlayerIndex = index;
                updateScoreboard();
            }
        });
        
        playersScoreboard.appendChild(playerCard);
    });
    
    // Update remaining balls sum
    remainingBallsSum.textContent = gameState.remainingBalls.reduce((sum, ball) => sum + (ball === 3 ? 6 : ball), 0);
}

function updateBallButtons() {
    ballButtons.forEach(btn => {
        const ballValue = parseInt(btn.value);
        btn.disabled = !gameState.remainingBalls.includes(ballValue);
    });
}

function handleBallAction(ball, action) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const ballIndex = gameState.remainingBalls.indexOf(ball);
    
    if (ballIndex === -1) {
        alert('This ball has already been pocketed');
        return;
    }
    
    let points = 0;
    
    if (ball === 3) {
        if (action === 'pocket') {
            points = 6;
            currentPlayer.ballsPocketed.push(3);
            gameState.ball3OnTable = false;
        } else {
            points = -4;
            currentPlayer.ballsFouled.push(3);
        }
    } else {
        if (action === 'pocket') {
            points = ball;
            currentPlayer.ballsPocketed.push(ball);
        } else {
            // Special rule: -4 points for any foul when ball 3 is still on table
            points = gameState.ball3OnTable ? -4 : -ball;
            currentPlayer.ballsFouled.push(ball);
        }
    }
    
    currentPlayer.score += points;
    
    if (action === 'pocket') {
        gameState.remainingBalls.splice(ballIndex, 1);
    }
    
    // Save state to history
    saveStateToHistory();
    
    updateScoreboard();
    updateBallButtons();
}

function nextPlayer() {
    do {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    } while (gameState.players[gameState.currentPlayerIndex].eliminated && 
            gameState.players.some(p => !p.eliminated));
    
    // Save state to history
    saveStateToHistory();
    
    updateScoreboard();
}

function resetGame() {
    if (gameState.gameStarted) {
        endGame();
    }
    gameState.players = [];
    gameState.currentPlayerIndex = 0;
    gameState.remainingBalls = [3,4,5,6,7,8,9,10,11,12,13,14,15];
    gameState.ball3OnTable = true;
    gameState.gameStarted = false;
    gameState.history = [];
    gameState.historyIndex = -1;
    
    gameInterface.classList.add('hidden');
    playerSetup.classList.remove('hidden');
    document.getElementById('playerInputs').classList.add('hidden');
    document.querySelectorAll('#playerInputs input').forEach(input => input.value = '');
    dataCollectionPage.classList.add('hidden');
    updateBallButtons();
}

function saveStateToHistory() {
    // Remove any future states if we're not at the end of the history
    if (gameState.historyIndex < gameState.history.length - 1) {
        gameState.history = gameState.history.slice(0, gameState.historyIndex + 1);
    }
    
    // Save current state
    const stateCopy = JSON.parse(JSON.stringify(gameState));
    gameState.history.push(stateCopy);
    gameState.historyIndex = gameState.history.length - 1;
}

function undo() {
    if (gameState.historyIndex > 0) {
        gameState.historyIndex--;
        const previousState = gameState.history[gameState.historyIndex];
        Object.assign(gameState, previousState);
        updateScoreboard();
        updateBallButtons();
    }
}

function redo() {
    if (gameState.historyIndex < gameState.history.length - 1) {
        gameState.historyIndex++;
        const nextState = gameState.history[gameState.historyIndex];
        Object.assign(gameState, nextState);
        updateScoreboard();
        updateBallButtons();
    }
}

function collectData() {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const firstPlayer = sortedPlayers[0];
    const lastPlayer = sortedPlayers[sortedPlayers.length - 1];
    
    gameState.dataCollection.push({
        first: firstPlayer.name,
        last: lastPlayer.name,
        timestamp: new Date().toISOString()
    });
    
    updateDataCollectionPage();
}

function updateDataCollectionPage() {
    dataCollectionContent.innerHTML = '';
    Object.keys(playerStats).forEach(name => {
        // Only show players with at least one win or one loss
        if (playerStats[name].wins > 0 || playerStats[name].losses > 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2">${name}</td>
                <td class="p-2">${playerStats[name].wins}</td>
                <td class="p-2">${playerStats[name].losses}</td>
            `;
            dataCollectionContent.appendChild(row);
        }
    });
}

function resetDataCollection() {
    for (const key in playerStats) delete playerStats[key];
    updateDataCollectionPage();
}

function toggleDataPage() {
    if (gameInterface.classList.contains('hidden')) {
        gameInterface.classList.remove('hidden');
        dataCollectionPage.classList.add('hidden');
    } else {
        gameInterface.classList.add('hidden');
        dataCollectionPage.classList.remove('hidden');
    }
}

function endGame() {
    // Find winner (highest score) and last (lowest score)
    if (gameState.players.length === 0) return;
    const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    const last = sorted[sorted.length - 1];

    // Update stats for winner
    if (!playerStats[winner.name]) playerStats[winner.name] = { wins: 0, losses: 0 };
    playerStats[winner.name].wins += 1;

    // Update stats for last
    if (!playerStats[last.name]) playerStats[last.name] = { wins: 0, losses: 0 };
    playerStats[last.name].losses += 1;

    updateDataCollectionPage();
    gameInterface.classList.add('hidden');
    dataCollectionPage.classList.remove('hidden');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    initializeEventListeners();
}); 