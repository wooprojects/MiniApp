// Initialize Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Game State
const gameState = {
    gold: 100,
    food: 50,
    soldiers: 10,
    level: 1,
    experience: 0,
    turn: 1,
    map: [],
    selectedTile: null,
    selectedBuilding: null,
    playerName: 'امپراتور'
};

// DOM Elements
const elements = {
    goldValue: document.getElementById('gold-value'),
    foodValue: document.getElementById('food-value'),
    soldiersValue: document.getElementById('soldiers-value'),
    gameMap: document.getElementById('game-map'),
    gameLog: document.getElementById('game-log'),
    buildModal: document.getElementById('build-modal'),
    confirmBuild: document.getElementById('confirm-build'),
    cancelBuild: document.getElementById('cancel-build'),
    playerName: document.getElementById('player-name'),
    playerLevel: document.getElementById('player-level')
};

// Building Types
const buildingTypes = {
    empty: { name: 'زمین خالی', icon: '⬜', cost: 0, benefit: '' },
    castle: { name: 'قلعه', icon: '🏰', cost: 0, benefit: 'مرکز فرماندهی' },
    farm: { name: 'مزرعه', icon: '🌾', cost: 20, benefit: 'تولید غذا' },
    mine: { name: 'معدن', icon: '⛏️', cost: 30, benefit: 'تولید طلا' },
    barracks: { name: 'پادگان', icon: '⚔️', cost: 50, benefit: 'تولید سرباز' },
    market: { name: 'بازار', icon: '🏪', cost: 40, benefit: 'درآمد اضافی' }
};

// Initialize Game
function initGame() {
    loadGameState();
    generateMap();
    updateUI();
    setupEventListeners();
    addToLog('خوش آمدید، امپراتور! امپراتوری خود را بسازید...');
}

// Generate Game Map
function generateMap() {
    gameState.map = [];
    const mapSize = 25; // 5x5 grid
    
    for (let i = 0; i < mapSize; i++) {
        if (i === 12) { // Center tile
            gameState.map.push('castle');
        } else {
            gameState.map.push('empty');
        }
    }
    
    renderMap();
}

// Render Game Map
function renderMap() {
    elements.gameMap.innerHTML = '';
    
    gameState.map.forEach((tileType, index) => {
        const tile = document.createElement('div');
        tile.className = `tile ${tileType}`;
        tile.innerHTML = buildingTypes[tileType].icon;
        tile.setAttribute('data-index', index);
        tile.setAttribute('data-type', tileType);
        
        tile.addEventListener('click', () => handleTileClick(index, tileType));
        elements.gameMap.appendChild(tile);
    });
}

// Handle Tile Click
function handleTileClick(index, type) {
    if (type === 'empty') {
        gameState.selectedTile = index;
        showBuildModal();
    } else {
        addToLog(`این ${buildingTypes[type].name} است. ${buildingTypes[type].benefit}`);
    }
}

// Show Build Modal
function showBuildModal() {
    const buildOptions = document.querySelectorAll('.build-option');
    
    buildOptions.forEach(option => {
        option.addEventListener('click', () => {
            buildOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            gameState.selectedBuilding = option.getAttribute('data-building');
        });
        
        option.classList.remove('selected');
    });
    
    gameState.selectedBuilding = null;
    elements.buildModal.style.display = 'flex';
}

// Hide Build Modal
function hideBuildModal() {
    elements.buildModal.style.display = 'none';
    gameState.selectedTile = null;
    gameState.selectedBuilding = null;
}

// Build Structure
function buildStructure() {
    if (!gameState.selectedBuilding || gameState.selectedTile === null) return;
    
    const building = buildingTypes[gameState.selectedBuilding];
    
    if (gameState.gold >= building.cost) {
        gameState.gold -= building.cost;
        gameState.map[gameState.selectedTile] = gameState.selectedBuilding;
        
        addToLog(`✅ ${building.name} ساخته شد! (${building.cost}- طلا)`);
        updateUI();
        renderMap();
        hideBuildModal();
        
        // Save game state
        saveGameState();
    } else {
        addToLog('❌ طلای کافی ندارید!');
    }
}

// Game Actions
function collectTax() {
    const taxAmount = 25 + (gameState.level * 5);
    gameState.gold += taxAmount;
    addToLog(`💰 ${taxAmount} طلا از مالیات جمع‌آوری شد.`);
    nextTurn();
}

