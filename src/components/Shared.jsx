import { ArrowLeft, LoaderCircle, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Loader({ message = 'Loading discussions...' }) {
  return <div className="loading-area" role="status"><LoaderCircle size={29} className="spin" /><span>{message}</span></div>
}

export function ErrorBox({ message, onRetry }) {
  return <div className="error-box" role="alert"><TriangleAlert size={20} /><div><strong>Something went wrong</strong><p>{message}</p>{onRetry && <button className="text-button" onClick={onRetry}>Try again</button>}</div></div>
}

export function EmptyState({ title, description, search = false }) {
  return <div className="empty-state"><div className="empty-symbol">{search ? '⌕' : '✦'}</div><h3>{title}</h3><p>{description}</p>{!search && <Link className="btn btn-primary" to="/new">Create the first post</Link>}</div>
}

export function BackLink({ to = '/', children = 'Back to feed' }) {
  return <Link className="back-link" to={to}><ArrowLeft size={17} /> {children}</Link>
}
