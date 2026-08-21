import { useState } from 'react'
import TopBar from '../components/TopBar'
import Confetti from '../components/Confetti'
import ConversationPlayer from '../components/ConversationPlayer'
import { useProfile } from '../context/ProfileContext'
import { CONVERSATIONS, fillConversation } from '../data/conversations'

export default function Talk() {
  const { profile, progress, markConversationDone, addStars, logActivity } = useProfile()
  const [activeId, setActiveId] = useState(null)
  const [done, setDone] = useState(false)

  const active = activeId ? fillConversation(CONVERSATIONS.find((c) => c.id === activeId), profile?.name) : null

  function finish() {
    markConversationDone(activeId)
    addStars(2)
    logActivity(`Conversation terminée : ${active?.title}`)
    setDone(true)
  }

  if (active) {
    return (
      <div className="flex min-h-full flex-col bg-gradient-to-b from-fuchsia-50 to-white pb-6">
        <TopBar title={`${active.icon} ${active.title}`} />
        <button
          onClick={() => {
            setActiveId(null)
            setDone(false)
          }}
          className="mx-4 mt-1 self-start text-xs font-bold text-violet-500 underline"
        >
          ⬅️ Retour aux conversations
        </button>
        <div className="flex flex-1 flex-col px-4 py-4">
          {done ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Confetti active />
              <span className="text-6xl">🎉</span>
              <h2 className="font-display text-xl font-extrabold text-violet-700">Harika! Bravo !</h2>
              <p className="text-sm text-slate-500">Tu as terminé cette conversation.</p>
              <button
                onClick={() => {
                  setActiveId(null)
                  setDone(false)
                }}
                className="mt-2 rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white shadow-md active:scale-95"
              >
                Retour
              </button>
            </div>
          ) : (
            <ConversationPlayer conversation={active} onFinish={finish} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-fuchsia-50 to-white pb-6">
      <TopBar title="Parler en turc" back="/accueil" />
      <p className="px-5 pt-3 text-sm font-semibold text-slate-500">Discute avec ton professeur turc ! 👩‍🏫</p>
      <div className="flex flex-col gap-3 px-5 pt-4">
        {CONVERSATIONS.map((c) => {
          const isDone = progress.conversationsDone.includes(c.id)
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="flex items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-md transition-transform active:scale-95"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-fuchsia-100 text-3xl">{c.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-extrabold text-slate-700">{c.title}</p>
                <p className="text-xs font-semibold text-slate-400">{c.mission ? 'Mission spéciale 🎯' : `Niveau ${c.level}`}</p>
              </div>
              {isDone && <span className="text-xl">✅</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