function trainSoldiers() {
    const cost = 10;
    if (gameState.gold >= cost && gameState.food >= 5) {
        gameState.gold -= cost;
        gameState.food -= 5;
        gameState.soldiers += 3;
        addToLog(`⚔ ۳ سرباز جدید آموزش دیدند.`);
        nextTurn();
    } else {
        addToLog('❌ منابع کافی برای آموزش سربازان ندارید!');
    }
}

function attackEnemy() {
    if (gameState.soldiers >= 5) {
        const success = Math.random() > 0.3;
        if (success) {
            const loot = Math.floor(Math.random() * 50) + 25;
            gameState.gold += loot;
            gameState.experience += 10;
            addToLog(`🔥 حمله موفق! ${loot} طلا به غنیمت گرفتید.`);
        } else {
            gameState.soldiers -= 2;
            addToLog(`💔 حمله شکست خورد! ۲ سرباز از دست دادید.`);
        }
        nextTurn();
    } else {
        addToLog('❌ سربازان کافی برای حمله ندارید!');
    }
}

function diplomacy() {
    const cost = 15;
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        const bonus = Math.floor(Math.random() * 20) + 10;
        gameState.food += bonus;
        addToLog(`🤝 مذاکره موفق! ${bonus} غذا از متحدان دریافت کردید.`);
        nextTurn();
    } else {
        addToLog('❌ طلای کافی برای دیپلماسی ندارید!');
    }
}

// Turn Management
function nextTurn() {
    gameState.turn++;
    
    // Passive income from buildings
    gameState.map.forEach(tile => {
        switch(tile) {
            case 'farm':
                gameState.food += 5;
                break;
            case 'mine':
                gameState.gold += 8;
                break;
            case 'barracks':
                if (gameState.food >= 2) {
                    gameState.soldiers += 1;
                    gameState.food -= 2;
                }
                break;
            case 'market':
                gameState.gold += 5;
                break;
        }
    });
    
    // Check for level up
    checkLevelUp();
    
    updateUI();
    saveGameState();
    addToLog(`📅 دور ${gameState.turn} آغاز شد.`);
}

// Level System
function checkLevelUp() {
    const requiredXP = gameState.level * 100;
    if (gameState.experience >= requiredXP) {
        gameState.level++;
        gameState.experience = 0;
        addToLog(`🎉 به سطح ${gameState.level} ارتقا یافتید!`);
        
        // Level up rewards
        gameState.gold += 50;
        gameState.soldiers += 5;
    }
}

// Update UI
function updateUI() {
    elements.goldValue.textContent = gameState.gold;
    elements.foodValue.textContent = gameState.food;
    elements.soldiersValue.textContent = gameState.soldiers;
    elements.playerLevel.textContent = `سطح ${gameState.level}`;
    
    // Update Telegram main button
    tg.MainButton.setText(`دور ${gameState.turn} - سطح ${gameState.level}`).show();
}

// Game Log
function addToLog(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry fade-in';
    logEntry.textContent = message;
    elements.gameLog.appendChild(logEntry);
    elements.gameLog.scrollTop = elements.gameLog.scrollHeight;
}

// Save/Load Game State
function saveGameState() {
    const saveData = {
        ...gameState,
        saveTime: Date.now()
    };
    tg.CloudStorage.setItem('empire_rose_save', JSON.stringify(saveData));
}

function loadGameState() {
    tg.CloudStorage.getItem('empire_rose_save').then(data => {
        if (data) {
            const savedState = JSON.parse(data);
            Object.assign(gameState, savedState);
            addToLog('🔄 بازی ذخیره شده بارگذاری شد.');
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            handleAction(action);
        });
    });
    
    // Build modal
    elements.confirmBuild.addEventListener('click', buildStructure);
    elements.cancelBuild.addEventListener('click', hideBuildModal);
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Tab switching logic can be added here
        });
    });
    
    // Telegram main button
    tg.MainButton.onClick(() => {
        addToLog('🏰 به امپراتوری خود خوش آمدید!');
    });
}

// Handle Game Actions
function handleAction(action) {
    switch(action) {
        case 'collect-tax':
            collectTax();
            break;
        case 'train-soldiers':
            trainSoldiers();
            break;
        case 'build-farm':
        case 'build-mine':
            // These are handled through the build modal
            break;
        case 'diplomacy':
            diplomacy();
            break;
        case 'attack':
            attackEnemy();
            break;
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', initGame);

// Handle page visibility change for auto-save
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        saveGameState();
    }
});

// Periodic auto-save
setInterval(saveGameState, 30000); // Save every 30 seconds
