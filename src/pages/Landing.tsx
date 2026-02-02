import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Target, 
  Flame, 
  Wallet, 
  Calendar, 
  BarChart3,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Clock,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import kairoLogo from "@/assets/kairo-logo.png";
import mockupMacbook from "@/assets/mockup-macbook.jpg";
import mockupIphone from "@/assets/mockup-iphone.jpg";
import mockupIpad from "@/assets/mockup-ipad.jpg";

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
  { value: "10K+", label: "Usuários Ativos" },
  { value: "500K+", label: "Tarefas Concluídas" },
  { value: "98%", label: "Satisfação" },
  { value: "4.9", label: "Avaliação" }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={kairoLogo} alt="Kairo" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold">Kairo</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Recursos
              </a>
              <a href="#mockups" className="text-muted-foreground hover:text-foreground transition-colors">
                Demonstração
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Depoimentos
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-foreground text-background hover:bg-foreground/90">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-6">
              <Zap className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">Novo: Chat Financeiro com IA</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              Domine seu tempo.
              <br />
              <span className="bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent">
                Conquiste seus objetivos.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              O app completo para gerenciar tarefas, hábitos, metas e finanças. 
              Tudo em um único lugar, com design minimalista e poderoso.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#mockups">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  Ver Demonstração
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Hero Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl shadow-foreground/5">
              <img 
                src={mockupMacbook} 
                alt="Kairo Dashboard no MacBook" 
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-secondary/20">
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
                <div className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
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
                className="p-6 rounded-xl border border-border bg-card hover:border-muted-foreground/30 transition-colors group"
              >
                <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mockups Section */}
      <section id="mockups" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Disponível em todos os dispositivos
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Acesse suas informações de qualquer lugar, a qualquer momento
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* iPhone */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-foreground/5 to-transparent rounded-3xl blur-xl" />
                <img 
                  src={mockupIphone} 
                  alt="Kairo no iPhone" 
                  className="relative rounded-2xl shadow-2xl max-h-[500px] w-auto"
                />
              </div>
            </motion.div>

            {/* iPad */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-foreground/5 to-transparent rounded-3xl blur-xl" />
                <img 
                  src={mockupIpad} 
                  alt="Kairo no iPad" 
                  className="relative rounded-2xl shadow-2xl w-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
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
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Design Minimalista</h3>
                    <p className="text-muted-foreground">Interface limpa que não distrai do que importa: suas metas.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Dados Seguros</h3>
                    <p className="text-muted-foreground">Seus dados são criptografados e protegidos em nuvem segura.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Sincronização Instantânea</h3>
                    <p className="text-muted-foreground">Alterações aparecem em tempo real em todos os dispositivos.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">IA Integrada</h3>
                    <p className="text-muted-foreground">Chat financeiro com inteligência artificial para análises.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-foreground/5 to-transparent rounded-3xl blur-xl" />
              <img 
                src={mockupMacbook} 
                alt="Kairo Dashboard" 
                className="relative rounded-xl shadow-2xl border border-border"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/20">
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
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
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

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center p-8 sm:p-12 rounded-2xl border border-border bg-card"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pronto para transformar sua produtividade?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Junte-se a milhares de usuários que já estão conquistando seus objetivos com o Kairo.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-base">
                Criar Conta Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Sem cartão de crédito. Comece em segundos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={kairoLogo} alt="Kairo" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold">Kairo</span>
            </div>
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
