import { useGameStore } from '@/store/gameStore'
import { RACE_DATA, CLASS_DATA } from '@/types'

export default function CharacterPanel() {
  const character = useGameStore(s => s.character)
  if (!character) return null

  const raceData = RACE_DATA[character.race]
  const classData = character.charClass ? CLASS_DATA[character.charClass] : null

  return (
    <div className="panel-rpg text-xs">
      <div className="panel-title flex items-center gap-2">
        <span>{raceData.emoji}</span>
        <span>{character.name}</span>
        <span className="ml-auto text-gold/60">Nv.{character.level}</span>
      </div>
      <div className="px-3 py-2 space-y-1 border-b border-gold/10">
        <div className="flex justify-between">
          <span className="text-parchment/50">Raça</span>
          <span className="text-parchment font-cinzel">{raceData.name}</span>
        </div>
        {classData && (
          <div className="flex justify-between">
            <span className="text-parchment/50">Classe</span>
            <span className="text-parchment font-cinzel">{classData.name}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-parchment/50">Ouro</span>
          <span className="text-gold font-cinzel">{character.gold} 🪙</span>
        </div>
      </div>
      <div className="px-3 py-2 space-y-1 border-b border-gold/10">
        <p className="text-gold/50 font-cinzel tracking-widest uppercase text-xs mb-1">Atributos</p>
        {[
          ['FOR', character.attributes.strength],
          ['INT', character.attributes.intelligence],
          ['DES', character.attributes.dexterity],
          ['SAB', character.attributes.wisdom],
          ['CAR', character.attributes.charisma],
          ['CON', character.attributes.constitution],
        ].map(([label, val]) => (
          <div key={label as string} className="flex justify-between">
            <span className="text-parchment/40 font-cinzel">{label}</span>
            <span className="text-parchment font-cinzel">{val}</span>
          </div>
        ))}
      </div>
      <div className="px-3 py-2">
        <p className="text-gold/50 font-cinzel tracking-widest uppercase text-xs mb-1">Habilidades</p>
        {character.skills.map(skill => (
          <p key={skill} className="text-parchment/60 font-lora italic text-xs leading-relaxed flex gap-1">
            <span className="text-gold/30">◆</span> {skill.split('—')[0].trim()}
          </p>
        ))}
      </div>
    </div>
  )
}
