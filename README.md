# @stargiraffe/annotator

React text-highlighting + annotation library with built-in color controls, popover-based UI, and pluggable storage providers.

## Features

- **Interactive highlighting**: Select text to auto-highlight (default: yellow)
- **Color picker**: Change highlight colors from an in-place popover (yellow, green, blue, pink)
- **Annotations**: Add, edit, and delete notes per highlight with persistence
- **Context-scoped storage**: Each `HighlightableContent` instance persists highlights/annotations independently by `id`
- **Pluggable storage**: localStorage, sessionStorage, or custom memory provider
- **Responsive UI**: Delete button, color picker, and annotation popover
- **React 18+/19 compatible**: React is a peer dependency

## Installation

```bash
npm install @stargiraffe/annotator
```

## Quick start

```tsx
import { HighlightableContent } from '@stargiraffe/annotator'

export function Lesson() {
  return (
    <HighlightableContent id="lesson-1">
      <p>Select text to create a highlight.</p>
    </HighlightableContent>
  )
}
```

## Component API

### HighlightableContent

Wraps content and manages highlight lifecycle (creation, deletion, color changes, annotation).

```ts
interface HighlightableContentProps {
  id: string                            // Unique context ID for storage (required)
  children?: ReactNode                  // Content to highlight
  textSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'  // Tailwind text size class
  className?: string                    // Additional CSS classes
  colorPalette?: HighlightPalette       // Custom highlight colors (hex codes)
  storageProvider?: StorageProvider     // Custom storage backend (default: localStorage)
  onSelectionChange?: (selection: {    // Fired when user selects/deselects text
    text: string
    range: {
      startOffset: number
      endOffset: number
      textContent: string
    }
  } | null) => void
  onHighlightCreate?: (highlightId: string, color: HighlightColor) => void
  onHighlightDelete?: (highlightId: string) => void
}
```

### Default color palette

```ts
yellow: '#fef08a'  // Tailwind yellow-200
green: '#bbf7d0'   // Tailwind green-200
blue: '#bfdbfe'    // Tailwind blue-200
pink: '#fbcfe8'    // Tailwind pink-200
```

### Custom color palette

```tsx
<HighlightableContent
  id="lesson-1"
  colorPalette={{
    yellow: '#FDE68A',
    green: '#86EFAC',
    blue: '#93C5FD',
    pink: '#F9A8D4',
  }}
>
  <p>Select text to highlight with your palette.</p>
</HighlightableContent>
```

## Exports

### Main component

```ts
import { HighlightableContent } from '@stargiraffe/annotator'
```

### Hooks (for advanced use)

```ts
import { useHighlighter, useAnnotations } from '@stargiraffe/annotator/hooks'
```

### Types and constants

```ts
import {
  type HighlightColor,
  type Highlight,
  type Annotation,
  DEFAULT_HIGHLIGHT_COLOR,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_COLOR_VALUES,
  HighlightColorEnum,
  HighlightSchema,
  AnnotationSchema,
} from '@stargiraffe/annotator'
```

### Storage providers and utilities

```ts
import {
  localStorageProvider,
  sessionStorageProvider,
  createMemoryStorageProvider,
  type StorageProvider,
  type QuestionHighlightData,
} from '@stargiraffe/annotator/storage'
```

## Storage

### Default behavior

By default, highlights and annotations are persisted to `localStorage` with keys:
- `highlights.{id}` — contains all highlights and annotations for that context

### Custom storage provider

```tsx
import { HighlightableContent } from '@stargiraffe/annotator'
import { sessionStorageProvider, createMemoryStorageProvider } from '@stargiraffe/annotator/storage'

// Use session storage (cleared on browser close)
<HighlightableContent id="lesson-1" storageProvider={sessionStorageProvider}>
  <p>Highlights are scoped to this browser tab session.</p>
</HighlightableContent>

// Use in-memory storage (test-friendly)
const memoryProvider = createMemoryStorageProvider()
<HighlightableContent id="lesson-1" storageProvider={memoryProvider}>
  <p>Highlights are not persisted.</p>
</HighlightableContent>
```

## Known limitations

- **Offset-based**: Highlights are stored as character offsets within text nodes. Large DOM restructuring or content changes may invalidate stored offsets.
- **Text nodes only**: Highlights only work on text content. Complex nested HTML structures with mixed text/element nodes may produce unpredictable results.
- **LaTeX/KaTeX**: When highlighting text containing KaTeX elements, individual highlights may fragment across the element boundaries, creating separate delete buttons per fragment. This is a known limitation and does not affect functionality.

## Behavior notes

- Highlights and annotations are scoped by `id`; each `<HighlightableContent>` instance is independent.
- Deleting a highlight also deletes all associated annotations.
- The color picker and annotation popover appear relative to the highlight trigger element.
- Storage key format: `highlights.{id}` (e.g., `highlights.passage-123`).

## Example: Markdown content

```tsx
import { HighlightableContent } from '@stargiraffe/annotator'
import MarkdownRenderer from '@/components/ui/markdown-renderer'

export function Passage({ id, markdown }) {
  return (
    <HighlightableContent id={`passage-${id}`} textSize="lg">
      <MarkdownRenderer content={markdown} />
    </HighlightableContent>
  )
}
```

## Example: Custom callbacks

```tsx
const [lastHighlightId, setLastHighlightId] = useState<string | null>(null)

<HighlightableContent
  id="lesson-1"
  onHighlightCreate={(highlightId, color) => {
    console.log(`Created highlight ${highlightId} with color ${color}`)
    setLastHighlightId(highlightId)
  }}
  onHighlightDelete={(highlightId) => {
    console.log(`Deleted highlight ${highlightId}`)
  }}
  onSelectionChange={(selection) => {
    if (selection) {
      console.log(`Selected: "${selection.text}"`)
    } else {
      console.log('Selection cleared')
    }
  }}
>
  <p>Select text to track events.</p>
</HighlightableContent>
```

## Development

```bash
npm install
npm run build
npm run test
npm run type-check
```

## Links

- Repository: https://github.com/kyusungpark/annotator
- Issues: https://github.com/kyusungpark/annotator/issues

## License

MIT
