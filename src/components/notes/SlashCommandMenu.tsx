import { useEffect, useRef, useState } from 'react';
import { BlockType } from '@/types/notes';
import { cn } from '@/lib/utils';
import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Minus, AlertCircle, Code, Image, Table,
} from 'lucide-react';

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const commands: { type: BlockType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'text', label: 'Texto', icon: <Type className="h-4 w-4" />, description: 'Paragrafo de texto simples' },
  { type: 'h1', label: 'Titulo 1', icon: <Heading1 className="h-4 w-4" />, description: 'Titulo grande' },
  { type: 'h2', label: 'Titulo 2', icon: <Heading2 className="h-4 w-4" />, description: 'Titulo medio' },
  { type: 'h3', label: 'Titulo 3', icon: <Heading3 className="h-4 w-4" />, description: 'Titulo pequeno' },
  { type: 'bullet-list', label: 'Lista', icon: <List className="h-4 w-4" />, description: 'Lista com marcadores' },
  { type: 'numbered-list', label: 'Lista numerada', icon: <ListOrdered className="h-4 w-4" />, description: 'Lista numerada' },
  { type: 'checklist', label: 'Checklist', icon: <CheckSquare className="h-4 w-4" />, description: 'Lista com checkbox' },
  { type: 'quote', label: 'Citacao', icon: <Quote className="h-4 w-4" />, description: 'Bloco de citacao' },
  { type: 'divider', label: 'Divisor', icon: <Minus className="h-4 w-4" />, description: 'Linha divisoria' },
  { type: 'callout', label: 'Callout', icon: <AlertCircle className="h-4 w-4" />, description: 'Destaque especial' },
  { type: 'code', label: 'Codigo', icon: <Code className="h-4 w-4" />, description: 'Bloco de codigo' },
  { type: 'image', label: 'Imagem', icon: <Image className="h-4 w-4" />, description: 'Upload de imagem' },
  { type: 'table', label: 'Tabela', icon: <Table className="h-4 w-4" />, description: 'Tabela simples' },
];

export function SlashCommandMenu({ position, onSelect, onClose }: SlashCommandMenuProps) {
  const [filter, setFilter] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => { setSelectedIdx(0); }, [filter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); if (filtered[selectedIdx]) onSelect(filtered[selectedIdx].type); }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      ref={ref}
      className="fixed z-50 w-64 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2 border-b border-border">
        <input
          ref={inputRef}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Filtrar blocos..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground px-3 py-4 text-center">Nenhum bloco encontrado</p>
        )}
        {filtered.map((cmd, idx) => (
          <button
            key={cmd.type}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors',
              idx === selectedIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
            )}
            onClick={() => onSelect(cmd.type)}
            onMouseEnter={() => setSelectedIdx(idx)}
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 text-muted-foreground">
              {cmd.icon}
            </div>
            <div>
              <p className="font-medium text-sm">{cmd.label}</p>
              <p className="text-xs text-muted-foreground">{cmd.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
