import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  Settings,
  LogOut,
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
  TooltipProvider,
} from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SoundToggleButton } from "@/components/layout/SoundToggleButton";
import { SpotlightNav } from "@/components/ui/spotlight-nav";
import { useCalendarReminders } from "@/hooks/useCalendarReminders";

export default function AppLayout() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile, getInitials, getDisplayName } = useUserProfile();

  // Smart calendar reminders (30min, 15min, 1min before events)
  useCalendarReminders();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={kairoLogo} alt="Kairo" className="h-7 w-7 rounded-xl" />
              <span className="font-bold text-lg">Kairo</span>
            </Link>
          </div>

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
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 relative">
          <Outlet />
        </div>

        {/* Bottom Navigation (all screen sizes) */}
        <SpotlightNav />
      </div>
    </TooltipProvider>
  );
}
