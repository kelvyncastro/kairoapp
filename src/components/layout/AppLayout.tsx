import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  LayoutDashboard,
  ListTodo,
  CalendarCheck,
  Target,
  Flame,
  Wallet,
  Settings,
  LogOut,
  CalendarClock,
  MessageSquare,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Trophy,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import kairoLogo from "@/assets/kairo-logo.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SoundToggleButton } from "@/components/layout/SoundToggleButton";
import { SpotlightNav } from "@/components/ui/spotlight-nav";

const mainNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/rotina", label: "Tarefas", icon: ListTodo },
  { path: "/calendario", label: "Calendário", icon: CalendarClock },
  { path: "/habitos", label: "Hábitos", icon: CalendarCheck },
  { path: "/metas", label: "Metas", icon: Target },
  { path: "/consistencia", label: "Consistência", icon: Flame },
  { path: "/ranking", label: "Ranking", icon: Trophy },
  { path: "/chat-financeiro", label: "Chat Financeiro", icon: MessageSquare },
  { path: "/financas", label: "Finanças", icon: Wallet },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile, getInitials, getDisplayName } = useUserProfile();
  const { isAdmin } = useIsAdmin();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
  };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn("flex-1 space-y-1.5 p-3 overflow-y-auto", mobile && "pt-4")}>
      {/* Section label */}
      <AnimatePresence mode="wait">
        {(mobile || !collapsed) && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="px-3 mb-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]"
          >
            Menu principal
          </motion.p>
        )}
      </AnimatePresence>

      {mainNavItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        return (
          <Tooltip key={item.path}>
            <TooltipTrigger asChild>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 relative overflow-hidden group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  mobile && "py-3",
                  !mobile && collapsed && "justify-center px-2"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <item.icon className={cn(
                    "h-4 w-4 shrink-0 transition-all relative z-10",
                    isActive && "drop-shadow-sm"
                  )} />
                </motion.div>
                <AnimatePresence mode="wait">
                  {(mobile || !collapsed) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        "font-semibold whitespace-nowrap overflow-hidden relative z-10",
                        isActive && "text-primary-foreground"
                      )}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </TooltipTrigger>
            {!mobile && collapsed && (
              <TooltipContent side="right" sideOffset={8} className="font-medium bg-popover border shadow-lg">
                <p>{item.label}</p>
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}

      {/* Admin Link - Only for Admins */}
      {isAdmin && (
        <div className="pt-4">
          <AnimatePresence mode="wait">
            {(mobile || !collapsed) && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="px-3 mb-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]"
              >
                Administração
              </motion.p>
            )}
          </AnimatePresence>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 relative overflow-hidden group",
                  location.pathname === '/admin'
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  mobile && "py-3",
                  !mobile && collapsed && "justify-center px-2"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Shield className={cn(
                    "h-4 w-4 shrink-0 transition-all relative z-10",
                    location.pathname === '/admin' && "drop-shadow-sm"
                  )} />
                </motion.div>
                <AnimatePresence mode="wait">
                  {(mobile || !collapsed) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        "font-semibold whitespace-nowrap overflow-hidden relative z-10",
                        location.pathname === '/admin' && "text-primary-foreground"
                      )}
                    >
                      Painel Admin
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </TooltipTrigger>
            {!mobile && collapsed && (
              <TooltipContent side="right" sideOffset={8} className="font-medium bg-popover border shadow-lg">
                <p>Painel Admin</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      )}

    </nav>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <motion.aside
          className="fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 border-r border-sidebar-border hidden md:flex md:flex-col overflow-hidden"
          animate={{ width: collapsed ? 64 : 240 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {/* Logo */}
          <div className={cn(
            "flex h-14 items-center border-b border-sidebar-border transition-all duration-300",
            collapsed ? "justify-center px-2" : "px-4"
          )}>
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <motion.div 
                className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ring-2 ring-sidebar-border group-hover:ring-primary/50 transition-all shadow-sm"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <img
                  src={kairoLogo}
                  alt="Kairo"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-xl font-bold tracking-wide text-foreground whitespace-nowrap overflow-hidden"
                  >
                    Kairo
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Navigation */}
          <NavContent />

          {/* Collapse Toggle */}
          <div className="p-3 border-t border-sidebar-border bg-gradient-to-t from-muted/30 to-transparent">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => setCollapsed(!collapsed)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <motion.div
                    animate={{ rotate: collapsed ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {collapsed ? (
                      <PanelLeft className="h-4 w-4" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        Recolher painel
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8} className="font-medium bg-popover border shadow-lg">
                  <p>Expandir painel</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300 pb-16 md:pb-0 overflow-hidden",
            collapsed ? "md:ml-16" : "md:ml-60"
          )}
        >
          {/* Topbar */}
          <header className="flex-shrink-0 sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            {/* Left: Menu + Logo (mobile) */}
            <div className="flex items-center gap-2 md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
                  {/* Mobile Logo */}
                  <div className="flex h-14 items-center border-b border-sidebar-border px-4">
                    <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden ring-2 ring-sidebar-border">
                        <img
                          src={kairoLogo}
                          alt="Kairo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xl font-bold tracking-wide text-foreground">Kairo</span>
                    </Link>
                  </div>
                  <NavContent mobile />
                </SheetContent>
              </Sheet>

              <Link to="/dashboard" className="flex items-center gap-2">
                <img src={kairoLogo} alt="Kairo" className="h-7 w-7 rounded-xl" />
                <span className="font-bold text-lg">Kairo</span>
              </Link>
            </div>

            {/* Spacer for desktop */}
            <div className="hidden md:block" />

            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <SoundToggleButton />
              
              {/* Notifications */}
              <NotificationBell />
              
              {/* Profile */}
              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8 ring-2 ring-border">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{getDisplayName()}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="gap-2">
                    <Link to="/configuracoes">
                      <Settings className="h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive gap-2">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-4 md:p-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation with Spotlight Effect */}
        <SpotlightNav />
      </div>
    </TooltipProvider>
  );
}