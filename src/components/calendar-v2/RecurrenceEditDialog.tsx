import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export type RecurrenceEditScope = 'this' | 'all';

interface RecurrenceEditDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: RecurrenceEditScope) => void;
  title?: string;
}

export function RecurrenceEditDialog({
  open,
  onClose,
  onConfirm,
  title = 'Editar evento recorrente',
}: RecurrenceEditDialogProps) {
  const [scope, setScope] = useState<RecurrenceEditScope>('this');

  const handleConfirm = () => {
    onConfirm(scope);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            Escolha se deseja editar apenas este evento ou todos os eventos da série
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RadioGroup
          value={scope}
          onValueChange={(v) => setScope(v as RecurrenceEditScope)}
          className="space-y-3 py-4"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="this" id="scope-this" />
            <Label htmlFor="scope-this" className="text-base cursor-pointer">
              Este evento
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="all" id="scope-all" />
            <Label htmlFor="scope-all" className="text-base cursor-pointer">
              Todos os eventos
            </Label>
          </div>
        </RadioGroup>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
