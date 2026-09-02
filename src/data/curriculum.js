import { wordsByCategory } from './vocabulary'

// Parcours progressif de 90 jours, organisé en 6 phases de 15 jours.
// Jours 1 à 15 sont écrits à la main pour suivre précisément la découverte
// (salutations, famille, nombres, couleurs, animaux, objets).
// Jours 16 à 90 sont générés par thème/phase pour garantir un contenu réel
// et varié chaque jour (mots, phrases, révisions, histoires, chansons,
// conversations et missions finales), avec une immersion turque croissante.

// Chaque phase est aussi une "zone" du monde de Türkçe Maceram, affichée
// comme un lieu à explorer sur la carte (voir pages/Learn.jsx).
const PHASES = [
  {
    from: 1,
    to: 15,
    name: 'Découverte du turc',
    color: 'from-sky-400 to-cyan-300',
    zoneIcon: '🏠',
    zoneName: 'Ma Maison',
    zoneDesc: 'Les premiers mots : bonjour, ma famille, les nombres, les couleurs...',
  },
  {
    from: 16,
    to: 30,
    name: 'Mes premières phrases',
    color: 'from-emerald-400 to-lime-300',
    zoneIcon: '🏫',
    zoneName: "L'École",
    zoneDesc: 'Je construis mes premières phrases avec mes amis de classe.',
  },
  {
    from: 31,
    to: 45,
    name: 'La vie de tous les jours',
    color: 'from-amber-400 to-orange-300',
    zoneIcon: '🌳',
    zoneName: 'Le Parc',
    zoneDesc: 'La météo, les émotions, les vêtements... en jouant dehors.',
  },
  {
    from: 46,
    to: 60,
    name: 'On discute !',
    color: 'from-fuchsia-400 to-pink-300',
    zoneIcon: '🛒',
    zoneName: 'Le Marché',
    zoneDesc: 'Je discute avec les marchands et mes nouveaux amis turcs.',
  },
  {
    from: 61,
    to: 75,
    name: 'Immersion en turc',
    color: 'from-red-500 to-rose-400',
    zoneIcon: '🐾',
    zoneName: 'Le Zoo',
    zoneDesc: 'Les consignes passent en turc : dinle, göster, seç, söyle !',
  },
  {
    from: 76,
    to: 90,
    name: 'Je parle tout seul !',
    color: 'from-indigo-500 to-violet-400',
    zoneIcon: '🇹🇷',
    zoneName: 'La Turquie',
    zoneDesc: 'Missions finales : je me présente et je discute en turc !',
  },
]

export function phaseForDay(day) {
  return PHASES.find((p) => day >= p.from && day <= p.to) || PHASES[0]
}

export const PHASES_LIST = PHASES

// ---------- Jours 1 à 15 (écrits à la main) ----------
const days1to15 = [
  { day: 1, title: 'Merhaba ! (Bonjour)', icon: '👋', wordIds: ['merhaba', 'gule_gule', 'evet', 'hayir', 'tesekkur'], phraseIds: ['merhaba_simple'] },
  { day: 2, title: 'Merci et s\'il te plaît', icon: '🙏', wordIds: ['tesekkur', 'lutfen', 'gunaydin', 'iyi_geceler'], phraseIds: [] },
  { day: 3, title: 'Maman et papa', icon: '👩‍👨', wordIds: ['anne', 'baba'], phraseIds: [] },
  { day: 4, title: 'Ma famille', icon: '👪', wordIds: ['abla', 'abi', 'kardes', 'aile', 'bebek'], phraseIds: [] },
  { day: 5, title: 'On révise !', icon: '🔄', isReview: true, wordIds: [] },
  { day: 6, title: 'Compter 1 à 5', icon: '🔢', wordIds: ['bir', 'iki', 'uc', 'dort', 'bes'], phraseIds: [] },
  { day: 7, title: 'Compter 6 à 10', icon: '🔟', wordIds: ['alti', 'yedi', 'sekiz', 'dokuz', 'on'], phraseIds: [] },
  { day: 8, title: 'On révise les nombres !', icon: '🔄', isReview: true, wordIds: [] },
  { day: 9, title: 'Les couleurs (1)', icon: '🌈', wordIds: ['kirmizi', 'sari', 'mavi', 'yesil', 'turuncu'], phraseIds: [] },
  { day: 10, title: 'Les couleurs (2)', icon: '🎨', wordIds: ['mor', 'pembe', 'siyah', 'beyaz', 'kahverengi'], phraseIds: [] },
  { day: 11, title: 'On révise les couleurs !', icon: '🔄', isReview: true, wordIds: [] },
  { day: 12, title: 'Les animaux (1)', icon: '🐾', wordIds: ['kedi', 'kopek', 'kus', 'balik', 'tavsan', 'at'], phraseIds: [] },
  { day: 13, title: 'Les animaux (2)', icon: '🦁', wordIds: ['inek', 'koyun', 'tavuk', 'aslan', 'fil', 'ayi'], phraseIds: [] },
  { day: 14, title: 'Mes objets', icon: '🎒', wordIds: ['kitap', 'kalem', 'canta', 'top', 'masa', 'sandalye'], phraseIds: [] },
  { day: 15, title: 'Grande révision !', icon: '🏆', isReview: true, isMilestone: true, wordIds: [], badgeMessage: 'Bravo ! Tu connais tes premiers mots turcs !' },
]

