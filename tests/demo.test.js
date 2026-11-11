import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { demo, demoUserId } from '../src/lib/demo.js'

class FakeStorage {
  values = new Map()
  getItem(key) { return this.values.get(key) ?? null }
  setItem(key, value) { this.values.set(key, String(value)) }
  clear() { this.values.clear() }
}

beforeEach(() => { globalThis.localStorage = new FakeStorage() })

test('preview feed supports search, category filters, and sorting', async () => {
  const all = await demo.list()
  assert.equal(all.length, 6)
  const result = await demo.list({ search: 'React', flag: 'Opinion', sort: 'popular' })
  assert.equal(result.length, 1)
  assert.match(result[0].title, /React/)
  const top = await demo.list({ sort: 'popular' })
  assert.ok(top[0].upvotes >= top[1].upvotes)
})

test('creator can create, edit, delete and repeatedly upvote', async () => {
  const post = await demo.create({ title: 'Testing creation', content: 'Details', flag: 'Question', image_url: null, video_url: null, repost_id: null })
  assert.equal(post.author_id, demoUserId())
  assert.equal(await demo.upvote(post.id), 1)
  assert.equal(await demo.upvote(post.id), 2)
  const updated = await demo.update(post.id, { title: 'Edited creation' })
  assert.equal(updated.title, 'Edited creation')
  await demo.remove(post.id)
  assert.equal(await demo.get(post.id), null)
})

test('other authors cannot update or delete posts, or delete comments', async () => {
  const otherId = '11111111-1111-4111-8111-111111111111'
  await assert.rejects(() => demo.update(otherId, { title: 'hacked' }), /original author/)
  await assert.rejects(() => demo.remove(otherId), /original author/)
  const comments = await demo.comments(otherId)
  const someoneElse = comments.find((comment) => comment.author_id !== demoUserId())
  await assert.rejects(() => demo.removeComment(someoneElse.id), /original author/)
})

test('comments and post references link together', async () => {
  const original = '11111111-1111-4111-8111-111111111111'
  const repost = await demo.create({ title: 'My repost', content: null, flag: 'Discussion', image_url: null, video_url: null, repost_id: original })
  assert.equal((await demo.get(repost.id)).repost_id, original)
  const reply = await demo.addComment(repost.id, 'Great thread!')
  assert.equal((await demo.comments(repost.id))[0].content, 'Great thread!')
  await demo.removeComment(reply.id)
  assert.equal((await demo.comments(repost.id)).length, 0)
  await assert.rejects(() => demo.create({ title: 'Broken', repost_id: crypto.randomUUID() }), /not found/)
})
