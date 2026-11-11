import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Code2, Github, Home, Menu, Moon, Plus, Sun, Terminal, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { shortId } from '../lib/utils'

function Brand() {
  return <Link to="/" className="brand" aria-label="DevConnect home">
    <span className="brand-mark"><Code2 size={23} strokeWidth={2.8} /></span>
    <span>dev<span className="brand-accent">connect</span><span className="brand-dot">.</span></span>
  </Link>
}

export function Layout({ children }) {
  const { user, demo } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('devconnect_theme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('devconnect_theme', theme)
  }, [theme])
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return <div className="app-shell">
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className={`header-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Home size={17} /> Feed</NavLink>
          <NavLink to="/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Plus size={17} /> Create post</NavLink>
        </nav>
        <div className="header-actions">
          <button type="button" className="icon-button theme-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Toggle color scheme">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <div className="identity-chip" title={user?.id || ''}><span className="online-dot" /> <span>{shortId(user?.id)}</span></div>
          <Link to="/new" className="btn btn-primary header-create"><Plus size={17} /> New post</Link>
          <button type="button" className="icon-button mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>

    {demo && <div className="demo-banner"><span className="preview-pill">PREVIEW MODE</span> Posts are saved in this browser. Add Supabase credentials for the shared, secure forum. <Link to="/new">Try posting <ArrowUpRight size={13} /></Link></div>}

    <main>{children}</main>
    <footer className="site-footer">
      <div className="footer-inner">
        <Brand />
        <span>Made for curious minds and relentless builders.</span>
        <span className="footer-end"><Terminal size={15} /> Keep shipping.</span>
      </div>
    </footer>
  </div>
}

export function RightRail() {
  return <aside className="right-rail" aria-label="Community information">
    <div className="rail-card rail-intro">
      <div className="rail-visual"><span className="rail-terminal"><Terminal size={30} /></span><span className="rail-terminal-dot first" /><span className="rail-terminal-dot second" /></div>
      <div className="eyebrow">THE DEVELOPER SPACE</div>
      <h3>Good code starts with great conversations.</h3>
      <p>Ask questions. Share ideas. Meet people who love building things as much as you do.</p>
      <Link className="rail-link" to="/new">Start a conversation <ArrowUpRight size={16} /></Link>
    </div>
    <div className="rail-card rail-guidelines">
      <div className="rail-title"><BookOpen size={17} /> Community guidelines</div>
      <div className="guide-row"><span>01</span><p>Be curious, not judgmental.</p></div>
      <div className="guide-row"><span>02</span><p>Share what you learn.</p></div>
      <div className="guide-row"><span>03</span><p>Help others level up.</p></div>
      <div className="guide-row"><span>04</span><p>Build cool stuff together.</p></div>
    </div>
    <div className="rail-signoff"><Github size={16} /> Built with React + Supabase</div>
  </aside>
}
