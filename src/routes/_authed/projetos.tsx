import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/projetos')({
  component: ProjetosPage,
})

function ProjetosPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-8">
      <h1 className="text-2xl font-bold">Projetos</h1>
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </main>
  )
}
