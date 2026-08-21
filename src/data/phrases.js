// Petites phrases turques utilisées dans les leçons, les conversations
// et le jeu "Construis la phrase". `tokens` = découpage pour remettre en ordre.
// `name: true` signifie que le prénom de l'enfant peut être inséré à la place de {name}.

export const PHRASES = [
  { id: 'merhaba_simple', tr: 'Merhaba!', fr: 'Bonjour !', tokens: ['Merhaba!'] },
  { id: 'benim_adim', tr: 'Benim adım {name}.', fr: "Je m'appelle {name}.", tokens: ['Benim', 'adım', '{name}.'], name: true },
  { id: 'senin_adin_ne', tr: 'Senin adın ne?', fr: "Comment tu t'appelles ?", tokens: ['Senin', 'adın', 'ne?'] },
  { id: 'yasindayim', tr: 'Altı yaşındayım.', fr: "J'ai six ans.", tokens: ['Altı', 'yaşındayım.'] },
  { id: 'kac_yasindasin', tr: 'Kaç yaşındasın?', fr: 'Quel âge as-tu ?', tokens: ['Kaç', 'yaşındasın?'] },
  { id: 'kiz', tr: 'Ben bir kızım.', fr: 'Je suis une fille.', tokens: ['Ben', 'bir', 'kızım.'] },
  { id: 'erkek', tr: 'Ben bir erkeğim.', fr: 'Je suis un garçon.', tokens: ['Ben', 'bir', 'erkeğim.'] },
  { id: 'seviyorum', tr: 'Ben {word} seviyorum.', fr: "J'aime {word}.", tokens: ['Ben', '{word}', 'seviyorum.'], word: true },
  { id: 'sevmiyorum', tr: 'Ben {word} sevmiyorum.', fr: "Je n'aime pas {word}.", tokens: ['Ben', '{word}', 'sevmiyorum.'], word: true },
  { id: 'bu_ne', tr: 'Bu ne?', fr: "Qu'est-ce que c'est ?", tokens: ['Bu', 'ne?'] },
  { id: 'bu_bir', tr: 'Bu bir {word}.', fr: "C'est un(e) {word}.", tokens: ['Bu', 'bir', '{word}.'], word: true },
  { id: 'nerede_word', tr: '{Word} nerede?', fr: 'Où est {word} ?', tokens: ['{Word}', 'nerede?'], word: true },
  { id: 'iste_burada', tr: 'İşte burada!', fr: 'Le voilà !', tokens: ['İşte', 'burada!'] },
  { id: 'gel_buraya', tr: 'Gel buraya!', fr: 'Viens ici !', tokens: ['Gel', 'buraya!'] },
  { id: 'bak_soyle', tr: 'Bak ve söyle!', fr: 'Regarde et dis-le !', tokens: ['Bak', 've', 'söyle!'] },
  { id: 'dinle_tekrar', tr: 'Dinle ve tekrar et.', fr: 'Écoute et répète.', tokens: ['Dinle', 've', 'tekrar', 'et.'] },
  { id: 'bana_ver', tr: 'Bana ver lütfen.', fr: "Donne-moi s'il te plaît.", tokens: ['Bana', 'ver', 'lütfen.'] },
  { id: 'al_bunu', tr: 'Al bunu.', fr: 'Prends ça.', tokens: ['Al', 'bunu.'] },
  { id: 'otur_lutfen', tr: 'Otur lütfen.', fr: "Assieds-toi s'il te plaît.", tokens: ['Otur', 'lütfen.'] },
  { id: 'nasilsin_cevap', tr: 'İyiyim, teşekkür ederim!', fr: 'Je vais bien, merci !', tokens: ['İyiyim,', 'teşekkür', 'ederim!'] },
  { id: 'evde_var', tr: 'Evde bir {word} var.', fr: "Il y a un(e) {word} à la maison.", tokens: ['Evde', 'bir', '{word}', 'var.'], word: true },
  { id: 'renk_ne', tr: 'Bu ne renk?', fr: 'De quelle couleur est-ce ?', tokens: ['Bu', 'ne', 'renk?'] },
  { id: 'hava_nasil', tr: 'Hava nasıl?', fr: 'Quel temps fait-il ?', tokens: ['Hava', 'nasıl?'] },
  { id: 'bugun_gunesli', tr: 'Bugün güneşli.', fr: "Aujourd'hui il fait soleil.", tokens: ['Bugün', 'güneşli.'] },
  { id: 'karnim_ac', tr: 'Karnım aç.', fr: "J'ai faim.", tokens: ['Karnım', 'aç.'] },
  { id: 'susadim', tr: 'Susadım.', fr: "J'ai soif.", tokens: ['Susadım.'] },
  { id: 'mutluyum', tr: 'Ben mutluyum.', fr: 'Je suis content(e).', tokens: ['Ben', 'mutluyum.'] },
  { id: 'canim_sikkin', tr: 'Bugün yorgunum.', fr: "Aujourd'hui je suis fatigué(e).", tokens: ['Bugün', 'yorgunum.'] },
  { id: 'oyun_oynayalim', tr: 'Oyun oynayalım!', fr: 'Jouons ensemble !', tokens: ['Oyun', 'oynayalım!'] },
  { id: 'harika', tr: 'Harika!', fr: 'Génial !', tokens: ['Harika!'] },
  { id: 'cok_guzel', tr: 'Çok güzel!', fr: 'Très bien !', tokens: ['Çok', 'güzel!'] },
  { id: 'bir_daha', tr: 'Bir daha deneyelim.', fr: 'Essayons encore une fois.', tokens: ['Bir', 'daha', 'deneyelim.'] },
]

export const byId = Object.fromEntries(PHRASES.map((p) => [p.id, p]))

export function fillPhrase(phrase, { name, word } = {}) {
  const sub = (s) =>
    s
      .replace('{name}', name || 'Neyla')
      .replace('{Word}', word ? word.tr : '')
      .replace('{word}', word ? word.tr.toLowerCase() : '')
  return {
    ...phrase,
    tr: sub(phrase.tr),
    fr: word ? phrase.fr.replace('{word}', word.fr.toLowerCase()) : phrase.fr.replace('{name}', name || 'Neyla'),
    tokens: phrase.tokens.map(sub),
  }
}
