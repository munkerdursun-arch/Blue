import { useMemo, useState } from 'react'
import GameShell from './GameShell'
import { useSpeech } from '../hooks/useSpeech'

export default function MemoryGame({ words, onExit, onComplete }) {
  const pairWords = useMemo(() => words.slice(0, 6), [words])
  const { speakTr } = useSpeech()
  const cards = useMemo(() => {
    const list = []
    pairWords.forEach((w) => {
      list.push({ key: `${w.id}-emoji`, wordId: w.id, type: 'emoji', display: w.emoji, tr: w.tr })
      list.push({ key: `${w.id}-word`, wordId: w.id, type: 'word', display: w.tr, tr: w.tr })
    })
    return list.sort(() => Math.random() - 0.5)
  }, [pairWords])

  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [tries, setTries] = useState(0)
  const [busy, setBusy] = useState(false)

  function flip(card) {
    if (busy || flipped.some((c) => c.key === card.key) || matched.includes(card.wordId) || flipped.length === 2) return
    const nextFlipped = [...flipped, card]
    setFlipped(nextFlipped)
    if (card.type === 'word' || nextFlipped.length === 1) speakTr(card.tr)
    if (nextFlipped.length === 2) {
      setBusy(true)
      setTries((t) => t + 1)
      const [a, b] = nextFlipped
      const ok = a.wordId === b.wordId
      setTimeout(() => {
        if (ok) {
          const nextMatched = [...matched, a.wordId]
          setMatched(nextMatched)
          if (nextMatched.length === pairWords.length) {
            const score = Math.max(1, pairWords.length * 2 - (tries + 1))
            onComplete(score, pairWords.length * 2)
          }
        }
        setFlipped([])
        setBusy(false)
      }, 700)
    }
  }

  return (
    <GameShell title="Memory" icon="🧠" round={matched.length} total={pairWords.length} onExit={onExit}>
      <div className="grid flex-1 grid-cols-3 content-center gap-3">
        {cards.map((card) => {
          const isUp = flipped.some((c) => c.key === card.key) || matched.includes(card.wordId)
          return (
            <button
              key={card.key}
              onClick={() => flip(card)}
              disabled={matched.includes(card.wordId)}
              className={`grid aspect-square place-items-center rounded-2xl border-4 text-2xl shadow transition-all active:scale-90 ${
                isUp ? 'border-white bg-white' : 'border-violet-200 bg-gradient-to-br from-violet-400 to-fuchsia-400'
              } ${matched.includes(card.wordId) ? 'opacity-50' : ''}`}
            >
              {isUp ? (
                <span className={card.type === 'emoji' ? 'text-4xl' : 'px-1 text-center text-sm font-extrabold text-violet-700'}>
                  {card.display}
                </span>
              ) : (
                '❓'
              )}
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}
