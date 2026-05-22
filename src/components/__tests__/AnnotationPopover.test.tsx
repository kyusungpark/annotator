import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AnnotationPopover } from '../AnnotationPopover'

describe('AnnotationPopover', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls the all-highlights delete handler for the current test', () => {
    const onDeleteAllHighlights = vi.fn()
    const onDeleteHighlight = vi.fn()

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <AnnotationPopover
        trigger={<button type="button">open</button>}
        annotations={[]}
        onSave={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onDeleteHighlight={onDeleteHighlight}
        onDeleteAllHighlights={onDeleteAllHighlights}
        open
        onOpenChange={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByTitle('Delete all highlights for this test'))

    expect(screen.getByTitle('Delete this highlight')).toBeInTheDocument()
    expect(screen.getByTitle('Delete all highlights for this test')).toBeInTheDocument()
    expect(onDeleteAllHighlights).toHaveBeenCalledOnce()
    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Color:')).not.toBeInTheDocument()
  })
})
