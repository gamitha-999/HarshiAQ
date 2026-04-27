const originalQuestions = [
    { level: "Time Management", question: "Exam is in 5 days. What should you do first?", options: ["Start studying random subjects", "Make a clear study timetable", "Read only your favorite subject", "Watch study videos without planning"], answer: 1 },
    { level: "Time Management", question: "Best place to study?", options: ["Quiet place with minimal distractions", "Slightly noisy place with music", "Bed with comfort", "Anywhere with phone nearby"], answer: 0 },
    { level: "Avoid Distractions", question: "Best way to remember lessons?", options: ["Read notes multiple times", "Highlight everything", "Active recall + practice questions", "Watch explanation videos only"], answer: 2 },
    { level: "Avoid Distractions", question: "Study session timing?", options: ["20 minutes then break", "25–50 minutes with short breaks", "2 hours nonstop", "Study only when you feel like"], answer: 1 },
    { level: "Smart Study Methods", question: "Phone usage while studying?", options: ["Keep it silent near you", "Use only for study apps", "Keep it away or turn it off", "Check it during breaks only"], answer: 2 },
    { level: "Smart Study Methods", question: "Before exam day?", options: ["Revise important notes", "Study everything again quickly", "Focus on weak areas only", "Learn new lessons"], answer: 0 },
    { level: "Revision", question: "Night before exam?", options: ["Revise lightly and sleep well", "Study till very late night", "Wake up early and study more", "Stay awake whole night"], answer: 0 },
    { level: "Revision", question: "Don’t understand a lesson?", options: ["Re-read notes again", "Watch videos again", "Ask teacher/friends + practice", "Skip and come back later"], answer: 2 },
    { level: "Exam Day Tips", question: "Time management method?", options: ["Make a flexible plan", "Make a clear study timetable", "Study based on mood", "Do easiest subjects first always"], answer: 1 },
    { level: "Exam Day Tips", question: "During exam?", options: ["Answer easy questions first", "Read carefully + manage time properly", "Spend more time on hard questions", "Rush to finish early"], answer: 1 }
];

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 15;
let timerInterval;
let playerName = "";
let isAdmin = false;

// Elements
const screens = document.querySelectorAll('.screen');
const homeScreen = document.getElementById('home-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const adminScreen = document.getElementById('admin-screen');
const gameScreen = document.getElementById('game-screen');
const waitingResultsScreen = document.getElementById('waiting-results-screen');
const resultScreen = document.getElementById('result-screen');

const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const adminStartBtn = document.getElementById('admin-start-btn');
const adminResultsBtn = document.getElementById('admin-results-btn');
const adminRestartGameBtn = document.getElementById('admin-restart-game-btn');
const adminResetBtn = document.getElementById('admin-reset-btn');
const restartBtn = document.getElementById('restart-btn');

const playerNameInput = document.getElementById('player-name');
const displayPlayerName = document.getElementById('display-player-name');
const playerCountEl = document.getElementById('player-count');
const adminPlayerCountEl = document.getElementById('admin-player-count');
const adminPlayerNamesEl = document.getElementById('admin-player-names');

// Theme Logic
const themeToggleBtn = document.getElementById('theme-toggle');
let currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
});

// Join Logic
joinBtn.addEventListener('click', () => {
    playerName = playerNameInput.value.trim();
    if (playerName === "") return alert("Enter your name!");

    if (playerName === "Admin") {
        const password = prompt("Enter Admin Password:");
        if (password === "harshi") {
            isAdmin = true;
            showScreen(adminScreen);
            startAdminSync();
        } else {
            alert("Incorrect password!");
        }
    } else {
        isAdmin = false;
        displayPlayerName.textContent = playerName;
        showScreen(lobbyScreen);
        registerPlayer(playerName);
        startStudentSync();
    }
});

leaveBtn.addEventListener('click', () => {
    unregisterPlayer(playerName);
    location.reload();
});

