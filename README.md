# ⚔️ Crônicas de Eldoria

RPG de fantasia medieval interativo com sistema completo de personagem, combate por turnos e narrativa ramificada.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Estilo | Tailwind CSS + Fontes Cinzel/Lora |
| Animações | Framer Motion |
| Estado | Zustand (com persist) |
| Deploy | Docker + Nginx |

## Funcionalidades

- 4 raças jogáveis (Elfo, Humano, Anão, Orc) com bônus únicos
- 4 classes (Guerreiro, Mago, Arqueiro, Ladino) com habilidades próprias
- Sistema de atributos (FOR, INT, DES, SAB, CAR, CON)
- 20+ nós narrativos com múltiplos caminhos e skill checks
- Combate por turnos com log narrativo
- Sistema de level up com distribuição de pontos
- Missões principais e secundárias
- Save automático via localStorage
- Interface responsiva (mobile-first)

## Rodar Localmente

```bash
npm install
npm run dev
# Acesse http://localhost:5173
```

## Docker (Produção)

```bash
# Build e sobe na porta 3000
docker compose up -d

# Ou build manual
docker build -t eldoria-rpg .
docker run -p 3000:80 eldoria-rpg
```

## Docker (Dev com hot-reload)

```bash
docker compose --profile dev up rpg-dev
# Acesse http://localhost:5173
```

## Estrutura do Projeto

```
src/
├── components/
│   └── game/          # CharacterPanel, QuestPanel
├── screens/           # IntroScreen, RaceScreen, ClassScreen,
│                      # AttributeScreen, GameScreen,
│                      # CombatScreen, LevelUpScreen, GameOverScreen
├── store/
│   └── gameStore.ts   # Estado global Zustand
├── types/
│   └── index.ts       # Tipos TypeScript + dados de raças/classes
├── App.tsx            # Roteamento entre telas
├── main.tsx
└── index.css          # Design system medieval
```

## Expandindo o Jogo

Para adicionar novos nós narrativos, edite `STORY_NODES` em `src/store/gameStore.ts`:

```ts
minha_cena: {
  text: 'Descrição da cena...',
  choices: [
    { id: 'c1', text: 'Ação do jogador', action: 'goto:proxima_cena' },
    { id: 'c2', text: 'Atacar inimigo',  action: 'combat:nome_inimigo' },
  ]
}
```

Tipos de `action` suportados:
- `goto:nodeId` — navegar para cena
- `combat:enemyId` — iniciar combate
- `skill_check:atributo:valor:sucesso:falha` — teste de atributo
- `quest:questId:goto:nodeId` — adicionar quest e navegar
- `gold:valor:goto:nodeId` — cobrar ouro e navegar
- `rest:goto:nodeId` — recuperar HP e navegar
