import { useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import ParentGate from '../components/ParentGate'
import { useProfile } from '../context/ProfileContext'
import { CATEGORIES, VOCAB } from '../data/vocabulary'
import { CONVERSATIONS } from '../data/conversations'
import { TOTAL_DAYS } from '../data/curriculum'
import { wordsKnownCount } from '../utils/srs'
import { todayISO } from '../utils/storage'
import { computeCompetencies, COMPETENCY_LABELS } from '../utils/competency'

export default function Parent() {
  const [unlocked, setUnlocked] = useState(false)
  const { profile, progress, resetAll } = useProfile()

  const stats = useMemo(() => computeStats(progress), [progress])
  const competencies = useMemo(() => computeCompetencies(progress), [progress])
  const recommendation = useMemo(() => buildRecommendation(profile?.name, stats, competencies), [profile?.name, stats, competencies])

  if (!unlocked) {
    return (
      <div className="min-h-full bg-white">
        <TopBar title="Espace Parent" back="/accueil" />
        <ParentGate onUnlock={() => setUnlocked(true)} />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-slate-50 pb-10">
      <TopBar title="Espace Parent" back="/accueil" />

      <div className="px-5 pt-4">
        <div className="rounded-3xl bg-white p-4 shadow">
          <p className="font-display font-extrabold text-slate-700">
            {profile?.avatar} {profile?.name}, {profile?.age} ans
          </p>
          <p className="text-xs text-slate-400">Suivi non scolaire — juste pour voir les progrès, pas pour noter !</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        <Metric label="Jours étudiés" value={`${stats.daysDone} / ${TOTAL_DAYS}`} icon="📅" />
        <Metric label="Temps d'apprentissage (estimé)" value={`≈ ${stats.minutes} min`} icon="⏱️" />
        <Metric label="Mots rencontrés" value={stats.wordsSeen} icon="👀" />
        <Metric label="Vocabulaire maîtrisé" value={stats.wordsMastered} icon="🏆" />
        <Metric label="Vocabulaire à revoir" value={stats.wordsToReview} icon="🔄" />
        <Metric label="Progression orale" value={`${stats.oralPct}%`} icon="🗣️" />
      </div>

      <div className="px-5 pt-5">
        <h2 className="mb-2 font-display font-extrabold text-slate-700">Synthèse</h2>
        <div className="flex flex-col gap-2">
          <SynthesisRow label="Niveau de compréhension" level={stats.comprehensionLevel} />
          <SynthesisRow label="Progression sur 90 jours" level={stats.progressLevel} />
          <SynthesisRow label="Régularité (série de jours)" level={stats.streakLevel} />
        </div>
      </div>

      <div className="px-5 pt-5">
        <h2 className="mb-2 font-display font-extrabold text-slate-700">Profil de compétences</h2>
        <div className="flex flex-col gap-2.5 rounded-3xl bg-white p-4 shadow">
          {Object.entries(COMPETENCY_LABELS).map(([key, meta]) => (
            <CompetencyRow key={key} icon={meta.icon} label={meta.label} stars={competencies[key]} />
          ))}
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="rounded-3xl bg-violet-50 p-4">
          <p className="mb-1 text-sm font-extrabold text-violet-700">💡 Recommandation de la semaine</p>
          <p className="text-sm text-slate-600">{recommendation}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pt-5">
        <div className="rounded-3xl bg-white p-4 shadow">
          <p className="mb-2 text-sm font-extrabold text-emerald-600">🟢 Points forts</p>
          {stats.strengths.length ? (
            <ul className="space-y-1 text-sm text-slate-600">
              {stats.strengths.map((c) => (
                <li key={c}>{CATEGORIES[c]?.icon} {CATEGORIES[c]?.label}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Pas encore assez de données.</p>
          )}
        </div>
        <div className="rounded-3xl bg-white p-4 shadow">
          <p className="mb-2 text-sm font-extrabold text-orange-500">🟠 À travailler</p>
          {stats.toImprove.length ? (
            <ul className="space-y-1 text-sm text-slate-600">
              {stats.toImprove.map((c) => (
                <li key={c}>{CATEGORIES[c]?.icon} {CATEGORIES[c]?.label}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">Pas encore assez de données.</p>
          )}
        </div>
      </div>

      <div className="px-5 pt-5">
        <h2 className="mb-2 font-display font-extrabold text-slate-700">Dernières activités</h2>
        <div className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow">
          {progress.activityLog?.length ? (
            progress.activityLog.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-sm last:border-0">
                <span className="text-slate-600">{a.label}</span>
                <span className="text-xs text-slate-400">{new Date(a.date).toLocaleDateString('fr-FR')}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">Aucune activité pour le moment.</p>
          )}
        </div>
      </div>

      <div className="px-5 pt-6">
        <button
          onClick={() => {
            if (confirm('Réinitialiser toute la progression de l\'enfant ? Cette action est irréversible.')) resetAll()
          }}
          className="w-full rounded-2xl border-2 border-rose-200 py-2.5 text-sm font-bold text-rose-500"
        >
          Réinitialiser la progression
        </button>
      </div>
    </div>
  )
}

function Metric({ label, value, icon }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow">
      <p className="text-2xl">{icon}</p>
      <p className="mt-1 font-display text-lg font-extrabold text-slate-800">{value}</p>
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
    </div>
  )
}

function CompetencyRow({ icon, label, stars }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-slate-600">
        {icon} {label}
      </span>
      {stars === null ? (
        <span className="text-xs font-semibold text-slate-300">Pas encore de données</span>
      ) : (
        <span className="text-sm">
          {'⭐'.repeat(stars)}
          {'☆'.repeat(5 - stars)}
        </span>
      )}
    </div>
  )
}

function buildRecommendation(name, stats, competencies) {
  const n = name || "L'enfant"
  if (stats.wordsSeen === 0) {
    return `${n} n'a pas encore commencé sa première leçon. Lancez ensemble le Jour 1 pour découvrir les premiers mots !`
  }
  const weakCat = stats.toImprove[0]
  const catLabel = weakCat ? CATEGORIES[weakCat]?.label : null
  const entries = Object.entries(competencies).filter(([, v]) => v !== null)
  const weakest = entries.sort((a, b) => a[1] - b[1])[0]
  const weakestLabel = weakest ? COMPETENCY_LABELS[weakest[0]]?.label : null
  const weakestIsLow = weakest && weakest[1] <= 2

  if (catLabel && weakestIsLow) {
    return `Cette semaine, ${n} pourrait revoir le vocabulaire « ${catLabel} » et s'entraîner un peu plus sur : ${weakestLabel.toLowerCase()}.`
  }
  if (weakestIsLow) {
    return `Cette semaine, ${n} pourrait s'entraîner un peu plus sur : ${weakestLabel.toLowerCase()}.`
  }
  if (catLabel) {
    return `Cette semaine, ${n} semble avoir besoin de revoir le vocabulaire « ${catLabel} ». Rien d'inquiétant, une petite révision suffit !`
  }
  return `${n} progresse bien sur tous les fronts. Continuez la routine quotidienne, c'est le secret des bons progrès !`
}

function SynthesisRow({ label, level }) {
  const colors = { green: '🟢 Très bien', orange: '🟠 En progrès', red: '🔴 À démarrer' }
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className="text-sm font-bold">{colors[level]}</span>
    </div>
  )
}

function computeStats(progress) {
  const daysDone = Object.keys(progress.completedDays || {}).length
  const minutes = Math.round(daysDone * 12 + (progress.activityLog?.length || 0) * 1.5)
  const srs = progress.srs || {}
  const wordsSeen = Object.keys(srs).length
  const wordsMastered = wordsKnownCount(srs, 3)
  const wordsToReview = Object.values(srs).filter((e) => e.dueDate <= todayISO() && e.box < 5).length
  const oralPct = Math.round((progress.conversationsDone.length / CONVERSATIONS.length) * 100)

  const comprehensionLevel = wordsSeen === 0 ? 'red' : wordsMastered / Math.max(1, wordsSeen) > 0.5 ? 'green' : wordsMastered > 0 ? 'orange' : 'red'
  const progressLevel = daysDone >= 30 ? 'green' : daysDone >= 10 ? 'orange' : 'red'
  const streakLevel = (progress.streak?.count || 0) >= 5 ? 'green' : (progress.streak?.count || 0) >= 2 ? 'orange' : 'red'

  const catStats = {}
  Object.entries(srs).forEach(([id, entry]) => {
    const word = VOCAB.find((w) => w.id === id)
    if (!word) return
    if (!catStats[word.cat]) catStats[word.cat] = { total: 0, count: 0 }
    catStats[word.cat].total += entry.box
    catStats[word.cat].count += 1
  })
  const catAverages = Object.entries(catStats)
    .map(([cat, v]) => ({ cat, avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg)

  const strengths = catAverages.slice(0, 2).map((c) => c.cat)
  const toImprove = catAverages.slice(-2).map((c) => c.cat).filter((c) => !strengths.includes(c))

  return {
    daysDone,
    minutes,
    wordsSeen,
    wordsMastered,
    wordsToReview,
    oralPct,
    comprehensionLevel,
    progressLevel,
    streakLevel,
    strengths,
    toImprove,
  }
}
