import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoogleCalendarConnectProps {
  onSuccess?: () => void;
}

export function GoogleCalendarConnect({ onSuccess }: GoogleCalendarConnectProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/agenda",
          scopes: "https://www.googleapis.com/auth/calendar.readonly",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error connecting Google Calendar:", error);
      toast({
        title: "Erro ao conectar",
        description: "Não foi possível conectar com o Google Calendar. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-4 rounded-full bg-primary/10 mb-4">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">Conectar Google Calendar</h3>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        Conecte sua conta Google para visualizar seus eventos e reuniões diretamente aqui.
        Apenas leitura - não modificamos sua agenda.
      </p>

      <Button onClick={handleConnect} disabled={loading} size="lg">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Conectar com Google
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground mt-4">
        Você será redirecionado para fazer login no Google
      </p>
    </div>
  );
}
