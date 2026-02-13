import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Sparkles, RotateCcw, Trash2, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryGroup {
  name: string;
  emoji: string;
  items: string[];
}

interface CheckedState {
  [category: string]: { [item: string]: boolean };
}

export default function ListaMercado() {
  const [inputText, setInputText] = useState("");
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<CheckedState>({});

  const handleCategorize = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      toast.error("Digite os itens da sua lista primeiro.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("categorize-grocery", {
        body: { items: trimmed },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const cats: CategoryGroup[] = data.categories || [];
      setCategories(cats);
      setChecked({});
      toast.success(`Lista organizada em ${cats.length} setores!`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao categorizar itens.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (category: string, item: string) => {
    setChecked((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: !prev[category]?.[item],
      },
    }));
  };

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const checkedCount = Object.values(checked).reduce(
    (acc, cat) => acc + Object.values(cat).filter(Boolean).length,
    0
  );

  const handleReset = () => {
    setCategories([]);
    setChecked({});
    setInputText("");
  };

  const handleCopyList = () => {
    const text = categories
      .map((c) => `${c.emoji} ${c.name}\n${c.items.map((i) => `  • ${i}`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Lista copiada!");
  };

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Lista de Mercado
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digite seus itens e a IA organiza por setor automaticamente
          </p>
        </div>
        {categories.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyList}>
              <Copy className="h-4 w-4 mr-1" /> Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Nova lista
            </Button>
          </div>
        )}
      </div>

      {/* Input Section */}
      <AnimatePresence mode="wait">
        {categories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-dashed">
              <CardContent className="pt-6 space-y-4">
                <Textarea
                  placeholder={"Ex: banana, frango, detergente, arroz, leite, alface, sabonete, cerveja, macarrão, queijo..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[140px] text-base resize-none"
                  disabled={loading}
                />
                <Button
                  onClick={handleCategorize}
                  disabled={loading || !inputText.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Organizando sua lista...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Organizar por Setor
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      {categories.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="font-medium whitespace-nowrap">
            {checkedCount}/{totalItems} itens
          </span>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
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
                        <label
                          key={item}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                            isChecked && "line-through text-muted-foreground"
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleItem(cat.name, item)}
                          />
                          <span className="text-sm">{item}</span>
                        </label>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
