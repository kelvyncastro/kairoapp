import { useState, useCallback } from 'react';
import { NotesPage, NotesFolder } from '@/types/notes';
// exportPageToMarkdown removed - this component is legacy
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Star, Share2, Download, Clock, FileText, ChevronRight, X, Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { BlockEditor } from './BlockEditor';
import { VersionHistoryModal } from './VersionHistoryModal';

interface NotesEditorProps {
  page: NotesPage;
  folders: NotesFolder[];
  saveStatus: 'saved' | 'saving' | 'idle';
  onUpdateTitle: (title: string) => void;
  onUpdateBlocks: (blocks: any[]) => void;
  onUpdateStatus: (status: 'draft' | 'published') => void;
  onUpdateTags: (tags: string[]) => void;
  onToggleFavorite: () => void;
  onSaveVersion: () => void;
  onRestoreVersion: (versionId: string) => void;
}

export function NotesEditor({
  page, folders, saveStatus,
  onUpdateTitle, onUpdateBlocks, onUpdateStatus, onUpdateTags,
  onToggleFavorite, onSaveVersion, onRestoreVersion,
}: NotesEditorProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [newTag, setNewTag] = useState('');
  const folder = folders.find(f => f.id === page.folderId);

  const handleExportMarkdown = useCallback(() => {
    const md = exportPageToMarkdown(page);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exportado em Markdown!');
  }, [page]);

  const handleExportPdf = useCallback(() => {
    window.print();
    toast.success('Preparando PDF...');
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado!');
  }, []);

  const handleAddTag = () => {
    if (!newTag.trim() || page.tags.includes(newTag.trim())) return;
    onUpdateTags([...page.tags, newTag.trim()]);
    setNewTag('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-4 py-2 space-y-2">
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>Notas</span>
            {folder && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{folder.name}</span>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{page.title}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground mr-2">
              {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo' : ''}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleFavorite}>
              <Star className={`h-3.5 w-3.5 ${page.isFavorite ? 'text-yellow-500 fill-yellow-500' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExportMarkdown} title="Exportar Markdown">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowHistory(true)} title="Historico">
              <Clock className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Title */}
        <input
          className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/40"
          value={page.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Sem titulo"
        />

        {/* Properties */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Status:</span>
            <Select value={page.status} onValueChange={(v) => onUpdateStatus(v as any)}>
              <SelectTrigger className="h-6 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Tags:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {page.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] h-5 gap-1 px-1.5">
                  {tag}
                  <button onClick={() => onUpdateTags(page.tags.filter(t => t !== tag))}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-0.5">
                <Input
                  className="h-5 w-16 text-[10px] px-1"
                  placeholder="+ tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                />
              </div>
            </div>
          </div>
          <span className="text-muted-foreground">
            Criado: {format(new Date(page.createdAt), "dd MMM yyyy", { locale: ptBR })}
          </span>
          <span className="text-muted-foreground">
            Editado: {format(new Date(page.updatedAt), "dd MMM, HH:mm", { locale: ptBR })}
          </span>
          <span className="text-muted-foreground">Autor: Voce</span>
        </div>
      </div>

      {/* Block Editor */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <BlockEditor blocks={page.blocks} onChange={onUpdateBlocks} />
      </div>

      {/* Version History */}
      <VersionHistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        page={page}
        onRestore={onRestoreVersion}
        onSaveVersion={onSaveVersion}
      />
    </div>
  );
}
