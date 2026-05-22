import { render, screen } from '@testing-library/react'
import { HighlightableContent } from '../components/HighlightableContent'
import { describe, it, expect } from 'vitest'

describe('HighlightableContent', () => {
  it('should render content', () => {
    render(
      <HighlightableContent id="test-1">
        <p>This is test content</p>
      </HighlightableContent>,
    )

    expect(screen.getByText('This is test content')).toBeInTheDocument()
  })

  it('should have highlightable-content element', () => {
    render(
      <HighlightableContent id="test-2">
        <p>Test</p>
      </HighlightableContent>,
    )

    expect(screen.getByTestId('highlightable-content')).toBeInTheDocument()
  })

  it('should accept className prop', () => {
    const { container } = render(
      <HighlightableContent id="test-3" className="custom-class">
        <p>Test</p>
      </HighlightableContent>,
    )

    const outer = container.querySelector('.custom-class')
    expect(outer).toBeInTheDocument()
  })

  it('should support textSize prop', () => {
    const { container } = render(
      <HighlightableContent id="test-4" textSize="lg">
        <p>Test</p>
      </HighlightableContent>,
    )

    const inner = screen.getByTestId('highlightable-content')
    expect(inner).toHaveClass('text-lg')
  })

  it('should accept custom colorPalette prop', () => {
    render(
      <HighlightableContent
        id="test-5"
        colorPalette={{
          yellow: '#FDE68A',
          green: '#86EFAC',
          blue: '#93C5FD',
          pink: '#F9A8D4',
        }}
      >
        <p>Test</p>
      </HighlightableContent>,
    )

    expect(screen.getByTestId('highlightable-content')).toBeInTheDocument()
  })
})
