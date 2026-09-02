import { useCallback, useEffect, useRef, useState } from 'react'

// Erreurs qui signifient que le micro ne sera JAMAIS utilisable dans cette
// session (permission refusée, pas de matériel). Tout le reste (silence,
// coupure réseau, arrêt manuel...) est transitoire : l'enfant doit pouvoir
// réessayer immédiatement sans perdre l'accès au micro pour les mots suivants.
const PERMANENT_ERRORS = ['not-allowed', 'service-not-allowed', 'audio-capture']

// Reconnaissance vocale (Web Speech API) : utilisée UNIQUEMENT pour aider
// l'enfant à s'entraîner à prononcer, jamais pour donner une note sévère.
// Si l'API n'est pas disponible (navigateur, permissions...), `supported`
// vaut false et l'interface doit proposer un bouton "j'ai essayé !" à la place.
export function useSpeechRecognition(lang = 'tr-TR') {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const [permanentlyUnavailable, setPermanentlyUnavailable] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) {
      setSupported(false)
      return
    }
    setSupported(true)
    const recognition = new SR()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || ''
      setTranscript(text)
    }
    recognition.onerror = (e) => {
      setError(e.error)
      if (PERMANENT_ERRORS.includes(e.error)) setPermanentlyUnavailable(true)
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    return () => {
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    }
  }, [lang])

  const start = useCallback(() => {
    if (!recognitionRef.current) return false
    try {
      setTranscript('')
      setError(null)
      recognitionRef.current.start()
      setListening(true)
      return true
    } catch {
      return false
    }
  }, [])

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // ignore
    }
    setListening(false)
  }, [])

  return { supported, listening, transcript, error, permanentlyUnavailable, start, stop }
}
