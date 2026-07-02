// Gerenciamento de Sprites
async function loadSprites() {
    const newSprites = {
        idle: { right: [], left: [], up: [], down: [] },
        walk: { right: [], left: [], up: [], down: [] }
    };

    const directions = ['right', 'left', 'up', 'down'];
    const types = ['idle', 'walk'];

    for (const type of types) {
        for (const dir of directions) {
            const folderPath = `${type}-${dir}`;
            
            for (let i = 1; i <= 10; i++) {
                const path = `assets/sabrina/${folderPath}/${i}.png`;
                const img = new Image();

                const loaded = await new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = path;
                });

                if (!loaded) break;
                newSprites[type][dir].push(path);
            }
        }
    }

    return newSprites;
}