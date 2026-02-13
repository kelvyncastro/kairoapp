import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { NeonCheckbox } from "@/components/ui/animated-check-box";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShoppingCart, Sparkles, RotateCcw, Copy, Plus, CheckCircle2, Archive, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CategoryGroup {
  name: string;
  emoji: string;
  items: string[];
}

interface CheckedState {
  [category: string]: { [item: string]: boolean };
}

interface GroceryList {
  id: string;
  categories: CategoryGroup[];
  checked_items: CheckedState;
  status: string;
  created_at: string;
  completed_at: string | null;
}

function normalizeItems(items: any[]): string[] {
  return items.map((item) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      return item.name || item.item || item.title || JSON.stringify(item);
    }
    return String(item);
  });
}

export default function ListaMercado() {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<CheckedState>({});
  const [showAddMore, setShowAddMore] = useState(false);
  const [addMoreText, setAddMoreText] = useState("");
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedLists, setArchivedLists] = useState<GroceryList[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [viewingArchivedList, setViewingArchivedList] = useState<GroceryList | null>(null);

  // Load active list on mount
  useEffect(() => {
    if (!user) return;
    const loadActiveList = async () => {
      const { data } = await supabase
        .from("grocery_lists")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const list = data[0];
        setActiveListId(list.id);
        setCategories(list.categories as unknown as CategoryGroup[]);
        setChecked(list.checked_items as unknown as CheckedState);
      }
      setLoadingInitial(false);
    };
    loadActiveList();
  }, [user]);

  // Save to DB whenever categories or checked changes
  const saveToDb = useCallback(async (cats: CategoryGroup[], chk: CheckedState, listId: string | null) => {
    if (!user || cats.length === 0) return;

    if (listId) {
      await supabase
        .from("grocery_lists")
        .update({
          categories: cats as any,
          checked_items: chk as any,
        })
        .eq("id", listId);
    } else {
      const { data } = await supabase
        .from("grocery_lists")
        .insert({
          user_id: user.id,
          categories: cats as any,
          checked_items: chk as any,
          status: "active",
        })
        .select("id")
        .single();

      if (data) setActiveListId(data.id);
    }
  }, [user]);

  const mergeCategories = (existing: CategoryGroup[], incoming: CategoryGroup[]): CategoryGroup[] => {
    const map = new Map<string, CategoryGroup>();
    for (const cat of existing) {
      map.set(cat.name, { ...cat, items: [...cat.items] });
    }
    for (const cat of incoming) {
      const normalized = normalizeItems(cat.items);
      if (map.has(cat.name)) {
        const ex = map.get(cat.name)!;
        const existingSet = new Set(ex.items.map((i) => i.toLowerCase()));
        for (const item of normalized) {
          if (!existingSet.has(item.toLowerCase())) {
            ex.items.push(item);
          }
        }
      } else {
        map.set(cat.name, { ...cat, items: normalized });
      }
    }
    return Array.from(map.values());
  };

  const handleCategorize = async (text: string, isAddMore = false) => {
    const trimmed = text.trim();
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

      const incoming: CategoryGroup[] = (data.categories || []).map((c: any) => ({
        ...c,
        items: normalizeItems(c.items),
      }));

      if (isAddMore) {
        const merged = mergeCategories(categories, incoming);
        setCategories(merged);
        setAddMoreText("");
        setShowAddMore(false);
        toast.success("Itens adicionados à lista!");
        await saveToDb(merged, checked, activeListId);
      } else {
        setCategories(incoming);
        setChecked({});
        toast.success(`Lista organizada em ${incoming.length} setores!`);
        // Create new list
        setActiveListId(null);
        await saveToDb(incoming, {}, null);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao categorizar itens.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (category: string, item: string) => {
    setChecked((prev) => {
      const next = {
        ...prev,
        [category]: {
          ...prev[category],
          [item]: !prev[category]?.[item],
        },
      };
      saveToDb(categories, next, activeListId);
      return next;
    });
  };

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const checkedCount = Object.values(checked).reduce(
    (acc, cat) => acc + Object.values(cat).filter(Boolean).length,
    0
  );

  const handleConfirmPurchase = async () => {
    if (!activeListId) return;
    await supabase
      .from("grocery_lists")
      .update({ status: "archived", completed_at: new Date().toISOString() })
      .eq("id", activeListId);

    setCategories([]);
    setChecked({});
    setActiveListId(null);
    setInputText("");
    toast.success("Compra confirmada! Lista arquivada.");
  };

  const handleReset = async () => {
    if (activeListId) {
      await supabase.from("grocery_lists").delete().eq("id", activeListId);
    }
    setCategories([]);
    setChecked({});
    setActiveListId(null);
    setInputText("");
    setAddMoreText("");
    setShowAddMore(false);
  };

  const loadArchivedLists = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("grocery_lists")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "archived")
      .order("completed_at", { ascending: false });

    setArchivedLists((data || []) as unknown as GroceryList[]);
    setShowArchived(true);
  };

  const handleCopyList = (cats?: CategoryGroup[]) => {
    const source = cats || categories;
    const text = source
      .map((c) => `${c.emoji} ${c.name}\n${c.items.map((i) => `  • ${i}`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Lista copiada!");
  };

  if (loadingInitial) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Viewing an archived list
  if (viewingArchivedList) {
    const archivedCats = viewingArchivedList.categories;
    const archivedChecked = viewingArchivedList.checked_items;
    return (
      <div className="h-full overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setViewingArchivedList(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Lista Arquivada</h1>
              <p className="text-sm text-muted-foreground">
                {viewingArchivedList.completed_at
                  ? format(new Date(viewingArchivedList.completed_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
                  : ""}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleCopyList(archivedCats)}>
            <Copy className="h-4 w-4 mr-1" /> Copiar
          </Button>
        </div>
        <div className="space-y-4">
          {archivedCats.map((cat) => (
            <Card key={cat.name} className="opacity-80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">{cat.emoji}</span>
                  {cat.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                 {cat.items.map((item) => {
                   const wasChecked = !!(archivedChecked as any)?.[cat.name]?.[item];
                   return (
                     <div
                       key={item}
                       className={cn(
                         "flex items-center gap-3 p-2 rounded-lg",
                         wasChecked && "line-through text-muted-foreground"
                       )}
                     >
                       <NeonCheckbox checked={wasChecked} disabled rounded={false} size={18} />
                       <span className="text-sm">{item}</span>
                     </div>
                   );
                 })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Archived lists view
  if (showArchived) {
    return (
      <div className="h-full overflow-y-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowArchived(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Archive className="h-6 w-6 text-primary" />
              Listas Arquivadas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico de compras realizadas
            </p>
          </div>
        </div>

        {archivedLists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma lista arquivada ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {archivedLists.map((list) => {
              const cats = list.categories as unknown as CategoryGroup[];
              const totalItems = cats.reduce((acc, c) => acc + c.items.length, 0);
              return (
                <Card
                  key={list.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setViewingArchivedList(list)}
                >
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {list.completed_at
                          ? format(new Date(list.completed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalItems} itens em {cats.length} setores
                      </p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                      {cats.slice(0, 6).map((c) => (
                        <span key={c.name} className="text-lg">{c.emoji}</span>
                      ))}
                      {cats.length > 6 && (
                        <span className="text-xs text-muted-foreground self-center">+{cats.length - 6}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={loadArchivedLists}>
                <Archive className="h-4 w-4 mr-1" /> Arquivadas
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCopyList()}>
                <Copy className="h-4 w-4 mr-1" /> Copiar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-1" /> Nova lista
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Descartar lista atual?</AlertDialogTitle>
                    <AlertDialogDescription>
                      A lista atual será excluída permanentemente. Para manter o histórico, confirme a compra antes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Descartar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="icon" className="rounded-full h-9 w-9" onClick={() => setShowAddMore(true)}>
                <Plus className="h-5 w-5" />
              </Button>
            </>
          )}
          {categories.length === 0 && (
            <Button variant="outline" size="sm" onClick={loadArchivedLists}>
              <Archive className="h-4 w-4 mr-1" /> Arquivadas
            </Button>
          )}
        </div>
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
                  onClick={() => handleCategorize(inputText)}
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

      {/* Categories List */}
      <div className="space-y-4">
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
                         <div key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                           <NeonCheckbox
                             checked={isChecked}
                             onCheckedChange={() => toggleItem(cat.name, item)}
                             rounded={false}
                             size={18}
                           />
                           <span className={cn("text-sm", isChecked && "line-through text-muted-foreground")}>{item}</span>
                         </div>
                       );
                     })}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm Purchase Button */}
      {categories.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground">
              <CheckCircle2 className="h-5 w-5" />
              Confirmar Compra
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar compra?</AlertDialogTitle>
              <AlertDialogDescription>
                A lista será arquivada e você poderá consultá-la depois no histórico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmPurchase}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Add More Dialog */}
      <Dialog open={showAddMore} onOpenChange={(open) => { setShowAddMore(open); if (!open) setAddMoreText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar mais itens</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Digite mais itens para adicionar à lista..."
              value={addMoreText}
              onChange={(e) => setAddMoreText(e.target.value)}
              className="min-h-[120px] text-base resize-none"
              disabled={loading}
              autoFocus
            />
            <Button
              onClick={() => handleCategorize(addMoreText, true)}
              disabled={loading || !addMoreText.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Adicionar e Organizar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
