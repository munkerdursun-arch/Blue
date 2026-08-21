import { todayISO } from './storage'

// Système de répétition espacée simplifié (type Leitner).
// box 0 = nouveau mot, box 5 = très bien maîtrisé.
const INTERVAL_DAYS = [0, 1, 2, 4, 7, 15]
export const MAX_BOX = INTERVAL_DAYS.length - 1

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function initEntry() {
  return { box: 0, dueDate: todayISO(), seen: 0, correct: 0, wrong: 0 }
}

export function reviewWord(entry, correct) {
  const e = entry || initEntry()
  const box = correct ? Math.min(MAX_BOX, e.box + 1) : Math.max(0, e.box - 1)
  return {
    box,
    dueDate: addDays(todayISO(), INTERVAL_DAYS[box]),
    seen: (e.seen || 0) + 1,
    correct: (e.correct || 0) + (correct ? 1 : 0),
    wrong: (e.wrong || 0) + (correct ? 0 : 1),
  }
}

export function isDue(entry) {
  if (!entry) return true
  return entry.dueDate <= todayISO()
}

export function getWordsToReview(srs, wordIds, limit = 8) {
  const today = todayISO()
  const due = wordIds
    .map((id) => ({ id, entry: srs[id] }))
    .filter((w) => !w.entry || w.entry.dueDate <= today)
    .sort((a, b) => (a.entry?.box ?? -1) - (b.entry?.box ?? -1))
  return due.slice(0, limit).map((w) => w.id)
}

export function wordsKnownCount(srs, minBox = 2) {
  return Object.values(srs || {}).filter((e) => e.box >= minBox).length
}
