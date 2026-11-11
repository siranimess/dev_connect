import test from 'node:test'
import assert from 'node:assert/strict'
import { embedVideo, isHttpUrl, shortId, timeAgo, validateImage, validatePost } from '../src/lib/utils.js'

test('formats pseudo-auth user labels', () => {
  assert.equal(shortId('123e4567-e89b-12d3-a456-426614174000'), 'dev_123e45')
  assert.equal(shortId(), 'dev_guest')
})

test('human readable timestamps', () => {
  const now = Date.parse('2026-11-05T12:00:00Z')
  assert.equal(timeAgo('2026-11-05T11:58:00Z', now), '2 minutes ago')
  assert.equal(timeAgo('2026-11-04T12:00:00Z', now), '1 day ago')
})

test('external image URL requires http or https', () => {
  assert.equal(isHttpUrl('https://example.com/photo.png'), true)
  assert.equal(isHttpUrl('http://example.com/photo.png'), true)
  assert.equal(isHttpUrl('javascript:alert(1)'), false)
  assert.equal(isHttpUrl('not a url'), false)
})

test('video URLs produce safe, provider restricted iframe URLs', () => {
  assert.equal(embedVideo('https://www.youtube.com/watch?v=Tn6-PIqc4UM'), 'https://www.youtube-nocookie.com/embed/Tn6-PIqc4UM')
  assert.equal(embedVideo('https://youtu.be/Tn6-PIqc4UM'), 'https://www.youtube-nocookie.com/embed/Tn6-PIqc4UM')
  assert.equal(embedVideo('https://vimeo.com/123456'), 'https://player.vimeo.com/video/123456')
  assert.equal(embedVideo('https://evil.example/embed/Tn6-PIqc4UM'), null)
  assert.equal(embedVideo('javascript:alert(1)'), null)
})

test('post validation enforces title, category, and safe media', () => {
  const valid = { title: 'A discussion', flag: 'Question', content: '', image_url: '', video_url: '' }
  assert.equal(validatePost(valid), null)
  assert.match(validatePost({ ...valid, title: '  ' }), /title/i)
  assert.match(validatePost({ ...valid, flag: 'Admin' }), /category/i)
  assert.match(validatePost({ ...valid, image_url: 'data:text/html,hello' }), /Image URL/)
  assert.match(validatePost({ ...valid, video_url: 'https://example.com/video' }), /YouTube or Vimeo/)
})

test('image validation checks file type and 5MB size', () => {
  assert.equal(validateImage({ type: 'image/png', size: 1000 }), null)
  assert.match(validateImage({ type: 'text/html', size: 200 }), /JPEG/)
  assert.match(validateImage({ type: 'image/png', size: 6 * 1024 * 1024 }), /5 MB/)
})
