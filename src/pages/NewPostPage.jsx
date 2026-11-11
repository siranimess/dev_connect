import { useSearchParams } from 'react-router-dom'
import PostForm from '../components/PostForm'

export default function NewPostPage() {
  const [params] = useSearchParams()
  return <PostForm repostId={params.get('repost') || ''} />
}
