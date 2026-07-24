import { describe, expect, it } from 'vitest'
import {
  cadenceHeight,
  fitYWindow,
  histogramBins,
  INDEX_Y_WINDOW,
  layoutScatterLabels,
  logPos,
  normPct,
  paretoFrontier,
  radarAxisMeta,
  radarPolygonPoints,
  radarRings,
  ratingWindow,
  SCATTER,
  scatterX,
  scatterY,
  sparklinePoints,
  sparklineX,
  sparklineY,
} from './scales'

describe('scatter scales (C6)', () => {
  it('maps the price domain edges onto the design pixel range', () => {
    expect(scatterX(0.06)).toBeCloseTo(46, 6)
    expect(scatterX(200)).toBeCloseTo(712, 6)
  })
  it('maps the index y-window edges: yMin → 296 (bottom), yMax → 26 (top label margin)', () => {
    const w = { yMin: 0, yMax: 100, yTicks: [] }
    expect(scatterY(0, w)).toBeCloseTo(296, 6)
    expect(scatterY(100, w)).toBeCloseTo(26, 6)
  })
  it('log placement: $1 sits left of the midpoint between $0.06 and $200', () => {
    const mid = (46 + 712) / 2
    expect(scatterX(1)).toBeLessThan(mid)
    expect(scatterX(10)).toBeGreaterThan(mid)
  })
})

describe('fitYWindow — auto-zoom the index axis (D22)', () => {
  it('zooms to the live range instead of the fixed 0–100 axis', () => {
    // The real priced+ranked scatter spans index 37.3 → 93.3.
    const w = fitYWindow([37.3, 93.3, 70.9, 52.9])
    expect(w.yMin).toBeGreaterThan(0) // lifted off the floor — the dead 0–37 band is gone
    expect(w.yMin).toBeLessThanOrEqual(37.3) // still contains the lowest point
    expect(w.yMax).toBeGreaterThanOrEqual(93.3) // still contains the highest point
    expect(w.yMax).toBeLessThanOrEqual(100)
  })
  it('places round, strictly-interior ticks', () => {
    const w = fitYWindow([37.3, 93.3])
    expect(w.yTicks).toEqual([40, 50, 60, 70, 80, 90])
    for (const t of w.yTicks) {
      expect(t).toBeGreaterThan(w.yMin)
      expect(t).toBeLessThan(w.yMax)
    }
  })
  it('frames a wide range with a near-frontier gridline (no floating top cluster)', () => {
    // A wide index span (≈31 → 94) must not collapse to only [40,60,80]: the ~6-interval target
    // keeps a 90 line so the 88–94 cluster stays gridded instead of hovering above the top edge.
    const w = fitYWindow([31.3, 94.4])
    expect(w.yTicks).toContain(90)
    expect(Math.max(...w.yTicks)).toBeGreaterThanOrEqual(w.yMax - 10) // a tick sits near the frontier
  })
  it('every plotted value maps inside the drawable band [top, bottom]', () => {
    const values = [37.3, 44.6, 70.9, 88.2, 93.3]
    const w = fitYWindow(values)
    for (const v of values) {
      const y = scatterY(v, w)
      expect(y).toBeGreaterThanOrEqual(26) // SCATTER.top (label margin)
      expect(y).toBeLessThanOrEqual(296) // SCATTER.bottom
    }
  })
  it('spans Elo-scale ratings — no clamp to the retired 0–100 index domain (D21)', () => {
    const w = fitYWindow([905.2, 2661.8, 3103.6])
    expect(w.yMin).toBeLessThanOrEqual(905.2)
    expect(w.yMax).toBeGreaterThanOrEqual(3103.6)
    expect(w.yTicks.length).toBeGreaterThan(3)
    for (const t of w.yTicks) {
      expect(t).toBeGreaterThan(w.yMin)
      expect(t).toBeLessThan(w.yMax)
    }
  })
  it('handles a single point without collapsing the axis', () => {
    const w = fitYWindow([70])
    expect(w.yMin).toBeLessThan(70)
    expect(w.yMax).toBeGreaterThan(70)
    expect(w.yTicks.length).toBeGreaterThan(0)
  })
  it('falls back to the full window when there is nothing to plot', () => {
    expect(fitYWindow([])).toBe(INDEX_Y_WINDOW)
  })
})

