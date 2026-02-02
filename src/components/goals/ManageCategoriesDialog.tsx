import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Edit2,
  Trash2,
  Check,
  X,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default?: boolean;
}

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onUpdateCategory: (id: string, data: { name: string; icon: string; color: string }) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
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

function getIconComponent(iconKey: string) {
  const found = AVAILABLE_ICONS.find((i) => i.key === iconKey);
  return found?.icon || Star;
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  onUpdateCategory,
  onDeleteCategory,
}: ManageCategoriesDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon);
    setEditColor(category.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
    setEditColor("");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateCategory(editingId, {
        name: editName.trim(),
        icon: editIcon,
        color: editColor,
      });
      cancelEdit();
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await onDeleteCategory(deleteId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const EditIconComponent = getIconComponent(editIcon);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Setores</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum setor encontrado
              </p>
            ) : (
              categories.map((category) => {
                const IconComponent = getIconComponent(category.icon);
                const isEditing = editingId === category.id;

                if (isEditing) {
                  return (
                    <div
                      key={category.id}
                      className="border rounded-lg p-4 space-y-4 bg-accent/50"
                    >
                      {/* Preview */}
                      <div className="flex items-center justify-center">
                        <div
                          className="p-3 rounded-xl flex items-center gap-3"
                          style={{ backgroundColor: `${editColor}20` }}
                        >
                          <span
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${editColor}30`, color: editColor }}
                          >
                            <EditIconComponent className="h-5 w-5" />
                          </span>
                          <span className="font-semibold" style={{ color: editColor }}>
                            {editName || "Nome do Setor"}
                          </span>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nome do setor"
                        />
                      </div>

                      {/* Icon Selection */}
                      <div className="space-y-2">
                        <Label>Ícone</Label>
                        <ScrollArea className="h-24">
                          <div className="grid grid-cols-8 gap-1">
                            {AVAILABLE_ICONS.map(({ key, icon: Icon }) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setEditIcon(key)}
                                className={cn(
                                  "p-2 rounded-lg border transition-all hover:bg-accent",
                                  editIcon === key
                                    ? "border-primary bg-primary/10"
                                    : "border-border"
                                )}
                              >
                                <Icon
                                  className="h-4 w-4"
                                  style={editIcon === key ? { color: editColor } : undefined}
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
                              onClick={() => setEditColor(color)}
                              className={cn(
                                "h-7 w-full rounded-lg transition-all border-2",
                                editColor === color
                                  ? "border-white scale-110 shadow-lg"
                                  : "border-transparent"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          disabled={!editName.trim() || isSaving}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        <IconComponent className="h-4 w-4" />
                      </span>
                      <span className="font-medium">{category.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEdit(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este setor? As metas vinculadas a ele ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
