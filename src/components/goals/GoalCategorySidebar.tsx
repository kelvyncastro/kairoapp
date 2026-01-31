import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus,
  MoreHorizontal,
  Target,
  Edit2,
  Trash2,
  DollarSign,
  Dumbbell,
  Heart,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { COLOR_PALETTE } from '@/types/tasks';

export interface GoalCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault?: boolean;
}

interface GoalCategorySidebarProps {
  categories: GoalCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onCreateCategory: (category: Partial<GoalCategory>) => Promise<GoalCategory | null>;
  onUpdateCategory: (id: string, updates: Partial<GoalCategory>) => Promise<boolean>;
  onDeleteCategory: (id: string) => Promise<boolean>;
  goalCounts: Record<string, number>;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'dollar-sign': <DollarSign className="h-4 w-4" />,
  'dumbbell': <Dumbbell className="h-4 w-4" />,
  'heart': <Heart className="h-4 w-4" />,
  'user': <User className="h-4 w-4" />,
  'target': <Target className="h-4 w-4" />,
};

export function GoalCategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  goalCounts,
}: GoalCategorySidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GoalCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#6366f1');

  const totalGoals = Object.values(goalCounts).reduce((a, b) => a + b, 0);

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryColor('#6366f1');
    setDialogOpen(true);
  };

  const handleEditCategory = (category: GoalCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color);
    setDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;

    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, {
        name: categoryName,
        color: categoryColor,
      });
    } else {
      await onCreateCategory({
        name: categoryName,
        color: categoryColor,
        icon: 'target',
      });
    }
    setDialogOpen(false);
  };

  const handleDeleteCategory = async (category: GoalCategory) => {
    if (category.isDefault) return;
    if (confirm(`Excluir categoria "${category.name}"?`)) {
      await onDeleteCategory(category.id);
      if (selectedCategoryId === category.id) {
        onSelectCategory(null);
      }
    }
  };

  return (
    <>
      <div className="w-56 border-r border-border/30 bg-background flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b border-border/30">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Metas
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-1">
          {/* All goals */}
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors",
              selectedCategoryId === null 
                ? "bg-muted/50 text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <Target className="h-4 w-4" />
            <span className="flex-1 text-left">Todas as metas</span>
            <span className="text-xs text-muted-foreground">{totalGoals}</span>
          </button>

          {/* Categories section */}
          <div className="mt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Categorias</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateCategory();
                }}
                className="ml-auto p-0.5 hover:bg-muted rounded"
              >
                <Plus className="h-3 w-3" />
              </button>
            </button>

            {expanded && (
              <div className="space-y-0.5 mt-1">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors",
                      selectedCategoryId === category.id
                        ? "bg-muted/50"
                        : "hover:bg-muted/30"
                    )}
                    onClick={() => onSelectCategory(category.id)}
                  >
                    <span 
                      className="h-4 w-4 flex items-center justify-center shrink-0"
                      style={{ color: category.color }}
                    >
                      {CATEGORY_ICONS[category.icon] || <Target className="h-4 w-4" />}
                    </span>
                    <span 
                      className="flex-1 truncate font-medium"
                      style={{ color: category.color }}
                    >
                      {category.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {goalCounts[category.id] || 0}
                    </span>
                    
                    {!category.isDefault && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 bg-popover">
                          <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                            <Edit2 className="h-3.5 w-3.5 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}

                {categories.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Nenhuma categoria criada
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add category button */}
        <div className="p-2 border-t border-border/30">
          <button
            onClick={handleCreateCategory}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nova categoria</span>
          </button>
        </div>
      </div>

      {/* Category dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar categoria' : 'Nova categoria'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome</label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Nome da categoria"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Cor</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCategoryColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform hover:scale-110",
                      categoryColor === color && "ring-2 ring-offset-2 ring-offset-background ring-white"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCategory} disabled={!categoryName.trim()}>
                {editingCategory ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
