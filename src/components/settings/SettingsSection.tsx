import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({ 
  title, 
  description, 
  icon: Icon,
  children,
  className 
}: SettingsSectionProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/50 backdrop-blur-sm", className)}>
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
