import { AlertTriangle, Edit2, Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Annotation, HIGHLIGHT_COLORS, HIGHLIGHT_COLOR_VALUES, HighlightColor, HighlightPalette } from '../types/index'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Textarea } from '../ui/textarea'

export interface AnnotationPopoverProps {
  trigger: React.ReactNode
  annotations: Annotation[]
  onSave: (text: string) => void
  onUpdate: (annotationId: string, text: string) => void
  onDelete: (annotationId: string) => void
  onDeleteHighlight?: () => void
  onDeleteAllHighlights?: () => void
  onColorChange?: (color: HighlightColor) => void
  currentColor?: HighlightColor
  colorPalette?: HighlightPalette
  open?: boolean
  onOpenChange?: (open: boolean) => void
  style?: React.CSSProperties
}

const colorLabels: Record<HighlightColor, string> = {
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  pink: 'Pink',
}

/**
 * Popover for viewing, editing, and creating annotations + changing highlight color
 */
export const AnnotationPopover = ({
  trigger,
  annotations,
  onSave,
  onUpdate,
  onDelete,
  onDeleteHighlight,
  onDeleteAllHighlights,
  onColorChange,
  currentColor,
  colorPalette,
  open,
  onOpenChange,
  style,
}: AnnotationPopoverProps) => {
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newNoteText, setNewNoteText] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(annotations.length === 0)
  const mergedColorPalette = useMemo(
    () => ({ ...HIGHLIGHT_COLOR_VALUES, ...colorPalette }),
    [colorPalette],
  )

  const handleSaveNew = () => {
    if (!newNoteText.trim()) return
    onSave(newNoteText.trim())
    setNewNoteText('')
    setIsAddingNew(false)
  }

  const handleStartEdit = (annotation: Annotation) => {
    setIsEditing(annotation.id)
    setEditText(annotation.text)
  }

  const handleSaveEdit = (annotationId: string) => {
    if (!editText.trim()) return
    onUpdate(annotationId, editText.trim())
    setIsEditing(null)
    setEditText('')
  }

  const handleCancelEdit = () => {
    setIsEditing(null)
    setEditText('')
  }

  const handleDelete = (annotationId: string) => {
    if (confirm('Delete this note?')) {
      onDelete(annotationId)
      setIsEditing(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="start" style={style}>
        <div className="space-y-3">
          {/* Color Picker with Delete All button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {onDeleteHighlight && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDeleteHighlight()
                    onOpenChange?.(false)
                  }}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete this highlight"
                >
                  <Trash2 size={14} />
                </Button>
              )}
              {onDeleteAllHighlights && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete all highlights for this test?')) {
                      onDeleteAllHighlights()
                      onOpenChange?.(false)
                    }
                  }}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete all highlights for this test"
                >
                  <AlertTriangle size={14} />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: currentColor === color ? '3px solid #333' : '2px solid #ccc',
                    backgroundColor: mergedColorPalette[color],
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title={`Change to ${colorLabels[color]}`}
                  onClick={() => onColorChange?.(color)}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1.15)'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="border-t pt-2" />
          <h4 className="font-semibold text-sm">Notes</h4>

          {/* Existing annotations */}
          {annotations.map((annotation) => (
            <div key={annotation.id} className="rounded-md border bg-gray-50 p-3 space-y-2">
              {isEditing === annotation.id ? (
                <>
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[60px] text-sm"
                    placeholder="Edit your note..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(annotation.id)}
                      className="flex-1"
                    >
                      <Save size={14} className="mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{annotation.text}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(annotation.updatedAt).toLocaleDateString()}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(annotation)}
                        className="h-6 px-2"
                      >
                        <Edit2 size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(annotation.id)}
                        className="h-6 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add new annotation */}
          {isAddingNew ? (
            <div className="space-y-2">
              <Textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="min-h-[60px] text-sm"
                placeholder="Write your note..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNew}
                  className="flex-1"
                  disabled={!newNoteText.trim()}
                >
                  <Save size={14} className="mr-1" />
                  Save
                </Button>
                {annotations.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false)
                      setNewNoteText('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddingNew(true)}
              className="w-full"
            >
              + Add Note
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
