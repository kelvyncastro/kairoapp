import React, { useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
  Shield,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      className="relative flex flex-col items-center justify-center min-w-[44px] py-1.5 px-0.5 transition-all duration-200"
      aria-label={label}
    >
      {/* Active glow */}
      {isActive && (
        <div 
          className="absolute inset-1 rounded-lg blur-md opacity-25"
          style={{ 
            background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
          }}
        />
      )}
      
      {/* Icon */}
      <div className={cn(
        "relative z-10 transition-all duration-200",
        isActive 
          ? "text-primary scale-105" 
          : "text-muted-foreground/70"
      )}>
        <Icon className="h-[18px] w-[18px]" />
      </div>

      {/* Label */}
      <span className={cn(
        "mt-0.5 text-[8px] font-medium transition-colors duration-200 whitespace-nowrap leading-none",
        isActive ? "text-primary" : "text-muted-foreground/60"
      )}>
        {label}
      </span>
    </button>
  );
};

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dash', path: '/dashboard' },
  { icon: ListTodo, label: 'Tarefas', path: '/rotina' },
  { icon: CalendarCheck, label: 'Hábitos', path: '/habitos' },
  { icon: Target, label: 'Metas', path: '/metas' },
  { icon: CalendarClock, label: 'Calendário', path: '/calendario' },
  { icon: MessageSquare, label: 'Chat', path: '/chat-financeiro' },
  { icon: Wallet, label: 'Finanças', path: '/financas' },
  { icon: FileText, label: 'Notas', path: '/notas' },
  { icon: ShoppingCart, label: 'Mercado', path: '/lista-mercado' },
  { icon: Trophy, label: 'Ranking', path: '/ranking' },
  { icon: Flame, label: 'Streak', path: '/consistencia' },
];

export function SpotlightNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useIsAdmin();
  const { profile, getInitials } = useUserProfile();
  
  const allPaths = [...NAV_ITEMS.map(i => i.path), '/configuracoes', '/admin'];
  const activeIndex = NAV_ITEMS.findIndex(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );
  
  const currentActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const isSettingsActive = location.pathname === '/configuracoes';
  const isAdminActive = location.pathname === '/admin';

  // Scroll active item into view
  useEffect(() => {
    if (scrollRef.current && activeIndex >= 0) {
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
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Glass background */}
      <div className="relative mx-2 mb-2 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg overflow-hidden">
        {/* Top glow line */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)`,
          }}
        />
        
        <div className="flex items-center">
          {/* Main nav items - scrollable */}
          <nav 
            ref={scrollRef}
            className="flex-1 flex items-center overflow-x-auto scrollbar-hide px-1 py-1 gap-0.5"
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

          {/* Separator */}
          <div className="w-px h-8 bg-border/50 flex-shrink-0" />

          {/* Settings + Admin + Profile */}
          <div className="flex items-center gap-0.5 px-1 flex-shrink-0">
            <NavItem
              icon={Settings}
              label="Config"
              isActive={isSettingsActive}
              onClick={() => navigate('/configuracoes')}
            />
            {isAdmin && (
              <NavItem
                icon={Shield}
                label="Admin"
                isActive={isAdminActive}
                onClick={() => navigate('/admin')}
              />
            )}
            
            {/* Profile photo */}
            <button
              onClick={() => navigate('/configuracoes')}
              className="relative flex flex-col items-center justify-center min-w-[56px] py-2 px-1 transition-all duration-300"
              aria-label="Perfil"
            >
              <Avatar className="h-6 w-6 ring-2 ring-border/50">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="mt-0.5 text-[9px] font-medium text-muted-foreground whitespace-nowrap">
                Perfil
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
