import { cadenceHeight } from './scales'

export interface Quarter {
  label: string
  count: number
  latest?: boolean
}

/** Release-cadence quarter bars (design dashboard releases tab). */
export function CadenceBars({ quarters }: { quarters: Quarter[] }) {
  const max = Math.max(1, ...quarters.map((q) => q.count))
  return (
    <div className="mt-3.5 flex h-[90px] items-end gap-[5px]">
      {quarters.map((q) => (
        <div key={q.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="font-mono text-[9.5px] text-mut">{q.count}</div>
          <div
            className="w-full rounded-t-[3px]"
            style={{
              height: cadenceHeight(q.count, max),
              background: q.latest ? 'var(--acc)' : 'var(--border2)',
            }}
          />
          <div className="whitespace-nowrap font-mono text-[8.5px] text-dim">{q.label}</div>
        </div>
      ))}
    </div>
  )
}
