import { useMemo, useState } from 'react'
import GameShell from './GameShell'
import { useSpeech } from '../hooks/useSpeech'
import PositiveFeedback from '../components/PositiveFeedback'
import { VOCAB } from '../data/vocabulary'

function buildRounds(words) {
  return words.map((target) => {
    const distractors = VOCAB.filter((w) => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    const options = [target, ...distractors].sort(() => Math.random() - 0.5)
    return { target, options }
  })
}

export default function FindImage({ words, onExit, onComplete }) {
  const rounds = useMemo(() => buildRounds(words), [words])
  const [i, setI] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const { speakTr } = useSpeech()
  const round = rounds[i]

  function pick(option) {
    if (feedback) return
    const ok = option.id === round.target.id
    setFeedback(ok ? 'ok' : 'retry')
    if (ok) setScore((s) => s + 1)
    setTimeout(() => {
      setFeedback(null)
      if (ok) {
        if (i + 1 >= rounds.length) onComplete(score + 1, rounds.length)
        else setI((n) => n + 1)
      }
    }, 900)
  }

  return (
    <GameShell title="Trouve l'image" icon="🔎" round={i} total={rounds.length} onExit={onExit}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <button
          onClick={() => speakTr(round.target.tr)}
          className="flex flex-col items-center gap-2 rounded-3xl bg-white px-6 py-4 shadow-lg active:scale-95"
        >
          <span className="text-sm font-bold text-slate-400">Écoute et trouve :</span>
          <span className="font-display text-3xl font-extrabold text-violet-700">{round.target.tr}</span>
          <span className="text-2xl">🔊</span>
        </button>
        <div className="grid w-full max-w-sm grid-cols-2 gap-4">
          {round.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => pick(opt)}
              className="grid aspect-square place-items-center rounded-3xl border-4 border-white bg-white text-6xl shadow-lg transition-transform active:scale-90"
            >
              {opt.emoji}
            </button>
          ))}
        </div>
        <div className="h-8">{feedback && <PositiveFeedback ok={feedback === 'ok'} />}</div>
      </div>
    </GameShell>
  )
}
