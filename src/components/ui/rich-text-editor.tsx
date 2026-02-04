import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import { useCallback, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  Type,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const TEXT_COLORS = [
  { name: 'Padrão', color: 'inherit' },
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
  { name: 'Amarelo', color: '#fef9c3' },
  { name: 'Verde', color: '#dcfce7' },
  { name: 'Azul', color: '#dbeafe' },
  { name: 'Roxo', color: '#f3e8ff' },
  { name: 'Rosa', color: '#fce7f3' },
  { name: 'Laranja', color: '#ffedd5' },
  { name: 'Vermelho', color: '#fee2e2' },
  { name: 'Cinza', color: '#f3f4f6' },
];

export function RichTextEditor({
  content,
  onChange,
  onBlur,
  placeholder = 'Digite aqui...',
  className,
  autoFocus = false,
}: RichTextEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isInteractingWithToolbar, setIsInteractingWithToolbar] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-4 space-y-1',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-4 space-y-1',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'leading-normal',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'leading-relaxed',
          },
        },
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'font-bold',
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'rounded px-0.5',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[80px] p-4',
          'prose-p:my-1 prose-ul:my-1 prose-ol:my-1',
          'prose-h1:text-xl prose-h1:font-bold prose-h1:my-2',
          'prose-h2:text-lg prose-h2:font-bold prose-h2:my-1.5',
          'prose-h3:text-base prose-h3:font-bold prose-h3:my-1',
        ),
      },
      handleKeyDown: (view, event) => {
        // Convert - or * at start of line to bullet point
        if (event.key === ' ') {
          const { state } = view;
          const { selection } = state;
          const { $from } = selection;
          const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
          
          if (textBefore === '-' || textBefore === '*') {
            // Delete the marker and create bullet list
            const tr = state.tr.delete($from.pos - 1, $from.pos);
            view.dispatch(tr);
            editor?.chain().focus().toggleBulletList().run();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      // Delay to allow clicking on toolbar
      setTimeout(() => {
        if (!isInteractingWithToolbar) {
          setShowToolbar(false);
          onBlur?.();
        }
      }, 300);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        // Text is selected
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          
          if (containerRect) {
            setToolbarPosition({
              top: rect.top - containerRect.top - 50,
              left: rect.left - containerRect.left + (rect.width / 2) - 150,
            });
            setShowToolbar(true);
          }
        }
      } else if (!isInteractingWithToolbar) {
        setShowToolbar(false);
      }
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor?.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleStrike = useCallback(() => {
    editor?.chain().focus().toggleStrike().run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const setTextColor = useCallback((color: string) => {
    setIsInteractingWithToolbar(false);
    if (color === 'inherit') {
      editor?.chain().focus().unsetColor().run();
    } else {
      editor?.chain().focus().setColor(color).run();
    }
  }, [editor]);

  const setHighlight = useCallback((color: string) => {
    setIsInteractingWithToolbar(false);
    if (!color) {
      editor?.chain().focus().unsetHighlight().run();
    } else {
      editor?.chain().focus().setHighlight({ color }).run();
    }
  }, [editor]);

  const setHeading = useCallback((level: 1 | 2 | 3 | 0) => {
    setIsInteractingWithToolbar(false);
    if (level === 0) {
      editor?.chain().focus().setParagraph().run();
    } else {
      editor?.chain().focus().toggleHeading({ level }).run();
    }
  }, [editor]);

  const handleToolbarMouseEnter = () => {
    setIsInteractingWithToolbar(true);
  };

  const handleToolbarMouseLeave = () => {
    setIsInteractingWithToolbar(false);
  };

  if (!editor) {
    return null;
  }

  const getCurrentHeadingLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'T';
  };

  return (
    <div ref={containerRef} className={cn('relative rounded-lg bg-muted/20 border border-border/30', className)}>
      {/* Floating Toolbar */}
      {showToolbar && (
        <div
          ref={toolbarRef}
          className="absolute z-50 flex items-center gap-0.5 bg-popover border border-border rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
          style={{
            top: Math.max(toolbarPosition.top, -50),
            left: Math.max(Math.min(toolbarPosition.left, 180), 0),
          }}
          onMouseDown={(e) => e.preventDefault()}
          onMouseEnter={handleToolbarMouseEnter}
          onMouseLeave={handleToolbarMouseLeave}
        >
          {/* Heading Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-2 text-xs font-semibold',
                  editor.isActive('heading') && 'bg-muted'
                )}
                onMouseDown={(e) => e.preventDefault()}
              >
                {getCurrentHeadingLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="bg-popover z-[100]" 
              align="start"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem 
                onClick={() => setHeading(0)}
                className="flex items-center gap-2"
              >
                <Pilcrow className="h-4 w-4" />
                <span>Texto normal</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setHeading(1)}
                className="flex items-center gap-2"
              >
                <Heading1 className="h-4 w-4" />
                <span className="text-xl font-bold">Título 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setHeading(2)}
                className="flex items-center gap-2"
              >
                <Heading2 className="h-4 w-4" />
                <span className="text-lg font-bold">Título 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setHeading(3)}
                className="flex items-center gap-2"
              >
                <Heading3 className="h-4 w-4" />
                <span className="text-base font-bold">Título 3</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Bold */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', editor.isActive('bold') && 'bg-muted')}
            onClick={toggleBold}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>

          {/* Italic */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', editor.isActive('italic') && 'bg-muted')}
            onClick={toggleItalic}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>

          {/* Underline */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', editor.isActive('underline') && 'bg-muted')}
            onClick={toggleUnderline}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>

          {/* Strikethrough */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', editor.isActive('strike') && 'bg-muted')}
            onClick={toggleStrike}
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Bullet List */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', editor.isActive('bulletList') && 'bg-muted')}
            onClick={toggleBulletList}
          >
            <List className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Text Color */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onMouseDown={(e) => e.preventDefault()}
              >
                <Type className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-auto p-2 bg-popover z-[100]" 
              align="center"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    className="w-6 h-6 rounded border border-border/50 flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ color: c.color === 'inherit' ? undefined : c.color }}
                    onClick={() => setTextColor(c.color)}
                    title={c.name}
                  >
                    <span className="text-xs font-bold">A</span>
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Highlight */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onMouseDown={(e) => e.preventDefault()}
              >
                <Highlighter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-auto p-2 bg-popover z-[100]" 
              align="center"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-5 gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.color || 'none'}
                    type="button"
                    className={cn(
                      "w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform",
                      !c.color && "bg-background relative after:absolute after:inset-0 after:flex after:items-center after:justify-center after:content-['✕'] after:text-[10px] after:text-muted-foreground"
                    )}
                    style={{ backgroundColor: c.color || undefined }}
                    onClick={() => setHighlight(c.color)}
                    title={c.name}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <EditorContent editor={editor} />

      <style>{`
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          opacity: 0.5;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror ul {
          list-style-type: disc !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
        }
        .ProseMirror li::marker {
          color: currentColor;
        }
        .ProseMirror u {
          text-decoration: underline;
        }
        .ProseMirror s {
          text-decoration: line-through;
        }
        .ProseMirror h1 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0.5rem 0;
        }
        .ProseMirror h2 {
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0.375rem 0;
        }
        .ProseMirror h3 {
          font-size: 1rem;
          font-weight: 700;
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
