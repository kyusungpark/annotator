export type { StorageProvider } from './provider'
export {
  localStorageProvider,
  sessionStorageProvider,
  createMemoryStorageProvider,
} from './provider'

export {
  loadCompleteDataById,
  saveCompleteDataById,
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
} from './localStorage'
