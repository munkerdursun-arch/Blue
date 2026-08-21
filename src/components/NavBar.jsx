import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/accueil', label: 'Accueil', icon: '🏠' },
  { to: '/jouer', label: 'Jouer', icon: '🎮' },
  { to: '/apprendre', label: 'Apprendre', icon: '📚' },
  { to: '/parler', label: 'Parler', icon: '🗣️' },
  { to: '/progres', label: 'Progrès', icon: '⭐' },
]

export default function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-4 border-white bg-white/95 backdrop-blur shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-bottom">
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-1">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-xs font-bold transition-transform active:scale-90 ${
                  isActive ? 'text-violet-600' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-2xl text-xl transition-colors ${
                      isActive ? 'bg-violet-100' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
