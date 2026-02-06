"use client";

import { useEffect, useMemo, useState } from "react";
import type { WeighIn } from "@/src/lib";
import { exportWeighInsCsv, listWeighIns, upsertWeighIn } from "@/src/lib";

const todayIso = () => new Date().toISOString().slice(0, 10);

const movingAverage = (values: number[], windowSize: number) => {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = values.slice(start, index + 1);
    const sum = slice.reduce((acc, value) => acc + value, 0);
    return Number((sum / slice.length).toFixed(1));
  });
};

export default function ProgressPage() {
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [form, setForm] = useState({
    date: todayIso(),
    weightKg: 0,
    notes: ""
  });

  const loadWeighIns = async () => {
    const data = await listWeighIns();
    setWeighIns(data);
  };

  useEffect(() => {
    void loadWeighIns();
  }, []);

  const sortedWeighIns = useMemo(
    () => [...weighIns].sort((a, b) => a.date.localeCompare(b.date)),
    [weighIns]
  );

  const weights = sortedWeighIns.map((entry) => entry.weightKg);
  const average = movingAverage(weights, 3);

  const maxWeight = Math.max(1, ...weights, ...average);

  const saveWeighIn = async () => {
    if (!form.date || form.weightKg <= 0) return;
    await upsertWeighIn({
      date: form.date,
      weightKg: form.weightKg,
      notes: form.notes
    });
    setForm({ date: todayIso(), weightKg: 0, notes: "" });
    await loadWeighIns();
  };

  const downloadCsv = async () => {
    const csv = await exportWeighInsCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gymcut-weigh-ins.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="progress-page">
      <header className="page-header">
        <p className="eyebrow">GymCut Companion</p>
        <h1>Progress</h1>
        <p className="subtitle">Registra il peso e monitora l'andamento.</p>
      </header>

      <section className="section">
        <div className="section-header">
          <h2>Inserisci peso</h2>
          <p>Aggiungi una pesata con eventuali note.</p>
        </div>
        <div className="card form-card">
          <label className="field">
            <span>Data</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value }))
              }
            />
          </label>
          <label className="field">
            <span>Peso (kg)</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.weightKg}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  weightKg: Number(event.target.value)
                }))
              }
            />
          </label>
          <label className="field">
            <span>Note</span>
            <input
              type="text"
              placeholder="Come ti senti oggi?"
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </label>
          <div className="button-row">
            <button className="cta-button" type="button" onClick={saveWeighIn}>
              Salva peso
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Grafico peso</h2>
          <p>Andamento con media mobile 3 misurazioni.</p>
        </div>
        <div className="card chart-card">
          {sortedWeighIns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <div>
                <p className="empty-title">Nessun peso registrato</p>
                <p className="empty-description">
                  Inserisci il primo peso per vedere il grafico.
                </p>
              </div>
            </div>
          ) : (
            <div className="progress-chart">
              {sortedWeighIns.map((entry, index) => {
                const height = `${Math.round((entry.weightKg / maxWeight) * 100)}%`;
                const avgHeight = `${Math.round((average[index] / maxWeight) * 100)}%`;
                return (
                  <div className="progress-bar" key={entry.date}>
                    <div className="bar" style={{ height }} />
                    <div className="avg-bar" style={{ height: avgHeight }} />
                    <span>{entry.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Export</h2>
          <p>Scarica i weigh-in in CSV.</p>
        </div>
        <div className="card form-card">
          <button className="cta-button" type="button" onClick={downloadCsv}>
            Export CSV
          </button>
        </div>
      </section>
    </main>
  );
}
