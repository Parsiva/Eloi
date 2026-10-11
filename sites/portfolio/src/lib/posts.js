// src/lib/posts.js
// Read all markdown files as raw text
import matter from 'gray-matter'
import { marked } from 'marked'

const files = import.meta.glob('/src/articles/**/*.md', { as: 'raw', eager: true })

// 2) Collect all image assets inside /src/articles for resolution
const assetMap = import.meta.glob('/src/articles/**/*.{png,jpg,jpeg,gif,webp,svg}', {
  eager: true,
  as: 'url',
})

// --- helpers ---
function findFM(raw, key) {
  const m = raw.match(/^---\s*([\s\S]*?)\s*---/); if (!m) return ''
  const block = m[1]
  const re = new RegExp(`^\\s*${key}\\s*:\\s*["']?([^"']+)["']?\\s*$`, 'mi')
  const hit = block.match(re)
  return hit ? hit[1].trim() : ''
}
function bodyAfterFM(raw) {
  const m = raw.match(/^---[\s\S]*?---\s*/)
  return m ? raw.slice(m[0].length) : raw
}
function stripMd(md) {
  return md
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[#*_~>\-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function preview(md, words = 60) {
  const txt = stripMd(md)
  const parts = txt.split(/\s+/)
  return parts.length > words ? parts.slice(0, words).join(' ') + '…' : txt
}
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 80) || 'post'
}

// resolve "./img.png" relative to a markdown file's folder using our assetMap
function resolveAsset(baseDir, href) {
  if (!href || /^https?:\/\//i.test(href) || href.startsWith('/')) return href
  // normalize: baseDir like "/src/articles/folder/", href like "./img.webp" or "../x.png"
  const u = new URL(href, 'https://x' + (baseDir.endsWith('/') ? baseDir : baseDir + '/'))
  const key = u.pathname // e.g. "/src/articles/folder/img.webp"
  return assetMap[key] || href // fallback to original if not found
}

// build HTML with a custom renderer so images/links behave
function renderHtml(md, baseDir) {
  const r = new marked.Renderer()

  r.image = (href, title, text) => {
    const src = resolveAsset(baseDir, href || '')
    const t = title ? ` title="${title}"` : ''
    const alt = text ?? ''
    return `<img src="${src}" alt="${alt}"${t} />`
  }

  r.link = (href, title, text) => {
    const url = href || '#'
    const isExternal = /^https?:\/\//i.test(url)
    const t = title ? ` title="${title}"` : ''
    if (isExternal) {
      return `<a href="${url}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
    }
    return `<a href="${url}"${t}>${text}</a>`
  }

  return marked.parse(md, {
    gfm: true,        // tables, strikethrough, task lists
    breaks: false,
    renderer: r,
  })
}

// --- build posts array ---
export const posts = Object.entries(files).map(([path, raw]) => {
  const file = path.split('/').pop() || ''
  const fileSlug = file.replace(/\.md$/, '')
  const baseDir = path.replace(/[^/]+$/, '') // "/src/articles/foo/"

  const title = findFM(raw, 'title') || fileSlug
  const dateStr = findFM(raw, 'date')
  const category = (findFM(raw, 'category') || 'manuscripts').toLowerCase()
  const slug = (findFM(raw, 'slug') || slugify(title) || fileSlug).toLowerCase()
  const routeFM = findFM(raw, 'route')
  const route = routeFM && routeFM.startsWith('/') ? routeFM : `/${category}/${slug}/`

  const date = dateStr ? new Date(dateStr) : new Date(0)
  const body = bodyAfterFM(raw)
  const html = renderHtml(body, baseDir)

  return {
    path,
    title,
    date,
    dateISO: isNaN(+date) ? '' : date.toISOString(),
    category,
    slug,
    route,
    preview: preview(body, 60),
    html,
  }
}).sort((a, b) => (+b.date || 0) - (+a.date || 0))

// lookup helpers
export function getPost(category, slug) {
  category = String(category || '').toLowerCase()
  slug = String(slug || '').toLowerCase()
  return posts.find(p => p.category === category && p.slug === slug)
}
