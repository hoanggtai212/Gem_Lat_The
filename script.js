const music = document.getElementById("bg-music");
const topicContainer = document.getElementById("topic-container");
const playlistContainer = document.getElementById("playlist-container");
const fallingContainer = document.getElementById("falling-container");
const gameBoard = document.getElementById("game-board");
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const resultModal = document.getElementById("result-modal");
const pauseModal = document.getElementById("pause-modal");

const levelVal = document.getElementById("level-val");
const timerBar = document.getElementById("timer-bar");
const scoreVal = document.getElementById("score-val");
const modalTitle = document.getElementById("modal-title");
const finalScoreVal = document.getElementById("final-score-val");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownText = document.getElementById("countdown-text");

const sfxWin = document.getElementById("sound-win");
const sfxFail = document.getElementById("sound-fail");
const sfxPop = document.getElementById("sound-pop");
const sfxSwap = document.getElementById("sound-swap");
const sfxTing = document.getElementById("sound-ting");
const sfxMoney = document.getElementById("sound-money");
const SoundManager = {
    masterVolume: 1,
    sounds: {},

    init() {
        this.sounds = {
            win: document.getElementById("sound-win"),
            fail: document.getElementById("sound-fail"),
            pop: document.getElementById("sound-pop"),
            swap: document.getElementById("sound-swap"),
            ting: document.getElementById("sound-ting"),
            money: document.getElementById("sound-money"),
            music: document.getElementById("bg-music"),
        };
    },

setVolume(v) {
    this.masterVolume = v;
    Object.values(this.sounds).forEach(audio => {
        if (!audio) return;
        audio.volume = v;
        if (v <= 0.0001) {
            audio.muted = true;
            audio.pause();
        } else {
            audio.muted = false;
        }
    });
    syncVolumeUI();
},


    
    play(name) {
        const sound = this.sounds[name];
        if (!sound) return;

        sound.currentTime = 0;
        sound.volume = this.masterVolume;
        sound.play();
    },

playMusic() {
    const music = this.sounds.music;

    if (this.masterVolume <= 0) return;

    music.volume = this.masterVolume;
    music.muted = false;
    music.play();
},

    stopMusic() {
        this.sounds.music.pause();
    }
};

let isMusicPlaying = false;
let currentTopic = "Gavv";
let currentLevel = 1;
SoundManager.masterVolume = 0.5;
let combo = 0;
let maxCombo = 0;

const availableTopics = [
    { name: "Gavv", iconCount: 16, level1Count: 10, level2Count: 17, logo: "asset/logo/KittyTraiTim.png" },
    { name: "Kingohger", iconCount: 11, level1Count: 12, level2Count: 17, logo: "asset/logo/KittyNuHoang.png" },
    { name: "Zeztz", iconCount: 14, level1Count: 10, level2Count: 23, logo: "asset/logo/KittyUnCoffe.png" },
];

const playlist = [
    "asset/sound/GotBoost.mp3",
    "asset/sound/ShakeItOff.mp3",
    "asset/sound/ZenryokuKing.mp3",
    "asset/sound/VISIONS.mp3",
];
let currentTrackIndex = 0;

let flippedCards = [];
let matchedPairs = 0;
let isTransitioning = false;
let totalPairs = 8;

let score = 100;
let timeLeft = 60;
let totalInitialTime = 60;
let gameTimer = null;
let backgroundInterval = null;
let isGameRunning = false;
let canClick = false;
let isPaused = false;
let consecutiveMistakes = 0;
const savedVolume = localStorage.getItem("game_volume");
const savedTopic = localStorage.getItem("game_topic");

window.onload = () => {
    SoundManager.init();
    if (savedVolume !== null) {
        SoundManager.setVolume(parseFloat(savedVolume));
    }
    if (savedTopic) {
        currentTopic = savedTopic;
    }
    renderTopics();
    renderPlaylist();
    if (volumeSlider && volumeValue) {
        volumeSlider.value = SoundManager.masterVolume * 100;
        volumeValue.innerText = volumeSlider.value + "%";
    }
    syncVolumeUI();
};

