import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Rotina from "./pages/Rotina";
import Habitos from "./pages/Habitos";
import Metas from "./pages/Metas";
import Consistencia from "./pages/Consistencia";
import Treino from "./pages/Treino";
import Dieta from "./pages/Dieta";
import Financas from "./pages/Financas";
import Ebook from "./pages/Ebook";
import Configuracoes from "./pages/Configuracoes";
import Agenda from "./pages/Agenda";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
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
              <Route path="/ebook" element={<AdminRoute><Ebook /></AdminRoute>} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
