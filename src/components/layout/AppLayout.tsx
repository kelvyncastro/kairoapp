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
import kairoLogo from "@/assets/kairo-penguin.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SoundToggleButton } from "@/components/layout/SoundToggleButton";
import { SpotlightNav } from "@/components/ui/spotlight-nav";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarSectionLabel,
  SidebarDivider,
  useSidebar,
} from "@/components/ui/aceternity-sidebar";

// Grouped navigation sections
const navSections = [
  {
    label: "Principal",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/rotina", label: "Tarefas", icon: ListTodo },
      { path: "/habitos", label: "Hábitos", icon: CalendarCheck },
      { path: "/metas", label: "Metas", icon: Target },
      { path: "/calendario", label: "Calendário", icon: CalendarClock },
    ],
  },
  {
    label: "Finanças",
    items: [
      { path: "/chat-financeiro", label: "Chat IA", icon: MessageSquare },
      { path: "/financas", label: "Finanças", icon: Wallet },
    ],
  },
  {
    label: "Organização",
    items: [
      { path: "/notas", label: "Notas", icon: FileText },
      { path: "/lista-mercado", label: "Mercado", icon: ShoppingCart },
    ],
  },
  {
    label: "Social",
    items: [
      { path: "/ranking", label: "Ranking", icon: Trophy },
      { path: "/consistencia", label: "Consistência", icon: Flame },
    ],
  },
];

function SidebarInnerContent() {
  const location = useLocation();
  const { open } = useSidebar();
  const { isAdmin } = useIsAdmin();

  return (
    <>
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-3 px-1 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden ring-2 ring-sidebar-border flex-shrink-0">
          <img src={kairoLogo} alt="Kairo" className="w-full h-full object-cover" />
        </div>
        <AnimatePresence mode="wait">
          {open && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-lg font-bold tracking-wide text-foreground whitespace-nowrap"
            >
              Kairo
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Grouped Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden mt-1">
        {navSections.map((section, sectionIdx) => (
          <div key={section.label}>
            {sectionIdx > 0 && <SidebarDivider />}
            <SidebarSectionLabel>{section.label}</SidebarSectionLabel>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarLink
                    key={item.path}
                    link={{
                      label: item.label,
                      href: item.path,
                      icon: (
                        <item.icon
                          className={cn(
                            "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                            isActive
                              ? "text-primary-foreground"
                              : "text-foreground"
                          )}
                        />
                      ),
                    }}
                    active={isActive}
                  />
                );
              })}
            </div>
          </div>
        ))}

      </div>

      {/* Bottom section */}
      <div className="mt-auto">
        {/* Settings link */}
        <SidebarLink
          link={{
            label: "Configurações",
            href: "/configuracoes",
            icon: (
              <Settings
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                  location.pathname === "/configuracoes"
                    ? "text-primary-foreground"
                    : "text-foreground"
                )}
              />
            ),
          }}
          active={location.pathname === "/configuracoes"}
        />
        {isAdmin && (
          <SidebarLink
            link={{
              label: "Painel Admin",
              href: "/admin",
              icon: (
                <Shield
                  className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                    location.pathname === "/admin"
                      ? "text-primary-foreground"
                      : "text-foreground"
                  )}
                />
              ),
            }}
            active={location.pathname === "/admin"}
          />
        )}
        {/* User avatar */}
        <UserAvatarSection />
      </div>
    </>
  );
}

function UserAvatarSection() {
  const { open } = useSidebar();
  const { profile, getInitials, getDisplayName } = useUserProfile();

  return (
    <Link to="/configuracoes" className="mt-2 pt-2 border-t border-sidebar-border/40 block">
      <div className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer hover:bg-sidebar-accent transition-colors",
        !open && "justify-center px-0"
      )}>
        <Avatar className="h-8 w-8 ring-2 ring-sidebar-border/50 flex-shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-xs font-semibold text-sidebar-foreground truncate">
                {getDisplayName()}
              </span>
              <span className="text-[10px] text-muted-foreground/60 truncate">
                Online
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Link>
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
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar open={open} setOpen={setOpen} animate={true}>
          <SidebarBody
            className={cn(
              "fixed left-3 top-3 z-40 rounded-2xl border border-sidebar-border/30",
              "bg-sidebar/90 backdrop-blur-xl",
              "shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.08)]",
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
            "md:ml-[86px]"
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
          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 relative">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <SpotlightNav />
      </div>
    </TooltipProvider>
  );
}
