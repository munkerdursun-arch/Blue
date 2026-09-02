// Badges à débloquer. `check(state)` reçoit le state de progression et renvoie un booléen.
// Tableau volontairement long et facile à étendre (aucune logique en dur ailleurs).

import { byId as vocabById } from './vocabulary'

export const BADGES = [
  {
    id: 'premier_mot',
    title: 'İlk Türkçe Kelimem',
    icon: '🌱',
    desc: 'Ton tout premier mot en turc !',
    check: (s) => wordCount(s, 1) >= 1,
  },
  {
    id: 'premiers_mots',
    title: '5 mots appris',
    icon: '🌿',
    desc: 'Tu as appris tes 5 premiers mots turcs !',
    check: (s) => wordCount(s, 1) >= 5,
  },
  {
    id: 'premier_dialogue',
    title: 'Premier dialogue',
    icon: '💬',
    desc: 'Tu as fait ta première conversation en turc !',
    check: (s) => (s.conversationsDone || []).length >= 1,
  },
  {
    id: 'serie_3',
    title: '3 jours de suite',
    icon: '✨',
    desc: 'Trois jours d\'affilée, bien joué !',
    check: (s) => (s.streak?.count || 0) >= 3,
  },
  {
    id: 'serie_7',
    title: '7 jours de suite',
    icon: '🔥',
    desc: "Tu as appris 7 jours d'affilée !",
    check: (s) => (s.streak?.count || 0) >= 7,
  },
  {
    id: 'serie_30',
    title: '30 jours de suite',
    icon: '🌟',
    desc: 'Un mois complet sans lâcher, incroyable !',
    check: (s) => (s.streak?.count || 0) >= 30,
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
    icon: '📖',
    desc: 'Bravo, 50 mots turcs dans ta tête !',
    check: (s) => wordCount(s, 2) >= 50,
  },
  {
    id: 'mots_100',
    title: '100 mots connus',
    icon: '🏆',
    desc: 'Cent mots turcs ! Tu es impressionnant(e) !',
    check: (s) => wordCount(s, 2) >= 100,
  },
  {
    id: 'jour_15',
    title: 'Explorateur du turc',
    icon: '🗺️',
    desc: 'Tu as terminé les 15 premiers jours !',
    check: (s) => s.completedDays?.[15] != null,
  },
  {
    id: 'jour_30',
    title: 'Petit(e) causeur/causeuse',
    icon: '🗣️',
    desc: 'Tu sais construire tes premières phrases !',
    check: (s) => s.completedDays?.[30] != null,
  },
  {
    id: 'jour_45',
    title: 'Roi/Reine du quotidien',
    icon: '🌳',
    desc: 'Tu maîtrises le turc de la vie de tous les jours !',
    check: (s) => s.completedDays?.[45] != null,
  },
  {
    id: 'jour_60',
    title: 'Champion(ne) de conversation',
    icon: '🎤',
    desc: 'Tu sais tenir une conversation en turc !',
    check: (s) => s.completedDays?.[60] != null,
  },
  {
    id: 'jour_75',
    title: 'Maître de l\'immersion',
    icon: '🐾',
    desc: 'Tu comprends le turc presque sans français !',
    check: (s) => s.completedDays?.[75] != null,
  },
  {
    id: 'jour_90',
    title: 'Je comprends le turc !',
    icon: '🇹🇷',
    desc: 'Tu as terminé toute ton aventure Türkçe Maceram !',
    check: (s) => s.completedDays?.[90] != null,
  },
  {
    id: 'missions_10',
    title: '10 missions réussies',
    icon: '🎯',
    desc: 'Dix missions quotidiennes accomplies !',
    check: (s) => (s.missionsCompletedTotal || 0) >= 10,
  },
  {
    id: 'coffres_5',
    title: '5 coffres ouverts',
    icon: '🎁',
    desc: 'Cinq coffres quotidiens ouverts !',
    check: (s) => (s.chestsOpened || 0) >= 5,
  },
  {
    id: 'histoire',
    title: "Petit(e) lecteur/lectrice",
    icon: '📖',
    desc: 'Tu as écouté ta première histoire en turc !',
    check: (s) => (s.storiesRead || []).length >= 1,
  },
  {
    id: 'chanson',
    title: 'Petit(e) chanteur/chanteuse',
    icon: '🎵',
    desc: 'Tu as écouté ta première comptine en turc !',
    check: (s) => (s.songsHeard || []).length >= 1,
  },
  {
    id: 'compagnon',
    title: 'Meilleur(e) ami(e)',
    icon: '🐶',
    desc: 'Tu as choisi ton compagnon virtuel !',
    check: (s) => !!s.companion?.kind,
  },
  {
    id: 'expert_animaux',
    title: 'Expert(e) des animaux',
    icon: '🦁',
    desc: 'Tu connais très bien les animaux en turc !',
    check: (s) => categoryMastered(s, 'animaux', 8),
  },
  {
    id: 'roi_aliments',
    title: 'Roi/Reine des aliments',
    icon: '🍎',
    desc: 'Tu connais très bien la nourriture en turc !',
    check: (s) => categoryMastered(s, 'aliments', 8),
  },
  {
    id: 'maitre_couleurs',
    title: 'Maître des couleurs',
    icon: '🌈',
    desc: 'Tu connais toutes les couleurs en turc !',
    check: (s) => categoryMastered(s, 'couleurs', 8),
  },
  {
    id: 'as_nombres',
    title: 'As des nombres',
    icon: '🔢',
    desc: 'Tu sais compter en turc !',
    check: (s) => categoryMastered(s, 'nombres', 8),
  },
]

function wordCount(state, minBox) {
  const srs = state.srs || {}
  return Object.values(srs).filter((w) => w.box >= minBox).length
}

function categoryMastered(state, cat, minCount) {
  const srs = state.srs || {}
  const count = Object.entries(srs).filter(
    ([id, e]) => e.box >= 2 && vocabById[id]?.cat === cat,
  ).length
  return count >= minCount
}

export function checkNewBadges(state) {
  const owned = state.badges || []
  return BADGES.filter((b) => !owned.includes(b.id) && b.check(state)).map((b) => b.id)
}
