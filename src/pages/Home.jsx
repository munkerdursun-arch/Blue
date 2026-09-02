import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'
import { getDay, TOTAL_DAYS } from '../data/curriculum'
import { wordsKnownCount } from '../utils/srs'
import { missionStatus, normalizeDaily, chestReward } from '../utils/missions'
import { COMPANIONS, COMPANION_ACCESSORIES, COMPANION_LINES, fillCompanionLine } from '../data/companions'
import { FRAMES, ACCESSORIES } from '../data/avatarShop'
import { useSpeech } from '../hooks/useSpeech'
import ProgressRing from '../components/ProgressRing'
import Confetti from '../components/Confetti'

export default function Home() {
  const { profile, progress, openDailyChest } = useProfile()
  const day = getDay(progress.currentDay) || getDay(1)
  const alreadyDone = !!progress.completedDays[day.day]
  const wordsKnown = wordsKnownCount(progress.srs)
  const { speakTr } = useSpeech()
  const [chestOpening, setChestOpening] = useState(false)

  const status = useMemo(() => missionStatus(progress.dailyMissions), [progress.dailyMissions])
  const dm = normalizeDaily(progress.dailyMissions)
  const reward = chestReward(progress.streak?.count)

  const companionKind = COMPANIONS.find((c) => c.id === progress.companion?.kind)
  const companionAcc = COMPANION_ACCESSORIES.find((a) => a.id === progress.companion?.accessory)
  const companionLine = useMemo(() => {
    const line = COMPANION_LINES[Math.floor(Math.random() * COMPANION_LINES.length)]
    return fillCompanionLine(line, progress.companion?.name)
  }, [day.day, progress.companion?.name])

  const frame = FRAMES.find((f) => f.id === progress.avatar?.frame) || FRAMES[0]
  const accessory = ACCESSORIES.find((a) => a.id === progress.avatar?.accessory)

  function handleOpenChest() {
    setChestOpening(true)
    openDailyChest()
    setTimeout(() => setChestOpening(false), 1600)
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-sky-100 via-cyan-50 to-white pb-4">
      <Confetti active={chestOpening} />
      <header className="rounded-b-[2.5rem] bg-gradient-to-br from-sky-400 via-cyan-400 to-emerald-300 px-5 pb-8 pt-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br text-2xl shadow ${frame.className}`}>
              <span>{profile?.avatar}</span>
              {accessory?.emoji && <span className="absolute -right-1 -top-1 text-lg">{accessory.emoji}</span>}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">Merhaba,</p>
              <h1 className="font-display text-2xl font-extrabold drop-shadow-sm">{profile?.name} 👋</h1>
            </div>
          </div>
          <Link to="/parent" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/25 text-xl active:scale-90">
            👨‍👩‍👧
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-1.5 rounded-3xl bg-white/20 px-2 py-3 backdrop-blur">
          <Stat icon="🔥" value={progress.streak?.count || 0} label="jours" />
          <Stat icon="⭐" value={progress.starsTotal || 0} label="étoiles" />
          <Stat icon="🪙" value={progress.coins || 0} label="coins" />
          <Stat icon="📚" value={wordsKnown} label="mots" />
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
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {day.phase.zoneIcon} {day.phase.zoneName}
              </p>
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

        {companionKind ? (
          <button
            onClick={() => speakTr(companionLine.tr)}
            className="mt-4 flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-md active:scale-[0.98]"
          >
            <span className="relative shrink-0 text-4xl">
              {companionKind.emoji}
              {companionAcc?.emoji && <span className="absolute -right-2 -top-2 text-lg">{companionAcc.emoji}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-extrabold text-violet-700">{companionLine.tr}</p>
              <p className="truncate text-xs text-slate-400">{companionLine.fr}</p>
            </div>
            <span className="shrink-0 text-xl">🔊</span>
          </button>
        ) : (
          <Link to="/boutique" className="mt-4 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-md active:scale-95">
            <span className="text-3xl">🐶</span>
            <div className="flex-1">
              <p className="font-display font-extrabold text-slate-700">Choisis ton compagnon !</p>
              <p className="text-xs text-slate-400">Il t'accompagnera dans toute ton aventure.</p>
            </div>
            <span className="text-xl">➡️</span>
          </Link>
        )}

        <div className="mt-4 rounded-3xl bg-white p-4 shadow-md">
          <p className="mb-3 font-display font-extrabold text-slate-700">🎯 Missions du jour</p>
          <div className="flex flex-col gap-2">
            <MissionRow done={status.words.done} label={`Apprendre 5 mots (${status.words.count}/${status.words.target})`} />
            <MissionRow done={status.game.done} label="Réussir un mini-jeu" />
            <MissionRow done={status.talk.done} label="Parler avec le professeur" />
          </div>

          {status.allDone && !dm.chestOpened && (
            <button
              onClick={handleOpenChest}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 py-3 font-display font-extrabold text-white shadow-lg active:scale-95"
            >
              🎁 Ouvrir le coffre du jour (+{reward.coins} 🪙 +{reward.stars} ⭐)
            </button>
          )}
          {dm.chestOpened && (
            <p className="mt-3 text-center text-sm font-bold text-emerald-500">🎁 Coffre du jour déjà ouvert, bravo !</p>
          )}
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
            <span className="text-xs font-bold text-slate-600">Carte</span>
          </Link>
        </div>
      </main>
    </div>
  )
}

function Stat({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <span className="text-lg leading-none">{icon}</span>
      <p className="text-sm font-extrabold leading-none">{value}</p>
      <p className="text-[9px] font-semibold text-white/80">{label}</p>
    </div>
  )
}

function MissionRow({ done, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
          done ? 'bg-emerald-400 text-white' : 'bg-slate-100 text-slate-300'
        }`}
      >
        {done ? '✓' : ''}
      </span>
      <span className={done ? 'font-semibold text-slate-700 line-through decoration-emerald-400' : 'text-slate-500'}>{label}</span>
    </div>
  )
}
