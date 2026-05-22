// Re-export types
export type {
  Highlight,
  HighlightColor,
  HighlightPalette,
  HighlightRange,
  Annotation,
  AnnotationPosition,
  QuestionHighlightData,
} from './types/index'

export {
  HighlightColorEnum,
  HighlightRangeSchema,
  HighlightSchema,
  AnnotationSchema,
  AnnotationPositionSchema,
  QuestionHighlightDataSchema,
  HIGHLIGHT_COLORS,
  DEFAULT_HIGHLIGHT_COLOR,
} from './types/index'
export type { StorageProvider } from './storage/provider'

// Re-export hooks
export { useHighlighter, useAnnotations } from './hooks/index'
export type { UseHighlighterProps, UseHighlighterReturn, UseAnnotationsProps, UseAnnotationsReturn } from './hooks/index'

// Re-export components
export {
  HighlightableContent,
} from './components/index'
export type {
  HighlightableContentProps,
} from './components/index'

// Re-export storage functions
export {
  saveHighlights,
  loadHighlights,
  removeHighlight,
  clearAllHighlights,
  updateHighlightColor,
  saveAnnotations,
  loadAnnotations,
  addAnnotation,
  updateAnnotation,
  removeAnnotation,
  removeAnnotationsForHighlight,
  getAnnotationsForHighlight,
  clearAllAnnotations,
  clearAllForId,
} from './storage/localStorage'
export {
  localStorageProvider,
  sessionStorageProvider,
  createMemoryStorageProvider,
} from './storage/provider'
