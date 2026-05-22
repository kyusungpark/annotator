import { HighlightColor, HIGHLIGHT_COLORS } from '../types/index'
import { Eraser, Highlighter } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../lib/utils'

export interface HighlightToolbarProps {
  currentColor: HighlightColor
  onColorChange: (color: HighlightColor) => void
  onClearAll: () => void
  highlightCount: number
  annotationCount?: number
}

const colorLabels: Record<HighlightColor, string> = {
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  pink: 'Pink',
}

/**
 * Toolbar component for highlight controls
 * Provides color picker and clear all functionality
 */
export const HighlightToolbar = ({
  currentColor,
  onColorChange,
  onClearAll,
  highlightCount,
  annotationCount = 0,
}: HighlightToolbarProps) => {
  const totalCount = highlightCount + annotationCount

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Highlighter size={16} />
            <span className="hidden sm:inline">Highlight</span>
            <div
              className={cn(
                'h-3 w-3 rounded-sm border border-gray-400',
                HIGHLIGHT_COLORS[currentColor],
              )}
              title={colorLabels[currentColor]}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm font-semibold">Highlight Color</div>
          <DropdownMenuSeparator />
          {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
            <DropdownMenuItem
              key={color}
              onClick={() => onColorChange(color)}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-4 w-4 rounded-sm border border-gray-400',
                    HIGHLIGHT_COLORS[color],
                  )}
                />
                <span>{colorLabels[color]}</span>
              </div>
              {currentColor === color && <span className="text-xs text-blue-600">✓</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onClearAll}
            disabled={totalCount === 0}
            className="text-red-600 focus:text-red-600"
          >
            <Eraser size={16} className="mr-2" />
            Clear All ({highlightCount} highlights, {annotationCount} notes)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
