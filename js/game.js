// Estado do Jogo
const gameState = {
    playerPos: { x: 150, y: 470 },
    direction: 'right',
    isMoving: false,
    keys: {},
    sprites: {
        idle: { right: [], left: [], up: [], down: [] },
        walk: { right: [], left: [], up: [], down: [] }
    },
    currentFrame: 0,
    lastAction: ''
};

let gameInitialized = false;
const gameArea = document.querySelector('.game-area');

// Renderizar Obstáculos
function renderObstacles() {
    const container = document.getElementById('obstacles');
    const gameArea = document.querySelector('.game-area');
    const bounds = gameArea.getBoundingClientRect();

    container.innerHTML = '';

    obstacles.forEach(obstacle => {
        // Mantém os itens confinados à .game-area: reposiciona qualquer
        // obstáculo que extrapolaria a largura/altura real do container
        // (ex.: quando a .story-panel reduz o espaço disponível).
        const x = Math.max(0, Math.min(bounds.width - obstacle.width, obstacle.x));
        const y = Math.max(0, Math.min(bounds.height - obstacle.height, obstacle.y));

        // Atualiza os dados do obstáculo para que checkCollision() use a
        // mesma posição que está sendo exibida na tela.
        obstacle.x = x;
        obstacle.y = y;

        const div = document.createElement('div');
        div.className = 'obstacle';
        div.style.left = x + 'px';
        div.style.top = y + 'px';
        div.style.width = obstacle.width + 'px';
        div.style.height = obstacle.height + 'px';
        div.dataset.type = obstacle.type;

        // ✅ Se o obstáculo tiver uma imagem, cria um elemento <img>
        if (obstacle.image) {
            const img = document.createElement('img');
            img.src = obstacle.image;
            img.alt = obstacle.type;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            div.appendChild(img);
        } else {
            // fallback (caso não tenha imagem)
            div.style.backgroundColor = obstacle.color || '#555';
            div.textContent = obstacle.icon || '';
        }

        container.appendChild(div);
    });
}


// Verificar Colisão
function checkCollision(x, y, obstacle) {
    const playerWidth = 64;
    const playerHeight = 64;
    return (
        x + playerWidth / 2 > obstacle.x &&
        x - playerWidth / 2 < obstacle.x + obstacle.width &&
        y + playerHeight / 2 > obstacle.y &&
        y - playerHeight / 2 < obstacle.y + obstacle.height
    );
}

