// Local preview data, never used when Supabase credentials are configured.
// Demo-only localStorage is intentionally not presented as secure authentication.
const STORAGE_KEY = 'devconnect_demo_v1'
const ID_KEY = 'devconnect_demo_author_v1'
const OTHER_ID = '00000000-0000-4000-8000-111111111111'
const minutesAgo = (n) => new Date(Date.now() - n * 60000).toISOString()

function seed(me) {
  return {
    posts: [
      {
        id: '11111111-1111-4111-8111-111111111111', author_id: OTHER_ID,
        title: 'What are you building with AI this semester?',
        content: 'I have been experimenting with retrieval-augmented generation for a study companion. Curious what projects everyone else is working on — share your stack, the toughest part, or a demo link!',
        image_url: '/ai-lab.svg', video_url: null, flag: 'Discussion', repost_id: null,
        created_at: minutesAgo(29), updated_at: minutesAgo(29), upvotes: 128,
      },
      {
        id: '22222222-2222-4222-8222-222222222222', author_id: OTHER_ID,
        title: 'Finally understood dynamic programming. Here is what clicked.',
        content: 'Instead of memorizing formulas, I now start with a recursive solution, write down the state, then cache repeated work. Drawing a tiny decision tree before coding made all the difference.',
        image_url: null, video_url: null, flag: 'Showcase', repost_id: null,
        created_at: minutesAgo(115), updated_at: minutesAgo(115), upvotes: 96,
      },
      {
        id: '33333333-3333-4333-8333-333333333333', author_id: me,
        title: 'Best free resources for learning system design?',
        content: 'I am preparing for software engineering interviews and want to learn how to design scalable apps. What free courses, books, or project ideas would you recommend?',
        image_url: null, video_url: null, flag: 'Question', repost_id: null,
        created_at: minutesAgo(285), updated_at: minutesAgo(285), upvotes: 74,
      },
      {
        id: '44444444-4444-4444-8444-444444444444', author_id: OTHER_ID,
        title: 'Hot take: the best way to learn React is to build something messy.',
        content: 'Tutorials help you start, but your first real project teaches you the most. Especially when you get stuck with state, routing, and a database.',
        image_url: null, video_url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', flag: 'Opinion', repost_id: null,
        created_at: minutesAgo(430), updated_at: minutesAgo(430), upvotes: 63,
      },
      {
        id: '55555555-5555-4555-8555-555555555555', author_id: OTHER_ID,
        title: 'Sharing my collection of Python automation scripts',
        content: 'A small collection of automations for organizing files, parsing CSV data, and generating weekly reports. Which automation should I try next?',
        image_url: null, video_url: null, flag: 'Showcase', repost_id: null,
        created_at: minutesAgo(1070), updated_at: minutesAgo(1070), upvotes: 51,
      },
      {
        id: '66666666-6666-4666-8666-666666666666', author_id: OTHER_ID,
        title: 'How do you balance LeetCode practice and building projects?',
        content: 'I want a strong portfolio and I also want to be ready for technical interviews. What does your weekly schedule look like?',
        image_url: null, video_url: null, flag: 'Question', repost_id: null,
        created_at: minutesAgo(1510), updated_at: minutesAgo(1510), upvotes: 42,
      },
    ],
    comments: [
      { id: crypto.randomUUID(), post_id: '11111111-1111-4111-8111-111111111111', author_id: OTHER_ID, content: 'Building a semantic search engine for research papers!', created_at: minutesAgo(17) },
      { id: crypto.randomUUID(), post_id: '11111111-1111-4111-8111-111111111111', author_id: me, content: 'Working on an AI learning assistant. RAG is next on my list.', created_at: minutesAgo(10) },
      { id: crypto.randomUUID(), post_id: '33333333-3333-4333-8333-333333333333', author_id: OTHER_ID, content: 'Start with a URL shortener and add caching, rate limiting, then scale it.', created_at: minutesAgo(210) },
    ],
  }
}

export function demoUserId() {
  let id = localStorage.getItem(ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ID_KEY, id)
  }
  return id
}

function read() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* recover a corrupted preview */ }
  }
  const fresh = seed(demoUserId())
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
  return fresh
}

function write(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function assertOwner(row) {
  if (!row || row.author_id !== demoUserId()) throw new Error('Only the original author can make this change.')
}

export const demo = {
  async list({ search = '', flag = 'All', sort = 'newest' } = {}) {
    let posts = [...read().posts]
    if (search) posts = posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    if (flag !== 'All') posts = posts.filter((p) => p.flag === flag)
    posts.sort((a, b) => sort === 'popular'
      ? b.upvotes - a.upvotes || new Date(b.created_at) - new Date(a.created_at)
      : new Date(b.created_at) - new Date(a.created_at))
    return posts
  },
  async get(id) { return read().posts.find((p) => p.id === id) || null },
  async comments(id) { return read().comments.filter((c) => c.post_id === id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) },
  async create(values) {
    const data = read()
    if (values.repost_id && !data.posts.some((p) => p.id === values.repost_id)) throw new Error('Referenced post ID was not found.')
    const timestamp = new Date().toISOString()
    const post = { ...values, id: crypto.randomUUID(), author_id: demoUserId(), upvotes: 0, created_at: timestamp, updated_at: timestamp }
    data.posts.unshift(post)
    write(data)
    return post
  },
  async update(id, values) {
    const data = read()
    const index = data.posts.findIndex((p) => p.id === id)
    assertOwner(data.posts[index])
    if (values.repost_id && !data.posts.some((p) => p.id === values.repost_id && p.id !== id)) throw new Error('Referenced post ID was not found, or references this same post.')
    data.posts[index] = { ...data.posts[index], ...values, updated_at: new Date().toISOString() }
    write(data)
    return data.posts[index]
  },
  async remove(id) {
    const data = read()
    assertOwner(data.posts.find((p) => p.id === id))
    data.posts = data.posts.filter((p) => p.id !== id).map((p) => p.repost_id === id ? { ...p, repost_id: null } : p)
    data.comments = data.comments.filter((c) => c.post_id !== id)
    write(data)
  },
  async upvote(id) {
    const data = read()
    const post = data.posts.find((p) => p.id === id)
    if (!post) throw new Error('Post not found.')
    post.upvotes += 1
    write(data)
    return post.upvotes
  },
  async addComment(postId, content) {
    const data = read()
    if (!data.posts.some((p) => p.id === postId)) throw new Error('Post not found.')
    const item = { id: crypto.randomUUID(), post_id: postId, author_id: demoUserId(), content, created_at: new Date().toISOString() }
    data.comments.push(item)
    write(data)
    return item
  },
  async removeComment(id) {
    const data = read()
    assertOwner(data.comments.find((c) => c.id === id))
    data.comments = data.comments.filter((c) => c.id !== id)
    write(data)
  },
  async uploadImage(file) {
    if (file.size > 900000) throw new Error('In preview mode, please use an image under 900 KB. Live Supabase supports up to 5 MB.')
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Could not read this image.'))
      reader.readAsDataURL(file)
    })
  },
}
