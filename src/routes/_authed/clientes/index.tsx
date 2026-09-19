import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { ClienteFormDialog } from '#/components/clientes/cliente-form-dialog'
import { listarClientes } from '#/lib/server/clientes'

export const Route = createFileRoute('/_authed/clientes/')({
  component: ClientesPage,
})

function ClientesPage() {
  const router = useRouter()
  const [novoAberto, setNovoAberto] = useState(false)

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: () => listarClientes(),
  })

  const clientes = clientesQuery.data ?? []

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/projetos" aria-label="Voltar" className="text-muted-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-bold">Clientes</h1>
        </div>
        <Button size="icon" aria-label="Novo cliente" onClick={() => setNovoAberto(true)}>
          <Plus className="size-5" />
        </Button>
      </div>

      {clientesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : clientes.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {clientes.map((cliente) => (
            <Link
              key={cliente.id}
              to="/clientes/$clienteId"
              params={{ clienteId: cliente.id }}
              className="rounded-lg border border-border bg-card p-3"
            >
              <p className="font-medium">{cliente.nome}</p>
              {cliente.bairro ? (
                <p className="text-xs text-muted-foreground">{cliente.bairro}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      <ClienteFormDialog
        open={novoAberto}
        onOpenChange={setNovoAberto}
        onCreated={(id) => router.navigate({ to: '/clientes/$clienteId', params: { clienteId: id } })}
      />
    </main>
  )
}
