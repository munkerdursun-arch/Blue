// Boutique de personnalisation : tout s'achète avec les Türkçe Coin 🪙
// gagnés en jouant, jamais avec de l'argent réel. Architecture en tableaux
// pour pouvoir ajouter facilement de nouveaux articles.

export const FRAMES = [
  { id: 'sky', label: 'Ciel', cost: 0, className: 'from-sky-400 to-cyan-300' },
  { id: 'sunset', label: 'Coucher de soleil', cost: 40, className: 'from-orange-400 to-rose-400' },
  { id: 'forest', label: 'Forêt', cost: 40, className: 'from-emerald-400 to-lime-300' },
  { id: 'candy', label: 'Bonbon', cost: 60, className: 'from-fuchsia-400 to-pink-300' },
  { id: 'royal', label: 'Royal', cost: 80, className: 'from-violet-500 to-indigo-400' },
  { id: 'gold', label: 'Or', cost: 120, className: 'from-amber-400 to-yellow-300' },
]

export const ACCESSORIES = [
  { id: 'none', label: 'Aucun', cost: 0, emoji: '' },
  { id: 'cap', label: 'Casquette', cost: 30, emoji: '🧢' },
  { id: 'crown', label: 'Couronne', cost: 100, emoji: '👑' },
  { id: 'top-hat', label: 'Haut-de-forme', cost: 70, emoji: '🎩' },
  { id: 'bow', label: 'Nœud', cost: 30, emoji: '🎀' },
  { id: 'glasses', label: 'Lunettes de soleil', cost: 50, emoji: '🕶️' },
  { id: 'star', label: 'Étoile', cost: 20, emoji: '⭐' },
  { id: 'wings', label: 'Ailes de papillon', cost: 90, emoji: '🦋' },
]

export const TITLES = [
  { id: 'debutant', label: 'Débutant(e)', cost: 0 },
  { id: 'explorateur', label: 'Explorateur/Exploratrice', cost: 50 },
  { id: 'aventurier', label: 'Aventurier/Aventurière', cost: 90 },
  { id: 'champion', label: 'Champion(ne) du turc', cost: 150 },
  { id: 'legende', label: 'Légende de Türkçe Maceram', cost: 250 },
]

export const ALL_SHOP_ITEMS = [
  ...FRAMES.map((i) => ({ ...i, category: 'frame' })),
  ...ACCESSORIES.map((i) => ({ ...i, category: 'accessory' })),
  ...TITLES.map((i) => ({ ...i, category: 'title' })),
]

export function isUnlocked(category, id, owned) {
  if (id === 'sky' || id === 'none' || id === 'debutant') return true
  return (owned?.[category] || []).includes(id)
}
