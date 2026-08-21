export default function GameShell({ title, icon, round, total, onExit, children }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <button
          onClick={onExit}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow active:scale-90"
          aria-label="Quitter le jeu"
        >
          ✖️
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-extrabold text-slate-700">
            {icon} {title}
          </p>
          {total ? (
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-400 transition-all duration-500"
                style={{ width: `${(round / total) * 100}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-6">{children}</div>
    </div>
  )
}
