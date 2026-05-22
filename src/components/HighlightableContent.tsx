import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAnnotations } from '../hooks/useAnnotations'
import { useHighlighter } from '../hooks/useHighlighter'
import { StorageProvider } from '../storage/provider'
import { DEFAULT_HIGHLIGHT_COLOR, HIGHLIGHT_COLOR_VALUES, HighlightColor, HighlightPalette } from '../types/index'
import { AnnotationPopover } from './AnnotationPopover'

export interface HighlightableContentProps {
  id: string
  children?: ReactNode
  textSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  className?: string
  colorPalette?: HighlightPalette
  storageProvider?: StorageProvider
  onSelectionChange?: (selection: {
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

export const HighlightableContent = ({
  id,
  children,
  textSize = 'base',
  className,
  colorPalette,
  storageProvider,
  onSelectionChange,
  onHighlightCreate,
  onHighlightDelete,
}: HighlightableContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const annotationTriggerRef = useRef<HTMLButtonElement>(null)
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null)
  const [annotationPos, setAnnotationPos] = useState({ x: 0, y: 0 })
  const mergedColorPalette = useMemo(
    () => ({ ...HIGHLIGHT_COLOR_VALUES, ...colorPalette }),
    [colorPalette],
  )

  const { highlights, addHighlightWithColor, removeHighlightById, clearAllForCurrentContext, changeHighlightColor } = useHighlighter({ id, storageProvider })

  const {
    annotations,
    createAnnotation,
    updateAnnotationText,
    deleteAnnotation,
    deleteAnnotationsForHighlight,
    getHighlightAnnotations,
  } = useAnnotations({ id, storageProvider })

  // Re-render highlights when they change
  useEffect(() => {
    if (!contentRef.current) return
    const timer = setTimeout(() => {
      applyHighlightsToDOM()
    }, 0)
    return () => clearTimeout(timer)
  }, [highlights, mergedColorPalette])

  // Update popover position when viewport changes
  useEffect(() => {
    const handleScroll = () => {
      if (activeHighlightId && contentRef.current) {
        const el = contentRef.current.querySelector(`[data-highlight-id="${activeHighlightId}"]`)
        if (el) {
          const rect = (el as HTMLElement).getBoundingClientRect()
          setAnnotationPos({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
          })
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [activeHighlightId])

  const applyHighlightsToDOM = () => {
    if (!contentRef.current) return

    // Remove all existing highlight marks and restore original text
    const allHighlights = contentRef.current.querySelectorAll('mark.highlight-mark')
    allHighlights.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        while (el.firstChild) {
          const child = el.firstChild
          if (
            child.nodeType === Node.ELEMENT_NODE &&
            (
              (child as Element).classList.contains('highlight-delete-btn') ||
              (child as Element).classList.contains('highlight-delete-anchor')
            )
          ) {
            el.removeChild(child)
            continue
          }
          parent.insertBefore(child, el)
        }
        parent.removeChild(el)
        parent.normalize()
      }
    })

    // Also remove old span-based highlights for backward compatibility
    const oldHighlights = contentRef.current.querySelectorAll('.highlight-span')
    oldHighlights.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        let textContent = ''
        for (let i = 0; i < el.childNodes.length; i++) {
          const child = el.childNodes[i]
          if (child.nodeType === Node.TEXT_NODE) {
            textContent += child.textContent
          }
        }
        const newTextNode = document.createTextNode(textContent)
        parent.replaceChild(newTextNode, el)
        parent.normalize()
      }
    })

    if (highlights.length === 0) return

    // Apply highlights from the end of the document back to the start so
    // earlier inserted wrappers do not shift the ranges we still need to render.
    const highlightsToRender = [...highlights].sort(
      (a, b) =>
        b.range.startOffset - a.range.startOffset ||
        b.range.endOffset - a.range.endOffset,
    )

    highlightsToRender.forEach((hl) => {
      const range = document.createRange()
      let charCount = 0
      let startNode: Node | null = null
      let startOffset = 0
      let endNode: Node | null = null
      let endOffset = 0
      let foundStart = false

      // Walk through all text nodes to find start and end positions
      const walker = document.createTreeWalker(
        contentRef.current!,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node: Node) {
            let parent = node.parentElement
            while (parent && parent !== contentRef.current) {
              if (parent.classList.contains('highlight-mark')) {
                return NodeFilter.FILTER_REJECT
              }
              parent = parent.parentElement
            }
            return NodeFilter.FILTER_ACCEPT
          },
        }
      )

      let textNode: Node | null
      while ((textNode = walker.nextNode())) {
        const textLength = textNode.textContent?.length || 0

        // Check if start position is in this node
        if (!foundStart && charCount + textLength > hl.range.startOffset) {
          startNode = textNode
          startOffset = hl.range.startOffset - charCount
          foundStart = true
        }

        // Check if end position is in this node
        if (foundStart && charCount + textLength >= hl.range.endOffset) {
          endNode = textNode
          endOffset = hl.range.endOffset - charCount
          break
        }

        charCount += textLength
      }

      if (startNode && endNode) {
        range.setStart(startNode, startOffset)
        range.setEnd(endNode, endOffset)

        // Create mark element
        const mark = document.createElement('mark')
        mark.className = 'highlight-mark group relative cursor-pointer rounded-sm transition-colors'
        mark.setAttribute('data-highlight-id', hl.id)
        mark.setAttribute('data-testid', `highlight-${hl.id}`)
        mark.style.backgroundColor = mergedColorPalette[hl.color]
        mark.style.padding = '2px 4px'

        // Wrap the range content with the mark
        const contents = range.extractContents()

        // Create delete button
        const deleteBtn = document.createElement('button')
        deleteBtn.className = 'highlight-delete-btn absolute z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white opacity-0 transition-opacity hover:bg-red-600'
        deleteBtn.setAttribute('type', 'button')
        deleteBtn.setAttribute('aria-label', 'Remove highlight')
        deleteBtn.setAttribute('title', 'Remove highlight')
        deleteBtn.innerHTML = '×'

        mark.appendChild(deleteBtn)
        mark.appendChild(contents)
        range.insertNode(mark)
        positionDeleteButtonAtHighlightEnd(mark as HTMLElement, deleteBtn)

        // Add event listeners
        mark.addEventListener('mouseenter', () => {
          positionDeleteButtonAtHighlightEnd(mark as HTMLElement, deleteBtn)
          const rect = (mark as HTMLElement).getBoundingClientRect()
          setAnnotationPos({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
          })
          setActiveHighlightId(hl.id)
          annotationTriggerRef.current?.click()

          // Show delete button with opacity
          deleteBtn.style.opacity = '1'
        })

        mark.addEventListener('mouseleave', () => {
          deleteBtn.style.opacity = '0'
        })

        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation()
          handleDeleteHighlight(hl.id)
        })

