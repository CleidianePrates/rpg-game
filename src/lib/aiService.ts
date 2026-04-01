import { Character, Race, CharClass } from '@/types'

// ─── Pollinations.ai — imagens gratuitas, sem API key ────────────────────────

function imgPrompt(subject: string, extra = '') {
  const base = 'dark fantasy medieval painting, oil on canvas, dramatic lighting, highly detailed, epic atmosphere'
  return encodeURIComponent(`${subject}, ${base}${extra ? ', ' + extra : ''}`)
}

export function getRacePortraitUrl(race: Race, name = ''): string {
  const subjects: Record<Race, string> = {
    elf:   `elven warrior with pointed ears, silver long hair, golden armor, mystical forest, ${name}`,
    human: `human knight in steel plate armor, heroic pose, castle courtyard, ${name}`,
    dwarf: `dwarf warrior with braided beard, heavy iron armor, mountain forge, ${name}`,
    orc:   `orc warrior with green skin, tusks, tribal war paint, bone armor, battle-ready, ${name}`,
  }
  return `https://image.pollinations.ai/prompt/${imgPrompt(subjects[race])}?width=512&height=512&seed=42&nologo=true`
}

export function getClassArtUrl(cls: CharClass): string {
  const subjects: Record<CharClass, string> = {
    warrior: 'armored paladin wielding a greatsword, full plate armor, glowing runes, battle stance',
    mage:    'arcane wizard casting powerful fire spell, glowing runes, mystical dark robes, ancient staff',
    archer:  'elven ranger drawing a longbow, leather armor, deep forest background, quiver of magical arrows',
    rogue:   'shadowy assassin with hooded dark cloak, twin curved daggers, smoke and shadows',
  }
  return `https://image.pollinations.ai/prompt/${imgPrompt(subjects[cls])}?width=512&height=512&seed=77&nologo=true`
}

export function getSceneImageUrl(description: string, seed = 1): string {
  return `https://image.pollinations.ai/prompt/${imgPrompt(description, 'cinematic, moody, atmospheric fog')}?width=768&height=384&seed=${seed}&nologo=true`
}

export function getEnemyImageUrl(enemyName: string, seed = 13): string {
  return `https://image.pollinations.ai/prompt/${imgPrompt(`${enemyName}, fantasy monster, menacing, battle-ready, full body`)}?width=400&height=400&seed=${seed}&nologo=true`
}

export function getCombatBgUrl(location: string): string {
  return `https://image.pollinations.ai/prompt/${imgPrompt(`${location}, dark fantasy battle arena, dramatic`)}?width=768&height=384&seed=99&nologo=true`
}

// ─── Azure OpenAI — narrativa dinâmica ───────────────────────────────────────

const AZURE_ENDPOINT   = (import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string ?? '').replace(/\/$/, '')
const AZURE_API_KEY    = import.meta.env.VITE_AZURE_OPENAI_API_KEY as string ?? ''
const AZURE_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT as string ?? 'gpt-4o-mini'
const AZURE_API_VER    = import.meta.env.VITE_AZURE_OPENAI_API_VERSION as string ?? '2025-03-01-preview'

export interface NarrativeChoice {
  id: string
  text: string
  action: string
  requires?: { attribute: string; value: number } | null
}

export interface NarrativeResponse {
  narration: string
  choices: NarrativeChoice[]
  scenePrompt: string
}

function charContext(char: Character): string {
  const race = { elf: 'Elfo', human: 'Humano', dwarf: 'Anão', orc: 'Orc' }[char.race]
  const cls  = char.charClass
    ? { warrior: 'Guerreiro', mage: 'Mago', archer: 'Arqueiro', rogue: 'Ladino' }[char.charClass]
    : 'Aventureiro'
  const a = char.attributes
  return `Personagem: ${char.name} — ${race} ${cls} Nível ${char.level}. FOR:${a.strength} INT:${a.intelligence} DES:${a.dexterity} SAB:${a.wisdom} CAR:${a.charisma} CON:${a.constitution}. PV:${char.stats.hp}/${char.stats.maxHp} Ouro:${char.gold}.`
}

