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
  const settledRef = useRef(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
    if (!SR) {
      setSupported(false)
      return
    }
    setSupported(true)
    const recognition = new SR()
    recognition.lang = lang
    // Les résultats intermédiaires arrivent en quelques centaines de ms,
    // bien avant la détection de silence du navigateur (souvent 1,5-2s).
    // On "fige" nous-mêmes la réponse dès qu'elle ne bouge plus quelques
    // centaines de ms, au lieu d'attendre le résultat final du navigateur :
    // la validation devient quasi instantanée pour l'enfant.
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    function finalize(text) {
      if (settledRef.current) return
      settledRef.current = true
      clearTimeout(debounceRef.current)
      setTranscript(text)
      try {
        recognition.stop()
      } catch {
        // ignore
      }
    }

    recognition.onresult = (e) => {
      const last = e.results?.[e.results.length - 1]
      const text = last?.[0]?.transcript || ''
      if (!text) return
      if (last.isFinal) {
        finalize(text)
      } else {
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => finalize(text), 350)
      }
    }
    recognition.onerror = (e) => {
      setError(e.error)
      if (PERMANENT_ERRORS.includes(e.error)) setPermanentlyUnavailable(true)
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    return () => {
      clearTimeout(debounceRef.current)
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
      clearTimeout(debounceRef.current)
      settledRef.current = false
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
