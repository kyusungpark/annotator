import { Annotation, AnnotationPosition } from '../types/index'
import { useCallback, useEffect, useState } from 'react'
import { nanoid } from 'nanoid'
import { StorageProvider } from '../storage/provider'
import {
  addAnnotation,
  clearAllAnnotations as clearAllStoredAnnotations,
  clearAllForId,
  getAnnotationsForHighlight,
  loadAnnotations,
  removeAnnotation,
  removeAnnotationsForHighlight,
  updateAnnotation,
} from '../storage/localStorage'

export interface UseAnnotationsProps {
  id: string
  enabled?: boolean
  storageProvider?: StorageProvider
}

export interface UseAnnotationsReturn {
  annotations: Annotation[]
  createAnnotation: (
    text: string,
    highlightId: string | null,
    position?: AnnotationPosition,
  ) => void
  updateAnnotationText: (annotationId: string, text: string) => void
  deleteAnnotation: (annotationId: string) => void
  deleteAnnotationsForHighlight: (highlightId: string) => void
  clearAllAnnotations: () => void
  clearAllAnnotationsForCurrentContext: () => void
  getHighlightAnnotations: (highlightId: string) => Annotation[]
  reloadAnnotations: () => void
}

/**
 * Hook for managing annotations
 * Requires a unique id to identify the annotation context
 */
export const useAnnotations = ({
  id,
  enabled = true,
  storageProvider,
}: UseAnnotationsProps): UseAnnotationsReturn => {
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  // Load annotations from localStorage on mount and when id changes
  const reloadAnnotations = useCallback(() => {
    if (!enabled || !id) return
    const loaded = loadAnnotations(id, storageProvider)
    setAnnotations(loaded)
  }, [id, enabled, storageProvider])

  useEffect(() => {
    reloadAnnotations()
  }, [reloadAnnotations])

  // Create a new annotation
  const createAnnotation = useCallback(
    (text: string, highlightId: string | null, position?: AnnotationPosition) => {
      if (!enabled || !id || !text.trim()) return

      const newAnnotation: Annotation = {
        id: nanoid(),
        highlightId,
        text: text.trim(),
        position,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      addAnnotation(id, newAnnotation, storageProvider)
      setAnnotations((prev) => [...prev, newAnnotation])
    },
    [enabled, id, storageProvider],
  )

  // Update annotation text
  const updateAnnotationText = useCallback(
    (annotationId: string, text: string) => {
      if (!enabled || !id || !text.trim()) return

      updateAnnotation(id, annotationId, text.trim(), storageProvider)
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId ? { ...a, text: text.trim(), updatedAt: Date.now() } : a,
        ),
      )
    },
    [enabled, id, storageProvider],
  )

  // Delete an annotation
  const deleteAnnotation = useCallback(
    (annotationId: string) => {
      if (!enabled || !id) return

      removeAnnotation(id, annotationId, storageProvider)
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId))
    },
    [enabled, id, storageProvider],
  )

  const clearAllAnnotations = useCallback(() => {
    if (!enabled || !id) return
    clearAllStoredAnnotations(id, storageProvider)
    setAnnotations([])
  }, [enabled, id, storageProvider])

  const clearAllAnnotationsForCurrentContext = useCallback(() => {
    if (!enabled || !id) return
    clearAllForId(id, storageProvider)
    setAnnotations([])
  }, [enabled, id, storageProvider])

  // Delete all annotations for a specific highlight
  const deleteAnnotationsForHighlight = useCallback(
    (highlightId: string) => {
      if (!enabled || !id) return
      removeAnnotationsForHighlight(id, highlightId, storageProvider)
      setAnnotations((prev) => prev.filter((a) => a.highlightId !== highlightId))
    },
    [enabled, id, storageProvider],
  )

  // Get annotations for a specific highlight
  const getHighlightAnnotations = useCallback(
    (highlightId: string): Annotation[] => {
      if (!enabled || !id) return []
      return getAnnotationsForHighlight(id, highlightId, storageProvider)
    },
    [enabled, id, storageProvider],
  )

  return {
    annotations,
    createAnnotation,
    updateAnnotationText,
    deleteAnnotation,
    deleteAnnotationsForHighlight,
    clearAllAnnotations,
    clearAllAnnotationsForCurrentContext,
    getHighlightAnnotations,
    reloadAnnotations,
  }
}
