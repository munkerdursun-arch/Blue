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

export default function GuessGame({ words, onExit, onComplete }) {
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
    if (ok) {
      setScore((s) => s + 1)
      speakTr(round.target.tr)
    }
    setTimeout(() => {
      setFeedback(null)
      if (ok) {
        if (i + 1 >= rounds.length) onComplete(score + 1, rounds.length)
        else setI((n) => n + 1)
      }
    }, 1000)
  }

  return (
    <GameShell title="Bu nedir ? (Devine)" icon="❓" round={i} total={rounds.length} onExit={onExit}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="grid h-32 w-32 place-items-center rounded-3xl bg-white text-8xl shadow-lg">{round.target.emoji}</div>
        <p className="font-display text-lg font-bold text-slate-600">Bu ne? <span className="text-sm text-slate-400">(Qu'est-ce que c'est ?)</span></p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {round.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => pick(opt)}
              className="rounded-2xl border-4 border-white bg-white px-4 py-3 text-left font-display text-xl font-bold text-violet-700 shadow active:scale-95"
            >
              {opt.tr}
            </button>
          ))}
        </div>
        <div className="h-8">{feedback && <PositiveFeedback ok={feedback === 'ok'} />}</div>
      </div>
    </GameShell>
  )
}
