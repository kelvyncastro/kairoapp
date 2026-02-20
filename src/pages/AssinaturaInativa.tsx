import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";
import kairoLogo from "@/assets/kairo-penguin.png";

export default function AssinaturaInativa() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8">
        <img src={kairoLogo} alt="Kairo" className="h-12 w-12 rounded-lg" />
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Acesso Suspenso</h1>
          <p className="text-sm text-muted-foreground">
            Sua assinatura está inativa. Para continuar usando o Kairo, 
            é necessário reativar sua assinatura.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