function showScreen(screen) {
    screens.forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

function registerPlayer(name) {
    let lobby = JSON.parse(localStorage.getItem('studyLobby')) || [];
    if (!lobby.includes(name)) {
        lobby.push(name);
        localStorage.setItem('studyLobby', JSON.stringify(lobby));
    }
}

function unregisterPlayer(name) {
    let lobby = JSON.parse(localStorage.getItem('studyLobby')) || [];
    lobby = lobby.filter(p => p !== name);
    localStorage.setItem('studyLobby', JSON.stringify(lobby));
}

// Admin Sync
function startAdminSync() {
    setInterval(() => {
        const lobby = JSON.parse(localStorage.getItem('studyLobby')) || [];
        adminPlayerCountEl.textContent = lobby.length;
        
        // Live update player names list
        adminPlayerNamesEl.innerHTML = '';
        lobby.forEach(name => {
            const span = document.createElement('span');
            span.className = 'player-tag';
            span.textContent = name;
            adminPlayerNamesEl.appendChild(span);
        });

        const finishedCount = parseInt(localStorage.getItem('finishedPlayers')) || 0;
        if (finishedCount > 0 && finishedCount >= lobby.length) {
            adminResultsBtn.disabled = false;
            adminResultsBtn.textContent = "📊 Show Final Results";
        } else if (localStorage.getItem('gameState') === 'playing') {
            adminStartBtn.textContent = "⌛ Game in Progress (" + finishedCount + "/" + lobby.length + ")";
        } else {
            adminStartBtn.textContent = "🚀 Start Game Now";
        }
    }, 1000);
}

// Student Sync
function startStudentSync() {
    const sync = setInterval(() => {
        const gameState = localStorage.getItem('gameState');
        const lobby = JSON.parse(localStorage.getItem('studyLobby')) || [];
        
        // If I am not in the lobby anymore (was I kicked?), reload
        if (!lobby.includes(playerName)) {
            clearInterval(sync);
            location.reload();
            return;
        }

        playerCountEl.textContent = lobby.length;

        // Reset/Kick logic
        if (gameState === 'kick') {
            clearInterval(sync);
            alert("The teacher has reset the game.");
            location.reload();
            return;
        }

        if (gameState === 'playing') {
            clearInterval(sync);
            startGame();
        }
    }, 1000);
}

// Admin Buttons
adminStartBtn.addEventListener('click', () => {
    const lobby = JSON.parse(localStorage.getItem('studyLobby')) || [];
    if (lobby.length === 0) {
        if (!confirm("No students have joined yet. Start anyway?")) return;
    }
    localStorage.setItem('finishedPlayers', '0');
    localStorage.removeItem('studyMasterLeaderboard');
    localStorage.setItem('gameState', 'playing');
    alert("Game Started with " + lobby.length + " players!");
});

adminResultsBtn.addEventListener('click', () => {
    localStorage.setItem('gameState', 'results');
    alert("Results revealed to everyone!");
});

adminRestartGameBtn.addEventListener('click', () => {
    if (confirm("This will kick all players and return to the home screen. Continue?")) {
        localStorage.setItem('gameState', 'kick');
        setTimeout(() => {
            localStorage.clear();
            location.reload();
        }, 1500);
    }
});

adminResetBtn.addEventListener('click', () => {
    if (confirm("Clear all data without kicking? (Use this for maintenance)")) {
        localStorage.clear();
        location.reload();
    }
});

// Game Core
function startGame() {
    showScreen(gameScreen);
    questions = JSON.parse(JSON.stringify(originalQuestions));
    shuffleArray(questions);
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    resetState();
    const q = questions[currentQuestionIndex];
    document.getElementById('level-name').textContent = q.level;
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / questions.length) * 100}%`;
    document.getElementById('current-score').textContent = score;

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.className = 'option-btn';
        btn.onclick = () => selectAnswer(i);
        document.getElementById('answer-options').appendChild(btn);
    });
    startTimer();
}

function resetState() {
    clearInterval(timerInterval);
    timeLeft = 15;
    document.getElementById('time-left').textContent = timeLeft;
    document.getElementById('answer-options').innerHTML = '';
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').textContent = timeLeft;
        if (timeLeft <= 0) selectAnswer(-1);
    }, 1000);
}

function selectAnswer(idx) {
    clearInterval(timerInterval);
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    const correct = questions[currentQuestionIndex].answer;
    if (idx === correct) {
        score += 10;
        buttons[idx].classList.add('correct');
    } else {
        score -= 5;
        if (buttons[idx]) buttons[idx].classList.add('wrong');
        buttons[correct].classList.add('correct');
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) showQuestion();
        else finishGame();
    }, 1000);
}

function finishGame() {
    showScreen(waitingResultsScreen);
    saveFinalScore(playerName, score);
    
    let finished = parseInt(localStorage.getItem('finishedPlayers')) || 0;
    localStorage.setItem('finishedPlayers', (finished + 1).toString());

    const resultSync = setInterval(() => {
        const gameState = localStorage.getItem('gameState');
        if (gameState === 'kick') {
            clearInterval(resultSync);
            location.reload();
        }
        if (gameState === 'results') {
            clearInterval(resultSync);
            showFinalResults();
        }
    }, 1000);
}

function saveFinalScore(name, score) {
    let leaderboard = JSON.parse(localStorage.getItem('studyMasterLeaderboard')) || [];
    leaderboard.push({ name, score });
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('studyMasterLeaderboard', JSON.stringify(leaderboard));
}

function showFinalResults() {
    showScreen(resultScreen);
    const max = questions.length * 10;
    const pct = Math.max(0, Math.round((score / max) * 100));
    document.getElementById('result-percentage').textContent = `${pct}%`;
    document.getElementById('final-score-val').textContent = score;
    
    if (pct >= 90) document.getElementById('result-message').textContent = "A+ Student 🔥";
    else if (pct >= 70) document.getElementById('result-message').textContent = "Almost there 💪";
    else document.getElementById('result-message').textContent = "Need better habits 😅";

    displayLeaderboard();
}

function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('studyMasterLeaderboard')) || [];
    const body = document.getElementById('leaderboard-body');
    body.innerHTML = '';
    leaderboard.slice(0, 35).forEach((entry, i) => {
        const row = `<tr class="${i === 0 ? 'rank-1-highlight' : ''}">
            <td>${i + 1}${i === 0 ? ' 👑' : ''}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
        </tr>`;
        body.innerHTML += row;
    });
    if (leaderboard.length > 0) triggerCelebration();
}

function triggerCelebration() {
    const container = document.createElement('div');
    container.className = 'celebration-container';
    document.body.appendChild(container);
    const gift = document.createElement('div');
    gift.className = 'gift-box';
    gift.textContent = '🎁';
    container.appendChild(gift);
    setTimeout(() => {
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = '50%'; p.style.top = '50%';
            p.style.backgroundColor = ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db'][Math.floor(Math.random()*4)];
            const a = Math.random() * Math.PI * 2;
            const d = 100 + Math.random() * 200;
            p.style.setProperty('--dx', Math.cos(a) * d + 'px');
            p.style.setProperty('--dy', Math.sin(a) * d + 'px');
            container.appendChild(p);
        }
        setTimeout(() => container.remove(), 2500);
    }, 1500);
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

restartBtn.addEventListener('click', () => location.reload());
