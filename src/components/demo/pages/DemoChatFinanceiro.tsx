import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Sparkles, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import chatAssistant from '@/assets/chat-assistant.png';

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

### 📊 Consultar  
- "Quanto gastei esse mês?"
- "Me dá um relatório completo"

*Experimente digitar uma dessas opções!*`,
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

export function DemoChatFinanceiro() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou seu assistente financeiro inteligente. Posso **registrar transações** e **analisar suas finanças**.

### 📝 Registrar
- "Gastei R$200 no mercado"
- "Recebi R$5000 de salário"

### 📊 Consultar
- "Quanto gastei esse mês?"
- "Me dá um relatório completo"

*Experimente digitar uma dessas opções!*`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/20 flex-shrink-0">
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage src={chatAssistant} alt="Assistant" />
            <AvatarFallback className="bg-secondary"><MessageCircle className="h-4 w-4" /></AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm">Chat Financeiro</h2>
              <Sparkles className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground">Texto, áudio ou foto de recibo</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
          <div className="space-y-3 pb-4">
            <AnimatePresence mode="popLayout">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <Avatar className="h-7 w-7 border border-border/50 flex-shrink-0">
                      <AvatarImage src={chatAssistant} />
                      <AvatarFallback className="bg-secondary"><MessageCircle className="h-3.5 w-3.5" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] text-sm leading-relaxed backdrop-blur-sm ${
                    msg.role === 'user'
                      ? 'bg-accent/60 border border-border/30'
                      : 'bg-secondary/40 border border-border/30'
                  }`}>
                    {msg.content.split('\n').map((line, i) => {
                      if (line.startsWith('### ')) return <h3 key={i} className="text-xs font-semibold mt-2 mb-1">{line.replace('### ', '')}</h3>;
                      if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-semibold mt-2 mb-1">{line.replace('## ', '')}</h2>;
                      if (line.startsWith('- ')) return <p key={i} className="text-xs text-foreground/90 pl-2">• {line.replace('- ', '')}</p>;
                      if (line.startsWith('| ')) return null; // skip table formatting
                      if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-xs text-primary italic mt-1">{line.replace(/\*/g, '')}</p>;
                      if (line.match(/^\d+\./)) return <p key={i} className="text-xs text-foreground/90 pl-2">{line}</p>;
                      if (line.trim() === '') return <div key={i} className="h-1" />;
                      return <p key={i} className="text-xs text-foreground/90 mb-0.5">{line.replace(/\*\*/g, '').replace(/\*/g, '')}</p>;
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                <Avatar className="h-7 w-7 border border-border/50">
                  <AvatarImage src={chatAssistant} />
                  <AvatarFallback className="bg-secondary"><MessageCircle className="h-3.5 w-3.5" /></AvatarFallback>
                </Avatar>
                <div className="bg-secondary/40 rounded-2xl px-3.5 py-2.5 border border-border/30">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex-shrink-0 p-3 border-t border-border/20">
          <div className="flex gap-2 items-center max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground">
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Digite sua mensagem..."
              className="h-9 text-sm bg-secondary/30 border-border/30"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendMessage} disabled={!input.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
