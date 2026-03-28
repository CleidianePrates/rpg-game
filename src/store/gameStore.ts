import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  GameState, Character, Race, CharClass, Attributes, Screen,
  RACE_DATA, CLASS_DATA, calcStats, calcExpToNext,
  Enemy, CombatLog, Quest
} from '@/types'

const BASE_ATTRS: Attributes = {
  strength: 5, intelligence: 5, dexterity: 5,
  wisdom: 5, charisma: 5, constitution: 5
}

interface Store extends GameState {
  setScreen: (s: Screen) => void
  createCharacter: (name: string, race: Race) => void
  chooseClass: (cls: CharClass) => void
  applyAttributes: (attrs: Attributes) => void
  addNarrative: (text: string, type: 'narration' | 'dialogue' | 'action' | 'system' | 'combat', choices?: any[]) => void
  makeChoice: (choiceId: string, nodeId: string) => void
  startCombat: (enemy: Enemy) => void
  playerAttack: () => void
  playerUseSkill: (skill: string) => void
  playerFlee: () => void
  playerUsePotion: () => void
  gainExp: (amount: number) => void
  gainGold: (amount: number) => void
  completeQuest: (questId: string) => void
  addQuest: (quest: Quest) => void
  setFlag: (flag: string, value: boolean) => void
  resetGame: () => void
  confirmLevelUp: (attrs: Attributes) => void
}

