import { useState } from 'react';
import { Plus, Check, X, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { TaskStatus, COLOR_PALETTE } from '@/types/tasks';

// Virtual "Atrasada" status color
const OVERDUE_COLOR = '#dc2626';

interface StatusSelectWithCreateProps {
  statuses: TaskStatus[];
  value: string | null;
  onChange: (statusId: string) => void;
  onCreateStatus?: (status: Partial<TaskStatus>) => Promise<TaskStatus | null>;
  onUpdateStatus?: (id: string, updates: Partial<TaskStatus>) => Promise<void>;
  onDeleteStatus?: (id: string) => Promise<void>;
  className?: string;
  isOverdue?: boolean;
}

export function StatusSelectWithCreate({
  statuses,
  value,
  onChange,
  onCreateStatus,
  onUpdateStatus,
  onDeleteStatus,
  className,
  isOverdue = false,
}: StatusSelectWithCreateProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);

  const statusInfo = value 
    ? statuses.find(s => s.id === value) 
    : null;

  // Check if the current status is "Concluída" (completed)
  const isCompleted = statusInfo?.name.toLowerCase().includes('concluída') || 
                      statusInfo?.name.toLowerCase().includes('concluida');

  const handleCreateStatus = async () => {
    if (!newStatusName.trim() || !onCreateStatus) return;
    
    const newStatus = await onCreateStatus({
      name: newStatusName.trim(),
      color: selectedColor,
      order: statuses.length,
    });

    if (newStatus) {
      onChange(newStatus.id);
    }
    
    setNewStatusName('');
    setSelectedColor(COLOR_PALETTE[0]);
    setIsCreating(false);
  };

  const handleEditStatus = (status: TaskStatus) => {
    setEditingStatusId(status.id);
    setNewStatusName(status.name);
    setSelectedColor(status.color);
    setIsCreating(false);
  };

  const handleSaveEdit = async () => {
    if (!editingStatusId || !newStatusName.trim() || !onUpdateStatus) return;
    
    await onUpdateStatus(editingStatusId, {
      name: newStatusName.trim(),
      color: selectedColor,
    });
    
    setEditingStatusId(null);
    setNewStatusName('');
    setSelectedColor(COLOR_PALETTE[0]);
  };

  const handleDeleteStatus = async (statusId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteStatus) return;
    
    // If deleting current status, clear selection
    if (statusId === value) {
      const firstOtherStatus = statuses.find(s => s.id !== statusId);
      if (firstOtherStatus) {
        onChange(firstOtherStatus.id);
      }
    }
    
    await onDeleteStatus(statusId);
  };

  const cancelEdit = () => {
    setEditingStatusId(null);
    setNewStatusName('');
    setSelectedColor(COLOR_PALETTE[0]);
  };

  const isEditing = editingStatusId !== null;

  return (
    <Select
      value={value || ''}
      onValueChange={(val) => {
        if (val === '__create__') {
          setIsCreating(true);
        } else if (!isEditing) {
          onChange(val);
        }
      }}
    >
      <SelectTrigger className={cn("h-7 text-xs border-0 bg-transparent hover:bg-muted/50 p-0", className)}>
        <div className="flex items-center min-w-0">
          {isOverdue && !isCompleted ? (
            <div
              className="px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap"
              style={{
                backgroundColor: `${OVERDUE_COLOR}30`,
                color: OVERDUE_COLOR,
              }}
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Atrasada</span>
            </div>
          ) : (
            <div
              className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: statusInfo ? `${statusInfo.color}30` : '#6b728030',
                color: statusInfo?.color || '#6b7280',
              }}
            >
              {statusInfo?.name || 'Sem status'}
            </div>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover min-w-[220px]">
        {/* Editing mode */}
        {isEditing ? (
          <div className="p-2 space-y-3">
            <Input
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder="Nome do status..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') {
                  cancelEdit();
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Color picker */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Cor do status</div>
              <div className="grid grid-cols-6 gap-1.5">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center",
                      selectedColor === color 
                        ? "ring-2 ring-offset-2 ring-offset-popover ring-primary scale-110" 
                        : "hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColor(color);
                    }}
                  >
                    {selectedColor === color && (
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
                className="flex-1 h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEdit();
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveEdit();
                }}
                disabled={!newStatusName.trim()}
              >
                <Check className="h-3 w-3 mr-1" />
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Status list with edit/delete buttons */}
            {statuses.map((s) => (
              <div 
                key={s.id} 
                className="flex items-center gap-1 group hover:bg-muted/50 rounded px-1"
              >
                <SelectItem value={s.id} className="flex-1 pr-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ 
                      backgroundColor: `${s.color}30`,
                      color: s.color 
                    }}
                  >
                    {s.name}
                  </span>
                </SelectItem>
                
                {(onUpdateStatus || onDeleteStatus) && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onUpdateStatus && (
                      <button
                        type="button"
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStatus(s);
                        }}
                        title="Editar status"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    {onDeleteStatus && statuses.length > 1 && (
                      <button
                        type="button"
                        className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => handleDeleteStatus(s.id, e)}
                        title="Excluir status"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {onCreateStatus && (
              <>
                <div className="h-px bg-border/50 my-1" />
                
                {isCreating ? (
                  <div className="p-2 space-y-3">
                    <Input
                      value={newStatusName}
                      onChange={(e) => setNewStatusName(e.target.value)}
                      placeholder="Nome do status..."
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateStatus();
                        }
                        if (e.key === 'Escape') {
                          setIsCreating(false);
                          setNewStatusName('');
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Color picker */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Cor do status</div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center",
                              selectedColor === color 
                                ? "ring-2 ring-offset-2 ring-offset-popover ring-primary scale-110" 
                                : "hover:scale-110"
                            )}
                            style={{ backgroundColor: color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedColor(color);
                            }}
                          >
                            {selectedColor === color && (
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
                        className="flex-1 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreating(false);
                          setNewStatusName('');
                        }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateStatus();
                        }}
                        disabled={!newStatusName.trim()}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Criar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreating(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar status
                  </button>
                )}
              </>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
