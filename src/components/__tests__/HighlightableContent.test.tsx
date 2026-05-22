import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HighlightableContent } from '../HighlightableContent'

describe('HighlightableContent', () => {
  it('should render with provided children', () => {
    render(
      <HighlightableContent id="test-123">
        Test content
      </HighlightableContent>,
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    const { container } = render(
      <HighlightableContent
        id="test-123"
        className="custom-class"
      >
        Test content
      </HighlightableContent>,
    )

    const wrapper = container.querySelector('.custom-class')
    expect(wrapper).toBeInTheDocument()
  })

  it('should render with different text sizes', () => {
    const sizes: Array<'xs' | 'sm' | 'base' | 'lg' | 'xl'> = ['xs', 'sm', 'base', 'lg', 'xl']

    sizes.forEach((size) => {
      const { container } = render(
        <HighlightableContent
          id={`test-${size}`}
          textSize={size}
        >
          Test content
        </HighlightableContent>,
      )

      const div = container.querySelector(`[class*="text-${size}"]`)
      expect(div).toBeInTheDocument()
    })
  })

  it('should render JSX children directly', () => {
    render(
      <HighlightableContent id="test-123">
        <div data-testid="custom-jsx">Custom JSX content</div>
      </HighlightableContent>,
    )

    expect(screen.getByTestId('custom-jsx')).toBeInTheDocument()
    expect(screen.getByText('Custom JSX content')).toBeInTheDocument()
  })

  it('should have cursor-text class for mouse interaction', () => {
    const { container } = render(
      <HighlightableContent id="test-123">
        Test content
      </HighlightableContent>,
    )

    const innerDiv = container.querySelector('.cursor-text')
    expect(innerDiv).toBeInTheDocument()
  })

  it('should render markdown-like content through children', () => {
    render(
      <HighlightableContent id="test-123">
        <strong>Bold text</strong> and <em>italic text</em>
      </HighlightableContent>,
    )

    expect(screen.getByText('Bold text')).toBeInTheDocument()
    expect(screen.getByText('italic text')).toBeInTheDocument()
  })

  it('should have proper prose styling', () => {
    const { container } = render(
      <HighlightableContent id="test-123">
        Test content
      </HighlightableContent>,
    )

    const wrapper = container.querySelector('.prose')
    expect(wrapper).toBeInTheDocument()
  })

  it('should render with multiple children', () => {
    render(
      <HighlightableContent id="test-123">
        <p>First paragraph</p>
        <p>Second paragraph</p>
      </HighlightableContent>,
    )

    expect(screen.getByText('First paragraph')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph')).toBeInTheDocument()
  })
})