const STORY_NODES: Record<string, { text: string; choices: any[] }> = {
  start: {
    text: `O sol se põe sobre Valdoria, tingindo os céus de carmesim e ouro. Você desperta em uma estalagem barulhenta — o cheiro de cerveja azeda e carne assada preenche o ar. Um pergaminho repousa sobre a mesa: "Aventureiro — o reino precisa de você. Apresente-se ao Guardião Aldren no Forte das Muralhas." Do lado de fora, gritos distantes cortam a noite.`,
    choices: [
      { id: 'c1', text: 'Ir imediatamente ao forte', action: 'goto:fort_entrance' },
      { id: 'c2', text: 'Perguntar ao taverneiro sobre os gritos', action: 'goto:tavern_info' },
      { id: 'c3', text: 'Verificar seus equipamentos primeiro', action: 'goto:check_equipment' },
    ]
  },
  fort_entrance: {
    text: `As portas do Forte das Muralhas estão entreabertas. Guardas com tochas patrulham os muros. Ao se aproximar, um sentinela bloqueia seu caminho com uma lança: "Alto lá! Quem vai lá nessa hora? Temos ordens de não deixar ninguém entrar sem o símbolo do Guardião."`,
    choices: [
      { id: 'c1', text: 'Mostrar o pergaminho', action: 'goto:fort_inside' },
      { id: 'c2', text: 'Tentar convencer o guarda [Carisma]', action: 'skill_check:charisma:6:fort_inside:fort_blocked', requires: { attribute: 'charisma', value: 6 } },
      { id: 'c3', text: 'Procurar outra entrada', action: 'goto:fort_secret' },
    ]
  },
  tavern_info: {
    text: `O taverneiro Bron, um homem corpulento com bigode encardido, limpa um cálice enquanto murmura: "São os mortos-vivos, amigo. Saem das ruínas à noite. Dizem que o Lich Malachar se ergueu novamente nas Catacumbas do Norte. Já perdemos três aldeiros esta semana." Ele empurra uma cerveja para você. "Tome. Pode ser a última que bebe."`,
    choices: [
      { id: 'c1', text: 'Aceitar a bebida e ouvir mais', action: 'goto:tavern_more' },
      { id: 'c2', text: 'Ir ao forte com essa informação', action: 'goto:fort_entrance' },
      { id: 'c3', text: 'Perguntar sobre a recompensa', action: 'goto:tavern_reward' },
    ]
  },
  check_equipment: {
    text: `Você verifica sua bolsa. Dentro encontra: uma espada enferrujada, um escudo lascado, duas poções de vida e algumas moedas de ouro. Na parede, um mapa rabiscado mostra a região — o forte fica ao norte, as ruínas a leste, e a floresta ao sul. Uma nota na borda diz: "Cuidado com o Cruzamento das Sombras."`,
    choices: [
      { id: 'c1', text: 'Ir ao forte', action: 'goto:fort_entrance' },
      { id: 'c2', text: 'Explorar as ruínas ao leste', action: 'goto:ruins_entrance' },
      { id: 'c3', text: 'Entrar na floresta ao sul', action: 'goto:forest_path' },
    ]
  },
  fort_inside: {
    text: `O Guardião Aldren, um homem alto de cabelos brancos e olhos afiados, se levanta ao te ver. "Finalmente. Precisamos de alguém que não tenha medo de sangue." Ele desenrola um mapa sobre a mesa. "Malachar, o Lich Eterno, reuniu um exército de mortos-vivos. Preciso que você infiltre nas Catacumbas do Norte e destrua o Orbe de Necromancia antes do amanhecer." Uma quest foi adicionada!`,
    choices: [
      { id: 'c1', text: 'Aceitar a missão', action: 'quest:main_quest:goto:fort_preparation' },
      { id: 'c2', text: 'Pedir mais informações', action: 'goto:fort_briefing' },
      { id: 'c3', text: 'Negociar uma recompensa maior', action: 'goto:fort_negotiate' },
    ]
  },
  fort_blocked: {
    text: `O guarda não se move. "Documentos ou passa pela força. Escolha." Parece que convencer não foi suficiente desta vez.`,
    choices: [
      { id: 'c1', text: 'Procurar outra entrada', action: 'goto:fort_secret' },
      { id: 'c2', text: 'Usar o pergaminho', action: 'goto:fort_inside' },
    ]
  },
  fort_secret: {
    text: `Contornando o forte, você encontra uma passagem oculta atrás de hera densa. Dentro, um corredor escuro leva ao pátio interno. Você ouve vozes — e também o som de passos metálicos. Uma patrulha está vindo.`,
    choices: [
      { id: 'c1', text: 'Se esconder e esperar', action: 'goto:fort_inside' },
      { id: 'c2', text: 'Enfrentar a patrulha', action: 'combat:patrol_guard' },
    ]
  },
  fort_preparation: {
    text: `Aldren lhe entrega um Mapa das Catacumbas e uma Chave Enferrujada. "A entrada fica no cemitério antigo, a leste. Você terá de enfrentar os guardiões Esqueléticos antes de chegar ao Orbe." Um jovem escudeiro se aproxima: "Posso acompanhá-lo, senhor. Conheço os túneis."`,
    choices: [
      { id: 'c1', text: 'Partir com o escudeiro', action: 'goto:cemetery_with_ally' },
      { id: 'c2', text: 'Partir sozinho', action: 'goto:cemetery_entrance' },
      { id: 'c3', text: 'Descansar primeiro (recupera vida)', action: 'rest:goto:cemetery_entrance' },
    ]
  },
  ruins_entrance: {
    text: `As ruínas de Valdoria Antiga se erguem contra o céu estrelado — colunas quebradas, estátuas sem cabeça, e um silêncio pesado que faz a nuca arrepiar. No chão, rastros frescos. Não é de humano. Dois olhos brilham na escuridão.`,
    choices: [
      { id: 'c1', text: 'Preparar arma e avançar', action: 'combat:goblin_scout' },
      { id: 'c2', text: 'Acender uma tocha e inspecionar', action: 'goto:ruins_inspect' },
      { id: 'c3', text: 'Recuar para a estalagem', action: 'goto:start' },
    ]
  },
  forest_path: {
    text: `A floresta ao sul é densa e sussurrante. Raízes ancestrais formam padrões estranhos no solo. Uma figura encurvada se aproxima — uma velha bruxa de olhos brancos. "Ah, um aventureiro. Os espíritos da floresta me disseram que você viria. Tenho informações... por um preço."`,
    choices: [
      { id: 'c1', text: 'Ouvir o que ela tem a dizer', action: 'goto:witch_offer' },
      { id: 'c2', text: 'Oferecer 50 moedas de ouro', action: 'gold:50:goto:witch_info' },
      { id: 'c3', text: 'Ignorar e explorar a floresta', action: 'combat:forest_wolf' },
    ]
  },
  cemetery_entrance: {
    text: `O cemitério antigo é um labirinto de lápides apagadas e estátuas de anjos sombrios. Névoa rasteja pelo chão. Ao centro, a entrada das catacumbas — uma porta de pedra com inscrições em élficano: "Que aqui entrem apenas os que não temem a morte." Do interior, um gemido longo ecoa.`,
    choices: [
      { id: 'c1', text: 'Empurrar a porta e entrar', action: 'combat:skeleton_guardian' },
      { id: 'c2', text: 'Decifrar as inscrições [Inteligência]', action: 'skill_check:intelligence:7:catacombs_safe:cemetery_entrance', requires: { attribute: 'intelligence', value: 7 } },
      { id: 'c3', text: 'Examinar os arredores por armadilhas', action: 'goto:cemetery_search' },
    ]
  },
  witch_offer: {
    text: `"Sei onde dorme o Lich," a velha sussurra, "e sei como feri-lo. Mas preciso de uma Lágrima de Fênix — encontrada apenas nas chamas do Monte Cinza." Ela franze os lábios. "Ou... posso aceitar 100 moedas. Os espíritos também gostam de ouro."`,
    choices: [
      { id: 'c1', text: 'Pagar 100 moedas', action: 'gold:100:goto:witch_info' },
      { id: 'c2', text: 'Recusar e partir', action: 'goto:fort_entrance' },
    ]
  },
  witch_info: {
    text: `A bruxa desenha um símbolo no ar. "O Orbe de Necromancia responde ao fogo sagrado. Ao enfrentá-lo, use sua tocha bendita — ela é sua verdadeira arma." Ela desaparece numa nuvem de fumaça, deixando apenas o cheiro de enxofre e uma pluma carmesim no chão.`,
    choices: [
      { id: 'c1', text: 'Ir para as Catacumbas', action: 'goto:cemetery_entrance' },
    ]
  },
  cemetery_with_ally: {
    text: `Kael, o jovem escudeiro, caminha ao seu lado com uma tocha trêmula. "Meu irmão mais velho entrou aqui semana passada... nunca voltou." Ao chegarem à entrada das catacumbas, dois Esqueletos Guardiões se erguem das sombras, seus olhos queimando em chama azul.`,
    choices: [
      { id: 'c1', text: 'Atacar os esqueletos', action: 'combat:skeleton_x2' },
      { id: 'c2', text: 'Kael distrai enquanto você flanqueia', action: 'goto:catacombs_safe' },
    ]
  },
  catacombs_safe: {
    text: `Com habilidade e astúcia, você desvenda a passagem sem alertar os guardiões. As catacumbas se abrem — corredores de pedra úmida decorados com ossos e runas luminescentes. No fundo, uma luz verde pulsante: o Orbe de Necromancia.`,
    choices: [
      { id: 'c1', text: 'Avançar para o Orbe', action: 'combat:lich_malachar' },
      { id: 'c2', text: 'Observar a sala antes de entrar', action: 'goto:catacombs_observe' },
    ]
  },
  catacombs_observe: {
    text: `Da sombra, você observa a sala do trono do Lich. Três esqueletos patrulham em círculos regulares. Há uma fenda no teto onde cai luz da lua. E no centro — Malachar, sentado em seu trono de ossos, imóvel como a morte. Esperando.`,
    choices: [
      { id: 'c1', text: 'Atacar Malachar de surpresa', action: 'combat:lich_malachar_weakened' },
      { id: 'c2', text: 'Eliminar os esqueletos primeiro', action: 'combat:skeleton_guardian' },
    ]
  },
  ruins_inspect: {
    text: `A tocha revela gravuras nas paredes — um mapa antigo de Eldoria com localizações de tesouros marcadas. Você copia o mapa mentalmente. Mas ao se virar, três Goblins Exploradores bloqueiam a saída com facas enferrujadas, sorrindo tortos.`,
    choices: [
      { id: 'c1', text: 'Lutar!', action: 'combat:goblin_x3' },
      { id: 'c2', text: 'Oferecer comida em troca de passagem', action: 'goto:goblin_peace' },
    ]
  },
  goblin_peace: {
    text: `Os goblins farejam sua bolsa e aceitam o acordo — levam metade de sua comida mas deixam escapar, bufando. O mais alto aponta para o leste e diz algo em goblin. Parece ser uma direção para uma passagem secreta.`,
    choices: [
      { id: 'c1', text: 'Seguir o conselho goblin', action: 'goto:fort_secret' },
      { id: 'c2', text: 'Voltar ao ponto de partida', action: 'goto:start' },
    ]
  },
  cemetery_search: {
    text: `Examinando os arredores, você encontra uma passagem lateral oculta por moitas secas. Ela leva diretamente ao interior das catacumbas, evitando os guardiões esqueletos. O cheiro de mofo e decadência é sufocante — mas você está dentro.`,
    choices: [
      { id: 'c1', text: 'Avançar pelas catacumbas', action: 'goto:catacombs_safe' },
    ]
  },
  fort_briefing: {
    text: `Aldren abre um livro encadernado em couro negro. "Malachar viveu há 400 anos — um necromante que buscou a imortalidade e a encontrou ao custo da própria alma. O Orbe é seu coração. Destrua-o e ele se dissolve para sempre." Ele pausa. "Ou isso diz a profecia."`,
    choices: [
      { id: 'c1', text: 'Aceitar a missão', action: 'quest:main_quest:goto:fort_preparation' },
      { id: 'c2', text: 'Pedir um mapa detalhado', action: 'goto:fort_preparation' },
    ]
  },
  fort_negotiate: {
    text: `Aldren franze as sobrancelhas... mas então esboça um sorriso. "Você tem coragem, aventureiro. Certo. Dobro da recompensa — mas quero resultados." Ele estende a mão. A recompensa agora é de 500 moedas de ouro e um item lendário.`,
    choices: [
      { id: 'c1', text: 'Apertar a mão e aceitar', action: 'quest:main_quest:goto:fort_preparation' },
    ]
  },
  tavern_more: {
    text: `Bron abaixa a voz: "Há um curandeiro nas ruínas — dizem que ele tem uma cura contra o veneno dos mortos-vivos. Se você planeja entrar nas catacumbas, vai querer encontrá-lo primeiro." Ele desliza um mapa dobrado pela mesa.`,
    choices: [
      { id: 'c1', text: 'Ir ao forte', action: 'goto:fort_entrance' },
      { id: 'c2', text: 'Procurar o curandeiro nas ruínas', action: 'goto:ruins_entrance' },
    ]
  },
  tavern_reward: {
    text: `"Recompensa?" Bron ri. "O Guardião Aldren é justo. Dizem que paga 250 moedas e um item encantado para quem trouxer a cabeça do Lich. Pra mim parece dinheiro bom para um trabalho difícil." Ele escorrega mais cerveja.`,
    choices: [
      { id: 'c1', text: 'Ir ao forte', action: 'goto:fort_entrance' },
    ]
  },
}

