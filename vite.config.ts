import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// GitHub Pages has no server-side rewrite: a copy of index.html at 404.html is
// the only way deep links boot the app there. The cost is that every deep link
// answers with an HTTP 404 status, which keeps search engines from indexing it.
// Hosts that support rewrites (Cloudflare Pages, Netlify) use public/_redirects
// instead and answer 200, so this copy is only emitted for GitHub Pages.
function spaFallback() {
  return {
    name: 'spa-404-fallback',
    apply: 'build' as const,
    closeBundle() {
      if (process.env.DEPLOY_TARGET !== 'github') return
      const dist = path.resolve(__dirname, 'dist')
      const index = path.join(dist, 'index.html')
      if (fs.existsSync(index)) {
        fs.copyFileSync(index, path.join(dist, '404.html'))
      }
    },
  }
}

// GitHub Pages serves the site from a project sub-path; every other host serves
// it from the domain root. DEPLOY_TARGET=github selects the sub-path build.
const BASE = process.env.DEPLOY_TARGET === 'github' ? '/boxology/' : '/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  plugins: [
    figmaAssetResolver(),
    spaFallback(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
}))