// Mostrar História
function showStory(story, scenarios) {
    const storyEmpty = document.getElementById('storyEmpty');
    const storyContent = document.getElementById('storyContent');
    
    storyEmpty.style.display = 'none';
    storyContent.style.display = 'block';
    
    let html = `
        <div class="story-header">
            <div class="story-header-top">
                <span>📖</span>
                <span class="story-header-id">${story.id}</span>
            </div>
            <h2 class="story-header-title">${story.title}</h2>
            <p class="story-header-description">${story.description}</p>
        </div>
    `;
    
    scenarios.forEach(scenario => {
        html += `
            <div class="scenario-card">
                <h3 class="scenario-title">
                    <span>✓</span>
                    ${scenario.name}
                </h3>
                
                <div class="scenario-section">
                    <p class="scenario-label scenario-label-given">DADO QUE:</p>
                    <ul class="scenario-list">
                        ${scenario.conditions.map(c => 
                            `<li class="scenario-item-game scenario-item-given">${c}</li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="scenario-section">
                    <p class="scenario-label scenario-label-when">QUANDO:</p>
                    <p class="scenario-item-game scenario-item-when">${scenario.action}</p>
                </div>
                
                <div class="scenario-section">
                    <p class="scenario-label scenario-label-then">ENTÃO:</p>
                    <ul class="scenario-list">
                        ${scenario.results.map(r => 
                            `<li class="scenario-item-game scenario-item-then">
                                <span class="scenario-check">✓</span>
                                <span>${r}</span>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
        `;
    });
    
    storyContent.innerHTML = html;
}

// Game Loop
function gameLoop() {
    const speed = 3;
    const bounds = gameArea.getBoundingClientRect();
    let newX = gameState.playerPos.x;
    let newY = gameState.playerPos.y;
    let action = '';
    let scenarios = [];
    let moving = false;
    let newDirection = gameState.direction;

    if (gameState.keys['arrowleft'] || gameState.keys['a']) {
        newX -= speed;
        action = 'moveLeft';
        newDirection = 'left';
        moving = true;
        scenarios = [gameStories.moveLeft.scenarios[0]];
        newX = Math.max(0, newX); // antes: 60 → agora pode ir até o limite esquerdo da .game-area
    }

    if (gameState.keys['arrowright'] || gameState.keys['d']) {
        newX += speed;
        action = 'moveRight';
        newDirection = 'right';
        moving = true;
        scenarios = [gameStories.moveRight.scenarios[0]];
        newX = Math.min(bounds.width - 100, newX); // antes: window.innerWidth - 100 → agora respeita a largura real da .game-area
    }

    if (gameState.keys['arrowup'] || gameState.keys['w']) {
        newY -= speed;
        action = 'moveUp';
        newDirection = 'up';
        moving = true;
        scenarios = [gameStories.moveUp.scenarios[0]];
        newY = Math.max(0, newY); // antes: 320 → permite subir até o topo da .game-area
    }

    if (gameState.keys['arrowdown'] || gameState.keys['s']) {
        newY += speed;
        action = 'moveDown';
        newDirection = 'down';
        moving = true;
        scenarios = [gameStories.moveDown.scenarios[0]];
        newY = Math.min(bounds.height - 80, newY);
        // antes: window.innerHeight - 80 → agora respeita a altura real da .game-area
    }

    gameState.isMoving = moving;
    gameState.direction = newDirection;
    gameState.playerPos.x = newX;
    gameState.playerPos.y = newY;

    // Verificar colisões
    obstacles.forEach(obstacle => {
        if (checkCollision(newX, newY, obstacle)) {
            if (obstacle.type === 'box') {
                action = 'collisionBox';
                scenarios = [gameStories.collisionBox.scenarios[0]];
            } else if (obstacle.type === 'gift') {
                action = 'collisionGift';
                scenarios = [gameStories.collisionGift.scenarios[0]];
            } else if (obstacle.type === 'star') {
                action = 'collisionStar';
                scenarios = [gameStories.collisionStar.scenarios[0]];
            }
        }
    });

    if (action && action !== gameState.lastAction) {
        showStory(gameStories[action], scenarios);
        gameState.lastAction = action;
    } else if (!action) {
        gameState.lastAction = '';
    }

    updatePlayerPosition(newX, newY);

    document.getElementById('status').textContent =
        `Direção: ${gameState.direction} | ${moving ? 'Andando' : 'Parado'}`;

    updatePlayerSprite(gameState);
}

// Animação de Frames
let frameCounter = 0;
function animateFrames() {
    frameCounter++;
    if (gameState.isMoving) {
        if (frameCounter % 6 === 0) {
            gameState.currentFrame++;
        }
    } else {
        if (frameCounter % 24 === 0) {
            gameState.currentFrame++;
        }
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key.toLowerCase()] = false;
});

// Controles de Toque (mobile)
document.querySelectorAll('.touch-btn').forEach((btn) => {
    const key = btn.dataset.key;

    const press = (e) => {
        e.preventDefault();
        gameState.keys[key] = true;
    };
    const release = (e) => {
        e.preventDefault();
        gameState.keys[key] = false;
    };

    btn.addEventListener('touchstart', press);
    btn.addEventListener('touchend', release);
    btn.addEventListener('touchcancel', release);
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
});

// Reclampar posição do player e dos obstáculos ao redimensionar/rotacionar a tela
window.addEventListener('resize', () => {
    const bounds = gameArea.getBoundingClientRect();
    gameState.playerPos.x = Math.max(0, Math.min(bounds.width - 100, gameState.playerPos.x));
    gameState.playerPos.y = Math.max(0, Math.min(bounds.height - 80, gameState.playerPos.y));
    updatePlayerPosition(gameState.playerPos.x, gameState.playerPos.y);
    renderObstacles();
});

// Inicializar
async function init() {
    if (gameInitialized) return;
    
    gameState.sprites = await loadSprites();
    renderObstacles();
    
    setInterval(gameLoop, 1000 / 60);
    setInterval(animateFrames, 1000 / 60);
    
    gameInitialized = true;
}