// Compagnon virtuel : choisi librement (change d'avis possible), il
// accompagne l'enfant et sert aussi de prétexte pédagogique (dialogues).

export const COMPANIONS = [
  { id: 'dog', emoji: '🐶', label: 'Chien', defaultName: 'Mavi' },
  { id: 'cat', emoji: '🐱', label: 'Chat', defaultName: 'Pamuk' },
  { id: 'rabbit', emoji: '🐰', label: 'Lapin', defaultName: 'Tarçın' },
  { id: 'bear', emoji: '🐻', label: 'Ours', defaultName: 'Bal' },
  { id: 'fox', emoji: '🦊', label: 'Renard', defaultName: 'Kızıl' },
  { id: 'owl', emoji: '🦉', label: 'Hibou', defaultName: 'Baykuş' },
]

export const COMPANION_ACCESSORIES = [
  { id: 'none', label: 'Aucun', cost: 0, emoji: '' },
  { id: 'bandana', label: 'Bandana', cost: 25, emoji: '🧣' },
  { id: 'bell', label: 'Clochette', cost: 25, emoji: '🔔' },
  { id: 'bow-tie', label: 'Nœud papillon', cost: 35, emoji: '🎀' },
  { id: 'party-hat', label: "Chapeau de fête", cost: 45, emoji: '🎉' },
]

// Petites répliques du compagnon (turc naturel + français), affichées sur
// l'accueil. `name: true` insère le prénom du compagnon.
export const COMPANION_LINES = [
  { tr: 'Merhaba! Bugün hazır mısın?', fr: "Bonjour ! Tu es prêt(e) aujourd'hui ?" },
  { tr: 'Benim adım {name}. Senin adın ne?', fr: "Je m'appelle {name}. Comment tu t'appelles ?", name: true },
  { tr: 'Hadi oynayalım!', fr: 'Allez, jouons !' },
  { tr: 'Bugün yeni kelimeler öğrenelim!', fr: "Aujourd'hui, apprenons de nouveaux mots !" },
  { tr: 'Seninle gurur duyuyorum!', fr: 'Je suis fier/fière de toi !' },
  { tr: 'Türkçe konuşmak çok eğlenceli!', fr: "Parler turc, c'est très amusant !" },
  { tr: 'Devam edelim mi?', fr: 'On continue ?' },
]

export function fillCompanionLine(line, name) {
  return { ...line, tr: line.tr.replace('{name}', name || 'Dost') }
}
