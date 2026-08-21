import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadState, saveState, todayISO } from '../utils/storage'
import { reviewWord } from '../utils/srs'
import { checkNewBadges, BADGES } from '../data/badges'

const ProfileContext = createContext(null)

function defaultProgress() {
  return {
    currentDay: 1,
    completedDays: {},
    streak: { count: 0, lastDate: null },
    starsTotal: 0,
    badges: [],
    srs: {},
    conversationsDone: [],
    storiesRead: [],
    songsHeard: [],
    activityLog: [],
    minutesSpent: 0,
  }
}

function defaultState() {
  return { profile: null, progress: defaultProgress() }
}

export function ProfileProvider({ children }) {
  const [state, setState] = useState(() => {
    const loaded = loadState()
    if (!loaded) return defaultState()
    return { profile: loaded.profile || null, progress: { ...defaultProgress(), ...loaded.progress } }
  })
  const [badgePopups, setBadgePopups] = useState([])

  useEffect(() => {
    saveState(state)
  }, [state])

  function updateProgress(mutator) {
    setState((prev) => {
      const nextProgress = mutator({ ...prev.progress })
      const newBadgeIds = checkNewBadges(nextProgress)
      if (newBadgeIds.length) {
        nextProgress.badges = [...(nextProgress.badges || []), ...newBadgeIds]
        setBadgePopups((q) => [...q, ...newBadgeIds.map((id) => BADGES.find((b) => b.id === id))])
      }
      return { ...prev, progress: nextProgress }
    })
  }

  const actions = useMemo(
    () => ({
      createProfile({ name, age, avatar }) {
        setState((prev) => ({ ...prev, profile: { name, age, avatar, createdAt: todayISO() } }))
      },
      updateProfile(partial) {
        setState((prev) => ({ ...prev, profile: { ...prev.profile, ...partial } }))
      },
      resetAll() {
        setState(defaultState())
      },
      logActivity(label) {
        updateProgress((p) => ({
          ...p,
          activityLog: [{ date: new Date().toISOString(), label }, ...(p.activityLog || [])].slice(0, 60),
        }))
      },
      recordWordResult(wordId, correct) {
        updateProgress((p) => ({
          ...p,
          srs: { ...p.srs, [wordId]: reviewWord(p.srs[wordId], correct) },
        }))
      },
      addStars(n) {
        updateProgress((p) => ({ ...p, starsTotal: (p.starsTotal || 0) + n }))
      },
      addMinutes(n) {
        updateProgress((p) => ({ ...p, minutesSpent: (p.minutesSpent || 0) + n }))
      },
      completeDay(day, stars) {
        updateProgress((p) => {
          const today = todayISO()
          let streak = p.streak || { count: 0, lastDate: null }
          if (streak.lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
            const count = streak.lastDate === yesterday ? streak.count + 1 : 1
            streak = { count, lastDate: today }
          }
          return {
            ...p,
            starsTotal: (p.starsTotal || 0) + stars,
            completedDays: { ...p.completedDays, [day]: { stars, date: today } },
            currentDay: Math.max(p.currentDay, Math.min(90, day + 1)),
            streak,
          }
        })
      },
      markConversationDone(id) {
        updateProgress((p) => ({
          ...p,
          conversationsDone: p.conversationsDone.includes(id) ? p.conversationsDone : [...p.conversationsDone, id],
        }))
      },
      markStoryRead(id) {
        updateProgress((p) => ({
          ...p,
          storiesRead: p.storiesRead.includes(id) ? p.storiesRead : [...p.storiesRead, id],
        }))
      },
      markSongHeard(id) {
        updateProgress((p) => ({
          ...p,
          songsHeard: (p.songsHeard || []).includes(id) ? p.songsHeard : [...(p.songsHeard || []), id],
        }))
      },
      dismissBadgePopup() {
        setBadgePopups((q) => q.slice(1))
      },
    }),
    [],
  )

  const value = { ...state, ...actions, badgePopups }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