// ---------- Thèmes par phase pour la génération 16-90 ----------
const phase2Themes = [
  { title: 'Je m\'appelle...', phraseId: 'benim_adim', cat: null },
  { title: 'Comment tu t\'appelles ?', phraseId: 'senin_adin_ne', cat: null },
  { title: 'J\'ai 6 ans', phraseId: 'yasindayim', cat: null },
  { title: 'Fille ou garçon ?', phraseId: 'kiz', cat: null },
  { title: 'REVISION', isReview: true },
  { title: 'J\'aime...', phraseId: 'seviyorum', cat: 'aliments' },
  { title: 'Je n\'aime pas...', phraseId: 'sevmiyorum', cat: 'animaux' },
  { title: 'Qu\'est-ce que c\'est ?', phraseId: 'bu_ne', cat: 'ecole' },
  { title: 'C\'est un(e)...', phraseId: 'bu_bir', cat: 'animaux' },
  { title: 'REVISION', isReview: true },
  { title: 'Où est... ?', phraseId: 'nerede_word', cat: 'maison' },
  { title: 'Viens ! Regarde !', phraseId: 'gel_buraya', cat: 'activites' },
  { title: 'Écoute et répète', phraseId: 'dinle_tekrar', cat: 'activites' },
  { title: 'Donne-moi, prends', phraseId: 'bana_ver', cat: 'activites' },
  { title: 'Assieds-toi, viens ici', phraseId: 'otur_lutfen', isMilestone: true, conversationId: 'intro', badgeMessage: 'Bravo ! Tu sais construire tes premières phrases !' },
]

const phase3Themes = [
  { title: 'La maison', cat: 'maison', phraseId: 'evde_var' },
  { title: 'Ma chambre', cat: 'maison', phraseId: 'nerede_word' },
  { title: 'L\'école', cat: 'ecole', phraseId: 'bu_bir' },
  { title: 'REVISION', isReview: true },
  { title: 'Les repas', cat: 'aliments', phraseId: 'karnim_ac' },
  { title: 'J\'ai soif', cat: 'aliments', phraseId: 'susadim' },
  { title: 'Mes vêtements', cat: 'vetements', phraseId: 'bu_bir' },
  { title: 'Mon corps', cat: 'corps', phraseId: 'bu_bir' },
  { title: 'REVISION', isReview: true },
  { title: 'Histoire : le chat d\'Ali', storyId: 'ali_kedi' },
  { title: 'Mes émotions', cat: 'emotions', phraseId: 'mutluyum' },
  { title: 'Quel temps fait-il ?', cat: 'meteo', phraseId: 'hava_nasil' },
  { title: 'Chanson des couleurs', songId: 'renkler' },
  { title: 'Mes activités', cat: 'activites', phraseId: 'oyun_oynayalim' },
  { title: 'On discute en famille !', isMilestone: true, conversationId: 'famille', badgeMessage: 'Bravo ! Tu parles de ta vie quotidienne !' },
]

const convCycle = ['intro', 'renkler', 'hayvan', 'gunluk', 'famille']
const phase4Themes = Array.from({ length: 15 }, (_, i) => {
  const dIndex = i + 1
  if (dIndex % 5 === 0) return { title: 'REVISION', isReview: true }
  if (dIndex === 15) return { title: 'Grande conversation !', isMilestone: true, conversationId: 'mini_konusma', badgeMessage: 'Bravo ! Tu sais tenir une conversation en turc !' }
  return { title: 'On discute !', conversationId: convCycle[i % convCycle.length] }
})

