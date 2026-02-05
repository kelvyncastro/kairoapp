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
 
 export type RecurrenceDeleteScope = 'this' | 'all';
 
 interface RecurrenceDeleteDialogProps {
   open: boolean;
   onClose: () => void;
   onConfirm: (scope: RecurrenceDeleteScope) => void;
 }
 
 export function RecurrenceDeleteDialog({
   open,
   onClose,
   onConfirm,
 }: RecurrenceDeleteDialogProps) {
   const [scope, setScope] = useState<RecurrenceDeleteScope>('this');
 
   const handleConfirm = () => {
     onConfirm(scope);
     onClose();
   };
 
   return (
     <AlertDialog open={open} onOpenChange={onClose}>
       <AlertDialogContent className="max-w-sm">
         <AlertDialogHeader>
           <AlertDialogTitle className="text-xl">Excluir evento recorrente</AlertDialogTitle>
           <AlertDialogDescription className="sr-only">
             Escolha se deseja excluir apenas este evento ou todos os eventos da série
           </AlertDialogDescription>
         </AlertDialogHeader>
 
         <RadioGroup
           value={scope}
           onValueChange={(v) => setScope(v as RecurrenceDeleteScope)}
           className="space-y-3 py-4"
         >
           <div className="flex items-center space-x-3">
             <RadioGroupItem value="this" id="delete-this" />
             <Label htmlFor="delete-this" className="text-base cursor-pointer">
               Este evento
             </Label>
           </div>
           <div className="flex items-center space-x-3">
             <RadioGroupItem value="all" id="delete-all" />
             <Label htmlFor="delete-all" className="text-base cursor-pointer">
               Todos os eventos
             </Label>
           </div>
         </RadioGroup>
 
         <AlertDialogFooter>
           <AlertDialogCancel>Cancelar</AlertDialogCancel>
           <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
             Excluir
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 }