import { Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Configuracoes() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta</p>
      </div>

      <div className="cave-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">{user?.email}</p>
            <p className="text-sm text-muted-foreground">Modo Caverna ativo</p>
          </div>
        </div>

        <Button variant="destructive" onClick={signOut}>
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
