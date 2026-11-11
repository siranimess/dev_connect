import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ArrowUp, Clock3, CornerUpRight, Hash, Link2, LoaderCircle, MessageCircle, Pencil, Send, Trash2, UserRound } from 'lucide-react'
import { api } from '../lib/api'
import { embedVideo, shortId, timeAgo } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { BackLink, EmptyState, ErrorBox, Loader } from '../components/Shared'
import { RightRail } from '../components/Layout'

function Author({ id, mine = false }) {
  return <span className="author-line"><span className="author-avatar"><UserRound size={16} /></span><span>{shortId(id)} {mine && <span className="you-label">YOU</span>}</span></span>
}

function CommentThread({ postId, comments, onRefresh, userId }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)

  async function submit(event) {
    event.preventDefault()
    const content = text.trim()
    if (!content || busy) return
    setBusy(true); setError(null)
    try {
      await api.addComment(postId, content)
      setText('')
      await onRefresh()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  async function remove(id) {
    if (!window.confirm('Delete this comment?')) return
    setDeleting(id); setError(null)
    try { await api.removeComment(id); await onRefresh() }
    catch (err) { setError(err.message) }
    finally { setDeleting(null) }
  }

  return <section className="comments-card" id="comments">
    <div className="comments-heading"><h2><MessageCircle size={22} /> Discussion <span>{comments.length}</span></h2></div>
    {error && <ErrorBox message={error} />}
    <form className="comment-composer" onSubmit={submit}><div className="comment-avatar"><UserRound size={18} /></div><div className="composer-input"><label htmlFor="new-comment">Add to the conversation</label><textarea id="new-comment" required rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your thoughts, help someone out, or ask a follow-up..." /><div className="composer-foot"><span>{text.length}/2,000 characters</span><button type="submit" disabled={busy || !text.trim()} className="btn btn-primary btn-small">{busy ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />} Comment</button></div></div></form>
    <div className="comment-list">{comments.length ? comments.map((comment) => <article className="comment-item" key={comment.id}><div className="comment-avatar small"><UserRound size={16} /></div><div className="comment-content"><div className="comment-meta"><strong>{shortId(comment.author_id)} {comment.author_id === userId && <span className="you-label">YOU</span>}</strong><span>· {timeAgo(comment.created_at)}</span></div><p>{comment.content}</p></div>{comment.author_id === userId && <button className="comment-delete" type="button" disabled={deleting === comment.id} onClick={() => remove(comment.id)} aria-label="Delete your comment" title="Delete your comment"><Trash2 size={16} /></button>}</article>) : <div className="no-comments">No comments yet. Be the first to jump in!</div>}</div>
  </section>
}

export default function PostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [referenced, setReferenced] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [upvoting, setUpvoting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError(null); setPost(null); setReferenced(null)
    async function fetchPost() {
      try {
        const [found, replies] = await Promise.all([api.get(id), api.comments(id)])
        let parent = null
        if (found?.repost_id) parent = await api.get(found.repost_id)
        if (active) { setPost(found); setComments(replies); setReferenced(parent) }
      } catch (err) { if (active) setError(err.message) }
      finally { if (active) setLoading(false) }
    }
    fetchPost()
    return () => { active = false }
  }, [id, retry])

  async function refreshComments() { setComments(await api.comments(id)) }

  async function upvote() {
    if (upvoting) return
    setUpvoting(true); setActionError(null)
    try {
      const count = await api.upvote(id)
      setPost((current) => current ? { ...current, upvotes: Number(count) } : current)
    } catch (err) { setActionError(err.message) }
    finally { setUpvoting(false) }
  }

  async function removePost() {
    if (!window.confirm('Permanently delete this post and all of its comments?')) return
    setDeleting(true); setActionError(null)
    try { await api.remove(id); navigate('/') }
    catch (err) { setActionError(err.message); setDeleting(false) }
  }

  if (loading) return <div className="page-wrap detail-page"><BackLink /><Loader message="Opening the discussion..." /></div>
  if (error) return <div className="page-wrap detail-page"><BackLink /><ErrorBox message={error} onRetry={() => setRetry((n) => n + 1)} /></div>
  if (!post) return <div className="page-wrap detail-page"><BackLink /><EmptyState title="Post not found" description="This discussion may have been removed." search /></div>

  const mine = user?.id === post.author_id
  const embedded = embedVideo(post.video_url)

  return <div className="page-wrap detail-page">
    <BackLink />
    <div className="content-columns detail-columns"><div className="detail-main">
      <article className="detail-card">
        <div className="detail-topline"><span className="category-badge"><Hash size={13} /> {post.flag}</span><span className="detail-date"><Clock3 size={14} /> {timeAgo(post.created_at)}</span></div>
        <h1>{post.title}</h1>
        <div className="detail-author-row"><Author id={post.author_id} mine={mine} /><span className="detail-date">{new Date(post.created_at).toLocaleString()}</span></div>
        {(post.content || post.image_url || embedded) && <div className="post-rich-body">{post.content && <p className="post-body-text">{post.content}</p>}{post.image_url && <img className="detail-image" src={post.image_url} alt="Media attached to this post" loading="lazy" />}{embedded && <div className="video-frame"><iframe src={embedded} title="Post video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}</div>}
        {referenced && <div className="referenced-wrap"><div className="reference-label"><CornerUpRight size={16} /> REPOSTING</div><Link to={`/post/${referenced.id}`} className="reference-card"><span><strong>{referenced.title}</strong><small>Originally posted by {shortId(referenced.author_id)} · {timeAgo(referenced.created_at)}</small></span><ArrowRight size={18} /></Link></div>}
        <div className="detail-bottom"><div className="detail-actions"><button type="button" className="upvote-action" disabled={upvoting} onClick={upvote} aria-label="Upvote this post">{upvoting ? <LoaderCircle className="spin" size={19} /> : <ArrowUp size={19} strokeWidth={2.8} />} <strong>{post.upvotes}</strong> <span>Upvotes</span></button><a className="discussion-action" href="#comments"><MessageCircle size={19} /><strong>{comments.length}</strong> <span>Comments</span></a></div><Link className="repost-link" to={`/new?repost=${post.id}`}><CornerUpRight size={16} /> Repost</Link></div>
        {actionError && <div className="detail-action-error"><ErrorBox message={actionError} /></div>}
      </article>
      {mine && <div className="owner-actions"><span>You created this post</span><div><Link to={`/post/${post.id}/edit`} className="btn btn-outline"><Pencil size={16} /> Edit</Link><button type="button" onClick={removePost} disabled={deleting} className="btn btn-danger">{deleting ? <LoaderCircle size={16} className="spin" /> : <Trash2 size={16} />} Delete</button></div></div>}
      <CommentThread key={id} postId={id} comments={comments} onRefresh={refreshComments} userId={user?.id} />
    </div><RightRail /></div>
  </div>
}