function renderTopics() {
    topicContainer.innerHTML = "";
    availableTopics.forEach((topic) => {
        const item = document.createElement("label");
        item.className = "topic-item";
        item.innerHTML = `
                <input type="radio" name="game-topic" value="${topic.name}" ${topic.name === currentTopic ? "checked" : ""} onchange="selectTopic('${topic.name}')">
                <div class="topic-logo-wrapper">
                    <img src="${topic.logo}" alt="${topic.name} logo" class="topic-logo">
                </div>
                <span>${topic.name}</span>
            `;
        topicContainer.appendChild(item);
    });
}

function showCombo(multiplier) {
    const comboText = document.getElementById("combo-text");

    comboText.innerText = `x${multiplier} 🔥`;

    comboText.classList.remove("combo-show");
    void comboText.offsetWidth;
    comboText.classList.add("combo-show");

    setTimeout(() => {
        comboText.classList.remove("combo-show");
    }, 800);
}

function showFrame(frameId) {
    const frames = [
        "main-options",
        "level-frame",
        "settings-frame",
        "topic-frame",
        "tutorial-frame",
        "playlist-frame",
        "volume-frame",
    ];
    frames.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    const target = document.getElementById(frameId);
    if (target) target.style.display = "flex";
}

function selectTopic(topicName) {
    const btn = document.getElementById("topic-back-btn");
    if (topicName !== currentTopic) {
        btn.innerText = "Save";
        btn.onclick = () => saveTopic(topicName);
        btn.style.background = "linear-gradient(135deg, #FFD700, #FFA500)";
        btn.style.color = "#8B0000";
    } else {
        btn.innerText = "Back";
        btn.onclick = () => showFrame("settings-frame");
        btn.style.background = "";
        btn.style.color = "";
    }
}

function saveTopic(newTopic) {
    currentTopic = newTopic;
    localStorage.setItem("game_topic", newTopic); // ✅ lưu
    showToast();
    showFrame("main-options");
    // Reset button for next entry
    const btn = document.getElementById("topic-back-btn");
    btn.innerText = "Back";
    btn.onclick = () => showFrame("settings-frame");
    btn.style.background = "";
    btn.style.color = "";
}

function showToast() {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

function updateUI() {
    scoreVal.innerText = score;
    const percentage = (timeLeft / totalInitialTime) * 100;
    timerBar.style.width = percentage + "%";

    // Change color based on time remaining
    if (percentage < 25) {
        timerBar.style.background = "linear-gradient(90deg, #ff4d4d, #ff0000)";
    } else {
        timerBar.style.background = "linear-gradient(90deg, #FFD700, #FFA500)";
    }
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(() => {
        if (isPaused) return;
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
            gameOver("timeout");
        }
    }, 1000);
}

function runCountdown(callback) {
    countdownOverlay.style.display = "flex";
    let count = 3;

    const updateCount = (val) => {
        countdownText.innerText = val;
        countdownText.classList.remove("count-animate");
        void countdownText.offsetWidth; // Trigger reflow
        countdownText.classList.add("count-animate");
        playSFX(sfxTing);
    };

    updateCount(count);

    const countInt = setInterval(() => {
        count--;
        if (count > 0) {
            updateCount(count);
        } else if (count === 0) {
            updateCount("GO!");
        } else {
            clearInterval(countInt);
            countdownOverlay.style.display = "none";
            callback();
        }
    }, 1000);
}

