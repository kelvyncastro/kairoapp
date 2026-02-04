import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface RichTextDisplayProps {
  content: string;
  className?: string;
  onClick?: () => void;
  placeholder?: string;
}

// Configure DOMPurify to allow only safe HTML tags from TipTap editor
const sanitizeConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'span', 'div'],
  ALLOWED_ATTR: ['class', 'style'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

export function RichTextDisplay({
  content,
  className,
  onClick,
  placeholder = 'Clique para adicionar uma descrição...',
}: RichTextDisplayProps) {
  // Check if content is empty - handles TipTap's empty paragraph with classes
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
  const isEmpty = !content || content.trim() === '' || stripHtml(content) === '';

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = isEmpty ? '' : DOMPurify.sanitize(content, sanitizeConfig);

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
          className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-h1:text-xl prose-h1:font-bold prose-h1:my-2 prose-h2:text-lg prose-h2:font-bold prose-h2:my-1.5 prose-h3:text-base prose-h3:font-bold prose-h3:my-1"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
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
        .prose h1 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0.5rem 0;
        }
        .prose h2 {
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0.375rem 0;
        }
        .prose h3 {
          font-size: 1rem;
          font-weight: 700;
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
}
