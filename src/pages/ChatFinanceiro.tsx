import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Loader2, Sparkles, ArrowLeft, Mic, MicOff, Camera, Trash2 } from "lucide-react";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import chatAssistant from "@/assets/chat-assistant.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imagePreview?: string;
  isAudio?: boolean;
}

interface Sector {
  id: string;
  name: string;
}

// Floating particle component
function FloatingParticle({ delay, duration, size, startX, startY }: {
  delay: number; duration: number; size: number; startX: number; startY: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted/10"
      style={{ width: size, height: size, left: `${startX}%`, bottom: `${startY}%` }}
      initial={{ opacity: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0.4, 0],
        y: [-20, -150, -300, -450],
        scale: [0.5, 1, 0.8, 0.3],
        x: [0, Math.random() * 60 - 30, Math.random() * 80 - 40],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

// Glowing orb component
function GlowingOrb({ x, y, size, color, delay }: {
  x: number; y: number; size: number; color: string; delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full blur-2xl"
      style={{ width: size, height: size, left: `${x}%`, top: `${y}%`, background: color }}
      animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
      transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function ChatFinanceiro() {
  const { user } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá! Sou seu assistente financeiro inteligente. Posso **registrar transações**, **analisar suas finanças** e **tirar dúvidas**.

### 📝 Registrar
- "Gastei R$200 no mercado"
- "Recebi R$5000 de salário"
- 🎤 Grave um áudio com o que gastou
- 📸 Envie foto de recibo ou notificação

### 📊 Consultar
- "Quanto gastei esse mês?"
- "Me dá um relatório completo"

### 💡 Dúvidas e Conselhos
- "Como posso economizar mais?"
- "Vale a pena investir em renda fixa?"
- "O que acha dos meus gastos?"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendAfterStopRef = useRef(false);

  const fetchSectors = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("finance_sectors")
      .select("id, name")
      .eq("user_id", user.id);
    if (data) setSectors(data);
  }, [user]);

  useEffect(() => { fetchSectors(); }, [fetchSectors]);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendMessage = async (options?: { audioBase64?: string; imageBase64?: string; imagePreview?: string }) => {
    if (isLoading || !user) return;

    const hasText = input.trim().length > 0;
    const hasAudio = !!options?.audioBase64;
    const hasImage = !!options?.imageBase64;

    if (!hasText && !hasAudio && !hasImage) return;

    const userContent = hasAudio
      ? "🎤 Áudio enviado..."
      : hasImage
        ? input.trim() || "📸 Foto enviada para análise"
        : input.trim();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userContent,
      timestamp: new Date(),
      imagePreview: options?.imagePreview,
      isAudio: hasAudio,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("finance-chat", {
        body: {
          message: hasText ? currentInput : undefined,
          sectors,
          conversationHistory,
          audioBase64: options?.audioBase64,
          imageBase64: options?.imageBase64,
        },
      });

      if (error) throw error;

      const assistantContent = data.message;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        let updated = [...prev];
        // Replace the audio placeholder with actual transcription
        if (data.audioTranscription) {
          updated = updated.map(m =>
            m.id === userMessage.id
              ? { ...m, content: `🎤 ${data.audioTranscription}` }
              : m
          );
        }
        return [...updated, assistantMessage];
      });

      if (data.success && !data.isQuery) {
        toast.success("Transação registrada!");
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente.",
        timestamp: new Date(),
      }]);
      toast.error("Erro ao processar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size < 1000) {
          toast.error("Áudio muito curto. Tente novamente.");
          return;
        }
        const audioBase64 = await blobToBase64(audioBlob);
        sendMessage({ audioBase64 });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 59) {
            mediaRecorderRef.current?.stop();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic error:", err);
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Envie apenas imagens (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      sendMessage({ imageBase64: base64, imagePreview: previewUrl });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    duration: 8 + (i % 3) * 2 + 4,
    size: 4 + (i % 5) * 2,
    startX: (i * 17) % 100,
    startY: (i * 7) % 30 - 10,
  })), []);

  return (
    <div className="h-full -m-4 md:-m-6 relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/50 to-background" />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 80% 50% at 20% 40%, hsl(var(--muted) / 0.4) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 60%, hsl(var(--secondary) / 0.3) 0%, transparent 50%)",
              "radial-gradient(ellipse 60% 40% at 30% 60%, hsl(var(--muted) / 0.4) 0%, transparent 50%), radial-gradient(ellipse 80% 50% at 70% 40%, hsl(var(--secondary) / 0.3) 0%, transparent 50%)",
              "radial-gradient(ellipse 80% 50% at 20% 40%, hsl(var(--muted) / 0.4) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 60%, hsl(var(--secondary) / 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <GlowingOrb x={10} y={20} size={300} color="hsl(var(--muted) / 0.3)" delay={0} />
        <GlowingOrb x={70} y={60} size={400} color="hsl(var(--secondary) / 0.25)" delay={2} />
        <GlowingOrb x={40} y={80} size={250} color="hsl(var(--accent) / 0.2)" delay={4} />
        {particles.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--foreground) / 0.1) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.4)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/20">
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/financas">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/50">
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-border/50">
                <AvatarImage src={chatAssistant} alt="Assistant" />
                <AvatarFallback className="bg-secondary">
                  <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-sm md:text-lg">Chat Financeiro</h1>
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Texto, áudio ou foto de recibo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 md:px-6 py-3 md:py-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 border border-border/50 flex-shrink-0">
                      <AvatarImage src={chatAssistant} alt="Assistant" />
                      <AvatarFallback className="bg-secondary">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`rounded-2xl px-4 py-3 max-w-[80%] backdrop-blur-sm ${
                      message.role === "user"
                        ? "bg-accent/60 text-foreground border border-border/30"
                        : "bg-secondary/40 text-foreground border border-border/30"
                    }`}
                  >
                    {message.imagePreview && (
                      <img
                        src={message.imagePreview}
                        alt="Imagem enviada"
                        className="rounded-lg mb-2 max-h-40 w-auto object-contain"
                      />
                    )}
                    <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-base font-bold text-foreground mb-2 mt-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-medium text-foreground mt-2 mb-1">{children}</h3>,
                          p: ({ children }) => <p className="text-sm text-foreground/90 mb-2">{children}</p>,
                          ul: ({ children }) => <ul className="space-y-0.5 mb-2 ml-1">{children}</ul>,
                          ol: ({ children }) => <ol className="space-y-0.5 mb-2 list-decimal list-inside">{children}</ol>,
                          li: ({ children }) => (
                            <li className="text-sm text-foreground/90 flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span className="flex-1">{children}</span>
                            </li>
                          ),
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          em: ({ children }) => <em className="text-primary not-italic">{children}</em>,
                        }}
                      >
                        {message.content.replace(/<[^>]*>/g, '')}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Avatar className="h-8 w-8 border border-border/50 flex-shrink-0">
                  <AvatarImage src={chatAssistant} alt="Assistant" />
                  <AvatarFallback className="bg-secondary">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-secondary/40 rounded-2xl px-4 py-3 border border-border/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <motion.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-muted-foreground"
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </motion.div>
                    <span className="text-sm text-muted-foreground ml-1">Processando</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-border/20">
          {/* Recording indicator */}
          {isRecording && (
            <AIVoiceInput
              isRecording={isRecording}
              onStop={stopRecording}
              onStart={startRecording}
              visualizerBars={32}
              className="py-2"
            />
          )}

          <div className="flex gap-2 items-center">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Camera/image button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isRecording}
              className="h-12 w-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 flex-shrink-0 border border-border/30 backdrop-blur-sm"
              title="Enviar foto de recibo"
            >
              <Camera className="h-5 w-5" />
            </Button>

            {/* Mic button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`h-12 w-12 rounded-xl flex-shrink-0 border border-border/30 backdrop-blur-sm ${
                isRecording
                  ? "text-destructive hover:text-destructive hover:bg-destructive/20 border-destructive/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Gastei R$50 no mercado..."
              className="flex-1 bg-secondary/30 border-border/40 text-foreground placeholder:text-muted-foreground focus:border-border focus:ring-1 focus:ring-ring/50 h-12 rounded-xl backdrop-blur-sm"
              disabled={isLoading || isRecording}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || isRecording}
              className="bg-accent/80 hover:bg-accent text-foreground px-5 h-12 rounded-xl backdrop-blur-sm border border-border/30"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
