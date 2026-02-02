import { useState, useEffect } from 'react';
import { GripVertical, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { TaskStatus, COLOR_PALETTE } from '@/types/tasks';

interface ManageStatusesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: TaskStatus[];
  onUpdateStatus: (id: string, updates: Partial<TaskStatus>) => Promise<boolean>;
  onDeleteStatus: (id: string) => Promise<boolean>;
}

export function ManageStatusesDialog({
  open,
  onOpenChange,
  statuses,
  onUpdateStatus,
  onDeleteStatus,
}: ManageStatusesDialogProps) {
  const [localStatuses, setLocalStatuses] = useState<TaskStatus[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Sort by order for display
    const sorted = [...statuses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setLocalStatuses(sorted);
  }, [statuses]);

  const handleStartEdit = (status: TaskStatus) => {
    setEditingId(status.id);
    setEditName(status.name);
    setEditColor(status.color || COLOR_PALETTE[0]);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    
    const success = await onUpdateStatus(editingId, {
      name: editName.trim(),
      color: editColor,
    });

    if (success) {
      setLocalStatuses(prev => 
        prev.map(s => s.id === editingId 
          ? { ...s, name: editName.trim(), color: editColor }
          : s
        )
      );
    }
    
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleDelete = async (id: string) => {
    const success = await onDeleteStatus(id);
    if (success) {
      setLocalStatuses(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStatuses = [...localStatuses];
    const [draggedStatus] = newStatuses.splice(draggedIndex, 1);
    newStatuses.splice(index, 0, draggedStatus);
    
    setLocalStatuses(newStatuses);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    // Update order in database
    const updates = localStatuses.map((s, index) => 
      onUpdateStatus(s.id, { order: index })
    );
    
    await Promise.all(updates);
    setDraggedIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {localStatuses.map((status, index) => (
            <div
              key={status.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card",
                draggedIndex === index && "opacity-50"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />

              {editingId === status.id ? (
                <div className="flex-1 space-y-3">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome do status"
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Cor</div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center",
                            editColor === color 
                              ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" 
                              : "hover:scale-110"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        >
                          {editColor === color && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleSaveEdit}
                      disabled={!editName.trim()}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="flex-1 px-2 py-1 rounded text-sm font-medium"
                    style={{
                      backgroundColor: `${status.color}30`,
                      color: status.color,
                    }}
                  >
                    {status.name}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleStartEdit(status)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(status.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {localStatuses.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Nenhum status encontrado
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Arraste para reordenar. A ordem afeta a visualização em quadro.
        </p>
      </DialogContent>
    </Dialog>
  );
}
