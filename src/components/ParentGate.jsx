import { useMemo, useState } from 'react'

// Petit portail "Espace Parent" : une question de calcul simple empêche
// un enfant de 6 ans d'y entrer par accident. Ce n'est PAS une sécurité
// forte (pas de mot de passe), juste un frein adapté à l'usage familial.
export default function ParentGate({ onUnlock }) {
  const question = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 6)
    const b = 2 + Math.floor(Math.random() * 6)
    return { a, b, answer: a + b }
  }, [])
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (Number(value) === question.answer) {
      onUnlock()
    } else {
      setWrong(true)
      setValue('')
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="text-5xl">👨‍👩‍👧</span>
      <h2 className="font-display text-xl font-extrabold text-slate-700">Espace Parent</h2>
      <p className="max-w-xs text-sm text-slate-500">
        Cette zone est réservée aux parents. Réponds à ce petit calcul pour continuer :
      </p>
      <form onSubmit={submit} className="flex flex-col items-center gap-3">
        <p className="font-display text-3xl font-extrabold text-violet-600">
          {question.a} + {question.b} = ?
        </p>
        <input
          autoFocus
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setWrong(false)
          }}
          className="w-28 rounded-2xl border-2 border-violet-200 px-4 py-2 text-center text-xl font-bold outline-none focus:border-violet-500"
        />
        {wrong && <p className="text-sm font-semibold text-rose-500">Pas tout à fait, réessaie 🙂</p>}
        <button type="submit" className="rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white shadow-md active:scale-95">
          Entrer
        </button>
      </form>
    </div>
  )
}
