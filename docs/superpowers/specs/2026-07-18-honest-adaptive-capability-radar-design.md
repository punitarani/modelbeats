# Honest & adaptive capability radar (D24)

**Status:** approved 2026-07-18 · **Scope:** Compare page capability profile · **Supersedes:** the `?? 0`
missing-data behaviour of the radar introduced with the compare view.

## Problem

The Compare page's "Capability profile" radar reads **0 on any axis a model has no benchmark for**,
collapsing that axis to the chart centre. Because the axis coordinate for "untested" is identical to
"scored zero", the polygon caves in on gaps and they read as *weaknesses*.

Measured over the live corpus (537 models):

- Only **8.6%** of models have data on all 6 radar axes; **91.4%** collapse at least one axis.
- The two sparsest axes are structural: **AGENT** is missing for 70.6% of models and **PREF**
  (= Arena/LMArena Elo) for 68.5% — these evaluations don't exist for most legacy/small models.
- It is worst exactly where users compare most: **GPT-5.6 shows 4/6 axes, Kimi K3 shows 3/6**, both
  missing PREF and KNOW. Frontier labs abandon saturated benchmarks (MMLU → the KNOW axis) and only
  publish newer hard ones (GPQA/HLE, filed under *reasoning*), so the flagships are the emptiest.

**Root cause (mechanism):** an information-losing contract at a component boundary. `categoryIdx`
carries a three-valued signal (score / real-zero / untested=`null`), but `RadarSeries.values:
number[]` is two-valued. The call site (`compare-screen.tsx`) coerces `null → 0`, and
`radarPolygonPoints` floors the vertex to 3% radius — a deep dent toward centre. `categoryIdx`
already stores `null` correctly; the fix begins by not destroying it at the boundary.

## Design

### A. Widen the contract (enabler)

`RadarSeries.values` becomes `(number | null)[]`; `null` = untested. `compare-screen.tsx` stops
doing `?? 0` and passes `categoryIdx[cat]` through. `radarPolygonPoints` **skips** `null` vertices
(no more 3% floor; a real `0` still draws a vertex at centre — real zeros remain honest).

### B. Adaptive axes — chart only what's covered

For a comparison, render only the axes at least one selected model covers (the **union** of covered
categories), in canonical `RADAR_AXES` order, **redistributed evenly** around the circle so N covered
axes form a clean N-gon (4 axes → a quad, not 6 with two gaps). Axis selection is a pure function,
`selectRadarAxes(categoryIdxs)`, in `packages/shared`. Accepted trade-off: the axis set changes as
models are swapped — the cost of "always reads complete".

### C. Honest rendering of remaining gaps

When an axis *is* shown (another model covers it) but *this* model does not: the model's polygon
**skips that vertex**, and a small hollow, dashed, model-coloured ring marks the axis rim = "untested
here". Covered vertices also get a small filled dot (keeps 1–2-point degenerate series visible and
values legible).

### D. Coverage indicator + interactivity

- Each legend row shows a `covered/6` badge (counted over the full 6-axis `categoryIdx`).
- Hovering an axis shows a tooltip: per model, the benchmarks + scores that rolled into that
  category, or "Untested". Turns the silhouette into something interrogable — the biggest
  "much better" lever. Implemented as an HTML overlay positioned in the SVG's viewBox coordinates.

### E. Edge cases

- **< 3 covered axes total** (a radar degenerates below a triangle): fall back to a compact
  per-category bar list for that comparison, with an explicit "Untested" state per empty category.
- **Single model / 3 models:** same union logic.
- Caption replaced: instead of "an axis reads 0 where…", note which axes are *hidden* because no
  selected model covers them (e.g. "PREF · KNOW hidden — untested by all selected").

### F. Track B — targeted backfill (parallel, data)

Raise coverage where frontier models *still report*, via the existing corpus research + adversarial
verify workflow — **not** by inventing numbers:

- **KNOW** → `simpleqa`, `mmlu-pro` for the newest flagships;
- **PREF** → `arena` Elo where LMArena has published it.
- **Flag, don't auto-change:** GPQA/HLE currently map to *reasoning*; a case exists for *knowledge*.
  Surface as a decision, don't silently re-map.

Per the saturation insight, backfill lifts the top of the field but cannot reach 6/6 for everyone —
which is why B/C carry the visualization regardless of data depth.

## Affected units

- `packages/shared/src/scoring.ts` — add `selectRadarAxes()`; unit-tested in `scoring.test.ts`.
- `apps/web/src/components/charts/scales.ts` — generalize radar geometry to N axes
  (`radarPoint`/`radarPolygonPoints`/`radarRings`/`radarAxisMeta` take `axisCount`; polygon skips
  `null`); `scales.test.ts` updated.
- `apps/web/src/components/charts/radar.tsx` — rewrite: `axes` prop, `(number|null)[]` series,
  untested markers, vertex dots, hover tooltip.
- `apps/web/src/components/compare/compare-screen.tsx` — adaptive-axis selection, `<3`-axis bar
  fallback, coverage badges, hidden-axes caption, tooltip data.
- `apps/web/src/routes/debug.charts.tsx` — update `<Radar>` to new props.
- `apps/web/e2e/compare.spec.ts` — update polygon-count expectations; assert untested is *absent*
  from the polygon path, not drawn at 0.

## Non-goals

- No change to how `categoryIdx` is derived (means of normalized scores stand).
- No re-taxonomy of benchmarks in this change (Track B flags GPQA/HLE only).
- Radar stays the chart form (an improved radar, not a replacement).
