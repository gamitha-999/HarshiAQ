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
    clearAll: () => localStorage.clear()
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

// Initialize App
window.onload = () => {
    const savedName = State.get('playerName');
    const savedAdmin = State.get('isAdmin') === 'true';

    if (savedName) {
        playerName = savedName;
        isAdmin = savedAdmin;
        syncAllTabs(); // Initial sync
        setInterval(syncAllTabs, 1000); // Continuous sync
    }
};

// Consolidate Sync Logic for ALL screens
function syncAllTabs() {
    const gameState = State.get('gameState');
    const lobby = State.getJson('studyLobby');

    if (isAdmin) {
        // Admin UI Updates
        document.getElementById('admin-player-count').textContent = lobby.length;
        document.getElementById('admin-player-names').innerHTML = lobby.map(n => `<span class="player-tag">${n}</span>`).join('');
        const finished = parseInt(State.get('finishedPlayers')) || 0;
        const startBtn = document.getElementById('admin-start-btn');
        if (gameState === 'playing') {
            startBtn.textContent = `⌛ In Progress (${finished}/${lobby.length})`;
            startBtn.disabled = true;
        } else {
            startBtn.textContent = "🚀 Start Game Now";
            startBtn.disabled = false;
        }
        document.getElementById('admin-results-btn').disabled = (finished === 0);
        if (!screens.admin.classList.contains('active')) showScreen('admin');
    } else {
        // Student UI Sync
        if (!playerName) return;

        // 1. Kick/Reset Logic (Works on ANY screen)
        if (gameState === 'kick') {
            localStorage.clear();
            location.reload();
            return;
        }

        // 2. Navigation Logic based on Game State
        if (gameState === 'playing') {
            if (screens.lobby.classList.contains('active') || screens.home.classList.contains('active')) {
                startGame();
            }
        } else if (gameState === 'results') {
            if (screens.waiting.classList.contains('active')) {
                showFinalResults();
            }
        } else if (!gameState || gameState === 'lobby') {
            if (!screens.lobby.classList.contains('active')) {
                document.getElementById('display-player-name').textContent = playerName;
                showScreen('lobby');
            }
        }

        // 3. Update Lobby Count
        if (screens.lobby.classList.contains('active')) {
            document.getElementById('player-count').textContent = lobby.length;
        }
    }
}

// Join Logic
document.getElementById('join-btn').addEventListener('click', () => {
    const name = document.getElementById('player-name').value.trim();
    if (!name) return alert("Enter your name!");

    if (name.toLowerCase() === "admin") {
        const pw = prompt("Enter Password:");
        if (pw === "harshi") {
            isAdmin = true; playerName = "Admin";
            State.set('isAdmin', 'true'); State.set('playerName', 'Admin');
            State.set('gameState', 'lobby');
            location.reload();
        } else alert("Denied!");
    } else {
        playerName = name;
        State.set('isAdmin', 'false'); State.set('playerName', name);
        registerPlayer(name);
        location.reload();
    }
});

function registerPlayer(name) {
    let lobby = State.getJson('studyLobby');
    if (!lobby.includes(name)) {
        lobby.push(name);
        State.setJson('studyLobby', lobby);
    }
}

function showScreen(key) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[key].classList.add('active');
}

// Admin Controls
document.getElementById('admin-start-btn').addEventListener('click', () => {
    const lobby = State.getJson('studyLobby');
    if (lobby.length === 0) return alert("Wait for students!");
    State.set('finishedPlayers', '0');
    State.setJson('studyMasterLeaderboard', []);
    State.set('gameState', 'playing');
});

document.getElementById('admin-results-btn').addEventListener('click', () => {
    State.set('gameState', 'results');
});

document.getElementById('admin-restart-game-btn').addEventListener('click', () => {
    if (confirm("Restart and Kick All?")) {
        State.set('gameState', 'kick');
    }
});

document.getElementById('admin-reset-btn').addEventListener('click', () => {
    if (confirm("Clear Everything?")) {
        State.set('gameState', 'kick');
    }
});

// Game Logic
function startGame() {
    showScreen('game');
    questions = JSON.parse(JSON.stringify(originalQuestions));
    shuffle(questions);
    currentQuestionIndex = 0; score = 0;
    showQuestion();
}

function showQuestion() {
    clearInterval(timerInterval);
    const q = questions[currentQuestionIndex];
    document.getElementById('level-name').textContent = q.level;
    document.getElementById('question-text').textContent = q.question;
    document.getElementById('progress-bar').style.width = `${(currentQuestionIndex / questions.length) * 100}%`;
    document.getElementById('current-score').textContent = score;

    const optBox = document.getElementById('answer-options');
    optBox.innerHTML = '';
    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.textContent = opt; btn.className = 'option-btn';
        btn.onclick = () => handleAnswer(i);
        optBox.appendChild(btn);
    });

    timeLeft = 15;
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
    if (idx === correct) { score += 10; btns[idx].classList.add('correct'); }
    else { score -= 5; if (btns[idx]) btns[idx].classList.add('wrong'); btns[correct].classList.add('correct'); }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) showQuestion();
        else finishGame();
    }, 1000);
}

function finishGame() {
    showScreen('waiting');
    let lb = State.getJson('studyMasterLeaderboard');
    if (!lb.find(e => e.name === playerName)) {
        lb.push({ name: playerName, score: score });
        State.setJson('studyMasterLeaderboard', lb);
        let fin = parseInt(State.get('finishedPlayers')) || 0;
        State.set('finishedPlayers', (fin + 1).toString());
    }
}

function showFinalResults() {
    showScreen('result');
    document.getElementById('final-score-val').textContent = score;
    const lb = State.getJson('studyMasterLeaderboard');
    lb.sort((a, b) => b.score - a.score);
    document.getElementById('leaderboard-body').innerHTML = lb.slice(0, 50).map((e, i) => `
        <tr class="${i === 0 ? 'rank-1-highlight' : ''} ${e.name === playerName ? 'my-rank' : ''}">
            <td>${i + 1}${i === 0 ? ' 👑' : ''}</td>
            <td>${e.name}</td>
            <td>${e.score}</td>
        </tr>
    `).join('');
    triggerCelebration();
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

document.getElementById('leave-btn').addEventListener('click', () => {
    let lobby = State.getJson('studyLobby');
    State.setJson('studyLobby', lobby.filter(n => n !== playerName));
    localStorage.clear();
    location.reload();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
});
