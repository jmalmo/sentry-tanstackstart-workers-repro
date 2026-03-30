import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type PluginOption } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['fsevents'],
    },
  },
  ssr: {
    external: ['fsevents'],
    // No explicit ssr.resolve.conditions — Nitro's cloudflare-module preset
    // automatically adds 'workerd' and 'worker' conditions, which causes
    // @sentry/tanstackstart-react to resolve its workerd export condition
    // → index.server.js → re-exports @sentry/node.
  },
  plugins: [
    tanstackStart(),
    // This is the only config that matters for the repro:
    // cloudflare-module preset + noExternals bundles everything into the Worker,
    // and Nitro automatically sets workerd/worker conditions.
    nitro({
      preset: 'cloudflare-module',
      noExternals: true,
    }) as PluginOption,
    react(),
  ],
  resolve: {
    alias: {
      'react-dom/server': 'react-dom/server.node',
    },
  },
})
