import { useMemo, useState } from 'react';
import { NotesPage, NotesFolder } from '@/types/notes';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Plus, Star, FolderOpen, ChevronRight, ChevronDown,
  MoreHorizontal, Copy, Archive, Trash2, Edit3, FileText, FolderPlus, Users,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, isToday, isThisWeek, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotesHomeProps {
  pages: NotesPage[];
  folders: NotesFolder[];
  sharedPages: (NotesPage & { permission: 'view' | 'edit'; ownerName?: string })[];
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

type TimeGroup = 'today' | 'week' | 'month' | 'older';

function getTimeGroup(dateStr: string): TimeGroup {
  const date = new Date(dateStr);
  if (isToday(date)) return 'today';
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'week';
  if (differenceInDays(new Date(), date) <= 30) return 'month';
  return 'older';
}

const groupLabels: Record<TimeGroup, string> = {
  today: 'Hoje',
  week: 'Última semana',
  month: 'Últimos 30 dias',
  older: 'Mais antigas',
};

export function NotesHome({
  pages, folders, sharedPages, searchQuery,
  onSearchChange, onSelectPage, onCreatePage,
  onDeletePage, onDuplicatePage, onArchivePage, onMoveToFolder,
  onToggleFavorite, onCreateFolder, onDeleteFolder, onRenameFolder, onToggleFolder,
}: NotesHomeProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'page' | 'folder'; id: string } | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'folders'>('recent');
  const [orphansCollapsed, setOrphansCollapsed] = useState(false);

  // Filter pages
  const filteredPages = useMemo(() => {
    const visible = pages.filter(p => !p.isArchived && !p.parentId);
    if (!searchQuery) return visible;
    const q = searchQuery.toLowerCase();
    return visible.filter(p =>
      p.title.toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q)
    );
  }, [pages, searchQuery]);

  // Group pages by time
  const groupedPages = useMemo(() => {
    const sorted = [...filteredPages].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const groups: Record<TimeGroup, NotesPage[]> = { today: [], week: [], month: [], older: [] };
    sorted.forEach(p => groups[getTimeGroup(p.updatedAt)].push(p));
    return groups;
  }, [filteredPages]);

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

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return null;
    return folders.find(f => f.id === folderId)?.name;
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 md:px-8 pt-6 pb-4 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notas..."
            className="pl-10 h-10 text-sm bg-muted/30 border-border/50"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Create new page button */}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => onCreatePage()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-colors group"
          >
            <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Criar nova página</span>
          </button>
        </div>

        {/* Tabs: Recent / Folders */}
        <div className="max-w-2xl mx-auto flex gap-1 border-b border-border/30">
          <button
            onClick={() => setActiveTab('recent')}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'recent'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Recentes
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={cn(
              'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'folders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Pastas
          </button>
          {sharedPages.length > 0 && (
            <button
              onClick={() => setActiveTab('folders')} // We'll show shared in folders tab for now
              className="px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground"
            >
              <Users className="h-3 w-3 inline mr-1" />
              Compartilhadas ({sharedPages.length})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 md:px-8 pb-24">
          {activeTab === 'recent' ? (
            <>
              {/* Time-grouped pages */}
              {(['today', 'week', 'month', 'older'] as TimeGroup[]).map(group => {
                const items = groupedPages[group];
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-6">
                    <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {groupLabels[group]}
                    </h3>
                    <div className="space-y-1">
                      {items.map(page => (
                        <PageListItem
                          key={page.id}
                          page={page}
                          folderName={getFolderName(page.folderId)}
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
                  </div>
                );
              })}

              {filteredPages.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma nota encontrada</p>
                  <p className="text-xs mt-1">Crie sua primeira nota acima</p>
                </div>
              )}

              {/* Shared pages section */}
              {sharedPages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    Compartilhadas comigo
                  </h3>
                  <div className="space-y-0.5">
                    {sharedPages.map(page => (
                      <button
                        key={page.id}
                        onClick={() => onSelectPage(page.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                      >
                        <span className="text-lg flex-shrink-0">
                          {page.icon.startsWith('http') ? (
                            <img src={page.icon} alt="" className="w-5 h-5 rounded object-cover" />
                          ) : page.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{page.title || 'Sem titulo'}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {page.ownerName || 'Alguém'} · {page.permission === 'edit' ? 'Editar' : 'Visualizar'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Folders tab */
            <div className="space-y-4">
              {/* Create folder button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setShowNewFolder(true)}
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  Nova pasta
                </Button>
              </div>

              {showNewFolder && (
                <div className="flex gap-2 items-center">
                  <Input
                    className="h-8 text-sm flex-1"
                    placeholder="Nome da pasta"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                    autoFocus
                  />
                  <Button size="sm" className="h-8" onClick={handleCreateFolder}>Criar</Button>
                </div>
              )}

              {folders.map(folder => {
                const folderPages = pages.filter(p => p.folderId === folder.id && !p.isArchived && !p.parentId);
                return (
                  <div key={folder.id} className="space-y-1">
                   <div className="flex items-center gap-2 group">
                      <button
                        className="flex items-center gap-3 flex-1 text-base py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                        onClick={() => onToggleFolder(folder.id)}
                      >
                        {folder.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <FolderOpen className="h-5 w-5 text-primary/70" />
                        {renamingFolder === folder.id ? (
                          <input
                            className="flex-1 bg-transparent outline-none text-sm"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(folder.id); if (e.key === 'Escape') setRenamingFolder(null); }}
                            onBlur={() => handleRename(folder.id)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="flex-1 font-medium">{folder.name}</span>
                        )}
                        <span className="text-sm text-muted-foreground">{folderPages.length}</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onCreatePage(folder.id)} className="text-xs gap-2">
                            <Plus className="h-3 w-3" /> Nova página
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
                      <div className="ml-6 space-y-0.5">
                        {folderPages.length === 0 && (
                          <p className="text-xs text-muted-foreground py-2 px-2">Pasta vazia</p>
                        )}
                        {folderPages.map(page => (
                          <PageListItem
                            key={page.id}
                            page={page}
                            folderName={null}
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

              {/* Orphan pages */}
              {(() => {
                const orphans = pages.filter(p => !p.folderId && !p.isArchived && !p.parentId);
                if (orphans.length === 0) return null;
                return (
                  <div className="space-y-1">
                    <button
                      onClick={() => setOrphansCollapsed(prev => !prev)}
                      className="flex items-center gap-3 text-base py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors text-left w-full"
                    >
                      {orphansCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1 font-medium">Sem pasta</span>
                      <span className="text-sm text-muted-foreground">{orphans.length}</span>
                    </button>
                    {!orphansCollapsed && (
                      <div className="ml-6 space-y-1">
                        {orphans.map(page => (
                          <PageListItem
                            key={page.id}
                            page={page}
                            folderName={null}
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
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'page'
                ? 'Tem certeza que deseja excluir esta página? Essa ação não pode ser desfeita.'
                : 'Excluir esta pasta? As páginas dentro dela serão movidas para fora.'}
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

function PageListItem({ page, folderName, folders, onSelect, onDelete, onDuplicate, onArchive, onMoveToFolder, onToggleFavorite }: {
  page: NotesPage;
  folderName: string | null;
  folders: NotesFolder[];
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onMoveToFolder: (fid: string | null) => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group flex items-center gap-1">
      <button
        onClick={onSelect}
        className="flex items-center gap-3 flex-1 px-3 py-3.5 rounded-xl hover:bg-muted/50 transition-colors text-left min-w-0"
      >
        <span className="text-xl flex-shrink-0">
          {page.icon.startsWith('http') ? (
            <img src={page.icon} alt="" className="w-6 h-6 rounded object-cover" />
          ) : page.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium truncate">{page.title || 'Sem titulo'}</span>
            {page.isFavorite && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          </div>
          {folderName && (
            <span className="text-[11px] text-muted-foreground truncate block">
              {folderName}
            </span>
          )}
        </div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 flex-shrink-0">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onToggleFavorite} className="text-xs gap-2">
            <Star className="h-3 w-3" /> {page.isFavorite ? 'Remover favorito' : 'Favoritar'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} className="text-xs gap-2">
            <Copy className="h-3 w-3" /> Duplicar
          </DropdownMenuItem>
          {folders.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs gap-2">
                <FolderOpen className="h-3 w-3" /> Mover para
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onMoveToFolder(null)} className="text-xs">
                  Sem pasta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {folders.map(f => (
                  <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(f.id)} className="text-xs">
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuItem onClick={onArchive} className="text-xs gap-2">
            <Archive className="h-3 w-3" /> Arquivar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-xs gap-2 text-destructive focus:text-destructive">
            <Trash2 className="h-3 w-3" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
