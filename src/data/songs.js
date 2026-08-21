// Comptines originales en turc (contenu 100% original, pensé pour des enfants).
// Elles sont "chantées" via la synthèse vocale, ligne par ligne, avec le rythme affiché.

export const SONGS = [
  {
    id: 'sayilar',
    title: 'Sayı Şarkısı',
    subtitle: 'La chanson des nombres',
    icon: '🔢',
    lines: [
      { tr: 'Bir, iki, üç!', fr: 'Un, deux, trois !' },
      { tr: 'Gel benimle zıpla sen!', fr: 'Viens sauter avec moi !' },
      { tr: 'Dört, beş, altı!', fr: 'Quatre, cinq, six !' },
      { tr: 'Say benimle, hadi!', fr: 'Compte avec moi, allez !' },
      { tr: 'Yedi, sekiz, dokuz, on!', fr: 'Sept, huit, neuf, dix !' },
      { tr: 'Türkçe saymak çok zevkli, hoş!', fr: 'Compter en turc, c\'est très amusant !' },
    ],
  },
  {
    id: 'renkler',
    title: 'Renk Şarkısı',
    subtitle: 'La chanson des couleurs',
    icon: '🌈',
    lines: [
      { tr: 'Kırmızı, sarı, mavi!', fr: 'Rouge, jaune, bleu !' },
      { tr: 'Gökkuşağı geldi!', fr: 'L\'arc-en-ciel est arrivé !' },
      { tr: 'Yeşil, turuncu, pembe!', fr: 'Vert, orange, rose !' },
      { tr: 'Ne kadar da güzel!', fr: 'Comme c\'est beau !' },
    ],
  },
  {
    id: 'aile',
    title: 'Aile Şarkısı',
    subtitle: 'La chanson de la famille',
    icon: '👪',
    lines: [
      { tr: 'Anne, baba, ben!', fr: 'Maman, papa, moi !' },
      { tr: 'Hepimiz bir aileyiz!', fr: 'Nous sommes tous une famille !' },
      { tr: 'Abla, abi, kardeşim!', fr: 'Grande sœur, grand frère, mon frère/sœur !' },
      { tr: 'Seviyorum hepinizi!', fr: 'Je vous aime tous !' },
    ],
  },
  {
    id: 'merhaba_sarkisi',
    title: 'Merhaba Şarkısı',
    subtitle: 'La chanson de bonjour',
    icon: '👋',
    lines: [
      { tr: 'Merhaba, merhaba!', fr: 'Bonjour, bonjour !' },
      { tr: 'Nasılsın bugün?', fr: 'Comment vas-tu aujourd\'hui ?' },
      { tr: 'İyiyim, iyiyim!', fr: 'Je vais bien, je vais bien !' },
      { tr: 'Hadi oynayalım!', fr: 'Allez, jouons !' },
    ],
  },
]

export const byId = Object.fromEntries(SONGS.map((s) => [s.id, s]))
