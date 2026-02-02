import { cn } from '@/lib/utils';

interface RichTextDisplayProps {
  content: string;
  className?: string;
  onClick?: () => void;
  placeholder?: string;
}

export function RichTextDisplay({
  content,
  className,
  onClick,
  placeholder = 'Clique para adicionar uma descrição...',
}: RichTextDisplayProps) {
  const isEmpty = !content || content === '<p></p>' || content.trim() === '';

  return (
    <div
      className={cn(
        'min-h-[80px] p-4 rounded-lg cursor-pointer bg-muted/20 border border-border/30 text-sm leading-relaxed transition-colors hover:bg-muted/30',
        isEmpty && 'text-muted-foreground italic',
        className
      )}
      onClick={onClick}
    >
      {isEmpty ? (
        placeholder
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{ pointerEvents: 'none' }}
        />
      )}
      <style>{`
        .prose ul {
          list-style-type: disc !important;
          padding-left: 1rem;
        }
        .prose ol {
          list-style-type: decimal !important;
          padding-left: 1rem;
        }
        .prose li::marker {
          color: currentColor;
        }
        .prose u {
          text-decoration: underline;
        }
        .prose s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
