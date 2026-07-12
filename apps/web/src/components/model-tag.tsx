/** OPEN / CLOSED provenance chip (design tagOf). */
export function ModelTag({ open, size = 'sm' }: { open: boolean; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-[5px] py-px text-[9px]' : 'px-2 py-0.5 text-[10px]'
  return (
    <span
      className={`flex-none rounded font-mono ${pad}`}
      style={{
        color: open ? 'var(--open)' : 'var(--closed)',
        background: open ? 'var(--opendim)' : 'var(--closeddim)',
      }}
    >
      {open ? 'OPEN' : 'CLOSED'}
    </span>
  )
}
