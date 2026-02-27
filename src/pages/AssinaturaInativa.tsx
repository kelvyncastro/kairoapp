import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import kairoLogo from "@/assets/kairo-penguin.png";

export default function AssinaturaInativa() {
  const { signOut } = useAuth();
  const { subscriptionInfo, checkSubscription } = useUserProfile();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isPastDue = subscriptionInfo?.status === "past_due";

  const PRICES = {
    monthly: { id: "price_1T5UXMRJMHH3zUuvtPse22FH", amount: 29.90, label: "/mês" },
    yearly: { id: "price_1T5ULPRJMHH3zUuvllNGtQ1t", amount: 69.90, label: "/ano" },
  };

  const handleStartTrial = async (planKey: "monthly" | "yearly" = "yearly") => {
    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRICES[planKey].id },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({ title: "Erro", description: "Não foi possível iniciar o checkout.", variant: "destructive" });
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({ title: "Erro", description: "Não foi possível abrir o portal.", variant: "destructive" });
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast({ title: "Status atualizado", description: "Verificação de assinatura concluída." });
  };

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
          <h1 className="text-xl font-bold text-foreground">
            {isPastDue ? "Pagamento Pendente" : "Acesso Suspenso"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPastDue
              ? "Seu pagamento falhou. Atualize seu método de pagamento para continuar usando o Kairo."
              : "Sua assinatura está inativa. Comece seu teste grátis de 7 dias ou reative sua assinatura."}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {isPastDue ? (
            <Button
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="w-full"
            >
              {loadingPortal ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Atualizar Pagamento
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={() => handleStartTrial("yearly")}
                disabled={loadingCheckout}
                className="w-full"
              >
                {loadingCheckout ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Anual — R$ 69,90/ano
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStartTrial("monthly")}
                disabled={loadingCheckout}
                className="w-full"
              >
                {loadingCheckout ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Mensal — R$ 29,90/mês
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full"
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Já paguei — Verificar status
          </Button>

          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="w-full text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
