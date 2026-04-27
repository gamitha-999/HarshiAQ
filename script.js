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

// Global State Management
const State = {
    get: (key) => localStorage.getItem(key),
    set: (key, val) => localStorage.setItem(key, val),
    getJson: (key) => JSON.parse(localStorage.getItem(key)) || [],
    setJson: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
    clear: () => localStorage.clear()
};

// Elements
const screens = {
    home: document.getElementById('home-screen'),
    lobby: document.getElementById('lobby-screen'),
    admin: document.getElementById('admin-screen'),
    game: document.getElementById('game-screen'),
    waiting: document.getElementById('waiting-results-screen'),
    result: document.getElementById('result-screen')
};

const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const adminStartBtn = document.getElementById('admin-start-btn');
const adminResultsBtn = document.getElementById('admin-results-btn');
const adminRestartBtn = document.getElementById('admin-restart-game-btn');
const adminResetBtn = document.getElementById('admin-reset-btn');
const restartBtn = document.getElementById('restart-btn');

const playerNameInput = document.getElementById('player-name');
const displayPlayerName = document.getElementById('display-player-name');
const playerCountEl = document.getElementById('player-count');
const adminPlayerCountEl = document.getElementById('admin-player-count');
const adminPlayerNamesEl = document.getElementById('admin-player-names');

// Sync Logic
window.addEventListener('storage', () => {
    syncApp();
});

function syncApp() {
    const gameState = State.get('gameState');
    const lobby = State.getJson('studyLobby');

    // Admin UI Update
    if (isAdmin) {
        if (adminPlayerCountEl) adminPlayerCountEl.textContent = lobby.length;
        if (adminPlayerNamesEl) {
            adminPlayerNamesEl.innerHTML = lobby.map(name => `<span class="player-tag">${name}</span>`).join('');
        }
        const finished = parseInt(State.get('finishedPlayers')) || 0;
        adminResultsBtn.disabled = !(finished > 0 && finished >= lobby.length);
    }

    // Student UI Sync
    if (!isAdmin && playerName !== "") {
        if (playerCountEl) playerCountEl.textContent = lobby.length;

        if (gameState === 'playing' && screens.lobby.classList.contains('active')) {
            startGame();
        }

        if (gameState === 'kick') {
            alert("Room has been reset by the Teacher.");
            location.reload();
        }

        if (gameState === 'results' && screens.waiting.classList.contains('active')) {
            showFinalResults();
        }
    }
}

// Join Logic
joinBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (!name) return alert("Please enter your name!");

    if (name.toLowerCase() === "admin") {
        const pw = prompt("Enter Admin Password:");
        if (pw === "harshi") {
            isAdmin = true;
            playerName = "Admin";
            showScreen('admin');
            startSyncLoop();
        } else {
            alert("Access Denied!");
        }
    } else {
        playerName = name;
        displayPlayerName.textContent = playerName;
        registerInLobby(name);
        showScreen('lobby');
        startSyncLoop();
    }
});

leaveBtn.addEventListener('click', () => {
    removeFromLobby(playerName);
    location.reload();
});

function registerInLobby(name) {
    let lobby = State.getJson('studyLobby');
    if (!lobby.includes(name)) {
        lobby.push(name);
        State.setJson('studyLobby', lobby);
    }
}

function removeFromLobby(name) {
    let lobby = State.getJson('studyLobby');
    State.setJson('studyLobby', lobby.filter(n => n !== name));
}

function showScreen(key) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[key].classList.add('active');
}

function startSyncLoop() {
    syncApp();
    setInterval(syncApp, 1000);
}

// Admin Actions
adminStartBtn.addEventListener('click', () => {
    const lobby = State.getJson('studyLobby');
    if (lobby.length === 0) return alert("Wait for students to join!");
    
    State.set('gameState', 'playing');
    State.set('finishedPlayers', '0');
    State.setJson('studyMasterLeaderboard', []);
    alert("Game Started!");
});

adminResultsBtn.addEventListener('click', () => {
    State.set('gameState', 'results');
});

adminRestartBtn.addEventListener('click', () => {
    if (confirm("Kick all players and restart?")) {
        State.set('gameState', 'kick');
        setTimeout(() => {
            State.clear();
            location.reload();
        }, 1000);
    }
});

adminResetBtn.addEventListener('click', () => {
    if (confirm("Clear all data?")) {
        State.clear();
        location.reload();
    }
});

// Game Logic
function startGame() {
    showScreen('game');
    questions = JSON.parse(JSON.stringify(originalQuestions));
    shuffle(questions);
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    clearInterval(timerInterval);
    const q = questions[currentQuestionIndex];
    document.getElementById('level-name').textContent = q.level;
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / questions.length) * 100}%`;
    document.getElementById('current-score').textContent = score;

    const optionsBox = document.getElementById('answer-options');
    optionsBox.innerHTML = '';
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.textContent = opt;
        btn.className = 'option-btn';
        btn.onclick = () => handleAnswer(i);
        optionsBox.appendChild(btn);
    });

    timeLeft = 15;
    document.getElementById('time-left').textContent = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').textContent = timeLeft;
        if (timeLeft <= 0) handleAnswer(-1);
    }, 1000);
}

function handleAnswer(idx) {
    clearInterval(timerInterval);
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => b.disabled = true);

    const correct = questions[currentQuestionIndex].answer;
    if (idx === correct) {
        score += 10;
        btns[idx].classList.add('correct');
    } else {
        score -= 5;
        if (btns[idx]) btns[idx].classList.add('wrong');
        btns[correct].classList.add('correct');
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) showQuestion();
        else endCurrentGame();
    }, 1000);
}

function endCurrentGame() {
    showScreen('waiting');
    const lb = State.getJson('studyMasterLeaderboard');
    lb.push({ name: playerName, score: score });
    State.setJson('studyMasterLeaderboard', lb);

    let fin = parseInt(State.get('finishedPlayers')) || 0;
    State.set('finishedPlayers', fin + 1);
}

function showFinalResults() {
    showScreen('result');
    const max = questions.length * 10;
    const pct = Math.max(0, Math.round((score / max) * 100));
    document.getElementById('result-percentage').textContent = `${pct}%`;
    document.getElementById('final-score-val').textContent = score;
    
    const msg = document.getElementById('result-message');
    if (pct >= 90) msg.textContent = "A+ Student 🔥";
    else if (pct >= 70) msg.textContent = "Almost there 💪";
    else msg.textContent = "Need better habits 😅";

    const lb = State.getJson('studyMasterLeaderboard');
    lb.sort((a, b) => b.score - a.score);
    
    const body = document.getElementById('leaderboard-body');
    body.innerHTML = lb.slice(0, 35).map((e, i) => `
        <tr class="${i === 0 ? 'rank-1-highlight' : ''}">
            <td>${i + 1}${i === 0 ? ' 👑' : ''}</td>
            <td>${e.name}</td>
            <td>${e.score}</td>
        </tr>
    `).join('');
    
    if (lb.length > 0) triggerCelebration();
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function triggerCelebration() {
    const container = document.createElement('div');
    container.className = 'celebration-container';
    document.body.appendChild(container);
    const gift = document.createElement('div');
    gift.className = 'gift-box'; gift.textContent = '🎁';
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

restartBtn.addEventListener('click', () => location.reload());
