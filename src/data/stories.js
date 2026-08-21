// Petites histoires originales en turc, adaptées à un enfant de 6 ans.
// Chaque phrase a sa traduction. Une question de compréhension simple suit.

export const STORIES = [
  {
    id: 'ali_kedi',
    title: "Ali'nin Kedisi",
    subtitle: 'Le chat d\'Ali',
    icon: '🐱',
    cover: '🐱',
    sentences: [
      { tr: "Ali'nin bir kedisi var.", fr: 'Ali a un chat.' },
      { tr: 'Kedinin adı Pamuk.', fr: 'Le chat s\'appelle Pamuk.' },
      { tr: 'Pamuk çok tatlı.', fr: 'Pamuk est très mignon.' },
      { tr: "Ali Pamuk'u çok seviyor.", fr: 'Ali aime beaucoup Pamuk.' },
    ],
    question: {
      tr: "Ali'nin kedisi var mı?",
      fr: 'Est-ce qu\'Ali a un chat ?',
      choices: [
        { tr: 'Evet!', fr: 'Oui !', correct: true },
        { tr: 'Hayır.', fr: 'Non.', correct: false },
      ],
    },
  },
  {
    id: 'aile_piknik',
    title: 'Piknik Günü',
    subtitle: 'Le jour du pique-nique',
    icon: '🧺',
    cover: '🧺',
    sentences: [
      { tr: 'Bugün hava güneşli.', fr: 'Aujourd\'hui il fait soleil.' },
      { tr: 'Aile parka gidiyor.', fr: 'La famille va au parc.' },
      { tr: 'Anne elma getiriyor.', fr: 'Maman apporte des pommes.' },
      { tr: 'Baba su getiriyor.', fr: 'Papa apporte de l\'eau.' },
      { tr: 'Herkes çok mutlu!', fr: 'Tout le monde est très content !' },
    ],
    question: {
      tr: 'Hava nasıl?',
      fr: 'Quel temps fait-il ?',
      choices: [
        { tr: 'Güneşli.', fr: 'Ensoleillé.', correct: true },
        { tr: 'Yağmurlu.', fr: 'Pluvieux.', correct: false },
      ],
    },
  },
  {
    id: 'renkli_balonlar',
    title: 'Renkli Balonlar',
    subtitle: 'Les ballons colorés',
    icon: '🎈',
    cover: '🎈',
    sentences: [
      { tr: 'Bir kırmızı balon var.', fr: 'Il y a un ballon rouge.' },
      { tr: 'Bir mavi balon var.', fr: 'Il y a un ballon bleu.' },
      { tr: 'Bir sarı balon var.', fr: 'Il y a un ballon jaune.' },
      { tr: 'Üç balon uçuyor!', fr: 'Trois ballons s\'envolent !' },
    ],
    question: {
      tr: 'Kaç balon var?',
      fr: 'Combien de ballons y a-t-il ?',
      choices: [
        { tr: 'Üç.', fr: 'Trois.', correct: true },
        { tr: 'Beş.', fr: 'Cinq.', correct: false },
      ],
    },
  },
  {
    id: 'okul_gunu',
    title: 'Okul Günü',
    subtitle: 'Une journée d\'école',
    icon: '🏫',
    cover: '🏫',
    sentences: [
      { tr: 'Neyla sabah kalkıyor.', fr: 'Neyla se lève le matin.' },
      { tr: 'Çantasını alıyor.', fr: 'Elle prend son sac.' },
      { tr: 'Okula gidiyor.', fr: 'Elle va à l\'école.' },
      { tr: 'Arkadaşlarıyla oynuyor.', fr: 'Elle joue avec ses amis.' },
      { tr: 'Çok eğleniyor!', fr: 'Elle s\'amuse beaucoup !' },
    ],
    question: {
      tr: 'Neyla nereye gidiyor?',
      fr: 'Où va Neyla ?',
      choices: [
        { tr: 'Okula.', fr: 'À l\'école.', correct: true },
        { tr: 'Eve.', fr: 'À la maison.', correct: false },
      ],
    },
  },
]

export const byId = Object.fromEntries(STORIES.map((s) => [s.id, s]))