function startGame(level) {
    currentLevel = level;
    canClick = false;
    levelVal.innerText = level;

    if (!isMusicPlaying) {
    playTrack(currentTrackIndex);
    }
    
    // Reset Stats
    score = 100;
    timeLeft = level === 1 ? 120 : 60;
    totalInitialTime = timeLeft;

    // Set Topic Logo in board background
    const topicData = availableTopics.find(t => t.name === currentTopic);
    document.getElementById("board-logo-bg").src = topicData.logo;

    updateUI();

    // UI Switch
    menuScreen.style.display = "none";
    gameScreen.style.display = "flex";
    resultModal.style.display = "none";
    pauseModal.style.display = "none";
    isGameRunning = false;
    isPaused = false;
    consecutiveMistakes = 0;

    // Setup Board (Hidden cards initially)
    setupGame(level);
    updateBoardLayout();
    
gameBoard.style.justifyContent = "center";
gameBoard.style.alignContent = "center";
gameBoard.style.justifyItems = "center";
gameBoard.style.margin = "0 auto";

// Start Countdown
runCountdown(() => {
    isGameRunning = true;
    canClick = true;
    startTimer();
});

// Background
if (backgroundInterval) clearInterval(backgroundInterval);
spawnBackgroundBatch();
backgroundInterval = setInterval(spawnBackgroundBatch, 8000);
}

function setupGame(level) {
    const topicData = availableTopics.find((t) => t.name === currentTopic);
    gameBoard.innerHTML = "";
    gameBoard.className = `game-board level-${level}`;
    flippedCards = [];
    matchedPairs = 0;
    isTransitioning = false;

    totalPairs = Math.min(level + 1, 12);

    let deck = [];
    if (level === 3) {
        // Level 3: Mix Level 1 and Level 2 cards
        const p1 = Math.floor(totalPairs / 2);
        const p2 = totalPairs - p1;

        const s1 = getIndices(topicData.level1Count, p1);
        const s2 = getIndices(topicData.level2Count, p2);

        const d1 = s1.map((idx) => ({ idx, folder: "level1" }));
        const d2 = s2.map((idx) => ({ idx, folder: "level2" }));
        const pairs = [...d1, ...d2];
        deck = [...pairs, ...pairs].map((item) => ({ ...item }));
    } else {
        const folder = `level${level}`;
        const totalAvailable =
            level === 1 ? topicData.level1Count : topicData.level2Count;
        const selectedIndices = getIndices(totalAvailable, totalPairs);
        deck = [...selectedIndices, ...selectedIndices].map((idx) => ({
            idx,
            folder,
        }));
    }

    for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const backImg = `asset/img/${currentTopic}/back.jpg`;

    deck.forEach((cardData, i) => {
        const card = document.createElement("div");
        card.className = "card dealing";
        card.style.setProperty("--deal-delay", i * 0.05 + "s");
        card.dataset.index = cardData.idx;
        card.dataset.folder = cardData.folder; // Distinguish between same index in different folders
        card.innerHTML = `
          <div class="card-face card-back" style="background-image: url('${backImg}')"></div>
          <div class="card-face card-front">
            <img src="asset/img/${currentTopic}/${cardData.folder}/Card (${cardData.idx}).jpg" alt="card">
          </div>
        `;
        card.onclick = () => flipCard(card);
        gameBoard.appendChild(card);

        // Remove dealing class after animation
        setTimeout(() => {
            card.classList.remove("dealing");
        }, 1500);
    });
}

function getIndices(total, count) {
    const numbers = [];
    while (numbers.length < count) {
        let rand = Math.floor(Math.random() * total) + 1;
        if (!numbers.includes(rand)) {
            numbers.push(rand);
        }
    }
    return numbers;
}

