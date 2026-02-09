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
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import kairoLogo from "@/assets/kairo-logo.png";
import mockupIpad from "@/assets/mockup-ipad.png";

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

// Floating particle component with scroll-based movement
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

// Glowing orb component
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
    rating: 5
  },
  {
    name: "Amanda S.",
    role: "Designer",
    content: "Interface limpa e intuitiva. Finalmente um app que realmente uso todos os dias.",
    rating: 5
  },
  {
    name: "Rafael C.",
    role: "Desenvolvedor",
    content: "O sistema de consistência me mantém motivado. Já estou há 60 dias sem parar!",
    rating: 5
  }
];

const stats = [
  { value: "2K+", label: "Usuários Ativos" },
  { value: "500K+", label: "Tarefas Concluídas" },
  { value: "98%", label: "Satisfação" },
  { value: "4.9", label: "Avaliação" }
];

// Generate particles array outside component to avoid recreation
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
  
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* Dynamic Animated Background */}
      <motion.div 
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ y: backgroundY }}
      >
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        
        {/* Animated mesh gradient */}
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
        
        {/* Glowing orbs with parallax */}
        <GlowingOrb x={5} y={10} size={500} delay={0} scrollY={scrollY} />
        <GlowingOrb x={70} y={40} size={600} delay={3} scrollY={scrollY} />
        <GlowingOrb x={30} y={70} size={450} delay={6} scrollY={scrollY} />
        <GlowingOrb x={85} y={20} size={350} delay={9} scrollY={scrollY} />
        
        {/* Floating particles */}
        {particlesData.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
        
        {/* Subtle grid overlay with parallax */}
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
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.5)_100%)]" />
      </motion.div>

      {/* Secondary fixed overlay for depth */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/30 z-[1]" />

      {/* Interactive Particles */}
      <ParticlesWithTheme />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img src={kairoLogo} alt="Kairo" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold">Kairo</span>
            </motion.div>
            <motion.div 
              className="hidden md:flex items-center gap-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Preços
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Depoimentos
              </a>
            </motion.div>
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link to="/auth">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-foreground text-background hover:bg-foreground/90">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Domine seu tempo.
              <br />
              <motion.span 
                className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Conquiste seus objetivos.
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              O app completo para gerenciar tarefas, hábitos, metas e finanças. 
              Tudo em um único lugar, com design minimalista e poderoso.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <a href="#pricing">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base shadow-xl shadow-foreground/10">
                    Ver Planos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </a>
              <a href="#mockups">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base backdrop-blur-sm bg-background/50">
                    Ver Demonstração
                  </Button>
                </motion.div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 border-y border-border/50 bg-secondary/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div 
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas poderosas para organizar sua vida pessoal e profissional
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all group"
              >
                <motion.div 
                  className="h-12 w-12 rounded-lg bg-secondary/80 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: 5 }}
                >
                  <feature.icon className="h-6 w-6" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Benefits Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Por que escolher o Kairo?
              </h2>
              <div className="space-y-6">
                {[
                  { icon: CheckCircle2, title: "Design Minimalista", desc: "Interface limpa que não distrai do que importa: suas metas." },
                  { icon: Shield, title: "Dados Seguros", desc: "Seus dados são criptografados e protegidos em nuvem segura." },
                  { icon: Clock, title: "Sincronização Instantânea", desc: "Alterações aparecem em tempo real em todos os dispositivos." },
                ].map((item, index) => (
                  <motion.div 
                    key={item.title}
                    className="flex gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <item.icon className="h-5 w-5 text-success" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="relative lg:scale-125 lg:translate-x-4"
            >
              <img 
                src={mockupIpad} 
                alt="Kairo no iPad" 
                className="relative rounded-xl w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-secondary/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Milhares de pessoas já transformaram sua produtividade com o Kairo
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                    >
                      <Star className="h-4 w-4 fill-warning text-warning" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Escolha seu plano
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Acesso total a todas as funcionalidades do Kairo
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative p-8 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
              <div className="relative z-10">
                <div className="text-sm font-medium text-muted-foreground mb-2">Mensal</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold">R$29,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-muted-foreground line-through text-sm mb-4">R$39,90/mês</p>
                <p className="text-muted-foreground mb-6">Pague mês a mês, cancele quando quiser</p>
                <ul className="space-y-3 mb-8">
                  {["Acesso total a todas as funcionalidades", "Sincronização em tempo real", "Suporte prioritário", "Atualizações contínuas"].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <span className="text-sm">{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <a href="https://pay.kirvano.com/cb78dfd0-c8e0-40bb-a16b-951ba74a0a02" target="_blank" rel="noopener noreferrer" className="block">
                   <Button variant="outline" className="w-full h-12 backdrop-blur-sm bg-background/50">
                     Começar Agora
                   </Button>
                 </a>
              </div>
            </motion.div>

            {/* Annual Plan */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative p-8 rounded-2xl border border-primary/30 bg-background/60 backdrop-blur-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10" />
              <motion.div 
                className="absolute -top-1 -right-1 bg-foreground text-background text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-xl"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Mais Popular
              </motion.div>
              <div className="relative z-10">
                <div className="text-sm font-medium text-muted-foreground mb-2">Anual</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold">R$197,90</span>
                  <span className="text-muted-foreground">/ano</span>
                </div>
                <p className="text-muted-foreground line-through text-sm mb-2">R$397,90/ano</p>
                <p className="text-success text-sm font-medium mb-4">Economize R$160,90 comparado ao plano mensal</p>
                <p className="text-muted-foreground mb-6">Equivale a apenas R$16,49/mês — mais de 5 meses grátis!</p>
                <ul className="space-y-3 mb-8">
                  {["Tudo do plano mensal", "45% de desconto", "Prioridade em novos recursos", "Suporte VIP"].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <span className="text-sm">{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <a href="https://pay.kirvano.com/44bf7ce3-3b3b-442b-9983-9f612db21135" target="_blank" rel="noopener noreferrer" className="block">
                   <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                     <Button className="w-full h-12 bg-foreground text-background hover:bg-foreground/90">
                       Começar Agora
                       <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                   </motion.div>
                 </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-secondary/10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center p-8 sm:p-12 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl relative overflow-hidden"
          >
            {/* CTA background glow */}
            <motion.div
              className="absolute -inset-20 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-3xl"
              animate={{
                rotate: [0, 360],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Pronto para transformar sua produtividade?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Junte-se a milhares de usuários que já estão conquistando seus objetivos com o Kairo.
              </p>
              <a href="#pricing">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base shadow-xl shadow-foreground/10">
                    Ver Planos
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <img src={kairoLogo} alt="Kairo" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold">Kairo</span>
            </motion.div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Kairo. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Termos
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
