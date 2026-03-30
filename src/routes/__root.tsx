import { Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <html lang="en">
      <body>
        <h1>Sentry TanStack Start Workers Repro</h1>
        <Outlet />
      </body>
    </html>
  ),
})
