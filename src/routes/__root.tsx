import { Outlet, createRootRoute } from '@tanstack/react-router'
import { RootComponent } from '../components/root'

export const Route = createRootRoute({
  component: RootComponent,
})
