import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "@/components/layout/AppLayout";
import { WelcomePanel } from "@/components/onboarding/WelcomePanel";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Rotina from "./pages/Rotina";
import Habitos from "./pages/Habitos";
import Metas from "./pages/Metas";
import Consistencia from "./pages/Consistencia";
import Treino from "./pages/Treino";
import Dieta from "./pages/Dieta";
import Financas from "./pages/Financas";
import ChatFinanceiro from "./pages/ChatFinanceiro";
import Ebook from "./pages/Ebook";
import Configuracoes from "./pages/Configuracoes";
import Agenda from "./pages/Agenda";
import Ranking from "./pages/Ranking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppWithOnboarding() {
  const { needsOnboarding, loading } = useUserProfile();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <WelcomePanel />;
  }

  return <AppLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserProfileProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppWithOnboarding />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/rotina" element={<Rotina />} />
                <Route path="/habitos" element={<Habitos />} />
                <Route path="/metas" element={<Metas />} />
                <Route path="/consistencia" element={<Consistencia />} />
                <Route path="/treino" element={<AdminRoute><Treino /></AdminRoute>} />
                <Route path="/dieta" element={<AdminRoute><Dieta /></AdminRoute>} />
                <Route path="/financas" element={<Financas />} />
                <Route path="/chat-financeiro" element={<ChatFinanceiro />} />
                <Route path="/ebook" element={<AdminRoute><Ebook /></AdminRoute>} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UserProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
