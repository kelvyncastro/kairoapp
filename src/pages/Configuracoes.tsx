import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Configuracoes() {
  const { user, signOut } = useAuth();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua conta</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
            Conta
          </h2>
          <div className="cave-card p-6 max-w-2xl">
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
      </div>
    </div>
  );
}
