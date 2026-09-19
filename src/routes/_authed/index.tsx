import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { signOut } from '#/lib/auth'

export const Route = createFileRoute('/_authed/')({
  component: HojePage,
})

function HojePage() {
  const router = useRouter()
  const { user } = Route.useRouteContext()

  async function handleSignOut() {
    await signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-8">
      <h1 className="text-2xl font-bold">Hoje</h1>
      <p className="text-sm text-muted-foreground">
        Logado como {user.email}. A agenda da escala entra na próxima etapa.
      </p>
      <Button variant="secondary" onClick={handleSignOut} className="self-start">
        Sair
      </Button>
    </main>
  )
}
