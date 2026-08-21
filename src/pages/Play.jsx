import { useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import { useProfile } from '../context/ProfileContext'
import { getWords, randomWords, VOCAB } from '../data/vocabulary'
import { PHRASES, fillPhrase } from '../data/phrases'
import { getWordsToReview } from '../utils/srs'
import FindImage from '../games/FindImage'
import ListenChoose from '../games/ListenChoose'
import GuessGame from '../games/GuessGame'
import MemoryGame from '../games/MemoryGame'
import RepeatGame from '../games/RepeatGame'
import BuildSentence from '../games/BuildSentence'

const GAMES = [
  { id: 'find', label: 'Trouve l\'image', icon: '🔎', color: 'from-sky-400 to-cyan-300' },
  { id: 'memory', label: 'Memory', icon: '🧠', color: 'from-fuchsia-400 to-pink-300' },
  { id: 'listen', label: 'Écoute et choisis', icon: '👂', color: 'from-emerald-400 to-lime-300' },
  { id: 'repeat', label: 'Répète', icon: '🗣️', color: 'from-amber-400 to-orange-300' },
  { id: 'build', label: 'Construis la phrase', icon: '🧩', color: 'from-indigo-400 to-violet-400' },
  { id: 'guess', label: 'Devine (Bu nedir?)', icon: '❓', color: 'from-rose-400 to-red-300' },
]

export default function Play() {
  const { progress, addStars, logActivity } = useProfile()
  const [active, setActive] = useState(null)
  const [toast, setToast] = useState(null)

  const pool = useMemo(() => {
    const known = Object.keys(progress.srs || {})
    const due = getWordsToReview(progress.srs, known, 8)
    const words = getWords(due.length ? due : known)
    if (words.length >= 6) return words.slice(0, 8)
    return [...words, ...randomWords(8 - words.length, words.map((w) => w.id))]
  }, [progress.srs])

  const phrasePool = useMemo(() => {
    return PHRASES.filter((p) => !p.name).slice(0, 6).map((p) => {
      const w = VOCAB[Math.floor(Math.random() * VOCAB.length)]
      return fillPhrase(p, { word: w })
    })
  }, [])

  function complete(score, total) {
    const stars = Math.max(1, Math.round((score / Math.max(1, total)) * 3))
    addStars(stars)
    const game = GAMES.find((g) => g.id === active)
    logActivity(`Jeu terminé : ${game?.label}`)
    setActive(null)
    setToast(`+${stars} ⭐`)
    setTimeout(() => setToast(null), 1800)
  }

  if (active) {
    const props = { onExit: () => setActive(null), onComplete: complete }
    return (
      <div className="min-h-full bg-gradient-to-b from-violet-50 to-white pt-2">
        {active === 'find' && <FindImage words={pool} {...props} />}
        {active === 'memory' && <MemoryGame words={pool} {...props} />}
        {active === 'listen' && <ListenChoose words={pool} {...props} />}
        {active === 'repeat' && <RepeatGame words={pool} {...props} />}
        {active === 'guess' && <GuessGame words={pool} {...props} />}
        {active === 'build' && <BuildSentence phrases={phrasePool} {...props} />}
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-violet-50 to-white pb-6">
      <TopBar title="Salle de jeux" back="/accueil" />
      <p className="px-5 pt-3 text-sm font-semibold text-slate-500">Choisis un jeu pour t'entraîner en t'amusant !</p>
      <div className="grid grid-cols-2 gap-4 px-5 pt-4">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setActive(g.id)}
            className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-br ${g.color} text-white shadow-lg transition-transform active:scale-95`}
          >
            <span className="text-4xl">{g.icon}</span>
            <span className="px-2 text-center font-display text-sm font-extrabold">{g.label}</span>
          </button>
        ))}
      </div>
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-800 px-5 py-2 font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
