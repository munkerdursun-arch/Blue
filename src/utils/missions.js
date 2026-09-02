import { todayISO } from './storage'

// Missions quotidiennes : 3 petits objectifs simples, remis à zéro chaque
// jour. Une fois les 3 faites, un coffre transparent (récompense connue
// à l'avance, jamais aléatoire) devient disponible.
export function normalizeDaily(dm) {
  if (!dm || dm.date !== todayISO()) {
    return { date: todayISO(), wordIds: [], games: 0, talked: false, chestOpened: false }
  }
  return dm
}

const WORDS_TARGET = 5

export function missionStatus(dm) {
  const d = normalizeDaily(dm)
  const words = { done: d.wordIds.length >= WORDS_TARGET, count: Math.min(d.wordIds.length, WORDS_TARGET), target: WORDS_TARGET }
  const game = { done: d.games >= 1 }
  const talk = { done: d.talked }
  return { words, game, talk, allDone: words.done && game.done && talk.done, chestOpened: d.chestOpened }
}

// Récompense du coffre : formule simple et prévisible (jamais un tirage
// aléatoire), légèrement bonifiée par la série de jours en cours.
export function chestReward(streakCount) {
  return { coins: 15 + Math.min(15, streakCount || 0), stars: 2 }
}
