import { configured, supabase } from './supabase'
import { demo } from './demo'

function requireData({ data, error }) {
  if (error) throw error
  return data
}

export const api = {
  async list({ search = '', flag = 'All', sort = 'newest' } = {}) {
    if (!configured) return demo.list({ search, flag, sort })
    let query = supabase.from('posts').select('id,title,flag,created_at,upvotes')
    if (search.trim()) {
      const escaped = search.trim().replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
      query = query.ilike('title', `%${escaped}%`)
    }
    if (flag !== 'All') query = query.eq('flag', flag)
    if (sort === 'popular') query = query.order('upvotes', { ascending: false })
    query = query.order('created_at', { ascending: false })
    return requireData(await query)
  },
  async get(id) {
    if (!configured) return demo.get(id)
    return requireData(await supabase.from('posts').select('*').eq('id', id).maybeSingle())
  },
  async comments(id) {
    if (!configured) return demo.comments(id)
    return requireData(await supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: true }))
  },
  async create(values) {
    if (!configured) return demo.create(values)
    return requireData(await supabase.from('posts').insert(values).select().single())
  },
  async update(id, values) {
    if (!configured) return demo.update(id, values)
    return requireData(await supabase.from('posts').update(values).eq('id', id).select().single())
  },
  async remove(id) {
    if (!configured) return demo.remove(id)
    requireData(await supabase.from('posts').delete().eq('id', id).select('id').single())
  },
  async upvote(id) {
    if (!configured) return demo.upvote(id)
    return requireData(await supabase.rpc('upvote_post', { p_post_id: id }))
  },
  async addComment(postId, content) {
    if (!configured) return demo.addComment(postId, content)
    return requireData(await supabase.from('comments').insert({ post_id: postId, content }).select().single())
  },
  async removeComment(id) {
    if (!configured) return demo.removeComment(id)
    requireData(await supabase.from('comments').delete().eq('id', id).select('id').single())
  },
  async uploadImage(file, userId) {
    if (!configured) return demo.uploadImage(file)
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
    const path = `${userId}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from('post-images').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw error
    return supabase.storage.from('post-images').getPublicUrl(path).data.publicUrl
  },
}
