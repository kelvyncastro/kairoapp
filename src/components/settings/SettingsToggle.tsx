import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SettingsToggleProps {
  label: string;
  description?: string;
  icon?: LucideIcon;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggle({
  label,
  description,
  icon: Icon,
  checked,
  onCheckedChange,
  disabled = false,
}: SettingsToggleProps) {
  return (
    <div className={cn(
      "flex items-center justify-between py-3 px-4 rounded-lg transition-colors",
      "hover:bg-accent/50",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-1.5 rounded-md bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-medium text-sm">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
