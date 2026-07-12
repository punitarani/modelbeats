import { Link } from '@tanstack/react-router'
import { BrandMark } from './logo'

/**
 * Fixed sidebar per the design (210px, brand mark, mono icons) with the D16 nav
 * extension: the design's four items plus Hardware / Benchmarks / Methodology.
 */
const NAV: { label: string; to: string; icon: string; exact?: boolean }[] = [
  { label: 'Dashboard', to: '/', icon: '◧', exact: true },
  { label: 'Rankings', to: '/rankings', icon: '↕' },
  { label: 'Model Explorer', to: '/models', icon: '▤' },
  { label: 'Compare', to: '/compare', icon: '⇄' },
  { label: 'Hardware', to: '/hardware', icon: '⌗' },
  { label: 'Benchmarks', to: '/benchmarks', icon: '◫' },
  { label: 'Methodology', to: '/methodology', icon: '§' },
]

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[210px] flex-none flex-col border-r border-border bg-panel">
      <Link to="/" className="flex items-center gap-[9px] px-4 pt-4 pb-3.5 text-text no-underline">
        <span className="flex size-[22px] items-center justify-center rounded-md bg-acc text-[#0b0b0d]">
          <BrandMark className="w-[13px]" />
        </span>
        <span className="text-sm font-semibold tracking-[-0.01em]">RankedModel</span>
      </Link>
      <nav className="flex flex-col gap-px px-2 py-0.5">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact ?? false }}
            className="flex items-center gap-2 rounded-md px-2.5 py-[7px] text-[13px] text-mut no-underline hover:bg-hover hover:no-underline"
            activeProps={{
              className: 'bg-panel2 font-semibold text-text',
            }}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`w-3.5 font-mono text-[11px] ${isActive ? 'text-acc' : 'text-dim'}`}
                >
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
