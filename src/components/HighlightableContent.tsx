import { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

  // TEARDOWN: runs synchronously before React removes/replaces DOM nodes.
  // This prevents the race condition where the old annotator's deferred DOM
  // work (originally setTimeout 0) fired after React had already replaced
  // the content during navigation, causing NotFoundError / IndexSizeError.
  useLayoutEffect(() => {
    return () => {
      // Strip all highlight marks synchronously on unmount or before re-applying.
      // Running this in useLayoutEffect cleanup guarantees it executes before
      // React commits the next tree, so we never operate on detached nodes.
      if (!contentRef.current) return
      const allHighlights = contentRef.current.querySelectorAll('mark.highlight-mark')
      allHighlights.forEach((el) => {
        const parent = el.parentNode
        if (!parent) return
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
      })
    }
  }, [highlights, mergedColorPalette])

  // RE-APPLICATION: runs after paint — safe, DOM is stable at this point.
  useEffect(() => {
    applyHighlightsToDOM()
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
      const segments: { node: Node; from: number; to: number }[] = []
      const segWalker = document.createTreeWalker(
        contentRef.current!,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node: Node) {
            let p = node.parentElement
            while (p && p !== contentRef.current) {
              if (p.classList.contains('highlight-mark')) return NodeFilter.FILTER_REJECT
              p = p.parentElement
            }
            return NodeFilter.FILTER_ACCEPT
          },
        },
      )
      let segChar = 0
      let segNode: Node | null
      while ((segNode = segWalker.nextNode())) {
        const len = segNode.textContent?.length || 0
        const nodeStart = segChar
        const nodeEnd = segChar + len
        if (nodeEnd > hl.range.startOffset && nodeStart < hl.range.endOffset) {
          segments.push({
            node: segNode,
            from: Math.max(0, hl.range.startOffset - nodeStart),
            to: Math.min(len, hl.range.endOffset - nodeStart),
          })
        }
        segChar += len
        if (segChar >= hl.range.endOffset) break
      }

      if (segments.length === 0) return

      // One delete button shared across all mark segments for this highlight.
      const deleteBtn = document.createElement('button')
      deleteBtn.className =
        'highlight-delete-btn absolute z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white opacity-0 transition-opacity hover:bg-red-600'
      deleteBtn.setAttribute('type', 'button')
      deleteBtn.setAttribute('aria-label', 'Remove highlight')
      deleteBtn.setAttribute('title', 'Remove highlight')
      deleteBtn.innerHTML = '×'
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        handleDeleteHighlight(hl.id)
      })
      deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.opacity = '1'
      })
      deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.opacity = '0'
      })

      const marks: HTMLElement[] = []

      // Wrap each text segment in its own <mark> so we never split element
      // boundaries - avoids DOM structure corruption on multi-element
      // selections.
      for (let i = 0; i < segments.length; i++) {
        const { node, from, to } = segments[i]
        const segRange = document.createRange()
        segRange.setStart(node, from)
        segRange.setEnd(node, to)

        const mark = document.createElement('mark')
        mark.className =
          'highlight-mark group cursor-pointer rounded-sm transition-colors'
        mark.setAttribute('data-highlight-id', hl.id)
        mark.setAttribute('data-testid', `highlight-${hl.id}`)
        mark.style.backgroundColor = mergedColorPalette[hl.color]

        segRange.surroundContents(mark)
        marks.push(mark)

        mark.addEventListener('mouseenter', () => {
          const lastMark = marks[marks.length - 1]
          if (containerRef.current) {
            positionDeleteButtonAtHighlightEnd(lastMark, deleteBtn, containerRef.current)
          }
          const clientRects = Array.from(lastMark.getClientRects())
          const targetRect =
            clientRects.length > 0 ? clientRects[clientRects.length - 1] : lastMark.getBoundingClientRect()
          setAnnotationPos({ x: targetRect.left + targetRect.width / 2, y: targetRect.bottom + 8 })
          setActiveHighlightId(hl.id)
          annotationTriggerRef.current?.click()
          deleteBtn.style.opacity = '1'
        })

        mark.addEventListener('mouseleave', () => {
          deleteBtn.style.opacity = '0'
        })

        mark.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('.highlight-delete-btn')) return
          const lastMark = marks[marks.length - 1]
          if (containerRef.current) {
            positionDeleteButtonAtHighlightEnd(lastMark, deleteBtn, containerRef.current)
          }
          setActiveHighlightId(hl.id)
          const clientRects = Array.from(lastMark.getClientRects())
          const targetRect =
            clientRects.length > 0 ? clientRects[clientRects.length - 1] : lastMark.getBoundingClientRect()
          setAnnotationPos({ x: targetRect.left + targetRect.width / 2, y: targetRect.bottom + 8 })
          annotationTriggerRef.current?.click()
        })
      }

      if (containerRef.current) {
        containerRef.current.appendChild(deleteBtn)
        positionDeleteButtonAtHighlightEnd(marks[marks.length - 1], deleteBtn, containerRef.current)
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

    // Derive absolute char offsets for BOTH boundaries directly from the range,
    // in the same coordinate system applyHighlightsToDOM measures against
    // (text-node characters, excluding the delete button's text).
    //
    // Computing startOffset from the start boundary - rather than
    // endOffset - selectedText.length - is essential for multi-element (multi-line)
    // selections: there, range.endContainer is an element node (not a text node)
    // and selection.toString() injects synthetic newlines between blocks, so the
    // old length-subtraction approach pushed the highlight to the end of the content.
    const startOffset = getCharOffset(contentRef.current, range.startContainer, range.startOffset)
    const endOffset = getCharOffset(contentRef.current, range.endContainer, range.endOffset)

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

function positionDeleteButtonAtHighlightEnd(
  mark: HTMLElement,
  deleteBtn: HTMLButtonElement,
  container: HTMLElement,
) {
  const containerRect = container.getBoundingClientRect()
  const clientRects = Array.from(mark.getClientRects())
  const targetRect = clientRects.length > 0 ? clientRects[clientRects.length - 1] : mark.getBoundingClientRect()

  const left = targetRect.right - containerRect.left
  const top = targetRect.top - containerRect.top

  deleteBtn.style.left = `${left}px`
  deleteBtn.style.top = `${top}px`
  deleteBtn.style.transform = 'translate(-50%, -50%)'
}

// Absolute character offset of a range boundary (container, offset) within root,
// counting text-node characters and skipping the delete button's text. Handles
// element-node containers, which is what selection boundaries resolve to when a
// selection spans multiple block elements.
function getCharOffset(root: HTMLElement, container: Node, offset: number): number {
  const boundary = document.createRange()
  boundary.setStart(root, 0)
  boundary.setEnd(container, offset)

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node) {
      let p = node.parentNode
      while (p && p !== root) {
        if ((p as Element).tagName === 'BUTTON') return NodeFilter.FILTER_REJECT
        p = p.parentNode
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })

  let count = 0
  let node: Node | null
  while ((node = walker.nextNode())) {
    const len = node.textContent?.length || 0
    if (node === container) {
      return count + offset
    }

    // comparePoint <= 0 means this text node ends at or before the boundary,
    // so it lies fully before the boundary and is counted in full.
    if (boundary.comparePoint(node, len) <= 0) {
      count += len
    } else {
      break
    }
  }

  return count
}
