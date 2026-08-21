import { useState } from 'react'
import { useSpeech } from '../hooks/useSpeech'

export default function WordCard({ word, showFrench = true, size = 'md', onSpeak }) {
  const { speak, supported } = useSpeech()
  const [pressed, setPressed] = useState(false)

  function handleSpeak() {
    speak(word.tr, 'tr-TR')
    onSpeak?.(word)
    setPressed(true)
    setTimeout(() => setPressed(false), 400)
  }

  const sizes = {
    sm: { box: 'p-3', emoji: 'text-4xl', tr: 'text-base' },
    md: { box: 'p-5', emoji: 'text-6xl', tr: 'text-2xl' },
    lg: { box: 'p-7', emoji: 'text-8xl', tr: 'text-4xl' },
  }[size]

  return (
    <button
      onClick={handleSpeak}
      className={`flex w-full flex-col items-center gap-2 rounded-3xl border-4 border-white bg-gradient-to-b from-white to-violet-50 shadow-lg transition-transform active:scale-95 ${sizes.box} ${
        pressed ? 'ring-4 ring-amber-300' : ''
      }`}
    >
      <span className={sizes.emoji}>{word.emoji}</span>
      <span className={`font-display font-extrabold text-violet-700 ${sizes.tr}`}>{word.tr}</span>
      {showFrench && <span className="text-sm font-semibold text-slate-500">{word.fr}</span>}
      <span className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-violet-500 text-white shadow">
        {supported ? '🔊' : '🔈'}
      </span>
    </button>
  )
}
