import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sky-50 p-6 text-center">
      <span className="text-6xl">🐣</span>
      <p className="text-lg font-bold text-slate-500">Oups, cette page n'existe pas !</p>
      <Link to="/accueil" className="rounded-full bg-violet-600 px-6 py-2.5 font-bold text-white shadow">
        Retour à l'accueil
      </Link>
    </div>
  )
}
