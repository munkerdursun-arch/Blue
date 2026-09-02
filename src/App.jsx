import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useProfile } from './context/ProfileContext'
import NavBar from './components/NavBar'
import BadgePopup from './components/BadgePopup'
import ProfileSetup from './pages/ProfileSetup'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Lesson from './pages/Lesson'
import Play from './pages/Play'
import Talk from './pages/Talk'
import ProgressPage from './pages/ProgressPage'
import Parent from './pages/Parent'
import Boutique from './pages/Boutique'
import NotFound from './pages/NotFound'

function RequireProfile({ children }) {
  const { profile } = useProfile()
  if (!profile) return <Navigate to="/bienvenue" replace />
  return children
}

export default function App() {
  const { profile } = useProfile()
  const location = useLocation()
  const hideNav = location.pathname === '/bienvenue' || /^\/apprendre\/\d+/.test(location.pathname)

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-white font-sans text-slate-800">
      <div className={hideNav ? '' : 'pb-20'}>
        <Routes>
          <Route path="/" element={<Navigate to={profile ? '/accueil' : '/bienvenue'} replace />} />
          <Route path="/bienvenue" element={<ProfileSetup />} />
          <Route path="/accueil" element={<RequireProfile><Home /></RequireProfile>} />
          <Route path="/apprendre" element={<RequireProfile><Learn /></RequireProfile>} />
          <Route path="/apprendre/:day" element={<RequireProfile><Lesson /></RequireProfile>} />
          <Route path="/jouer" element={<RequireProfile><Play /></RequireProfile>} />
          <Route path="/parler" element={<RequireProfile><Talk /></RequireProfile>} />
          <Route path="/progres" element={<RequireProfile><ProgressPage /></RequireProfile>} />
          <Route path="/parent" element={<RequireProfile><Parent /></RequireProfile>} />
          <Route path="/boutique" element={<RequireProfile><Boutique /></RequireProfile>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {!hideNav && profile && <NavBar />}
      <BadgePopup />
    </div>
  )
}
