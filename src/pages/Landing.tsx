import { Link } from "react-router-dom";
import { Particles } from "@/components/ui/particles";
import { useEffect, useState } from "react";
import { DemoOverlay } from "@/components/demo/DemoOverlay";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  CheckCircle2, 
  Target, 
  Flame, 
  Wallet, 
  Calendar, 
  BarChart3,
  ArrowRight,
  Star,
  Shield,
  Clock,
  TrendingUp,
  CalendarCheck,
  ListTodo,
  FileText,
  ShoppingCart,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import kairoLogo from "@/assets/kairo-penguin.png";
import lucasAvatar from "@/assets/testimonials/lucas.jpg";
import amandaAvatar from "@/assets/testimonials/amanda.jpg";
import rafaelAvatar from "@/assets/testimonials/rafael.jpg";

import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

const orbitalTimelineData = [
  {
    id: 1,
    title: "Hábitos",
    content: "Construa rotinas saudáveis com rastreamento visual de hábitos. Acompanhe seu progresso semanal e mantenha sequências de consistência que vão transformar sua vida.",
    category: "Produtividade",
    icon: CalendarCheck,
    relatedIds: [2, 5],
  },
  {
    id: 2,
    title: "Tarefas",
    content: "Organize suas atividades com quadro Kanban, listas inteligentes, prioridades, pastas e cronômetro integrado. Nunca mais perca um prazo importante.",
    category: "Organização",
    icon: ListTodo,
    relatedIds: [1, 3],
  },
  {
    id: 3,
    title: "Calendário",
    content: "Visualize sua semana com blocos de horário personalizáveis, compromissos recorrentes e indicador de hora atual. Planeje cada minuto do seu dia.",
    category: "Planejamento",
    icon: Calendar,
    relatedIds: [2, 4],
  },
  {
    id: 4,
    title: "Notas",
    content: "Editor rico com pastas, busca rápida e organização flexível. Capture ideias, crie listas e mantenha tudo documentado em um só lugar.",
    category: "Conhecimento",
    icon: FileText,
    relatedIds: [3, 5],
  },
  {
    id: 5,
    title: "Finanças",
    content: "Controle receitas e despesas com gráficos detalhados, categorias personalizadas e assistente financeiro com IA para análises inteligentes.",
    category: "Finanças",
    icon: Wallet,
    relatedIds: [4, 6],
  },
  {
    id: 6,
    title: "Lista de Mercado",
    content: "Crie listas de compras organizadas por categoria automaticamente com IA. Marque itens conforme compra e mantenha o histórico de listas anteriores.",
    category: "Compras",
    icon: ShoppingCart,
    relatedIds: [5, 1],
  },
];

function ParticlesWithTheme() {
  const [color, setColor] = useState("#ffffff");
  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const primary = computedStyle.getPropertyValue("--primary").trim();
    if (primary) {
      const [h, s, l] = primary.split(" ").map(v => parseFloat(v));
      const hsl2rgb = (h: number, s: number, l: number) => {
        s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
        return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
      };
      const [r, g, b] = hsl2rgb(h, s, l);
      setColor(`#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`);
    }
  }, []);
  return (
    <Particles
      className="fixed inset-0 z-[2] pointer-events-auto"
      quantity={120}
      staticity={40}
      ease={60}
      size={0.5}
      color={color}
      vx={0}
      vy={-0.05}
    />
  );
}

