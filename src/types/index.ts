import { z } from 'zod'

/**
 * Highlight Color Types
 */
export const HighlightColorEnum = z.enum(['yellow', 'green', 'blue', 'pink'])
export type HighlightColor = z.infer<typeof HighlightColorEnum>
export type HighlightPalette = Partial<Record<HighlightColor, string>>

/**
 * Highlight Range Schema
 * Stores the position of highlighted text in the DOM
 */
export const HighlightRangeSchema = z.object({
  startOffset: z.number(),
  endOffset: z.number(),
  textContent: z.string(), // The actual highlighted text for validation
  startIndex: z.number().optional(), // Absolute start index within normalized visible content
  endIndex: z.number().optional(), // Absolute end index within normalized visible content
})

/**
 * Highlight Schema
 * Represents a single text highlight
 */
export const HighlightSchema = z.object({
  id: z.string(),
  text: z.string(), // The highlighted text content
  range: HighlightRangeSchema,
  color: HighlightColorEnum,
  createdAt: z.number(),
})

/**
 * Annotation Position Schema
 * Stores the position of an annotation marker
 */
export const AnnotationPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

/**
 * Annotation Schema
 * Represents a note/annotation on highlighted text or standalone
 */
export const AnnotationSchema = z.object({
  id: z.string(),
  highlightId: z.string().nullable(), // null = standalone annotation
  text: z.string().min(1), // The annotation content
  position: AnnotationPositionSchema.optional(), // For standalone annotations
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * Question Highlight Data Schema
 * Container for all highlights and annotations on a specific question
 */
export const QuestionHighlightDataSchema = z.object({
  highlights: z.array(HighlightSchema),
  annotations: z.array(AnnotationSchema).optional().default([]),
})

/**
 * Highlight Types
 */
export type HighlightRange = z.infer<typeof HighlightRangeSchema>
export type Highlight = z.infer<typeof HighlightSchema>
export type AnnotationPosition = z.infer<typeof AnnotationPositionSchema>
export type Annotation = z.infer<typeof AnnotationSchema>
export type QuestionHighlightData = z.infer<typeof QuestionHighlightDataSchema>

/**
 * Highlight Color Map for CSS classes
 */
export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-200 hover:bg-yellow-300',
  green: 'bg-green-200 hover:bg-green-300',
  blue: 'bg-blue-200 hover:bg-blue-300',
  pink: 'bg-pink-200 hover:bg-pink-300',
}

export const HIGHLIGHT_COLOR_VALUES: Record<HighlightColor, string> = {
  yellow: '#fef08a', // Tailwind yellow-200
  green: '#bbf7d0', // Tailwind green-200
  blue: '#bfdbfe', // Tailwind blue-200
  pink: '#fbcfe8', // Tailwind pink-200
}

/**
 * Default highlight color
 */
export const DEFAULT_HIGHLIGHT_COLOR: HighlightColor = 'yellow'
