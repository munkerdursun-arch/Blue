import { useMemo, useState } from 'react'
import GameShell from './GameShell'
import { useSpeech } from '../hooks/useSpeech'
import PositiveFeedback from '../components/PositiveFeedback'

export default function BuildSentence({ phrases, onExit, onComplete }) {
  const list = useMemo(() => phrases, [phrases])
  const [i, setI] = useState(0)
  const [placed, setPlaced] = useState([])
  const [pool, setPool] = useState(() => shuffle(list[0].tokens))
  const [feedback, setFeedback] = useState(null)
  const { speakTr } = useSpeech()
  const phrase = list[i]

  function shuffle(arr) {
    return arr.map((t, idx) => ({ token: t, key: `${idx}-${t}` })).sort(() => Math.random() - 0.5)
  }

  function pickToken(item) {
    if (feedback) return
    const nextPlaced = [...placed, item]
    setPlaced(nextPlaced)
    setPool(pool.filter((p) => p.key !== item.key))
    if (nextPlaced.length === phrase.tokens.length) {
      const ok = nextPlaced.every((p, idx) => p.token === phrase.tokens[idx])
      setFeedback(ok ? 'ok' : 'retry')
      setTimeout(() => {
        if (ok) {
          setFeedback(null)
          if (i + 1 >= list.length) onComplete(list.length, list.length)
          else {
            setI((n) => n + 1)
            setPlaced([])
            setPool(shuffle(list[i + 1].tokens))
          }
        } else {
          setFeedback(null)
          setPlaced([])
          setPool(shuffle(phrase.tokens))
        }
      }, 1100)
    }
  }

  function undo() {
    if (!placed.length || feedback) return
    const last = placed[placed.length - 1]
    setPlaced(placed.slice(0, -1))
    setPool([...pool, last])
  }

  return (
    <GameShell title="Construis la phrase" icon="🧩" round={i} total={list.length} onExit={onExit}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <button
          onClick={() => speakTr(phrase.tr)}
          className="flex flex-col items-center gap-1 rounded-2xl bg-white px-5 py-3 shadow"
        >
          <span className="text-xs font-bold text-slate-400">{phrase.fr}</span>
          <span className="text-xl">🔊</span>
        </button>

        <div className="flex min-h-16 w-full flex-wrap justify-center gap-2 rounded-2xl border-4 border-dashed border-violet-200 bg-white/60 p-3">
          {placed.length === 0 && <span className="text-sm text-slate-400">Touche les mots dans le bon ordre !</span>}
          {placed.map((p) => (
            <span key={p.key} className="rounded-xl bg-violet-500 px-3 py-1.5 font-display font-bold text-white shadow">
              {p.token}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {pool.map((p) => (
            <button
              key={p.key}
              onClick={() => pickToken(p)}
              className="rounded-xl border-2 border-violet-200 bg-white px-3 py-1.5 font-display font-bold text-violet-700 shadow active:scale-90"
            >
              {p.token}
            </button>
          ))}
        </div>

        {placed.length > 0 && !feedback && (
          <button onClick={undo} className="text-sm font-semibold text-slate-400 underline">
            ↩️ Recommencer ce mot
          </button>
        )}

        <div className="h-8">{feedback && <PositiveFeedback ok={feedback === 'ok'} />}</div>
      </div>
    </GameShell>
  )
}
