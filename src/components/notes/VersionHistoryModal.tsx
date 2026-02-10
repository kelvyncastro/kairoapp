import { NotesPage } from '@/types/notes';
import { PageVersion } from '@/types/notes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { RotateCcw, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  page: NotesPage;
  onRestore: (versionId: string) => void;
  onSaveVersion: () => void;
}

export function VersionHistoryModal({ open, onClose, page, onRestore, onSaveVersion }: VersionHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historico de versoes
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end">
          <Button size="sm" onClick={onSaveVersion} className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Salvar versao atual
          </Button>
        </div>

        <ScrollArea className="max-h-96">
          <div className="space-y-2">
            {page.versions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma versao salva. Clique em "Salvar versao atual" para criar um snapshot.
              </p>
            )}
            {[...page.versions].reverse().map((version) => (
              <div key={version.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{version.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(version.createdAt), "dd MMM yyyy 'as' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">Versao salva</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onRestore(version.id)}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
