import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { BottomNav } from '#/components/bottom-nav'
import { getCurrentUser } from '#/lib/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    return { user }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      <BottomNav />
    </div>
  )
}