describe('layoutScatterLabels — declutter overlapping labels (D23)', () => {
  const box = (l: { x: number; y: number; text: string; anchor: 'start' | 'end' }) => {
    const width = l.text.length * 5.0
    const x0 = l.anchor === 'end' ? l.x - width : l.x
    const x1 = l.anchor === 'end' ? l.x : l.x + width
    return { x0, x1, y0: l.y - 9.94, y1: l.y + 2.98 }
  }
  const overlaps = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) =>
    a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

  it('leaves a lone label at its natural offset position', () => {
    const [out] = layoutScatterLabels([{ x: 100, y: 50, text: 'Solo Model' }])
    expect(out.anchor).toBe('start')
    expect(out.x).toBeCloseTo(108, 6) // dot x + the 8-unit offset
    expect(out.y).toBeCloseTo(50, 6) // unchanged — nothing to collide with
  })

  it('resolves a real 3-way pileup (near-identical index scores, same price)', () => {
    // Mirrors the live bug: Claude Opus 4.5 / its "(High)" sibling / GPT-5.6 all land within a
    // couple of index points and two of them share a price, so labels start on top of each other.
    const out = layoutScatterLabels([
      { x: 481, y: 43.2, text: 'Gemini 3.1 Pro' },
      { x: 341.7, y: 57.9, text: 'Nemotron 3 Ultra 550B A55B' },
      { x: 541.3, y: 59, text: 'Claude Opus 4.5' },
      { x: 541.3, y: 61.6, text: 'Claude Opus 4.5 (High)' },
      { x: 556.2, y: 62.4, text: 'GPT-5.6' },
    ])
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        expect(overlaps(box(out[i]), box(out[j]))).toBe(false)
      }
    }
  })

  it('does not perturb labels that are nowhere near each other', () => {
    const out = layoutScatterLabels([
      { x: 60, y: 280, text: 'Cheap Model' },
      { x: 650, y: 40, text: 'Priciest Model' },
    ])
    expect(out[0].y).toBeCloseTo(280, 6)
    expect(out[1].y).toBeCloseTo(40, 6)
  })

  it('flips to the left of the dot when the right offset would overflow the plot', () => {
    const [out] = layoutScatterLabels([
      { x: SCATTER.right - 10, y: 100, text: 'Long Model Name Here' },
    ])
    expect(out.anchor).toBe('end')
    expect(out.x).toBeCloseTo(SCATTER.right - 18, 6) // dot x − offset, text ends AT the dot
  })

  it('pushes down (never up) so a higher-scoring point never loses its natural position', () => {
    const out = layoutScatterLabels([
      { x: 500, y: 50, text: 'Top Scorer' },
      { x: 500, y: 51, text: 'Near-Tie' },
    ])
    expect(out[0].y).toBeCloseTo(50, 6)
    expect(out[1].y).toBeGreaterThanOrEqual(out[0].y + 13)
  })
})

describe('paretoFrontier — quality-vs-price efficient frontier (D27)', () => {
  it('keeps only non-dominated points, in ascending-price order', () => {
    // C strictly dominates B (cheaper AND better); D dominates E. A, C, D survive.
    const front = paretoFrontier([
      { id: 'A', price: 0.1, quality: 500 },
      { id: 'B', price: 1, quality: 800 },
      { id: 'C', price: 0.5, quality: 1200 },
      { id: 'D', price: 10, quality: 2000 },
      { id: 'E', price: 20, quality: 1500 },
    ])
    expect(front.map((p) => p.id)).toEqual(['A', 'C', 'D'])
  })

  it('is a monotone staircase: price strictly increases and quality strictly increases along it', () => {
    const front = paretoFrontier([
      { price: 0.06, quality: 400 },
      { price: 0.5, quality: 1500 },
      { price: 2, quality: 1200 }, // dominated by the $0.5 point
      { price: 5, quality: 2600 },
      { price: 60, quality: 3100 },
    ])
    for (let i = 1; i < front.length; i++) {
      expect(front[i].price).toBeGreaterThan(front[i - 1].price)
      expect(front[i].quality).toBeGreaterThan(front[i - 1].quality)
    }
  })

  it('collapses a price tie to the single highest-quality point', () => {
    const front = paretoFrontier([
      { id: 'lo', price: 3, quality: 900 },
      { id: 'hi', price: 3, quality: 2400 },
    ])
    expect(front.map((p) => p.id)).toEqual(['hi'])
  })

  it('drops a costlier point that only ties an earlier point on quality (no free lunch)', () => {
    const front = paretoFrontier([
      { id: 'cheap', price: 1, quality: 2000 },
      { id: 'dear', price: 9, quality: 2000 },
    ])
    expect(front.map((p) => p.id)).toEqual(['cheap'])
  })

  it('always includes the cheapest point and ends at the globally best-quality point', () => {
    const pts = [
      { id: 'cheapest', price: 0.08, quality: 550 },
      { id: 'mid', price: 2, quality: 1800 },
      { id: 'best', price: 40, quality: 3050 },
      { id: 'overpriced', price: 120, quality: 1500 },
    ]
    const front = paretoFrontier(pts)
    expect(front[0].id).toBe('cheapest')
    expect(front[front.length - 1].id).toBe('best')
  })

  it('does not mutate the input array order', () => {
    const pts = [
      { price: 10, quality: 2000 },
      { price: 1, quality: 500 },
    ]
    paretoFrontier(pts)
    expect(pts[0].price).toBe(10) // still in original order
  })

  it('handles a single point and empty input', () => {
    expect(paretoFrontier([{ price: 1, quality: 100 }])).toHaveLength(1)
    expect(paretoFrontier([])).toEqual([])
  })
})

