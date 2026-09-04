import { useCallback, useEffect, useState } from 'react'

// Synthèse vocale (Web Speech API) avec repli propre si indisponible.
export function useSpeech() {
  const [supported, setSupported] = useState(false)
  const [voices, setVoices] = useState([])
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false)
      return
    }
    setSupported(true)
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices())
    loadVoices()
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices)
  }, [])

  const speak = useCallback(
    (text, lang = 'tr-TR', rate = 1) => {
      if (!supported || !text) return false
      try {
        window.speechSynthesis.cancel()
        const utter = new SpeechSynthesisUtterance(text)
        utter.lang = lang
        // Débit fixe (vitesse normale) ; seule la hauteur de voix varie
        // légèrement d'une phrase à l'autre pour éviter un rendu trop
        // mécanique, sans jamais toucher à la vitesse de lecture.
        utter.rate = rate
        utter.pitch = 1.08 + (Math.random() * 0.1 - 0.05)
        const voice = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith(lang.slice(0, 2)))
        if (voice) utter.voice = voice
        utter.onstart = () => setSpeaking(true)
        utter.onend = () => setSpeaking(false)
        utter.onerror = () => setSpeaking(false)
        window.speechSynthesis.speak(utter)
        return true
      } catch {
        return false
      }
    },
    [supported, voices],
  )

  const speakTr = useCallback((text) => speak(text, 'tr-TR'), [speak])
  const speakFr = useCallback((text) => speak(text, 'fr-FR'), [speak])

  return { supported, speak, speakTr, speakFr, speaking }
}
