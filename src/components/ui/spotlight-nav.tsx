import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
  CalendarCheck,
  Target,
  MessageSquare,
  Wallet,
  FileText,
  ShoppingCart,
  Trophy,
  Flame,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  label,
  isActive, 
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center min-w-[56px] py-2 px-1 transition-all duration-300"
      aria-label={label}
    >
      {/* Active glow */}
      {isActive && (
        <div 
          className="absolute inset-0 rounded-xl blur-lg opacity-30"
          style={{ 
            background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
          }}
        />
      )}
      
      {/* Icon */}
      <div className={cn(
        "relative z-10 transition-all duration-300",
        isActive 
          ? "text-primary scale-110" 
          : "text-muted-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Label */}
      <span className={cn(
        "mt-0.5 text-[9px] font-medium transition-colors duration-300 whitespace-nowrap",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {label}
      </span>

      {/* Active indicator dot */}
      <div className={cn(
        "mt-0.5 h-1 w-1 rounded-full transition-all duration-300",
        isActive 
          ? "bg-primary scale-100" 
          : "bg-transparent scale-0"
      )} />
    </button>
  );
};

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dash', path: '/dashboard' },
  { icon: ListTodo, label: 'Tarefas', path: '/rotina' },
  { icon: CalendarCheck, label: 'Hábitos', path: '/habitos' },
  { icon: Target, label: 'Metas', path: '/metas' },
  { icon: MessageSquare, label: 'Chat', path: '/chat-financeiro' },
  { icon: Wallet, label: 'Finanças', path: '/financas' },
  { icon: FileText, label: 'Notas', path: '/notas' },
  { icon: ShoppingCart, label: 'Mercado', path: '/lista-mercado' },
  { icon: Trophy, label: 'Ranking', path: '/ranking' },
  { icon: Flame, label: 'Streak', path: '/consistencia' },
  { icon: Settings, label: 'Config', path: '/configuracoes' },
];

export function SpotlightNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const activeIndex = NAV_ITEMS.findIndex(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );
  
  const currentActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  // Scroll active item into view
  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const activeItem = container.children[currentActiveIndex] as HTMLElement;
      if (activeItem) {
        const containerWidth = container.offsetWidth;
        const itemLeft = activeItem.offsetLeft;
        const itemWidth = activeItem.offsetWidth;
        const scrollTo = itemLeft - containerWidth / 2 + itemWidth / 2;
        container.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    }
  }, [currentActiveIndex]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      {/* Glass background */}
      <div className="relative mx-2 mb-2 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden">
        {/* Top glow line */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)`,
          }}
        />
        
        <nav 
          ref={scrollRef}
          className="flex items-center overflow-x-auto scrollbar-hide px-1 py-1 gap-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {NAV_ITEMS.map((item, index) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              isActive={index === currentActiveIndex}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
