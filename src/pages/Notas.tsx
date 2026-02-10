import { useState } from 'react';
import { useNotesStore } from '@/hooks/useNotesStore';
import { NotesSidebar } from '@/components/notes/NotesSidebar';
import { NotesEditor } from '@/components/notes/NotesEditor';
import { CommentsPanel } from '@/components/notes/CommentsPanel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, PanelLeftClose, PanelLeft, MessageSquare, PanelRightClose } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Notas() {
  const store = useNotesStore();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [commentsOpen, setCommentsOpen] = useState(!isMobile);

  return (
    <div className="h-full flex rounded-xl overflow-hidden border border-border bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className={cn('flex-shrink-0 border-r border-border', isMobile ? 'absolute z-20 h-full w-64 bg-background' : 'w-60')}>
          <NotesSidebar
            pages={store.filteredPages}
            folders={store.folders}
            favoritePages={store.favoritePages}
            recentPages={store.recentPages}
            selectedPageId={store.selectedPageId}
            searchQuery={store.searchQuery}
            onSearchChange={store.setSearchQuery}
            onSelectPage={(id) => { store.setSelectedPageId(id); if (isMobile) setSidebarOpen(false); }}
            onCreatePage={store.createPage}
            onDeletePage={store.deletePage}
            onDuplicatePage={store.duplicatePage}
            onArchivePage={store.archivePage}
            onMoveToFolder={store.movePageToFolder}
            onToggleFavorite={store.toggleFavorite}
            onCreateFolder={store.createFolder}
            onDeleteFolder={store.deleteFolder}
            onRenameFolder={store.renameFolder}
            onToggleFolder={store.toggleFolder}
          />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/20">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <div className="flex-1" />
          {store.selectedPage && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCommentsOpen(!commentsOpen)}>
              {commentsOpen ? <PanelRightClose className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Editor or empty state */}
        {store.selectedPage ? (
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 min-w-0">
              <NotesEditor
                page={store.selectedPage}
                folders={store.folders}
                saveStatus={store.saveStatus}
                onUpdateTitle={(t) => store.updatePageTitle(store.selectedPage!.id, t)}
                onUpdateBlocks={(b) => store.updateBlocks(store.selectedPage!.id, b)}
                onUpdateStatus={(s) => store.updatePageStatus(store.selectedPage!.id, s)}
                onUpdateTags={(t) => store.updatePageTags(store.selectedPage!.id, t)}
                onToggleFavorite={() => store.toggleFavorite(store.selectedPage!.id)}
                onSaveVersion={() => store.saveVersion(store.selectedPage!.id)}
                onRestoreVersion={(v) => store.restoreVersion(store.selectedPage!.id, v)}
              />
            </div>
            {/* Comments panel */}
            {commentsOpen && !isMobile && (
              <div className="w-72 border-l border-border flex-shrink-0">
                <CommentsPanel
                  page={store.selectedPage}
                  onAddComment={(c, p) => store.addComment(store.selectedPage!.id, c, p)}
                  onDeleteComment={(c) => store.deleteComment(store.selectedPage!.id, c)}
                  onResolveComment={(c) => store.resolveComment(store.selectedPage!.id, c)}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <FileText className="h-16 w-16 opacity-20" />
            <div className="text-center">
              <p className="text-lg font-medium">Nenhuma pagina selecionada</p>
              <p className="text-sm">Selecione uma pagina na barra lateral ou crie uma nova.</p>
            </div>
            <Button onClick={() => store.createPage()} className="gap-2">
              <FileText className="h-4 w-4" />
              Nova pagina
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
