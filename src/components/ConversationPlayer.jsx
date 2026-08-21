import { useEffect, useState } from 'react'
import Teacher from './Teacher'
import { useSpeech } from '../hooks/useSpeech'

export default function ConversationPlayer({ conversation, onFinish }) {
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState(null)
  const { speakTr } = useSpeech()
  const line = conversation.lines[i]

  useEffect(() => {
    setChosen(null)
    if (line?.speaker === 'teacher') {
      const t = setTimeout(() => speakTr(line.tr), 250)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  function next() {
    if (i + 1 >= conversation.lines.length) onFinish()
    else setI((n) => n + 1)
  }

  function choose(choice) {
    if (chosen) return
    setChosen(choice)
    speakTr(choice.tr)
    setTimeout(next, 1300)
  }

  if (!line) return null

  return (
    <div className="flex flex-1 flex-col justify-center gap-5">
      {line.speaker === 'teacher' ? (
        <>
          <Teacher mood="happy">
            <p className="font-display text-xl font-extrabold text-violet-700">{line.tr}</p>
            <p className="text-sm font-semibold text-slate-400">{line.fr}</p>
          </Teacher>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => speakTr(line.tr)}
              className="rounded-full bg-white px-4 py-2 text-xl shadow active:scale-90"
              aria-label="Réécouter"
            >
              🔊
            </button>
            <button onClick={next} className="rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white shadow-md active:scale-95">
              Continuer ➡️
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {line.prompt?.fr && <p className="text-center text-sm font-bold text-slate-500">{line.prompt.fr}</p>}
          <div className="flex w-full max-w-sm flex-col gap-3">
            {line.choices.map((c, idx) => (
              <button
                key={idx}
                onClick={() => choose(c)}
                disabled={!!chosen}
                className={`rounded-2xl border-4 px-4 py-3 text-left shadow transition-transform active:scale-95 ${
                  chosen === c ? 'border-emerald-400 bg-emerald-50' : 'border-white bg-white'
                }`}
              >
                <span className="block font-display text-lg font-extrabold text-violet-700">{c.tr}</span>
                <span className="block text-xs font-semibold text-slate-400">{c.fr}</span>
              </button>
            ))}
          </div>
          {chosen && <p className="font-display font-bold text-emerald-600">Harika! 🎉</p>}
        </div>
      )}
    </div>
  )
}