describe('radar geometry (C6, D24 adaptive N-axis)', () => {
  it('first axis points straight up from center (default 6 axes)', () => {
    const meta = radarAxisMeta(0)
    expect(Number(meta.x2)).toBeCloseTo(140, 1)
    expect(Number(meta.y2)).toBeCloseTo(126 - 92, 1)
    expect(meta.anchor).toBe('middle')
  })
  it('east-side axes anchor start, west-side anchor end', () => {
    expect(radarAxisMeta(1).anchor).toBe('start') // 30° east
    expect(radarAxisMeta(5).anchor).toBe('end') // west
  })
  it('rings carry N points per ring, matching the axis count', () => {
    expect(radarRings()).toHaveLength(4)
    expect(radarRings()[0]?.split(' ')).toHaveLength(6) // default 6
    expect(radarRings(4)[0]?.split(' ')).toHaveLength(4) // adaptive quad
    expect(radarRings(3)[0]?.split(' ')).toHaveLength(3) // triangle
  })
  it('redistributes axes evenly — with 4 axes, axis 1 is due east', () => {
    const east = radarAxisMeta(1, 4)
    expect(Number(east.x2)).toBeCloseTo(140 + 92, 1)
    expect(Number(east.y2)).toBeCloseTo(126, 1)
  })
  it('skips null (untested) vertices instead of collapsing them to the center', () => {
    const pts = radarPolygonPoints([0.8, null, 0.6, 0.9], 4)
    expect(pts.split(' ')).toHaveLength(3) // the untested axis is omitted from the path
  })
  it('draws a real zero at the center — a measured 0 is not the same as untested', () => {
    const pts = radarPolygonPoints([0, 0.5, 0.5], 3)
    expect(pts.split(' ')[0]).toBe('140.0,126.0')
  })
})

describe('sparkline (C6)', () => {
  it('single point centers at x=140; flat series sits at y=32', () => {
    expect(sparklineX(0, 1)).toBe(140)
    expect(sparklineY(50, 50, 50)).toBe(32)
  })
  it('spans x 12→268 and y 54→10', () => {
    expect(sparklineX(0, 3)).toBe(12)
    expect(sparklineX(2, 3)).toBe(268)
    expect(sparklineY(0, 0, 100)).toBe(54)
    expect(sparklineY(100, 0, 100)).toBe(10)
    expect(sparklinePoints([0, 100])).toBe('12.0,54.0 268.0,10.0')
  })
})

describe('bars', () => {
  it('cadence bars: proportional with a 4px floor', () => {
    expect(cadenceHeight(10, 10)).toBe(62)
    expect(cadenceHeight(0, 10)).toBe(4)
  })
  it('normPct clamps outside curated bounds', () => {
    expect(normPct(70, 40, 100)).toBe(50)
    expect(normPct(10, 40, 100)).toBe(0)
    expect(normPct(null, 40, 100)).toBe(0)
  })
  it('normPct floors below-bound scores to minVisiblePct so a real value never renders an invisible bar', () => {
    expect(normPct(10, 40, 100, 3)).toBe(3) // below normMin, but a real recorded score
    expect(normPct(70, 40, 100, 3)).toBe(50) // in-range values are unaffected by the floor
    expect(normPct(null, 40, 100, 3)).toBe(0) // no data still renders no bar
  })

  it('ratingWindow spans the rendered Elo ratings for relative bars (D21)', () => {
    expect(ratingWindow([-148.2, 1000, 3103.6])).toEqual({ min: -148.2, max: 3103.6 })
  })
  it('ratingWindow pads a degenerate single-value set and survives empty input', () => {
    const single = ratingWindow([1000])
    expect(single.min).toBeLessThan(1000)
    expect(single.max).toBeGreaterThan(1000)
    const empty = ratingWindow([])
    expect(empty.max).toBeGreaterThan(empty.min)
  })
  it('ratingWindow + normPct: window ends map to 0/100, outliers clamp', () => {
    const w = ratingWindow([500, 3000])
    expect(normPct(3000, w.min, w.max)).toBe(100)
    expect(normPct(500, w.min, w.max)).toBe(0)
    expect(normPct(-2000, w.min, w.max)).toBe(0)
  })
})

describe('histogram + logPos', () => {
  it('bins values over curated bounds with edge clamping', () => {
    const bins = histogramBins([40, 55, 56, 99.9, 100], 40, 100, 6)
    expect(bins).toHaveLength(6)
    expect(bins[0]?.count).toBe(1) // 40
    expect(bins[1]?.count).toBe(2) // 55, 56 (50–60)
    expect(bins[5]?.count).toBe(2) // 99.9 + clamped 100
    expect(bins.reduce((n, b) => n + b.count, 0)).toBe(5)
  })
  it('logPos maps decades evenly', () => {
    expect(logPos(1, 1, 100)).toBe(0)
    expect(logPos(10, 1, 100)).toBeCloseTo(0.5, 10)
    expect(logPos(100, 1, 100)).toBeCloseTo(1, 10)
  })
})
