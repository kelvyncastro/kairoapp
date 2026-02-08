import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
 import { Loader2, Eye, EyeOff, Sparkles, Clock, Target, Flame } from "lucide-react";
import kairoLogo from "@/assets/kairo-logo.png";
 import { supabase } from "@/integrations/supabase/client";

// Floating particle component
function FloatingParticle({ delay, duration, size, startX, startY }: {
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-primary/30 to-primary/10"
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        bottom: `${startY}%`,
      }}
      initial={{ opacity: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.7, 0.5, 0],
        y: [-20, -200, -400, -600],
        scale: [0.5, 1.2, 0.9, 0.3],
        x: [0, Math.random() * 80 - 40, Math.random() * 100 - 50],
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
function GlowingOrb({ x, y, size, delay }: {
  x: number;
  y: number;
  size: number;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl bg-primary/20"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
      }}
      animate={{
        opacity: [0.15, 0.35, 0.15],
        scale: [1, 1.3, 1],
        x: [0, 20, 0],
        y: [0, -20, 0],
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

// Feature icon component
function FeatureIcon({ icon: Icon, label, delay }: {
  icon: typeof Clock;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center gap-2"
    >
      <motion.div
        className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <Icon className="h-5 w-5 text-primary" />
      </motion.div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </motion.div>
  );
}

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (forgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        if (error) {
          toast({
            title: "Erro ao enviar email",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Email enviado!",
            description: "Verifique sua caixa de entrada para redefinir sua senha.",
          });
          setForgotPassword(false);
        }
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Erro ao entrar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate particles
  const particles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: i * 0.4,
    duration: 10 + (i % 4) * 3,
    size: 4 + (i % 6) * 3,
    startX: (i * 13) % 100,
    startY: (i * 5) % 20 - 10,
  })), []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/30 to-background" />
        
        {/* Animated mesh gradient */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse 100% 80% at 20% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 80% 70%, hsl(var(--secondary) / 0.2) 0%, transparent 50%)",
              "radial-gradient(ellipse 80% 60% at 40% 70%, hsl(var(--primary) / 0.15) 0%, transparent 50%), radial-gradient(ellipse 100% 80% at 60% 30%, hsl(var(--secondary) / 0.2) 0%, transparent 50%)",
              "radial-gradient(ellipse 100% 80% at 20% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%), radial-gradient(ellipse 80% 60% at 80% 70%, hsl(var(--secondary) / 0.2) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Glowing orbs */}
        <GlowingOrb x={5} y={15} size={400} delay={0} />
        <GlowingOrb x={75} y={55} size={500} delay={2} />
        <GlowingOrb x={35} y={75} size={350} delay={4} />
        <GlowingOrb x={85} y={10} size={300} delay={6} />
        
        {/* Floating particles */}
        {particles.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
        
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.6)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo */}
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 mb-4 shadow-2xl shadow-primary/20 backdrop-blur-sm bg-background/50"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={kairoLogo}
                alt="Kairo App"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2"
            >
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Kairo App
              </h1>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
            </motion.div>
            <motion.p 
              className="text-sm text-muted-foreground mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Domine seu tempo. Conquiste seus objetivos.
            </motion.p>
          </motion.div>

          {/* Feature Icons */}
          <motion.div 
            className="flex justify-center gap-8 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <FeatureIcon icon={Clock} label="Tempo" delay={0.6} />
            <FeatureIcon icon={Target} label="Metas" delay={0.7} />
            <FeatureIcon icon={Flame} label="Foco" delay={0.8} />
          </motion.div>

          {/* Form */}
          <motion.div 
            className="backdrop-blur-xl bg-card/50 border border-border/50 rounded-2xl p-6 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <AnimatePresence mode="wait">
              <motion.form 
                key={forgotPassword ? "forgot" : isLogin ? "login" : "register"}
                onSubmit={handleSubmit} 
                className="space-y-4"
                initial={{ opacity: 0, x: forgotPassword ? 0 : isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: forgotPassword ? 0 : isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                {forgotPassword && (
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-semibold">Recuperar Senha</h2>
                    <p className="text-sm text-muted-foreground">Digite seu email para receber o link de recuperação</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <motion.div whileFocus={{ scale: 1.02 }}>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background/50 border-border/50 h-11 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                  </motion.div>
                </div>

                {!forgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-background/50 border-border/50 h-11 rounded-xl pr-10 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                )}

                {isLogin && !forgotPassword && (
                  <div className="text-right">
                    <motion.button
                      type="button"
                      onClick={() => setForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                      whileHover={{ scale: 1.02 }}
                    >
                      Esqueceu a senha?
                    </motion.button>
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="bg-background/50 border-border/50 h-11 rounded-xl pl-10 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/25 transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-5 w-5" />
                      </motion.div>
                    ) : forgotPassword ? (
                      "Enviar Email"
                    ) : isLogin ? (
                      "Entrar"
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            </AnimatePresence>

            <motion.div 
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                type="button"
                onClick={() => {
                  if (forgotPassword) {
                    setForgotPassword(false);
                  } else {
                    setIsLogin(!isLogin);
                  }
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                {forgotPassword
                  ? "Voltar ao login"
                  : isLogin
                  ? "Não tem conta? Criar agora"
                  : "Já tem conta? Entrar"}
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Quote */}
          <motion.p 
            className="text-center text-xs text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              "O tempo é o recurso mais valioso que você tem."
            </motion.span>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
