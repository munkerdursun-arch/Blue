// Badges à débloquer. `check(state)` reçoit le state de progression et renvoie un booléen.

export const BADGES = [
  {
    id: 'premiers_mots',
    title: '5 mots appris',
    icon: '🌱',
    desc: 'Tu as appris tes 5 premiers mots turcs !',
    check: (s) => wordCount(s, 1) >= 5,
  },
  {
    id: 'premiere_conversation',
    title: 'Première conversation',
    icon: '💬',
    desc: 'Tu as fait ta première conversation en turc !',
    check: (s) => (s.conversationsDone || []).length >= 1,
  },
  {
    id: 'serie_7',
    title: '7 jours de suite',
    icon: '🔥',
    desc: 'Tu as appris 7 jours d\'affilée !',
    check: (s) => (s.streak?.count || 0) >= 7,
  },
  {
    id: 'mots_25',
    title: '25 mots connus',
    icon: '📚',
    desc: 'Tu connais déjà 25 mots turcs !',
    check: (s) => wordCount(s, 2) >= 25,
  },
  {
    id: 'mots_50',
    title: '50 mots connus',
    icon: '🏆',
    desc: 'Bravo, 50 mots turcs dans ta tête !',
    check: (s) => wordCount(s, 2) >= 50,
  },
  {
    id: 'jour_15',
    title: 'Explorateur du turc',
    icon: '🗺️',
    desc: 'Tu as terminé les 15 premiers jours !',
    check: (s) => (s.completedDays?.[15] != null),
  },
  {
    id: 'jour_30',
    title: 'Petit(e) causeur/causeuse',
    icon: '🗣️',
    desc: 'Tu sais construire tes premières phrases !',
    check: (s) => (s.completedDays?.[30] != null),
  },
  {
    id: 'jour_60',
    title: 'Champion(ne) de conversation',
    icon: '🎤',
    desc: 'Tu sais tenir une conversation en turc !',
    check: (s) => (s.completedDays?.[60] != null),
  },
  {
    id: 'jour_90',
    title: 'Je comprends le turc !',
    icon: '🇹🇷',
    desc: 'Tu as terminé toute ton aventure Türkçe Maceram !',
    check: (s) => (s.completedDays?.[90] != null),
  },
  {
    id: 'histoire',
    title: 'Petit(e) lecteur/lectrice',
    icon: '📖',
    desc: 'Tu as écouté ta première histoire en turc !',
    check: (s) => (s.storiesRead || []).length >= 1,
  },
]

function wordCount(state, minBox) {
  const srs = state.srs || {}
  return Object.values(srs).filter((w) => w.box >= minBox).length
}

export function checkNewBadges(state) {
  const owned = state.badges || []
  return BADGES.filter((b) => !owned.includes(b.id) && b.check(state)).map((b) => b.id)
}
