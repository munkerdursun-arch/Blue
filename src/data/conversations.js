// Petits dialogues interactifs pour le mode "Parler" et les leçons de conversation.
// Chaque ligne du professeur peut avoir plusieurs réponses possibles pour l'enfant :
// toutes sont valorisées, une seule est marquée "best" pour guider en douceur.

export const CONVERSATIONS = [
  {
    id: 'intro',
    title: 'Merhaba !',
    icon: '👋',
    level: 1,
    lines: [
      { speaker: 'teacher', tr: 'Merhaba!', fr: 'Bonjour !' },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Réponds au professeur :' },
        choices: [
          { tr: 'Merhaba!', fr: 'Bonjour !', best: true },
          { tr: 'Güle güle!', fr: 'Au revoir !' },
        ],
      },
      { speaker: 'teacher', tr: 'Senin adın ne?', fr: "Comment tu t'appelles ?" },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Dis ton prénom :' },
        choices: [
          { tr: 'Benim adım {name}.', fr: "Je m'appelle {name}.", best: true, useName: true },
        ],
      },
      { speaker: 'teacher', tr: 'Nasılsın?', fr: 'Comment vas-tu ?' },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Réponds :' },
        choices: [
          { tr: 'İyiyim, teşekkür ederim!', fr: 'Je vais bien, merci !', best: true },
          { tr: 'Yorgunum.', fr: 'Je suis fatigué(e).' },
        ],
      },
      { speaker: 'teacher', tr: 'Harika! Görüşürüz!', fr: 'Génial ! À bientôt !' },
    ],
  },
  {
    id: 'famille',
    title: 'Ailem (Ma famille)',
    icon: '👪',
    level: 2,
    lines: [
      { speaker: 'teacher', tr: 'Ailende kim var?', fr: 'Qui y a-t-il dans ta famille ?' },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Choisis une réponse :' },
        choices: [
          { tr: 'Annem ve babam.', fr: 'Ma maman et mon papa.', best: true },
          { tr: 'Bir kardeşim var.', fr: "J'ai un frère ou une sœur." },
        ],
      },
      { speaker: 'teacher', tr: 'Bir kardeşin var mı?', fr: 'As-tu un frère ou une sœur ?' },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Réponds :' },
        choices: [
          { tr: 'Evet, bir kardeşim var.', fr: "Oui, j'ai un frère ou une sœur.", best: true },
          { tr: 'Hayır, kardeşim yok.', fr: "Non, je n'ai pas de frère ou sœur." },
        ],
      },
      { speaker: 'teacher', tr: 'Ailen çok güzel!', fr: 'Ta famille est très belle !' },
    ],
  },
  {
    id: 'renkler',
    title: 'Favori renk (Couleur préférée)',
    icon: '🌈',
    level: 2,
    lines: [
      { speaker: 'teacher', tr: 'En sevdiğin renk ne?', fr: 'Quelle est ta couleur préférée ?' },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Choisis ta couleur :' },
        choices: [
          { tr: 'Kırmızıyı seviyorum.', fr: "J'aime le rouge.", best: true },
          { tr: 'Maviyi seviyorum.', fr: "J'aime le bleu.", best: true },
          { tr: 'Sarıyı seviyorum.', fr: "J'aime le jaune.", best: true },
        ],
      },
      { speaker: 'teacher', tr: 'Çok güzel bir renk!', fr: 'Très belle couleur !' },
    ],
  },
  {
    id: 'hayvan',
    title: 'Favori hayvan (Animal préféré)',
    icon: '🐾',
    level: 2,
    lines: [
      { speaker: 'teacher', tr: 'En sevdiğin hayvan ne?', fr: 'Quel est ton animal préféré ?' },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Choisis ton animal :' },
        choices: [
          { tr: 'Kediyi seviyorum.', fr: "J'aime le chat.", best: true },
          { tr: 'Köpeği seviyorum.', fr: "J'aime le chien.", best: true },
          { tr: 'Aslanı seviyorum.', fr: "J'aime le lion.", best: true },
        ],
      },
      { speaker: 'teacher', tr: 'Harika bir seçim!', fr: 'Excellent choix !' },
    ],
  },
  {
    id: 'gunluk',
    title: 'Bugün nasılsın? (Ta journée)',
    icon: '🌤️',
    level: 3,
    lines: [
      { speaker: 'teacher', tr: 'Bugün nasılsın?', fr: "Comment vas-tu aujourd'hui ?" },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Réponds :' },
        choices: [
          { tr: 'Bugün mutluyum.', fr: "Aujourd'hui je suis content(e).", best: true },
          { tr: 'Bugün yorgunum.', fr: "Aujourd'hui je suis fatigué(e)." },
        ],
      },
      { speaker: 'teacher', tr: 'Ne yapmak istiyorsun?', fr: 'Que veux-tu faire ?' },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Choisis :' },
        choices: [
          { tr: 'Oyun oynamak istiyorum.', fr: 'Je veux jouer.', best: true },
          { tr: 'Kitap okumak istiyorum.', fr: 'Je veux lire un livre.', best: true },
        ],
      },
      { speaker: 'teacher', tr: 'Harika bir plan!', fr: 'Super plan !' },
    ],
  },
  {
    id: 'sunum',
    title: 'Kendimi tanıtıyorum (Je me présente)',
    icon: '🎯',
    level: 4,
    mission: true,
    lines: [
      { speaker: 'teacher', tr: 'Kendini tanıtır mısın?', fr: 'Peux-tu te présenter ?' },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Étape 1 : dis bonjour' },
        choices: [{ tr: 'Merhaba!', fr: 'Bonjour !', best: true }],
      },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Étape 2 : dis ton prénom' },
        choices: [{ tr: 'Benim adım {name}.', fr: "Je m'appelle {name}.", best: true, useName: true }],
      },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Étape 3 : dis ton âge' },
        choices: [{ tr: 'Altı yaşındayım.', fr: "J'ai six ans.", best: true }],
      },
      {
        speaker: 'child',
        prompt: { tr: '', fr: 'Étape 4 : dis comment tu vas' },
        choices: [{ tr: 'İyiyim, teşekkür ederim!', fr: 'Je vais bien, merci !', best: true }],
      },
      { speaker: 'teacher', tr: 'Harikasın! Seni tanımak çok güzeldi!', fr: "Tu es génial(e) ! C'était un plaisir de te connaître !" },
    ],
  },
  {
    id: 'aile_sunum',
    title: 'Ailemi tanıtıyorum (Ma famille)',
    icon: '🎯',
    level: 4,
    mission: true,
    lines: [
      { speaker: 'teacher', tr: 'Ailenden bahset.', fr: 'Parle-moi de ta famille.' },
      { speaker: 'child', prompt: { tr: '', fr: 'Étape 1 :' }, choices: [{ tr: 'Annem var.', fr: "J'ai une maman.", best: true }] },
      { speaker: 'child', prompt: { tr: '', fr: 'Étape 2 :' }, choices: [{ tr: 'Babam var.', fr: "J'ai un papa.", best: true }] },
      { speaker: 'child', prompt: { tr: '', fr: 'Étape 3 :' }, choices: [{ tr: 'Bir kardeşim var.', fr: "J'ai un frère ou une sœur.", best: true }] },
      { speaker: 'teacher', tr: 'Çok güzel bir aile!', fr: 'Très belle famille !' },
    ],
  },
  {
    id: 'sevdiklerim',
    title: 'Sevdiklerim (Ce que j\'aime)',
    icon: '🎯',
    level: 4,
    mission: true,
    lines: [
      { speaker: 'teacher', tr: 'Neleri seviyorsun?', fr: 'Qu\'est-ce que tu aimes ?' },
      { speaker: 'child', prompt: { tr: '', fr: '1' }, choices: [{ tr: 'Elmayı seviyorum.', fr: "J'aime la pomme.", best: true }] },
      { speaker: 'child', prompt: { tr: '', fr: '2' }, choices: [{ tr: 'Kediyi seviyorum.', fr: "J'aime le chat.", best: true }] },
      { speaker: 'child', prompt: { tr: '', fr: '3' }, choices: [{ tr: 'Kırmızıyı seviyorum.', fr: "J'aime le rouge.", best: true }] },
      { speaker: 'child', prompt: { tr: '', fr: '4' }, choices: [{ tr: 'Oyun oynamayı seviyorum.', fr: "J'aime jouer.", best: true }] },
      { speaker: 'child', prompt: { tr: '', fr: '5' }, choices: [{ tr: 'Ailemi seviyorum.', fr: "J'aime ma famille.", best: true }] },
      { speaker: 'teacher', tr: 'Çok güzel şeyler seviyorsun!', fr: "Tu aimes de très belles choses !" },
    ],
  },
  {
    id: 'mini_konusma',
    title: 'Öğretmenimle sohbet (Mini-conversation)',
    icon: '🎯',
    level: 5,
    mission: true,
    lines: [
      { speaker: 'teacher', tr: 'Merhaba! Bugün nasılsın?', fr: "Bonjour ! Comment vas-tu aujourd'hui ?" },
      { speaker: 'child', prompt: { tr: '', fr: '' }, choices: [{ tr: 'İyiyim, teşekkür ederim!', fr: 'Je vais bien, merci !', best: true }] },
      { speaker: 'teacher', tr: 'En sevdiğin hayvan ne?', fr: 'Quel est ton animal préféré ?' },
      { speaker: 'child', prompt: { tr: '', fr: '' }, choices: [{ tr: 'Kediyi seviyorum.', fr: "J'aime le chat.", best: true }] },
      { speaker: 'teacher', tr: 'Kaç yaşındasın?', fr: 'Quel âge as-tu ?' },
      { speaker: 'child', prompt: { tr: '', fr: '' }, choices: [{ tr: 'Altı yaşındayım.', fr: "J'ai six ans.", best: true }] },
      { speaker: 'teacher', tr: 'Seninle konuşmak harikaydı! Görüşürüz!', fr: "C'était génial de parler avec toi ! À bientôt !" },
    ],
  },
]

export const byId = Object.fromEntries(CONVERSATIONS.map((c) => [c.id, c]))

export function fillConversation(conv, name) {
  const sub = (s) => (s || '').replace('{name}', name || 'Neyla')
  return {
    ...conv,
    lines: conv.lines.map((l) => ({
      ...l,
      tr: sub(l.tr),
      fr: sub(l.fr),
      choices: l.choices?.map((c) => ({ ...c, tr: sub(c.tr), fr: sub(c.fr) })),
    })),
  }
}