const ENEMIES: Record<string, Omit<Enemy, 'hp'>> = {
  goblin_scout:    { id: 'goblin_scout',    name: 'Goblin Explorador', maxHp: 30,  attack: 6,  defense: 2, exp: 25,  gold: 8,  description: 'Um goblin ágil com olhos vermelhos e faca enferrujada.', icon: '👺' },
  goblin_x3:       { id: 'goblin_x3',       name: 'Trio de Goblins',   maxHp: 55,  attack: 9,  defense: 3, exp: 60,  gold: 20, description: 'Três goblins que atacam em sincronia.', icon: '👺' },
  patrol_guard:    { id: 'patrol_guard',     name: 'Guarda Patrulheiro', maxHp: 50, attack: 10, defense: 6, exp: 40,  gold: 15, description: 'Um guarda humano bem equipado.', icon: '⚔️' },
  forest_wolf:     { id: 'forest_wolf',      name: 'Lobo das Sombras',  maxHp: 40,  attack: 8,  defense: 3, exp: 35,  gold: 5,  description: 'Um lobo cinza gigante com olhos amarelos.', icon: '🐺' },
  skeleton_guardian:{ id:'skeleton_guardian',name: 'Esqueleto Guardião',maxHp: 65,  attack: 12, defense: 5, exp: 70,  gold: 25, description: 'Um guerreiro morto-vivo com armadura enferrujada.', icon: '💀' },
  skeleton_x2:     { id: 'skeleton_x2',      name: 'Dois Esqueletos',  maxHp: 90,  attack: 14, defense: 6, exp: 110, gold: 35, description: 'Dois guerreiros esqueléticos em formação.', icon: '💀' },
  lich_malachar:   { id: 'lich_malachar',    name: 'Lich Malachar',    maxHp: 180, attack: 22, defense: 10,exp: 300, gold: 200,description: 'O Lich Eterno — necromante imortal de poder inimaginavél.', icon: '☠️' },
  lich_malachar_weakened:{ id:'lich_malachar_weakened', name:'Malachar (Surpreso)', maxHp: 130, attack: 16, defense: 7, exp: 280, gold: 200, description: 'O Lich Malachar pego de surpresa — mais vulnerável.', icon: '☠️' },
}

