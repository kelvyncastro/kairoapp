import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Plus,
  DollarSign,
  Dumbbell,
  Heart,
  User,
  Star,
  Target,
  Trophy,
  Rocket,
  Lightbulb,
  Book,
  GraduationCap,
  Briefcase,
  Home,
  Car,
  Plane,
  Music,
  Camera,
  Coffee,
  ShoppingBag,
  CreditCard,
  PiggyBank,
  BarChart3,
  Calendar,
  Clock,
  Bell,
  Gamepad2,
  Palette,
  Gem,
  Award,
  Crown,
  Zap,
  Flame,
  Leaf,
  Mountain,
  type LucideIcon,
} from "lucide-react";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCategory: (category: { name: string; icon: string; color: string }) => Promise<void>;
}

const AVAILABLE_ICONS: { key: string; icon: LucideIcon }[] = [
  { key: "dollar-sign", icon: DollarSign },
  { key: "dumbbell", icon: Dumbbell },
  { key: "heart", icon: Heart },
  { key: "user", icon: User },
  { key: "star", icon: Star },
  { key: "target", icon: Target },
  { key: "trophy", icon: Trophy },
  { key: "rocket", icon: Rocket },
  { key: "lightbulb", icon: Lightbulb },
  { key: "book", icon: Book },
  { key: "graduation-cap", icon: GraduationCap },
  { key: "briefcase", icon: Briefcase },
  { key: "home", icon: Home },
  { key: "car", icon: Car },
  { key: "plane", icon: Plane },
  { key: "music", icon: Music },
  { key: "camera", icon: Camera },
  { key: "coffee", icon: Coffee },
  { key: "shopping-bag", icon: ShoppingBag },
  { key: "credit-card", icon: CreditCard },
  { key: "piggy-bank", icon: PiggyBank },
  { key: "chart-bar", icon: BarChart3 },
  { key: "calendar", icon: Calendar },
  { key: "clock", icon: Clock },
  { key: "bell", icon: Bell },
  { key: "gamepad", icon: Gamepad2 },
  { key: "palette", icon: Palette },
  { key: "gem", icon: Gem },
  { key: "award", icon: Award },
  { key: "crown", icon: Crown },
  { key: "zap", icon: Zap },
  { key: "flame", icon: Flame },
  { key: "leaf", icon: Leaf },
  { key: "mountain", icon: Mountain },
];

const AVAILABLE_COLORS = [
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
  "#84cc16", // lime
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#a855f7", // purple
];

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onCreateCategory,
}: CreateCategoryDialogProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await onCreateCategory({ name: name.trim(), icon: selectedIcon, color: selectedColor });
      setName("");
      setSelectedIcon("star");
      setSelectedColor("#6366f1");
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  const SelectedIconComponent = AVAILABLE_ICONS.find((i) => i.key === selectedIcon)?.icon || Star;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Setor</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Preview */}
          <div className="flex items-center justify-center">
            <div
              className="p-4 rounded-xl flex items-center gap-3"
              style={{ backgroundColor: `${selectedColor}20` }}
            >
              <span
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${selectedColor}30`, color: selectedColor }}
              >
                <SelectedIconComponent className="h-6 w-6" />
              </span>
              <span className="font-semibold" style={{ color: selectedColor }}>
                {name || "Nome do Setor"}
              </span>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Nome do Setor</Label>
            <Input
              placeholder="Ex: Estudos, Viagens, Carreira..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <ScrollArea className="h-32">
              <div className="grid grid-cols-8 gap-2">
                {AVAILABLE_ICONS.map(({ key, icon: IconComponent }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedIcon(key)}
                    className={cn(
                      "p-2 rounded-lg border transition-all hover:bg-accent",
                      selectedIcon === key
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                  >
                    <IconComponent
                      className="h-4 w-4"
                      style={selectedIcon === key ? { color: selectedColor } : undefined}
                    />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-6 gap-2">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-8 w-full rounded-lg transition-all border-2",
                    selectedColor === color
                      ? "border-white scale-110 shadow-lg"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Setor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
