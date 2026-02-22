import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useCallback, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, CheckCircle2, Quote, Minus, Code,
  Type, Highlighter, Heading1, Heading2, Heading3, Pilcrow, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotesBlockMenu } from './NotesBlockMenu';
import type { RemoteCursor } from '@/hooks/useNoteCollaboration';

interface NotesRichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  remoteCursors?: RemoteCursor[];
  onCursorChange?: (position: number) => void;
  onInsertPage?: () => void;
  onInsertImage?: () => void;
}

const TEXT_COLORS = [
  { name: 'Padrao', color: 'inherit' },
  { name: 'Cinza', color: '#6b7280' },
  { name: 'Vermelho', color: '#ef4444' },
  { name: 'Laranja', color: '#f97316' },
  { name: 'Amarelo', color: '#eab308' },
  { name: 'Verde', color: '#22c55e' },
  { name: 'Azul', color: '#3b82f6' },
  { name: 'Roxo', color: '#8b5cf6' },
  { name: 'Rosa', color: '#ec4899' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Sem destaque', color: '' },
  { name: 'Amarelo', color: '#fef08a' },
  { name: 'Verde', color: '#bbf7d0' },
  { name: 'Azul', color: '#bfdbfe' },
  { name: 'Roxo', color: '#e9d5ff' },
  { name: 'Rosa', color: '#fbcfe8' },
  { name: 'Laranja', color: '#fed7aa' },
  { name: 'Vermelho', color: '#fecaca' },
  { name: 'Cinza', color: '#e5e7eb' },
];

export function NotesRichEditor({ content, onChange, placeholder = 'Comece a escrever...', className, editable = true, remoteCursors = [], onCursorChange, onInsertPage, onInsertImage }: NotesRichEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isInteractingWithToolbar, setIsInteractingWithToolbar] = useState(false);
  const [hoveredBlockPos, setHoveredBlockPos] = useState<{ top: number; show: boolean }>({ top: 0, show: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const blockMenuTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: 'list-disc pl-5 space-y-1' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-5 space-y-1' } },
        listItem: { HTMLAttributes: { class: 'leading-normal' } },
        paragraph: { HTMLAttributes: { class: 'leading-relaxed' } },
        heading: false,
        codeBlock: { HTMLAttributes: { class: 'bg-muted/50 rounded-lg p-4 font-mono text-sm my-2 overflow-x-auto' } },
        blockquote: { HTMLAttributes: { class: 'border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-2' } },
        horizontalRule: { HTMLAttributes: { class: 'my-4 border-border' } },
      }),
      Heading.configure({ levels: [1, 2, 3], HTMLAttributes: { class: 'font-bold' } }),
      TaskList.configure({ HTMLAttributes: { class: 'not-prose space-y-1 my-2' } }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'flex items-start gap-2' },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true, HTMLAttributes: { class: 'rounded px-0.5' } }),
      Placeholder.configure({ placeholder, emptyEditorClass: 'is-editor-empty' }),
    ],
    content,
    editable,
    autofocus: editable ? 'end' : false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-6 pl-12',
          'prose-p:my-1 prose-ul:my-1 prose-ol:my-1',
          'prose-h1:text-2xl prose-h1:font-bold prose-h1:my-3',
          'prose-h2:text-xl prose-h2:font-bold prose-h2:my-2',
          'prose-h3:text-lg prose-h3:font-bold prose-h3:my-1.5',
        ),
      },
      handleKeyDown: (view, event) => {
        if (event.key === ' ') {
          const { state } = view;
          const { $from } = state.selection;
          const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
          if (textBefore === '-' || textBefore === '*') {
            const tr = state.tr.delete($from.pos - 1, $from.pos);
            view.dispatch(tr);
            editor?.chain().focus().toggleBulletList().run();
            return true;
          }
          if (textBefore === '[]' || textBefore === '[ ]' || textBefore === '()' || textBefore === '( )') {
            const tr = state.tr.delete($from.pos - textBefore.length, $from.pos);
            view.dispatch(tr);
            editor?.chain().focus().toggleTaskList().run();
            return true;
          }
        }
        // Slash command to open block menu
        if (event.key === '/') {
          const { state } = view;
          const { $from } = state.selection;
          const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
          if (textBefore === '') {
            // Show block menu at cursor position - handled by the floating "+"
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onTransaction: ({ editor }) => {
      if (onCursorChange) {
        const pos = editor.state.selection.from;
        onCursorChange(pos);
      }
    },
    onBlur: () => {
      setTimeout(() => {
        if (!isInteractingWithToolbar) setShowToolbar(false);
      }, 300);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            setToolbarPosition({
              top: rect.top - containerRect.top - 50,
              left: rect.left - containerRect.left + (rect.width / 2) - 200,
            });
            setShowToolbar(true);
          }
        }
      } else if (!isInteractingWithToolbar) {
        setShowToolbar(false);
      }
    },
  });

  // Track hovered block for showing "+" and drag handle
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!editor || !containerRef.current) return;
    if (blockMenuTimeoutRef.current) clearTimeout(blockMenuTimeoutRef.current);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const editorEl = containerRef.current.querySelector('.ProseMirror');
    if (!editorEl) return;

    // Find the block element under the mouse
    const y = e.clientY;
    const elements = editorEl.querySelectorAll(':scope > *');
    let found = false;
    
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (y >= rect.top - 4 && y <= rect.bottom + 4) {
        setHoveredBlockPos({
          top: rect.top - containerRect.top,
          show: true,
        });
        found = true;
        break;
      }
    }

    if (!found) {
      blockMenuTimeoutRef.current = setTimeout(() => {
        setHoveredBlockPos(prev => ({ ...prev, show: false }));
      }, 200);
    }
  }, [editor]);

  const handleMouseLeave = useCallback(() => {
    blockMenuTimeoutRef.current = setTimeout(() => {
      setHoveredBlockPos(prev => ({ ...prev, show: false }));
    }, 500);
  }, []);

  // Sync external content
  const isRemoteUpdateRef = useRef(false);
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      isRemoteUpdateRef.current = true;
      const { from } = editor.state.selection;
      editor.commands.setContent(content);
      try {
        const maxPos = editor.state.doc.content.size;
        editor.commands.setTextSelection(Math.min(from, maxPos));
      } catch {}
      isRemoteUpdateRef.current = false;
    }
  }, [content, editor]);

  // Render remote cursors
  useEffect(() => {
    if (!editor || remoteCursors.length === 0) return;
  }, [editor, remoteCursors]);

  const toggle = useCallback((action: string) => {
    if (!editor) return;
    setIsInteractingWithToolbar(false);
    switch (action) {
      case 'bold': editor.chain().focus().toggleBold().run(); break;
      case 'italic': editor.chain().focus().toggleItalic().run(); break;
      case 'underline': editor.chain().focus().toggleUnderline().run(); break;
      case 'strike': editor.chain().focus().toggleStrike().run(); break;
      case 'bulletList': editor.chain().focus().toggleBulletList().run(); break;
      case 'orderedList': editor.chain().focus().toggleOrderedList().run(); break;
      case 'taskList': editor.chain().focus().toggleTaskList().run(); break;
      case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break;
      case 'codeBlock': editor.chain().focus().toggleCodeBlock().run(); break;
      case 'horizontalRule': editor.chain().focus().setHorizontalRule().run(); break;
    }
  }, [editor]);

  const setHeading = useCallback((level: 1 | 2 | 3 | 0) => {
    setIsInteractingWithToolbar(false);
    if (!editor) return;
    if (level === 0) editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level }).run();
  }, [editor]);

  const setTextColor = useCallback((color: string) => {
    setIsInteractingWithToolbar(false);
    if (!editor) return;
    if (color === 'inherit') editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(color).run();
  }, [editor]);

  const setHighlightColor = useCallback((color: string) => {
    setIsInteractingWithToolbar(false);
    if (!editor) return;
    if (!color) editor.chain().focus().unsetHighlight().run();
    else editor.chain().focus().setHighlight({ color }).run();
  }, [editor]);

  if (!editor) return null;

  const getCurrentHeadingLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'T';
  };

  const ToolbarButton = ({ icon: Icon, action, isActiveKey }: { icon: any; action: string; isActiveKey?: string }) => (
    <Button
      type="button" variant="ghost" size="icon"
      className={cn('h-7 w-7', isActiveKey && editor.isActive(isActiveKey) && 'bg-muted')}
      onClick={() => toggle(action)}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating selection toolbar */}
      {showToolbar && (
        <div
          className="absolute z-50 flex items-center gap-0.5 bg-popover border border-border rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
          style={{
            top: Math.max(toolbarPosition.top, -50),
            left: Math.max(Math.min(toolbarPosition.left, 300), 0),
          }}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={() => setIsInteractingWithToolbar(true)}
          onMouseLeave={() => setIsInteractingWithToolbar(false)}
        >
          {/* Heading */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm"
                className={cn('h-7 px-2 text-xs font-semibold', editor.isActive('heading') && 'bg-muted')}
                onMouseDown={(e) => e.preventDefault()}>
                {getCurrentHeadingLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover z-[100]" align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
              <DropdownMenuItem onClick={() => setHeading(0)} className="gap-2"><Pilcrow className="h-4 w-4" />Texto normal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(1)} className="gap-2"><Heading1 className="h-4 w-4" /><span className="text-xl font-bold">Titulo 1</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(2)} className="gap-2"><Heading2 className="h-4 w-4" /><span className="text-lg font-bold">Titulo 2</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHeading(3)} className="gap-2"><Heading3 className="h-4 w-4" /><span className="text-base font-bold">Titulo 3</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border mx-0.5" />
          <ToolbarButton icon={Bold} action="bold" isActiveKey="bold" />
          <ToolbarButton icon={Italic} action="italic" isActiveKey="italic" />
          <ToolbarButton icon={UnderlineIcon} action="underline" isActiveKey="underline" />
          <ToolbarButton icon={Strikethrough} action="strike" isActiveKey="strike" />

          <div className="w-px h-5 bg-border mx-0.5" />
          <ToolbarButton icon={List} action="bulletList" isActiveKey="bulletList" />
          <ToolbarButton icon={ListOrdered} action="orderedList" isActiveKey="orderedList" />
          <ToolbarButton icon={CheckCircle2} action="taskList" isActiveKey="taskList" />

          <div className="w-px h-5 bg-border mx-0.5" />
          <ToolbarButton icon={Quote} action="blockquote" isActiveKey="blockquote" />
          <ToolbarButton icon={Code} action="codeBlock" isActiveKey="codeBlock" />
          <ToolbarButton icon={Minus} action="horizontalRule" />

          <div className="w-px h-5 bg-border mx-0.5" />
          {/* Text Color */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onMouseDown={(e) => e.preventDefault()}>
                <Type className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto p-2 bg-popover z-[100]" align="center" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map((c) => (
                  <button key={c.color} type="button" className="w-6 h-6 rounded border border-border/50 flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ color: c.color === 'inherit' ? undefined : c.color }} onClick={() => setTextColor(c.color)} title={c.name}>
                    <span className="text-xs font-bold">A</span>
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Highlight */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onMouseDown={(e) => e.preventDefault()}>
                <Highlighter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto p-2 bg-popover z-[100]" align="center" onCloseAutoFocus={(e) => e.preventDefault()}>
              <div className="grid grid-cols-5 gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button key={c.color || 'none'} type="button"
                    className={cn("w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform",
                      !c.color && "bg-background relative after:absolute after:inset-0 after:flex after:items-center after:justify-center after:content-['✕'] after:text-[10px] after:text-muted-foreground"
                    )}
                    style={{ backgroundColor: c.color || undefined }} onClick={() => setHighlightColor(c.color)} title={c.name} />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Floating "+" and drag handle */}
      {editable && hoveredBlockPos.show && (
        <div
          className="absolute z-30 flex items-center gap-0.5 transition-all duration-100"
          style={{ top: hoveredBlockPos.top, left: 4 }}
          onMouseEnter={() => {
            if (blockMenuTimeoutRef.current) clearTimeout(blockMenuTimeoutRef.current);
            setHoveredBlockPos(prev => ({ ...prev, show: true }));
          }}
          onMouseLeave={() => {
            blockMenuTimeoutRef.current = setTimeout(() => {
              setHoveredBlockPos(prev => ({ ...prev, show: false }));
            }, 500);
          }}
        >
          <NotesBlockMenu
            editor={editor}
            onInsertPage={onInsertPage}
            onInsertImage={onInsertImage}
          />
          <button
            className="flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-150 cursor-grab active:cursor-grabbing"
            title="Arrastar bloco"
            draggable
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onDragStart={(e) => {
              const editorEl = containerRef.current?.querySelector('.ProseMirror');
              if (!editorEl) return;
              const elements = editorEl.querySelectorAll(':scope > *');
              const containerRect = containerRef.current?.getBoundingClientRect();
              if (!containerRect) return;
              
              for (const el of elements) {
                const rect = el.getBoundingClientRect();
                const relTop = rect.top - containerRect.top;
                if (Math.abs(relTop - hoveredBlockPos.top) < 10) {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setDragImage(el as HTMLElement, 0, 0);
                  e.dataTransfer.setData('text/block-index', String(Array.from(elements).indexOf(el)));
                  (el as HTMLElement).style.opacity = '0.4';
                  break;
                }
              }
            }}
            onDragEnd={() => {
              const editorEl = containerRef.current?.querySelector('.ProseMirror');
              if (!editorEl) return;
              editorEl.querySelectorAll(':scope > *').forEach(el => {
                (el as HTMLElement).style.opacity = '';
              });
            }}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <EditorContent editor={editor} />
        {/* Remote cursor indicators */}
        {remoteCursors.map(cursor => {
          if (!editor) return null;
          try {
            const pos = Math.min(cursor.position, editor.state.doc.content.size);
            const coords = editor.view.coordsAtPos(pos);
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return null;
            return (
              <div
                key={cursor.userId}
                className="absolute pointer-events-none z-40 transition-all duration-150"
                style={{
                  top: coords.top - containerRect.top,
                  left: coords.left - containerRect.left,
                }}
              >
                <div className="w-0.5 h-5 rounded-full animate-pulse" style={{ backgroundColor: cursor.color }} />
                <div
                  className="absolute -top-5 left-0 text-[9px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap text-white shadow-sm"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.userName}
                </div>
              </div>
            );
          } catch {
            return null;
          }
        })}
      </div>

      <style>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-top: 0.25rem;
          user-select: none;
        }
        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid hsl(var(--primary));
          background: transparent;
          cursor: pointer;
          display: block;
          position: relative;
          transition: all 0.2s ease;
        }
        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"]:checked {
          background: hsl(var(--primary));
          border-color: hsl(var(--primary));
        }
        .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: hsl(var(--primary-foreground));
          font-size: 11px;
          font-weight: bold;
        }
        .ProseMirror ul[data-type="taskList"] li > label + div {
          flex: 1 1 auto;
        }
        .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > label + div p {
          text-decoration: line-through;
          opacity: 0.6;
        }
        .ProseMirror ul {
          list-style-type: disc !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
        }
        .ProseMirror u { text-decoration: underline; }
        .ProseMirror s { text-decoration: line-through; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0; }
        .ProseMirror h3 { font-size: 1.125rem; font-weight: 700; margin: 0.375rem 0; }
        .ProseMirror pre { background: hsl(var(--muted) / 0.5); border-radius: 0.5rem; padding: 1rem; font-family: monospace; font-size: 0.875rem; margin: 0.5rem 0; overflow-x: auto; }
        .ProseMirror blockquote { border-left: 4px solid hsl(var(--primary) / 0.4); padding-left: 1rem; font-style: italic; color: hsl(var(--muted-foreground)); margin: 0.5rem 0; }
        .ProseMirror hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1rem 0; }
        .ProseMirror > * {
          transition: background-color 0.15s;
        }
        .ProseMirror > *:hover {
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