const QUESTS: Record<string, Quest> = {
  main_quest: {
    id: 'main_quest',
    title: 'A Ascensão de Malachar',
    description: 'Infiltre nas Catacumbas do Norte e destrua o Orbe de Necromancia antes do amanhecer.',
    status: 'active',
    reward: { exp: 300, gold: 250 }
  }
}

function newGame(): GameState {
  return {
    screen: 'intro',
    character: null,
    currentNode: 'start',
    narrativeHistory: [],
    activeQuests: [],
    completedQuests: [],
    combat: null,
    pendingLevelUp: false,
    pendingAttributePoints: 0,
    flags: {},
  }
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...newGame(),

      setScreen: (screen) => set({ screen }),

      createCharacter: (name, race) => {
        const raceData = RACE_DATA[race]
        const attrs: Attributes = { ...BASE_ATTRS }
        Object.entries(raceData.bonuses).forEach(([k, v]) => {
          (attrs as any)[k] += v
        })
        const stats = calcStats(attrs, 1)
        const character: Character = {
          name, race,
          charClass: null,
          level: 1,
          exp: 0,
          expToNext: calcExpToNext(1),
          attributes: attrs,
          stats,
          skills: [raceData.skill],
          gold: 50,
          inventory: [
            { id: 'potion1', name: 'Poção de Vida', type: 'potion', description: 'Restaura 40 PV.', value: 20, effect: { stat: 'hp', amount: 40 } },
            { id: 'potion2', name: 'Poção de Vida', type: 'potion', description: 'Restaura 40 PV.', value: 20, effect: { stat: 'hp', amount: 40 } },
          ]
        }
        set({ character, screen: 'class' })
      },

      chooseClass: (cls) => {
        const { character } = get()
        if (!character) return
        const classData = CLASS_DATA[cls]
        const attrs = { ...character.attributes }
        Object.entries(classData.bonuses).forEach(([k, v]) => {
          (attrs as any)[k] += v
        })
        const stats = calcStats(attrs, character.level)
        set({
          character: {
            ...character,
            charClass: cls,
            attributes: attrs,
            stats,
            skills: [...character.skills, ...classData.skills],
          },
          screen: 'attributes'
        })
      },

      applyAttributes: (attrs) => {
        const { character } = get()
        if (!character) return
        const stats = calcStats(attrs, character.level)
        set({ character: { ...character, attributes: attrs, stats }, screen: 'game' })
        const firstNode = STORY_NODES['start']
        set(s => ({
          narrativeHistory: [{
            id: Date.now().toString(),
            text: firstNode.text,
            type: 'narration',
            choices: firstNode.choices,
            timestamp: Date.now()
          }]
        }))
      },

      addNarrative: (text, type, choices) => {
        set(s => ({
          narrativeHistory: [...s.narrativeHistory, {
            id: Date.now().toString() + Math.random(),
            text, type, choices,
            timestamp: Date.now()
          }]
        }))
      },

      makeChoice: (choiceId, nodeId) => {
        const node = STORY_NODES[nodeId]
        const choice = node?.choices.find((c: any) => c.id === choiceId)
        if (!choice) return
        const { character } = get()
        if (!character) return

        get().addNarrative(`> ${choice.text}`, 'action')

        const action: string = choice.action
        if (action.startsWith('goto:')) {
          const next = action.replace('goto:', '')
          const nextNode = STORY_NODES[next]
          if (nextNode) {
            set({ currentNode: next })
            get().addNarrative(nextNode.text, 'narration', nextNode.choices)
          }
        } else if (action.startsWith('combat:')) {
          const enemyKey = action.replace('combat:', '')
          const enemyBase = ENEMIES[enemyKey]
          if (enemyBase) {
            get().startCombat({ ...enemyBase, hp: enemyBase.maxHp })
          }
        } else if (action.startsWith('skill_check:')) {
          const [, attr, val, success, fail] = action.split(':')
          const attrVal = (character.attributes as any)[attr]
          if (attrVal >= parseInt(val)) {
            const next = STORY_NODES[success]
            if (next) { set({ currentNode: success }); get().addNarrative(next.text, 'narration', next.choices) }
          } else {
            get().addNarrative(`Teste de ${attr} falhou! (${attrVal} < ${val})`, 'system')
            const next = STORY_NODES[fail]
            if (next) { set({ currentNode: fail }); get().addNarrative(next.text, 'narration', next.choices) }
          }
        } else if (action.startsWith('quest:')) {
          const parts = action.split(':')
          const questId = parts[1]
          const questData = QUESTS[questId]
          if (questData) {
            set(s => ({ activeQuests: [...s.activeQuests.filter(q => q.id !== questId), questData] }))
            get().addNarrative(`📜 Nova missão: "${questData.title}"`, 'system')
          }
          const gotoIdx = parts.indexOf('goto')
          if (gotoIdx !== -1) {
            const next = parts[gotoIdx + 1]
            const nextNode = STORY_NODES[next]
            if (nextNode) { set({ currentNode: next }); get().addNarrative(nextNode.text, 'narration', nextNode.choices) }
          }
        } else if (action.startsWith('gold:')) {
          const [, amount, , next] = action.split(':')
          const cost = parseInt(amount)
          if (character.gold >= cost) {
            set(s => ({ character: s.character ? { ...s.character, gold: s.character.gold - cost } : null }))
            get().addNarrative(`Você gastou ${cost} moedas de ouro.`, 'system')
            const nextNode = STORY_NODES[next]
            if (nextNode) { set({ currentNode: next }); get().addNarrative(nextNode.text, 'narration', nextNode.choices) }
          } else {
            get().addNarrative(`Ouro insuficiente! Você precisa de ${cost} moedas.`, 'system')
          }
        } else if (action.startsWith('rest:')) {
          const next = action.replace('rest:goto:', '')
          set(s => {
            if (!s.character) return s
            const maxHp = s.character.stats.maxHp
            return { character: { ...s.character, stats: { ...s.character.stats, hp: maxHp } } }
          })
          get().addNarrative('Você descansou e recuperou toda a sua vida.', 'system')
          const nextNode = STORY_NODES[next]
          if (nextNode) { set({ currentNode: next }); get().addNarrative(nextNode.text, 'narration', nextNode.choices) }
        }
      },

      startCombat: (enemy) => {
        set({
          screen: 'combat',
          combat: { enemy, playerTurn: true, round: 1, log: [], fled: false }
        })
        get().addNarrative(`⚔️ Combate iniciado com ${enemy.name}!`, 'combat')
      },

      playerAttack: () => {
        const { combat, character } = get()
        if (!combat || !character || !combat.playerTurn) return
        const baseDmg = character.stats.attack
        const variance = Math.floor(Math.random() * 6) - 2
        const isCrit = Math.random() < 0.1
        const raw = Math.max(1, baseDmg + variance - combat.enemy.defense)
        const dmg = isCrit ? Math.floor(raw * 1.8) : raw
        const critText = isCrit ? ' CRÍTICO!' : ''
        const newHp = Math.max(0, combat.enemy.hp - dmg)
        const log: CombatLog[] = [...combat.log, { text: `Você atacou ${combat.enemy.name} por ${dmg} de dano!${critText}`, type: 'player' }]

        if (newHp <= 0) {
          get().gainExp(combat.enemy.exp)
          get().gainGold(combat.enemy.gold)
          const log2 = [...log, { text: `${combat.enemy.name} foi derrotado! +${combat.enemy.exp} EXP, +${combat.enemy.gold} ouro`, type: 'system' as const }]
          const currentNode = get().currentNode
          const isLichBoss = combat.enemy.id.includes('lich_malachar')
          if (isLichBoss) {
            set({ combat: null, screen: 'game' })
            const victoryText = `Com um último golpe devastador, o Orbe de Necromancia explode em mil pedaços de luz. O Lich Malachar solta um grito eterno enquanto sua forma se dissolve em cinzas negras. A noite de Eldoria finalmente se acalma. Você completou sua missão!`
            get().addNarrative(victoryText, 'narration', [{ id: 'restart', text: 'Jogar novamente', action: 'goto:start' }])
            get().completeQuest('main_quest')
          } else {
            set({ combat: null, screen: 'game' })
            const currentNodeData = STORY_NODES[currentNode]
            get().addNarrative(`${combat.enemy.name} foi derrotado!`, 'system', currentNodeData?.choices)
          }
          return
        }

        const enemyDmg = Math.max(1, combat.enemy.attack - character.stats.defense + Math.floor(Math.random() * 4) - 1)
        const newPlayerHp = Math.max(0, character.stats.hp - enemyDmg)
        const log3 = [...log, { text: `${combat.enemy.name} contra-ataca por ${enemyDmg} de dano!`, type: 'enemy' as const }]

        set(s => ({
          combat: s.combat ? { ...s.combat, enemy: { ...s.combat.enemy, hp: newHp }, playerTurn: true, round: s.combat.round + 1, log: log3 } : null,
          character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: newPlayerHp } } : null
        }))

        if (newPlayerHp <= 0) {
          set({ screen: 'gameover' })
        }
      },

      playerUseSkill: (skill) => {
        const { combat, character } = get()
        if (!combat || !character) return
        const mpCost = 15
        if (character.stats.mp < mpCost) {
          get().addNarrative('Mana insuficiente!', 'system')
          return
        }
        const dmg = Math.floor(character.stats.attack * 1.6) + character.attributes.intelligence * 2
        const newHp = Math.max(0, combat.enemy.hp - dmg)
        const newMp = character.stats.mp - mpCost
        const log: CombatLog[] = [...combat.log, { text: `Você usou "${skill}" causando ${dmg} de dano mágico!`, type: 'player' }]

        if (newHp <= 0) {
          get().gainExp(combat.enemy.exp)
          get().gainGold(combat.enemy.gold)
          set({ combat: null, screen: 'game' })
          const isLich = combat.enemy.id.includes('lich_malachar')
          if (isLich) {
            get().addNarrative('Vitória épica! O Lich foi destruído pelo poder da magia!', 'narration', [{ id: 'restart', text: 'Jogar novamente', action: 'goto:start' }])
            get().completeQuest('main_quest')
          } else {
            get().addNarrative(`${combat.enemy.name} foi derrotado pela magia!`, 'system', STORY_NODES[get().currentNode]?.choices)
          }
          return
        }

        const enemyDmg = Math.max(1, combat.enemy.attack - character.stats.defense)
        const newPlayerHp = Math.max(0, character.stats.hp - enemyDmg)
        const log2 = [...log, { text: `${combat.enemy.name} responde com ${enemyDmg} de dano!`, type: 'enemy' as const }]

        set(s => ({
          combat: s.combat ? { ...s.combat, enemy: { ...s.combat.enemy, hp: newHp }, log: log2, round: s.combat.round + 1 } : null,
          character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: newPlayerHp, mp: newMp } } : null
        }))
        if (newPlayerHp <= 0) set({ screen: 'gameover' })
      },

      playerFlee: () => {
        const { combat, character } = get()
        if (!combat || !character) return
        const fleeChance = 0.4 + character.attributes.dexterity * 0.04
        if (Math.random() < fleeChance) {
          const dmgOnFlee = Math.floor(combat.enemy.attack * 0.5)
          const newHp = Math.max(1, character.stats.hp - dmgOnFlee)
          set(s => ({
            combat: null,
            screen: 'game',
            character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: newHp } } : null
          }))
          get().addNarrative(`Você fugiu da batalha! Levou ${dmgOnFlee} de dano ao escapar.`, 'system', STORY_NODES[get().currentNode]?.choices)
        } else {
          const dmg = Math.max(1, combat.enemy.attack - character.stats.defense)
          const newHp = Math.max(0, character.stats.hp - dmg)
          const log: CombatLog[] = [...combat.log, { text: `Tentativa de fuga falhou! ${combat.enemy.name} ataca por ${dmg}!`, type: 'enemy' }]
          set(s => ({
            combat: s.combat ? { ...s.combat, log } : null,
            character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: newHp } } : null
          }))
          if (newHp <= 0) set({ screen: 'gameover' })
        }
      },

      playerUsePotion: () => {
        const { character } = get()
        if (!character) return
        const potion = character.inventory.find(i => i.type === 'potion')
        if (!potion) { get().addNarrative('Sem poções!', 'system'); return }
        const heal = 40
        const newHp = Math.min(character.stats.maxHp, character.stats.hp + heal)
        const newInventory = [...character.inventory]
        const idx = newInventory.findIndex(i => i.id === potion.id)
        newInventory.splice(idx, 1)
        set(s => ({ character: s.character ? { ...s.character, stats: { ...s.character.stats, hp: newHp }, inventory: newInventory } : null }))
        const log: CombatLog[] = get().combat ? [...(get().combat?.log || []), { text: `Você usou ${potion.name} e recuperou ${heal} PV!`, type: 'player' }] : []
        if (get().combat) set(s => ({ combat: s.combat ? { ...s.combat, log } : null }))
      },

      gainExp: (amount) => {
        set(s => {
          if (!s.character) return s
          const newExp = s.character.exp + amount
          if (newExp >= s.character.expToNext) {
            return {
              character: { ...s.character, exp: newExp },
              pendingLevelUp: true,
              pendingAttributePoints: 3,
            }
          }
          return { character: { ...s.character, exp: newExp } }
        })
      },

      gainGold: (amount) => {
        set(s => ({ character: s.character ? { ...s.character, gold: s.character.gold + amount } : null }))
      },

      completeQuest: (questId) => {
        const quest = get().activeQuests.find(q => q.id === questId)
        if (quest) {
          get().gainExp(quest.reward.exp)
          get().gainGold(quest.reward.gold)
          set(s => ({
            activeQuests: s.activeQuests.filter(q => q.id !== questId),
            completedQuests: [...s.completedQuests, questId]
          }))
        }
      },

      addQuest: (quest) => {
        set(s => ({ activeQuests: [...s.activeQuests.filter(q => q.id !== quest.id), quest] }))
      },

      setFlag: (flag, value) => {
        set(s => ({ flags: { ...s.flags, [flag]: value } }))
      },

      confirmLevelUp: (attrs) => {
        set(s => {
          if (!s.character) return s
          const newLevel = s.character.level + 1
          const newStats = calcStats(attrs, newLevel)
          newStats.hp = newStats.maxHp
          newStats.mp = newStats.maxMp
          return {
            character: {
              ...s.character,
              level: newLevel,
              exp: s.character.exp - s.character.expToNext,
              expToNext: calcExpToNext(newLevel),
              attributes: attrs,
              stats: newStats,
            },
            pendingLevelUp: false,
            pendingAttributePoints: 0,
            screen: 'game',
          }
        })
      },

      resetGame: () => set(newGame()),
    }),
    { name: 'rpg-eldoria-save', version: 1 }
  )
)
