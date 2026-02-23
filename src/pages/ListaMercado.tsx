import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NeonCheckbox } from "@/components/ui/animated-check-box";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShoppingCart, Sparkles, RotateCcw, Copy, Plus, CheckCircle2, Archive, ArrowLeft, Trash2, DollarSign, Share2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavPadding } from "@/hooks/useNavPadding";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";

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
  share_code: string | null;
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
  const { contentPaddingBottom } = useNavPadding();
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
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [confirmingPurchase, setConfirmingPurchase] = useState(false);
  const [sharingList, setSharingList] = useState(false);

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

  const removeItem = (categoryName: string, item: string) => {
    const updated = categories
      .map((cat) => {
        if (cat.name !== categoryName) return cat;
        return { ...cat, items: cat.items.filter((i) => i !== item) };
      })
      .filter((cat) => cat.items.length > 0);

    const updatedChecked = { ...checked };
    if (updatedChecked[categoryName]) {
      const { [item]: _, ...rest } = updatedChecked[categoryName];
      updatedChecked[categoryName] = rest;
    }

    setCategories(updated);
    setChecked(updatedChecked);
    saveToDb(updated, updatedChecked, activeListId);
  };

  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const checkedCount = Object.values(checked).reduce(
    (acc, cat) => acc + Object.values(cat).filter(Boolean).length,
    0
  );

  const handleConfirmPurchase = async () => {
    if (!activeListId || !user) return;
    
    const amount = parseFloat(purchaseAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Digite um valor válido.");
      return;
    }

    setConfirmingPurchase(true);
    try {
      // 1. Archive the list
      await supabase
        .from("grocery_lists")
        .update({ status: "archived", completed_at: new Date().toISOString() })
        .eq("id", activeListId);

      // 2. Find or use "Mercado" sector
      let sectorId: string | null = null;
      const { data: sectors } = await supabase
        .from("finance_sectors")
        .select("id, name")
        .eq("user_id", user.id);

      const mercadoSector = sectors?.find(
        (s) => s.name.toLowerCase() === "mercado"
      );
      sectorId = mercadoSector?.id || null;

      // 3. Create finance transaction
      const today = format(new Date(), "yyyy-MM-dd");
      await supabase.from("finance_transactions").insert({
        user_id: user.id,
        name: "Compra no Mercado",
        value: -Math.abs(amount),
        date: today,
        sector_id: sectorId,
        status: "paid",
        description: `Lista de mercado finalizada com ${totalItems} itens`,
      });

      // 4. Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Gasto registrado automaticamente",
        message: `R$ ${Math.abs(amount).toFixed(2).replace(".", ",")} foi registrado em Finanças (setor Mercado) a partir da sua lista de compras. Não registre novamente!`,
        type: "finance_auto",
        data: { source: "grocery_list", amount: Math.abs(amount) },
      });

      // 5. Reset state
      setCategories([]);
      setChecked({});
      setActiveListId(null);
      setInputText("");
      setShowPurchaseDialog(false);
      setPurchaseAmount("");

      toast.success(
        `Compra confirmada! R$ ${Math.abs(amount).toFixed(2).replace(".", ",")} registrado automaticamente em Finanças.`,
        { duration: 6000 }
      );
    } catch (error) {
      console.error("Erro ao confirmar compra:", error);
      toast.error("Erro ao confirmar compra. Tente novamente.");
    } finally {
      setConfirmingPurchase(false);
    }
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

  const handleShareList = async () => {
    if (!activeListId) return;
    setSharingList(true);
    try {
      // Check if already has share_code
      const { data: existing } = await supabase
        .from("grocery_lists")
        .select("share_code")
        .eq("id", activeListId)
        .single();

      let code = (existing as any)?.share_code;

      if (!code) {
        // Generate a random 10-char code
        code = Array.from(crypto.getRandomValues(new Uint8Array(5)))
          .map((b) => b.toString(36).padStart(2, "0"))
          .join("")
          .slice(0, 10);

        await supabase
          .from("grocery_lists")
          .update({ share_code: code } as any)
          .eq("id", activeListId);
      }

      // Always use the published Kairo URL
      const shareUrl = `https://kairoapp.com.br/lista/${code}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado! Compartilhe com quem quiser.", { duration: 4000 });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar link de compartilhamento.");
    } finally {
      setSharingList(false);
    }
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
      <div className="absolute inset-0 flex flex-col bg-background overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b border-border/30 flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
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
      <div className="absolute inset-0 flex flex-col bg-background overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-6 py-2 md:py-3 border-b border-border/30 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setShowArchived(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              Listas Arquivadas
            </h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
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
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Lista de Mercado
          </h1>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          {categories.length > 0 && (
            <>
              <Button variant="outline" size="icon" className="h-7 w-7 md:w-auto md:px-2" onClick={loadArchivedLists} title="Arquivadas">
                <Archive className="h-3.5 w-3.5" />
                <span className="hidden md:inline ml-1 text-xs">Arquivadas</span>
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 md:w-auto md:px-2" onClick={() => handleCopyList()} title="Copiar">
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden md:inline ml-1 text-xs">Copiar</span>
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 md:w-auto md:px-2" onClick={handleShareList} disabled={sharingList} title="Compartilhar">
                {sharingList ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                <span className="hidden md:inline ml-1 text-xs">Compartilhar</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-7 w-7 md:w-auto md:px-2" title="Nova lista">
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden md:inline ml-1 text-xs">Nova lista</span>
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
              <Button size="icon" className="rounded-full h-7 w-7" onClick={() => setShowAddMore(true)} title="Adicionar itens">
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
          {categories.length === 0 && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={loadArchivedLists}>
              <Archive className="h-3.5 w-3.5 mr-1" /> Arquivadas
            </Button>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className={cn("flex-1 overflow-y-auto min-h-0 px-4 md:px-6 pt-4 pb-2 space-y-4", contentPaddingBottom)}>
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
                         <div key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                           <NeonCheckbox
                             checked={isChecked}
                             onCheckedChange={() => toggleItem(cat.name, item)}
                             rounded={false}
                             size={18}
                           />
                           <span className={cn("text-sm flex-1", isChecked && "line-through text-muted-foreground")}>{item}</span>
                           <button
                             onClick={() => removeItem(cat.name, item)}
                             className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                           >
                             <Trash2 className="h-3.5 w-3.5" />
                           </button>
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
      </div>

      {/* Confirm Purchase Button */}
      {categories.length > 0 && (
        <div className="flex-shrink-0 px-4 md:px-6 pb-4">
          <Button size="lg" className="w-full gap-2" onClick={() => { setShowPurchaseDialog(true); setPurchaseAmount(""); }}>
            <CheckCircle2 className="h-5 w-5" />
            Confirmar Compra
          </Button>
        </div>
      )}

      {/* Purchase Amount Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={(open) => { if (!confirmingPurchase) { setShowPurchaseDialog(open); if (!open) setPurchaseAmount(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Quanto foi gasto?
            </DialogTitle>
            <DialogDescription>
              Digite o valor total da compra. Ele será registrado automaticamente em Finanças no setor Mercado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="purchase-amount">Valor da compra (R$)</Label>
            <Input
              id="purchase-amount"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 150,00"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              autoFocus
              className="text-lg"
              onKeyDown={(e) => { if (e.key === "Enter" && purchaseAmount.trim()) handleConfirmPurchase(); }}
            />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)} disabled={confirmingPurchase}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPurchase} disabled={confirmingPurchase || !purchaseAmount.trim()} className="gap-2">
              {confirmingPurchase ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar e Registrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
