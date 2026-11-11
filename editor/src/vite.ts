// The dev-server half of the editor: saves frame documents to real files, so git sees every
// edit and any other dev server watching the same folder (the clean view) hot-updates from it.
// Development only; a read-only server (the view) refuses writes.
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { formatFrame } from './format.ts'

export interface EloiFramesOptions {
  dir: string // absolute path of the folder holding <id>.json frame documents
  readOnly?: boolean
}

export function eloiFrames(options: EloiFramesOptions): Plugin {
  return {
    name: 'eloi-frames',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__eloi/frames', (req, res, next) => {
        const id = /^\/([\w-]+)$/.exec(req.url ?? '')?.[1]
        if (!id || req.method !== 'PUT') return next()
        const reply = (status: number, message = '') => {
          res.statusCode = status
          res.setHeader('content-type', 'text/plain')
          res.end(message)
        }
        if (options.readOnly) return reply(403, 'This server is the read-only view.')
        if (!String(req.headers['content-type']).startsWith('application/json')) return reply(415, 'Send JSON.')
        const chunks: Buffer[] = []
        let size = 0
        req.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size <= 1_000_000) chunks.push(chunk)
        })
        req.on('end', () => {
          if (size > 1_000_000) return reply(413, 'Frame document too large.')
          let doc: { id?: unknown; plans?: unknown }
          try {
            doc = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          } catch {
            return reply(400, 'Not valid JSON.')
          }
          if (!doc || doc.id !== id || !Array.isArray(doc.plans) || doc.plans.length === 0)
            return reply(400, `Expected a frame document with id "${id}" and at least one plan.`)
          mkdir(options.dir, { recursive: true })
            .then(() => writeFile(join(options.dir, `${id}.json`), formatFrame(doc)))
            .then(
              () => reply(204),
              (err: unknown) => reply(500, err instanceof Error ? err.message : String(err)),
            )
        })
      })
    },
  }
}
