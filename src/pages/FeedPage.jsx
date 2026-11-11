import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUp, ChevronDown, Code2, MessageCircle, Plus, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { api } from '../lib/api'
import { FLAGS, timeAgo } from '../lib/utils'
import { EmptyState, ErrorBox, Loader } from '../components/Shared'
import { RightRail } from '../components/Layout'

const filters = ['All', ...FLAGS]

function PostCard({ post, index }) {
  return <Link to={`/post/${post.id}`} className="feed-post" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
    <div className="feed-post-left"><span className="post-code-icon"><Code2 size={19} /></span></div>
    <div className="feed-post-main">
      <span className="post-time">Posted {timeAgo(post.created_at)}</span>
      <h3>{post.title}</h3>
    </div>
    <div className="feed-post-end"><span className="vote-count"><ArrowUp size={17} strokeWidth={2.6} /> {post.upvotes}</span><ArrowRight className="card-arrow" size={17} /></div>
  </Link>
}

export default function FeedPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [flag, setFlag] = useState('All')
  const [sort, setSort] = useState('newest')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 260)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api.list({ search: query, flag, sort }).then((rows) => {
      if (active) setPosts(rows)
    }).catch((err) => {
      if (active) setError(err.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [query, flag, sort, retry])

  return <div className="page-wrap">
    <section className="hero">
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
      <div className="hero-copy">
        <div className="hero-eyebrow"><span className="hero-live-dot" /> THE COMMUNITY FOR CURIOUS DEVELOPERS <Sparkles size={14} /></div>
        <h1>Build together.<br /><span>Grow together.</span></h1>
        <p>Your space to ask better questions, share what you&apos;re building, and learn from developers everywhere.</p>
        <Link className="btn btn-primary hero-cta" to="/new"><Plus size={19} /> Start a discussion <ArrowRight size={17} /></Link>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-window"><div className="art-top"><span /><span /><span /><small>community.js</small></div>
          <div className="code-line"><span>01</span><span className="code-purple">const</span> community = {'{'}</div>
          <div className="code-line"><span>02</span>&nbsp;&nbsp;passion: <span className="code-green">'building'</span>,</div>
          <div className="code-line"><span>03</span>&nbsp;&nbsp;ideas: <span className="code-yellow">Infinity</span>,</div>
          <div className="code-line"><span>04</span>&nbsp;&nbsp;status: <span className="code-green">'growing'</span></div>
          <div className="code-line"><span>05</span>{'}'};</div>
          <div className="code-line code-muted"><span>06</span>// your next big idea starts here_</div>
        </div>
        <div className="floating-code"><Code2 size={25} /></div>
      </div>
    </section>

    <div className="content-columns">
      <section className="feed-section" aria-label="Community posts">
        <div className="feed-heading"><div><div className="eyebrow eyebrow-green">THE CONVERSATION</div><h2>Explore discussions<span className="heading-period">.</span></h2><p>Fresh ideas from the community, all in one place.</p></div><span className="feed-count">{loading ? '...' : posts.length} posts</span></div>

        <div className="feed-tools">
          <label className="search-control"><Search size={19} /><input aria-label="Search posts by title" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search discussions..." />{search && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}</label>
          <label className="sort-control"><SlidersHorizontal size={17} /><span className="sr-only">Sort posts</span><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort posts"><option value="newest">Newest first</option><option value="popular">Most upvoted</option></select><ChevronDown size={16} /></label>
        </div>

        <div className="filter-row" aria-label="Filter by category">{filters.map((item) => <button key={item} type="button" className={`filter-pill ${flag === item ? 'selected' : ''}`} onClick={() => setFlag(item)}>{item}</button>)}</div>

        <div className="posts-container">
          <div className="posts-bar"><span><span className="mini-online-dot" /> COMMUNITY FEED</span><span>{sort === 'newest' ? 'LATEST FIRST' : 'MOST UPVOTED'}</span></div>
          {loading ? <Loader /> : error ? <ErrorBox message={error} onRetry={() => setRetry((n) => n + 1)} /> : posts.length ? posts.map((post, index) => <PostCard key={post.id} post={post} index={index} />) : <EmptyState search={Boolean(query || flag !== 'All')} title="No discussions found" description={query || flag !== 'All' ? 'Try a different search or category.' : 'Be the first to start a conversation!'} />}
        </div>
        <div className="feed-bottom"><MessageCircle size={17} /> Every great conversation starts with a question. <Link to="/new">Ask yours <ArrowRight size={14} /></Link></div>
      </section>
      <RightRail />
    </div>
  </div>
}
