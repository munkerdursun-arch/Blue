import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import ProgressRing from '../components/ProgressRing'
import { useProfile } from '../context/ProfileContext'
import { BADGES } from '../data/badges'
import { TOTAL_DAYS } from '../data/curriculum'
import { wordsKnownCount } from '../utils/srs'

export default function ProgressPage() {
  const { progress } = useProfile()
  const daysDone = Object.keys(progress.completedDays || {}).length
  const wordsKnown = wordsKnownCount(progress.srs)

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50 to-white pb-6">
      <TopBar title="Mes progrès" back="/accueil" />

      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        <StatCard icon="⭐" value={progress.starsTotal || 0} label="étoiles" bg="from-amber-300 to-yellow-200" />
        <StatCard icon="🪙" value={progress.coins || 0} label="Türkçe Coin" bg="from-yellow-300 to-orange-200" />
        <StatCard icon="🔥" value={progress.streak?.count || 0} label="jours de suite" bg="from-rose-300 to-orange-200" />
        <StatCard icon="📚" value={wordsKnown} label="mots connus" bg="from-emerald-300 to-lime-200" />
        <StatCard icon="🏆" value={(progress.badges || []).length} label="badges" bg="from-violet-300 to-fuchsia-200" />
        <Link
          to="/boutique"
          className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-sky-300 to-cyan-200 p-4 shadow-md active:scale-95"
        >
          <span className="text-3xl">🧑‍🚀</span>
          <div>
            <p className="font-display text-sm font-extrabold text-white drop-shadow-sm">Personnaliser</p>
            <p className="text-[11px] font-bold text-white/90">mon avatar</p>
          </div>
        </Link>
      </div>

      <div className="mx-5 mt-5 flex items-center gap-4 rounded-3xl bg-white p-4 shadow-md">
        <ProgressRing value={daysDone} max={TOTAL_DAYS} size={70}>
          {daysDone}/{TOTAL_DAYS}
        </ProgressRing>
        <div>
          <p className="font-display font-extrabold text-slate-700">Ton aventure de 90 jours</p>
          <p className="text-sm text-slate-400">Continue comme ça, tu progresses super bien !</p>
        </div>
      </div>

      <div className="px-5 pt-6">
        <h2 className="mb-3 font-display text-lg font-extrabold text-slate-700">Mes badges</h2>
        <div className="grid grid-cols-3 gap-3">
          {BADGES.map((b) => {
            const owned = (progress.badges || []).includes(b.id)
            return (
              <div
                key={b.id}
                className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center shadow ${
                  owned ? 'bg-white' : 'bg-slate-100 opacity-60 grayscale'
                }`}
              >
                <span className="text-3xl">{owned ? b.icon : '🔒'}</span>
                <span className="text-[11px] font-bold text-slate-600">{b.title}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, bg }) {
  return (
    <div className={`flex items-center gap-3 rounded-3xl bg-gradient-to-br ${bg} p-4 shadow-md`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-display text-xl font-extrabold text-white drop-shadow-sm">{value}</p>
        <p className="text-[11px] font-bold text-white/90">{label}</p>
      </div>
    </div>
  )
}
