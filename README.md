# 🎮 userSabrina

Um jogo educativo para aprender histórias de usuário de forma interativa!

<img width="1300" height="619" alt="image" src="https://github.com/user-attachments/assets/37c97894-5000-4ce7-9517-825552fa1ff6" />

## 📋 Descrição

Este projeto é um jogo 2D onde o jogador controla um personagem e aprende sobre histórias de usuário (User Stories) através de interações com o cenário e objetos.

## 🚀 Como Executar

### Opção 1: Acessar o projeto por meio do GitHub Pages

Você pode acessar ao jogo por meio deste link: [Github Pages]([https://gabriel-aires09.github.io/origintomorow/](https://gabriel-aires09.github.io/userSabrina/)). Criamos uma branch própria hospedada no Github Pages para acesso e conhecimentos de desenvolvedores/estudantes de engenharia de software e áreas correlatas. Todos os novos recursos, mecânicas e funcionalidades serão também atualizadas neste link. Nossa intenção é apresentar nossas ideias, de maneira acessível, para outras pessoas interessadas no projeto.

### Opção 2: Live Server (VS Code)
1. Instale a extensão "Live Server"
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

## 📁 Estrutura do Projeto

```
user-story-game/
├── index.html              # Página principal
├── assets/                 # Recursos do jogo
│   ├── background/        # Imagens de fundo
│   └── sabrina/          # Sprites do personagem
├── css/                   # Estilos
│   ├── menu.css          # Estilos do menu
│   ├── game.css          # Estilos do jogo
│   └── modal.css         # Estilos dos modais
├── js/                    # Scripts
│   ├── menu.js           # Lógica do menu
│   ├── game.js           # Lógica principal do jogo
│   ├── player.js         # Controle do personagem
│   ├── sprites.js        # Carregamento de sprites
│   └── data/             # Dados do jogo
│       ├── userStories.js  # Histórias de usuário
│       └── obstacles.js    # Obstáculos do cenário
└── README.md             # Documentação
```

## 🎮 Controles

- **WASD** ou **Setas do teclado**: Mover o personagem
- **Colida com objetos**: Ver histórias de usuário
- **Botão "Voltar ao Menu"**: Retornar ao menu principal

## 📚 Histórias de Usuário

### Menu (US-M01 a US-M04)
- Visualizar menu principal
- Iniciar jogo
- Ver histórias do menu
- Retornar ao menu

### Jogo (US-001 a US-007)
- Movimentação (esquerda, direita, cima, baixo)
- Colisão com objetos (caixa, presente, estrela)

## 🎨 Sprites

Os sprites devem estar organizados em:
```
assets/sabrina/
├── idle-right/   # Parado olhando para direita
├── idle-left/    # Parado olhando para esquerda
├── idle-up/      # Parado olhando para cima
├── idle-down/    # Parado olhando para baixo
├── walk-right/   # Andando para direita
├── walk-left/    # Andando para esquerda
├── walk-up/      # Andando para cima
└── walk-down/    # Andando para baixo
```

Cada pasta deve conter sprites numerados: `1.png`, `2.png`, `3.png`, etc.

## 🛠️ Personalização

### Adicionar Nova História de Usuário

Edite `js/data/userStories.js`:

```javascript
novaHistoria: {
    id: "US-XXX",
    title: "Título da História",
    description: "Descrição completa...",
    scenarios: [{
        name: "Nome do Cenário",
        conditions: ["Condição 1", "Condição 2"],
        action: "Ação executada",
        results: ["Resultado 1", "Resultado 2"]
    }]
}
```

### Adicionar Novo Obstáculo

Edite `js/data/obstacles.js`:

```javascript
{ x: 300, y: 400, width: 60, height: 60, color: '#3b82f6', icon: '🎯', type: 'target' }
```

### Mudar Cenário de Fundo

Substitua o arquivo `assets/background/scenario.png`

### Ajustar Tamanho do Personagem

Em `css/game.css`, modifique:
```css
.player {
    width: 96px;   /* Largura */
    height: 144px; /* Altura */
}
```

## 📝 Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)

## 🎓 Objetivo Educacional

Este jogo foi desenvolvido para ensinar conceitos de **User Stories** de forma prática e interativa, demonstrando:
- Estrutura de histórias de usuário
- Cenários de teste (Dado/Quando/Então)
- Critérios de aceite
- Interação usuário-sistema

## 👨‍💻 Autores

<p align="left">
	<img width="100"
	     	align="left"
		alt="Gabriel"
		src="https://i.imgur.com/4b3eRBA.png"
		<br><br>
		Meu nome é Gabriel Aires, natural de Palmas (TO). Estudo Engenharia de software no Centro Universitário Católica do Tocantins. Tenho como paixões jogar videogame, codar e ler.
		<br><strong>Artes, Codificação, Documentação e Ideias</strong>
</p>

<br>

<p align="left">
	<img width="100"
	     	align="left"
		alt="Jonathan"
		src="https://i.imgur.com/Dek9BJr.png"
		<br><br>
		Meu nome é Jonathan Rodrigues. Atualmente, estudo Engenharia de software no Centro Universitário Católica do Tocantins. Tenho como paixões desenhar, jogar videogame, colocar o headphone no talo e programar.
		<br><strong>Artes e Documentação</strong>  
</p>
