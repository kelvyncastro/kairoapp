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
  Shield,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useNavPosition, NavPosition } from '@/contexts/NavPositionContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  vertical?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  label,
  isActive, 
  onClick,
  vertical,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center transition-all duration-200",
        vertical ? "min-h-[56px] py-1.5 px-2 w-full" : "min-w-[56px] py-2 px-1.5"
      )}
      aria-label={label}
    >
      {isActive && (
        <div 
          className="absolute inset-1 rounded-lg blur-md opacity-25"
          style={{ 
            background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
          }}
        />
      )}
      
      <div className={cn(
        "relative z-10 transition-all duration-200",
        isActive 
          ? "text-primary scale-105" 
          : "text-muted-foreground"
      )}>
        <Icon className="h-6 w-6" />
      </div>

      <span className={cn(
        "mt-0.5 text-[9px] font-medium transition-colors duration-200 whitespace-nowrap leading-none",
        isActive ? "text-primary" : "text-muted-foreground/70"
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
  const { navPosition } = useNavPosition();
  
  const activeIndex = NAV_ITEMS.findIndex(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );
  
  const currentActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const isSettingsActive = location.pathname === '/configuracoes';
  const isAdminActive = location.pathname === '/admin';

  const isVertical = navPosition === 'left' || navPosition === 'right';

  // Scroll active item into view
  useEffect(() => {
    if (scrollRef.current && activeIndex >= 0) {
      const container = scrollRef.current;
      const activeItem = container.children[currentActiveIndex] as HTMLElement;
      if (activeItem) {
        if (isVertical) {
          const containerHeight = container.offsetHeight;
          const itemTop = activeItem.offsetTop;
          const itemHeight = activeItem.offsetHeight;
          const scrollTo = itemTop - containerHeight / 2 + itemHeight / 2;
          container.scrollTo({ top: scrollTo, behavior: 'smooth' });
        } else {
          const containerWidth = container.offsetWidth;
          const itemLeft = activeItem.offsetLeft;
          const itemWidth = activeItem.offsetWidth;
          const scrollTo = itemLeft - containerWidth / 2 + itemWidth / 2;
          container.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
      }
    }
  }, [currentActiveIndex, isVertical]);

  const glowLineStyle = isVertical
    ? { background: `linear-gradient(180deg, transparent, hsl(var(--primary) / 0.3), transparent)` }
    : { background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)` };

  // Position classes for the outer wrapper
  const wrapperClasses = cn(
    "fixed z-50",
    navPosition === 'bottom' && "bottom-0 left-0 right-0 safe-area-bottom",
    navPosition === 'top' && "top-14 left-0 right-0",
    navPosition === 'left' && "top-14 left-0 bottom-0",
    navPosition === 'right' && "top-14 right-0 bottom-0",
  );

  const containerClasses = cn(
    "relative border border-border/40 bg-card/85 backdrop-blur-xl shadow-lg overflow-hidden",
    !isVertical && "mx-1.5 rounded-2xl",
    navPosition === 'bottom' && "mb-1.5",
    navPosition === 'top' && "mt-1.5",
    isVertical && "my-1.5 mx-1 rounded-2xl h-[calc(100%-1rem)]",
  );

  const glowLineClasses = cn(
    "absolute",
    !isVertical && "top-0 left-0 right-0 h-px",
    navPosition === 'left' && "top-0 bottom-0 right-0 w-px",
    navPosition === 'right' && "top-0 bottom-0 left-0 w-px",
  );

  const separatorClasses = cn(
    "bg-border/30 flex-shrink-0",
    isVertical ? "h-px w-8 mx-auto" : "w-px h-7"
  );

  const ProfileButton = (
    <button
      onClick={() => navigate('/configuracoes')}
      className={cn(
        "relative flex flex-col items-center justify-center transition-all duration-200",
        isVertical ? "min-h-[44px] py-1 px-2 w-full" : "min-w-[44px] py-1.5 px-0.5"
      )}
      aria-label="Perfil"
    >
      <Avatar className="h-6 w-6 ring-[1.5px] ring-border/40">
        <AvatarImage src={profile?.avatar_url || undefined} />
        <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-semibold">
          {getInitials()}
        </AvatarFallback>
      </Avatar>
      <span className="mt-0.5 text-[9px] font-medium text-muted-foreground/70 whitespace-nowrap leading-none">
        Perfil
      </span>
    </button>
  );

  if (isVertical) {
    return (
      <div className={wrapperClasses}>
        <div className={containerClasses}>
          <div className={glowLineClasses} style={glowLineStyle} />
          
          <div className="flex flex-col h-full">
            <nav 
              ref={scrollRef}
              className="flex-1 flex flex-col items-center overflow-y-auto scrollbar-hide py-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {NAV_ITEMS.map((item, index) => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={index === currentActiveIndex}
                  onClick={() => navigate(item.path)}
                  vertical
                />
              ))}
            </nav>

            <div className={separatorClasses} />

            <div className="flex flex-col items-center py-1 flex-shrink-0">
              <NavItem
                icon={Settings}
                label="Config"
                isActive={isSettingsActive}
                onClick={() => navigate('/configuracoes')}
                vertical
              />
              {isAdmin && (
                <NavItem
                  icon={Shield}
                  label="Admin"
                  isActive={isAdminActive}
                  onClick={() => navigate('/admin')}
                  vertical
                />
              )}
              {ProfileButton}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <div className={containerClasses}>
        <div className={glowLineClasses} style={glowLineStyle} />
        
        <div className="flex items-center h-[56px]">
          <nav 
            ref={scrollRef}
            className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-hide px-1 gap-0"
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

          <div className={separatorClasses} />

          <div className="flex items-center gap-0 px-0.5 flex-shrink-0">
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
            {ProfileButton}
          </div>
        </div>
      </div>
    </div>
  );
}
