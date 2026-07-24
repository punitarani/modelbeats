import { searchModels } from '@modelbeats/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ModelTag } from '#/components/model-tag'
import { catalogQueryOptions } from '#/lib/catalog'

/** How many matching benchmarks the dropdown surfaces beneath the model hits. */
const BENCH_LIMIT = 5

/**
 * Design topbar search: instant dropdown (top 8 models + matching benchmarks over
 * name/org/family/slug) with `/` focus shortcut, ↑↓/Enter keyboard nav, Esc to close.
 * ↑↓ move across the combined model+benchmark list; Enter opens the highlighted hit, or
 * falls through to the full /search page when nothing is highlighted (D13).
 */
export function TopbarSearch() {
  const { data } = useSuspenseQuery(catalogQueryOptions)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)

  const models = searchModels(data.models, q)
  const needle = q.trim().toLowerCase()
  const benchmarks = needle
    ? data.benchmarks
        .filter((b) => b.name.toLowerCase().includes(needle) || b.slug.includes(needle))
        .slice(0, BENCH_LIMIT)
    : []
  // Flat, cursor-indexed view over both groups: models first, then benchmarks.
  const items = [
    ...models.map((m) => ({ kind: 'model' as const, slug: m.slug })),
    ...benchmarks.map((b) => ({ kind: 'benchmark' as const, slug: b.slug })),
  ]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = document.activeElement
      if (e.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(target?.tagName ?? '')) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const open = (item: { kind: 'model' | 'benchmark'; slug: string }) => {
    setQ('')
    if (item.kind === 'model') navigate({ to: '/models/$slug', params: { slug: item.slug } })
    else navigate({ to: '/benchmarks/$slug', params: { slug: item.slug } })
  }

  return (
    <div className="relative ml-auto max-w-[420px] flex-1">
      <input
        ref={inputRef}
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setCursor(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setQ('')
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setCursor((c) => Math.min(items.length - 1, c + 1))
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setCursor((c) => Math.max(0, c - 1))
          }
          if (e.key === 'Enter' && q.trim()) {
            const hit = items[cursor]
            if (hit) open(hit)
            else {
              setQ('')
              navigate({ to: '/search', search: { q } })
            }
          }
        }}
        placeholder="Search models, benchmarks…  ( / )"
        aria-label="Search models, benchmarks and organizations"
        className="w-full rounded-[7px] border border-border bg-panel2 px-[11px] py-1.5 text-[12.5px] text-text outline-none focus:border-acc"
        data-testid="topbar-search"
      />
      {items.length > 0 && (
        <div
          className="absolute top-[34px] right-0 left-0 animate-fadeup overflow-hidden rounded-lg border border-border2 bg-panel shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
          data-testid="search-dropdown"
        >
          {models.length > 0 && (
            <div className="px-3 pt-2 pb-1 font-mono text-[9px] uppercase tracking-[0.07em] text-dim">
              Models
            </div>
          )}
          {models.map((m, i) => (
            <button
              key={m.slug}
              type="button"
              // mousedown beats input blur ordering
              onMouseDown={(e) => {
                e.preventDefault()
                open({ kind: 'model', slug: m.slug })
              }}
              className={`flex w-full cursor-pointer items-baseline gap-2 border-b border-border px-3 py-2 text-left ${
                i === cursor ? 'bg-hover' : ''
              }`}
            >
              <span className="text-[12.5px] font-semibold">{m.name}</span>
              <span className="text-[11px] text-mut">{m.org}</span>
              <span className="ml-auto">
                <ModelTag open={m.open} />
              </span>
            </button>
          ))}
          {benchmarks.length > 0 && (
            <div className="px-3 pt-2 pb-1 font-mono text-[9px] uppercase tracking-[0.07em] text-dim">
              Benchmarks
            </div>
          )}
          {benchmarks.map((b, i) => {
            const idx = models.length + i
            return (
              <button
                key={b.slug}
                type="button"
                data-testid="search-benchmark"
                // mousedown beats input blur ordering
                onMouseDown={(e) => {
                  e.preventDefault()
                  open({ kind: 'benchmark', slug: b.slug })
                }}
                className={`flex w-full cursor-pointer items-baseline gap-2 border-b border-border px-3 py-2 text-left ${
                  idx === cursor ? 'bg-hover' : ''
                }`}
              >
                <span className="text-[12.5px] font-semibold">{b.name}</span>
                <span className="text-[11px] text-mut">{b.category}</span>
                <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.06em] text-dim">
                  {b.unit}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
