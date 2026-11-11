import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { eloiFrames } from '../editor/src/vite.ts'

// Two dev servers share this config. `vite` (port 5180) is the sandbox, where the site page has
// the editor and may save frames. `vite --mode view` (port 5181) is the clean view: its root is
// the site page, and it only reads. Both watch frames/, so a save on one hot-updates the other.
const viewRoot: Plugin = {
  name: 'eloi-view-root',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/' || req.url?.startsWith('/?')) req.url = '/site.html'
      next()
    })
  },
}

export default defineConfig(({ mode }) => {
  const view = mode === 'view'
  return {
    server: { port: view ? 5181 : 5180, strictPort: true },
    cacheDir: view ? 'node_modules/.vite-view' : 'node_modules/.vite',
    plugins: [eloiFrames({ dir: fileURLToPath(new URL('./frames', import.meta.url)), readOnly: view }), ...(view ? [viewRoot] : [])],
    build: { rollupOptions: { input: ['index.html', 'site.html'] } },
  }
})
