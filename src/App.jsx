import { Link, Route, Routes } from 'react-router-dom'
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { Layout } from './components/Layout'
import { ErrorBox, Loader } from './components/Shared'
import FeedPage from './pages/FeedPage'
import NewPostPage from './pages/NewPostPage'
import PostPage from './pages/PostPage'
import EditPostPage from './pages/EditPostPage'

function NotFound() {
  return <div className="page-wrap not-found"><span className="eyebrow eyebrow-green">404 / LOST IN THE STACK</span><h1>This page escaped the codebase<span className="heading-period">.</span></h1><p>Let's get you back to the good conversations.</p><Link to="/" className="btn btn-primary">Back to the feed <ArrowRight size={18} /></Link></div>
}

export default function App() {
  const { loading, error, retry, user } = useAuth()
  if (loading) return <div className="app-startup"><span className="startup-logo"><Sparkles size={27} /></span><Loader message="Connecting to the community..." /></div>
  if (error || !user) return <div className="app-startup auth-error"><ErrorBox message={`${error || 'No user session available.'} Check that Anonymous Sign-Ins are enabled in Supabase Authentication settings.`} /><button className="btn btn-primary" onClick={retry}><RefreshCw size={17} /> Try connecting again</button></div>
  return <Layout><Routes><Route path="/" element={<FeedPage />} /><Route path="/new" element={<NewPostPage />} /><Route path="/post/:id" element={<PostPage />} /><Route path="/post/:id/edit" element={<EditPostPage />} /><Route path="*" element={<NotFound />} /></Routes></Layout>
}
