import { AppTheme } from "@/contexts/UserProfileContext";
import { cn } from "@/lib/utils";
import { Check, Moon, Sun, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ThemeOption {
  id: AppTheme;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  icon?: React.ElementType;
}

const THEME_OPTIONS: ThemeOption[] = [
  { 
    id: 'dark', 
    label: 'Escuro', 
    description: 'Tema escuro clássico',
    colors: {
      primary: '#1a1a1a',
      secondary: '#2a2a2a',
      accent: '#3a3a3a',
    },
    icon: Moon,
  },
  { 
    id: 'light', 
    label: 'Claro', 
    description: 'Tema claro minimalista',
    colors: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      accent: '#e5e5e5',
    },
    icon: Sun,
  },
  { 
    id: 'violet', 
    label: 'Violeta', 
    description: 'Roxo vibrante e elegante',
    colors: {
      primary: '#7C3AED',
      secondary: '#8B5CF6',
      accent: '#A78BFA',
    },
    icon: Sparkles,
  },
  { 
    id: 'pink', 
    label: 'Rosa', 
    description: 'Rosa moderno e energético',
    colors: {
      primary: '#EC4899',
      secondary: '#F472B6',
      accent: '#F9A8D4',
    },
    icon: Sparkles,
  },
  { 
    id: 'emerald', 
    label: 'Esmeralda', 
    description: 'Verde natural e calmo',
    colors: {
      primary: '#10B981',
      secondary: '#34D399',
      accent: '#6EE7B7',
    },
    icon: Sparkles,
  },
  { 
    id: 'blue', 
    label: 'Azul', 
    description: 'Azul profissional e confiável',
    colors: {
      primary: '#3B82F6',
      secondary: '#60A5FA',
      accent: '#93C5FD',
    },
    icon: Sparkles,
  },
  { 
    id: 'fuchsia', 
    label: 'Fúcsia', 
    description: 'Magenta ousado e criativo',
    colors: {
      primary: '#D946EF',
      secondary: '#E879F9',
      accent: '#F0ABFC',
    },
    icon: Sparkles,
  },
];

interface ThemeSelectorProps {
  selectedTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {THEME_OPTIONS.map((theme) => {
        const isSelected = selectedTheme === theme.id;
        const Icon = theme.icon;
        
        return (
          <motion.button
            key={theme.id}
            type="button"
            onClick={() => onThemeChange(theme.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left group overflow-hidden",
              isSelected 
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                : "border-border hover:border-muted-foreground/50 hover:bg-accent/50"
            )}
          >
            {/* Theme Preview */}
            <div className="w-full h-16 rounded-lg mb-3 overflow-hidden relative">
              {/* Gradient preview */}
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 50%, ${theme.colors.accent} 100%)`,
                }}
              />
              {/* Decorative elements */}
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                <div 
                  className="w-8 h-8 rounded-lg opacity-30"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <div 
                  className="w-12 h-6 rounded opacity-20"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
              </div>
              {/* Icon overlay */}
              {Icon && (
                <div className="absolute bottom-2 right-2">
                  <Icon className="h-4 w-4 text-white/70" />
                </div>
              )}
            </div>

            {/* Label and Description */}
            <div className="flex items-center gap-2 w-full">
              <span className={cn(
                "font-semibold text-sm",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {theme.label}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto"
                >
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                </motion.div>
              )}
            </div>
            <span className="text-xs text-muted-foreground mt-0.5">
              {theme.description}
            </span>

            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
