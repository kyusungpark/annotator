import { MessageSquare } from 'lucide-react'
import { forwardRef, memo } from 'react'
import { cn } from '../lib/utils'

interface AnnotationMarkerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number
  className?: string
}

/**
 * Annotation marker icon that appears on/near highlights
 * Shows count badge if multiple annotations exist
 */
const AnnotationMarkerComponent = forwardRef<HTMLButtonElement, AnnotationMarkerProps>(
  ({ count = 0, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full',
          'bg-blue-500 text-white hover:bg-blue-600',
          'transition-colors cursor-pointer',
          'ml-1 align-middle',
          className,
        )}
        style={{ width: '20px', height: '20px' }}
        title={count > 0 ? `${count} note${count > 1 ? 's' : ''}` : 'Add note'}
        aria-label={count > 0 ? `View ${count} annotation(s)` : 'Add annotation'}
      >
        <MessageSquare size={12} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {count}
          </span>
        )}
      </button>
    )
  },
)

AnnotationMarkerComponent.displayName = 'AnnotationMarker'

export const AnnotationMarker = memo(AnnotationMarkerComponent)
