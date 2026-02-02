import { useState } from 'react';
import {
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  MoreHorizontal,
  ListTodo,
  Edit2,
  Trash2,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TaskFolder, COLOR_PALETTE, FOLDER_ICONS } from '@/types/tasks';
import { FolderIconRenderer } from './FolderIconRenderer';

interface TaskSidebarProps {
  folders: TaskFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (folder: Partial<TaskFolder>) => Promise<TaskFolder | null>;
  onUpdateFolder: (id: string, updates: Partial<TaskFolder>) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  taskCounts: Record<string, number>;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function TaskSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  taskCounts,
  collapsed = false,
  onCollapsedChange,
}: TaskSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<TaskFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#6366f1');
  const [folderIcon, setFolderIcon] = useState('folder');

  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderColor('#6366f1');
    setFolderIcon('folder');
    setDialogOpen(true);
  };

  const handleEditFolder = (folder: TaskFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setFolderIcon(folder.icon);
    setDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) return;

    if (editingFolder) {
      await onUpdateFolder(editingFolder.id, {
        name: folderName,
        color: folderColor,
        icon: folderIcon,
      });
    } else {
      await onCreateFolder({
        name: folderName,
        color: folderColor,
        icon: folderIcon,
      });
    }
    setDialogOpen(false);
  };

  const handleDeleteFolder = async (folder: TaskFolder) => {
    if (confirm(`Excluir pasta "${folder.name}"?`)) {
      await onDeleteFolder(folder.id);
      if (selectedFolderId === folder.id) {
        onSelectFolder(null);
      }
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <>
        <div className={cn(
          "border-r border-border/30 bg-gradient-to-b from-background to-muted/20 flex flex-col h-full transition-all duration-300 ease-in-out",
          collapsed ? "w-14" : "w-56"
        )}>
          {/* Content */}
          <div className="flex-1 overflow-y-auto py-3 px-2">
            {/* All tasks */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectFolder(null)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                    collapsed && "justify-center px-2",
                    selectedFolderId === null 
                      ? "bg-primary/10 text-primary shadow-sm border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <ListTodo className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    selectedFolderId === null && "scale-110"
                  )} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">Todas as tarefas</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        selectedFolderId === null 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {totalTasks}
                      </span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  <p>Todas as tarefas ({totalTasks})</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Folders section */}
            <div className="mt-4">
              {!collapsed && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                >
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    !expanded && "-rotate-90"
                  )} />
                  <span>Pastas</span>
                  <div className="flex-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFolder();
                    }}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </button>
              )}

              {(expanded || collapsed) && (
                <div className={cn(
                  "space-y-1 transition-all duration-200",
                  !collapsed && "mt-1"
                )}>
                  {folders.map((folder) => (
                    <Tooltip key={folder.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "group flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-lg transition-all duration-200",
                            collapsed && "justify-center px-2",
                            selectedFolderId === folder.id
                              ? "bg-muted/80 text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          )}
                          onClick={() => onSelectFolder(folder.id)}
                        >
                          <div className={cn(
                            "flex items-center justify-center rounded-md p-1 transition-transform",
                            selectedFolderId === folder.id && "scale-110"
                          )}>
                            <FolderIconRenderer 
                              icon={folder.icon} 
                              color={folder.color}
                              className="h-4 w-4 shrink-0"
                            />
                          </div>
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate font-medium">{folder.name}</span>
                              <span className={cn(
                                "text-xs px-1.5 py-0.5 rounded-full transition-opacity",
                                selectedFolderId === folder.id 
                                  ? "bg-foreground/10" 
                                  : "bg-muted opacity-0 group-hover:opacity-100"
                              )}>
                                {taskCounts[folder.id] || 0}
                              </span>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded-md transition-all"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 bg-popover">
                                  <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteFolder(folder)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}
                        </div>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: folder.color }} 
                            />
                            <span>{folder.name}</span>
                            <span className="text-muted-foreground">({taskCounts[folder.id] || 0})</span>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}

                  {folders.length === 0 && !collapsed && (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-muted-foreground">Nenhuma pasta criada</p>
                      <button
                        onClick={handleCreateFolder}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Criar primeira pasta
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="p-2 border-t border-border/30 space-y-1">
            {/* Add folder button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCreateFolder}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 group",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Plus className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                  {!collapsed && <span>Nova pasta</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  <p>Nova pasta</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Collapse toggle */}
            {onCollapsedChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onCollapsedChange(!collapsed)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 group",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <div className={cn(
                      "transition-transform duration-300",
                      collapsed ? "rotate-180" : "rotate-0"
                    )}>
                      <ChevronLeft className="h-4 w-4 shrink-0" />
                    </div>
                    {!collapsed && <span>Recolher</span>}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="font-medium">
                    <p>Expandir</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </div>

      {/* Folder dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'Editar pasta' : 'Nova pasta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome</label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Nome da pasta"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Cor</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFolderColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform hover:scale-110",
                      folderColor === color && "ring-2 ring-offset-2 ring-offset-background ring-white"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Ícone</label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {FOLDER_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFolderIcon(icon)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors",
                      folderIcon === icon && "bg-muted ring-1 ring-primary"
                    )}
                  >
                    <FolderIconRenderer 
                      icon={icon} 
                      color={folderColor}
                      className="h-4 w-4"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFolder} disabled={!folderName.trim()}>
                {editingFolder ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
    </TooltipProvider>
  );
}
