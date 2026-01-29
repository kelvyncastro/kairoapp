import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import chatBackground from "@/assets/chat-background.jpg";
import batmanLogo from "@/assets/batman-logo.jpg";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface FinanceChatProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: { id: string; name: string }[];
  onTransactionAdded: () => void;
}

export function FinanceChat({ isOpen, onClose, sectors, onTransactionAdded }: FinanceChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou seu assistente financeiro. Me conte sobre suas transações de forma natural.\n\n**Exemplos:**\n• \"Gastei R$200 no mercado\"\n• \"Recebi R$5000 de salário\"\n• \"Paguei R$80 de uber\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("finance-chat", {
        body: {
          message: userMessage.content,
          userId: user.id,
          sectors: sectors,
        },
      });

      if (error) {
        throw error;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.success) {
        onTransactionAdded();
        toast.success("Transação registrada!");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Erro ao processar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg h-[600px] mx-4 overflow-hidden rounded-2xl border border-border/30 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Base background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${chatBackground})` }}
            />
            
            {/* Animated gradient overlays */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-black/90 via-zinc-900/70 to-black/90"
              animate={{
                background: [
                  "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(39,39,42,0.7) 50%, rgba(0,0,0,0.9) 100%)",
                  "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(24,24,27,0.7) 50%, rgba(0,0,0,0.9) 100%)",
                  "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(39,39,42,0.7) 50%, rgba(0,0,0,0.9) 100%)",
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-zinc-500/20"
                initial={{
                  x: Math.random() * 400,
                  y: Math.random() * 600,
                }}
                animate={{
                  y: [null, Math.random() * -200 - 100],
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 6 + Math.random() * 4,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30 bg-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-zinc-700">
                  <AvatarImage src={batmanLogo} alt="Assistant" />
                  <AvatarFallback className="bg-zinc-800">
                    <MessageCircle className="h-5 w-5 text-zinc-400" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">Chat Financeiro</h3>
                  <p className="text-xs text-muted-foreground">Registre transações por texto</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:bg-zinc-800/50"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 border border-zinc-700 flex-shrink-0">
                        <AvatarImage src={batmanLogo} alt="Assistant" />
                        <AvatarFallback className="bg-zinc-800">
                          <MessageCircle className="h-4 w-4 text-zinc-400" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-zinc-700/80 text-foreground"
                          : "bg-zinc-800/60 text-foreground border border-zinc-700/50"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content.split("**").map((part, i) =>
                          i % 2 === 1 ? (
                            <strong key={i} className="font-semibold text-zinc-200">
                              {part}
                            </strong>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8 border border-zinc-700 flex-shrink-0">
                      <AvatarImage src={batmanLogo} alt="Assistant" />
                      <AvatarFallback className="bg-zinc-800">
                        <MessageCircle className="h-4 w-4 text-zinc-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-zinc-800/60 rounded-2xl px-4 py-3 border border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        <span className="text-sm text-zinc-400">Processando...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/30 bg-black/40 backdrop-blur-sm">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ex: Gastei R$50 no mercado..."
                  className="flex-1 bg-zinc-800/50 border-zinc-700/50 text-foreground placeholder:text-zinc-500 focus:border-zinc-600"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-zinc-700 hover:bg-zinc-600 text-foreground px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
