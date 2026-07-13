# Decisions & Contracts

> Locked reconciliation between `ARCHITECTURE.md`, the design handoff (`docs/design-handoff/`), and
> the competitive analysis (kept private, not tracked in this repo). Code cites these IDs. Change a
> decision here first, then in code.

## Part 1 — Decisions (D1–D20)

| # | Decision |
|---|---|
| **D1** | **Brand = RankedModel** (design prototype said "Modelboard"); keep the design's sidebar layout and typography. The prototype's λ placeholder mark was replaced with the user-supplied ranked-bars mark (2026-07-12): `components/shell/logo.tsx`, mirrored in `public/favicon.svg`, `favicon.ico`, and the apple-touch icon. |
| **D2** | **Index = curated-bounds normalization** (design), not observed min-max (arch §5 original). `benchmarks.norm_min/norm_max` columns added — distinct from display scale. Stable across publishes; reproduces design numbers exactly. Formula in C1. |
| **D3** | **Custom SVG charts only**; Recharts dropped. The design is 100% hand-rolled SVG (scatter, bars, sparkline, radar, cadence); custom components are pixel-faithful and lighter. |
| **D4** | `/models` = **card grid + facet rail** (design); `/rankings` = **dense sortable table** (TanStack Table headless with design markup). TanStack Virtual deferred until the catalog outgrows ~200 rows. |
| **D5** | Compare = **3 slots** (A/B/C, fixed colors `--acc/--open/--closed`), URL `?m=a,b,c`. Architecture's ≤6 relaxed to the designed 3. |
| **D6** | Route folds: `/leaderboards/$category` → `/rankings/$category`; `/quantizations` → model detail + `/hardware`; `/timeline` → redirect `/?tab=releases` (zoomable swim-lane timeline is post-v1). All other architecture routes ship. |
| **D7** | Capabilities: flat facet booleans (`is_reasoning`, `supports_function_calling`, `supports_tool_use`, `agent_optimized`; vision via modalities) **plus** full `capabilities` JSON incl. `coding` for the design's 6-chip detail view. |
| **D8** | Provenance: `source` enum gains **`curated`**; all v1 seed rows use it; the methodology page discloses it. Multi-source schema support retained — provenance is the brand feature. *(Superseded by D19: the real corpus's rows are tagged `self-reported \| independent \| arena`, not `curated` — the enum and the multi-source schema this decision established are unchanged, only which values ship.)* |
| **D9** | Movers = **family-succession index delta** (design; computable from a single snapshot). `model_scores.rank_delta_30d` stays nullable; the publish pipeline persists each version's scores so 30-day deltas populate from the 2nd publish onward. |
| **D10** | Prototype's component-state + hash routes become **typed URL search params** (Zod via `@tanstack/zod-adapter`) on real paths. localStorage only for: theme, hardware profile, saved comparisons. |
| **D11** | Fonts self-hosted via `@fontsource-variable/geist` + `@fontsource-variable/geist-mono` — no Google Fonts request. |
| **D12** | Theme: shadcn's **`.dark` class on `<html>`** convention; `:root` carries the design's *light* values, `.dark` the *dark* values; **default preference = dark** (design parity). Pre-hydration inline script reads `localStorage['rankedmodel.theme'] ?? 'dark'` and sets the class; `suppressHydrationWarning` on `<html>`. **No cookie-based SSR theming** — cached HTML stays user-agnostic. |
| **D13** | Search: topbar dropdown + `/` shortcut (design) + `/search?q=` results page (SEO). ⌘K palette → post-v1. |
| **D14** | `packages/ui` dropped (components live in `apps/web/src/components/`); Drizzle lives in **`packages/db`** rather than top-level `drizzle/` so the app and scripts import one workspace package. |
| **D15** | Context units: curated files store K-tokens exactly as the design does (`400` = 400K, `2000` = 2M); D1 stores absolute tokens (×1000 at seed); `fmtCtx` renders `128K` / `2M`. |
| **D16** | Sidebar nav = Dashboard, Rankings, Model Explorer, Compare, **Hardware, Benchmarks, Methodology** (design's 4 + 3 additions, same item styling). The design's footer stats block (counts · snapshot version · disclaimer) was removed per user direction (2026-07-12); snapshot counts/version stay visible on `/debug/catalog`, and curation/freshness is disclosed on `/methodology`. |
| **D17** | Server surface = **two functions**: `getCatalog` (KV snapshot, D1 fallback) and `getModel(slug)` (deep detail: multi-source results, quantizations, throughput, pricing, lineage). Everything else is pure **selectors in `packages/shared`** over the snapshot — unit-testable, identical on server and client. Preserves the architecture's two-read-path split without per-screen server functions. |
| **D18** | **No native `<select>` anywhere** — all dropdowns are shadcn on Base UI, via two app wrappers: `FilterSelect` (plain `Select`; short static lists — size class, GPU facet, sort, hardware profile) and `SearchSelect` (`Combobox` with a select-look trigger and an in-popup search input; long lists — model pickers and org filters). Both keep the compact design-token field look, `aria-label`s, `data-testid`s, and URL-state `onValueChange` semantics; triggers render the selected label as SSR text (e2e asserts text, not form values). |
| **D20** | **Heterogeneous-coverage scoring fixes (2026-07-13)** — the real dataset's benchmark coverage is wildly uneven (9→204 models per benchmark, vs. the synthetic seed where all 55 models shared one 10-benchmark basket), which exposed two ways the naive "mean of normalized scores over whatever a model has" index produced a nonsense leaderboard (a 1-benchmark model ranked #1; the true frontier — GPT-5.2, Claude Opus, Grok 4 — buried below a 2023 GPT-4). Both are fixed at the data/engine layer so SSR, client, and goldens agree: **(a) norm bounds recalibrated to real near-SOTA** — `normMax` for every benchmark set to a curated near-SOTA ceiling (HLE 100→48, ARC-AGI-2 100→82, agents-last-exam 100→56, …) so a frontier score on a hard benchmark maps high, not low; recalibrated **once** as curated constants held stable (still not observed-min/max per publish — D2 preserved), and the generator's bound-fit guard now also warns on too-loose bounds, not just too-tight. **(b) A minimum-coverage ranking gate** (`scoring.ts` `isRankEligible`: ≥3 benchmarks across ≥2 categories): the Index value is still computed and shown for every model, but only rank-eligible models receive a `rank` (`derive.ts`; snapshot `rank` is now nullable + a `ranked` flag; D1 gains a `ranked` column, migration `0002`). Selectors sort ranked-first; the UI shows sub-floor models as `unrated`; movers only span ranked lineage edges (killing the phantom "+70.6 vs an unbenchmarked config" mover). Also fixed alongside: **5 duplicate benchmark slugs merged** (aime-2025→aime, alpacaeval→alpaca-eval, bigbench→big-bench, gqa-vqa→gqa, okvqa→ok-vqa) that were fragmenting coverage and double-counting AIME; **the CORE rankings columns are now coverage-filtered** era-spanning candidates (drop arena/tau-bench/mmmu which are near-empty; keep mmlu/gpqa/hle/math/aime/humaneval/livecodebench/swe-bench); **the dashboard is regrounded on the universal Index** (quality-vs-price scatter, top-ranked rail, open-closed gap, frontier widget — arena was only 13 models); **compare only renders benchmark rows a selected model actually has** (was a 5,400px wall of em-dashes over 122 benchmarks, default pair shared zero); **a unit-aware `fmtScore` helper** stops non-% benchmarks (Elo, /10, F1) rendering as bogus percentages; and the **predecessor assignment prefers the canonical config** over effort variants so lineage reads "Opus 4.6 succeeds Opus 4.5", not "…(Medium)". This revises D19(c) and D19(f): the CORE set is coverage-driven (not one-per-category), and a sparse model no longer ranks #1 — it's unrated. |
| **D19** | **Real dataset (2026-07-12)**: the synthetic 55-model design-parity seed (`convert-design-data.ts`, all `source=curated`) was fully replaced by a real, provenance-honest corpus — every major LLM release from GPT-3 (2020-06) through mid-2026 (**463 models · 78 orgs · 255 families · 122 benchmarks · 1785 results · 12 GPUs**), researched and adversarially verified, committed as an auditable `corpus/` tree and compiled to `/data` by a deterministic generator (`scripts/src/generate-dataset.ts`, successor to `convert-design-data.ts`). Consequences: (a) **D8 is superseded** — the real `source` values are `self-reported \| independent \| arena` (no `curated`/`admin-run` rows exist yet), each shown via a per-row provenance badge, never collapsed; (b) the 7-category enum and C1 scoring formula are **unchanged** — this was a data change, not an engine change; (c) rankings columns became a curated **CORE** subset (`arena` + one flagship per category) on the default view, with category subpages (`/rankings/$category`) showing every benchmark actually in that category (`apps/web/src/lib/search.ts` `CORE_RANKINGS_SLUGS`) — see the updated C1/C6 notes below; (d) `/rankings` and `/models` gained **TanStack Virtual** (mounted-gate SSR pattern: first paint renders the full list/grid unvirtualized so there's no hydration size mismatch, then the client swaps to a windowed render) since the real catalog no longer fits comfortably unvirtualized; (e) default/comparison slugs (`compare.tsx`, `overview-tab.tsx`, `model-detail-screen.tsx`, `hardware-screen.tsx`) are now catalog-derived (top-by-index, top-open) with a corpus-guaranteed literal only as the static schema fallback — no fictional slugs remain anywhere in app code; (f) a real, sparse-coverage model can legitimately rank #1 overall or leave a dashboard widget (e.g. the open/closed Arena frontier) empty — C1's "missing scores excluded, not penalized" is unchanged, real data just makes the edge case visible. |

## Part 2 — Contracts (C1–C7)

Single source of truth: `packages/shared`. Every consumer (pipeline, server functions, UI) imports these.

### C1 — Scoring (`packages/shared/src/scoring.ts`)

Must reproduce the design prototype exactly (golden-tested against `docs/design-handoff/project/data/llm-data.js`):

```
norm(b, v)   = v == null ? null : clamp((v − b.norm_min) / (b.norm_max − b.norm_min), 0, 1)
               # norm_min/norm_max are curated near-baseline/near-SOTA constants (D2, D20),
               # NOT observed min/max — so being tested on a hard benchmark isn't a penalty
index(m)     = round(mean(norm over benchmarks with a score) × 1000) / 10   # 0–100, 0.1 step; missing excluded, no coverage penalty
ranked(m)    = coverage gate (D20): ≥3 benchmarks across ≥2 categories. index is computed for
               ALL models but only ranked models get a rank; unrated models sort last, index shown
categoryIdx  = same mean restricted to the category's benchmarks
radar axes   = PREF/KNOW/REASON/CODE/MATH/AGENT = categoryIdx for human-preference/knowledge/
               reasoning/coding/math/agents — each category's mean is over EVERY benchmark
               tagged with that category (data-driven, not a fixed 1–2 slug list; D19)
movers       = per lineage edge (model vs its predecessor): Δindex where Δ>0, sorted desc, top 5
               — BOTH endpoints must be rank-eligible (D20), else a 0-index unbenchmarked config
               fabricates a huge phantom gain; same-day releases have no predecessor, no mover
ranks        = dense rank by index desc (overall) and per benchmark by raw score desc
```

### C2 — Hardware fit (`packages/shared/src/hardware-fit.ts`)

- `required_gb = vram_q4 × 1.08` — curated `vram_q4` first; fallback estimate `params_total_b × bits/8 × 1.08` only when curated data is missing.
- Verdict, with `ratio = required_gb / capacity_gb`: `≤ 0.8` **fits-comfortably** · `≤ 1.0` **fits-tight** · `≤ 1.3` **offload-partial** · else **won't-run**.
- Boolean design parity (explorer facet, fits-on chips) = `ratio ≤ 1.0`.
- tok/s comes only from an exact `throughput_estimates` row; otherwise `null`, labeled "no data" (no interpolation in v1).
- MoE: memory needs follow **total** params (all experts resident); speed correlates with **active** params — both surfaced.

### C3 — Catalog snapshot (`packages/shared/src/snapshot.ts`)

Three-way contract: the publish pipeline writes it, `getCatalog` parses it, the UI consumes it.

```ts
{ version: number, asOf: string,
  benchmarks: [{ slug, name, category, unit, description, normMin, normMax }],
  gpus: [{ slug, name, kind, vramGb }],
  models: [{ slug, name, org, orgSlug, family, familySlug, date, open, status,
             params, active, ctxK, arch, license, langs, modalities[], caps{6},
             bench: Record<benchSlug, number|null>, benchSources: Record<benchSlug, source> (D8), price: {i,o}|null,
             vramQ4, vramFp16, quants[], tps4090, tpsNote,
             links{hf?,gh?,docs?,api?}, note,
             index, rank, categoryIdx: Record<category, number|null> }] }
```

Derived fields (`index/rank/categoryIdx`) are precomputed at publish; normalization bounds ship so bar-percent math stays client-side. KV key `catalog:v{N}` is immutable; `meta.data_version` in D1 is authoritative.

### C4 — URL search-param conventions (`apps/web/src/lib/search.ts`)

Every param optional-with-fallback (invalid → default, never throw) via plain Zod v4 `.default().catch()` passed straight to `validateSearch` (Standard Schema). `@tanstack/zod-adapter` is deliberately NOT used — it pins its own zod 3 and collapses search typing. Compact keys: `?tab=` · `?sort=-index` (leading `-` = desc) · `?org=` · `?open=all|open|closed` · `?size=any|s|m|l|xl|undisclosed` · `?gpu=` · `?caps=fc,tools` · `?q=` · `?m=a,b,c` · `?cat=`.

### C5 — Design tokens (from the dc.html, exact)

| var | dark (default pref) | light |
|---|---|---|
| bg | `#0b0b0d` | `#f6f6f7` |
| panel | `#101013` | `#ffffff` |
| panel2 | `#17171b` | `#f0f0f2` |
| card | `#121216` | `#ffffff` |
| border | `#222229` | `#e4e4e8` |
| border2 | `#2e2e37` | `#d2d2d9` |
| text | `#ececf1` | `#191920` |
| mut | `#9a9aa5` | `#5f5f6b` |
| dim | `#60606b` | `#9c9ca4` |
| acc | `#7aa7ff` | `#3565c8` |
| accdim | `rgba(122,167,255,.13)` | `rgba(53,101,200,.09)` |
| open | `#4cc38a` | `#178a56` |
| opendim | `rgba(76,195,138,.13)` | `rgba(23,138,86,.1)` |
| closed | `#b491f5` | `#7a50d6` |
| closeddim | `rgba(180,145,245,.14)` | `rgba(122,80,214,.1)` |
| bar | `#26262e` | `#e9e9ee` |
| hover | `#1a1a20` | `#f2f2f5` |

Geist (400–700) body · Geist Mono (400–600) for numerals/labels/uppercase microcopy · radii 6–10px · `fadeup` .18s ease entrance · custom scrollbar + `::selection: var(--accdim)`.

### C6 — Chart math (`apps/web/src/components/charts/`)

- **Scatter** (quality vs price, viewBox 720×320): `x = 46 + (log10(p) − log10(0.06)) / (log10(200) − log10(0.06)) × (712 − 46)`; y-axis is **data-driven since D19** — `eloWindow(arenaBounds.normMin, arenaBounds.normMax)` computes 4 evenly-spaced round-to-10 ticks and the elo↔y mapping from the live `arena` benchmark's curated bounds (currently 1150–1520), not a hardcoded literal; x ticks `{$0.1,$1,$10,$100}`.
- **Radar** (viewBox 280×260): center (140,126), r 92, 6 axes starting −π/2 stepping π/3, rings at .25/.5/.75/1, floor value 0.03.
- **Family sparkline** (viewBox 280×64): x 12→268 evenly (single point → x 140), y 54→10 min-max scaled (flat series → y 32).
- **Cadence bars**: height = count/max × 62px, min 4px; latest quarter colored `--acc`, rest `--border2`; bars have a fixed 30px minimum width inside a horizontally-scrollable row since D19 (25+ real quarters vs. the design's handful), auto-scrolled to the latest quarter on mount.
- **Arena rail bars**: `arenaPct(elo, arenaBounds.normMin, arenaBounds.normMax)` — same live-bounds derivation as the scatter, not a hardcoded `1250` floor (D19).
- **Params-vs-score scatter** (`benchmark-detail.tsx`): log-x domain widened to `[0.5, 3000]` (D19) to fit the real corpus range (1.1B–2400B) with headroom on both ends; x is clamped to the chart's plot area exactly like the existing y-clamp.
- **Formatters** (`packages/shared/src/format.ts`): `fmtParams` → `70B` / `400B·17Ba` (MoE) / `—`; `fmtCtx` → `128K` / `2M` (≥1000K); `fmtPrice` → `$2.5/$20` / `weights` (open, no API) / `—`; `fmtDate` → `May 2026` / `May 14, 2026` (long).

### C7 — Caching

- `/api/catalog/v{N}.json` → `Cache-Control: public, max-age=31536000, immutable`.
- SSR HTML → `public, s-maxage=3600, stale-while-revalidate=86400` + `x-data-version` header.
- TanStack Query: catalog `staleTime: Infinity` (version-keyed), `getModel` 1 h.
- Invalidation = data-version bump (new KV key, new query keys); nothing is ever purged.
