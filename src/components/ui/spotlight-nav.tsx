import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Target, 
  Flame,
  Calendar,
  MessageSquare,
  Wallet,
  Trophy,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  indicatorPosition: number;
  position: number;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon: Icon, 
  label,
  isActive, 
  onClick,
  indicatorPosition,
  position
}) => {
  const distance = Math.abs(indicatorPosition - position);
  const spotlightOpacity = isActive ? 1 : Math.max(0, 1 - distance * 0.7);

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300"
      aria-label={label}
    >
      {/* Spotlight glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-xl transition-opacity duration-300"
        style={{ 
          opacity: spotlightOpacity * 0.4,
          background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
        }}
      />
      
      {/* Icon */}
      <div className={cn(
        "relative z-10 transition-all duration-300",
        isActive 
          ? "text-primary scale-110" 
          : "text-muted-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Active indicator dot */}
      <div className={cn(
        "mt-1 h-1 w-1 rounded-full transition-all duration-300",
        isActive 
          ? "bg-primary scale-100" 
          : "bg-transparent scale-0"
      )} />
    </button>
  );
};

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dash', path: '/dashboard' },
  { icon: CheckSquare, label: 'Tarefas', path: '/rotina' },
  { icon: Flame, label: 'Hábitos', path: '/habitos' },
  { icon: Target, label: 'Metas', path: '/metas' },
  { icon: Calendar, label: 'Agenda', path: '/calendario' },
];

export function SpotlightNav() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const activeIndex = NAV_ITEMS.findIndex(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );
  
  const currentActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      {/* Glass background */}
      <div className="relative mx-2 mb-2 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg">
        {/* Top glow line */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)`,
            transform: `translateX(calc(-50% + ${(currentActiveIndex - 2) * 20}%))`,
          }}
        />
        
        <nav className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map((item, index) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              isActive={index === currentActiveIndex}
              onClick={() => navigate(item.path)}
              indicatorPosition={currentActiveIndex}
              position={index}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
