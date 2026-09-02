import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadState, saveState, todayISO } from '../utils/storage'
import { reviewWord } from '../utils/srs'
import { checkNewBadges, BADGES } from '../data/badges'
import { normalizeDaily, missionStatus, chestReward } from '../utils/missions'

const ProfileContext = createContext(null)

function defaultProgress() {
  return {
    currentDay: 1,
    completedDays: {},
    streak: { count: 0, lastDate: null },
    starsTotal: 0,
    coins: 0,
    badges: [],
    srs: {},
    conversationsDone: [],
    storiesRead: [],
    songsHeard: [],
    activityLog: [],
    minutesSpent: 0,
    avatar: { frame: 'sky', accessory: 'none', title: 'debutant' },
    avatarOwned: { frame: ['sky'], accessory: ['none'], title: ['debutant'] },
    companion: { kind: null, name: '', accessory: 'none', ownedAccessories: ['none'] },
    dailyMissions: null,
    chestsOpened: 0,
    missionsCompletedTotal: 0,
    pronunciation: { close: 0, total: 0 },
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
        updateProgress((p) => {
          const dm = normalizeDaily(p.dailyMissions)
          return {
            ...p,
            srs: { ...p.srs, [wordId]: reviewWord(p.srs[wordId], correct) },
            dailyMissions: dm.wordIds.includes(wordId) ? dm : { ...dm, wordIds: [...dm.wordIds, wordId] },
          }
        })
      },
      addStars(n) {
        updateProgress((p) => ({ ...p, starsTotal: (p.starsTotal || 0) + n }))
      },
      addCoins(n) {
        updateProgress((p) => ({ ...p, coins: Math.max(0, (p.coins || 0) + n) }))
      },
      recordPronunciation(close) {
        updateProgress((p) => {
          const cur = p.pronunciation || { close: 0, total: 0 }
          return { ...p, pronunciation: { close: cur.close + (close ? 1 : 0), total: cur.total + 1 } }
        })
      },
      addMinutes(n) {
        updateProgress((p) => ({ ...p, minutesSpent: (p.minutesSpent || 0) + n }))
      },
      bumpDailyGame() {
        updateProgress((p) => {
          const dm = normalizeDaily(p.dailyMissions)
          return { ...p, dailyMissions: { ...dm, games: dm.games + 1 } }
        })
      },
      markDailyTalk() {
        updateProgress((p) => ({ ...p, dailyMissions: { ...normalizeDaily(p.dailyMissions), talked: true } }))
      },
      openDailyChest() {
        updateProgress((p) => {
          const dm = normalizeDaily(p.dailyMissions)
          const status = missionStatus(dm)
          if (!status.allDone || status.chestOpened) return p
          const reward = chestReward(p.streak?.count)
          return {
            ...p,
            coins: (p.coins || 0) + reward.coins,
            starsTotal: (p.starsTotal || 0) + reward.stars,
            dailyMissions: { ...dm, chestOpened: true },
            chestsOpened: (p.chestsOpened || 0) + 1,
            missionsCompletedTotal: (p.missionsCompletedTotal || 0) + 1,
          }
        })
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
            coins: (p.coins || 0) + 10,
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
          dailyMissions: { ...normalizeDaily(p.dailyMissions), talked: true },
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
      buyShopItem(category, id, cost) {
        updateProgress((p) => {
          const owned = p.avatarOwned?.[category] || []
          if (owned.includes(id) || (p.coins || 0) < cost) return p
          return {
            ...p,
            coins: p.coins - cost,
            avatarOwned: { ...p.avatarOwned, [category]: [...owned, id] },
            avatar: { ...p.avatar, [category]: id },
          }
        })
      },
      selectShopItem(category, id) {
        updateProgress((p) => {
          const owned = p.avatarOwned?.[category] || []
          if (!owned.includes(id)) return p
          return { ...p, avatar: { ...p.avatar, [category]: id } }
        })
      },
      setCompanion(kind, name) {
        updateProgress((p) => ({ ...p, companion: { ...p.companion, kind, name } }))
      },
      buyCompanionAccessory(id, cost) {
        updateProgress((p) => {
          const owned = p.companion?.ownedAccessories || ['none']
          if (owned.includes(id) || (p.coins || 0) < cost) return p
          return {
            ...p,
            coins: p.coins - cost,
            companion: { ...p.companion, accessory: id, ownedAccessories: [...owned, id] },
          }
        })
      },
      selectCompanionAccessory(id) {
        updateProgress((p) => {
          const owned = p.companion?.ownedAccessories || ['none']
          if (!owned.includes(id)) return p
          return { ...p, companion: { ...p.companion, accessory: id } }
        })
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
