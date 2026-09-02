import { VOCAB } from '../data/vocabulary'
import { CONVERSATIONS } from '../data/conversations'
import { STORIES } from '../data/stories'

// Profil de compétences (0 à 5 étoiles) calculé uniquement à partir de ce que
// l'enfant a réellement fait dans l'app — jamais une note scolaire, juste un
// indicateur pour aider le parent à voir où en est l'enfant.
export function computeCompetencies(progress) {
  const srs = progress.srs || {}
  const entries = Object.values(srs)

  const vocabRatio = entries.length ? entries.filter((e) => e.box >= 2).length / Math.min(VOCAB.length, 40) : 0
  const comprehensionRatio = entries.length ? entries.reduce((sum, e) => sum + e.box, 0) / (entries.length * 5) : 0
  const pron = progress.pronunciation || { close: 0, total: 0 }
  const pronunciationRatio = pron.total > 0 ? pron.close / pron.total : null
  const conversationRatio = (progress.conversationsDone || []).length / CONVERSATIONS.length
  const readingRatio = (progress.storiesRead || []).length / STORIES.length

  return {
    vocabulaire: toStars(vocabRatio),
    comprehension: toStars(comprehensionRatio),
    prononciation: pronunciationRatio === null ? null : toStars(pronunciationRatio),
    conversation: toStars(conversationRatio),
    lecture: toStars(readingRatio),
  }
}

function toStars(ratio) {
  return Math.max(0, Math.min(5, Math.round(ratio * 5)))
}

export const COMPETENCY_LABELS = {
  vocabulaire: { label: 'Vocabulaire', icon: '📚' },
  comprehension: { label: 'Compréhension', icon: '👂' },
  prononciation: { label: 'Prononciation', icon: '🗣️' },
  conversation: { label: 'Conversation', icon: '💬' },
  lecture: { label: 'Lecture (histoires)', icon: '📖' },
}
