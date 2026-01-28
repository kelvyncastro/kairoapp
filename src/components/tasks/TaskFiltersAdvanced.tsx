import { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Filter, 
  Trash2, 
  Save, 
  ChevronDown,
  CalendarIcon,
  Type,
  Clock,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@/types/tasks';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Filter field types
export type FilterField = 'title' | 'start_date' | 'due_date' | 'status' | 'priority';
export type FilterOperator = 'is' | 'is_not' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
export type DateOperator = 'is' | 'is_before' | 'is_after' | 'is_between';
export type DatePreset = 
  | 'today' 
  | 'yesterday' 
  | 'tomorrow' 
  | 'next_7_days' 
  | 'last_7_days' 
  | 'this_week' 
  | 'next_week' 
  | 'last_month' 
  | 'this_month' 
  | 'next_month'
  | 'overdue'
  | 'no_date';

export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator | DateOperator;
  value: string | string[] | DatePreset | null;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: FilterCondition[];
}

const FILTER_FIELDS = [
  { id: 'title', label: 'Nome', icon: Type },
  { id: 'start_date', label: 'Data de início', icon: CalendarIcon },
  { id: 'due_date', label: 'Data de vencimento', icon: Clock },
  { id: 'status', label: 'Status', icon: Tag },
  { id: 'priority', label: 'Prioridade', icon: Tag },
] as const;

const TEXT_OPERATORS = [
  { id: 'contains', label: 'Contém' },
  { id: 'not_contains', label: 'Não contém' },
  { id: 'is', label: 'É exatamente' },
  { id: 'is_empty', label: 'Está vazio' },
  { id: 'is_not_empty', label: 'Não está vazio' },
];

const DATE_OPERATORS = [
  { id: 'is', label: 'É' },
  { id: 'is_before', label: 'É antes de' },
  { id: 'is_after', label: 'É depois de' },
];

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'tomorrow', label: 'Amanhã' },
  { id: 'next_7_days', label: 'Próximos 7 dias' },
  { id: 'last_7_days', label: 'Últimos 7 dias' },
  { id: 'this_week', label: 'Esta semana' },
  { id: 'next_week', label: 'Semana que vem' },
  { id: 'last_month', label: 'Mês passado' },
  { id: 'this_month', label: 'Este mês' },
  { id: 'next_month', label: 'Próximo mês' },
  { id: 'overdue', label: 'Em atraso' },
  { id: 'no_date', label: 'Sem data' },
];

const PRIORITY_OPTIONS = [
  { id: '3', label: 'Urgente', color: '#ef4444' },
  { id: '2', label: 'Alta', color: '#f59e0b' },
  { id: '1', label: 'Normal', color: '#3b82f6' },
  { id: '0', label: 'Baixa', color: '#6b7280' },
];

interface TaskFiltersAdvancedProps {
  statuses: TaskStatus[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  savedFilters: SavedFilter[];
  onSaveFilter: (name: string, filters: FilterCondition[]) => Promise<void>;
  onDeleteSavedFilter: (id: string) => Promise<void>;
  onLoadSavedFilter: (filter: SavedFilter) => void;
}

export function TaskFiltersAdvanced({
  statuses,
  filters,
  onFiltersChange,
  savedFilters,
  onSaveFilter,
  onDeleteSavedFilter,
  onLoadSavedFilter,
}: TaskFiltersAdvancedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: crypto.randomUUID(),
      field: 'title',
      operator: 'contains',
      value: '',
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    onFiltersChange(
      filters.map(f => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter(f => f.id !== id));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error('Digite um nome para o filtro');
      return;
    }
    await onSaveFilter(filterName.trim(), filters);
    setFilterName('');
    setSaveDialogOpen(false);
  };

  const getOperatorsForField = (field: FilterField) => {
    if (field === 'start_date' || field === 'due_date') {
      return DATE_OPERATORS;
    }
    if (field === 'status' || field === 'priority') {
      return [
        { id: 'is', label: 'É' },
        { id: 'is_not', label: 'Não é' },
      ];
    }
    return TEXT_OPERATORS;
  };

