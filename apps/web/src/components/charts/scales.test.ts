import { describe, expect, it } from 'vitest'
import {
  cadenceHeight,
  fitYWindow,
  histogramBins,
  INDEX_Y_WINDOW,
  logPos,
  normPct,
  radarAxisMeta,
  radarPolygonPoints,
  radarRings,
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
  it('clamps to the 0–100 index domain near the ceiling', () => {
    const w = fitYWindow([88, 99.5])
    expect(w.yMax).toBeLessThanOrEqual(100)
    expect(w.yMin).toBeGreaterThanOrEqual(0)
    expect(w.yMax).toBeGreaterThanOrEqual(99.5)
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

describe('radar geometry (C6)', () => {
  it('first axis points straight up from center', () => {
    const meta = radarAxisMeta(0)
    expect(Number(meta.x2)).toBeCloseTo(140, 1)
    expect(Number(meta.y2)).toBeCloseTo(126 - 92, 1)
    expect(meta.anchor).toBe('middle')
  })
  it('east-side axes anchor start, west-side anchor end', () => {
    expect(radarAxisMeta(1).anchor).toBe('start') // 30° east
    expect(radarAxisMeta(5).anchor).toBe('end') // west
  })
  it('draws four rings of six points each', () => {
    const rings = radarRings()
    expect(rings).toHaveLength(4)
    expect(rings[0]?.split(' ')).toHaveLength(6)
  })
  it('floors polygon values at 0.03 so zero-data axes stay visible', () => {
    const pts = radarPolygonPoints([0, 0, 0, 0, 0, 0])
    expect(pts.split(' ')[0]).not.toBe('140.0,126.0')
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
