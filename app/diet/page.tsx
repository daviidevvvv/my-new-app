"use client";

import { useEffect, useMemo, useState } from "react";
import type { DietDay, Meal } from "@/src/lib";
import { listDietDays, upsertDietDay } from "@/src/lib";

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDay = (date: string): DietDay => ({
  date,
  caloriesTarget: 2000,
  proteinTarget: 140,
  carbsTarget: 220,
  fatTarget: 60,
  meals: [],
  verdict: "OK",
  notes: ""
});

const sumMeals = (meals: Meal[]) =>
  meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

const computeVerdict = (day: DietDay) => {
  const totals = sumMeals(day.meals);
  const caloriesOver = totals.calories > day.caloriesTarget * 1.1;
  const proteinLow = totals.protein < day.proteinTarget * 0.9;
  return caloriesOver || proteinLow ? "DA RIVEDERE" : "OK";
};

export default function DietPage() {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [dietDays, setDietDays] = useState<DietDay[]>([]);
  const [currentDay, setCurrentDay] = useState<DietDay>(emptyDay(todayIso()));
  const [mealForm, setMealForm] = useState<Meal>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [manualVerdict, setManualVerdict] = useState<"" | "OK" | "DA RIVEDERE">(
    ""
  );

  const loadDays = async () => {
    const data = await listDietDays();
    setDietDays(data);
  };

  useEffect(() => {
    void loadDays();
  }, []);

  useEffect(() => {
    const existing = dietDays.find((day) => day.date === selectedDate);
    setCurrentDay(existing ? { ...existing } : emptyDay(selectedDate));
    setManualVerdict("");
  }, [dietDays, selectedDate]);

  const totals = useMemo(() => sumMeals(currentDay.meals), [currentDay.meals]);

  const handleTargetChange = (
    field: "caloriesTarget" | "proteinTarget" | "carbsTarget" | "fatTarget",
    value: number
  ) => {
    setCurrentDay((prev) => ({ ...prev, [field]: value }));
  };

  const addMeal = () => {
    if (!mealForm.name.trim()) return;
    setCurrentDay((prev) => ({
      ...prev,
      meals: [...prev.meals, { ...mealForm }]
    }));
    setMealForm({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const removeMeal = (index: number) => {
    setCurrentDay((prev) => ({
      ...prev,
      meals: prev.meals.filter((_, idx) => idx !== index)
    }));
  };

  const saveDay = async (verdictOverride?: "OK" | "DA RIVEDERE") => {
    const verdict = verdictOverride ?? currentDay.verdict;
    const dayToSave = { ...currentDay, verdict };
    await upsertDietDay(dayToSave);
    await loadDays();
  };

  const verifyDay = async () => {
    const autoVerdict = computeVerdict(currentDay);
    const finalVerdict = manualVerdict || autoVerdict;
    setCurrentDay((prev) => ({ ...prev, verdict: finalVerdict }));
    await saveDay(finalVerdict);
  };

  const history = [...dietDays].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="diet-page">
      <header className="page-header">
        <p className="eyebrow">GymCut Companion</p>
        <h1>Diet</h1>
        <p className="subtitle">
          Pianifica i macro, registra i pasti e verifica la giornata.
        </p>
      </header>

      <section className="section">
        <div className="section-header">
          <h2>Oggi</h2>
          <p>Target e pasti della giornata selezionata.</p>
        </div>
        <div className="card form-card">
          <label className="field">
            <span>Data</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <div className="macro-grid">
            <label className="field">
              <span>Calorie target</span>
              <input
                type="number"
                min={0}
                value={currentDay.caloriesTarget}
                onChange={(event) =>
                  handleTargetChange(
                    "caloriesTarget",
                    Number(event.target.value)
                  )
                }
              />
            </label>
            <label className="field">
              <span>Proteine target</span>
              <input
                type="number"
                min={0}
                value={currentDay.proteinTarget}
                onChange={(event) =>
                  handleTargetChange(
                    "proteinTarget",
                    Number(event.target.value)
                  )
                }
              />
            </label>
            <label className="field">
              <span>Carbo target</span>
              <input
                type="number"
                min={0}
                value={currentDay.carbsTarget}
                onChange={(event) =>
                  handleTargetChange("carbsTarget", Number(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>Grassi target</span>
              <input
                type="number"
                min={0}
                value={currentDay.fatTarget}
                onChange={(event) =>
                  handleTargetChange("fatTarget", Number(event.target.value))
                }
              />
            </label>
          </div>

          <div className="macro-summary">
            <div>
              <p className="card-label">Totale</p>
              <p className="card-value">{totals.calories} kcal</p>
              <p className="card-helper">
                P {totals.protein}g · C {totals.carbs}g · F {totals.fat}g
              </p>
            </div>
            <div className="macro-badge">
              <span>{currentDay.verdict}</span>
            </div>
          </div>

          <div className="field-group">
            <div className="field-group-header">
              <span>Pasti rapidi</span>
              <button className="ghost-button" type="button" onClick={addMeal}>
                + Aggiungi pasto
              </button>
            </div>
            <div className="meal-form">
              <input
                type="text"
                placeholder="Nome pasto"
                value={mealForm.name}
                onChange={(event) =>
                  setMealForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <input
                type="number"
                min={0}
                placeholder="kcal"
                value={mealForm.calories}
                onChange={(event) =>
                  setMealForm((prev) => ({
                    ...prev,
                    calories: Number(event.target.value)
                  }))
                }
              />
              <input
                type="number"
                min={0}
                placeholder="Proteine"
                value={mealForm.protein}
                onChange={(event) =>
                  setMealForm((prev) => ({
                    ...prev,
                    protein: Number(event.target.value)
                  }))
                }
              />
              <input
                type="number"
                min={0}
                placeholder="Carbo"
                value={mealForm.carbs}
                onChange={(event) =>
                  setMealForm((prev) => ({
                    ...prev,
                    carbs: Number(event.target.value)
                  }))
                }
              />
              <input
                type="number"
                min={0}
                placeholder="Grassi"
                value={mealForm.fat}
                onChange={(event) =>
                  setMealForm((prev) => ({
                    ...prev,
                    fat: Number(event.target.value)
                  }))
                }
              />
            </div>
            {currentDay.meals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◎</div>
                <div>
                  <p className="empty-title">Nessun pasto registrato</p>
                  <p className="empty-description">
                    Inserisci un pasto per iniziare la giornata.
                  </p>
                </div>
              </div>
            ) : (
              <div className="meal-list">
                {currentDay.meals.map((meal, index) => (
                  <div className="meal-card" key={`${meal.name}-${index}`}>
                    <div>
                      <p className="card-value">{meal.name}</p>
                      <p className="card-helper">
                        {meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g ·
                        F {meal.fat}g
                      </p>
                    </div>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => removeMeal(index)}
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="field">
            <span>Override manuale</span>
            <select
              value={manualVerdict}
              onChange={(event) =>
                setManualVerdict(
                  event.target.value as "" | "OK" | "DA RIVEDERE"
                )
              }
            >
              <option value="">Auto (consigliato)</option>
              <option value="OK">OK</option>
              <option value="DA RIVEDERE">DA RIVEDERE</option>
            </select>
          </div>

          <div className="button-row">
            <button className="cta-button" type="button" onClick={verifyDay}>
              Verifica giornata
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Storico giorni</h2>
          <p>Calendario rapido degli ultimi giorni registrati.</p>
        </div>
        <div className="card form-card">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <div>
                <p className="empty-title">Nessuna giornata salvata</p>
                <p className="empty-description">
                  Compila oggi per vedere lo storico.
                </p>
              </div>
            </div>
          ) : (
            <div className="history-list">
              {history.map((day) => (
                <div className="history-card" key={day.date}>
                  <div>
                    <p className="card-value">{day.date}</p>
                    <p className="card-helper">
                      {day.meals.length} pasti · {day.caloriesTarget} kcal target
                    </p>
                  </div>
                  <span className="chip">{day.verdict}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
