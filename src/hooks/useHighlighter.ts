import { Highlight, HighlightColor, DEFAULT_HIGHLIGHT_COLOR } from '../types/index'
import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { StorageProvider } from '../storage/provider'
import {
  clearAllHighlights,
  clearAllForId,
  loadHighlights,
  removeHighlight,
  saveHighlights,
  updateHighlightColor,
} from '../storage/localStorage'

export interface UseHighlighterProps {
  id: string
  enabled?: boolean
  storageProvider?: StorageProvider
}

export interface UseHighlighterReturn {
  highlights: Highlight[]
  currentColor: HighlightColor
  setCurrentColor: (color: HighlightColor) => void
  addHighlight: (text: string, range: Highlight['range']) => void
  addHighlightWithColor: (
    text: string,
    range: Highlight['range'],
    color: HighlightColor,
  ) => string | null
  removeHighlightById: (highlightId: string) => void
  changeHighlightColor: (highlightId: string, color: HighlightColor) => void
  clearAll: () => void
  clearAllForCurrentContext: () => void
  reloadHighlights: () => void
}

/**
 * Hook for managing text highlights
 * Requires a unique id to identify the highlight context
 */
export const useHighlighter = ({
  id,
  enabled = true,
  storageProvider,
}: UseHighlighterProps): UseHighlighterReturn => {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [currentColor, setCurrentColor] = useState<HighlightColor>(DEFAULT_HIGHLIGHT_COLOR)

  // Load highlights from localStorage on mount and when id changes
  const reloadHighlights = useCallback(() => {
    if (!enabled || !id) return
    const loaded = loadHighlights(id, storageProvider)
    setHighlights(loaded)
  }, [id, enabled, storageProvider])

  useEffect(() => {
    reloadHighlights()
  }, [reloadHighlights])

  // Add a new highlight
  const addHighlight = useCallback(
    (text: string, range: Highlight['range']) => {
      if (!enabled || !id) return

      const newHighlight: Highlight = {
        id: nanoid(),
        text,
        range,
        color: currentColor,
        createdAt: Date.now(),
      }

      const updated = [...highlights, newHighlight]
      setHighlights(updated)
      saveHighlights(id, updated, storageProvider)
    },
    [enabled, id, currentColor, highlights, storageProvider],
  )

  const addHighlightWithColor = useCallback(
    (text: string, range: Highlight['range'], color: HighlightColor) => {
      if (!enabled || !id) return null

      const newHighlight: Highlight = {
        id: nanoid(),
        text,
        range,
        color,
        createdAt: Date.now(),
      }

      const updated = [...highlights, newHighlight]
      setHighlights(updated)
      saveHighlights(id, updated, storageProvider)
      return newHighlight.id
    },
    [enabled, id, highlights, storageProvider],
  )

  // Remove a highlight by ID
  const removeHighlightById = useCallback(
    (highlightId: string) => {
      if (!enabled || !id) return

      const updated = highlights.filter((h) => h.id !== highlightId)
      setHighlights(updated)
      removeHighlight(id, highlightId, storageProvider)
    },
    [enabled, id, highlights, storageProvider],
  )

  // Change highlight color
  const changeHighlightColor = useCallback(
    (highlightId: string, color: HighlightColor) => {
      if (!enabled || !id) return

      const updated = highlights.map((h) => (h.id === highlightId ? { ...h, color } : h))
      setHighlights(updated)
      updateHighlightColor(id, highlightId, color, storageProvider)
    },
    [enabled, id, highlights, storageProvider],
  )

  // Clear all highlights for current context
  const clearAll = useCallback(() => {
    if (!enabled || !id) return

    setHighlights([])
    clearAllHighlights(id, storageProvider)
  }, [enabled, id, storageProvider])

  const clearAllForCurrentContext = useCallback(() => {
    if (!enabled || !id) return
    clearAllForId(id, storageProvider)
    setHighlights([])
  }, [enabled, id, storageProvider])

  return {
    highlights,
    currentColor,
    setCurrentColor,
    addHighlight,
    addHighlightWithColor,
    removeHighlightById,
    changeHighlightColor,
    clearAll,
    clearAllForCurrentContext,
    reloadHighlights,
  }
}
