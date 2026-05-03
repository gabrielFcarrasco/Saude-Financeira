import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Atualiza o app automaticamente quando você subir versão nova
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GC Planner Inteligente',
        short_name: 'GC Planner',
        description: 'Gestão Financeira e Planejamento a Dois',
        theme_color: '#1a1a1a', // Cor da barra de status do celular
        background_color: '#000000', // Cor da tela de carregamento
        display: 'standalone', // Faz parecer um app nativo (sem a barra de URL do navegador)
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});