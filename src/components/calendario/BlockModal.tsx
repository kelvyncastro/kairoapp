 import { useState, useEffect } from "react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { CalendarBlock } from "@/pages/Calendario";
 import { format, parseISO } from "date-fns";
 import { Trash2 } from "lucide-react";
 
 interface BlockModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   block: CalendarBlock | null;
   defaultStart: Date | null;
   defaultEnd: Date | null;
   onSave: (data: Partial<CalendarBlock>) => void;
   onDelete: (id: string) => void;
 }
 
 const COLORS = [
   "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
   "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
 ];
 
 export function BlockModal({ open, onOpenChange, block, defaultStart, defaultEnd, onSave, onDelete }: BlockModalProps) {
   const [title, setTitle] = useState("");
   const [description, setDescription] = useState("");
   const [startTime, setStartTime] = useState("");
   const [endTime, setEndTime] = useState("");
   const [color, setColor] = useState(COLORS[0]);
   const [priority, setPriority] = useState("medium");
 
   useEffect(() => {
     if (block) {
       setTitle(block.title);
       setDescription(block.description || "");
       setStartTime(format(parseISO(block.start_time), "yyyy-MM-dd'T'HH:mm"));
       setEndTime(format(parseISO(block.end_time), "yyyy-MM-dd'T'HH:mm"));
       setColor(block.color || COLORS[0]);
       setPriority(block.priority || "medium");
     } else if (defaultStart && defaultEnd) {
       setTitle("");
       setDescription("");
       setStartTime(format(defaultStart, "yyyy-MM-dd'T'HH:mm"));
       setEndTime(format(defaultEnd, "yyyy-MM-dd'T'HH:mm"));
       setColor(COLORS[0]);
       setPriority("medium");
     }
   }, [block, defaultStart, defaultEnd, open]);
 
   const handleSave = () => {
     onSave({
       title,
       description,
       start_time: new Date(startTime).toISOString(),
       end_time: new Date(endTime).toISOString(),
       color,
       priority,
     });
   };
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === "Enter" && !e.shiftKey && !(e.target instanceof HTMLTextAreaElement)) {
       e.preventDefault();
       handleSave();
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
         <DialogHeader>
           <DialogTitle>{block ? "Editar Bloco" : "Novo Bloco"}</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label>Título</Label>
             <Input
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="O que você vai fazer?"
               autoFocus
             />
           </div>
 
           <div className="space-y-2">
             <Label>Descrição</Label>
             <Textarea
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Detalhes adicionais..."
               rows={2}
             />
           </div>
 
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Início</Label>
               <Input
                 type="datetime-local"
                 value={startTime}
                 onChange={(e) => setStartTime(e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label>Fim</Label>
               <Input
                 type="datetime-local"
                 value={endTime}
                 onChange={(e) => setEndTime(e.target.value)}
               />
             </div>
           </div>
 
           <div className="space-y-2">
             <Label>Prioridade</Label>
             <Select value={priority} onValueChange={setPriority}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="low">Baixa</SelectItem>
                 <SelectItem value="medium">Média</SelectItem>
                 <SelectItem value="high">Alta</SelectItem>
                 <SelectItem value="urgent">Urgente</SelectItem>
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label>Cor</Label>
             <div className="flex gap-2 flex-wrap">
               {COLORS.map((c) => (
                 <button
                   key={c}
                   type="button"
                   className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                   style={{ backgroundColor: c }}
                   onClick={() => setColor(c)}
                 />
               ))}
             </div>
           </div>
         </div>
 
         <DialogFooter className="flex justify-between">
           {block && (
             <Button variant="destructive" size="sm" onClick={() => onDelete(block.id)}>
               <Trash2 className="h-4 w-4 mr-1" />
               Excluir
             </Button>
           )}
           <div className="flex gap-2 ml-auto">
             <Button variant="outline" onClick={() => onOpenChange(false)}>
               Cancelar
             </Button>
             <Button onClick={handleSave}>Salvar</Button>
           </div>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }