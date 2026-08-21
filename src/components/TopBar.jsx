import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'

export default function TopBar({ title, back }) {
  const { profile, progress } = useProfile()
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-300 px-3 py-2.5 text-white shadow-md">
      <div className="flex min-w-0 items-center gap-2">
        {back ? (
          <Link
            to={back}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/25 text-lg active:scale-90"
            aria-label="Retour"
          >
            ⬅️
          </Link>
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/25 text-lg">
            {profile?.avatar || '🇹🇷'}
          </span>
        )}
        <h1 className="truncate font-display text-lg font-bold drop-shadow-sm">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link to="/progres" className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-sm font-bold active:scale-90">
          🔥 {progress.streak?.count || 0}
        </Link>
        <Link to="/progres" className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-sm font-bold active:scale-90">
          ⭐ {progress.starsTotal || 0}
        </Link>
      </div>
    </header>
  )
}
