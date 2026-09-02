import { useState } from 'react'
import TopBar from '../components/TopBar'
import { useProfile } from '../context/ProfileContext'
import { FRAMES, ACCESSORIES, TITLES } from '../data/avatarShop'
import { COMPANIONS, COMPANION_ACCESSORIES } from '../data/companions'

const TABS = [
  { id: 'avatar', label: 'Mon avatar', icon: '🧑‍🚀' },
  { id: 'companion', label: 'Mon compagnon', icon: '🐶' },
]

export default function Boutique() {
  const {
    profile,
    progress,
    buyShopItem,
    selectShopItem,
    setCompanion,
    buyCompanionAccessory,
    selectCompanionAccessory,
  } = useProfile()
  const [tab, setTab] = useState('avatar')
  const [nameDraft, setNameDraft] = useState(progress.companion?.name || '')
  const coins = progress.coins || 0

  const frame = FRAMES.find((f) => f.id === progress.avatar?.frame) || FRAMES[0]
  const accessory = ACCESSORIES.find((a) => a.id === progress.avatar?.accessory) || ACCESSORIES[0]
  const companionKind = COMPANIONS.find((c) => c.id === progress.companion?.kind)
  const companionAcc = COMPANION_ACCESSORIES.find((a) => a.id === progress.companion?.accessory) || COMPANION_ACCESSORIES[0]

  return (
    <div className="min-h-full bg-gradient-to-b from-violet-50 to-white pb-6">
      <TopBar title="Boutique" back="/accueil" />

      <div className="flex flex-col items-center gap-2 px-5 pt-5">
        <div
          className={`relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br text-6xl shadow-xl ${frame.className}`}
        >
          <span>{profile?.avatar}</span>
          {accessory.emoji && <span className="absolute -right-1 -top-1 text-3xl drop-shadow">{accessory.emoji}</span>}
        </div>
        <p className="font-display text-lg font-extrabold text-slate-700">{profile?.name}</p>
        <p className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-600">
          {TITLES.find((t) => t.id === progress.avatar?.title)?.label || 'Débutant(e)'}
        </p>
        <p className="text-sm font-bold text-amber-600">🪙 {coins} Türkçe Coin</p>
      </div>

      <div className="mt-4 flex gap-2 px-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-2xl py-2.5 text-sm font-bold shadow transition-transform active:scale-95 ${
              tab === t.id ? 'bg-violet-600 text-white' : 'bg-white text-slate-500'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'avatar' && (
        <div className="flex flex-col gap-6 px-5 pt-5">
          <ShopSection
            title="🖼️ Cadres"
            items={FRAMES}
            owned={progress.avatarOwned?.frame || ['sky']}
            selectedId={progress.avatar?.frame}
            coins={coins}
            onBuy={(id, cost) => buyShopItem('frame', id, cost)}
            onSelect={(id) => selectShopItem('frame', id)}
            renderPreview={(item) => (
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${item.className}`} />
            )}
          />
          <ShopSection
            title="✨ Accessoires"
            items={ACCESSORIES}
            owned={progress.avatarOwned?.accessory || ['none']}
            selectedId={progress.avatar?.accessory}
            coins={coins}
            onBuy={(id, cost) => buyShopItem('accessory', id, cost)}
            onSelect={(id) => selectShopItem('accessory', id)}
            renderPreview={(item) => <span className="text-2xl">{item.emoji || '🚫'}</span>}
          />
          <ShopSection
            title="🏅 Titres"
            items={TITLES}
            owned={progress.avatarOwned?.title || ['debutant']}
            selectedId={progress.avatar?.title}
            coins={coins}
            onBuy={(id, cost) => buyShopItem('title', id, cost)}
            onSelect={(id) => selectShopItem('title', id)}
            renderPreview={(item) => <span className="text-xs font-bold text-violet-600">{item.label}</span>}
          />
        </div>
      )}

      {tab === 'companion' && (
        <div className="flex flex-col gap-6 px-5 pt-5">
          {!companionKind ? (
            <p className="text-center text-sm font-semibold text-slate-500">Choisis ton compagnon pour l'aventure !</p>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-white p-5 shadow">
              <div className="text-6xl">{companionKind.emoji}</div>
              {companionAcc.emoji && <div className="-mt-8 ml-16 text-2xl">{companionAcc.emoji}</div>}
              <p className="font-display text-lg font-extrabold text-slate-700">{progress.companion?.name || companionKind.defaultName}</p>
            </div>
          )}

          <div>
            <h3 className="mb-2 font-display font-extrabold text-slate-700">Choisis ton compagnon</h3>
            <div className="grid grid-cols-3 gap-3">
              {COMPANIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCompanion(c.id, nameDraft || c.defaultName)
                  }}
                  className={`flex flex-col items-center gap-1 rounded-2xl p-3 shadow transition-transform active:scale-95 ${
                    progress.companion?.kind === c.id ? 'bg-violet-500 text-white ring-4 ring-violet-200' : 'bg-white text-slate-600'
                  }`}
                >
                  <span className="text-3xl">{c.emoji}</span>
                  <span className="text-xs font-bold">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-display font-extrabold text-slate-700">Donne-lui un prénom</h3>
            <div className="flex gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder={companionKind?.defaultName || 'Prénom'}
                className="flex-1 rounded-2xl border-2 border-violet-200 px-4 py-2.5 font-bold outline-none focus:border-violet-500"
              />
              <button
                onClick={() => companionKind && setCompanion(companionKind.id, nameDraft || companionKind.defaultName)}
                disabled={!companionKind}
                className="rounded-2xl bg-violet-600 px-4 py-2.5 font-bold text-white shadow disabled:opacity-40"
              >
                OK
              </button>
            </div>
          </div>

          <ShopSection
            title="🎁 Accessoires du compagnon"
            items={COMPANION_ACCESSORIES}
            owned={progress.companion?.ownedAccessories || ['none']}
            selectedId={progress.companion?.accessory}
            coins={coins}
            disabled={!companionKind}
            onBuy={(id, cost) => buyCompanionAccessory(id, cost)}
            onSelect={(id) => selectCompanionAccessory(id)}
            renderPreview={(item) => <span className="text-2xl">{item.emoji || '🚫'}</span>}
          />
        </div>
      )}
    </div>
  )
}

function ShopSection({ title, items, owned, selectedId, coins, onBuy, onSelect, renderPreview, disabled }) {
  return (
    <div>
      <h3 className="mb-2 font-display font-extrabold text-slate-700">{title}</h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const isOwned = owned.includes(item.id)
          const isSelected = selectedId === item.id
          const canAfford = coins >= item.cost
          return (
            <button
              key={item.id}
              disabled={disabled}
              onClick={() => (isOwned ? onSelect(item.id) : canAfford && onBuy(item.id, item.cost))}
              className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 shadow transition-transform active:scale-95 disabled:opacity-40 ${
                isSelected ? 'bg-violet-500 ring-4 ring-violet-200' : 'bg-white'
              }`}
            >
              <span className="grid h-10 place-items-center">{renderPreview(item)}</span>
              <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>{item.label}</span>
              {isOwned ? (
                <span className={`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-emerald-500'}`}>
                  {isSelected ? 'Choisi ✓' : 'Possédé'}
                </span>
              ) : (
                <span className={`text-[10px] font-extrabold ${canAfford ? 'text-amber-600' : 'text-slate-300'}`}>🪙 {item.cost}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
