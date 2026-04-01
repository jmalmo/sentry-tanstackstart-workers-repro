import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: () => (
    <div>
      <h2>About</h2>
      <p>This is a minimal repro for a Sentry + Cloudflare Workers issue.</p>
    </div>
  ),
})
