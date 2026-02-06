"use client";

import { useEffect, useMemo, useState } from "react";
import type { WorkoutEntry, WorkoutSession, WorkoutTemplate } from "@/src/lib";
import {
  createWorkoutSession,
  createWorkoutTemplate,
  listWorkoutSessions,
  listWorkoutTemplates,
  updateWorkoutTemplate
} from "@/src/lib";

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyTemplate = (): Omit<WorkoutTemplate, "id"> => ({
  name: "",
  exercises: [{ id: crypto.randomUUID(), name: "" }]
});

export default function WorkoutPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] =
    useState<Omit<WorkoutTemplate, "id">>(emptyTemplate());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [sessionEntries, setSessionEntries] = useState<WorkoutEntry[]>([]);
  const [searchName, setSearchName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadData = async () => {
    const [templatesData, sessionsData] = await Promise.all([
      listWorkoutTemplates(),
      listWorkoutSessions()
    ]);
    setTemplates(templatesData);
    setSessions(sessionsData);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const template = templates.find((item) => item.id === selectedTemplateId);
    if (!template) {
      setSessionEntries([]);
      return;
    }
    const entries = template.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      sets: [{ reps: 0, weight: 0 }]
    }));
    setSessionEntries(entries);
  }, [selectedTemplateId, templates]);

  const templateNameById = useMemo(() => {
    return new Map(templates.map((template) => [template.id, template.name]));
  }, [templates]);

  const filteredSessions = sessions
    .filter((session) => {
      const templateName = templateNameById.get(session.templateId) ?? "";
      const matchesName = templateName
        .toLowerCase()
        .includes(searchName.toLowerCase());
      const matchesFrom = dateFrom ? session.date >= dateFrom : true;
      const matchesTo = dateTo ? session.date <= dateTo : true;
      return matchesName && matchesFrom && matchesTo;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const startEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateForm({
      name: template.name,
      exercises: template.exercises.map((exercise) => ({ ...exercise }))
    });
  };

  const resetTemplateForm = () => {
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplate());
  };

  const handleTemplateExerciseChange = (index: number, value: string) => {
    setTemplateForm((prev) => {
      const next = [...prev.exercises];
      next[index] = { ...next[index], name: value };
      return { ...prev, exercises: next };
    });
  };

  const addExercise = () => {
    setTemplateForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { id: crypto.randomUUID(), name: "" }]
    }));
  };

  const removeExercise = (index: number) => {
    setTemplateForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== index)
    }));
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) return;
    if (editingTemplateId) {
      await updateWorkoutTemplate({
        id: editingTemplateId,
        ...templateForm
      });
    } else {
      await createWorkoutTemplate(templateForm);
    }
    resetTemplateForm();
    await loadData();
  };

  const updateSet = (
    entryIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: number
  ) => {
    setSessionEntries((prev) => {
      const next = [...prev];
      const entry = next[entryIndex];
      const sets = [...entry.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      next[entryIndex] = { ...entry, sets };
      return next;
    });
  };

  const addSet = (entryIndex: number) => {
    setSessionEntries((prev) => {
      const next = [...prev];
      const entry = next[entryIndex];
      next[entryIndex] = {
        ...entry,
        sets: [...entry.sets, { reps: 0, weight: 0 }]
      };
      return next;
    });
  };

  const saveSession = async () => {
    if (!selectedTemplateId || sessionEntries.length === 0) return;
    await createWorkoutSession({
      date: todayIso(),
      templateId: selectedTemplateId,
      entries: sessionEntries,
      notes: ""
    });
    setSelectedTemplateId("");
    setSessionEntries([]);
    await loadData();
  };

  return (
    <main className="workout-page">
      <header className="page-header">
        <p className="eyebrow">GymCut Companion</p>
        <h1>Workout</h1>
        <p className="subtitle">
          Gestisci template, avvia sessioni e controlla lo storico.
        </p>
      </header>

      <section className="section">
        <div className="section-header">
          <h2>Template allenamenti</h2>
          <p>Seleziona un template per modificarlo o avviare una sessione.</p>
        </div>
        <div className="template-list">
          {templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <div>
                <p className="empty-title">Nessun template</p>
                <p className="empty-description">
                  Crea il tuo primo template per iniziare.
                </p>
              </div>
            </div>
          ) : (
            templates.map((template) => (
              <button
                className="template-card"
                key={template.id}
                type="button"
                onClick={() => {
                  startEditTemplate(template);
                  setSelectedTemplateId(template.id);
                }}
              >
                <div>
                  <p className="card-value">{template.name}</p>
                  <p className="card-helper">
                    {template.exercises.length} esercizi
                  </p>
                </div>
                <span className="chip">Modifica</span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{editingTemplateId ? "Modifica template" : "Nuovo template"}</h2>
          <p>Nome e lista esercizi.</p>
        </div>
        <div className="card form-card">
          <label className="field">
            <span>Nome template</span>
            <input
              type="text"
              placeholder="Es. Spinta + Core"
              value={templateForm.name}
              onChange={(event) =>
                setTemplateForm((prev) => ({
                  ...prev,
                  name: event.target.value
                }))
              }
            />
          </label>
          <div className="field-group">
            <div className="field-group-header">
              <span>Esercizi</span>
              <button className="ghost-button" type="button" onClick={addExercise}>
                + Aggiungi
              </button>
            </div>
            {templateForm.exercises.map((exercise, index) => (
              <div className="inline-row" key={exercise.id}>
                <input
                  type="text"
                  placeholder={`Esercizio ${index + 1}`}
                  value={exercise.name}
                  onChange={(event) =>
                    handleTemplateExerciseChange(index, event.target.value)
                  }
                />
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => removeExercise(index)}
                >
                  Rimuovi
                </button>
              </div>
            ))}
          </div>
          <div className="button-row">
            <button className="cta-button" type="button" onClick={saveTemplate}>
              Salva template
            </button>
            {editingTemplateId ? (
              <button
                className="secondary-button"
                type="button"
                onClick={resetTemplateForm}
              >
                Annulla modifica
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Avvia sessione</h2>
          <p>Seleziona un template e inserisci i set.</p>
        </div>
        <div className="card form-card">
          <label className="field">
            <span>Template</span>
            <select
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
            >
              <option value="">Seleziona template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          {sessionEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <div>
                <p className="empty-title">Nessuna sessione attiva</p>
                <p className="empty-description">
                  Scegli un template per iniziare a registrare i set.
                </p>
              </div>
            </div>
          ) : (
            <div className="session-entries">
              {sessionEntries.map((entry, entryIndex) => {
                const exercise = templates
                  .find((template) => template.id === selectedTemplateId)
                  ?.exercises.find((item) => item.id === entry.exerciseId);
                return (
                  <div className="session-entry" key={entry.exerciseId}>
                    <div className="entry-header">
                      <p className="card-value">{exercise?.name ?? "Esercizio"}</p>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => addSet(entryIndex)}
                      >
                        + Aggiungi set
                      </button>
                    </div>
                    {entry.sets.map((set, setIndex) => (
                      <div
                        className="inline-row"
                        key={`${entry.exerciseId}-${setIndex}`}
                      >
                        <input
                          type="number"
                          min={0}
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(event) =>
                            updateSet(
                              entryIndex,
                              setIndex,
                              "reps",
                              Number(event.target.value)
                            )
                          }
                        />
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          placeholder="Kg"
                          value={set.weight}
                          onChange={(event) =>
                            updateSet(
                              entryIndex,
                              setIndex,
                              "weight",
                              Number(event.target.value)
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
          <button className="cta-button" type="button" onClick={saveSession}>
            Salva sessione (oggi)
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Storico sessioni</h2>
          <p>Filtra per template o intervallo date.</p>
        </div>
        <div className="card form-card">
          <div className="inline-row">
            <input
              type="text"
              placeholder="Cerca template"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
          {filteredSessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <div>
                <p className="empty-title">Nessuna sessione salvata</p>
                <p className="empty-description">
                  Registra un allenamento per popolare lo storico.
                </p>
              </div>
            </div>
          ) : (
            <div className="session-history">
              {filteredSessions.map((session) => (
                <div className="history-card" key={session.id}>
                  <div>
                    <p className="card-value">
                      {templateNameById.get(session.templateId) ?? "Template"}
                    </p>
                    <p className="card-helper">{session.date}</p>
                  </div>
                  <p className="chip">{session.entries.length} esercizi</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
