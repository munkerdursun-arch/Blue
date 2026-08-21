// Réduit progressivement le français dans les consignes selon le niveau
// d'immersion du jour (0 = français, 1 = turc+français, 2 = turc).
export function instr(level, tr, fr) {
  if (level >= 2) return tr
  if (level === 1) return `${tr} (${fr})`
  return fr
}
