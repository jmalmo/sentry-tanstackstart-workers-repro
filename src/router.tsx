import { createRouter as createTanStackRouter } from '@tanstack/react-router'
// THIS IMPORT IS THE PROBLEM:
// On Workers, the 'workerd' export condition resolves to index.server.js
// which does `export * from '@sentry/node'`, pulling Node.js deps into the bundle.
import * as Sentry from '@sentry/tanstackstart-react'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
  })

  // Basic Sentry init — just enough to trigger the import
  if (typeof window !== 'undefined') {
    Sentry.init({
      dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      tracesSampleRate: 0,
    })
  }

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