function flipCard(card) {
    if (
        !canClick ||
        isPaused ||
        isTransitioning ||
        flippedCards.includes(card) ||
        card.classList.contains("matched") ||
        card.classList.contains("flipped")
    )
        return;

    playSFX(sfxSwap);
    card.classList.add("flipped");
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    isTransitioning = true;
    const [card1, card2] = flippedCards;

    if (
        card1.dataset.index === card2.dataset.index &&
        card1.dataset.folder === card2.dataset.folder
    ) {
        setTimeout(() => {
            card1.classList.add("matched");
            card2.classList.add("matched");
            playSFX(sfxMoney);

            // ✅ COMBO LOGIC
            combo++;

            let baseScore = 5;
            let multiplier = 1;

            // chỉ từ lần 2 mới nhân
            if (combo >= 2) {
                multiplier = combo; // x2, x3, x4...
                showCombo(multiplier);
            }

            let bonus = baseScore * multiplier;
            updateScore(bonus);

            maxCombo = Math.max(maxCombo, combo);

            console.log("Combo:", combo, "x" + multiplier);

            matchedPairs++;
            consecutiveMistakes = 0;
            flippedCards = [];
            isTransitioning = false;

            if (matchedPairs === totalPairs) {
                gameOver("complete");
            }
        }, 600);
    } else {
        setTimeout(() => {
            card1.classList.remove("flipped");
            card2.classList.remove("flipped");

            const penalty = currentLevel >= 2 ? -10 : -5;
            updateScore(penalty);

            combo = 0; // ❗ reset combo khi sai

            flippedCards = [];
            consecutiveMistakes++;

            const limit = Math.max(5 - Math.floor(currentLevel / 5), 3);
            if (consecutiveMistakes >= limit) {
                const cards = document.querySelectorAll(".card:not(.matched)");

                cards.forEach(card => card.classList.add("shake"));
                setTimeout(() => {
                    cards.forEach(card => card.classList.remove("shake"));
                    shuffleRemainingCards();
                }, 300);

                consecutiveMistakes = 0;
            }

            isTransitioning = false;
        }, 1000);
    }
}

function shuffleRemainingCards() {
    const cards = Array.from(gameBoard.querySelectorAll(".card:not(.matched)"));
    if (cards.length === 0) return;

    // 1. First: Record current positions
    const firstPositions = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
    });

    cards.sort(() => Math.random() - 0.5);
    cards.forEach(card => gameBoard.appendChild(card));
    
    // Record new positions after DOM update
    const lastPositions = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return { left: rect.left, top: rect.top };
    });

    // 3. Invert & Play: Animate from old to new
    cards.forEach((card, i) => {
        const dx = firstPositions[i].left - lastPositions[i].left;
        const dy = firstPositions[i].top - lastPositions[i].top;

        // Apply inverse transform instantly
        card.style.transition = "none";
        card.style.transform = `translate(${dx}px, ${dy}px)`;

        // Trigger reflow to ensure the transform is applied before transition
        void card.offsetHeight;

        // Apply transition to animate back to original (0,0) position
        card.style.transition = "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
        card.style.transform = "";
    });

    // Play shuffle sound
    playSFX(sfxSwap);
}

function gameOver(reason) {
    clearInterval(gameTimer);
    isGameRunning = false;

    let title = "Thất Bại";
    let isSuccess = false;

    if (reason === "complete") {
    if (score >= 50) {
        if (currentLevel === 3) {
            title = "🎉 YOU WIN GAME 🎉";
        } else {
            title = "Thành Công";
        }
        isSuccess = true;
    } else {
        title = "Điểm dưới 50";
        isSuccess = false;
    }
} else if (reason === "timeout") {
        title = "Hết thời gian";
        isSuccess = false;
    } else if (reason === "no-score") {
        title = "Hết điểm";
        isSuccess = false;
    } else if (reason === "quit") {
        title = "Bỏ cuộc";
        isSuccess = false;
    }

    if (isSuccess) {
        playSFX(sfxWin);
    } else {
        playSFX(sfxFail);
    }

    modalTitle.innerText = title;
    modalTitle.className = "modal-title " + (isSuccess ? "success" : "failure");
    finalScoreVal.innerText = score;

    // Set Result Topic Logo
    const topicData = availableTopics.find(t => t.name === currentTopic);
    document.getElementById("result-topic-logo").src = topicData.logo;

    const modalButtons = document.getElementById("modal-buttons-container");
    modalButtons.innerHTML = "";

    if (isSuccess) {
    modalButtons.innerHTML = `
        <button class="btn" onclick="startGame(${currentLevel})">Replay</button>
        ${
            currentLevel < 11
                ? `<button class="btn" onclick="startGame(${currentLevel + 1})">Next Level</button>`
                : `<button class="btn" onclick="startGame(1)">Play Again</button>`
        }
        <button class="btn exit-btn" onclick="exitGame()">Exit</button>
        `;
    } else {
        const retryLevel = currentLevel >= 2 ? 1 : currentLevel;
        modalButtons.innerHTML = `
          <button class="btn" onclick="startGame(${retryLevel})">Replay</button>
          <button class="btn exit-btn" onclick="exitGame()">Exit</button>
        `;
    }

    resultModal.style.display = "flex";
}

