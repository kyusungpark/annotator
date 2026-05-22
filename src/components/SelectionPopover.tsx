import { Annotation, HighlightColor, HIGHLIGHT_COLORS, HIGHLIGHT_COLOR_VALUES } from '../types/index'
import { AlertTriangle, Edit2, MessageSquare, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Textarea } from '../ui/textarea'
import { cn } from '../lib/utils'

export interface SelectionPopoverProps {
  open: boolean
  anchor: { x: number; y: number }
  annotations: Annotation[]
  onOpenChange: (open: boolean) => void
  onColorSelect: (color: HighlightColor) => void
  onSaveAnnotation: (text: string) => void
  onUpdateAnnotation: (annotationId: string, text: string) => void
  onDeleteAnnotation: (annotationId: string) => void
  onClearAll: () => void
}

const colorLabels: Record<HighlightColor, string> = {
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  pink: 'Pink',
}

export const SelectionPopover = ({
  open,
  anchor,
  annotations,
  onOpenChange,
  onColorSelect,
  onSaveAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onClearAll,
}: SelectionPopoverProps) => {
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newNoteText, setNewNoteText] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)

  useEffect(() => {
    if (!open) {
      setIsEditing(null)
      setEditText('')
      setNewNoteText('')
      setIsAddingNew(false)
    }
  }, [open])

  const handleSaveNew = () => {
    if (!newNoteText.trim()) return
    onSaveAnnotation(newNoteText.trim())
    setNewNoteText('')
    setIsAddingNew(false)
  }

  const handleStartEdit = (annotation: Annotation) => {
    setIsEditing(annotation.id)
    setEditText(annotation.text)
  }

  const handleSaveEdit = (annotationId: string) => {
    if (!editText.trim()) return
    onUpdateAnnotation(annotationId, editText.trim())
    setIsEditing(null)
    setEditText('')
  }

  const handleDelete = (annotationId: string) => {
    onDeleteAnnotation(annotationId)
    setIsEditing(null)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="fixed h-1 w-1 pointer-events-none opacity-0"
          style={{ left: anchor.x, top: anchor.y }}
          tabIndex={-1}
          aria-label="Highlight options"
        />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="center" sideOffset={8}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid #ccc',
                    backgroundColor: HIGHLIGHT_COLOR_VALUES[color],
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  title={`Highlight ${colorLabels[color]}`}
                  onClick={() => onColorSelect(color)}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1.1)'
                    ;(e.target as HTMLButtonElement).style.boxShadow = '0 0 8px rgba(0,0,0,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)'
                    ;(e.target as HTMLButtonElement).style.boxShadow = 'none'
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="destructive"
                className="h-6 w-6"
                title="Remove all highlights and annotations for this test"
                onClick={onClearAll}
              >
                <AlertTriangle size={10} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-6 w-6 p-0"
              >
                <X size={12} />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 border-t pt-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold">Notes</h4>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-1.5 text-xs"
                onClick={() => setIsAddingNew(true)}
              >
                <MessageSquare size={10} className="mr-0.5" />
                Add
              </Button>
            </div>

            {annotations.map((annotation) => (
              <div key={annotation.id} className="space-y-1.5 rounded-md border bg-gray-50 p-1.5">
                {isEditing === annotation.id ? (
                  <>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[50px] text-xs"
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-6 flex-1 text-xs"
                        onClick={() => handleSaveEdit(annotation.id)}
                      >
                        <Save size={10} className="mr-0.5" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 flex-1 text-xs"
                        onClick={() => {
                          setIsEditing(null)
                          setEditText('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-xs">{annotation.text}</p>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1.5"
                        onClick={() => handleStartEdit(annotation)}
                      >
                        <Edit2 size={10} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 px-1.5 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(annotation.id)}
                      >
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {isAddingNew && (
              <div className="space-y-1.5 rounded-md border p-1.5">
                <Textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="min-h-[50px] text-xs"
                  placeholder="Write your note..."
                  autoFocus
                />
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="h-6 flex-1 text-xs"
                    disabled={!newNoteText.trim()}
                    onClick={handleSaveNew}
                  >
                    <Save size={10} className="mr-0.5" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 flex-1 text-xs"
                    onClick={() => {
                      setIsAddingNew(false)
                      setNewNoteText('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
