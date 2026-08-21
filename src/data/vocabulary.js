// Banque de vocabulaire turc <-> français pour Mini Türkçe Maceram
// cat = catégorie (utilisée pour regrouper les leçons et les jeux)

export const CATEGORIES = {
  salutations: { label: 'Salutations', icon: '👋' },
  famille: { label: 'Famille', icon: '👪' },
  nombres: { label: 'Nombres', icon: '🔢' },
  couleurs: { label: 'Couleurs', icon: '🌈' },
  animaux: { label: 'Animaux', icon: '🐾' },
  aliments: { label: 'Nourriture', icon: '🍎' },
  corps: { label: 'Le corps', icon: '🙂' },
  vetements: { label: 'Vêtements', icon: '👕' },
  maison: { label: 'La maison', icon: '🏠' },
  ecole: { label: "L'école", icon: '🏫' },
  emotions: { label: 'Émotions', icon: '😊' },
  meteo: { label: 'La météo', icon: '⛅' },
  jours: { label: 'Les jours', icon: '📅' },
  activites: { label: 'Actions', icon: '🏃' },
  structure: { label: 'Petits mots', icon: '🧩' },
}

export const VOCAB = [
  // Salutations
  { id: 'merhaba', tr: 'Merhaba', fr: 'Bonjour', emoji: '👋', cat: 'salutations' },
  { id: 'gule_gule', tr: 'Güle güle', fr: 'Au revoir', emoji: '🙋', cat: 'salutations' },
  { id: 'tesekkur', tr: 'Teşekkür ederim', fr: 'Merci', emoji: '🙏', cat: 'salutations' },
  { id: 'lutfen', tr: 'Lütfen', fr: "S'il te plaît", emoji: '🥺', cat: 'salutations' },
  { id: 'evet', tr: 'Evet', fr: 'Oui', emoji: '✅', cat: 'salutations' },
  { id: 'hayir', tr: 'Hayır', fr: 'Non', emoji: '❌', cat: 'salutations' },
  { id: 'gunaydin', tr: 'Günaydın', fr: 'Bonjour (le matin)', emoji: '🌅', cat: 'salutations' },
  { id: 'iyi_geceler', tr: 'İyi geceler', fr: 'Bonne nuit', emoji: '🌙', cat: 'salutations' },
  { id: 'nasilsin', tr: 'Nasılsın?', fr: 'Comment vas-tu ?', emoji: '❓', cat: 'salutations' },
  { id: 'iyiyim', tr: 'İyiyim', fr: 'Je vais bien', emoji: '😊', cat: 'salutations' },
  { id: 'ozur', tr: 'Özür dilerim', fr: 'Pardon', emoji: '😔', cat: 'salutations' },
  { id: 'rica', tr: 'Rica ederim', fr: "Je t'en prie", emoji: '😊', cat: 'salutations' },

  // Famille
  { id: 'anne', tr: 'Anne', fr: 'Maman', emoji: '👩', cat: 'famille' },
  { id: 'baba', tr: 'Baba', fr: 'Papa', emoji: '👨', cat: 'famille' },
  { id: 'abla', tr: 'Abla', fr: 'Grande sœur', emoji: '👧', cat: 'famille' },
  { id: 'abi', tr: 'Abi', fr: 'Grand frère', emoji: '👦', cat: 'famille' },
  { id: 'kardes', tr: 'Kardeş', fr: 'Frère / sœur', emoji: '🧒', cat: 'famille' },
  { id: 'dede', tr: 'Dede', fr: 'Grand-père', emoji: '👴', cat: 'famille' },
  { id: 'anneanne', tr: 'Anneanne', fr: 'Grand-mère', emoji: '👵', cat: 'famille' },
  { id: 'aile', tr: 'Aile', fr: 'Famille', emoji: '👪', cat: 'famille' },
  { id: 'bebek', tr: 'Bebek', fr: 'Bébé', emoji: '👶', cat: 'famille' },

  // Nombres
  { id: 'bir', tr: 'Bir', fr: 'Un', emoji: '1️⃣', cat: 'nombres' },
  { id: 'iki', tr: 'İki', fr: 'Deux', emoji: '2️⃣', cat: 'nombres' },
  { id: 'uc', tr: 'Üç', fr: 'Trois', emoji: '3️⃣', cat: 'nombres' },
  { id: 'dort', tr: 'Dört', fr: 'Quatre', emoji: '4️⃣', cat: 'nombres' },
  { id: 'bes', tr: 'Beş', fr: 'Cinq', emoji: '5️⃣', cat: 'nombres' },
  { id: 'alti', tr: 'Altı', fr: 'Six', emoji: '6️⃣', cat: 'nombres' },
  { id: 'yedi', tr: 'Yedi', fr: 'Sept', emoji: '7️⃣', cat: 'nombres' },
  { id: 'sekiz', tr: 'Sekiz', fr: 'Huit', emoji: '8️⃣', cat: 'nombres' },
  { id: 'dokuz', tr: 'Dokuz', fr: 'Neuf', emoji: '9️⃣', cat: 'nombres' },
  { id: 'on', tr: 'On', fr: 'Dix', emoji: '🔟', cat: 'nombres' },

  // Couleurs
  { id: 'kirmizi', tr: 'Kırmızı', fr: 'Rouge', emoji: '🔴', cat: 'couleurs' },
  { id: 'turuncu', tr: 'Turuncu', fr: 'Orange', emoji: '🟠', cat: 'couleurs' },
  { id: 'sari', tr: 'Sarı', fr: 'Jaune', emoji: '🟡', cat: 'couleurs' },
  { id: 'yesil', tr: 'Yeşil', fr: 'Vert', emoji: '🟢', cat: 'couleurs' },
  { id: 'mavi', tr: 'Mavi', fr: 'Bleu', emoji: '🔵', cat: 'couleurs' },
  { id: 'mor', tr: 'Mor', fr: 'Violet', emoji: '🟣', cat: 'couleurs' },
  { id: 'pembe', tr: 'Pembe', fr: 'Rose', emoji: '💗', cat: 'couleurs' },
  { id: 'siyah', tr: 'Siyah', fr: 'Noir', emoji: '⚫', cat: 'couleurs' },
  { id: 'beyaz', tr: 'Beyaz', fr: 'Blanc', emoji: '⚪', cat: 'couleurs' },
  { id: 'kahverengi', tr: 'Kahverengi', fr: 'Marron', emoji: '🟤', cat: 'couleurs' },

  // Animaux
  { id: 'kedi', tr: 'Kedi', fr: 'Chat', emoji: '🐱', cat: 'animaux' },
  { id: 'kopek', tr: 'Köpek', fr: 'Chien', emoji: '🐶', cat: 'animaux' },
  { id: 'kus', tr: 'Kuş', fr: 'Oiseau', emoji: '🐦', cat: 'animaux' },
  { id: 'balik', tr: 'Balık', fr: 'Poisson', emoji: '🐟', cat: 'animaux' },
  { id: 'tavsan', tr: 'Tavşan', fr: 'Lapin', emoji: '🐰', cat: 'animaux' },
  { id: 'at', tr: 'At', fr: 'Cheval', emoji: '🐴', cat: 'animaux' },
  { id: 'inek', tr: 'İnek', fr: 'Vache', emoji: '🐮', cat: 'animaux' },
  { id: 'koyun', tr: 'Koyun', fr: 'Mouton', emoji: '🐑', cat: 'animaux' },
  { id: 'tavuk', tr: 'Tavuk', fr: 'Poule', emoji: '🐔', cat: 'animaux' },
  { id: 'aslan', tr: 'Aslan', fr: 'Lion', emoji: '🦁', cat: 'animaux' },
  { id: 'fil', tr: 'Fil', fr: 'Éléphant', emoji: '🐘', cat: 'animaux' },
  { id: 'ayi', tr: 'Ayı', fr: 'Ours', emoji: '🐻', cat: 'animaux' },
  { id: 'kaplumbaga', tr: 'Kaplumbağa', fr: 'Tortue', emoji: '🐢', cat: 'animaux' },
  { id: 'kelebek', tr: 'Kelebek', fr: 'Papillon', emoji: '🦋', cat: 'animaux' },
  { id: 'ari', tr: 'Arı', fr: 'Abeille', emoji: '🐝', cat: 'animaux' },

  // Aliments
  { id: 'elma', tr: 'Elma', fr: 'Pomme', emoji: '🍎', cat: 'aliments' },
  { id: 'muz', tr: 'Muz', fr: 'Banane', emoji: '🍌', cat: 'aliments' },
  { id: 'ekmek', tr: 'Ekmek', fr: 'Pain', emoji: '🍞', cat: 'aliments' },
  { id: 'sut', tr: 'Süt', fr: 'Lait', emoji: '🥛', cat: 'aliments' },
  { id: 'su', tr: 'Su', fr: 'Eau', emoji: '💧', cat: 'aliments' },
  { id: 'peynir', tr: 'Peynir', fr: 'Fromage', emoji: '🧀', cat: 'aliments' },
  { id: 'yumurta', tr: 'Yumurta', fr: 'Œuf', emoji: '🥚', cat: 'aliments' },
  { id: 'corba', tr: 'Çorba', fr: 'Soupe', emoji: '🍲', cat: 'aliments' },
  { id: 'pilav', tr: 'Pilav', fr: 'Riz', emoji: '🍚', cat: 'aliments' },
  { id: 'cikolata', tr: 'Çikolata', fr: 'Chocolat', emoji: '🍫', cat: 'aliments' },
  { id: 'portakal', tr: 'Portakal', fr: 'Orange', emoji: '🍊', cat: 'aliments' },
  { id: 'uzum', tr: 'Üzüm', fr: 'Raisin', emoji: '🍇', cat: 'aliments' },
  { id: 'dondurma', tr: 'Dondurma', fr: 'Glace', emoji: '🍦', cat: 'aliments' },
  { id: 'bal', tr: 'Bal', fr: 'Miel', emoji: '🍯', cat: 'aliments' },

  // Corps
  { id: 'goz', tr: 'Göz', fr: 'Œil', emoji: '👁️', cat: 'corps' },
  { id: 'burun', tr: 'Burun', fr: 'Nez', emoji: '👃', cat: 'corps' },
  { id: 'agiz', tr: 'Ağız', fr: 'Bouche', emoji: '👄', cat: 'corps' },
  { id: 'kulak', tr: 'Kulak', fr: 'Oreille', emoji: '👂', cat: 'corps' },
  { id: 'el', tr: 'El', fr: 'Main', emoji: '✋', cat: 'corps' },
  { id: 'ayak', tr: 'Ayak', fr: 'Pied', emoji: '🦶', cat: 'corps' },
  { id: 'kafa', tr: 'Kafa', fr: 'Tête', emoji: '🙂', cat: 'corps' },
  { id: 'sac', tr: 'Saç', fr: 'Cheveux', emoji: '💇', cat: 'corps' },
  { id: 'kalp', tr: 'Kalp', fr: 'Cœur', emoji: '❤️', cat: 'corps' },

  // Vêtements
  { id: 'pantolon', tr: 'Pantolon', fr: 'Pantalon', emoji: '👖', cat: 'vetements' },
  { id: 'tisort', tr: 'Tişört', fr: 'T-shirt', emoji: '👕', cat: 'vetements' },
  { id: 'elbise', tr: 'Elbise', fr: 'Robe', emoji: '👗', cat: 'vetements' },
  { id: 'ayakkabi', tr: 'Ayakkabı', fr: 'Chaussures', emoji: '👟', cat: 'vetements' },
  { id: 'sapka', tr: 'Şapka', fr: 'Chapeau', emoji: '🧢', cat: 'vetements' },
  { id: 'corap', tr: 'Çorap', fr: 'Chaussettes', emoji: '🧦', cat: 'vetements' },
  { id: 'ceket', tr: 'Ceket', fr: 'Veste', emoji: '🧥', cat: 'vetements' },

  // Maison / École
  { id: 'ev', tr: 'Ev', fr: 'Maison', emoji: '🏠', cat: 'maison' },
  { id: 'oda', tr: 'Oda', fr: 'Chambre', emoji: '🛏️', cat: 'maison' },
  { id: 'kapi', tr: 'Kapı', fr: 'Porte', emoji: '🚪', cat: 'maison' },
  { id: 'pencere', tr: 'Pencere', fr: 'Fenêtre', emoji: '🪟', cat: 'maison' },
  { id: 'masa', tr: 'Masa', fr: 'Table', emoji: '🍽️', cat: 'maison' },
  { id: 'sandalye', tr: 'Sandalye', fr: 'Chaise', emoji: '🪑', cat: 'maison' },
  { id: 'okul', tr: 'Okul', fr: 'École', emoji: '🏫', cat: 'ecole' },
  { id: 'kitap', tr: 'Kitap', fr: 'Livre', emoji: '📚', cat: 'ecole' },
  { id: 'kalem', tr: 'Kalem', fr: 'Crayon', emoji: '✏️', cat: 'ecole' },
  { id: 'canta', tr: 'Çanta', fr: 'Sac', emoji: '🎒', cat: 'ecole' },
  { id: 'top', tr: 'Top', fr: 'Ballon', emoji: '⚽', cat: 'ecole' },

  // Émotions
  { id: 'mutlu', tr: 'Mutlu', fr: 'Content(e)', emoji: '😄', cat: 'emotions' },
  { id: 'uzgun', tr: 'Üzgün', fr: 'Triste', emoji: '😢', cat: 'emotions' },
  { id: 'kizgin', tr: 'Kızgın', fr: 'Fâché(e)', emoji: '😠', cat: 'emotions' },
  { id: 'yorgun', tr: 'Yorgun', fr: 'Fatigué(e)', emoji: '😴', cat: 'emotions' },
  { id: 'korkmus', tr: 'Korkmuş', fr: 'Effrayé(e)', emoji: '😱', cat: 'emotions' },
  { id: 'saskin', tr: 'Şaşkın', fr: 'Surpris(e)', emoji: '😲', cat: 'emotions' },

  // Météo
  { id: 'gunesli', tr: 'Güneşli', fr: 'Ensoleillé', emoji: '☀️', cat: 'meteo' },
  { id: 'yagmurlu', tr: 'Yağmurlu', fr: 'Pluvieux', emoji: '🌧️', cat: 'meteo' },
  { id: 'karli', tr: 'Karlı', fr: 'Neigeux', emoji: '❄️', cat: 'meteo' },
  { id: 'ruzgarli', tr: 'Rüzgarlı', fr: 'Venteux', emoji: '🌬️', cat: 'meteo' },
  { id: 'bulutlu', tr: 'Bulutlu', fr: 'Nuageux', emoji: '☁️', cat: 'meteo' },

  // Jours
  { id: 'pazartesi', tr: 'Pazartesi', fr: 'Lundi', emoji: '🔶', cat: 'jours' },
  { id: 'sali', tr: 'Salı', fr: 'Mardi', emoji: '🔷', cat: 'jours' },
  { id: 'carsamba', tr: 'Çarşamba', fr: 'Mercredi', emoji: '🔺', cat: 'jours' },
  { id: 'persembe', tr: 'Perşembe', fr: 'Jeudi', emoji: '🔻', cat: 'jours' },
  { id: 'cuma', tr: 'Cuma', fr: 'Vendredi', emoji: '💠', cat: 'jours' },
  { id: 'cumartesi', tr: 'Cumartesi', fr: 'Samedi', emoji: '⭐', cat: 'jours' },
  { id: 'pazar', tr: 'Pazar', fr: 'Dimanche', emoji: '🌟', cat: 'jours' },

  // Actions
  { id: 'gel', tr: 'Gel', fr: 'Viens', emoji: '👋', cat: 'activites' },
  { id: 'bak', tr: 'Bak', fr: 'Regarde', emoji: '👀', cat: 'activites' },
  { id: 'dinle', tr: 'Dinle', fr: 'Écoute', emoji: '👂', cat: 'activites' },
  { id: 'ver', tr: 'Ver', fr: 'Donne', emoji: '🤲', cat: 'activites' },
  { id: 'al', tr: 'Al', fr: 'Prends', emoji: '🫴', cat: 'activites' },
  { id: 'otur', tr: 'Otur', fr: 'Assieds-toi', emoji: '🪑', cat: 'activites' },
  { id: 'oyna', tr: 'Oyna', fr: 'Joue', emoji: '🧸', cat: 'activites' },
  { id: 'kos', tr: 'Koş', fr: 'Cours', emoji: '🏃', cat: 'activites' },
  { id: 'uyu', tr: 'Uyu', fr: 'Dors', emoji: '😴', cat: 'activites' },
  { id: 'ye', tr: 'Ye', fr: 'Mange', emoji: '🍽️', cat: 'activites' },
  { id: 'ic', tr: 'İç', fr: 'Bois', emoji: '🥤', cat: 'activites' },
  { id: 'tekrar_et', tr: 'Tekrar et', fr: 'Répète', emoji: '🔁', cat: 'activites' },
  { id: 'goster', tr: 'Göster', fr: 'Montre', emoji: '👉', cat: 'activites' },
  { id: 'sec', tr: 'Seç', fr: 'Choisis', emoji: '☑️', cat: 'activites' },
  { id: 'soyle', tr: 'Söyle', fr: 'Dis', emoji: '🗣️', cat: 'activites' },

  // Petits mots / structure
  { id: 'ben', tr: 'Ben', fr: 'Je', emoji: '🙋', cat: 'structure' },
  { id: 'sen', tr: 'Sen', fr: 'Tu', emoji: '👉', cat: 'structure' },
  { id: 'bu', tr: 'Bu', fr: 'Ceci / ça', emoji: '👆', cat: 'structure' },
  { id: 'nerede', tr: 'Nerede?', fr: 'Où est... ?', emoji: '❓', cat: 'structure' },
  { id: 'ne', tr: 'Ne?', fr: 'Quoi ?', emoji: '❓', cat: 'structure' },
]

export const byId = Object.fromEntries(VOCAB.map((w) => [w.id, w]))

export function wordsByCategory(cat) {
  return VOCAB.filter((w) => w.cat === cat)
}

export function getWords(ids) {
  return ids.map((id) => byId[id]).filter(Boolean)
}

export function randomWords(n, excludeIds = []) {
  const pool = VOCAB.filter((w) => !excludeIds.includes(w.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}
