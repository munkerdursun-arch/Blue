import { useProfile } from '../context/ProfileContext'
import Confetti from './Confetti'

export default function BadgePopup() {
  const { badgePopups, dismissBadgePopup } = useProfile()
  const badge = badgePopups[0]
  if (!badge) return null

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 px-6">
      <Confetti active />
      <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-2xl animate-pop-in">
        <span className="text-sm font-bold uppercase tracking-wide text-violet-500">Nouveau badge !</span>
        <span className="text-7xl">{badge.icon}</span>
        <h3 className="font-display text-xl font-extrabold text-slate-800">{badge.title}</h3>
        <p className="text-sm text-slate-500">{badge.desc}</p>
        <button
          onClick={dismissBadgePopup}
          className="mt-2 rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white shadow-md active:scale-95"
        >
          Youpi !
        </button>
      </div>
    </div>
  )
}
