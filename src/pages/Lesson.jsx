import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import Teacher from '../components/Teacher'
import WordCard from '../components/WordCard'
import Confetti from '../components/Confetti'
import ConversationPlayer from '../components/ConversationPlayer'
import { useProfile } from '../context/ProfileContext'
import { getDay } from '../data/curriculum'
import { getWords, randomWords } from '../data/vocabulary'
import { byId as phraseById, fillPhrase } from '../data/phrases'
import { byId as convById, fillConversation } from '../data/conversations'
import { byId as storyById } from '../data/stories'
import { byId as songById } from '../data/songs'
import { getWordsToReview } from '../utils/srs'
import { instr } from '../utils/immersion'
import { useSpeech } from '../hooks/useSpeech'
import FindImage from '../games/FindImage'
import ListenChoose from '../games/ListenChoose'
import GuessGame from '../games/GuessGame'
import MemoryGame from '../games/MemoryGame'
import RepeatGame from '../games/RepeatGame'
import BuildSentence from '../games/BuildSentence'
import CatchWord from '../games/CatchWord'

const GAME_CYCLE = [FindImage, ListenChoose, GuessGame, MemoryGame, CatchWord]

export default function Lesson() {
  const { day: dayParam } = useParams()
  const day = Number(dayParam)
  const nav = useNavigate()
  const {
    profile,
    progress,
    recordWordResult,
    completeDay,
    markConversationDone,
    markStoryRead,
    markSongHeard,
    logActivity,
    addCoins,
    bumpDailyGame,
    recordPronunciation,
  } = useProfile()
  const dayConfig = getDay(day)
  const { speakTr } = useSpeech()

  const [stepIndex, setStepIndex] = useState(0)
  const [starsEarned, setStarsEarned] = useState(0)
  const [discoverIndex, setDiscoverIndex] = useState(0)
  const [storySentence, setStorySentence] = useState(0)
  const [songLine, setSongLine] = useState(0)
  const [questionAnswered, setQuestionAnswered] = useState(false)

  const words = useMemo(() => (dayConfig ? getWords(dayConfig.wordIds) : []), [dayConfig])
  const gameWords = useMemo(() => {
    if (words.length >= 4) return words
    return [...words, ...randomWords(4 - words.length, words.map((w) => w.id))]
  }, [words])

  const reviewIds = useMemo(() => {
    const seenIds = Object.keys(progress.srs || {}).filter((id) => !words.some((w) => w.id === id))
    return getWordsToReview(progress.srs, seenIds, 6)
  }, [progress.srs, words])
  const reviewWords = getWords(reviewIds)

  const story = dayConfig?.storyId ? storyById[dayConfig.storyId] : null
  const song = dayConfig?.songId ? songById[dayConfig.songId] : null
  const conversation = dayConfig?.conversationId ? fillConversation(convById[dayConfig.conversationId], profile?.name) : null
  const phraseTemplate = dayConfig?.phraseIds?.[0] ? phraseById[dayConfig.phraseIds[0]] : null
  const phrase = phraseTemplate ? fillPhrase(phraseTemplate, { name: profile?.name, word: words[0] }) : null

  const steps = useMemo(() => {
    if (!dayConfig) return []
    if (story) return ['story', 'question', 'reward']
    if (song) return ['song', 'reward']
    const s = []
    if (words.length) {
      s.push('decouverte', 'repetition', 'jeu')
    }
    if (conversation) s.push('conversation')
    else if (phrase) s.push('phrase')
    if (reviewWords.length) s.push('revision')
    if (s.length === 0) s.push('revision')
    s.push('reward')
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  if (!dayConfig) {
    return (
      <div className="flex min-h-full flex-col">
        <TopBar title="Leçon introuvable" back="/apprendre" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="text-5xl">🤔</span>
          <p className="text-slate-500">Cette leçon n'existe pas.</p>
          <Link to="/apprendre" className="rounded-full bg-violet-600 px-5 py-2 font-bold text-white">
            Retour au parcours
          </Link>
        </div>
      </div>
    )
  }

  const level = dayConfig.immersion
  const step = steps[stepIndex]

  function exitLesson() {
    nav('/apprendre')
  }

  function advance(bonus = 1) {
    setStarsEarned((s) => s + bonus)
    setStepIndex((i) => Math.min(steps.length - 1, i + 1))
  }

  function finishLesson() {
    const stars = Math.max(1, starsEarned)
    completeDay(day, stars)
    if (dayConfig.conversationId && conversation) markConversationDone(dayConfig.conversationId)
    if (story) markStoryRead(story.id)
    if (song) markSongHeard(song.id)
    logActivity(`Leçon terminée : Jour ${day} · ${dayConfig.title}`)
    nav(dayConfig.isFinal ? '/progres' : '/apprendre')
  }

  return (
    <div className="flex min-h-full flex-col pb-4">
      <TopBar title={`${dayConfig.icon} Jour ${day} · ${dayConfig.title}`} back="/apprendre" />
      <div className="px-4 pt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4">
        {step === 'decouverte' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <Teacher mood="excited">
              <p className="font-bold text-slate-600">{instr(level, 'Yeni kelime! 👀', 'Découvrons un nouveau mot ! 👀')}</p>
            </Teacher>
            <div className="w-full max-w-xs">
              <WordCard word={words[discoverIndex]} size="lg" />
            </div>
            <p className="text-sm font-bold text-slate-400">
              {discoverIndex + 1} / {words.length}
            </p>
            <button
              onClick={() => {
                recordWordResult(words[discoverIndex].id, true)
                if (discoverIndex + 1 >= words.length) {
                  setDiscoverIndex(0)
                  advance()
                } else setDiscoverIndex((i) => i + 1)
              }}
              className="rounded-full bg-violet-600 px-8 py-3 font-display font-bold text-white shadow-lg active:scale-95"
            >
              {discoverIndex + 1 < words.length ? 'Mot suivant ➡️' : "C'est parti ! ➡️"}
            </button>
          </div>
        )}

        {step === 'repetition' && (
          <RepeatGame
            words={words}
            onExit={exitLesson}
            onPronunciation={recordPronunciation}
            onComplete={() => {
              bumpDailyGame()
              addCoins(4)
              advance(1)
            }}
          />
        )}

        {step === 'jeu' && (() => {
          const Game = GAME_CYCLE[(day - 1) % GAME_CYCLE.length]
          return (
            <Game
              words={gameWords}
              onExit={exitLesson}
              onComplete={() => {
                words.forEach((w) => recordWordResult(w.id, true))
                bumpDailyGame()
                addCoins(6)
                advance(1)
              }}
            />
          )
        })()}

        {step === 'conversation' && conversation && (
          <ConversationPlayer
            conversation={conversation}
            onFinish={() => {
              addCoins(6)
              advance(2)
            }}
          />
        )}

        {step === 'phrase' && phrase && (
          <BuildSentence phrases={[phrase]} onExit={exitLesson} onComplete={() => advance(1)} />
        )}

        {step === 'story' && story && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span className="text-6xl">{story.cover}</span>
            <h2 className="font-display text-xl font-extrabold text-violet-700">{story.title}</h2>
            <div className="min-h-24 rounded-3xl bg-white px-5 py-4 shadow">
              <p className="font-display text-lg font-bold text-slate-700">{story.sentences[storySentence].tr}</p>
              <p className="mt-1 text-sm text-slate-400">{story.sentences[storySentence].fr}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => speakTr(story.sentences[storySentence].tr)} className="rounded-full bg-white px-4 py-2 text-xl shadow active:scale-90">
                🔊
              </button>
              <button
                onClick={() => {
                  if (storySentence + 1 >= story.sentences.length) advance(1)
                  else setStorySentence((i) => i + 1)
                }}
                className="rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white shadow-md active:scale-95"
              >
                {storySentence + 1 < story.sentences.length ? 'Suite ➡️' : 'Question ➡️'}
              </button>
            </div>
          </div>
        )}

        {step === 'question' && story && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <Teacher mood="thinking">
              <p className="font-display text-lg font-bold text-slate-700">{story.question.tr}</p>
              <p className="text-sm text-slate-400">{story.question.fr}</p>
            </Teacher>
            {!questionAnswered ? (
              <div className="flex gap-3">
                {story.question.choices.map((c) => (
                  <button
                    key={c.tr}
                    onClick={() => {
                      setQuestionAnswered(true)
                      speakTr(c.tr)
                      setTimeout(() => advance(1), 900)
                    }}
                    className="rounded-2xl bg-white px-6 py-3 font-display text-lg font-bold text-violet-700 shadow active:scale-95"
                  >
                    {c.tr}
                  </button>
                ))}
              </div>
            ) : (
              <p className="font-display font-bold text-emerald-600">Harika! 🎉</p>
            )}
          </div>
        )}

        {step === 'song' && song && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <span className="text-6xl">{song.icon}</span>
            <h2 className="font-display text-xl font-extrabold text-violet-700">{song.title}</h2>
            <div className="min-h-20 rounded-3xl bg-white px-5 py-4 shadow">
              <p className="font-display text-lg font-bold text-slate-700">🎵 {song.lines[songLine].tr}</p>
              <p className="mt-1 text-sm text-slate-400">{song.lines[songLine].fr}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => speakTr(song.lines[songLine].tr)} className="rounded-full bg-white px-4 py-2 text-xl shadow active:scale-90">
                🔊
              </button>
              <button
                onClick={() => {
                  if (songLine + 1 >= song.lines.length) advance(1)
                  else setSongLine((i) => i + 1)
                }}
                className="rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white shadow-md active:scale-95"
              >
                {songLine + 1 < song.lines.length ? 'Suite 🎶' : "J'ai chanté ! ⭐"}
              </button>
            </div>
          </div>
        )}

        {step === 'revision' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            <Teacher mood="encouraging">
              <p className="font-bold text-slate-600">{instr(level, 'Hatırlıyor musun? 🔄', 'Tu te souviens de ces mots ? 🔄')}</p>
            </Teacher>
            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              {(reviewWords.length ? reviewWords : words).map((w) => (
                <WordCard key={w.id} word={w} size="sm" onSpeak={() => recordWordResult(w.id, true)} />
              ))}
            </div>
            <button onClick={() => advance(1)} className="rounded-full bg-violet-600 px-8 py-3 font-display font-bold text-white shadow-lg active:scale-95">
              Continuer ➡️
            </button>
          </div>
        )}

        {step === 'reward' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Confetti active />
            <span className="text-7xl">🎉</span>
            <h2 className="font-display text-2xl font-extrabold text-violet-700">
              {dayConfig.badgeMessage || `Bravo ! Leçon du jour ${day} terminée !`}
            </h2>
            <div className="flex gap-1 text-4xl">
              {Array.from({ length: Math.max(1, starsEarned) }).map((_, i) => (
                <span key={i} className="animate-pop-in" style={{ animationDelay: `${i * 0.12}s` }}>
                  ⭐
                </span>
              ))}
            </div>
            <button onClick={finishLesson} className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-8 py-3 font-display font-bold text-white shadow-lg active:scale-95">
              Terminer 🏁
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
