import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import PostForm from '../components/PostForm'
import { BackLink, EmptyState, ErrorBox, Loader } from '../components/Shared'

export default function EditPostPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api.get(id).then((result) => { if (active) setPost(result) }).catch((err) => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) return <div className="page-wrap narrow-page"><BackLink to={`/post/${id}`} /><Loader message="Loading editor..." /></div>
  if (error) return <div className="page-wrap narrow-page"><BackLink to={`/post/${id}`} /><ErrorBox message={error} /></div>
  if (!post || post.author_id !== user?.id) return <div className="page-wrap narrow-page"><BackLink /><EmptyState search title="Editor unavailable" description="Only the original author can edit this post." /></div>
  return <PostForm existing={post} />
}
