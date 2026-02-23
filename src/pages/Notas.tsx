import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNotesStore } from '@/hooks/useNotesStore';
import { NotesHome } from '@/components/notes/NotesHome';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Star, Save, MoreHorizontal, Copy, Trash2, ShoppingCart, Loader2, X, ImagePlus, Share2, Users, ArrowLeft } from 'lucide-react';
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
import { detectFoodIngredients } from '@/lib/food-detector';
import { AnimatePresence, motion } from 'framer-motion';

export default function Notas() {
  const store = useNotesStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiCategory, setEmojiCategory] = useState('frequent');
  const [creatingGroceryList, setCreatingGroceryList] = useState(false);
  const [groceryDismissedPages, setGroceryDismissedPages] = useState<Set<string>>(new Set());
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Real-time collaboration for shared notes
  const collaboration = useNoteCollaboration(
    store.selectedPageId,
    store.isSharedPage
  );

  // Listen for remote content updates
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.pageId === store.selectedPageId) {
        store.updateContent(detail.pageId, detail.content);
      }
    };
    window.addEventListener('note-remote-content', handler);
    return () => window.removeEventListener('note-remote-content', handler);
  }, [store.selectedPageId]);

  // Detect food ingredients in the current note
  const showGroceryBanner = useMemo(() => {
    if (!store.selectedPage) return false;
    if (groceryDismissedPages.has(store.selectedPage.id)) return false;
    const div = document.createElement('div');
    div.innerHTML = store.selectedPage.content;
    div.querySelectorAll('p, br, li, h1, h2, h3, h4, h5, h6, div').forEach(el => {
      el.prepend(document.createTextNode('\n'));
    });
    const text = (div.textContent || div.innerText || '').replace(/\n{2,}/g, '\n');
    return detectFoodIngredients(text);
  }, [store.selectedPage?.content, store.selectedPage?.id, groceryDismissedPages]);

  const handleSelectPage = (id: string) => {
    store.setSelectedPageId(id);
  };

  const handleMoveToFolder = (pageId: string, folderId: string | null) => {
    store.updatePageFolder(pageId, folderId);
  };

  const handleGoBack = () => {
    // If viewing a sub-page, go to parent; otherwise go to home
    if (store.selectedPage?.parentId) {
      store.setSelectedPageId(store.selectedPage.parentId);
    } else {
      store.setSelectedPageId(null);
    }
  };

  const handleAddToGroceryList = useCallback(async () => {
    if (!user || !store.selectedPage) return;
    setCreatingGroceryList(true);
    try {
      const div = document.createElement('div');
      div.innerHTML = store.selectedPage.content;
      div.querySelectorAll('p, br, li, h1, h2, h3, h4, h5, h6, div').forEach(el => {
        el.prepend(document.createTextNode('\n'));
      });
      const textContent = (div.textContent || div.innerText || '').replace(/\n{2,}/g, '\n');

      if (!textContent.trim()) {
        toast.error('A nota está vazia.');
        return;
      }

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

      const { data: existingLists } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingLists && existingLists.length > 0) {
        const existing = existingLists[0];
        const existingCategories = (existing.categories as any) || [];
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

      setGroceryDismissedPages(prev => new Set(prev).add(store.selectedPage!.id));
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

  // If no page selected, show the home listing
  if (!store.selectedPage) {
    return (
      <div className="h-full -m-4 md:-m-6 relative">
        <NotesHome
          pages={store.filteredPages}
          folders={store.folders}
          sharedPages={store.sharedPages}
          searchQuery={store.searchQuery}
          onSearchChange={store.setSearchQuery}
          onSelectPage={handleSelectPage}
          onCreatePage={(folderId) => store.createPage(folderId)}
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
      </div>
    );
  }

  // Editor view - full screen
  return (
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4" />
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

          {/* Active collaborators */}
          {collaboration.activeUsers.length > 0 && (
            <div className="flex items-center gap-1">
              {collaboration.activeUsers.map(u => (
                <div
                  key={u.userId}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm border-2 border-background"
                  style={{ backgroundColor: u.color }}
                  title={`${u.userName} está editando`}
                >
                  {u.userName.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => store.saveVersion(store.selectedPage!.id)} className="gap-2">
                <Save className="h-4 w-4" /> Salvar versão
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => store.duplicatePage(store.selectedPage!.id)} className="gap-2">
                <Copy className="h-4 w-4" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { store.archivePage(store.selectedPage!.id); }} className="gap-2">
                <Trash2 className="h-4 w-4" /> Arquivar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { store.deletePage(store.selectedPage!.id); }} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" /> Excluir permanentemente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 pt-8">
          {/* Emoji + Title */}
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

          {/* Sub-pages gallery */}
          {(() => {
            const childPages = store.getChildPages(store.selectedPage!.id);
            if (childPages.length === 0 && !store.isSharedPage) return null;
            return (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Páginas</span>
                  {!store.isSharedPage && (
                    <button
                      onClick={() => store.createPage(store.selectedPage?.folderId, store.selectedPage?.id)}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      + Nova
                    </button>
                  )}
                </div>
                {childPages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {childPages.map(child => (
                      <button
                        key={child.id}
                        onClick={() => store.setSelectedPageId(child.id)}
                        className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors text-left group"
                      >
                        <span className="text-lg flex-shrink-0">
                          {child.icon.startsWith('http') ? (
                            <img src={child.icon} alt="" className="w-5 h-5 rounded object-cover" />
                          ) : child.icon}
                        </span>
                        <span className="text-xs font-medium truncate">{child.title || 'Sem titulo'}</span>
                      </button>
                    ))}
                    {!store.isSharedPage && (
                      <button
                        onClick={() => store.createPage(store.selectedPage?.folderId, store.selectedPage?.id)}
                        className="flex items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed border-border/50 hover:border-primary/40 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <span className="text-xs">+ Nova página</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <NotesRichEditor
            content={store.selectedPage.content}
            onChange={(content) => {
              store.updateContent(store.selectedPage!.id, content);
              collaboration.broadcastContent(content);
            }}
            editable={!store.isSharedPage || store.sharedPagePermission === 'edit'}
            remoteCursors={collaboration.remoteCursors}
            onCursorChange={collaboration.broadcastCursor}
            onInsertPage={() => store.createPage(store.selectedPage?.folderId, store.selectedPage?.id)}
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
            className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <div className="relative bg-card border border-border backdrop-blur-md rounded-xl px-3 py-2.5 shadow-xl">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setGroceryDismissedPages(prev => {
                    const next = new Set(prev);
                    next.add(store.selectedPage!.id);
                    return next;
                  });
                }}
                className="absolute -top-2.5 -right-2.5 p-1 rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10 shadow-sm"
                title="Fechar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg flex-shrink-0">🛒</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-tight">Ingredientes detectados!</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Adicionar à lista de mercado?</p>
                </div>
                <Button
                  size="sm"
                  className="h-7 gap-1 text-[11px] flex-shrink-0 px-2.5"
                  onClick={handleAddToGroceryList}
                  disabled={creatingGroceryList}
                >
                  {creatingGroceryList ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-3 w-3" />
                  )}
                  {creatingGroceryList ? '...' : 'Adicionar'}
                </Button>
              </div>
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
