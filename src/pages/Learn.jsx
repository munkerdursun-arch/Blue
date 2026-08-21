import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useProfile } from '../context/ProfileContext'
import { CURRICULUM, PHASES_LIST, TOTAL_DAYS } from '../data/curriculum'

export default function Learn() {
  const { progress } = useProfile()
  const currentDay = progress.currentDay

  return (
    <div className="min-h-full bg-gradient-to-b from-violet-50 to-white pb-4">
      <TopBar title="Mon parcours 90 jours" back="/accueil" />
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

      {PHASES_LIST.map((phase) => (
        <section key={phase.name} className="mt-3 px-4">
          <h2 className={`mb-2 inline-block rounded-full bg-gradient-to-r ${phase.color} px-3 py-1 text-xs font-extrabold text-white shadow`}>
            {phase.name}
          </h2>
          <div className="grid grid-cols-5 gap-2.5">
            {CURRICULUM.filter((d) => d.day >= phase.from && d.day <= phase.to).map((d) => {
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
                          : `bg-gradient-to-br ${phase.color} text-white active:scale-90`
                  }`}
                >
                  <span className="text-xl leading-none">{locked ? '🔒' : done ? '✅' : d.icon}</span>
                  <span className="mt-0.5 text-[10px] font-extrabold">{d.day}</span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
