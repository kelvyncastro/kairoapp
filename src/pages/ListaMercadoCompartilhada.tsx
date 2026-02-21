import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeonCheckbox } from "@/components/ui/animated-check-box";
import { motion } from "framer-motion";

interface CategoryGroup {
  name: string;
  emoji: string;
  items: string[];
}

interface CheckedState {
  [category: string]: { [item: string]: boolean };
}

export default function ListaMercadoCompartilhada() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [checked, setChecked] = useState<CheckedState>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareCode) return;

    const loadList = async () => {
      const { data, error } = await supabase
        .from("grocery_lists")
        .select("categories, checked_items, status")
        .eq("share_code", shareCode)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setCategories(data.categories as unknown as CategoryGroup[]);
        setChecked(data.checked_items as unknown as CheckedState);
      }
      setLoading(false);
    };

    loadList();

    // Realtime updates
    const channel = supabase
      .channel(`shared-list-${shareCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "grocery_lists",
          filter: `share_code=eq.${shareCode}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setCategories(updated.categories as CategoryGroup[]);
          setChecked(updated.checked_items as CheckedState);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shareCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-3">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Lista não encontrada</h2>
            <p className="text-muted-foreground text-sm">
              Este link pode ter expirado ou a lista foi removida.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const checkedCount = Object.values(checked).reduce(
    (acc, cat) => acc + Object.values(cat).filter(Boolean).length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Lista de Mercado
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe em tempo real
          </p>
        </div>

        {/* Progress */}
        {totalItems > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(checkedCount / totalItems) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="font-medium whitespace-nowrap">
              {checkedCount}/{totalItems} itens
            </span>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-4">
          {categories.map((cat, idx) => {
            const allChecked = cat.items.every((item) => checked[cat.name]?.[item]);
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn("transition-all", allChecked && "opacity-60")}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-xl">{cat.emoji}</span>
                      {cat.name}
                      <span className="ml-auto text-xs text-muted-foreground font-normal">
                        {cat.items.filter((i) => checked[cat.name]?.[i]).length}/{cat.items.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {cat.items.map((item) => {
                      const isChecked = !!checked[cat.name]?.[item];
                      return (
                        <div key={item} className="flex items-center gap-3 p-2 rounded-lg">
                          <NeonCheckbox
                            checked={isChecked}
                            disabled
                            rounded={false}
                            size={18}
                          />
                          <span className={cn("text-sm", isChecked && "line-through text-muted-foreground")}>
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
