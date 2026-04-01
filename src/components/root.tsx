import { Outlet } from '@tanstack/react-router'

export function RootComponent() {
  return (
    <html lang="en">
      <body>
        <h1>Sentry TanStack Start Workers Repro</h1>
        <Outlet />
      </body>
    </html>
  )
}
