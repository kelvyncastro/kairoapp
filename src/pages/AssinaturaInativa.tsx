import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, CreditCard, Loader2, ExternalLink, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import kairoLogo from "@/assets/kairo-penguin.png";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

const PRICES = {
  monthly: { id: "price_1T5UXMRJMHH3zUuvtPse22FH", amount: 29.90, label: "/mês" },
  yearly: { id: "price_1T5ULPRJMHH3zUuvllNGtQ1t", amount: 69.90, label: "/ano" },
};

export default function AssinaturaInativa() {
  const { signOut } = useAuth();
  const { subscriptionInfo, checkSubscription } = useUserProfile();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isYearly, setIsYearly] = useState(true);

  const isPastDue = subscriptionInfo?.status === "past_due";
  const price = isYearly ? PRICES.yearly : PRICES.monthly;

  const handleStartTrial = async () => {
    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: price.id },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
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
        window.location.href = data.url;
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
              : "Sua assinatura está inativa. Escolha um plano e comece seu teste grátis de 7 dias."}
          </p>
        </div>

        <div className="space-y-4 pt-2">
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
            <div className="space-y-4">
              {/* Toggle Mensal / Anual */}
              <div className="flex justify-center">
                <div className="relative flex items-center gap-1 rounded-full bg-muted/40 p-1">
                  <button
                    onClick={() => setIsYearly(false)}
                    className={cn(
                      "relative z-10 h-9 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      !isYearly ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {!isYearly && (
                      <motion.div layoutId="inactive-pricing-toggle" className="absolute inset-0 rounded-full bg-primary" />
                    )}
                    <span className="relative z-10">Mensal</span>
                  </button>
                  <button
                    onClick={() => setIsYearly(true)}
                    className={cn(
                      "relative z-10 h-9 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      isYearly ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {isYearly && (
                      <motion.div layoutId="inactive-pricing-toggle" className="absolute inset-0 rounded-full bg-primary" />
                    )}
                    <span className="relative z-10">Anual</span>
                  </button>
                </div>
              </div>

              {/* Preço animado */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {isYearly ? "Plano Anual" : "Plano Mensal"}
                </div>
                <div className="flex items-baseline justify-center gap-1.5 mb-1">
                  <span className="text-lg text-muted-foreground">R$</span>
                  <NumberFlow
                    value={price.amount}
                    format={{ minimumFractionDigits: 2 }}
                    className="text-4xl font-bold text-foreground"
                  />
                  <span className="text-muted-foreground text-sm">{price.label}</span>
                </div>
                {isYearly && (
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <p className="text-muted-foreground line-through text-xs">R$197,90/ano</p>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">-65%</span>
                  </div>
                )}
                <p className="text-xs font-medium text-emerald-500">
                  {isYearly
                    ? "Apenas R$5,83/mês — Economize R$128,00"
                    : "Cancele quando quiser, sem compromisso"}
                </p>
              </div>

              {/* Features */}
              <ul className="text-left space-y-2 text-sm text-muted-foreground">
                {[
                  "7 dias grátis para testar",
                  "Acesso total a todas as funcionalidades",
                  isYearly ? "Prioridade em novos recursos" : "Flexibilidade mês a mês",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleStartTrial}
                disabled={loadingCheckout}
                className="w-full"
                size="lg"
              >
                {loadingCheckout ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Começar Teste Grátis
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
