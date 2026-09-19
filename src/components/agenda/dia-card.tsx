import { useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Checkbox } from '#/components/ui/checkbox'
import { AgendarServicoDialog } from '#/components/agenda/agendar-servico-dialog'
import {
  HORARIOS_FIXOS,
  getJanelaDia,
  isFimDeSemana,
  labelDataCurta,
  labelDiaSemana,
} from '#/lib/agenda'
import { labelTipoProjeto } from '#/lib/projeto-tipos'
import type { ServicoAgendado } from '#/lib/server/servicos-agendados'

export function DiaCard({
  dataISO,
  referenciaISO,
  destaque,
  servicos,
  treinou,
  onToggleTreino,
}: {
  dataISO: string
  referenciaISO: string
  destaque?: boolean
  servicos: Array<ServicoAgendado>
  treinou?: boolean
  onToggleTreino?: (treinou: boolean) => void
}) {
  const [agendarAberto, setAgendarAberto] = useState(false)
  const janela = getJanelaDia(dataISO, referenciaISO)
  const fimDeSemana = isFimDeSemana(dataISO)

  return (
    <Card className={destaque ? 'border-primary/60' : undefined}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">
              {destaque ? 'Hoje' : labelDiaSemana(dataISO)} · {labelDataCurta(dataISO)}
            </p>
          </div>
          <Badge variant={janela.tipo === 'plantao' ? 'default' : 'secondary'}>
            {janela.tipo === 'plantao' ? 'Dia de plantão' : 'Pós-plantão'}
          </Badge>
        </div>

        {janela.tipo === 'plantao' ? (
          <div className="text-sm text-muted-foreground">
            <p>
              Janela livre: <span className="text-foreground">{janela.janelaInicio}–{janela.janelaFim}</span>
            </p>
            <p>Entra no plantão às {HORARIOS_FIXOS.entradaPlantao}.</p>
            {!fimDeSemana ? <p>Buscar Miguel às {HORARIOS_FIXOS.buscaMiguel}.</p> : null}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>Sem serviço — saiu do plantão às {HORARIOS_FIXOS.saidaPlantao}.</p>
            <p>
              Academia {HORARIOS_FIXOS.academiaInicio}–{HORARIOS_FIXOS.academiaFim}, depois
              descanso.
            </p>
          </div>
        )}

        {janela.tipo === 'pos_plantao' ? (
          <label className="flex w-fit items-center gap-2 text-sm">
            <Checkbox
              checked={!!treinou}
              onCheckedChange={(checked) => onToggleTreino?.(checked === true)}
            />
            Treinei hoje
          </label>
        ) : null}

        {servicos.length > 0 ? (
          <div className="flex flex-col gap-1">
            {servicos.map((servico) => (
              <div
                key={servico.id}
                className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground"
              >
                <p className="font-medium">{servico.titulo}</p>
                <p className="text-xs opacity-80">
                  {labelTipoProjeto(servico.tipo)}
                  {servico.horaInicioAgendada ? ` · ${servico.horaInicioAgendada}` : ''}
                  {servico.horaFimAgendada ? `–${servico.horaFimAgendada}` : ''}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {janela.disponivelParaServico ? (
          <Button variant="outline" size="sm" onClick={() => setAgendarAberto(true)}>
            <CalendarPlus className="size-4" />
            Agendar serviço
          </Button>
        ) : null}
      </CardContent>

      <AgendarServicoDialog
        open={agendarAberto}
        onOpenChange={setAgendarAberto}
        dataISO={dataISO}
        janelaInicio={janela.janelaInicio}
        janelaFim={janela.janelaFim}
      />
    </Card>
  )
}
