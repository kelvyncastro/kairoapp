import { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Plus, Minus, FileText, CheckSquare, Image, Type,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code,
} from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NotesBlockMenuProps {
  editor: Editor;
  onInsertPage?: () => void;
  onInsertImage?: () => void;
}

interface BlockOption {
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  section: 'suggested' | 'basic';
}

export function NotesBlockMenu({ editor, onInsertPage, onInsertImage }: NotesBlockMenuProps) {
  const [open, setOpen] = useState(false);

  const insertBlock = (action: () => void) => {
    action();
    setOpen(false);
  };

  const options: BlockOption[] = [
    // Suggested
    {
      label: 'Divisor',
      icon: <Minus className="h-4 w-4" />,
      shortcut: '---',
      section: 'suggested',
      action: () => insertBlock(() => editor.chain().focus().setHorizontalRule().run()),
    },
    {
      label: 'Página',
      icon: <FileText className="h-4 w-4" />,
      section: 'suggested',
      action: () => { setOpen(false); onInsertPage?.(); },
    },
    {
      label: 'To-do list',
      icon: <CheckSquare className="h-4 w-4" />,
      shortcut: '[]',
      section: 'suggested',
      action: () => insertBlock(() => editor.chain().focus().toggleTaskList().run()),
    },
    {
      label: 'Imagem',
      icon: <Image className="h-4 w-4" />,
      section: 'suggested',
      action: () => { setOpen(false); onInsertImage?.(); },
    },
    // Basic blocks
    {
      label: 'Texto',
      icon: <Type className="h-4 w-4" />,
      section: 'basic',
      action: () => insertBlock(() => editor.chain().focus().setParagraph().run()),
    },
    {
      label: 'Titulo 1',
      icon: <Heading1 className="h-4 w-4" />,
      shortcut: '#',
      section: 'basic',
      action: () => insertBlock(() => editor.chain().focus().toggleHeading({ level: 1 }).run()),
    },
    {
      label: 'Titulo 2',
      icon: <Heading2 className="h-4 w-4" />,
      shortcut: '##',
      section: 'basic',
      action: () => insertBlock(() => editor.chain().focus().toggleHeading({ level: 2 }).run()),
    },
    {
      label: 'Titulo 3',
      icon: <Heading3 className="h-4 w-4" />,
      shortcut: '###',
      section: 'basic',
      action: () => insertBlock(() => editor.chain().focus().toggleHeading({ level: 3 }).run()),
    },
    {
      label: 'Lista com marcadores',
      icon: <List className="h-4 w-4" />,
      shortcut: '-',
      section: 'basic',
      action: () => insertBlock(() => editor.chain().focus().toggleBulletList().run()),
    },
    {
      label: 'Lista numerada',
      icon: <ListOrdered className="h-4 w-4" />,
      shortcut: '1.',
      section: 'basic',
      action: () => insertBlock(() => editor.chain().focus().toggleOrderedList().run()),
    },
    {
      label: 'Citação',
      icon: <Quote className="h-4 w-4" />,
      shortcut: '>',
      section: 'basic',
      action: () => insertBlock(() => editor.chain().focus().toggleBlockquote().run()),
    },
    {
      label: 'Código',
      icon: <Code className="h-4 w-4" />,
      shortcut: '```',
      section: 'basic',
      action: () => insertBlock(() => editor.chain().focus().toggleCodeBlock().run()),
    },
  ];

  const suggested = options.filter(o => o.section === 'suggested');
  const basic = options.filter(o => o.section === 'basic');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-md',
            'text-muted-foreground hover:text-foreground hover:bg-muted/80',
            'transition-all duration-150',
            open && 'bg-muted text-foreground'
          )}
          onMouseDown={(e) => e.preventDefault()}
          title="Adicionar bloco"
        >
          <Plus className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 bg-popover z-[100]"
        side="bottom"
        align="start"
        sideOffset={4}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-y-auto">
          {/* Suggested */}
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sugeridos</p>
          </div>
          {suggested.map((opt) => (
            <button
              key={opt.label}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
              onClick={opt.action}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-md border border-border/50 bg-background">
                {opt.icon}
              </div>
              <span className="flex-1 font-medium">{opt.label}</span>
              {opt.shortcut && (
                <span className="text-xs text-muted-foreground font-mono">{opt.shortcut}</span>
              )}
            </button>
          ))}

          {/* Basic blocks */}
          <div className="px-3 pt-3 pb-1 border-t border-border/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Blocos básicos</p>
          </div>
          {basic.map((opt) => (
            <button
              key={opt.label}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
              onClick={opt.action}
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-md border border-border/50 bg-background">
                {opt.icon}
              </div>
              <span className="flex-1 font-medium">{opt.label}</span>
              {opt.shortcut && (
                <span className="text-xs text-muted-foreground font-mono">{opt.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