function restartLevel() {
    pauseModal.style.display = "none";
    const startLvl = currentLevel >= 2 ? 1 : currentLevel;
    startGame(startLvl);
}

function pauseGame() {
    if (!isGameRunning || countdownOverlay.style.display === "flex") return;
    isPaused = true;
    pauseModal.style.display = "flex";
}

function resumeGame() {
    isPaused = false;
    pauseModal.style.display = "none";
}

function exitGame() {
    if (isGameRunning || isPaused) {
        // If exiting while game is running/paused, count as failure
        isGameRunning = false;
        isPaused = false;
        gameOver("quit");
        return;
    }

    clearInterval(gameTimer);
    if (backgroundInterval) {
        clearInterval(backgroundInterval);
        backgroundInterval = null;
    }
    menuScreen.style.display = "flex";
    gameScreen.style.display = "none";
    resultModal.style.display = "none";
    pauseModal.style.display = "none";
    showFrame("main-options");
    fallingContainer.innerHTML = "";
}

function spawnBackgroundBatch() {
    const topicData = availableTopics.find((t) => t.name === currentTopic);
    const cols = 5;
    const rows = 3;
    const cellWidth = 100 / cols;
    const cellHeight = 100 / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.3) {
                const iconIndex = Math.floor(Math.random() * topicData.iconCount) + 1;
                const icon = document.createElement("img");
                icon.src = `asset/img/${currentTopic}/icon/icon (${iconIndex}).png`;
                icon.className = "falling-icon";
                const posX = c * cellWidth + Math.random() * cellWidth;
                const posY = r * cellHeight + Math.random() * cellHeight;
                const size = 50 + Math.random() * 60;
                const startRot = Math.random() * 60 - 30;
                const midRot = Math.random() * 40 - 20;
                icon.style.left = `calc(${posX}% - ${size / 2}px)`;
                icon.style.top = `calc(${posY}% - ${size / 2}px)`;
                icon.style.width = size + "px";
                icon.style.height = size + "px";
                icon.style.setProperty("--rot-start", startRot + "deg");
                icon.style.setProperty("--rot-mid", midRot + "deg");
                const delay = Math.random() * 1.5;
                icon.style.animationDelay = delay + "s";
                fallingContainer.appendChild(icon);
                setTimeout(
                    () => {
                        icon.remove();
                    },
                    (5 + delay) * 1000,
                );
            }
        }
    }
}

function playTrack(index) {
    if (currentTrackIndex === index) {
        if (isMusicPlaying) {
            music.pause();
            isMusicPlaying = false;
        } else {
            music.play().then(() => {
                isMusicPlaying = true;
                updateMusicButtonUI();
            }).catch(e => console.log(e));
        }
        updateMusicButtonUI();
        return;
    }

    currentTrackIndex = index;
    music.src = playlist[index];
    music
        .play()
        .then(() => {
            isMusicPlaying = true;
            updateMusicButtonUI();
        })
        .catch((error) => {
            console.log(error);
        });
}

function updateMusicButtonUI() {
    const pauseMusicBtn = document.getElementById("pause-music-btn");
    if (pauseMusicBtn) {
        pauseMusicBtn.innerText = isMusicPlaying ? "Music: ON" : "Music: OFF";
        if (isMusicPlaying) pauseMusicBtn.classList.add("active");
        else pauseMusicBtn.classList.remove("active");
    }

    // Update playlist checkmarks
    renderPlaylist();
}

