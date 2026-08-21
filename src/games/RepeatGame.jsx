import { useEffect, useMemo, useState } from 'react'
import GameShell from './GameShell'
import { useSpeech } from '../hooks/useSpeech'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { looksClose } from '../utils/normalize'

export default function RepeatGame({ words, onExit, onComplete }) {
  const list = useMemo(() => words.slice(0, 6), [words])
  const [i, setI] = useState(0)
  const [result, setResult] = useState(null)
  const { speakTr } = useSpeech()
  const { supported, listening, transcript, error, start } = useSpeechRecognition('tr-TR')
  const word = list[i]
  const micUsable = supported && !error

  function tryAgainOrNext() {
    setResult(null)
    if (i + 1 >= list.length) onComplete(list.length, list.length)
    else setI((n) => n + 1)
  }

  function handleListen() {
    setResult(null)
    start()
  }

  function handleFallback() {
    setResult('tried')
  }

  // dès qu'une transcription arrive, on affiche un retour toujours positif
  useEffect(() => {
    if (transcript && result === null) {
      setResult(looksClose(transcript, word.tr) ? 'close' : 'tried')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript])

  return (
    <GameShell title="Répète après moi" icon="🗣️" round={i} total={list.length} onExit={onExit}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <button
          onClick={() => speakTr(word.tr)}
          className="flex flex-col items-center gap-2 rounded-3xl bg-white px-8 py-6 shadow-lg active:scale-95"
        >
          <span className="text-6xl">{word.emoji}</span>
          <span className="font-display text-3xl font-extrabold text-violet-700">{word.tr}</span>
          <span className="text-sm font-semibold text-slate-400">{word.fr}</span>
          <span className="text-2xl">🔊 Écouter</span>
        </button>

        {!result && (
          <>
            {micUsable ? (
              <button
                onClick={handleListen}
                className={`grid h-20 w-20 place-items-center rounded-full text-4xl shadow-lg active:scale-90 ${
                  listening ? 'animate-pulse bg-rose-400' : 'bg-gradient-to-br from-emerald-400 to-lime-400'
                }`}
              >
                🎤
              </button>
            ) : (
              <button
                onClick={handleFallback}
                className="rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 px-6 py-3 font-bold text-white shadow-lg active:scale-90"
              >
                🎤 J'ai essayé !
              </button>
            )}
            <p className="max-w-xs text-xs text-slate-400">
              {micUsable ? 'Appuie et dis le mot à voix haute !' : "Le micro n'est pas disponible ici, mais tu peux dire le mot à voix haute !"}
            </p>
          </>
        )}

        {result && (
          <div className="flex flex-col items-center gap-3">
            <p className="font-display text-xl font-bold text-emerald-600">
              {result === 'close' ? 'Harika! Bien prononcé ! 🎉' : 'Super effort ! Continue comme ça ! 👏'}
            </p>
            <button onClick={tryAgainOrNext} className="rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white shadow-md active:scale-95">
              Suivant ➡️
            </button>
          </div>
        )}
      </div>
    </GameShell>
  )
}
