// Messages d'encouragement utilisés PARTOUT dans l'application.
// Principe pédagogique : jamais de mot négatif ("faux", "mauvaise réponse"...).
export const GOOD_MESSAGES = ['Harika! 🎉', 'Çok güzel! 🌟', 'Süper! 👏', 'Bravo !', 'Aferin! ✨']
export const RETRY_MESSAGES = [
  'Presque ! Encore une fois 💛',
  'Çok güzel! Bir daha deneyelim. 😊',
  "On y est presque, essaie encore !",
  'Super effort ! On réessaie ? 🌈',
]

export function randomGood() {
  return GOOD_MESSAGES[Math.floor(Math.random() * GOOD_MESSAGES.length)]
}
export function randomRetry() {
  return RETRY_MESSAGES[Math.floor(Math.random() * RETRY_MESSAGES.length)]
}

export default function PositiveFeedback({ ok }) {
  return (
    <p className={`text-center font-display text-lg font-bold ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
      {ok ? randomGood() : randomRetry()}
    </p>
  )
}