  const hasActiveFilters = filters.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("h-8", hasActiveFilters && "text-primary")}
        >
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1.5 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {filters.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[600px] p-0 bg-popover border-border" 
        align="start"
        side="bottom"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Filtros</span>
          </div>
          
          {/* Saved filters dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Filtros salvos
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              {savedFilters.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  Nenhum filtro salvo
                </div>
              ) : (
                savedFilters.map((saved) => (
                  <DropdownMenuItem
                    key={saved.id}
                    className="flex items-center justify-between"
                  >
                    <span 
                      className="flex-1 cursor-pointer"
                      onClick={() => onLoadSavedFilter(saved)}
                    >
                      {saved.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-destructive/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSavedFilter(saved.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters list */}
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {filters.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhum filtro aplicado
            </div>
          ) : (
            filters.map((filter, index) => (
              <FilterRow
                key={filter.id}
                filter={filter}
                statuses={statuses}
                onUpdate={(updates) => updateFilter(filter.id, updates)}
                onRemove={() => removeFilter(filter.id)}
                getOperatorsForField={getOperatorsForField}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={addFilter}
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar filtro
          </Button>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={clearAllFilters}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
                
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-7 text-xs">
                      <Save className="h-3 w-3 mr-1" />
                      Salvar filtro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Salvar filtro</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Nome do filtro..."
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveFilter();
                        }}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveFilter}>
                        Salvar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Individual filter row component
interface FilterRowProps {
  filter: FilterCondition;
  statuses: TaskStatus[];
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
  getOperatorsForField: (field: FilterField) => { id: string; label: string }[];
}

function FilterRow({ filter, statuses, onUpdate, onRemove, getOperatorsForField }: FilterRowProps) {
  const [fieldOpen, setFieldOpen] = useState(false);
  const [valueOpen, setValueOpen] = useState(false);

  const selectedField = FILTER_FIELDS.find(f => f.id === filter.field);
  const operators = getOperatorsForField(filter.field);

  // Reset value when field changes
  const handleFieldChange = (newField: FilterField) => {
    const newOperator = newField === 'start_date' || newField === 'due_date' 
      ? 'is' 
      : newField === 'status' || newField === 'priority'
        ? 'is'
        : 'contains';
    onUpdate({ field: newField, operator: newOperator as any, value: '' });
    setFieldOpen(false);
  };

  const renderValueSelector = () => {
    // Date fields
    if (filter.field === 'start_date' || filter.field === 'due_date') {
      return (
        <Popover open={valueOpen} onOpenChange={setValueOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-[140px] justify-between text-xs"
            >
              {filter.value 
                ? DATE_PRESETS.find(p => p.id === filter.value)?.label || 'Selecionar'
                : 'Selecionar opção'
              }
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Pesquisar..." className="h-9" />
              <CommandList>
                <CommandEmpty>Nenhum resultado</CommandEmpty>
                <CommandGroup>
                  {DATE_PRESETS.map((preset) => (
                    <CommandItem
                      key={preset.id}
                      value={preset.id}
                      onSelect={() => {
                        onUpdate({ value: preset.id });
                        setValueOpen(false);
                      }}
                    >
                      {preset.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    // Status field
    if (filter.field === 'status') {
      return (
        <Popover open={valueOpen} onOpenChange={setValueOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-[140px] justify-between text-xs"
            >
              {filter.value 
                ? statuses.find(s => s.id === filter.value)?.name || 'Selecionar'
                : 'Selecionar status'
              }
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Pesquisar..." className="h-9" />
              <CommandList>
                <CommandEmpty>Nenhum resultado</CommandEmpty>
                <CommandGroup>
                  {statuses.map((status) => (
                    <CommandItem
                      key={status.id}
                      value={status.id}
                      onSelect={() => {
                        onUpdate({ value: status.id });
                        setValueOpen(false);
                      }}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    // Priority field
    if (filter.field === 'priority') {
      return (
        <Popover open={valueOpen} onOpenChange={setValueOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 min-w-[140px] justify-between text-xs"
            >
              {filter.value 
                ? PRIORITY_OPTIONS.find(p => p.id === filter.value)?.label || 'Selecionar'
                : 'Selecionar prioridade'
              }
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <CommandItem
                      key={priority.id}
                      value={priority.id}
                      onSelect={() => {
                        onUpdate({ value: priority.id });
                        setValueOpen(false);
                      }}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: priority.color }}
                      />
                      {priority.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    // Text field (title)
    if (filter.operator === 'is_empty' || filter.operator === 'is_not_empty') {
      return null;
    }

    return (
      <Input
        placeholder="Digite o valor..."
        value={filter.value as string || ''}
        onChange={(e) => onUpdate({ value: e.target.value })}
        className="h-8 text-xs flex-1 min-w-[140px]"
      />
    );
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/30">
      {/* Field selector */}
      <Popover open={fieldOpen} onOpenChange={setFieldOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 min-w-[130px] justify-between text-xs"
          >
            {selectedField && (
              <selectedField.icon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            )}
            {selectedField?.label || 'Selecionar'}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Pesquisar..." className="h-9" />
            <CommandList>
              <CommandEmpty>Nenhum resultado</CommandEmpty>
              <CommandGroup>
                {FILTER_FIELDS.map((field) => (
                  <CommandItem
                    key={field.id}
                    value={field.id}
                    onSelect={() => handleFieldChange(field.id as FilterField)}
                  >
                    <field.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {field.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Operator selector */}
      <Select
        value={filter.operator}
        onValueChange={(value) => onUpdate({ operator: value as any })}
      >
        <SelectTrigger className="h-8 w-[100px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.id} value={op.id} className="text-xs">
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value selector */}
      {renderValueSelector()}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
