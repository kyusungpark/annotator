import { describe, it, expect } from 'vitest'

describe('Annotator Package Exports', () => {
  it('should export main module', async () => {
    const mod = await import('@stargiraffe/annotator')
    expect(mod).toBeDefined()
  })

  it('should export components from /components', async () => {
    const mod = await import('@stargiraffe/annotator/components')
    expect(mod.HighlightableContent).toBeDefined()
  })

  it('should export hooks from /hooks', async () => {
    const mod = await import('@stargiraffe/annotator/hooks')
    expect(mod.useHighlighter).toBeDefined()
    expect(mod.useAnnotations).toBeDefined()
  })

  it('should export types from /types', async () => {
    const mod = await import('@stargiraffe/annotator/types')
    expect(mod.HIGHLIGHT_COLORS).toBeDefined()
  })

  it('should export storage utilities from /storage', async () => {
    const mod = await import('@stargiraffe/annotator/storage')
    expect(mod.loadHighlights).toBeDefined()
    expect(mod.saveHighlights).toBeDefined()
    expect(mod.clearAllForId).toBeDefined()
    expect(mod.loadAnnotations).toBeDefined()
    expect(mod.saveAnnotations).toBeDefined()
    expect(mod.localStorageProvider).toBeDefined()
    expect(mod.sessionStorageProvider).toBeDefined()
    expect(mod.createMemoryStorageProvider).toBeDefined()
  })

  it('should have proper types available', async () => {
    const components = await import('@stargiraffe/annotator/components')
    const types = await import('@stargiraffe/annotator/types')

    // Verify HighlightableContent component exists
    expect(components.HighlightableContent).toBeDefined()

    // Verify HIGHLIGHT_COLORS enum exists
    expect(types.HIGHLIGHT_COLORS).toBeDefined()
  })
})
