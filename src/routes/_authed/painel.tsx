import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { SaldoLineChart } from '#/components/painel/saldo-line-chart'
import { formatBRL } from '#/lib/format'
import { obterResumoFinanceiro } from '#/lib/server/painel'

export const Route = createFileRoute('/_authed/painel')({
  component: PainelPage,
})

function labelPrevisao(
  previsao: Awaited<ReturnType<typeof obterResumoFinanceiro>>['previsao'],
): string {
  switch (previsao.tipo) {
    case 'insuficiente':
      return 'Dados insuficientes (menos de 2 projetos concluídos ainda).'
    case 'positivo':
      return 'Você já está positivo!'
    case 'sem_tendencia':
      return 'Sem lucro nos últimos 60 dias pra estimar quando você fica positivo.'
    case 'estimativa':
      return `Nesse ritmo, previsão de ficar positivo em ~${previsao.diasParaEmpatar} dias (${previsao.dataEstimadaISO.split('-').reverse().join('/')}).`
  }
}

function PainelPage() {
  const query = useQuery({
    queryKey: ['resumo-financeiro'],
    queryFn: () => obterResumoFinanceiro(),
  })

  if (query.isLoading) {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    )
  }

  const resumo = query.data
  if (!resumo) return null

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold">Painel</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldo do negócio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p
            className={`text-3xl font-bold ${resumo.saldoNegocio >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {formatBRL(resumo.saldoNegocio)}
          </p>
          {resumo.faltaEmpatar > 0 ? (
            <p className="text-sm text-muted-foreground">
              Falta {formatBRL(resumo.faltaEmpatar)} pra empatar.
            </p>
          ) : null}
          <SaldoLineChart dados={resumo.serieSaldo} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Previsão</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{labelPrevisao(resumo.previsao)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Investido em ferramentas</span>
            <span>{formatBRL(resumo.totalInvestidoFerramentas)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total recebido</span>
            <span>{formatBRL(resumo.totalRecebido)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gasto em materiais</span>
            <span>{formatBRL(resumo.totalGastoMateriais)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-medium">
            <span>Lucro acumulado</span>
            <span>{formatBRL(resumo.lucroAcumulado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor médio da sua hora</span>
            <span>
              {resumo.valorMedioHora != null ? `${formatBRL(resumo.valorMedioHora)}/h` : '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
