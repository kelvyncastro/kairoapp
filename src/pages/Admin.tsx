 import { useState, useEffect, useMemo } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useIsAdmin } from "@/hooks/useIsAdmin";
 import { Navigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Loader2, Search, Shield, ShieldOff, Crown, Users, RefreshCw } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { format, formatDistanceToNow } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
 interface UserProfile {
   id: string;
   user_id: string;
   first_name: string | null;
   last_name: string | null;
   avatar_url: string | null;
   subscription_status: string;
   updated_at: string;
   created_at: string;
 }
 
 interface UserRole {
   user_id: string;
   role: "admin" | "user";
 }
 
 const ADMIN_SUPREMO_EMAIL = "arthurgabrielalberti123@gmail.com";
 
 export default function Admin() {
   const { user } = useAuth();
   const { isAdmin, loading: adminLoading } = useIsAdmin();
   const { toast } = useToast();
   const [profiles, setProfiles] = useState<UserProfile[]>([]);
   const [roles, setRoles] = useState<UserRole[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState("");
   const [filterSubscription, setFilterSubscription] = useState<string>("all");
 
   const fetchData = async () => {
     setLoading(true);
     const [profilesRes, rolesRes] = await Promise.all([
       supabase.from("user_profiles").select("*").order("updated_at", { ascending: false }),
       supabase.from("user_roles").select("user_id, role"),
     ]);
 
     if (profilesRes.data) setProfiles(profilesRes.data);
     if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
     setLoading(false);
   };
 
   useEffect(() => {
     if (isAdmin) fetchData();
   }, [isAdmin]);
 
   const getUserRole = (userId: string) => {
     return roles.find((r) => r.user_id === userId)?.role || "user";
   };
 
   const isAdminSupremo = (profile: UserProfile) => {
     // Check if this is the protected admin
     return profiles.some(
       (p) => p.user_id === profile.user_id && getUserRole(profile.user_id) === "admin"
     ) && profile.first_name?.toLowerCase().includes("arthur");
   };
 
   const handleToggleAdmin = async (profile: UserProfile) => {
     const currentRole = getUserRole(profile.user_id);
 
     // Protect Admin Supremo
     if (isAdminSupremo(profile) && currentRole === "admin") {
       toast({
         title: "Ação bloqueada",
         description: "Não é possível revogar privilégios do Admin Supremo.",
         variant: "destructive",
       });
       return;
     }
 
     if (currentRole === "admin") {
       // Remove admin role
       const { error } = await supabase
         .from("user_roles")
         .delete()
         .eq("user_id", profile.user_id)
         .eq("role", "admin");
 
       if (error) {
         toast({ title: "Erro ao remover admin", variant: "destructive" });
       } else {
         toast({ title: "Privilégios de admin removidos" });
         fetchData();
       }
     } else {
       // Add admin role
       const { error } = await supabase.from("user_roles").insert({
         user_id: profile.user_id,
         role: "admin",
       });
 
       if (error) {
         toast({ title: "Erro ao adicionar admin", variant: "destructive" });
       } else {
         toast({ title: "Privilégios de admin concedidos" });
         fetchData();
       }
     }
   };
 
   const handleUpdateSubscription = async (profile: UserProfile, status: string) => {
     const { error } = await supabase
       .from("user_profiles")
       .update({ subscription_status: status })
       .eq("id", profile.id);
 
     if (error) {
       toast({ title: "Erro ao atualizar assinatura", variant: "destructive" });
     } else {
       toast({ title: "Assinatura atualizada" });
       fetchData();
     }
   };
 
   const filteredProfiles = useMemo(() => {
     return profiles.filter((p) => {
       const matchesSearch =
         !searchQuery ||
         p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
 
       const matchesSubscription =
         filterSubscription === "all" || p.subscription_status === filterSubscription;
 
       return matchesSearch && matchesSubscription;
     });
   }, [profiles, searchQuery, filterSubscription]);
 
   const stats = useMemo(() => {
     const total = profiles.length;
     const admins = roles.filter((r) => r.role === "admin").length;
     const active = profiles.filter((p) => p.subscription_status === "active").length;
     return { total, admins, active };
   }, [profiles, roles]);
 
   if (adminLoading) {
     return (
       <div className="h-full flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   if (!isAdmin) {
     return <Navigate to="/dashboard" replace />;
   }
 
   return (
     <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
       {/* Header */}
       <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
         <div>
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <Shield className="h-6 w-6 text-primary" />
             Painel Administrativo
           </h1>
           <p className="text-sm text-muted-foreground">Gerenciar usuários, permissões e assinaturas</p>
         </div>
         <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
           {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
         </Button>
       </div>
 
       {/* Stats */}
       <div className="px-6 py-4 grid grid-cols-3 gap-4">
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Total de Usuários</CardDescription>
             <CardTitle className="text-3xl flex items-center gap-2">
               <Users className="h-6 w-6 text-muted-foreground" />
               {stats.total}
             </CardTitle>
           </CardHeader>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Administradores</CardDescription>
             <CardTitle className="text-3xl flex items-center gap-2">
               <Shield className="h-6 w-6 text-primary" />
               {stats.admins}
             </CardTitle>
           </CardHeader>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardDescription>Assinaturas Ativas</CardDescription>
             <CardTitle className="text-3xl flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" />
               {stats.active}
             </CardTitle>
           </CardHeader>
         </Card>
       </div>
 
       {/* Filters */}
       <div className="px-6 py-2 flex items-center gap-4">
         <div className="relative flex-1 max-w-sm">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder="Buscar por nome..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-9"
           />
         </div>
         <Select value={filterSubscription} onValueChange={setFilterSubscription}>
           <SelectTrigger className="w-48">
             <SelectValue placeholder="Filtrar assinatura" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="all">Todas</SelectItem>
             <SelectItem value="active">Ativas</SelectItem>
             <SelectItem value="inactive">Inativas</SelectItem>
           </SelectContent>
         </Select>
       </div>
 
       {/* Table */}
       <div className="flex-1 overflow-y-auto px-6 pb-6">
         {loading ? (
           <div className="flex items-center justify-center py-12">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           </div>
         ) : (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Usuário</TableHead>
                 <TableHead>Role</TableHead>
                 <TableHead>Assinatura</TableHead>
                 <TableHead>Última Atividade</TableHead>
                 <TableHead className="text-right">Ações</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredProfiles.map((profile) => {
                 const role = getUserRole(profile.user_id);
                 const isSupremo = isAdminSupremo(profile);
                 return (
                   <TableRow key={profile.id}>
                     <TableCell>
                       <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10">
                           <AvatarImage src={profile.avatar_url || undefined} />
                           <AvatarFallback>
                             {profile.first_name?.[0] || "U"}
                           </AvatarFallback>
                         </Avatar>
                         <div>
                           <p className="font-medium flex items-center gap-2">
                             {profile.first_name || "Sem nome"} {profile.last_name || ""}
                              {isSupremo && <Crown className="h-4 w-4 text-amber-500" />}
                           </p>
                           <p className="text-xs text-muted-foreground">
                             Cadastro: {format(new Date(profile.created_at), "dd/MM/yyyy")}
                           </p>
                         </div>
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge variant={role === "admin" ? "default" : "secondary"}>
                         {role === "admin" ? "Admin" : "Usuário"}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <Select
                         value={profile.subscription_status}
                         onValueChange={(v) => handleUpdateSubscription(profile, v)}
                       >
                         <SelectTrigger className="w-32">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="active">Ativa</SelectItem>
                           <SelectItem value="inactive">Inativa</SelectItem>
                         </SelectContent>
                       </Select>
                     </TableCell>
                     <TableCell>
                       <p className="text-sm text-muted-foreground">
                         {formatDistanceToNow(new Date(profile.updated_at), {
                           addSuffix: true,
                           locale: ptBR,
                         })}
                       </p>
                     </TableCell>
                     <TableCell className="text-right">
                       <Button
                         variant={role === "admin" ? "destructive" : "outline"}
                         size="sm"
                         onClick={() => handleToggleAdmin(profile)}
                         disabled={isSupremo && role === "admin"}
                       >
                         {role === "admin" ? (
                           <>
                             <ShieldOff className="h-4 w-4 mr-1" />
                             Remover Admin
                           </>
                         ) : (
                           <>
                             <Shield className="h-4 w-4 mr-1" />
                             Tornar Admin
                           </>
                         )}
                       </Button>
                     </TableCell>
                   </TableRow>
                 );
               })}
             </TableBody>
           </Table>
         )}
       </div>
     </div>
   );
 }