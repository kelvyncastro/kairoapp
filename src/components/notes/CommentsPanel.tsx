import { useState } from 'react';
import { NotesPage, Comment as NComment } from '@/types/notes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare, Activity, Send, Trash2, CheckCircle2, Reply,
  FileText, Tag, Edit3, RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentsPanelProps {
  page: NotesPage;
  onAddComment: (content: string, parentId?: string | null) => void;
  onDeleteComment: (commentId: string) => void;
  onResolveComment: (commentId: string) => void;
}

export function CommentsPanel({ page, onAddComment, onDeleteComment, onResolveComment }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const rootComments = page.comments.filter(c => !c.parentId);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    onAddComment(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyTo(null);
  };

  const actionIcons: Record<string, React.ReactNode> = {
    'criou': <FileText className="h-3.5 w-3.5" />,
    'alterou status': <Edit3 className="h-3.5 w-3.5" />,
    'comentou': <MessageSquare className="h-3.5 w-3.5" />,
    'salvou versao': <RotateCcw className="h-3.5 w-3.5" />,
    'restaurou versao': <RotateCcw className="h-3.5 w-3.5" />,
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs defaultValue="comments" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-3 bg-muted/50">
          <TabsTrigger value="comments" className="gap-1.5 text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            Comentarios ({page.comments.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            Atividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="flex-1 flex flex-col mt-0 p-3 gap-3">
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {rootComments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhum comentario ainda</p>
              )}
              {rootComments.map(comment => {
                const replies = page.comments.filter(c => c.parentId === comment.id);
                return (
                  <div key={comment.id} className={cn('rounded-lg border border-border p-3 space-y-2', comment.isResolved && 'opacity-50')}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{comment.author}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(comment.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                        <Reply className="h-3 w-3" /> Responder
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => onResolveComment(comment.id)}>
                        <CheckCircle2 className="h-3 w-3" /> {comment.isResolved ? 'Reabrir' : 'Resolver'}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive gap-1" onClick={() => onDeleteComment(comment.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* Replies */}
                    {replies.map(reply => (
                      <div key={reply.id} className="ml-4 pl-3 border-l border-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{reply.author}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(reply.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive gap-1" onClick={() => onDeleteComment(reply.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {/* Reply input */}
                    {replyTo === comment.id && (
                      <div className="ml-4 flex gap-2">
                        <Textarea
                          className="flex-1 min-h-[40px] text-xs resize-none"
                          placeholder="Responder..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(comment.id); } }}
                        />
                        <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleReply(comment.id)}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          {/* New comment */}
          <div className="flex gap-2 pt-2 border-t border-border">
            <Textarea
              className="flex-1 min-h-[40px] text-sm resize-none"
              placeholder="Adicionar comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            />
            <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleSubmit} disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 mt-0 p-3">
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {page.activityLog.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhuma atividade</p>
              )}
              {[...page.activityLog].reverse().map(entry => (
                <div key={entry.id} className="flex items-start gap-2">
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {actionIcons[entry.action] || <Activity className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm">{entry.details}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(entry.timestamp), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
