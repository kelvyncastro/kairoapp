import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  UtensilsCrossed,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Camera,
  MessageSquare,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, addDays, subDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NutritionDay {
  id: string;
  date: string;
  calories_total: number;
  protein_total: number;
  carbs_total: number;
  fat_total: number;
  fiber_total: number;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
  target_fiber: number | null;
}

interface Meal {
  id: string;
  name: string;
  foods: FoodItem[];
}

interface FoodItem {
  id: string;
  name: string;
  quantity_text: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface NewFood {
  name: string;
  quantity_text: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

const defaultTargets = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 70,
  fiber: 30,
};

export default function Dieta() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nutritionDay, setNutritionDay] = useState<NutritionDay | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [newMealName, setNewMealName] = useState("");
  const [newFood, setNewFood] = useState<NewFood>({
    name: "",
    quantity_text: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch or create nutrition day
    let { data: dayData } = await supabase
      .from("nutrition_days")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle();

    if (!dayData) {
      // Create nutrition day
      const { data: newDay } = await supabase
        .from("nutrition_days")
        .insert({
          user_id: user.id,
          date: dateStr,
          target_calories: defaultTargets.calories,
          target_protein: defaultTargets.protein,
          target_carbs: defaultTargets.carbs,
          target_fat: defaultTargets.fat,
          target_fiber: defaultTargets.fiber,
        })
        .select()
        .single();
      dayData = newDay;
    }

    setNutritionDay(dayData as NutritionDay);

    // Fetch meals with foods
    if (dayData) {
      const { data: mealsData } = await supabase
        .from("meals")
        .select("*")
        .eq("nutrition_day_id", dayData.id)
        .order("created_at");

      const mealsWithFoods: Meal[] = [];
      for (const meal of (mealsData || [])) {
        const { data: foods } = await supabase
          .from("food_items")
          .select("*")
          .eq("meal_id", meal.id)
          .order("created_at");

        mealsWithFoods.push({
          id: meal.id,
          name: meal.name,
          foods: (foods as FoodItem[]) || [],
        });
      }

      setMeals(mealsWithFoods);
    }

    setLoading(false);
  }, [user, dateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateNutritionTotals = async () => {
    if (!nutritionDay) return;

    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        totals.calories += food.calories;
        totals.protein += food.protein;
        totals.carbs += food.carbs;
        totals.fat += food.fat;
        totals.fiber += food.fiber;
      });
    });

    await supabase
      .from("nutrition_days")
      .update({
        calories_total: totals.calories,
        protein_total: totals.protein,
        carbs_total: totals.carbs,
        fat_total: totals.fat,
        fiber_total: totals.fiber,
      })
      .eq("id", nutritionDay.id);

    // Update consistency
    if (totals.calories > 0) {
      await supabase.from("consistency_days").upsert(
        {
          user_id: user?.id,
          date: dateStr,
          is_active: true,
          reason: "diet",
        },
        { onConflict: "user_id,date" }
      );
    }
  };

  const handleAddMeal = async () => {
    if (!nutritionDay || !newMealName.trim()) return;

    const { data, error } = await supabase
      .from("meals")
      .insert({
        user_id: user?.id,
        nutrition_day_id: nutritionDay.id,
        name: newMealName,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar refeição", variant: "destructive" });
      return;
    }

    setMeals([...meals, { id: data.id, name: data.name, foods: [] }]);
    setNewMealName("");
    setAddMealOpen(false);
    toast({ title: "Refeição adicionada" });
  };

  const handleAddFood = async () => {
    if (!selectedMealId || !newFood.name.trim()) return;

    const { data, error } = await supabase
      .from("food_items")
      .insert({
        meal_id: selectedMealId,
        name: newFood.name,
        quantity_text: newFood.quantity_text || null,
        calories: newFood.calories,
        protein: newFood.protein,
        carbs: newFood.carbs,
        fat: newFood.fat,
        fiber: newFood.fiber,
        source: "MANUAL",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao adicionar alimento", variant: "destructive" });
      return;
    }

    setMeals(
      meals.map((m) =>
        m.id === selectedMealId
          ? { ...m, foods: [...m.foods, data as FoodItem] }
          : m
      )
    );

    setNewFood({ name: "", quantity_text: "", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    setAddFoodOpen(false);
    setSelectedMealId(null);
    
    // Update totals
    setTimeout(updateNutritionTotals, 100);
    toast({ title: "Alimento adicionado" });
  };

  const handleDeleteFood = async (mealId: string, foodId: string) => {
    await supabase.from("food_items").delete().eq("id", foodId);
    setMeals(
      meals.map((m) =>
        m.id === mealId
          ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) }
          : m
      )
    );
    setTimeout(updateNutritionTotals, 100);
  };

  const handleDeleteMeal = async (mealId: string) => {
    await supabase.from("meals").delete().eq("id", mealId);
    setMeals(meals.filter((m) => m.id !== mealId));
    setTimeout(updateNutritionTotals, 100);
    toast({ title: "Refeição excluída" });
  };

  // Calculate totals from current meals
  const totals = meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((food) => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
        acc.fiber += food.fiber;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const targets = {
    calories: nutritionDay?.target_calories || defaultTargets.calories,
    protein: nutritionDay?.target_protein || defaultTargets.protein,
    carbs: nutritionDay?.target_carbs || defaultTargets.carbs,
    fat: nutritionDay?.target_fat || defaultTargets.fat,
    fiber: nutritionDay?.target_fiber || defaultTargets.fiber,
  };

  const getProgress = (current: number, target: number) =>
    Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dieta</h1>
          <p className="text-muted-foreground">
            Você é o que você come.
          </p>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between cave-card p-4">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-medium">{isToday(selectedDate) ? "Hoje" : format(selectedDate, "EEEE", { locale: ptBR })}</p>
          <p className="text-sm text-muted-foreground">{format(selectedDate, "dd/MM/yyyy")}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Macros Summary */}
      <div className="cave-card p-6">
        <h2 className="font-semibold mb-4">Resumo do Dia</h2>
        
        {/* Calories */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Calorias</span>
            <span>
              {totals.calories} / {targets.calories} kcal
            </span>
          </div>
          <Progress value={getProgress(totals.calories, targets.calories)} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            Restam {Math.max(0, targets.calories - totals.calories)} kcal
          </p>
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Proteína</span>
              <span>{totals.protein}g</span>
            </div>
            <Progress value={getProgress(totals.protein, targets.protein)} className="h-2" />
            <p className="text-xs text-muted-foreground">Meta: {targets.protein}g</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Carboidratos</span>
              <span>{totals.carbs}g</span>
            </div>
            <Progress value={getProgress(totals.carbs, targets.carbs)} className="h-2" />
            <p className="text-xs text-muted-foreground">Meta: {targets.carbs}g</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gordura</span>
              <span>{totals.fat}g</span>
            </div>
            <Progress value={getProgress(totals.fat, targets.fat)} className="h-2" />
            <p className="text-xs text-muted-foreground">Meta: {targets.fat}g</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fibra</span>
              <span>{totals.fiber}g</span>
            </div>
            <Progress value={getProgress(totals.fiber, targets.fiber)} className="h-2" />
            <p className="text-xs text-muted-foreground">Meta: {targets.fiber}g</p>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="cave-card p-4 animate-pulse">
                <div className="h-5 w-1/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="empty-state">
            <UtensilsCrossed className="empty-state-icon" />
            <h3 className="empty-state-title">Nenhuma refeição</h3>
            <p className="empty-state-description">
              Adicione sua primeira refeição do dia
            </p>
            <Button onClick={() => setAddMealOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Refeição
            </Button>
          </div>
        ) : (
          <>
            {meals.map((meal) => (
              <div key={meal.id} className="cave-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{meal.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMealId(meal.id);
                        setAddFoodOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Alimento
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteMeal(meal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {meal.foods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum alimento adicionado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {meal.foods.map((food) => (
                      <div
                        key={food.id}
                        className="flex items-center justify-between p-2 rounded-md bg-secondary/50 group"
                      >
                        <div>
                          <p className="text-sm font-medium">{food.name}</p>
                          {food.quantity_text && (
                            <p className="text-xs text-muted-foreground">
                              {food.quantity_text}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-muted-foreground">
                            {food.calories} kcal
                          </p>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={() => handleDeleteFood(meal.id, food.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setAddMealOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Refeição
            </Button>
          </>
        )}
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={addMealOpen} onOpenChange={setAddMealOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Refeição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da refeição</Label>
              <Input
                placeholder="Ex: Café da manhã, Almoço, Jantar..."
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddMeal} disabled={!newMealName.trim()}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Food Dialog */}
      <Dialog open={addFoodOpen} onOpenChange={setAddFoodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Arroz branco"
                value={newFood.name}
                onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                placeholder="Ex: 200g, 1 prato"
                value={newFood.quantity_text}
                onChange={(e) => setNewFood({ ...newFood, quantity_text: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calorias (kcal)</Label>
                <Input
                  type="number"
                  value={newFood.calories}
                  onChange={(e) => setNewFood({ ...newFood, calories: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Proteína (g)</Label>
                <Input
                  type="number"
                  value={newFood.protein}
                  onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Carboidratos (g)</Label>
                <Input
                  type="number"
                  value={newFood.carbs}
                  onChange={(e) => setNewFood({ ...newFood, carbs: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gordura (g)</Label>
                <Input
                  type="number"
                  value={newFood.fat}
                  onChange={(e) => setNewFood({ ...newFood, fat: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fibra (g)</Label>
              <Input
                type="number"
                value={newFood.fiber}
                onChange={(e) => setNewFood({ ...newFood, fiber: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddFood} disabled={!newFood.name.trim()}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
