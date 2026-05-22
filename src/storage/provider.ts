import { QuestionHighlightData, QuestionHighlightDataSchema } from '../types/index'

export interface StorageProvider {
  loadById: (id: string) => QuestionHighlightData
  saveById: (id: string, data: QuestionHighlightData) => void
  clearById: (id: string) => void
}

const getStorageKey = (id: string): string => `highlights.${id}`

const getEmptyQuestionData = (): QuestionHighlightData => ({ highlights: [], annotations: [] })

const parseQuestionData = (value: unknown): QuestionHighlightData => {
  const parsed = QuestionHighlightDataSchema.safeParse(value)
  return parsed.success ? parsed.data : getEmptyQuestionData()
}

const createWebStorageProvider = (getStorage: () => Storage | undefined): StorageProvider => ({
  loadById: (id: string): QuestionHighlightData => {
    try {
      const storage = getStorage()
      if (!storage) return getEmptyQuestionData()
      const stored = storage.getItem(getStorageKey(id))
      if (!stored) return getEmptyQuestionData()
      return parseQuestionData(JSON.parse(stored))
    } catch (error) {
      console.error('Error loading data by id:', error)
      return getEmptyQuestionData()
    }
  },
  saveById: (id: string, data: QuestionHighlightData): void => {
    try {
      const storage = getStorage()
      if (!storage) return
      storage.setItem(getStorageKey(id), JSON.stringify(parseQuestionData(data)))
    } catch (error) {
      console.error('Error saving data by id:', error)
    }
  },
  clearById: (id: string): void => {
    try {
      const storage = getStorage()
      if (!storage) return
      storage.removeItem(getStorageKey(id))
    } catch (error) {
      console.error('Error clearing highlights from storage:', error)
    }
  },
})

export const localStorageProvider: StorageProvider = createWebStorageProvider(() =>
  typeof window !== 'undefined' ? window.localStorage : undefined,
)

export const sessionStorageProvider: StorageProvider = createWebStorageProvider(() =>
  typeof window !== 'undefined' ? window.sessionStorage : undefined,
)

export const createMemoryStorageProvider = (
  initialData?: Record<string, QuestionHighlightData>,
): StorageProvider => {
  const storage = new Map<string, QuestionHighlightData>()
  if (initialData) {
    Object.entries(initialData).forEach(([id, data]) => {
      storage.set(id, parseQuestionData(data))
    })
  }

  return {
    loadById: (id: string) => parseQuestionData(storage.get(id) ?? getEmptyQuestionData()),
    saveById: (id: string, data: QuestionHighlightData) => {
      storage.set(id, parseQuestionData(data))
    },
    clearById: (id: string) => {
      storage.delete(id)
    },
  }
}
