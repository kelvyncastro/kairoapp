import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "@/components/layout/AppLayout";
import { WelcomePanel } from "@/components/onboarding/WelcomePanel";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Lazy load routes that are not needed on initial page load
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Rotina = lazy(() => import("./pages/Rotina"));
const Habitos = lazy(() => import("./pages/Habitos"));
const Metas = lazy(() => import("./pages/Metas"));
const Consistencia = lazy(() => import("./pages/Consistencia"));
const Treino = lazy(() => import("./pages/Treino"));
const Dieta = lazy(() => import("./pages/Dieta"));
const Financas = lazy(() => import("./pages/Financas"));
const ChatFinanceiro = lazy(() => import("./pages/ChatFinanceiro"));
const Ebook = lazy(() => import("./pages/Ebook"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Ranking = lazy(() => import("./pages/Ranking"));

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
              <Route path="/auth" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppWithOnboarding />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                <Route path="/rotina" element={<Suspense fallback={<PageLoader />}><Rotina /></Suspense>} />
                <Route path="/habitos" element={<Suspense fallback={<PageLoader />}><Habitos /></Suspense>} />
                <Route path="/metas" element={<Suspense fallback={<PageLoader />}><Metas /></Suspense>} />
                <Route path="/consistencia" element={<Suspense fallback={<PageLoader />}><Consistencia /></Suspense>} />
                <Route path="/ranking" element={<Suspense fallback={<PageLoader />}><Ranking /></Suspense>} />
                <Route path="/treino" element={<AdminRoute><Suspense fallback={<PageLoader />}><Treino /></Suspense></AdminRoute>} />
                <Route path="/dieta" element={<AdminRoute><Suspense fallback={<PageLoader />}><Dieta /></Suspense></AdminRoute>} />
                <Route path="/financas" element={<Suspense fallback={<PageLoader />}><Financas /></Suspense>} />
                <Route path="/chat-financeiro" element={<Suspense fallback={<PageLoader />}><ChatFinanceiro /></Suspense>} />
                <Route path="/ebook" element={<AdminRoute><Suspense fallback={<PageLoader />}><Ebook /></Suspense></AdminRoute>} />
                <Route path="/agenda" element={<Suspense fallback={<PageLoader />}><Agenda /></Suspense>} />
                <Route path="/configuracoes" element={<Suspense fallback={<PageLoader />}><Configuracoes /></Suspense>} />
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