        mark.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('.highlight-delete-btn')) {
            return
          }
          // Highlight click to open menu
          positionDeleteButtonAtHighlightEnd(mark as HTMLElement, deleteBtn)
          setActiveHighlightId(hl.id)
          const rect = (mark as HTMLElement).getBoundingClientRect()
          setAnnotationPos({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
          })
          annotationTriggerRef.current?.click()
        })
      }
    })
  }

  const handleMouseUp = useCallback(() => {
    if (!contentRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.toString().length === 0) {
      return
    }

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString()

    // Calculate offset by walking text nodes, counting all text but skipping button text
    let charCount = 0
    const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT, null)

    let currentNode: Node | null
    while ((currentNode = walker.nextNode())) {
      // Skip text nodes inside BUTTON elements (the delete button with "✕")
      let parent = currentNode.parentNode
      let insideButton = false
      while (parent && parent !== contentRef.current) {
        if ((parent as Element).tagName === 'BUTTON') {
          insideButton = true
          break
        }
        parent = parent.parentNode
      }

      if (insideButton) {
        continue // Skip text inside button elements
      }

      if (currentNode === range.endContainer) {
        charCount += range.endOffset
        break
      } else {
        charCount += currentNode.textContent?.length || 0
      }
    }

    const endOffset = charCount
    const startOffset = endOffset - selectedText.length

    const selectionData = {
      text: selectedText,
      range: {
        startOffset,
        endOffset,
        textContent: selectedText,
      },
    }

    // Auto-highlight with default yellow color
    const highlightId = addHighlightWithColor(
      selectedText,
      selectionData.range,
      DEFAULT_HIGHLIGHT_COLOR,
    )
    if (highlightId) {
      onHighlightCreate?.(highlightId, DEFAULT_HIGHLIGHT_COLOR)
    }

    // Clear selection
    window.getSelection()?.removeAllRanges()
  }, [addHighlightWithColor, onHighlightCreate])


  const handleDeleteHighlight = useCallback(
    (highlightId: string) => {
      deleteAnnotationsForHighlight(highlightId)
      removeHighlightById(highlightId)
      onHighlightDelete?.(highlightId)
      setActiveHighlightId(null)
    },
    [removeHighlightById, deleteAnnotationsForHighlight, onHighlightDelete],
  )

  const handleClearAll = useCallback(() => {
    // Clear all annotations for all highlights first
    highlights.forEach((h) => deleteAnnotationsForHighlight(h.id))
    // Then clear all highlights in batch
    clearAllForCurrentContext()
    setActiveHighlightId(null)
  }, [highlights, deleteAnnotationsForHighlight, clearAllForCurrentContext])

  const handleColorChange = useCallback(
    (color: HighlightColor) => {
      if (activeHighlightId) {
        changeHighlightColor(activeHighlightId, color)
      }
    },
    [activeHighlightId, changeHighlightColor],
  )

  const getCurrentHighlightColor = (): HighlightColor => {
    if (!activeHighlightId) return DEFAULT_HIGHLIGHT_COLOR
    const highlight = highlights.find((h) => h.id === activeHighlightId)
    return highlight?.color || DEFAULT_HIGHLIGHT_COLOR
  }

  const getTextSizeClass = () => {
    switch (textSize) {
      case 'xs':
        return 'text-xs'
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-lg'
      case 'xl':
        return 'text-xl'
      default:
        return 'text-base'
    }
  }

  const innerClassName = `cursor-text ${getTextSizeClass()}`
  const outerClassName = `prose prose-sm dark:prose-invert max-w-none ${className || ''}`

  const highlightAnnotations = activeHighlightId ? getHighlightAnnotations(activeHighlightId) : []

  return (
    <div className={outerClassName} style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={innerClassName}
        style={{
          position: 'relative',
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
        data-testid="highlightable-content"
      >
        <div ref={contentRef}>{children}</div>
      </div>

      {activeHighlightId && (
        <>
          <button
            ref={annotationTriggerRef}
            style={{
              position: 'fixed',
              left: `${annotationPos.x}px`,
              top: `${annotationPos.y}px`,
              width: 0,
              height: 0,
              padding: 0,
              border: 'none',
              visibility: 'hidden',
            }}
          />
          <AnnotationPopover
            trigger={<div style={{ display: 'none' }} />}
            annotations={highlightAnnotations}
            onSave={(text) => createAnnotation(text, activeHighlightId)}
            onUpdate={(annotationId, text) => updateAnnotationText(annotationId, text)}
            onDelete={(annotationId) => deleteAnnotation(annotationId)}
            onDeleteHighlight={() => handleDeleteHighlight(activeHighlightId)}
            onDeleteAllHighlights={handleClearAll}
            onColorChange={handleColorChange}
            currentColor={getCurrentHighlightColor()}
            colorPalette={mergedColorPalette}
            open={true}
            onOpenChange={(open) => {
              if (!open) setActiveHighlightId(null)
            }}
            style={{
              position: 'fixed',
              left: `${annotationPos.x}px`,
              top: `${annotationPos.y}px`,
            }}
          />
        </>
      )}
    </div>
  )
}

function positionDeleteButtonAtHighlightEnd(mark: HTMLElement, deleteBtn: HTMLButtonElement) {
  const markRect = mark.getBoundingClientRect()
  const clientRects = Array.from(mark.getClientRects())
  const targetRect = clientRects.length > 0 ? clientRects[clientRects.length - 1] : markRect

  deleteBtn.style.left = `${targetRect.right - markRect.left}px`
  deleteBtn.style.top = `${targetRect.top - markRect.top}px`
  deleteBtn.style.transform = 'translate(50%, -50%)'
}

function getFullTextContent(el: Element): string {
  let text = ''
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
  let node: Node | null
  while ((node = walker.nextNode())) {
    text += node.textContent || ''
  }
  return text
}
