import { Annotation, Highlight, QuestionHighlightData } from '../types/index'
import { localStorageProvider, StorageProvider } from './provider'

const getEmptyQuestionData = (): QuestionHighlightData => ({ highlights: [], annotations: [] })

/**
 * Load complete data (highlights + annotations) for an id
 */
export const loadCompleteDataById = (
  id: string,
  storageProvider: StorageProvider = localStorageProvider,
): QuestionHighlightData => {
  try {
    return storageProvider.loadById(id)
  } catch (error) {
    console.error('Error loading data by id:', error)
    return getEmptyQuestionData()
  }
}

/**
 * Save complete data (highlights + annotations) for an id
 */
export const saveCompleteDataById = (
  id: string,
  data: QuestionHighlightData,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  try {
    storageProvider.saveById(id, data)
  } catch (error) {
    console.error('Error saving data by id:', error)
  }
}

// ===== HIGHLIGHT FUNCTIONS =====

export const saveHighlights = (
  id: string,
  highlights: Highlight[],
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const data = storageProvider.loadById(id)
  data.highlights = highlights
  storageProvider.saveById(id, data)
}

export const loadHighlights = (
  id: string,
  storageProvider: StorageProvider = localStorageProvider,
): Highlight[] => {
  const data = storageProvider.loadById(id)
  return data.highlights
}

export const removeHighlight = (
  id: string,
  highlightId: string,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const highlights = loadHighlights(id, storageProvider)
  const filtered = highlights.filter((h) => h.id !== highlightId)
  saveHighlights(id, filtered, storageProvider)
}

export const clearAllHighlights = (
  id: string,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const data = storageProvider.loadById(id)
  data.highlights = []
  storageProvider.saveById(id, data)
}

export const updateHighlightColor = (
  id: string,
  highlightId: string,
  newColor: Highlight['color'],
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const highlights = loadHighlights(id, storageProvider)
  const updated = highlights.map((h) => (h.id === highlightId ? { ...h, color: newColor } : h))
  saveHighlights(id, updated, storageProvider)
}

// ===== ANNOTATION FUNCTIONS =====

export const saveAnnotations = (
  id: string,
  annotations: Annotation[],
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const data = storageProvider.loadById(id)
  data.annotations = annotations
  storageProvider.saveById(id, data)
}

export const loadAnnotations = (
  id: string,
  storageProvider: StorageProvider = localStorageProvider,
): Annotation[] => {
  const data = storageProvider.loadById(id)
  return data.annotations || []
}

export const addAnnotation = (
  id: string,
  annotation: Annotation,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const annotations = loadAnnotations(id, storageProvider)
  const updated = [...annotations, annotation]
  saveAnnotations(id, updated, storageProvider)
}

export const updateAnnotation = (
  id: string,
  annotationId: string,
  text: string,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const annotations = loadAnnotations(id, storageProvider)
  const updated = annotations.map((a) =>
    a.id === annotationId ? { ...a, text, updatedAt: Date.now() } : a,
  )
  saveAnnotations(id, updated, storageProvider)
}

export const removeAnnotation = (
  id: string,
  annotationId: string,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const annotations = loadAnnotations(id, storageProvider)
  const filtered = annotations.filter((a) => a.id !== annotationId)
  saveAnnotations(id, filtered, storageProvider)
}

export const removeAnnotationsForHighlight = (
  id: string,
  highlightId: string,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const annotations = loadAnnotations(id, storageProvider)
  const filtered = annotations.filter((a) => a.highlightId !== highlightId)
  saveAnnotations(id, filtered, storageProvider)
}

export const getAnnotationsForHighlight = (
  id: string,
  highlightId: string,
  storageProvider: StorageProvider = localStorageProvider,
): Annotation[] => {
  const annotations = loadAnnotations(id, storageProvider)
  return annotations.filter((a) => a.highlightId === highlightId)
}

export const clearAllAnnotations = (
  id: string,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  const data = storageProvider.loadById(id)
  data.annotations = []
  storageProvider.saveById(id, data)
}

/**
 * Clear all highlight/annotation data for an id
 */
export const clearAllForId = (
  id: string,
  storageProvider: StorageProvider = localStorageProvider,
): void => {
  try {
    storageProvider.clearById(id)
  } catch (error) {
    console.error('Error clearing highlights from localStorage:', error)
  }
}
