import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { listSaved, removeComparison, type SavedComparison } from '#/lib/saved'

export const Route = createFileRoute('/saved')({
  head: () => ({ meta: [{ title: 'Saved comparisons · RankedModel' }] }),
  component: SavedRoute,
})

function SavedRoute() {
  // localStorage is client-only; render empty on the server and fill after mount.
  const [items, setItems] = useState<SavedComparison[] | null>(null)
  if (typeof window !== 'undefined' && items === null) setItems(listSaved())
  const list = items ?? []

  return (
    <div className="max-w-[720px] animate-fadeup px-6 py-5 pb-10">
      <h1 className="text-lg font-semibold tracking-[-0.02em]">Saved comparisons</h1>
      <div className="mt-0.5 text-xs text-mut">
        Stored in this browser only (no accounts in v1). Save from the{' '}
        <Link to="/compare">compare view</Link>.
      </div>
      <div className="mt-4 flex flex-col gap-1.5" data-testid="saved-list">
        {list.length === 0 && (
          <div className="rounded-[10px] border border-border bg-card px-4 py-6 text-center text-xs text-mut">
            Nothing saved yet.
          </div>
        )}
        {list.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-4 py-2.5"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-semibold">{s.name}</div>
              <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10.5px] text-dim">
                {s.m.replaceAll(',', ' · ')}
              </div>
            </div>
            <Link
              to="/compare"
              search={{ m: s.m }}
              className="ml-auto rounded-md border border-border bg-panel2 px-2.5 py-1 text-[11.5px] text-mut no-underline hover:text-text"
            >
              Open
            </Link>
            <button
              type="button"
              onClick={() => setItems(removeComparison(s.name))}
              className="cursor-pointer rounded-md border border-border bg-panel2 px-2.5 py-1 text-[11.5px] text-mut hover:text-text"
              aria-label={`Delete ${s.name}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
