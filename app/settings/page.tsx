"use client";

import { useEffect, useMemo, useState } from "react";
import type { GymcutData, UserSettings } from "@/src/lib";
import {
  clearGymcutData,
  defaultSettings,
  exportGymcutData,
  getSettings,
  importGymcutData,
  saveSettings
} from "@/src/lib";

type ImportPreview = {
  counts: {
    workoutTemplates: number;
    workoutSessions: number;
    dietDays: number;
    weighIns: number;
  };
  raw: string;
};

const previewFromJson = (json: string): ImportPreview | null => {
  try {
    const parsed = JSON.parse(json) as Partial<GymcutData>;
    return {
      raw: json,
      counts: {
        workoutTemplates: Array.isArray(parsed.workoutTemplates)
          ? parsed.workoutTemplates.length
          : 0,
        workoutSessions: Array.isArray(parsed.workoutSessions)
          ? parsed.workoutSessions.length
          : 0,
        dietDays: Array.isArray(parsed.dietDays) ? parsed.dietDays.length : 0,
        weighIns: Array.isArray(parsed.weighIns) ? parsed.weighIns.length : 0
      }
    };
  } catch {
    return null;
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);

  useEffect(() => {
    const load = async () => {
      const stored = await getSettings();
      setSettings(stored);
    };
    void load();
  }, []);

  const handleChange = (field: keyof UserSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  };

  const saveDefaults = async () => {
    await saveSettings(settings);
    setSaveStatus("saved");
  };

  const exportJson = async () => {
    const json = await exportGymcutData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gymcut-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    setImportPreview(previewFromJson(text));
    setImportConfirmed(false);
  };

  const importJson = async () => {
    if (!importPreview) return;
    if (!importConfirmed) return;
    await importGymcutData(importPreview.raw);
    setImportPreview(null);
    setImportConfirmed(false);
  };

  const resetData = async () => {
    if (!resetArmed) return;
    const confirmed = window.confirm(
      "Sei sicuro? Questa azione elimina tutti i dati salvati."
    );
    if (!confirmed) return;
    await clearGymcutData();
    setResetArmed(false);
  };

  const settingsSummary = useMemo(
    () =>
      `${settings.caloriesTarget} kcal · P ${settings.proteinTarget}g · C ${settings.carbsTarget}g · F ${settings.fatTarget}g`,
    [settings]
  );

  return (
    <main className="settings-page">
      <header className="page-header">
        <p className="eyebrow">GymCut Companion</p>
        <h1>Settings</h1>
        <p className="subtitle">
          Personalizza i target e gestisci i backup dei tuoi dati.
        </p>
      </header>

      <section className="section">
        <div className="section-header">
          <h2>Target default</h2>
          <p>Valori base applicati alle nuove giornate dieta.</p>
        </div>
        <div className="card form-card">
          <div className="macro-grid">
            <label className="field">
              <span>Calorie</span>
              <input
                type="number"
                min={0}
                value={settings.caloriesTarget}
                onChange={(event) =>
                  handleChange("caloriesTarget", Number(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>Proteine</span>
              <input
                type="number"
                min={0}
                value={settings.proteinTarget}
                onChange={(event) =>
                  handleChange("proteinTarget", Number(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>Carboidrati</span>
              <input
                type="number"
                min={0}
                value={settings.carbsTarget}
                onChange={(event) =>
                  handleChange("carbsTarget", Number(event.target.value))
                }
              />
            </label>
            <label className="field">
              <span>Grassi</span>
              <input
                type="number"
                min={0}
                value={settings.fatTarget}
                onChange={(event) =>
                  handleChange("fatTarget", Number(event.target.value))
                }
              />
            </label>
          </div>
          <div className="settings-summary">
            <span className="card-helper">{settingsSummary}</span>
            <span className="chip">{settings.weightUnit.toUpperCase()}</span>
          </div>
          <div className="button-row">
            <button className="cta-button" type="button" onClick={saveDefaults}>
              Salva target
            </button>
            {saveStatus === "saved" ? (
              <p className="card-helper">Salvato.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Backup</h2>
          <p>Esporta o importa i dati in JSON.</p>
        </div>
        <div className="card form-card">
          <button className="secondary-button" type="button" onClick={exportJson}>
            Esporta JSON
          </button>
          <div className="field">
            <span>Importa JSON</span>
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleImportFile(file);
                }
              }}
            />
          </div>
          {importPreview ? (
            <div className="import-preview">
              <p className="card-value">Anteprima import</p>
              <p className="card-helper">
                Template: {importPreview.counts.workoutTemplates} · Sessioni: {""}
                {importPreview.counts.workoutSessions} · Giorni dieta: {""}
                {importPreview.counts.dietDays} · Weigh-ins: {""}
                {importPreview.counts.weighIns}
              </p>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={importConfirmed}
                  onChange={(event) => setImportConfirmed(event.target.checked)}
                />
                <span>Confermo l'importazione e il merge dei dati.</span>
              </label>
              <button className="cta-button" type="button" onClick={importJson}>
                Importa dati
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Reset dati</h2>
          <p>Elimina tutti i dati locali. Azione irreversibile.</p>
        </div>
        <div className="card form-card">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setResetArmed(true)}
          >
            Avvia reset
          </button>
          {resetArmed ? (
            <div className="reset-warning">
              <p className="card-value">Conferma finale</p>
              <p className="card-helper">
                Questo cancellerà allenamenti, diete e pesi.
              </p>
              <button className="cta-button" type="button" onClick={resetData}>
                Conferma reset
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setResetArmed(false)}
              >
                Annulla
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
