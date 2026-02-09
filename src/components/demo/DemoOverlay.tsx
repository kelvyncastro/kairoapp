import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ListTodo, Target, MessageCircle, Wallet, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DemoTarefas } from './pages/DemoTarefas';
import { DemoHabitos } from './pages/DemoHabitos';
import { DemoMetas } from './pages/DemoMetas';
import { DemoChatFinanceiro } from './pages/DemoChatFinanceiro';
import { DemoFinancas } from './pages/DemoFinancas';

const DEMO_DURATION = 60; // seconds

const TABS = [
  { id: 'tarefas', label: 'Tarefas', icon: ListTodo },
  { id: 'habitos', label: 'Hábitos', icon: BarChart3 },
  { id: 'metas', label: 'Metas', icon: Target },
  { id: 'chat', label: 'Chat IA', icon: MessageCircle },
  { id: 'financas', label: 'Finanças', icon: Wallet },
] as const;

type TabId = typeof TABS[number]['id'];

interface DemoOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function DemoOverlay({ open, onClose }: DemoOverlayProps) {
  const [activeTab, setActiveTab] = useState<TabId>('tarefas');
  const [timeLeft, setTimeLeft] = useState(DEMO_DURATION);

  const handleClose = useCallback(() => {
    setTimeLeft(DEMO_DURATION);
    setActiveTab('tarefas');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setTimeLeft(DEMO_DURATION);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleClose();
          return DEMO_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, handleClose]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLow = timeLeft <= 10;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-[95vw] h-[90vh] max-w-6xl bg-background border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-3 md:px-5 py-2.5 border-b border-border/30 flex-shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-medium text-muted-foreground ml-2 hidden sm:block">Modo Demonstração</span>
              </div>

              {/* Timer */}
              <motion.div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold",
                  isLow ? "bg-destructive/20 text-destructive" : "bg-muted/50 text-muted-foreground"
                )}
                animate={isLow ? { scale: [1, 1.05, 1] } : {}}
                transition={isLow ? { duration: 1, repeat: Infinity } : {}}
              >
                <Clock className="h-3 w-3" />
                {minutes}:{seconds.toString().padStart(2, '0')}
              </motion.div>

              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 px-3 md:px-5 py-1.5 border-b border-border/30 flex-shrink-0 overflow-x-auto bg-background">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'tarefas' && <DemoTarefas />}
              {activeTab === 'habitos' && <DemoHabitos />}
              {activeTab === 'metas' && <DemoMetas />}
              {activeTab === 'chat' && <DemoChatFinanceiro />}
              {activeTab === 'financas' && <DemoFinancas />}
            </div>

            {/* Bottom CTA */}
            <div className="flex items-center justify-between px-4 md:px-5 py-2.5 border-t border-border/30 flex-shrink-0 bg-muted/10">
              <p className="text-xs text-muted-foreground hidden sm:block">
                Gostou? Assine e tenha acesso completo a todas as funcionalidades.
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleClose}>
                  Fechar
                </Button>
                <a href="#pricing" onClick={handleClose}>
                  <Button size="sm" className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90">
                    Ver Planos
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
