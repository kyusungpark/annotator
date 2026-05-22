import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryStorageProvider } from '../../storage/provider'
import { HighlightableContent } from '../HighlightableContent'

describe('HighlightableContent', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.tagName === 'MARK') {
        return {
          left: 10,
          top: 20,
          right: 130,
          bottom: 60,
          width: 120,
          height: 40,
          x: 10,
          y: 20,
          toJSON() {},
        } as DOMRect
      }

      return {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON() {},
      } as DOMRect
    })

    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockImplementation(function (this: HTMLElement) {
      if (this.tagName === 'MARK') {
        return [
          {
            left: 10,
            top: 20,
            right: 90,
            bottom: 40,
            width: 80,
            height: 20,
            x: 10,
            y: 20,
            toJSON() {},
          },
          {
            left: 10,
            top: 40,
            right: 130,
            bottom: 60,
            width: 120,
            height: 20,
            x: 10,
            y: 40,
            toJSON() {},
          },
        ] as unknown as DOMRectList
      }

      return [] as unknown as DOMRectList
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('should keep later highlights aligned when earlier highlights exist', async () => {
    const storageProvider = createMemoryStorageProvider({
      demo: {
        highlights: [
          {
            id: 'highlight-1',
            text: 'bravo',
            range: {
              startOffset: 6,
              endOffset: 11,
              textContent: 'bravo',
            },
            color: 'yellow',
            createdAt: 1,
          },
          {
            id: 'highlight-2',
            text: 'delta',
            range: {
              startOffset: 20,
              endOffset: 25,
              textContent: 'delta',
            },
            color: 'green',
            createdAt: 2,
          },
        ],
        annotations: [],
      },
    })

    render(
      <HighlightableContent id="demo" storageProvider={storageProvider}>
        <p>alpha bravo charlie delta echo</p>
      </HighlightableContent>,
    )

    await waitFor(() => {
      const firstHighlight = screen.getByTestId('highlight-highlight-1')
      const secondHighlight = screen.getByTestId('highlight-highlight-2')

      expect(firstHighlight).toHaveTextContent('bravo')
      expect(secondHighlight).toHaveTextContent('delta')
    })

    const secondHighlight = screen.getByTestId('highlight-highlight-2')
    const deleteButton = within(secondHighlight).getByRole('button', { name: /remove highlight/i })

    expect(deleteButton).toHaveStyle({
      left: '120px',
      top: '20px',
      transform: 'translate(50%, -50%)',
    })
  })
})
