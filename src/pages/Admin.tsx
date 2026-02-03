import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, Users, Search, Crown, UserCheck, UserX, Copy, Check, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  public_id: string | null;
  subscription_status: string;
  created_at: string;
  avatar_url: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [grantingAdmin, setGrantingAdmin] = useState<string | null>(null);
  const [revokingAdmin, setRevokingAdmin] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchUserRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const updateSubscriptionStatus = async (userId: string, status: string) => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ subscription_status: status })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.user_id === userId 
          ? { ...user, subscription_status: status }
          : user
      ));

      toast({
        title: "Assinatura atualizada",
        description: `Status alterado para ${status === 'active' ? 'Ativa' : 'Inativa'}`
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Erro ao atualizar assinatura",
        variant: "destructive"
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const grantAdminRole = async (userId: string) => {
    setGrantingAdmin(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Usuário já é admin",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      setUserRoles(prev => [...prev, { user_id: userId, role: 'admin' }]);

      toast({
        title: "Admin concedido!",
        description: "O usuário agora tem acesso de administrador."
      });
    } catch (error) {
      console.error('Error granting admin:', error);
      toast({
        title: "Erro ao conceder admin",
        variant: "destructive"
      });
    } finally {
      setGrantingAdmin(null);
    }
  };

  const revokeAdminRole = async (userId: string) => {
    setRevokingAdmin(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      setUserRoles(prev => prev.filter(r => !(r.user_id === userId && r.role === 'admin')));

      toast({
        title: "Admin revogado",
        description: "O acesso de administrador foi removido."
      });
    } catch (error) {
      console.error('Error revoking admin:', error);
      toast({
        title: "Erro ao revogar admin",
        variant: "destructive"
      });
    } finally {
      setRevokingAdmin(null);
    }
  };

  const isAdmin = (userId: string) => {
    return userRoles.some(r => r.user_id === userId && r.role === 'admin');
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const publicId = user.public_id?.toLowerCase() || '';
    const id = user.user_id.toLowerCase();
    
    return fullName.includes(searchLower) || 
           publicId.includes(searchLower) || 
           id.includes(searchLower);
  });

  const activeCount = users.filter(u => u.subscription_status === 'active').length;
  const adminCount = userRoles.filter(r => r.role === 'admin').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Painel de Administração
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie usuários, assinaturas e permissões
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <UserCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Crown className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold">{adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Usuários</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Public ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const userIsAdmin = isAdmin(user.user_id);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || undefined} alt={user.first_name || 'User'} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.first_name?.charAt(0)?.toUpperCase() || '?'}
                              {user.last_name?.charAt(0)?.toUpperCase() || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            {user.first_name || user.last_name ? (
                              <span className="text-base font-bold">
                                {user.first_name} {user.last_name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Sem nome
                              </span>
                            )}
                            {userIsAdmin && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {format(new Date(user.created_at), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.public_id || '-'}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded max-w-[100px] truncate">
                            {user.user_id.slice(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(user.user_id)}
                          >
                            {copiedId === user.user_id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.subscription_status}
                          onValueChange={(value) => updateSubscriptionStatus(user.user_id, value)}
                          disabled={updatingUser === user.user_id}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                Ativa
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                Inativa
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            userIsAdmin 
                              ? "border-yellow-500 text-yellow-500" 
                              : "border-muted-foreground text-muted-foreground"
                          )}
                        >
                          {userIsAdmin ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {userIsAdmin ? (
                          // Protect supreme admin (Arthur Alberti) from having admin revoked
                          user.first_name?.toLowerCase() === 'arthur' && 
                          user.last_name?.toLowerCase()?.includes('alberti') ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin Supremo
                            </Badge>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={revokingAdmin === user.user_id}
                                >
                                  {revokingAdmin === user.user_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <UserX className="h-4 w-4 mr-1" />
                                      Revogar
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revogar Acesso Admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover o acesso de administrador de{" "}
                                    <strong>{user.first_name} {user.last_name}</strong>?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => revokeAdminRole(user.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Revogar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={grantingAdmin === user.user_id}
                              >
                                {grantingAdmin === user.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Crown className="h-4 w-4 mr-1" />
                                    Tornar Admin
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Conceder Acesso Admin</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja dar acesso de administrador para{" "}
                                  <strong>{user.first_name || 'este usuário'} {user.last_name || ''}</strong>?
                                  <br /><br />
                                  Administradores têm acesso total ao sistema, incluindo gestão de usuários e configurações.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => grantAdminRole(user.user_id)}>
                                  Conceder Admin
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
