import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, RefreshCw, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Transaction {
  id: string;
  name: string;
  date: string;
  value: number;
  sector_id: string | null;
  description: string | null;
  status: string;
}

interface Sector {
  id: string;
  name: string;
  color_label: string;
  icon: string;
}

interface FinanceAnalysisProps {
  userId: string;
  transactions: Transaction[];
  sectors: Sector[];
  income: number;
  expenses: number;
  balance: number;
  isOpen: boolean;
  onClose: () => void;
}

export function FinanceAnalysis({
  userId,
  transactions,
  sectors,
  income,
  expenses,
  balance,
  isOpen,
  onClose,
}: FinanceAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateAnalysis = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("finance-analysis", {
        body: {
          userId,
          transactions,
          sectors,
          income,
          expenses,
          balance,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setAnalysis(data.analysis);
        setHasGenerated(true);
      } else {
        toast.error(data.message || "Erro ao gerar análise");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error("Erro ao gerar análise financeira");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-full md:w-[400px] h-full bg-card border-l border-border/30 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Análise IA</h3>
              <p className="text-xs text-muted-foreground">Dicas personalizadas</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {!hasGenerated && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-6">
              {/* Animated icon with glow */}
              <motion.div 
                className="relative"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-xl" />
                <div className="relative p-5 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
              </motion.div>

              {/* Title and description */}
              <div className="space-y-3">
                <h4 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Análise Inteligente
                </h4>
                <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">
                  Nossa IA analisa seus gastos e receitas para oferecer <span className="text-foreground font-medium">dicas personalizadas</span> de economia e saúde financeira.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-primary">✓</span>
                  <span>Identifica padrões de gastos</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-primary">✓</span>
                  <span>Sugere áreas para economizar</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                  <span className="text-primary">✓</span>
                  <span>Dicas de hábitos financeiros</span>
                </div>
              </div>

              {/* CTA Button */}
              <Button 
                onClick={generateAnalysis} 
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <Sparkles className="h-4 w-4" />
                Gerar Minha Análise
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
              <div className="relative">
                <div className="p-4 rounded-full bg-primary/10">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Analisando seus dados...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  A IA está processando suas transações
                </p>
              </div>
            </div>
          )}

          {hasGenerated && analysis && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mt-4 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-medium text-foreground mt-3 mb-1">{children}</h3>,
                    p: ({ children }) => <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-1 mb-3">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-1 mb-3 list-decimal list-inside">{children}</ol>,
                    li: ({ children }) => (
                      <li className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="text-primary">{children}</em>,
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={generateAnalysis}
                className="w-full gap-2 mt-4"
              >
                <RefreshCw className="h-3 w-3" />
                Gerar Nova Análise
              </Button>
            </motion.div>
          )}
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
