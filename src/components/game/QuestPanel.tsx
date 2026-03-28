import { useGameStore } from '@/store/gameStore'

export default function QuestPanel() {
  const activeQuests = useGameStore(s => s.activeQuests)
  const completedQuests = useGameStore(s => s.completedQuests)

  if (activeQuests.length === 0 && completedQuests.length === 0) return null

  return (
    <div className="panel-rpg text-xs">
      <div className="panel-title">📜 Missões</div>
      {activeQuests.map(quest => (
        <div key={quest.id} className="px-3 py-2 border-b border-gold/10">
          <div className="flex items-start gap-1.5">
            <span className="text-gold mt-0.5">◆</span>
            <div>
              <p className="font-cinzel text-parchment/90 text-xs">{quest.title}</p>
              <p className="text-parchment/50 font-lora italic text-xs mt-0.5 leading-relaxed">{quest.description}</p>
              <p className="text-gold/50 font-cinzel text-xs mt-1">
                Recompensa: +{quest.reward.exp} EXP, +{quest.reward.gold} 🪙
              </p>
            </div>
          </div>
        </div>
      ))}
      {completedQuests.length > 0 && (
        <div className="px-3 py-2">
          <p className="text-parchment/30 font-cinzel text-xs">
            ✓ {completedQuests.length} missão(ões) concluída(s)
          </p>
        </div>
      )}
    </div>
  )
}