function FloatingParticle({ delay, duration, size, startX, startY }: {
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      animate={{
        opacity: [0, 0.5, 0.3, 0],
        y: [0, -100, -200, -300],
        x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30],
        scale: [0.5, 1, 0.8, 0.3],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

function GlowingOrb({ x, y, size, delay, scrollY }: {
  x: number;
  y: number;
  size: number;
  delay: number;
  scrollY: any;
}) {
  const yOffset = useTransform(scrollY, [0, 3000], [0, y * 0.3]);
  
  return (
    <motion.div
      className="absolute rounded-full blur-3xl bg-primary/15"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        y: yOffset,
      }}
      animate={{
        opacity: [0.08, 0.2, 0.08],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

const features = [
  {
    icon: Target,
    title: "Metas Inteligentes",
    description: "Defina e acompanhe suas metas com progresso visual e histórico detalhado."
  },
  {
    icon: Flame,
    title: "Streaks de Consistência",
    description: "Mantenha-se motivado com sistema de sequências e conquistas diárias."
  },
  {
    icon: Wallet,
    title: "Controle Financeiro",
    description: "Organize suas finanças com categorias, gráficos e análise por IA."
  },
  {
    icon: Calendar,
    title: "Gestão de Tarefas",
    description: "Kanban, listas e timers para máxima produtividade no dia a dia."
  },
  {
    icon: BarChart3,
    title: "Hábitos Rastreáveis",
    description: "Crie e monitore hábitos com visualização de progresso semanal."
  },
  {
    icon: TrendingUp,
    title: "Dashboard Completo",
    description: "Visão geral de toda sua vida em um único painel personalizado."
  }
];

const testimonials = [
  {
    name: "Lucas M.",
    role: "Empreendedor",
    content: "O Kairo transformou minha produtividade. Consigo acompanhar tudo em um só lugar.",
    rating: 5,
    avatar: lucasAvatar,
  },
  {
    name: "Amanda S.",
    role: "Designer",
    content: "Interface limpa e intuitiva. Finalmente um app que realmente uso todos os dias.",
    rating: 5,
    avatar: amandaAvatar,
  },
  {
    name: "Rafael C.",
    role: "Desenvolvedor",
    content: "O sistema de consistência me mantém motivado. Já estou há 60 dias sem parar!",
    rating: 5,
    avatar: rafaelAvatar,
  }
];

const stats = [
  { value: "2K+", label: "Usuários Ativos" },
  { value: "500K+", label: "Tarefas Concluídas" },
  { value: "98%", label: "Satisfação" },
  { value: "4.9", label: "Avaliação" }
];

const particlesData = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  delay: i * 0.4,
  duration: 12 + (i % 5) * 3,
  size: 4 + (i % 7) * 3,
  startX: (i * 11) % 100,
  startY: (i * 7) % 25 - 10,
}));

export default function Landing() {
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 2000], [0, -200]);
  const gridY = useTransform(scrollY, [0, 2000], [0, 100]);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden relative">
      {/* Dynamic Animated Background */}
      <motion.div 
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 100% 80% at 20% 30%, hsl(var(--primary) / 0.08) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 80% 70%, hsl(var(--secondary) / 0.1) 0%, transparent 50%)",
              "radial-gradient(ellipse 80% 60% at 40% 70%, hsl(var(--primary) / 0.08) 0%, transparent 50%), radial-gradient(ellipse 100% 80% at 60% 30%, hsl(var(--secondary) / 0.1) 0%, transparent 50%)",
              "radial-gradient(ellipse 100% 80% at 20% 30%, hsl(var(--primary) / 0.08) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 80% 70%, hsl(var(--secondary) / 0.1) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <GlowingOrb x={5} y={10} size={500} delay={0} scrollY={scrollY} />
        <GlowingOrb x={70} y={40} size={600} delay={3} scrollY={scrollY} />
        <GlowingOrb x={30} y={70} size={450} delay={6} scrollY={scrollY} />
        <GlowingOrb x={85} y={20} size={350} delay={9} scrollY={scrollY} />
        {particlesData.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
        <motion.div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            y: gridY,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.5)_100%)]" />
      </motion.div>

      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/30 z-[1]" />
      <ParticlesWithTheme />

      {/* Navigation - Mobile Optimized */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img src={kairoLogo} alt="Kairo" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
              <span className="text-lg sm:text-xl font-bold">Kairo</span>
            </motion.div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Recursos</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Preços</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Depoimentos</a>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/auth" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 h-9 px-4 text-xs sm:text-sm">
                  Começar
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Mobile First */}
      <section className="relative z-10 pt-24 sm:pt-32 pb-12 sm:pb-20 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.h1 
              className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.1]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Domine seu tempo.
              <br />
              <motion.span 
                className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Conquiste seus objetivos.
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-sm sm:text-lg text-muted-foreground max-w-md sm:max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              O app completo para gerenciar tarefas, hábitos, metas e finanças. 
              Tudo em um único lugar.
            </motion.p>
            
            <motion.div 
              className="flex flex-col gap-3 max-w-xs mx-auto sm:flex-row sm:max-w-none sm:justify-center sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <a href="#pricing">
                <Button className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-sm font-semibold shadow-xl shadow-foreground/10">
                  Ver Planos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Button variant="outline" className="w-full sm:w-auto h-12 px-8 text-sm backdrop-blur-sm bg-background/50" onClick={() => setDemoOpen(true)}>
                Ver Demonstração
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Orbital Timeline Section */}
      <section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8"
          >
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">Tudo conectado</h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
              Cada módulo do Kairo se conecta para criar um ecossistema completo
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <RadialOrbitalTimeline timelineData={orbitalTimelineData} />
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Mobile Grid */}
      <section className="relative z-10 py-10 sm:py-16 border-y border-border/50 bg-secondary/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-2xl sm:text-4xl font-bold mb-0.5">{stat.value}</div>
                <div className="text-muted-foreground text-xs sm:text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section id="features" className="relative z-10 py-16 sm:py-24 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">Tudo que você precisa</h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
              Ferramentas poderosas para organizar sua vida
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="flex items-start gap-3.5 p-4 sm:p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-semibold mb-0.5 sm:mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Mobile Stack */}
      <section className="relative z-10 py-16 sm:py-24 px-5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-16 items-start lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-4xl font-bold mb-5 sm:mb-6">Por que escolher o Kairo?</h2>
              <div className="space-y-4 sm:space-y-6">
                {[
                  { icon: CheckCircle2, title: "Design Minimalista", desc: "Interface limpa que não distrai do que importa." },
                  { icon: Shield, title: "Dados Seguros", desc: "Seus dados são criptografados e protegidos." },
                  { icon: Clock, title: "Sincronização Instantânea", desc: "Alterações em tempo real em todos os dispositivos." },
                ].map((item, index) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-0.5">{item.title}</h3>
                      <p className="text-xs sm:text-base text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { value: "9+", label: "Módulos integrados", icon: "🧩" },
                  { value: "24/7", label: "Acesso em qualquer lugar", icon: "🌐" },
                  { value: "IA", label: "Assistente financeiro", icon: "🤖" },
                  { value: "∞", label: "Metas ilimitadas", icon: "🚀" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="p-4 sm:p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-center"
                  >
                    <span className="text-2xl sm:text-3xl mb-2 sm:mb-3 block">{item.icon}</span>
                    <div className="text-xl sm:text-2xl font-bold mb-0.5">{item.value}</div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Mobile Scroll */}
      <section id="testimonials" className="relative z-10 py-16 sm:py-24 px-5 sm:px-6 lg:px-8 bg-secondary/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">O que nossos usuários dizem</h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
              Milhares de pessoas já transformaram sua produtividade
            </p>
          </motion.div>

          {/* Mobile: horizontal scroll, Desktop: grid */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="min-w-[280px] snap-center p-5 sm:p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm md:min-w-0"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-foreground mb-3">"{testimonial.content}"</p>
                <div className="flex items-center gap-2.5">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-xs sm:text-sm">{testimonial.name}</div>
                    <div className="text-[10px] sm:text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Mobile Stack */}
      <section id="pricing" className="relative z-10 py-16 sm:py-24 px-5 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">Escolha seu plano</h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
              Acesso total a todas as funcionalidades
            </p>
          </motion.div>

          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-8 max-w-4xl mx-auto">
            {/* Annual Plan - Show first on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative p-6 sm:p-8 rounded-2xl border border-primary/30 bg-background/60 backdrop-blur-xl overflow-hidden order-first"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10" />
              <motion.div 
                className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Mais Popular
              </motion.div>
              <div className="relative z-10">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Anual</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl sm:text-4xl font-bold">R$197,90</span>
                  <span className="text-muted-foreground text-sm">/ano</span>
                </div>
                <p className="text-muted-foreground line-through text-xs mb-1">R$397,90/ano</p>
                <p className="text-success text-xs sm:text-sm font-medium mb-3">Economize R$160,90</p>
                <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Apenas R$16,49/mês — mais de 5 meses grátis!</p>
                <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-8">
                  {["Tudo do plano mensal", "45% de desconto", "Prioridade em novos recursos", "Suporte VIP"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span className="text-xs sm:text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="https://pay.kirvano.com/44bf7ce3-3b3b-442b-9983-9f612db21135" target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold">
                    Começar Agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative p-6 sm:p-8 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl overflow-hidden order-last sm:order-first"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
              <div className="relative z-10">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Mensal</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl sm:text-4xl font-bold">R$29,90</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <p className="text-muted-foreground line-through text-xs mb-3">R$39,90/mês</p>
                <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Pague mês a mês, cancele quando quiser</p>
                <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-8">
                  {["Acesso total", "Sincronização em tempo real", "Suporte prioritário", "Atualizações contínuas"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span className="text-xs sm:text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <a href="https://pay.kirvano.com/cb78dfd0-c8e0-40bb-a16b-951ba74a0a02" target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full h-12 backdrop-blur-sm bg-background/50 text-sm">
                    Começar Agora
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 sm:py-24 px-5 sm:px-6 lg:px-8 bg-secondary/10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center p-6 sm:p-12 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl relative overflow-hidden"
          >
            <motion.div
              className="absolute -inset-20 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-3xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative z-10">
              <h2 className="text-xl sm:text-4xl font-bold mb-3 sm:mb-4">
                Pronto para transformar sua produtividade?
              </h2>
              <p className="text-muted-foreground text-sm sm:text-lg mb-5 sm:mb-8 max-w-xl mx-auto">
                Junte-se a milhares de usuários conquistando seus objetivos com o Kairo.
              </p>
              <a href="#pricing">
                <Button className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-sm font-semibold shadow-xl shadow-foreground/10">
                  Ver Planos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Mobile Stack */}
      <footer className="relative z-10 py-8 sm:py-12 px-5 sm:px-6 lg:px-8 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-6">
            <div className="flex items-center gap-2">
              <img src={kairoLogo} alt="Kairo" className="h-7 w-7 rounded-lg" />
              <span className="text-lg font-bold">Kairo</span>
            </div>
            <div className="flex items-center gap-5">
              <Link to="/privacidade" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors">
                Privacidade
              </Link>
              <Link to="/termos" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors">
                Termos
              </Link>
              <a href="#" className="text-muted-foreground hover:text-foreground text-xs sm:text-sm transition-colors">
                Contato
              </a>
            </div>
            <p className="text-muted-foreground text-[10px] sm:text-sm">
              © {new Date().getFullYear()} Kairo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      <DemoOverlay open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
