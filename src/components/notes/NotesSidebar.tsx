import { useState, useMemo, DragEvent } from 'react';
import { NotesPage, NotesFolder } from '@/types/notes';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Plus, Star, Clock, FolderOpen, ChevronRight, ChevronDown,
  MoreHorizontal, Copy, FolderInput, Archive, Trash2, Edit3, FileText, FolderPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotesSidebarProps {
  pages: NotesPage[];
  folders: NotesFolder[];
  favoritePages: NotesPage[];
  recentPages: NotesPage[];
  selectedPageId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectPage: (id: string) => void;
  onCreatePage: (folderId?: string | null) => void;
  onDeletePage: (id: string) => void;
  onDuplicatePage: (id: string) => void;
  onArchivePage: (id: string) => void;
  onMoveToFolder: (pageId: string, folderId: string | null) => void;
  onToggleFavorite: (id: string) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onToggleFolder: (id: string) => void;
}

export function NotesSidebar({
  pages, folders, favoritePages, recentPages,
  selectedPageId, searchQuery,
  onSearchChange, onSelectPage, onCreatePage,
  onDeletePage, onDuplicatePage, onArchivePage, onMoveToFolder,
  onToggleFavorite, onCreateFolder, onDeleteFolder, onRenameFolder, onToggleFolder,
}: NotesSidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'page' | 'folder'; id: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const orphanPages = pages.filter(p => !p.folderId && !p.isArchived);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleRename = (folderId: string) => {
    if (!renameValue.trim()) return;
    onRenameFolder(folderId, renameValue.trim());
    setRenamingFolder(null);
  };

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Notas
          </h2>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onCreatePage()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar paginas..."
            className="h-8 pl-8 text-xs"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Favorites */}
          {favoritePages.length > 0 && (
            <SidebarSection title="Favoritos" icon={<Star className="h-3.5 w-3.5" />}>
              {favoritePages.map(page => (
                <PageItem
                  key={page.id}
                  page={page}
                  isSelected={page.id === selectedPageId}
                  folders={folders}
                  onSelect={() => onSelectPage(page.id)}
                  onDelete={() => setDeleteTarget({ type: 'page', id: page.id })}
                  onDuplicate={() => onDuplicatePage(page.id)}
                  onArchive={() => onArchivePage(page.id)}
                  onMoveToFolder={(fid) => onMoveToFolder(page.id, fid)}
                  onToggleFavorite={() => onToggleFavorite(page.id)}
                />
              ))}
            </SidebarSection>
          )}

          {/* Recent */}
          {!searchQuery && (
            <SidebarSection title="Recentes" icon={<Clock className="h-3.5 w-3.5" />}>
              {recentPages.slice(0, 3).map(page => (
                <PageItem
                  key={page.id}
                  page={page}
                  isSelected={page.id === selectedPageId}
                  folders={folders}
                  onSelect={() => onSelectPage(page.id)}
                  onDelete={() => setDeleteTarget({ type: 'page', id: page.id })}
                  onDuplicate={() => onDuplicatePage(page.id)}
                  onArchive={() => onArchivePage(page.id)}
                  onMoveToFolder={(fid) => onMoveToFolder(page.id, fid)}
                  onToggleFavorite={() => onToggleFavorite(page.id)}
                />
              ))}
            </SidebarSection>
          )}

          {/* Folders */}
          <SidebarSection
            title="Pastas"
            icon={<FolderOpen className="h-3.5 w-3.5" />}
            action={
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setShowNewFolder(true)}>
                <FolderPlus className="h-3 w-3" />
              </Button>
            }
          >
            {showNewFolder && (
              <div className="flex gap-1 mb-1">
                <Input
                  className="h-7 text-xs"
                  placeholder="Nome da pasta"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                  autoFocus
                />
                <Button size="sm" className="h-7 px-2 text-xs" onClick={handleCreateFolder}>OK</Button>
              </div>
            )}
            {folders.map(folder => {
              const folderPages = pages.filter(p => p.folderId === folder.id && !p.isArchived);
              return (
                <div key={folder.id}>
                  <div className="flex items-center gap-1 group">
                    <button
                      className="flex items-center gap-1.5 flex-1 text-xs py-1 px-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                      onClick={() => onToggleFolder(folder.id)}
                    >
                      {folder.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <FolderOpen className="h-3.5 w-3.5 text-primary/70" />
                      {renamingFolder === folder.id ? (
                        <input
                          className="flex-1 bg-transparent outline-none text-xs"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(folder.id); if (e.key === 'Escape') setRenamingFolder(null); }}
                          onBlur={() => handleRename(folder.id)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="flex-1 truncate font-medium">{folder.name}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{folderPages.length}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onCreatePage(folder.id)} className="text-xs gap-2">
                          <Plus className="h-3 w-3" /> Nova pagina
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setRenamingFolder(folder.id); setRenameValue(folder.name); }} className="text-xs gap-2">
                          <Edit3 className="h-3 w-3" /> Renomear
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteTarget({ type: 'folder', id: folder.id })} className="text-xs gap-2 text-destructive">
                          <Trash2 className="h-3 w-3" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {folder.isExpanded && (
                    <div className="ml-4 space-y-0.5">
                      {folderPages.length === 0 && (
                        <p className="text-[10px] text-muted-foreground py-1 px-2">Vazia</p>
                      )}
                      {folderPages.map(page => (
                        <PageItem
                          key={page.id}
                          page={page}
                          isSelected={page.id === selectedPageId}
                          folders={folders}
                          onSelect={() => onSelectPage(page.id)}
                          onDelete={() => setDeleteTarget({ type: 'page', id: page.id })}
                          onDuplicate={() => onDuplicatePage(page.id)}
                          onArchive={() => onArchivePage(page.id)}
                          onMoveToFolder={(fid) => onMoveToFolder(page.id, fid)}
                          onToggleFavorite={() => onToggleFavorite(page.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </SidebarSection>

          {/* Orphan pages */}
          {orphanPages.length > 0 && (
            <SidebarSection title="Paginas" icon={<FileText className="h-3.5 w-3.5" />}>
              {orphanPages.map(page => (
                <PageItem
                  key={page.id}
                  page={page}
                  isSelected={page.id === selectedPageId}
                  folders={folders}
                  onSelect={() => onSelectPage(page.id)}
                  onDelete={() => setDeleteTarget({ type: 'page', id: page.id })}
                  onDuplicate={() => onDuplicatePage(page.id)}
                  onArchive={() => onArchivePage(page.id)}
                  onMoveToFolder={(fid) => onMoveToFolder(page.id, fid)}
                  onToggleFavorite={() => onToggleFavorite(page.id)}
                />
              ))}
            </SidebarSection>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'page'
                ? 'Tem certeza que deseja excluir esta pagina? Essa acao nao pode ser desfeita.'
                : 'Excluir esta pasta? As paginas dentro dela serao movidas para fora.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteTarget?.type === 'page') onDeletePage(deleteTarget.id);
              else if (deleteTarget?.type === 'folder') onDeleteFolder(deleteTarget.id);
              setDeleteTarget(null);
            }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SidebarSection({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between px-1.5 mb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {icon} {title}
        </div>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function PageItem({ page, isSelected, folders, onSelect, onDelete, onDuplicate, onArchive, onMoveToFolder, onToggleFavorite }: {
  page: NotesPage; isSelected: boolean; folders: NotesFolder[];
  onSelect: () => void; onDelete: () => void; onDuplicate: () => void;
  onArchive: () => void; onMoveToFolder: (fid: string | null) => void; onToggleFavorite: () => void;
}) {
  return (
    <div className="group flex items-center gap-1">
      <button
        className={cn(
          'flex items-center gap-2 flex-1 text-xs py-1.5 px-2 rounded-lg transition-colors text-left truncate',
          isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'
        )}
        onClick={onSelect}
      >
        <span className="text-sm flex-shrink-0">{page.icon}</span>
        <span className="truncate">{page.title}</span>
        {page.isFavorite && <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 flex-shrink-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onToggleFavorite} className="text-xs gap-2">
            <Star className="h-3 w-3" /> {page.isFavorite ? 'Remover favorito' : 'Favoritar'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} className="text-xs gap-2">
            <Copy className="h-3 w-3" /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {folders.filter(f => f.id !== page.folderId).map(f => (
            <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(f.id)} className="text-xs gap-2">
              <FolderInput className="h-3 w-3" /> Mover para {f.name}
            </DropdownMenuItem>
          ))}
          {page.folderId && (
            <DropdownMenuItem onClick={() => onMoveToFolder(null)} className="text-xs gap-2">
              <FolderInput className="h-3 w-3" /> Remover da pasta
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onArchive} className="text-xs gap-2">
            <Archive className="h-3 w-3" /> {page.isArchived ? 'Desarquivar' : 'Arquivar'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-xs gap-2 text-destructive">
            <Trash2 className="h-3 w-3" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
