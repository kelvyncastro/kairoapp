import { useState } from 'react';
import { useNotesStore } from '@/hooks/useNotesStore';
import { NotesSidebar } from '@/components/notes/NotesSidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Star, Save, MoreHorizontal, Copy, Trash2, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { NotesRichEditor } from '@/components/notes/NotesRichEditor';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { EMOJI_CATEGORIES, searchEmojis } from '@/lib/emoji-data';
import { Separator } from '@/components/ui/separator';

export default function Notas() {
  const store = useNotesStore();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiCategory, setEmojiCategory] = useState('frequent');

  const favoritePages = store.pages.filter(p => p.isFavorite && !p.isArchived);
  const recentPages = [...store.pages].filter(p => !p.isArchived).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const handleSelectPage = (id: string) => {
    store.setSelectedPageId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const handleMoveToFolder = (pageId: string, folderId: string | null) => {
    store.updatePageFolder(pageId, folderId);
  };

  const searchResults = searchEmojis(emojiSearch);

  return (
    <div className="h-full flex -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        'h-full flex-shrink-0 transition-all duration-200',
        sidebarOpen ? 'w-64' : 'w-0',
        isMobile && sidebarOpen && 'absolute z-30 left-0 top-0 bottom-0 shadow-xl'
      )}>
        {sidebarOpen && (
          <NotesSidebar
            pages={store.filteredPages}
            folders={store.folders}
            favoritePages={favoritePages}
            recentPages={recentPages}
            selectedPageId={store.selectedPageId}
            searchQuery={store.searchQuery}
            onSearchChange={store.setSearchQuery}
            onSelectPage={handleSelectPage}
            onCreatePage={(folderId) => { store.createPage(folderId); if (isMobile) setSidebarOpen(false); }}
            onDeletePage={store.deletePage}
            onDuplicatePage={store.duplicatePage}
            onArchivePage={store.archivePage}
            onMoveToFolder={handleMoveToFolder}
            onToggleFavorite={store.toggleFavorite}
            onCreateFolder={store.createFolder}
            onDeleteFolder={store.deleteFolder}
            onRenameFolder={store.renameFolder}
            onToggleFolder={store.toggleFolder}
          />
        )}
      </div>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        {store.selectedPage ? (
          <>
            {/* Top bar - synced title (read-only display) */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 group" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <div className={cn("transition-transform duration-300", !sidebarOpen && "rotate-180")}>
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4 -scale-x-100" />}
                </div>
              </Button>

              <span className="text-sm">{store.selectedPage.icon}</span>
              <span className="text-sm font-semibold truncate flex-1">{store.selectedPage.title || 'Sem titulo'}</span>

              <div className="flex items-center gap-1">
                {store.saveStatus === 'saving' && (
                  <span className="text-xs text-muted-foreground animate-pulse">Salvando...</span>
                )}
                {store.saveStatus === 'saved' && (
                  <span className="text-xs text-muted-foreground">Salvo</span>
                )}

                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => store.toggleFavorite(store.selectedPage!.id)}>
                  <Star className={cn('h-4 w-4', store.selectedPage.isFavorite && 'fill-yellow-400 text-yellow-400')} />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => store.saveVersion(store.selectedPage!.id)} className="gap-2">
                      <Save className="h-4 w-4" /> Salvar versao
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => store.duplicatePage(store.selectedPage!.id)} className="gap-2">
                      <Copy className="h-4 w-4" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { store.archivePage(store.selectedPage!.id); }} className="gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" /> Arquivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Editor content with inline title */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-6 pt-8">
                {/* Emoji + Title inline in the page */}
                <div className="flex items-start gap-3 mb-4">
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <button className="text-4xl hover:bg-muted/50 rounded-lg p-1 transition-colors flex-shrink-0 mt-0.5">
                        {store.selectedPage.icon}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <div className="p-2 border-b border-border">
                        <Input
                          placeholder="Buscar emoji... (ex: fogo, coracao, estrela)"
                          value={emojiSearch}
                          onChange={(e) => setEmojiSearch(e.target.value)}
                          className="h-8 text-xs"
                          autoFocus
                        />
                      </div>

                      {!emojiSearch && (
                        <div className="flex gap-0.5 px-1 py-1 border-b border-border overflow-x-auto scrollbar-none">
                          {EMOJI_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setEmojiCategory(cat.id)}
                              className={cn(
                                'flex-shrink-0 w-7 h-7 flex items-center justify-center rounded text-sm transition-colors',
                                emojiCategory === cat.id ? 'bg-accent' : 'hover:bg-muted'
                              )}
                              title={cat.label}
                            >
                              {cat.icon}
                            </button>
                          ))}
                        </div>
                      )}

                      <ScrollArea className="h-56">
                        {emojiSearch ? (
                          <div className="p-2">
                            {searchResults.length > 0 ? (
                              <div className="grid grid-cols-8 gap-0.5">
                                {searchResults.map((entry, i) => (
                                  <button
                                    key={`${entry.emoji}-${i}`}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-lg"
                                    onClick={() => {
                                      store.updatePageIcon(store.selectedPage!.id, entry.emoji);
                                      setEmojiOpen(false);
                                      setEmojiSearch('');
                                    }}
                                  >
                                    {entry.emoji}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-4">Nenhum emoji encontrado</p>
                            )}
                          </div>
                        ) : (
                          <div className="p-2">
                            {EMOJI_CATEGORIES
                              .filter(cat => cat.id === emojiCategory)
                              .map(cat => (
                                <div key={cat.id}>
                                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 px-1">{cat.label}</p>
                                  <div className="grid grid-cols-8 gap-0.5">
                                    {cat.emojis.map((entry, i) => (
                                      <button
                                        key={`${entry.emoji}-${i}`}
                                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-lg"
                                        onClick={() => {
                                          store.updatePageIcon(store.selectedPage!.id, entry.emoji);
                                          setEmojiOpen(false);
                                          setEmojiSearch('');
                                        }}
                                      >
                                        {entry.emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>

                  <input
                    className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/40 py-1"
                    value={store.selectedPage.title}
                    onChange={(e) => store.updatePageTitle(store.selectedPage!.id, e.target.value)}
                    placeholder="Sem titulo"
                  />
                </div>

                <NotesRichEditor
                  content={store.selectedPage.content}
                  onChange={(content) => store.updateContent(store.selectedPage!.id, content)}
                />
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground relative">
            <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-4 left-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
            <p className="text-lg font-medium mb-1">Nenhuma nota selecionada</p>
            <p className="text-sm mb-4">Selecione uma nota no menu lateral ou crie uma nova.</p>
            <Button onClick={() => store.createPage()} variant="outline" className="gap-2">
              Criar nova nota
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
