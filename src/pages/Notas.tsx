import { useState } from 'react';
import { useNotesStore } from '@/hooks/useNotesStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ArrowLeft, Trash2, Copy, Star, MoreHorizontal, Save, Search } from 'lucide-react';
import { NotesRichEditor } from '@/components/notes/NotesRichEditor';
import { stripHtml } from '@/lib/notes-storage';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notas() {
  const store = useNotesStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // If a page is selected, show editor
  if (store.selectedPage) {
    return (
      <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
        {/* Editor header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => store.setSelectedPageId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <input
              className="w-full bg-transparent text-lg font-bold outline-none placeholder:text-muted-foreground/50"
              value={store.selectedPage.title}
              onChange={(e) => store.updatePageTitle(store.selectedPage!.id, e.target.value)}
              placeholder="Titulo da pagina"
            />
          </div>

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

            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => store.saveVersion(store.selectedPage!.id)}>
              <Save className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => store.duplicatePage(store.selectedPage!.id)} className="gap-2">
                  <Copy className="h-4 w-4" /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => store.archivePage(store.selectedPage!.id)} className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" /> Arquivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <NotesRichEditor
              content={store.selectedPage.content}
              onChange={(content) => store.updateContent(store.selectedPage!.id, content)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
        <h1 className="text-2xl font-bold">Notas</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(!searchOpen)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30"
          >
            <div className="px-6 py-2">
              <Input
                placeholder="Buscar notas..."
                value={store.searchQuery}
                onChange={(e) => store.setSearchQuery(e.target.value)}
                className="h-9"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {store.filteredPages.map((page) => {
            const preview = stripHtml(page.content).slice(0, 120);
            return (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative"
              >
                <button
                  onClick={() => store.setSelectedPageId(page.id)}
                  className="w-full text-left cave-card p-4 h-[160px] flex flex-col justify-between hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer"
                >
                  {/* Content preview */}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5">
                      {preview || 'Pagina vazia'}
                    </p>
                  </div>

                  {/* Bottom: icon + title */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/20">
                    <span className="text-sm">{page.icon}</span>
                    <span className="text-xs font-semibold truncate">{page.title}</span>
                  </div>
                </button>

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 backdrop-blur-sm">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => store.toggleFavorite(page.id)} className="gap-2">
                        <Star className={cn('h-3.5 w-3.5', page.isFavorite && 'fill-yellow-400 text-yellow-400')} />
                        {page.isFavorite ? 'Desfavoritar' : 'Favoritar'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => store.duplicatePage(page.id)} className="gap-2">
                        <Copy className="h-3.5 w-3.5" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteId(page.id)} className="gap-2 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}

          {/* New page button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => store.createPage()}
            className="cave-card p-4 h-[160px] flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:ring-1 hover:ring-primary/30 transition-all cursor-pointer border-dashed"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">New page</span>
          </motion.button>
        </div>

        {/* Empty state */}
        {store.filteredPages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg font-medium mb-2">Nenhuma nota encontrada</p>
            <p className="text-sm mb-4">Crie sua primeira nota clicando no botao acima.</p>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
            <AlertDialogDescription>Essa acao nao pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) store.deletePage(deleteId); setDeleteId(null); }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
