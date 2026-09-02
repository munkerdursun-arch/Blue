import { useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import { useSpeech } from '../hooks/useSpeech'
import PositiveFeedback from '../components/PositiveFeedback'
import { VOCAB } from '../data/vocabulary'

const LANES = [10, 34, 58, 82]

function buildRounds(words) {
  return words.map((target) => {
    const distractors = VOCAB.filter((w) => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    const items = [target, ...distractors]
      .sort(() => Math.random() - 0.5)
      .map((w, idx) => ({ ...w, left: LANES[idx], delay: idx * 1.1, duration: 4.5 + idx * 0.4 }))
    return { target, items }
  })
}

export default function CatchWord({ words, onExit, onComplete }) {
  const rounds = useMemo(() => buildRounds(words), [words])
  const [i, setI] = useState(0)
  const [caughtId, setCaughtId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const { speakTr } = useSpeech()
  const round = rounds[i]

  useEffect(() => {
    setCaughtId(null)
    setFeedback(null)
    const t = setTimeout(() => speakTr(round.target.tr), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  function catchItem(item) {
    if (caughtId) return
    const ok = item.id === round.target.id
    if (ok) {
      setCaughtId(item.id)
      setFeedback('ok')
      setScore((s) => s + 1)
      setTimeout(() => {
        if (i + 1 >= rounds.length) onComplete(score + 1, rounds.length)
        else setI((n) => n + 1)
      }, 900)
    } else {
      setFeedback('retry')
      setTimeout(() => setFeedback(null), 700)
    }
  }

  return (
    <GameShell title="Attrape le bon mot" icon="🧺" round={i} total={rounds.length} onExit={onExit}>
      <div className="flex flex-1 flex-col items-center gap-3">
        <button
          onClick={() => speakTr(round.target.tr)}
          className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow"
        >
          <span className="font-display text-lg font-extrabold text-violet-700">{round.target.tr}</span>
          <span className="text-xl">🔊</span>
        </button>
        <p className="text-xs font-bold text-slate-400">Attrape le bon mot avant qu'il ne tombe !</p>

        <div className="relative h-[60vh] max-h-96 min-h-72 w-full flex-1 overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-b from-sky-100 to-emerald-50">
          {round.items.map((item) => (
            <button
              key={item.id}
              onClick={() => catchItem(item)}
              disabled={!!caughtId}
              className={`animate-fall-loop absolute grid h-16 w-16 -translate-x-1/2 place-items-center rounded-2xl border-4 shadow-lg transition-transform active:scale-90 ${
                caughtId === item.id ? 'border-emerald-400 bg-emerald-100' : 'border-white bg-white'
              } ${caughtId && caughtId !== item.id ? 'opacity-30' : ''}`}
              style={{
                left: `${item.left}%`,
                animationDuration: `${item.duration}s`,
                animationDelay: `${item.delay}s`,
                animationPlayState: caughtId ? 'paused' : 'running',
              }}
            >
              <span className="text-3xl">{item.emoji}</span>
            </button>
          ))}
        </div>

        <div className="h-8">{feedback && <PositiveFeedback ok={feedback === 'ok'} />}</div>
      </div>
    </GameShell>
  )
}
