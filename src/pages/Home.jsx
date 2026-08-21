import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'
import { getDay, TOTAL_DAYS } from '../data/curriculum'
import { wordsKnownCount } from '../utils/srs'
import ProgressRing from '../components/ProgressRing'

export default function Home() {
  const { profile, progress } = useProfile()
  const day = getDay(progress.currentDay) || getDay(1)
  const alreadyDone = !!progress.completedDays[day.day]
  const wordsKnown = wordsKnownCount(progress.srs)

  return (
    <div className="min-h-full bg-gradient-to-b from-sky-100 via-cyan-50 to-white pb-4">
      <header className="rounded-b-[2.5rem] bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-300 px-5 pb-8 pt-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white/90">Merhaba,</p>
            <h1 className="font-display text-2xl font-extrabold drop-shadow-sm">
              {profile?.name} {profile?.avatar} 👋
            </h1>
          </div>
          <Link to="/parent" className="grid h-11 w-11 place-items-center rounded-full bg-white/25 text-xl active:scale-90">
            👨‍👩‍👧
          </Link>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-3xl bg-white/20 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-lg font-extrabold leading-none">{progress.streak?.count || 0}</p>
              <p className="text-[11px] font-semibold text-white/80">jours de suite</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-lg font-extrabold leading-none">{progress.starsTotal || 0}</p>
              <p className="text-[11px] font-semibold text-white/80">étoiles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <div>
              <p className="text-lg font-extrabold leading-none">{wordsKnown}</p>
              <p className="text-[11px] font-semibold text-white/80">mots appris</p>
            </div>
          </div>
        </div>
      </header>

      <main className="-mt-5 px-5">
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-400">🌟 Mission du jour</p>
              <h2 className="font-display text-xl font-extrabold text-slate-800">
                {day.icon} Jour {day.day} · {day.title}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">{day.phase.name}</p>
            </div>
            <ProgressRing value={progress.currentDay - 1} max={TOTAL_DAYS} size={58}>
              {progress.currentDay - 1}/{TOTAL_DAYS}
            </ProgressRing>
          </div>

          <Link
            to={`/apprendre/${day.day}`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3.5 font-display text-lg font-extrabold text-white shadow-lg transition-transform active:scale-95"
          >
            {alreadyDone ? 'REVOIR 🔁' : 'COMMENCER ▶️'}
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Link to="/jouer" className="flex flex-col items-center gap-1 rounded-3xl bg-white p-4 shadow-md active:scale-95">
            <span className="text-3xl">🎮</span>
            <span className="text-xs font-bold text-slate-600">Jouer</span>
          </Link>
          <Link to="/parler" className="flex flex-col items-center gap-1 rounded-3xl bg-white p-4 shadow-md active:scale-95">
            <span className="text-3xl">🗣️</span>
            <span className="text-xs font-bold text-slate-600">Parler</span>
          </Link>
          <Link to="/apprendre" className="flex flex-col items-center gap-1 rounded-3xl bg-white p-4 shadow-md active:scale-95">
            <span className="text-3xl">🗺️</span>
            <span className="text-xs font-bold text-slate-600">Parcours</span>
          </Link>
        </div>
      </main>
    </div>
  )
}
