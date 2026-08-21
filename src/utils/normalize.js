// Normalisation légère de texte pour comparer une transcription vocale
// à un mot attendu, sans jamais servir de "note" stricte à l'enfant.
export function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function looksClose(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return false
  if (na === nb) return true
  return na.includes(nb) || nb.includes(na)
}
