/* global process */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

// LatamBucks — Forzamos ruta relativa para asegurar que encuentre index.js e index.css
const base = './'

// GitHub Pages no reescribe URLs: las rutas del cliente (/faq, /perfiles…)
// dan 404 al entrar directo. Copiamos 404.html a dist/ con la base real
// inyectada, para que vuelva al index y index.html restaure la ruta.
function githubPagesSpaFallback() {
  return {
    name: 'latambucks-github-pages-404',
    apply: 'build',
    generateBundle() {
      const template = readFileSync(fileURLToPath(new URL('./404.html', import.meta.url)), 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: template.split('__BASE_URL__').join(base),
      })
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), githubPagesSpaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
