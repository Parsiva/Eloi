// The content snapshot taken from sites/portfolio on 2026-10-13 (see README.md beside this file).
// The sandbox never talks to a backend; boxes that need "live" data simulate it from here.
import { projects } from './projects.js'
import { marginaliaEntries } from './marginalia.js'

export { projects, marginaliaEntries }

// Markdown articles, raw text keyed by file name (front matter included).
export const articles: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./articles/*.md', { query: '?raw', import: 'default', eager: true })).map(
    ([path, text]) => [path.replace(/^.*\/(.*)\.md$/, '$1'), text],
  ),
)
