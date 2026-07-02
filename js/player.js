// Gerenciamento do Player
function updatePlayerSprite(gameState) {
    const player = document.getElementById('player');
    const playerIcon = document.getElementById('playerIcon');
    const playerState = document.getElementById('playerState');
    const playerDirection = document.getElementById('playerDirection');
    
    const type = gameState.isMoving ? 'walk' : 'idle';
    const sprites = gameState.sprites[type][gameState.direction];
    
    if (sprites.length > 0) {
        const frame = gameState.currentFrame % sprites.length;
        player.innerHTML = `<img src="${sprites[frame]}" alt="player">`;
    } else {
        const icons = { right: '➡️', left: '⬅️', up: '⬆️', down: '⬇️' };
        playerIcon.textContent = icons[gameState.direction];
        playerState.textContent = gameState.isMoving ? 'WALK' : 'IDLE';
        playerDirection.textContent = gameState.direction;
    }
}

function updatePlayerPosition(x, y) {
    const player = document.getElementById('player');
    player.style.left = (x - player.offsetWidth / 2) + 'px';
    player.style.top = (y - player.offsetHeight / 2) + 'px';
}