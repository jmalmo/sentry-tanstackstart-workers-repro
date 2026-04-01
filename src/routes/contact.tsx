import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contact')({
  component: () => (
    <div>
      <h2>Contact</h2>
      <p>Contact page.</p>
    </div>
  ),
})
