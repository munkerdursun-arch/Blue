import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AvatarPicker from '../components/AvatarPicker'
import { useProfile } from '../context/ProfileContext'
import { AVATARS } from '../components/avatars'

export default function ProfileSetup() {
  const { profile, createProfile } = useProfile()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [age, setAge] = useState(6)
  const [avatar, setAvatar] = useState(AVATARS[0])

  // Si un profil existe déjà à l'arrivée sur cette page, on repart vers l'accueil.
  // (effet au montage uniquement : ne doit pas se redéclencher pendant la création du profil)
  useEffect(() => {
    if (profile) nav('/accueil', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    createProfile({ name: name.trim(), age, avatar })
    nav('/apprendre/1')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-300 via-cyan-200 to-emerald-200 px-6 py-10">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-5xl">🇹🇷✨</span>
        <h1 className="font-display text-2xl font-extrabold text-white drop-shadow">Mini Türkçe Maceram</h1>
        <p className="text-sm font-semibold text-white/90">Mon aventure pour apprendre le turc !</p>
      </div>

      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5 rounded-3xl bg-white p-6 shadow-xl">
        <div>
          <label className="mb-1 block text-sm font-bold text-slate-500">Comment tu t'appelles ?</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ton prénom"
            className="w-full rounded-2xl border-2 border-violet-200 px-4 py-3 text-lg font-bold outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-slate-500">Quel âge as-tu ?</label>
          <div className="flex flex-wrap gap-2">
            {[4, 5, 6, 7, 8, 9].map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAge(a)}
                className={`h-11 w-11 rounded-full font-display font-extrabold shadow transition-transform active:scale-90 ${
                  age === a ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-600'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-slate-500">Choisis ton avatar</label>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-full bg-gradient-to-r from-orange-400 to-rose-400 py-3.5 font-display text-lg font-extrabold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          Commencer l'aventure ! 🚀
        </button>
      </form>
    </div>
  )
}
