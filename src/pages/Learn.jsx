import { useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useProfile } from '../context/ProfileContext'
import { CURRICULUM, PHASES_LIST, TOTAL_DAYS } from '../data/curriculum'

export default function Learn() {
  const { progress } = useProfile()
  const currentDay = progress.currentDay
  const [zone, setZone] = useState(null)

  if (zone) {
    const days = CURRICULUM.filter((d) => d.day >= zone.from && d.day <= zone.to)
    const doneCount = days.filter((d) => progress.completedDays[d.day]).length
    return (
      <div className="min-h-full bg-gradient-to-b from-violet-50 to-white pb-6">
        <TopBar title={`${zone.zoneIcon} ${zone.zoneName}`} />
        <button
          onClick={() => setZone(null)}
          className="mx-4 mt-2 flex items-center gap-1 text-sm font-bold text-violet-500"
        >
          🗺️ Retour à la carte du monde
        </button>
        <p className="px-4 pt-2 text-sm text-slate-500">{zone.zoneDesc}</p>
        <p className="px-4 pt-1 text-xs font-bold text-slate-400">
          {doneCount}/{days.length} jours terminés dans cette zone
        </p>
        <div className="grid grid-cols-5 gap-2.5 px-4 pt-4">
          {days.map((d) => {
            const done = progress.completedDays[d.day]
            const locked = d.day > currentDay
            const isToday = d.day === currentDay
            return (
              <Link
                key={d.day}
                to={locked ? '#' : `/apprendre/${d.day}`}
                onClick={(e) => locked && e.preventDefault()}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-lg shadow transition-transform ${
                  locked
                    ? 'bg-slate-100 text-slate-300'
                    : done
                      ? 'bg-gradient-to-br from-emerald-400 to-lime-300 text-white active:scale-90'
                      : isToday
                        ? 'animate-pulse-soft bg-gradient-to-br from-amber-400 to-orange-400 text-white active:scale-90'
                        : `bg-gradient-to-br ${zone.color} text-white active:scale-90`
                }`}
              >
                <span className="text-xl leading-none">{locked ? '🔒' : done ? '✅' : d.icon}</span>
                <span className="mt-0.5 text-[10px] font-extrabold">{d.day}</span>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-sky-100 via-violet-50 to-white pb-4">
      <TopBar title="Carte du monde" back="/accueil" />
      <div className="px-4 py-3">
        <p className="text-center text-sm font-bold text-slate-500">
          Jour {Math.min(currentDay, TOTAL_DAYS)} / {TOTAL_DAYS}
        </p>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-white shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
            style={{ width: `${(Math.min(currentDay, TOTAL_DAYS) / TOTAL_DAYS) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-2">
        {PHASES_LIST.map((phase, idx) => {
          const days = CURRICULUM.filter((d) => d.day >= phase.from && d.day <= phase.to)
          const doneCount = days.filter((d) => progress.completedDays[d.day]).length
          const unlocked = currentDay >= phase.from
          const complete = doneCount === days.length
          const prevZone = PHASES_LIST[idx - 1]
          return (
            <button
              key={phase.name}
              onClick={() => unlocked && setZone(phase)}
              disabled={!unlocked}
              className={`flex items-center gap-4 rounded-3xl p-4 text-left shadow-md transition-transform ${
                unlocked ? `bg-gradient-to-br ${phase.color} active:scale-95` : 'bg-slate-100'
              }`}
            >
              <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl ${unlocked ? 'bg-white/25' : 'bg-white'}`}>
                {unlocked ? phase.zoneIcon : '🔒'}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-display text-lg font-extrabold ${unlocked ? 'text-white drop-shadow-sm' : 'text-slate-400'}`}>
                  {phase.zoneName}
                </p>
                <p className={`truncate text-xs font-semibold ${unlocked ? 'text-white/90' : 'text-slate-400'}`}>
                  {unlocked ? phase.zoneDesc : `Termine ${prevZone?.zoneName || 'la zone précédente'} pour débloquer`}
                </p>
                {unlocked && (
                  <p className="mt-1 text-xs font-bold text-white/90">
                    {complete ? '✅ Zone terminée !' : `${doneCount}/${days.length} jours`}
                  </p>
                )}
              </div>
              {unlocked && <span className="shrink-0 text-2xl text-white">➡️</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
