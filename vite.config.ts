import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Rutas relativas: funciona igual en localhost, GitHub Pages o cualquier carpeta
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Salta Números',
        short_name: 'SaltaNúmeros',
        description: 'Plataformas con números y puertas matemáticas',
        lang: 'es',
        display: 'fullscreen',
        orientation: 'landscape',
        theme_color: '#5ec8f0',
        background_color: '#aee7ff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        // Precachea todo el build: tras la primera carga funciona 100% offline
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}']
      }
    })
  ]
})
