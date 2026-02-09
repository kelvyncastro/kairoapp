import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Sparkles, Mic, Camera, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import chatAssistant from '@/assets/chat-assistant.png';
import ReactMarkdown from 'react-markdown';

interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const DEMO_RESPONSES: Record<string, string> = {
  'default': `Entendi! Posso te ajudar com:

### 📝 Registrar
- "Gastei R$200 no mercado"
- "Recebi R$5000 de salário"
- 🎤 Grave um áudio com o que gastou
- 📸 Envie foto de recibo ou notificação

### 📊 Consultar  
- "Quanto gastei esse mês?"
- "Me dá um relatório completo"`,
  'gastei': `✅ **Transação registrada com sucesso!**

| Campo | Valor |
|-------|-------|
| **Tipo** | Despesa |
| **Valor** | R$ 200,00 |
| **Categoria** | Mercado |
| **Status** | Pago |
| **Data** | Hoje |

Sua despesa foi adicionada automaticamente. Posso ajudar com mais alguma coisa?`,
  'recebi': `✅ **Receita registrada!**

| Campo | Valor |
|-------|-------|
| **Tipo** | Receita |
| **Valor** | R$ 5.000,00 |
| **Categoria** | Salário |
| **Status** | Recebido |
| **Data** | Hoje |

Ótimo! Seu saldo do mês ficou positivo. 💰`,
  'quanto': `📊 **Resumo do mês de Fevereiro**

### Visão Geral
- **Ganhos**: R$ 8.500,00
- **Gastos**: R$ 4.230,00
- **Sobra**: R$ 4.270,00

### Top Gastos por Categoria
1. 🛒 **Mercado** — R$ 1.200,00 (28%)
2. 🚗 **Transporte** — R$ 850,00 (20%)
3. 🍽️ **Alimentação** — R$ 680,00 (16%)
4. 🎮 **Lazer** — R$ 500,00 (12%)
5. 📚 **Educação** — R$ 400,00 (9%)

Você está **economizando 50%** da sua renda. Excelente! 🎯`,
  'relatório': `📈 **Relatório Financeiro Completo**

### Receitas
- 💼 Salário: R$ 7.000,00
- 💰 Freelance: R$ 1.500,00

### Despesas Fixas
- 🏠 Aluguel: R$ 1.500,00
- 💡 Energia: R$ 180,00
- 📱 Internet: R$ 120,00

### Despesas Variáveis
- 🛒 Mercado: R$ 1.200,00
- 🚗 Uber/Gasolina: R$ 850,00
- 🍽️ Restaurantes: R$ 380,00

### Análise
Seu mês está **saudável**. Recomendo destinar os R$ 4.270 restantes:
- 50% → Investimentos (R$ 2.135)
- 30% → Reserva de emergência (R$ 1.281)
- 20% → Lazer (R$ 854)`,
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('gastei') || lower.includes('paguei') || lower.includes('comprei')) return DEMO_RESPONSES['gastei'];
  if (lower.includes('recebi') || lower.includes('salário') || lower.includes('ganhei')) return DEMO_RESPONSES['recebi'];
  if (lower.includes('quanto') || lower.includes('resumo') || lower.includes('saldo')) return DEMO_RESPONSES['quanto'];
  if (lower.includes('relatório') || lower.includes('completo') || lower.includes('análise')) return DEMO_RESPONSES['relatório'];
  return DEMO_RESPONSES['default'];
}

// Floating particle (same as real ChatFinanceiro)
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

// Glowing orb (same as real ChatFinanceiro)
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

export function DemoChatFinanceiro() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou seu assistente financeiro inteligente. Posso **registrar transações** e **analisar suas finanças**.

### 📝 Registrar
- "Gastei R$200 no mercado"
- "Recebi R$5000 de salário"
- 🎤 Grave um áudio com o que gastou
- 📸 Envie foto de recibo ou notificação

### 📊 Consultar
- "Quanto gastei esse mês?"
- "Me dá um relatório completo"`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: i * 0.5,
    duration: 8 + (i % 3) * 2 + 4,
    size: 4 + (i % 5) * 2,
    startX: (i * 17) % 100,
    startY: (i * 7) % 30 - 10,
  })), []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || isTyping) return;
    const userMsg: DemoMessage = { id: `u-${Date.now()}`, role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    const response = getResponse(input);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-background">
      {/* Dynamic Background (same as real ChatFinanceiro) */}
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
        {particles.map(p => <FloatingParticle key={p.id} {...p} />)}
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
      <div className="relative z-10 h-full flex flex-col max-w-3xl mx-auto w-full">
        {/* Header (same as real ChatFinanceiro) */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/20">
          <div className="flex items-center gap-2 md:gap-3">
            <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-border/50">
              <AvatarImage src={chatAssistant} alt="Assistant" />
              <AvatarFallback className="bg-secondary"><MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" /></AvatarFallback>
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

        {/* Messages (same styling as real ChatFinanceiro) */}
        <ScrollArea className="flex-1 px-4 md:px-6 py-3 md:py-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            <AnimatePresence mode="popLayout">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="h-8 w-8 border border-border/50 flex-shrink-0">
                      <AvatarImage src={chatAssistant} alt="Assistant" />
                      <AvatarFallback className="bg-secondary"><MessageCircle className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`rounded-2xl px-4 py-3 max-w-[80%] backdrop-blur-sm ${
                      msg.role === 'user'
                        ? 'bg-accent/60 text-foreground border border-border/30'
                        : 'bg-secondary/40 text-foreground border border-border/30'
                    }`}
                  >
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
                        {msg.content.replace(/<[^>]*>/g, '')}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <Avatar className="h-8 w-8 border border-border/50 flex-shrink-0">
                  <AvatarImage src={chatAssistant} alt="Assistant" />
                  <AvatarFallback className="bg-secondary"><MessageCircle className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <div className="bg-secondary/40 rounded-2xl px-4 py-3 border border-border/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <motion.div className="flex gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 bg-muted-foreground/50 rounded-full" animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                      ))}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input (same as real ChatFinanceiro) */}
        <div className="flex-shrink-0 p-3 md:p-4 border-t border-border/20 backdrop-blur-sm">
          <div className="flex gap-2 items-center max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/50">
              <Camera className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Digite sua mensagem..."
              className="h-9 md:h-10 text-sm bg-secondary/30 border-border/30"
            />
            <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/50">
              <Mic className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button size="icon" className="h-9 w-9 md:h-10 md:w-10 shrink-0" onClick={sendMessage} disabled={!input.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
