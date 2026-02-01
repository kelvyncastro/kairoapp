import { useState } from 'react';
import { Plus, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TaskStatus, COLOR_PALETTE } from '@/types/tasks';
import { isBefore, parseISO, startOfDay } from 'date-fns';

// Virtual "Atrasada" status color
const OVERDUE_COLOR = '#dc2626';

interface StatusSelectWithCreateProps {
  statuses: TaskStatus[];
  value: string | null;
  onChange: (statusId: string) => void;
  onCreateStatus?: (status: Partial<TaskStatus>) => Promise<TaskStatus | null>;
  className?: string;
  isOverdue?: boolean; // Whether the task is overdue
}

export function StatusSelectWithCreate({
  statuses,
  value,
  onChange,
  onCreateStatus,
  className,
  isOverdue = false,
}: StatusSelectWithCreateProps) {
  const [isCreating, setIsCreating] = useState(false);
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

  return (
    <Select
      value={value || ''}
      onValueChange={(val) => {
        if (val === '__create__') {
          setIsCreating(true);
        } else {
          onChange(val);
        }
      }}
    >
      <SelectTrigger className={cn("h-7 text-xs border-0 bg-transparent hover:bg-muted/50 p-0", className)}>
        {isOverdue && !isCompleted ? (
          <span
            className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
            style={{ 
              backgroundColor: `${OVERDUE_COLOR}30`,
              color: OVERDUE_COLOR
            }}
          >
            <AlertTriangle className="h-3 w-3" />
            Atrasada
          </span>
        ) : (
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ 
              backgroundColor: statusInfo ? `${statusInfo.color}30` : '#6b728030',
              color: statusInfo?.color || '#6b7280'
            }}
          >
            {statusInfo?.name || 'Sem status'}
          </span>
        )}
      </SelectTrigger>
      <SelectContent className="bg-popover">
        {statuses.map((s) => (
          <SelectItem key={s.id} value={s.id}>
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
      </SelectContent>
    </Select>
  );
}