function toggleMusic() {
    if (isMusicPlaying) {
        music.pause();
        isMusicPlaying = false;
        updateMusicButtonUI();
    } else {
        playTrack(currentTrackIndex);
    }
}

function openPlaylist() {
    renderPlaylist();
    showFrame("playlist-frame");
}

function renderPlaylist() {
    if (!playlistContainer) return;
    playlistContainer.innerHTML = "";
    playlist.forEach((track, index) => {
        const fileName = track.split("/").pop().replace(".mp3", "");
        const item = document.createElement("div");
        item.className = "topic-item";

        // Style for selected track
        if (currentTrackIndex === index) {
            item.style.border = "2px solid var(--wave-color)";
            item.style.background = "rgba(255, 215, 0, 0.3)";
        }

        item.onclick = () => playTrack(index);

        let icon = "";
        if (currentTrackIndex === index) {
            icon = isMusicPlaying ? '<span class="music-icon"><i class="fa-solid fa-play"></i></span>' : '<span class="music-icon"><i class="fa-solid fa-pause"></i></span>';
        }

        item.innerHTML = `
            <span style="flex: 1">${fileName}</span>
            ${icon}
        `;
        playlistContainer.appendChild(item);
    });
}

music.addEventListener("ended", () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    playTrack(currentTrackIndex);
});

function playSFX(audio) {
    if (!audio) return;
    if (SoundManager.masterVolume <= 0) return;
    try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = SoundManager.masterVolume;
        audio.play();
    } catch (e) {}
}

const volumeSlider = document.getElementById("volume-slider");
const volumeValue = document.getElementById("volume-value");

if (volumeSlider) {
volumeSlider.addEventListener("input", (e) => {
    const v = Number(e.target.value) / 100;
    SoundManager.setVolume(v);
    localStorage.setItem("game_volume", v);
    syncVolumeUI(); // 🔥 thêm dòng này
});
}

function syncVolumeUI() {
    const v = Math.round(SoundManager.masterVolume * 100);
    if (volumeSlider) {
        volumeSlider.value = v;
    }
    if (volumeValue) {
        volumeValue.innerText = v + "%";
    }
}

let lastClick = 0;
document.addEventListener("click", () => {
    if (!isMusicPlaying) {
        music.play().then(() => {
            music.pause();
        }).catch(()=>{});
    }
}, { once: true });

function applyVolume() {
    const v = SoundManager.masterVolume;
    music.volume = v;
    sfxWin.volume = v;
    sfxFail.volume = v;
    sfxPop.volume = v;
    sfxSwap.volume = v;
    sfxTing.volume = v;
    sfxMoney.volume = v;
}

function updateScore(delta) {
    score += delta;
    if (score <= 0) {
        score = 0;
        scoreVal.innerText = score.toLocaleString();
        gameOver("no-score"); // Fail if score is 0
        return;
    }

    scoreVal.innerText = score;

    // Animations
    const animClass = delta > 0 ? "score-up" : "score-down";
    scoreVal.classList.remove("score-up", "score-down");
    void scoreVal.offsetWidth; // Trigger reflow
    scoreVal.classList.add(animClass);

    setTimeout(() => {
        scoreVal.classList.remove(animClass);
    }, 500);
}

function updateBoardLayout() {
    const totalCards = totalPairs * 2;

    let cols = Math.ceil(Math.sqrt(totalCards));
    let rows = Math.ceil(totalCards / cols);

    if (totalCards % cols === 1) {
        cols--;
        rows = Math.ceil(totalCards / cols);
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let cardSize = Math.min(
        (screenWidth * 0.9) / cols,
        (screenHeight * 0.6) / rows
    );

    cardSize = Math.max(50, Math.min(100, cardSize));

    gameBoard.style.gridTemplateColumns = `repeat(${cols}, ${cardSize}px)`;
    gameBoard.style.maxWidth = `${cardSize * cols}px`;
}


