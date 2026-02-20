import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { WelcomePanel } from "@/components/onboarding/WelcomePanel";
import { Loader2 } from "lucide-react";

export default function PrimeiroAcesso() {
  const { needsOnboarding, isSubscriptionInactive, loading } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (isSubscriptionInactive) {
        navigate("/assinatura-inativa", { replace: true });
      } else if (!needsOnboarding) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [loading, needsOnboarding, isSubscriptionInactive, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!needsOnboarding) {
    return null;
  }

  return <WelcomePanel />;
}
