import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ImagePlus, Link2, LoaderCircle, Send, Video, X } from 'lucide-react'
import { api } from '../lib/api'
import { FLAGS, validateImage, validatePost } from '../lib/utils'
import { useAuth } from '../context/AuthContext'
import { BackLink, ErrorBox } from './Shared'

const emptyPost = { title: '', content: '', image_url: '', video_url: '', flag: 'Discussion', repost_id: '' }

export default function PostForm({ existing = null, repostId = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(() => ({
    ...emptyPost,
    ...(existing ? { ...existing, image_url: existing.image_url || '', video_url: existing.video_url || '', repost_id: existing.repost_id || '' } : { repost_id: repostId }),
  }))
  const [file, setFile] = useState(null)
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showExtras, setShowExtras] = useState(Boolean(existing?.video_url || existing?.repost_id || repostId))

  const change = (key, value) => setValues((p) => ({ ...p, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const issue = validatePost(values) || validateImage(file)
    if (issue) { setError(issue); return }
    const repost = values.repost_id.trim() || null
    if (repost && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repost)) { setError('Repost ID must be a valid post UUID.'); return }
    if (repost && repost === existing?.id) { setError('A post cannot repost itself.'); return }
    setBusy(true)
    setError(null)
    try {
      const imageUrl = file ? await api.uploadImage(file, user.id) : values.image_url.trim() || null
      const payload = {
        title: values.title.trim(), content: values.content.trim() || null,
        image_url: imageUrl, video_url: values.video_url.trim() || null,
        flag: values.flag, repost_id: repost,
      }
      const result = existing ? await api.update(existing.id, payload) : await api.create(payload)
      navigate(`/post/${result.id}`)
    } catch (err) {
      setError(err.message || 'Unable to save this post.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="page-wrap narrow-page">
    <BackLink to={existing ? `/post/${existing.id}` : '/'} />
    <div className="form-intro"><div className="eyebrow eyebrow-green">{existing ? 'MAKE IT BETTER' : 'YOUR VOICE MATTERS'}</div><h1>{existing ? 'Edit your post' : 'Start a conversation'}<span className="heading-period">.</span></h1><p>{existing ? 'Update your thoughts and keep the discussion going.' : 'Questions, ideas, projects, big or small. This space is yours.'}</p></div>
    <form className="editor-card" onSubmit={submit}>
      <div className="editor-topbar"><span className="mini-online-dot" /> {existing ? 'EDIT POST' : 'NEW DISCUSSION'} <span className="editor-draft">{existing ? 'Updating your discussion' : 'Drafting something great...'}</span></div>
      <div className="editor-body">
        {error && <ErrorBox message={error} />}
        <div className="form-field"><label htmlFor="title">Post title <span>*</span></label><input id="title" autoFocus required maxLength={160} placeholder="What's on your mind?" value={values.title} onChange={(e) => change('title', e.target.value)} /><small>Make it clear, interesting, and easy to find. {values.title.length}/160</small></div>
        <div className="form-field"><label htmlFor="flag">Category <span>*</span></label><div className="category-options">{FLAGS.map((tag) => <button type="button" key={tag} className={`category-option ${values.flag === tag ? 'chosen' : ''}`} onClick={() => change('flag', tag)}>{tag}</button>)}</div></div>
        <div className="form-field"><label htmlFor="content">Your thoughts <span className="optional">optional</span></label><textarea id="content" rows={7} maxLength={10000} placeholder="Share the details, context, or what you've learned..." value={values.content} onChange={(e) => change('content', e.target.value)} /><small>{values.content.length}/10,000 characters</small></div>
        <div className="form-field"><label htmlFor="image">Attach an image <span className="optional">optional</span></label><div className="image-drop"><ImagePlus size={24} /><div><strong>{file ? file.name : 'Upload from your device'}</strong><small>PNG, JPG, WebP, or GIF · up to 5 MB</small></div><input ref={fileRef} id="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] || null)} />{file && <button type="button" className="icon-button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }} aria-label="Remove selected image"><X size={16} /></button>}</div><div className="input-with-icon"><Link2 size={17} /><input aria-label="External image URL" type="url" value={values.image_url} disabled={Boolean(file)} placeholder="Or paste an external image URL (https://...)" onChange={(e) => change('image_url', e.target.value)} /></div>{file && <small>The uploaded file will take priority over the external URL.</small>}</div>
        <button type="button" className="extras-toggle" onClick={() => setShowExtras((s) => !s)}><span>{showExtras ? '−' : '+'}</span> {showExtras ? 'Hide optional extras' : 'Add a video or reference another post'}</button>
        {showExtras && <div className="form-extras"><div className="form-field"><label htmlFor="video">Video URL <span className="optional">optional</span></label><div className="input-with-icon"><Video size={17} /><input id="video" type="url" value={values.video_url} onChange={(e) => change('video_url', e.target.value)} placeholder="YouTube or Vimeo link" /></div></div><div className="form-field"><label htmlFor="repost">Repost another discussion <span className="optional">optional</span></label><div className="input-with-icon"><Link2 size={17} /><input id="repost" value={values.repost_id} onChange={(e) => change('repost_id', e.target.value)} placeholder="Paste the original post UUID" /></div><small>The referenced post will appear on your post page.</small></div></div>}
      </div>
      <div className="editor-footer"><span>Be kind. Stay curious. Keep building.</span><button type="submit" className="btn btn-primary submit-btn" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <Send size={17} />}{busy ? 'Saving...' : existing ? 'Save changes' : 'Publish post'} <ArrowRight size={16} /></button></div>
    </form>
  </div>
}
