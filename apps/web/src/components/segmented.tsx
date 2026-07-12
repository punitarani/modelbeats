/** The design's segmented control (dashboard tabs, open/closed filters). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  grow = false,
}: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  grow?: boolean
}) {
  return (
    <div className="flex gap-0.5 rounded-[7px] border border-border bg-panel2 p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`cursor-pointer rounded-[5px] border-none px-2.5 py-1 text-[11.5px] ${grow ? 'flex-1' : ''} ${
              active ? 'bg-bg font-semibold text-text' : 'bg-transparent text-mut'
            }`}
            aria-pressed={active}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
