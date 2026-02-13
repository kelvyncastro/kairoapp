import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import kairoLogo from "@/assets/kairo-logo.png";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("kairo_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // 3D card tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

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

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("kairo_remember_email", email);
      } else {
        localStorage.removeItem("kairo_remember_email");
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
        {[
          { x: 5, y: 15, size: 400, delay: 0 },
          { x: 75, y: 55, size: 500, delay: 2 },
          { x: 35, y: 75, size: 350, delay: 4 },
          { x: 85, y: 10, size: 300, delay: 6 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl bg-primary/20"
            style={{ width: orb.size, height: orb.size, left: `${orb.x}%`, top: `${orb.y}%` }}
            animate={{
              opacity: [0.15, 0.35, 0.15],
              scale: [1, 1.3, 1],
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 8, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* Floating particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-br from-primary/30 to-primary/10"
            style={{ width: p.size, height: p.size, left: `${p.startX}%`, bottom: `${p.startY}%` }}
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.7, 0.5, 0],
              y: [-20, -200, -400, -600],
              scale: [0.5, 1.2, 0.9, 0.3],
              x: [0, Math.random() * 80 - 40, Math.random() * 100 - 50],
            }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.6)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm"
          style={{ perspective: "1200px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Logo */}
          <motion.div
            className="text-center mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden border border-primary/20 mb-4 shadow-2xl shadow-primary/20 backdrop-blur-sm bg-background/50"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img src={kairoLogo} alt="Kairo App" className="w-full h-full object-cover" />
            </motion.div>
            <motion.h1
              className="text-2xl font-bold tracking-tight text-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Bem-vindo de volta
            </motion.h1>
            <motion.p
              className="text-sm text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Entre para continuar no Kairo
            </motion.p>
          </motion.div>

          {/* 3D Tilting Card */}
          <motion.div
            className="relative"
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Traveling light beam border */}
            <div className="absolute -inset-px rounded-2xl overflow-hidden pointer-events-none">
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                {/* Top beam */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent blur-[1px]" />
                {/* Right beam */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-24 w-px bg-gradient-to-b from-transparent via-primary/60 to-transparent blur-[1px]" />
                {/* Bottom beam */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent blur-[1px]" />
                {/* Left beam */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-px bg-gradient-to-b from-transparent via-primary/60 to-transparent blur-[1px]" />
              </motion.div>
            </div>

            {/* Card border glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 via-border/30 to-primary/10 pointer-events-none" />

            {/* Glass card */}
            <div className="relative rounded-2xl backdrop-blur-xl bg-card/60 border border-border/30 p-6 shadow-2xl">
              {/* Inner pattern */}
              <div
                className="absolute inset-0 rounded-2xl opacity-[0.02] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              <AnimatePresence mode="wait">
                <motion.form
                  key={forgotPassword ? "forgot" : "login"}
                  onSubmit={handleSubmit}
                  className="relative space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {forgotPassword && (
                    <div className="text-center mb-4">
                      <h2 className="text-lg font-semibold text-foreground">Recuperar Senha</h2>
                      <p className="text-sm text-muted-foreground">Digite seu email para receber o link</p>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        required
                        className="bg-background/30 border-border/40 h-11 rounded-xl pl-10 focus:border-primary/50 focus:bg-background/50 transition-all duration-300"
                      />
                      {focusedInput === "email" && (
                        <motion.div
                          className="absolute inset-0 rounded-xl border border-primary/30 pointer-events-none"
                          layoutId="input-focus"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  {!forgotPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedInput("password")}
                          onBlur={() => setFocusedInput(null)}
                          required
                          minLength={6}
                          className="bg-background/30 border-border/40 h-11 rounded-xl pl-10 pr-10 focus:border-primary/50 focus:bg-background/50 transition-all duration-300"
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </motion.button>
                        {focusedInput === "password" && (
                          <motion.div
                            className="absolute inset-0 rounded-xl border border-primary/30 pointer-events-none"
                            layoutId="input-focus"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Remember me & Forgot password */}
                  {!forgotPassword && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                            className="appearance-none h-4 w-4 rounded border border-border/50 bg-background/30 checked:bg-primary checked:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all duration-200 cursor-pointer"
                          />
                          {rememberMe && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 w-4 h-4 text-primary-foreground pointer-events-none"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <motion.path
                                d="M5 13l4 4L19 7"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            </motion.svg>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          Lembrar-me
                        </span>
                      </label>

                      <motion.button
                        type="button"
                        onClick={() => setForgotPassword(true)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                        whileHover={{ scale: 1.02 }}
                      >
                        Esqueceu a senha?
                      </motion.button>
                    </div>
                  )}

                  {/* Submit button */}
                  <div className="relative pt-1">
                    <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="relative w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/25 transition-all overflow-hidden group"
                        disabled={loading}
                      >
                        {/* Button background animation */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <span className="relative flex items-center gap-2">
                          {loading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="h-5 w-5" />
                            </motion.div>
                          ) : forgotPassword ? (
                            "Enviar Email"
                          ) : (
                            <>
                              Entrar
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </span>
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              </AnimatePresence>

              {forgotPassword && (
                <motion.div
                  className="mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    type="button"
                    onClick={() => setForgotPassword(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    Voltar ao login
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Quote */}
          <motion.p
            className="text-center text-xs text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }}>
              "O tempo é o recurso mais valioso que você tem."
            </motion.span>
          </motion.p>
        </div>
      </div>
    </div>
  );
}
