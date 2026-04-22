import { describe, it, expect } from 'vitest'

/**
 * Sanity test — proves the Vitest harness is wired up end-to-end:
 * resolver, happy-dom environment, CI step. Intentionally trivial so it
 * can't fail for any reason except the pipeline itself being broken.
 *
 * Real tests arrive per-feature on their own branches (starting with the
 * filter/sort toolbar tests on `feat/collection-filter-sort`).
 */
describe('sanity', () => {
  it('runs arithmetic', () => {
    expect(1 + 1).toBe(2)
  })

  it('has a happy-dom environment', () => {
    expect(typeof document).toBe('object')
    expect(typeof window).toBe('object')
  })
})
