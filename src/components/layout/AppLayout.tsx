import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  LayoutDashboard,
  ListTodo,
  CalendarCheck,
  Target,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  Wallet,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Calendar,
  Construction,
  MessageSquare,
  Menu,
  X,
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

const mainNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/rotina", label: "Tarefas", icon: ListTodo },
  { path: "/habitos", label: "Hábitos", icon: CalendarCheck },
  { path: "/metas", label: "Metas", icon: Target },
  { path: "/consistencia", label: "Consistência", icon: Flame },
  { path: "/chat-financeiro", label: "Chat Financeiro", icon: MessageSquare },
  { path: "/financas", label: "Finanças", icon: Wallet },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

// Bottom navigation items (mobile only - most used)
const bottomNavItems = [
  { path: "/dashboard", label: "Início", icon: LayoutDashboard },
  { path: "/rotina", label: "Tarefas", icon: ListTodo },
  { path: "/habitos", label: "Hábitos", icon: CalendarCheck },
  { path: "/metas", label: "Metas", icon: Target },
];

const devNavItems = [
  { path: "/agenda", label: "Agenda", icon: Calendar },
  { path: "/treino", label: "Treino", icon: Dumbbell },
  { path: "/dieta", label: "Dieta", icon: UtensilsCrossed },
  { path: "/ebook", label: "Ebook", icon: BookOpen },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(true);
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
    <nav className={cn("flex-1 space-y-1 p-3 overflow-y-auto", mobile && "pt-4")}>
      {mainNavItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              mobile && "py-3",
              !mobile && collapsed && "justify-center px-2"
            )}
          >
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              isActive && "scale-110"
            )} />
            {(mobile || !collapsed) && (
              <span className={cn("font-medium", isActive && "text-primary")}>{item.label}</span>
            )}
          </Link>
        );
      })}

      {/* Em Desenvolvimento - Admin Only */}
      {isAdmin && (
        <div className="pt-4">
          <button
            onClick={() => setDevMenuOpen(!devMenuOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 text-muted-foreground hover:bg-sidebar-accent",
              !mobile && collapsed && "justify-center px-2"
            )}
          >
            <Construction className="h-4 w-4 shrink-0" />
            {(mobile || !collapsed) && (
              <>
                <span className="flex-1 text-left font-medium">Em desenvolvimento</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  devMenuOpen && "rotate-180"
                )} />
              </>
            )}
          </button>
          
          {devMenuOpen && (
            <div className={cn("mt-1 space-y-1", (mobile || !collapsed) && "ml-3 border-l-2 border-border/50 pl-2")}>
              {devNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      isActive
                        ? "bg-muted/60 text-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      mobile && "py-2.5",
                      !mobile && collapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {(mobile || !collapsed) && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border transition-all duration-300 ease-in-out hidden md:flex md:flex-col",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-14 items-center border-b border-sidebar-border transition-all duration-300",
          collapsed ? "justify-center px-2" : "px-4"
        )}>
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ring-2 ring-sidebar-border group-hover:ring-primary/50 transition-all shadow-sm">
              <img
                src={kairoLogo}
                alt="Kairo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className={cn(
              "text-xl font-bold tracking-wide text-foreground transition-all duration-300 overflow-hidden whitespace-nowrap",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              Kairo
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <NavContent />

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 group",
              collapsed && "justify-center px-2"
            )}
          >
            <div className={cn(
              "transition-transform duration-300 ease-in-out",
              collapsed ? "rotate-180" : "rotate-0"
            )}>
              <ChevronLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </div>
            <span className={cn(
              "transition-all duration-300 overflow-hidden whitespace-nowrap",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>
              Recolher
            </span>
          </button>
        </div>
      </aside>

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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
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
              <img src={kairoLogo} alt="Kairo" className="h-7 w-7 rounded-lg" />
              <span className="font-bold text-lg">Kairo</span>
            </Link>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-secondary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{getDisplayName()}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/configuracoes">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
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

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* More menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </div>
  );
}