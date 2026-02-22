import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNotesStore } from '@/hooks/useNotesStore';
import { NotesSidebar } from '@/components/notes/NotesSidebar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Star, Save, MoreHorizontal, Copy, Trash2, PanelLeftOpen, PanelLeftClose, ShoppingCart, Loader2, X, ImagePlus, Share2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NotesRichEditor } from '@/components/notes/NotesRichEditor';
import { useNoteCollaboration } from '@/hooks/useNoteCollaboration';
import { ShareNoteDialog } from '@/components/notes/ShareNoteDialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { EMOJI_CATEGORIES, searchEmojis } from '@/lib/emoji-data';
import { Separator } from '@/components/ui/separator';
import { detectFoodIngredients } from '@/lib/food-detector';
import { AnimatePresence, motion } from 'framer-motion';

export default function Notas() {
  const store = useNotesStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiCategory, setEmojiCategory] = useState('frequent');
  const [creatingGroceryList, setCreatingGroceryList] = useState(false);
  const [groceryDismissedContent, setGroceryDismissedContent] = useState<{ pageId: string; content: string } | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Detect food ingredients in the current note
  const showGroceryBanner = useMemo(() => {
    if (!store.selectedPage) return false;
    // If dismissed for this page and content hasn't changed, don't show
    if (groceryDismissedContent?.pageId === store.selectedPage.id && groceryDismissedContent.content === store.selectedPage.content) return false;
    // Extract plain text from HTML
    const div = document.createElement('div');
    div.innerHTML = store.selectedPage.content;
    div.querySelectorAll('p, br, li, h1, h2, h3, h4, h5, h6, div').forEach(el => {
      el.prepend(document.createTextNode('\n'));
    });
    const text = (div.textContent || div.innerText || '').replace(/\n{2,}/g, '\n');
    return detectFoodIngredients(text);
  }, [store.selectedPage?.content, store.selectedPage?.id, groceryDismissedContent]);

  const favoritePages = store.pages.filter(p => p.isFavorite && !p.isArchived);
  const recentPages = [...store.pages].filter(p => !p.isArchived).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const handleSelectPage = (id: string) => {
    store.setSelectedPageId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const handleMoveToFolder = (pageId: string, folderId: string | null) => {
    store.updatePageFolder(pageId, folderId);
  };

  const handleAddToGroceryList = useCallback(async () => {
    if (!user || !store.selectedPage) return;
    setCreatingGroceryList(true);
    try {
      const div = document.createElement('div');
      div.innerHTML = store.selectedPage.content;
      // Preserve line breaks: replace block elements with newlines before extracting text
      div.querySelectorAll('p, br, li, h1, h2, h3, h4, h5, h6, div').forEach(el => {
        el.prepend(document.createTextNode('\n'));
      });
      const textContent = (div.textContent || div.innerText || '').replace(/\n{2,}/g, '\n');

      if (!textContent.trim()) {
        toast.error('A nota está vazia.');
        return;
      }

      // Categorize ingredients
      const { data, error } = await supabase.functions.invoke('categorize-grocery', {
        body: { items: textContent.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const incoming = (data.categories || []).map((c: any) => ({
        ...c,
        items: c.items.map((item: any) =>
          typeof item === 'string' ? item : item.name || item.item || String(item)
        ),
      }));

      if (incoming.length === 0) {
        toast.error('Nenhum ingrediente encontrado na nota.');
        return;
      }

      // Check for existing active list
      const { data: existingLists } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingLists && existingLists.length > 0) {
        // Merge with existing list
        const existing = existingLists[0];
        const existingCategories = (existing.categories as any) || [];

        // Merge categories
        const merged = mergeCategories(existingCategories, incoming);

        await supabase
          .from('grocery_lists')
          .update({ categories: merged as any })
          .eq('id', existing.id);

        const newItemCount = incoming.reduce((acc: number, c: any) => acc + c.items.length, 0);
        toast.success(`${newItemCount} ingredientes adicionados à lista existente!`, {
          action: { label: 'Ver lista', onClick: () => navigate('/lista-mercado') },
          duration: 5000,
        });
      } else {
        // Create new list
        await supabase.from('grocery_lists').insert({
          user_id: user.id,
          categories: incoming as any,
          checked_items: {} as any,
          status: 'active',
        });

        toast.success(`Lista de mercado criada com ${incoming.length} categorias!`, {
          action: { label: 'Ver lista', onClick: () => navigate('/lista-mercado') },
          duration: 5000,
        });
      }

      setGroceryDismissedContent({ pageId: store.selectedPage.id, content: store.selectedPage.content });
    } catch (e: any) {
      console.error('Error creating grocery list from note:', e);
      toast.error(e.message || 'Erro ao criar lista de mercado.');
    } finally {
      setCreatingGroceryList(false);
    }
  }, [user, store.selectedPage, navigate]);

  const handleIconImageUpload = useCallback(async (file: File) => {
    if (!user || !store.selectedPage) return;
    setUploadingIcon(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/${store.selectedPage.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('note-icons')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('note-icons')
        .getPublicUrl(path);
      store.updatePageIcon(store.selectedPage.id, publicUrl);
      setEmojiOpen(false);
      toast.success('Ícone atualizado!');
    } catch (e: any) {
      console.error('Error uploading icon:', e);
      toast.error('Erro ao enviar imagem.');
    } finally {
      setUploadingIcon(false);
    }
  }, [user, store.selectedPage, store]);

  const searchResults = searchEmojis(emojiSearch);

  if (store.loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            sharedPages={store.sharedPages}
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
      <div className="flex-1 h-full flex flex-col min-w-0 relative">
        {store.selectedPage ? (
          <>
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 group" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <div className={cn("transition-transform duration-300", !sidebarOpen && "rotate-180")}>
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4 -scale-x-100" />}
                </div>
              </Button>

              <span className="text-sm flex-shrink-0">
                {store.selectedPage.icon.startsWith('http') ? (
                  <img src={store.selectedPage.icon} alt="" className="w-5 h-5 rounded object-cover" />
                ) : store.selectedPage.icon}
              </span>
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

                {!store.isSharedPage && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShareDialogOpen(true)} title="Compartilhar">
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}

                {store.isSharedPage && (
                  <Badge variant="secondary" className="text-[10px] h-6 gap-1">
                    <Users className="h-3 w-3" />
                    {store.sharedPagePermission === 'edit' ? 'Editar' : 'Visualizar'}
                  </Badge>
                )}

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
                        {store.selectedPage.icon.startsWith('http') ? (
                          <img src={store.selectedPage.icon} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : store.selectedPage.icon}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      {/* Upload image option */}
                      <div className="p-2 border-b border-border">
                        <button
                          onClick={() => iconFileRef.current?.click()}
                          disabled={uploadingIcon}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <ImagePlus className="h-4 w-4" />
                          {uploadingIcon ? 'Enviando...' : 'Importar imagem'}
                        </button>
                        <input
                          ref={iconFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleIconImageUpload(file);
                            e.target.value = '';
                          }}
                        />
                      </div>

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
                    readOnly={store.isSharedPage && store.sharedPagePermission !== 'edit'}
                  />
                </div>

                <NotesRichEditor
                  content={store.selectedPage.content}
                  onChange={(content) => store.updateContent(store.selectedPage!.id, content)}
                  editable={!store.isSharedPage || store.sharedPagePermission === 'edit'}
                />
              </div>
            </div>

            {/* Floating grocery list banner */}
            <AnimatePresence>
              {showGroceryBanner && (
                <motion.div
                  initial={{ y: 80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 80, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-md"
                >
                  <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg">
                    <span className="text-xl">🛒</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">Ingredientes detectados!</p>
                      <p className="text-[11px] text-muted-foreground">Adicionar à lista de mercado?</p>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs flex-shrink-0"
                      onClick={handleAddToGroceryList}
                      disabled={creatingGroceryList}
                    >
                      {creatingGroceryList ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShoppingCart className="h-3.5 w-3.5" />
                      )}
                      {creatingGroceryList ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                    <button
                      onClick={() => setGroceryDismissedContent({ pageId: store.selectedPage!.id, content: store.selectedPage!.content })}
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {store.selectedPage && (
              <ShareNoteDialog
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                pageId={store.selectedPage.id}
                pageTitle={store.selectedPage.title}
              />
            )}
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

// Merge incoming categories into existing ones without duplicating items
function mergeCategories(existing: any[], incoming: any[]): any[] {
  const map = new Map<string, any>();
  for (const cat of existing) {
    map.set(cat.name, { ...cat, items: [...(cat.items || [])] });
  }
  for (const cat of incoming) {
    if (map.has(cat.name)) {
      const ex = map.get(cat.name)!;
      const existingSet = new Set(ex.items.map((i: string) => i.toLowerCase()));
      for (const item of cat.items) {
        if (!existingSet.has(item.toLowerCase())) {
          ex.items.push(item);
        }
      }
    } else {
      map.set(cat.name, { ...cat, items: [...(cat.items || [])] });
    }
  }
  return Array.from(map.values());
}
