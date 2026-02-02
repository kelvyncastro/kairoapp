import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  MoreHorizontal,
  ListTodo,
  Edit2,
  Trash2,
  PanelLeftClose,
  PanelLeft,
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
        <motion.div 
          className="border-r border-border/40 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 flex flex-col h-full relative overflow-hidden"
          animate={{ width: collapsed ? 56 : 224 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            {/* Section label */}
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="px-3 mb-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]"
                >
                  Navegação
                </motion.p>
              )}
            </AnimatePresence>

            {/* All tasks */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => onSelectFolder(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 relative overflow-hidden",
                    collapsed && "justify-center px-2",
                    selectedFolderId === null 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {selectedFolderId === null && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/80"
                      layoutId="activeIndicator"
                    />
                  )}
                  <ListTodo className={cn(
                    "h-4 w-4 shrink-0 relative z-10 transition-all",
                    selectedFolderId === null && "drop-shadow-sm"
                  )} />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center gap-2 flex-1 relative z-10 overflow-hidden"
                      >
                        <span className="flex-1 text-left font-semibold whitespace-nowrap">Todas as tarefas</span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center",
                          selectedFolderId === null 
                            ? "bg-white/20 text-white" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {totalTasks}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8} className="font-medium bg-popover border shadow-lg">
                  <p>Todas as tarefas ({totalTasks})</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Folders section */}
            <div className="mt-6">
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] hover:text-muted-foreground transition-colors group"
                  >
                    <motion.div
                      animate={{ rotate: expanded ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                    <span>Pastas</span>
                    <div className="flex-1" />
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFolder();
                      }}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </motion.button>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(expanded || collapsed) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "space-y-1 overflow-hidden",
                      !collapsed && "mt-2"
                    )}
                  >
                    {folders.map((folder, index) => (
                      <Tooltip key={folder.id}>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: collapsed ? 0 : 4 }}
                            className={cn(
                              "group flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-xl transition-all duration-200",
                              collapsed && "justify-center px-2",
                              selectedFolderId === folder.id
                                ? "bg-muted text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                            onClick={() => onSelectFolder(folder.id)}
                          >
                            <motion.div 
                              className="flex items-center justify-center"
                              whileHover={{ scale: 1.15, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ 
                                  backgroundColor: `${folder.color}15`,
                                  boxShadow: selectedFolderId === folder.id ? `0 0 0 2px ${folder.color}40` : 'none'
                                }}
                              >
                                <FolderIconRenderer 
                                  icon={folder.icon} 
                                  color={folder.color}
                                  className="h-4 w-4 shrink-0"
                                />
                              </div>
                            </motion.div>
                            <AnimatePresence mode="wait">
                              {!collapsed && (
                                <motion.div
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  className="flex items-center gap-2 flex-1 overflow-hidden"
                                >
                                  <span className="flex-1 truncate font-medium">{folder.name}</span>
                                  <span className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all min-w-[18px] text-center",
                                    selectedFolderId === folder.id 
                                      ? "bg-foreground/10" 
                                      : "bg-transparent opacity-0 group-hover:opacity-100 group-hover:bg-muted"
                                  )}>
                                    {taskCounts[folder.id] || 0}
                                  </span>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <motion.button
                                        onClick={(e) => e.stopPropagation()}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded-lg transition-all"
                                      >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </motion.button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36 bg-popover border shadow-xl">
                                      <DropdownMenuItem onClick={() => handleEditFolder(folder)} className="gap-2">
                                        <Edit2 className="h-3.5 w-3.5" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive gap-2"
                                        onClick={() => handleDeleteFolder(folder)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right" sideOffset={8} className="font-medium bg-popover border shadow-lg">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2.5 h-2.5 rounded-full shadow-sm" 
                                style={{ backgroundColor: folder.color }} 
                              />
                              <span>{folder.name}</span>
                              <span className="text-muted-foreground text-xs">({taskCounts[folder.id] || 0})</span>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}

                    {folders.length === 0 && !collapsed && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-3 py-6 text-center"
                      >
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
                          <Plus className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Nenhuma pasta criada</p>
                        <button
                          onClick={handleCreateFolder}
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Criar primeira pasta
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="p-3 border-t border-border/40 space-y-1.5 bg-gradient-to-t from-muted/30 to-transparent">
            {/* Add folder button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={handleCreateFolder}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 group border border-transparent hover:border-primary/20",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        Nova pasta
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8} className="font-medium bg-popover border shadow-lg">
                  <p>Nova pasta</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Collapse toggle */}
            {onCollapsedChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => onCollapsedChange(!collapsed)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-all duration-200",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <motion.div
                      animate={{ rotate: collapsed ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {collapsed ? (
                        <PanelLeft className="h-4 w-4 shrink-0" />
                      ) : (
                        <PanelLeftClose className="h-4 w-4 shrink-0" />
                      )}
                    </motion.div>
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium whitespace-nowrap overflow-hidden"
                        >
                          Recolher painel
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" sideOffset={8} className="font-medium bg-popover border shadow-lg">
                    <p>Expandir painel</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </motion.div>

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
