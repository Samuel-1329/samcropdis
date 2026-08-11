import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  Bell,
  CloudSun,
  Layers,
  Leaf,
  Map as MapIcon,
  Settings as SettingsIcon,
  Sprout,
  History as HistoryIcon,
  Play,
} from "lucide-react";
import { FarmProvider, useFarm } from "@/components/FarmProvider";
import { CropDoctor } from "@/components/panels/CropDoctor";
import {
  AlertsPanel,
  HistoryPanel,
  MapPanel,
  Overview,
  RiskPanel,
  SettingsPanel,
  SoilPanel,
  WeatherPanel,
} from "@/components/panels/Sections";
import { SourceChip } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "AgriShield AI Dashboard — Crop Disease & Weather Advisory" },
      {
        name: "description",
        content:
          "Diagnose crop disease from a leaf photo and combine it with live weather, soil and risk engines for a weather-aware farm advisory.",
      },
      { property: "og:title", content: "AgriShield AI Dashboard" },
      {
        property: "og:description",
        content: "Live crop disease diagnosis, weather intelligence, disease risk and spray safety in one console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <FarmProvider>
      <DashboardShell />
    </FarmProvider>
  ),
});

const TABS = [
  { id: "overview", icon: Activity, key: "overview" },
  { id: "doctor", icon: Leaf, key: "cropDoctor" },
  { id: "weather", icon: CloudSun, key: "weather" },
  { id: "risk", icon: Sprout, key: "risk" },
  { id: "map", icon: MapIcon, key: "map" },
  { id: "soil", icon: Layers, key: "soil" },
  { id: "history", icon: HistoryIcon, key: "history" },
  { id: "alerts", icon: Bell, key: "alerts" },
  { id: "settings", icon: SettingsIcon, key: "settings" },
] as const;

function DashboardShell() {
  const { t, lang, setLang } = useI18n();
  const farm = useFarm();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [presenting, setPresenting] = useState(false);

  function runPresentation() {
    setPresenting(true);
    farm.loadDemoScenario();
    const steps: [number, (typeof TABS)[number]["id"]][] = [
      [0, "doctor"],
      [14000, "overview"],
      [28000, "weather"],
      [42000, "risk"],
      [56000, "map"],
      [70000, "history"],
      [84000, "overview"],
    ];
    steps.forEach(([ms, id]) => setTimeout(() => setTab(id), ms));
    setTimeout(() => setPresenting(false), 90000);
  }

  return (
    <div className="min-h-screen hero-gradient">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Sprout className="size-5 text-primary" />
            {t("brand")}
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SourceChip
              label="Weather"
              value={farm.weather?.source === "DEMO" ? "Demo" : "Open-Meteo"}
              live={!!farm.weather && farm.weather.source !== "DEMO"}
            />
            <SourceChip label="Diagnosis" value={farm.demo ? "Demo" : "AI Vision"} live={!farm.demo} />
            <SourceChip
              label="Soil"
              value={farm.soil?.source ?? "unavailable"}
              live={farm.soil?.source === "SoilGrids (ISRIC)"}
            />
            <Button size="sm" variant="secondary" onClick={() => setLang(lang === "en" ? "te" : "en")}>
              {lang === "en" ? "తెలుగు" : "English"}
            </Button>
            <Button size="sm" onClick={runPresentation} disabled={presenting}>
              <Play className="size-4" /> {t("presentation")}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] gap-5 px-4 py-5">
        <nav aria-label="Dashboard sections" className="hidden w-56 shrink-0 lg:block">
          <ul className="glass sticky top-20 space-y-1 rounded-2xl p-2">
            {TABS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setTab(s.id)}
                  aria-current={tab === s.id ? "page" : undefined}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                    tab === s.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <s.icon className="size-4" />
                  {t(s.key)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {TABS.map((s) => (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                  tab === s.id ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface/60"
                }`}
              >
                {t(s.key)}
              </button>
            ))}
          </div>

          {farm.demo && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-2 text-xs font-semibold tracking-wide text-warning uppercase">
              {t("demoData")} — demo farm in Andhra Pradesh with simulated weather
            </div>
          )}

          {tab === "overview" && <Overview />}
          {tab === "doctor" && <CropDoctor />}
          {tab === "weather" && <WeatherPanel />}
          {tab === "risk" && <RiskPanel />}
          {tab === "map" && <MapPanel />}
          {tab === "soil" && <SoilPanel />}
          {tab === "history" && <HistoryPanel />}
          {tab === "alerts" && <AlertsPanel />}
          {tab === "settings" && <SettingsPanel />}

          <p className="pb-8 text-xs text-muted-foreground">{t("disclaimer")}</p>
        </main>
      </div>
    </div>
  );
}
