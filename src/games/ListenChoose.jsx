import { useEffect, useMemo, useState } from 'react'
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

export default function ListenChoose({ words, onExit, onComplete }) {
  const rounds = useMemo(() => buildRounds(words), [words])
  const [i, setI] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const { speakTr } = useSpeech()
  const round = rounds[i]

  useEffect(() => {
    const t = setTimeout(() => speakTr(round.target.tr), 300)
    return () => clearTimeout(t)
  }, [i])

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
    <GameShell title="Écoute et choisis" icon="👂" round={i} total={rounds.length} onExit={onExit}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <button
          onClick={() => speakTr(round.target.tr)}
          className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 text-5xl shadow-lg active:scale-90"
        >
          🔊
        </button>
        <p className="text-sm font-bold text-slate-400">Touche ce que tu entends !</p>
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
