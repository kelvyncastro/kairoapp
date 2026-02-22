import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Search, UserPlus, Trash2, Loader2, Users, Eye, Pencil } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShareEntry {
  id: string;
  shared_with_id: string;
  permission: 'view' | 'edit';
  first_name: string | null;
  avatar_url: string | null;
  public_id: string | null;
}

interface ShareNoteDialogProps {
  open: boolean;
  onClose: () => void;
  pageId: string;
  pageTitle: string;
}

export function ShareNoteDialog({ open, onClose, pageId, pageTitle }: ShareNoteDialogProps) {
  const { user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [searching, setSearching] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);
  const [foundUser, setFoundUser] = useState<{ user_id: string; first_name: string; avatar_url: string; public_id: string } | null>(null);

  const loadShares = useCallback(async () => {
    if (!user) return;
    setLoadingShares(true);
    try {
      const { data, error } = await supabase
        .from('notes_shares')
        .select('id, shared_with_id, permission')
        .eq('page_id', pageId)
        .eq('owner_id', user.id);

      if (error) throw error;

      // Get profiles for shared users
      const userIds = (data || []).map(s => s.shared_with_id);
      if (userIds.length === 0) {
        setShares([]);
        setLoadingShares(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, avatar_url, public_id')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      setShares((data || []).map(s => {
        const profile = profileMap.get(s.shared_with_id);
        return {
          id: s.id,
          shared_with_id: s.shared_with_id,
          permission: s.permission as 'view' | 'edit',
          first_name: profile?.first_name || null,
          avatar_url: profile?.avatar_url || null,
          public_id: profile?.public_id || null,
        };
      }));
    } catch (e) {
      console.error('Error loading shares:', e);
    } finally {
      setLoadingShares(false);
    }
  }, [user, pageId]);

  // Load shares when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      loadShares();
    } else {
      setFoundUser(null);
      setIdentifier('');
      onClose();
    }
  };

  const handleSearch = async () => {
    if (!identifier.trim()) return;
    setSearching(true);
    setFoundUser(null);
    try {
      const { data, error } = await supabase.rpc('find_user_for_sharing', {
        p_identifier: identifier.trim(),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const u = data[0];
        if (u.user_id === user?.id) {
          toast.error('Você não pode compartilhar consigo mesmo.');
          return;
        }
        setFoundUser(u);
      } else {
        toast.error('Usuário não encontrado.');
      }
    } catch (e: any) {
      console.error('Error searching user:', e);
      toast.error('Erro ao buscar usuário.');
    } finally {
      setSearching(false);
    }
  };

  const handleShare = async () => {
    if (!foundUser || !user) return;
    setSharing(true);
    try {
      const { error } = await supabase.from('notes_shares').upsert({
        page_id: pageId,
        owner_id: user.id,
        shared_with_id: foundUser.user_id,
        permission,
      }, { onConflict: 'page_id,shared_with_id' });

      if (error) throw error;

      toast.success(`Nota compartilhada com ${foundUser.first_name || 'usuário'}!`);
      setFoundUser(null);
      setIdentifier('');
      loadShares();
    } catch (e: any) {
      console.error('Error sharing note:', e);
      toast.error('Erro ao compartilhar nota.');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase.from('notes_shares').delete().eq('id', shareId);
      if (error) throw error;
      setShares(prev => prev.filter(s => s.id !== shareId));
      toast.success('Compartilhamento removido.');
    } catch (e) {
      console.error('Error removing share:', e);
      toast.error('Erro ao remover compartilhamento.');
    }
  };

  const handleUpdatePermission = async (shareId: string, newPermission: 'view' | 'edit') => {
    try {
      const { error } = await supabase
        .from('notes_shares')
        .update({ permission: newPermission })
        .eq('id', shareId);
      if (error) throw error;
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, permission: newPermission } : s));
    } catch (e) {
      console.error('Error updating permission:', e);
      toast.error('Erro ao alterar permissão.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Compartilhar nota
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate">"{pageTitle}"</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search user */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Buscar por email ou código de usuário
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Email ou código (ex: AB12CD34)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                className="h-9 text-sm"
              />
              <Button size="sm" onClick={handleSearch} disabled={searching || !identifier.trim()} className="h-9 gap-1">
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Found user */}
          {foundUser && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <Avatar className="h-9 w-9">
                <AvatarImage src={foundUser.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {foundUser.first_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{foundUser.first_name || 'Usuário'}</p>
                <p className="text-[10px] text-muted-foreground">#{foundUser.public_id}</p>
              </div>
              <Select value={permission} onValueChange={(v) => setPermission(v as 'view' | 'edit')}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <span className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> Visualizar</span>
                  </SelectItem>
                  <SelectItem value="edit">
                    <span className="flex items-center gap-1.5"><Pencil className="h-3 w-3" /> Editar</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleShare} disabled={sharing} className="h-8 gap-1">
                {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Convidar
              </Button>
            </div>
          )}

          {/* Current shares */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Pessoas com acesso ({shares.length})
            </p>
            {loadingShares ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : shares.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhum compartilhamento ainda.
              </p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {shares.map(share => (
                    <div key={share.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors group">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={share.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {share.first_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{share.first_name || 'Usuário'}</p>
                        {share.public_id && (
                          <p className="text-[10px] text-muted-foreground">#{share.public_id}</p>
                        )}
                      </div>
                      <Select
                        value={share.permission}
                        onValueChange={(v) => handleUpdatePermission(share.id, v as 'view' | 'edit')}
                      >
                        <SelectTrigger className="h-7 w-24 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view" className="text-xs">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Ver</span>
                          </SelectItem>
                          <SelectItem value="edit" className="text-xs">
                            <span className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Editar</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRemoveShare(share.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