const SYSTEM_PROMPT = `Você é um narrador épico de RPG de fantasia medieval sombria, no estilo de Dark Souls, The Witcher e Skyrim.
Suas narrações são imersivas, dramáticas e ricas em detalhes sensoriais. Use sempre a segunda pessoa ("você").
Responda SOMENTE com JSON válido, sem markdown, sem texto fora do JSON. Estrutura exata:

{
  "narration": "2 a 4 parágrafos narrativos imersivos em português. Descreva cenas, emoções, sons e cheiros. Seja épico.",
  "choices": [
    { "id": "c1", "text": "Texto da escolha (máx 12 palavras)", "action": "goto:slug_cena", "requires": null },
    { "id": "c2", "text": "Segunda opção de ação", "action": "goto:outra_cena", "requires": null },
    { "id": "c3", "text": "Opção que exige Força [8+]", "action": "goto:forca_acao", "requires": { "attribute": "strength", "value": 8 } }
  ],
  "scenePrompt": "scene description in english for image generation, 10-15 words"
}

Regras críticas:
- Sempre 2 a 4 choices. Nunca menos de 2.
- Actions: "goto:slug" para navegação, "combat:enemy_key" para batalha
- Enemy keys válidos: goblin_scout, forest_wolf, skeleton_guardian, bandit_leader, dark_knight, lich_malachar
- Inclua ao menos 1 opção de combate e 1 de furtividade/diálogo quando fizer sentido
- Considere os atributos do personagem (mago fala diferente de guerreiro)
- scenePrompt em inglês, descritivo, para gerar imagem de fundo da cena
- JSON deve ser 100% válido — nunca quebre a estrutura`

export async function generateNarrative(
  character: Character,
  playerChoice: string,
  storyContext: string
): Promise<NarrativeResponse> {
  const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VER}`

  const userMsg =
    `${charContext(character)}\n\n` +
    `Contexto da aventura:\n${storyContext.slice(-1200)}\n\n` +
    `Ação do jogador: "${playerChoice}"\n\n` +
    `Narre o que acontece e ofereça as próximas escolhas.`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': AZURE_API_KEY },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMsg },
      ],
      max_tokens: 900,
      temperature: 0.85,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Azure OpenAI ${res.status}: ${txt}`)
  }

  const data = await res.json()
  const raw  = data.choices?.[0]?.message?.content ?? '{}'

  // Extrai JSON mesmo que venha dentro de ```json ... ``` ou ``` ... ```
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  try {
    const parsed = JSON.parse(jsonStr) as NarrativeResponse
    parsed.choices = (parsed.choices ?? []).map((c, i) => ({
      ...c,
      id:     c.id ?? `c${i + 1}`,
      action: c.action ?? 'goto:unknown',
    }))
    if (!parsed.scenePrompt) parsed.scenePrompt = 'dark medieval fantasy landscape, atmospheric'
    return parsed
  } catch {
    throw new Error(`RAW: "${raw.slice(0, 300)}"`)
  }
}

export async function generateCombatNarration(
  character: Character,
  enemyName: string,
  actionLabel: string,
  dmgDealt: number,
  dmgTaken: number,
): Promise<string> {
  const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VER}`

  const prompt =
    `${charContext(character)}\n` +
    `Combate contra: ${enemyName}\n` +
    `Ação: ${actionLabel} | Dano causado: ${dmgDealt} | Dano recebido: ${dmgTaken}\n` +
    `Narre este turno em 1-2 frases dramáticas e cinematográficas. Apenas o texto narrativo, sem JSON.`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': AZURE_API_KEY },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 130,
        temperature: 0.9,
      }),
    })
    if (!res.ok) throw new Error('api error')
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? fallbackCombat(actionLabel, dmgDealt, dmgTaken, enemyName)
  } catch {
    return fallbackCombat(actionLabel, dmgDealt, dmgTaken, enemyName)
  }
}

function fallbackCombat(action: string, dmg: number, taken: number, enemy: string): string {
  return `Você executa ${action} causando ${dmg} de dano! ${enemy} revida com ${taken} de dano!`
}
