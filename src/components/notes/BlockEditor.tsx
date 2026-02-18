import { useState, useRef, useEffect, KeyboardEvent, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Block, BlockType } from '@/types/notes';
import { cn } from '@/lib/utils';
import {
  GripVertical, Check, Type, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Quote, Minus, AlertCircle,
  Code, Image, Table,
} from 'lucide-react';
import { SlashCommandMenu } from './SlashCommandMenu';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

function uid(): string { return crypto.randomUUID(); }

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [slashMenu, setSlashMenu] = useState<{ blockId: string; position: { top: number; left: number } } | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (focusId) {
      const el = blockRefs.current.get(focusId);
      if (el) {
        el.focus();
        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setFocusId(null);
    }
  }, [focusId, blocks]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [blocks, onChange]);

  const addBlockAfter = useCallback((afterId: string, type: BlockType = 'text') => {
    const newBlock: Block = { id: uid(), type, content: '' };
    const idx = blocks.findIndex(b => b.id === afterId);
    const next = [...blocks];
    next.splice(idx + 1, 0, newBlock);
    onChange(next);
    setFocusId(newBlock.id);
  }, [blocks, onChange]);

  const removeBlock = useCallback((id: string) => {
    if (blocks.length <= 1) return;
    const idx = blocks.findIndex(b => b.id === id);
    const prev = blocks[idx - 1];
    onChange(blocks.filter(b => b.id !== id));
    if (prev) setFocusId(prev.id);
  }, [blocks, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, block: Block) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlockAfter(block.id);
    }
    if (e.key === 'Backspace' && !block.content.trim() && block.type === 'text') {
      e.preventDefault();
      removeBlock(block.id);
    }
    if (e.key === '/' && !block.content.trim()) {
      const el = blockRefs.current.get(block.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        setSlashMenu({ blockId: block.id, position: { top: rect.bottom + 4, left: rect.left } });
      }
    }
    // Tab indent for lists
    if (e.key === 'Tab') {
      if (['bullet-list', 'numbered-list', 'checklist'].includes(block.type)) {
        e.preventDefault();
        const indent = (block.meta?.indent || 0) + (e.shiftKey ? -1 : 1);
        updateBlock(block.id, { meta: { ...block.meta, indent: Math.max(0, Math.min(3, indent)) } });
      }
    }
  }, [addBlockAfter, removeBlock, updateBlock]);

  const handleSlashSelect = useCallback((blockId: string, type: BlockType) => {
    updateBlock(blockId, { type, content: '' });
    setSlashMenu(null);
    setFocusId(blockId);
  }, [updateBlock]);

  const moveBlock = useCallback((fromIdx: number, toIdx: number) => {
    const next = [...blocks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
  }, [blocks, onChange]);

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  return (
    <div className="space-y-0.5 py-2">
      {blocks.map((block, idx) => (
        <div
          key={block.id}
          className="group flex items-start gap-1 relative"
          draggable
          onDragStart={() => setDragIdx(idx)}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={() => { if (dragIdx !== null && dragIdx !== idx) moveBlock(dragIdx, idx); setDragIdx(null); }}
          onDragEnd={() => setDragIdx(null)}
        >
          <div className="pt-1.5 opacity-0 group-hover:opacity-50 cursor-grab transition-opacity flex-shrink-0">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <BlockContent
              block={block}
              ref={(el) => { if (el) blockRefs.current.set(block.id, el); else blockRefs.current.delete(block.id); }}
              onInput={(content) => updateBlock(block.id, { content })}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onCheckToggle={() => updateBlock(block.id, { meta: { ...block.meta, checked: !block.meta?.checked } })}
            />
          </div>
        </div>
      ))}

      {slashMenu && (
        <SlashCommandMenu
          position={slashMenu.position}
          onSelect={(type) => handleSlashSelect(slashMenu.blockId, type)}
          onClose={() => setSlashMenu(null)}
        />
      )}
    </div>
  );
}

interface BlockContentProps {
  block: Block;
  onInput: (content: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onCheckToggle?: () => void;
}

import { forwardRef } from 'react';

const BlockContent = forwardRef<HTMLDivElement, BlockContentProps>(
  ({ block, onInput, onKeyDown, onCheckToggle }, ref) => {
    const indent = block.meta?.indent || 0;
    const paddingLeft = indent * 24;

    if (block.type === 'divider') {
      return <hr className="my-3 border-border" />;
    }

    if (block.type === 'image') {
      return (
        <div className="my-2">
          {block.meta?.url ? (
            <img src={block.meta.url} alt="" className="max-w-full rounded-lg max-h-96 object-contain" />
          ) : (
            <label className="flex items-center gap-2 px-4 py-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <Image className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para adicionar imagem</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => onInput(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          )}
        </div>
      );
    }

    if (block.type === 'table') {
      const data = block.meta?.tableData || [['', '', ''], ['', '', '']];
      return (
        <div className="my-2 overflow-x-auto">
          <table className="w-full border-collapse border border-border text-sm">
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-border px-2 py-1">
                      <input
                        className="w-full bg-transparent outline-none text-sm"
                        value={cell}
                        onChange={(e) => {
                          const newData = data.map(r => [...r]);
                          newData[ri][ci] = e.target.value;
                          onInput(JSON.stringify(newData));
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const baseClasses = 'outline-none w-full min-h-[1.5em] py-1 px-1 rounded transition-colors focus:bg-muted/30';

    const style: React.CSSProperties = { paddingLeft };

    const typeClasses: Record<string, string> = {
      'h1': 'text-2xl font-bold',
      'h2': 'text-xl font-semibold',
      'h3': 'text-lg font-medium',
      'text': 'text-sm',
      'bullet-list': 'text-sm',
      'numbered-list': 'text-sm',
      'checklist': 'text-sm',
      'quote': 'text-sm italic border-l-2 border-primary/50 pl-3 text-muted-foreground',
      'callout': 'text-sm bg-primary/5 border border-primary/20 rounded-lg px-3 py-2',
      'code': 'text-sm font-mono bg-muted/50 rounded-lg px-3 py-2 whitespace-pre-wrap',
    };

    return (
      <div className="flex items-start gap-2" style={style}>
        {block.type === 'checklist' && (
          <button
            onClick={onCheckToggle}
            className={cn(
              'mt-1.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
              block.meta?.checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
            )}
          >
            {block.meta?.checked && <Check className="h-3 w-3" />}
          </button>
        )}
        {block.type === 'bullet-list' && (
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
        )}
        {block.type === 'numbered-list' && (
          <span className="mt-1 text-sm text-muted-foreground flex-shrink-0 font-mono min-w-[1.5em] text-right">1.</span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className={cn(baseClasses, typeClasses[block.type] || 'text-sm', block.meta?.checked && 'line-through text-muted-foreground')}
          onInput={(e) => onInput(e.currentTarget.textContent || '')}
          onKeyDown={onKeyDown}
          dangerouslySetInnerHTML={{ __html: block.content }}
          data-placeholder={block.type === 'text' ? 'Digite "/" para comandos...' : ''}
        />
      </div>
    );
  }
);
BlockContent.displayName = 'BlockContent';
