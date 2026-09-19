import { useState } from 'react'
import { formatBRL } from '#/lib/format'

const WIDTH = 320
const HEIGHT = 140
const PAD_X = 12
const PAD_TOP = 16
const PAD_BOTTOM = 24

export function SaldoLineChart({
  dados,
}: {
  dados: Array<{ dataISO: string; saldo: number }>
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (dados.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há histórico suficiente pra desenhar o gráfico.
      </p>
    )
  }

  const valores = dados.map((d) => d.saldo)
  const min = Math.min(0, ...valores)
  const max = Math.max(0, ...valores)
  const range = max - min || 1

  const plotWidth = WIDTH - PAD_X * 2
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM

  const pontos = dados.map((d, i) => {
    const x = PAD_X + (i / (dados.length - 1)) * plotWidth
    const y = PAD_TOP + (1 - (d.saldo - min) / range) * plotHeight
    return { x, y, ...d }
  })

  const path = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const zeroY = PAD_TOP + (1 - (0 - min) / range) * plotHeight
  const ultimo = pontos[pontos.length - 1]
  const ativo = hoverIndex != null ? pontos[hoverIndex] : undefined

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeX = ((e.clientX - rect.left) / rect.width) * WIDTH
    let closest = 0
    let melhorDist = Infinity
    pontos.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX)
      if (dist < melhorDist) {
        melhorDist = dist
        closest = i
      }
    })
    setHoverIndex(closest)
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <line
          x1={PAD_X}
          y1={zeroY}
          x2={WIDTH - PAD_X}
          y2={zeroY}
          stroke="var(--color-border)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <path
          d={path}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={ultimo.x} cy={ultimo.y} r={4} fill="var(--color-primary)" />
        {ativo ? (
          <line
            x1={ativo.x}
            y1={PAD_TOP}
            x2={ativo.x}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--color-muted-foreground)"
            strokeWidth={1}
          />
        ) : null}
        {ativo ? <circle cx={ativo.x} cy={ativo.y} r={4} fill="var(--color-foreground)" /> : null}
      </svg>
      {ativo ? (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow"
          style={{ left: `${(ativo.x / WIDTH) * 100}%` }}
        >
          <p className="font-medium">{formatBRL(ativo.saldo)}</p>
          <p className="text-muted-foreground">
            {ativo.dataISO.split('-').reverse().join('/')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