const phase5Cats = ['jours', 'meteo', 'emotions', 'corps', 'vetements', 'aliments', 'animaux', 'maison']
const phase5Themes = Array.from({ length: 15 }, (_, i) => {
  const dIndex = i + 1
  if (dIndex === 6) return { title: 'Histoire : les ballons', storyId: 'renkli_balonlar', immersion: 2 }
  if (dIndex === 11) return { title: 'Histoire : le pique-nique', storyId: 'aile_piknik', immersion: 2 }
  if (dIndex === 8) return { title: 'Chanson des nombres', songId: 'sayilar', immersion: 2 }
  if (dIndex % 5 === 0) return { title: 'REVISION', isReview: true, immersion: 2 }
  if (dIndex === 15) return { title: 'Immersion totale !', isMilestone: true, conversationId: 'gunluk', immersion: 2, badgeMessage: 'Bravo ! Tu comprends de plus en plus de turc !' }
  return { title: 'Dinle ve göster', cat: phase5Cats[i % phase5Cats.length], immersion: 2 }
})

const phase6Themes = [
  { title: 'On révise tout !', isReview: true, immersion: 2 },
  { title: 'Histoire : jour d\'école', storyId: 'okul_gunu', immersion: 2 },
  { title: 'Chanson de la famille', songId: 'aile', immersion: 2 },
  { title: 'REVISION', isReview: true, immersion: 2 },
  { title: '🎯 Présente-toi en turc', isMilestone: true, mission: true, conversationId: 'sunum', immersion: 2, badgeMessage: 'Mission réussie : tu sais te présenter en turc !' },
  { title: 'On révise !', isReview: true, immersion: 2 },
  { title: 'Chanson de bonjour', songId: 'merhaba_sarkisi', immersion: 2 },
  { title: 'REVISION', isReview: true, immersion: 2 },
  { title: '🎯 Présente ta famille', isMilestone: true, mission: true, conversationId: 'aile_sunum', immersion: 2, badgeMessage: 'Mission réussie : tu sais présenter ta famille !' },
  { title: 'On révise !', isReview: true, immersion: 2 },
  { title: 'Histoire au choix', storyId: 'ali_kedi', immersion: 2 },
  { title: '🎯 Dis 5 choses que tu aimes', isMilestone: true, mission: true, conversationId: 'sevdiklerim', immersion: 2, badgeMessage: 'Mission réussie : bravo pour tes 5 phrases !' },
  { title: 'On révise tout !', isReview: true, immersion: 2 },
  { title: '🎯 Mini-conversation avec le professeur', isMilestone: true, mission: true, conversationId: 'mini_konusma', immersion: 2, badgeMessage: 'Mission réussie : tu as tenu une vraie conversation !' },
  { title: '🇹🇷 Türkçe Maceram bitti!', isMilestone: true, isFinal: true, immersion: 2, badgeMessage: 'BRAVO ! Tu as terminé toute ton aventure en turc ! Je comprends le turc !' },
]

function pickWords(cat, count, seed) {
  if (!cat) return []
  const all = wordsByCategory(cat)
  if (all.length === 0) return []
  const start = seed % all.length
  const out = []
  for (let i = 0; i < Math.min(count, all.length); i++) {
    out.push(all[(start + i) % all.length].id)
  }
  return out
}

function buildPhase(themes, startDay, immersionDefault) {
  return themes.map((t, i) => {
    const day = startDay + i
    const wordIds = t.wordIds || pickWords(t.cat, 5, day)
    return {
      day,
      title: t.title,
      icon: t.isReview ? '🔄' : t.isMilestone ? '🎯' : t.storyId ? '📖' : t.songId ? '🎵' : '📘',
      wordIds,
      phraseIds: t.phraseId ? [t.phraseId] : [],
      conversationId: t.conversationId || null,
      storyId: t.storyId || null,
      songId: t.songId || null,
      isReview: !!t.isReview,
      isMilestone: !!t.isMilestone,
      isFinal: !!t.isFinal,
      immersion: t.immersion ?? immersionDefault,
      badgeMessage: t.badgeMessage || null,
    }
  })
}

const days16to30 = buildPhase(phase2Themes, 16, 0)
const days31to45 = buildPhase(phase3Themes, 31, 0)
const days46to60 = buildPhase(phase4Themes, 46, 1)
const days61to75 = buildPhase(phase5Themes, 61, 2)
const days76to90 = buildPhase(phase6Themes, 76, 2)

const normalized1to15 = days1to15.map((d) => ({
  icon: '📘',
  phraseIds: [],
  conversationId: null,
  storyId: null,
  songId: null,
  isReview: false,
  isMilestone: false,
  isFinal: false,
  immersion: 0,
  badgeMessage: null,
  ...d,
}))

export const CURRICULUM = [
  ...normalized1to15,
  ...days16to30,
  ...days31to45,
  ...days46to60,
  ...days61to75,
  ...days76to90,
].map((d) => ({ ...d, phase: phaseForDay(d.day) }))

export const dayById = Object.fromEntries(CURRICULUM.map((d) => [d.day, d]))

export function getDay(day) {
  return dayById[day]
}

export const TOTAL_DAYS = CURRICULUM.length
