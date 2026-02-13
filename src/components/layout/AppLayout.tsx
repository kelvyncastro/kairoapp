import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  LayoutDashboard,
  ListTodo,
  FileText,
  CalendarCheck,
  Target,
  Flame,
  Wallet,
  Settings,
  LogOut,
  CalendarClock,
  MessageSquare,
  ShoppingCart,
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
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SoundToggleButton } from "@/components/layout/SoundToggleButton";
import { SpotlightNav } from "@/components/ui/spotlight-nav";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/aceternity-sidebar";

const mainNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/rotina", label: "Tarefas", icon: ListTodo },
  { path: "/habitos", label: "Hábitos", icon: CalendarCheck },
  { path: "/metas", label: "Metas", icon: Target },
  { path: "/calendario", label: "Calendário", icon: CalendarClock },
  { path: "/chat-financeiro", label: "Chat Financeiro", icon: MessageSquare },
  { path: "/financas", label: "Finanças", icon: Wallet },
  { path: "/ranking", label: "Ranking", icon: Trophy },
  { path: "/consistencia", label: "Consistência", icon: Flame },
  { path: "/notas", label: "Notas", icon: FileText },
  { path: "/lista-mercado", label: "Lista de Mercado", icon: ShoppingCart },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

function SidebarInnerContent() {
  const location = useLocation();
  const { open } = useSidebar();
  const { isAdmin } = useIsAdmin();

  const links = mainNavItems.map((item) => ({
    label: item.label,
    href: item.path,
    icon: (
      <item.icon
        className={cn(
          "h-5 w-5 flex-shrink-0 transition-colors",
          location.pathname === item.path
            ? "text-primary-foreground"
            : "text-sidebar-foreground"
        )}
      />
    ),
  }));

  const adminLink = {
    label: "Painel Admin",
    href: "/admin",
    icon: (
      <Shield
        className={cn(
          "h-5 w-5 flex-shrink-0 transition-colors",
          location.pathname === "/admin"
            ? "text-primary-foreground"
            : "text-sidebar-foreground"
        )}
      />
    ),
  };

  return (
    <>
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-3 py-1 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden ring-2 ring-sidebar-border flex-shrink-0">
          <img src={kairoLogo} alt="Kairo" className="w-full h-full object-cover" />
        </div>
        <AnimatePresence mode="wait">
          {open && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-bold tracking-wide text-foreground whitespace-nowrap"
            >
              Kairo
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Navigation links */}
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
        {links.map((link) => (
          <SidebarLink
            key={link.href}
            link={link}
            active={location.pathname === link.href}
          />
        ))}

        {isAdmin && (
          <>
            <div className="my-2 h-px bg-sidebar-border" />
            <SidebarLink
              link={adminLink}
              active={location.pathname === "/admin"}
            />
          </>
        )}
      </div>

      {/* User avatar at bottom */}
      <UserAvatarSection />
    </>
  );
}

function UserAvatarSection() {
  const { open } = useSidebar();
  const { profile, getInitials, getDisplayName } = useUserProfile();

  return (
    <div className="mt-4 pt-4 border-t border-sidebar-border">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 ring-2 ring-sidebar-border flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <AnimatePresence mode="wait">
          {open && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-medium text-sidebar-foreground truncate"
            >
              {getDisplayName()}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile, getInitials, getDisplayName } = useUserProfile();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody
          className={cn(
            "fixed left-3 top-3 z-40 rounded-2xl border border-primary/20",
            "bg-sidebar/80 backdrop-blur-xl",
            "shadow-[0_0_30px_-5px_hsl(var(--primary)/0.15),inset_0_1px_0_0_hsl(var(--primary)/0.1)]",
            "justify-between"
          )}
          style={{ height: "calc(100vh - 24px)" }}
        >
          <SidebarInnerContent />
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 pb-16 md:pb-0 overflow-hidden",
          "md:ml-[88px]"
        )}
      >
        {/* Topbar */}
        <header className="flex-shrink-0 sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          {/* Left: Logo (mobile) */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={kairoLogo} alt="Kairo" className="h-7 w-7 rounded-xl" />
              <span className="font-bold text-lg">Kairo</span>
            </Link>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            <SoundToggleButton />
            <NotificationBell />

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
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden p-4 md:p-6 relative">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <SpotlightNav />
    </div>
  );
}
