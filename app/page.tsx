import ChartCard from "@/components/ChartCard";
import CtaButton from "@/components/CtaButton";
import EmptyState from "@/components/EmptyState";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short"
  });

export default function DashboardPage() {
  const lastWorkout = null;
  const dietStatus: "OK" | "DA RIVEDERE" | null = null;
  const lastWeighIn = null;

  const weightSeries: { date: string; value: number }[] = [];
  const calorieSeries: { date: string; value: number; target: number }[] = [];

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <p className="eyebrow">GymCut Companion</p>
        <h1>Dashboard</h1>
        <p className="subtitle">Panoramica di oggi e accessi rapidi.</p>
      </header>

      <section className="section">
        <SectionHeader
          title="Oggi"
          subtitle="Ultimo allenamento, dieta e peso registrato."
        />
        <div className="card-grid">
          <StatCard
            label="Ultimo allenamento"
            value={lastWorkout ? lastWorkout : "Nessun allenamento"}
            helper="Aggiungi una sessione per iniziare."
          />
          <StatCard
            label="Stato dieta"
            value={dietStatus ? dietStatus : "Da compilare"}
            helper="Compila i target di oggi."
          />
          <StatCard
            label="Ultimo peso"
            value={lastWeighIn ? lastWeighIn : "Nessuna pesata"}
            helper="Inserisci una pesata recente."
          />
        </div>
      </section>

      <section className="section">
        <SectionHeader
          title="Peso"
          subtitle="Ultimi 30 giorni"
        />
        {weightSeries.length === 0 ? (
          <EmptyState
            title="Nessun peso registrato"
            description="Aggiungi una pesata per visualizzare il grafico delle ultime settimane."
          />
        ) : (
          <ChartCard
            title="Peso"
            subtitle="Andamento ultimi 30 giorni"
            unit="kg"
            labels={weightSeries.map((item) => formatDate(item.date))}
            values={weightSeries.map((item) => item.value)}
          />
        )}
      </section>

      <section className="section">
        <SectionHeader
          title="Calorie vs Target"
          subtitle="Ultimi 7 giorni"
        />
        {calorieSeries.length === 0 ? (
          <EmptyState
            title="Nessun giorno dieta"
            description="Registra i pasti per confrontare le calorie con il target settimanale."
          />
        ) : (
          <ChartCard
            title="Calorie"
            subtitle="Consumo vs target"
            unit="kcal"
            labels={calorieSeries.map((item) => formatDate(item.date))}
            values={calorieSeries.map((item) => item.value)}
          />
        )}
      </section>

      <section className="section">
        <SectionHeader title="Azioni rapide" />
        <div className="cta-grid">
          <CtaButton label="Aggiungi Allenamento" helper="Nuova sessione" />
          <CtaButton label="Compila Dieta Oggi" helper="Target e pasti" />
          <CtaButton label="Inserisci Peso" helper="Pesata veloce" />
        </div>
      </section>
    </main>
  );
}
