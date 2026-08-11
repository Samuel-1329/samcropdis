import { useMemo, useState } from "react";
import { Panel, Metric, RiskPill, ScoreRing, Bar, Empty, SourceChip } from "@/components/ui-kit";
import { Farm3D } from "@/components/three/Farm3D";
import { useFarm, useIntelligence } from "@/components/FarmProvider";
import { LocationPicker } from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function Overview() {
  const { t } = useI18n();
  const farm = useFarm();
  const intel = useIntelligence();
  const raining = (farm.weather?.hourly[0]?.precipProb ?? 0) > 50;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <Panel title="Farm command view" subtitle="Colour reflects current disease risk" className="p-0 overflow-hidden">
          <div className="h-[340px] w-full sm:h-[420px]">
            <Farm3D risk={intel.risk.current.level} raining={raining} />
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title={t("farmHealth")}>
            <div className="flex items-center gap-5">
              <ScoreRing score={intel.health.score} label={t("farmHealth")} />
              <ul className="space-y-1 text-xs text-muted-foreground">
                {intel.health.factors.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel title="Status" right={<RiskPill level={intel.risk.current.level} />}>
            <div className="space-y-2 text-sm">
              <p>
                🌾 <span className="font-medium">{farm.crop}</span>
              </p>
              <p>📍 {farm.location ? farm.location.label : "No location selected"}</p>
              <p>
                {raining ? "🌧 Rain expected" : "☀ No rain expected soon"} ·{" "}
                {farm.weather ? `${Math.round(farm.weather.now.temperature)}°C` : "weather unavailable"}
              </p>
              <p className="pt-2 text-xs tracking-wide text-muted-foreground uppercase">{t("nextAction")}</p>
              <p className="font-medium">{intel.verdict.verdict} — {intel.verdict.explanation}</p>
              <p className="pt-2 text-xs tracking-wide text-muted-foreground uppercase">{t("bestWindow")}</p>
              <p className="font-medium">{intel.spray.window ?? "No clear window in the forecast"}</p>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Temperature" value={farm.weather ? Math.round(farm.weather.now.temperature) : "—"} unit="°C" />
        <Metric label="Humidity" value={farm.weather ? Math.round(farm.weather.now.humidity) : "—"} unit="%" tone="water" />
        <Metric label="Rain chance" value={farm.weather ? Math.round(farm.weather.now.precipitationProbability) : "—"} unit="%" tone="water" />
        <Metric label="Wind" value={farm.weather ? Math.round(farm.weather.now.windSpeed) : "—"} unit="km/h" tone="warning" />
      </div>

      <Panel title={t("forecast7")}>
        {farm.weather ? (
          <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {farm.weather.daily.map((d) => (
              <div key={d.date} className="rounded-xl border border-border bg-surface/60 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  {new Date(d.date).toLocaleDateString([], { weekday: "short" })}
                </p>
                <p className="font-mono text-sm">{Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°</p>
                <p className="font-mono text-xs text-water">{d.rainSum.toFixed(1)} mm</p>
                <p className="text-[11px] text-muted-foreground">{Math.round(d.precipProbMax)}% rain</p>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Weather temporarily unavailable.</Empty>
        )}
      </Panel>

      <Panel title={t("recent")}>
        {farm.history.length === 0 ? (
          <Empty>No scans yet. Open Crop Doctor to run your first diagnosis.</Empty>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {farm.history.slice(0, 6).map((s) => (
              <li key={s.id} className="flex gap-3 rounded-xl border border-border bg-surface/60 p-3">
                <img src={s.imageDataUrl} alt="" className="size-14 rounded-lg object-cover" loading="lazy" />
                <div className="text-xs">
                  <p className="font-medium">{s.diagnosis.disease}</p>
                  <p className="text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</p>
                  <p className="font-mono text-muted-foreground">
                    {Math.round(s.diagnosis.confidence)}% · {s.risk}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export function WeatherPanel() {
  const farm = useFarm();
  if (!farm.weather)
    return (
      <Panel title="Weather Intelligence">
        <Empty>Weather temporarily unavailable. Select a location or try again shortly.</Empty>
      </Panel>
    );
  const w = farm.weather;
  const today = w.daily[0];
  return (
    <div className="space-y-5">
      <Panel
        title="Current conditions"
        right={<SourceChip label="Weather" value={w.source === "DEMO" ? "Demo data" : "Open-Meteo"} live={w.source !== "DEMO"} />}
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Metric label="Temperature" value={Math.round(w.now.temperature)} unit="°C" />
          <Metric label="Humidity" value={Math.round(w.now.humidity)} unit="%" tone="water" />
          <Metric label="Rainfall" value={w.now.rainfall.toFixed(1)} unit="mm" tone="water" />
          <Metric label="Rain chance" value={Math.round(w.now.precipitationProbability)} unit="%" tone="water" />
          <Metric label="Wind" value={Math.round(w.now.windSpeed)} unit="km/h" tone="warning" />
          <Metric label="UV index" value={w.now.uv.toFixed(1)} tone="moderate" />
          <Metric label="Cloud cover" value={Math.round(w.now.cloudCover)} unit="%" />
          <Metric label="Daylight" value={w.now.isDay ? "Day" : "Night"} />
        </div>
        {today && (
          <p className="mt-4 text-sm text-muted-foreground">
            Sunrise {today.sunrise.slice(11, 16)} · Sunset {today.sunset.slice(11, 16)} · Timezone {w.timezone}
          </p>
        )}
      </Panel>

      <Panel title="Next 24 hours">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {w.hourly.slice(0, 24).map((h) => (
            <div key={h.time} className="min-w-[74px] rounded-xl border border-border bg-surface/60 p-2 text-center">
              <p className="text-[11px] text-muted-foreground">
                {new Date(h.time).toLocaleTimeString([], { hour: "numeric" })}
              </p>
              <p className="font-mono text-sm">{Math.round(h.temperature)}°</p>
              <p className="font-mono text-[11px] text-water">{Math.round(h.precipProb)}%</p>
              <p className="text-[10px] text-muted-foreground">{Math.round(h.wind)} km/h</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function RiskPanel() {
  const intel = useIntelligence();
  return (
    <div className="space-y-5">
      <Panel title="Disease risk engine" right={<RiskPill level={intel.risk.current.level} />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[intel.risk.current, ...intel.risk.windows].map((w) => (
            <Bar
              key={w.label}
              label={`${w.label} — ${w.level}`}
              value={w.score}
              tone={w.level === "LOW" ? "healthy" : w.level === "MODERATE" ? "warning" : w.level === "HIGH" ? "moderate" : "danger"}
            />
          ))}
        </div>
        <h3 className="mt-5 text-sm font-semibold">Why</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {intel.risk.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Panel>
      <Panel title="Spray safety engine">
        <p className="font-mono text-lg font-bold">{intel.spray.verdict}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {intel.spray.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          {intel.spray.window ? `Next suitable window: ${intel.spray.window}` : "No clearly suitable window in the forecast."}
        </p>
      </Panel>
    </div>
  );
}

export function MapPanel() {
  const farm = useFarm();
  const intel = useIntelligence();
  const bbox = useMemo(() => {
    if (!farm.location) return null;
    const { latitude: la, longitude: lo } = farm.location;
    const d = 0.15;
    return `${lo - d},${la - d},${lo + d},${la + d}`;
  }, [farm.location]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title="3D farm view" className="p-0 overflow-hidden">
        <div className="h-[360px] w-full">
          <Farm3D risk={intel.risk.current.level} raining={(farm.weather?.hourly[0]?.precipProb ?? 0) > 50} />
        </div>
      </Panel>
      <Panel title="Location map" subtitle="Pan and zoom · OpenStreetMap">
        {bbox && farm.location ? (
          <>
            <iframe
              title="Farm location map"
              className="h-[300px] w-full rounded-xl border border-border"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${farm.location.latitude},${farm.location.longitude}`}
              loading="lazy"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Metric label="Risk" value={intel.risk.current.level} />
              <Metric label="Temp" value={farm.weather ? Math.round(farm.weather.now.temperature) : "—"} unit="°C" />
              <Metric label="Rain" value={farm.weather ? farm.weather.now.rainfall.toFixed(1) : "—"} unit="mm" tone="water" />
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <Empty>Select a location to see it on the map.</Empty>
            <LocationPicker value={farm.location} onChange={farm.setLocation} />
          </div>
        )}
      </Panel>
    </div>
  );
}

export function SoilPanel() {
  const { soil } = useFarm();
  if (!soil?.available)
    return (
      <Panel title="Soil Intelligence">
        <Empty>{soil?.note ?? "Soil data is not available for this location. The advisory continues without it."}</Empty>
      </Panel>
    );
  return (
    <Panel
      title="Soil Intelligence"
      right={<SourceChip label="Soil" value={soil.source} live={soil.source === "SoilGrids (ISRIC)"} />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="pH (water)" value={soil.phh2o ?? "—"} />
        <Metric label="Clay" value={soil.clay ?? "—"} unit="%" />
        <Metric label="Sand" value={soil.sand ?? "—"} unit="%" />
        <Metric label="Organic carbon" value={soil.soc ?? "—"} unit="%" tone="healthy" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Estimated texture: {soil.texture ?? "unknown"}. Values are modelled estimates at 0–5 cm depth from
        ISRIC SoilGrids, not a laboratory soil test.
      </p>
    </Panel>
  );
}

export function HistoryPanel() {
  const farm = useFarm();
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const scans = farm.history;
  const first = scans[a];
  const second = scans[b];

  if (scans.length === 0)
    return (
      <Panel title="Farm History">
        <Empty>No saved scans yet. Each diagnosis is stored on this device automatically.</Empty>
      </Panel>
    );

  const delta = first && second ? second.diagnosis.severity_percent - first.diagnosis.severity_percent : null;

  return (
    <div className="space-y-5">
      <Panel title="Timeline" subtitle="Severity trend across your saved scans">
        <ol className="space-y-3">
          {scans.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-3">
              <img src={s.imageDataUrl} alt="" className="size-12 rounded-lg object-cover" loading="lazy" />
              <div className="flex-1 text-sm">
                <p className="font-medium">
                  Day {scans.length - i} · {s.diagnosis.disease}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString()} · {s.crop} · {s.location?.label ?? "no location"}
                </p>
                <div className="mt-1 max-w-sm">
                  <Bar label={`Severity ${Math.round(s.diagnosis.severity_percent)}%`} value={s.diagnosis.severity_percent} tone="moderate" />
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-mono">{s.risk}</p>
                <p className="text-muted-foreground">{s.action}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {scans.length > 1 && (
        <Panel title="Before / after comparison">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { idx: b, set: setB, label: "Earlier scan" },
              { idx: a, set: setA, label: "Later scan" },
            ].map((side) => (
              <div key={side.label}>
                <label className="text-xs text-muted-foreground" htmlFor={side.label}>
                  {side.label}
                </label>
                <select
                  id={side.label}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                  value={side.idx}
                  onChange={(e) => side.set(Number(e.target.value))}
                >
                  {scans.map((s, i) => (
                    <option key={s.id} value={i}>
                      {new Date(s.createdAt).toLocaleString()} — {Math.round(s.diagnosis.severity_percent)}%
                    </option>
                  ))}
                </select>
                <img
                  src={scans[side.idx]?.imageDataUrl}
                  alt={`${side.label} leaf photo`}
                  className="mt-2 h-48 w-full rounded-xl border border-border object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          {delta !== null && (
            <p className="mt-4 text-sm">
              Estimated severity change:{" "}
              <span className={`font-mono font-bold ${delta > 0 ? "text-healthy" : delta < 0 ? "text-danger" : ""}`}>
                {delta > 0 ? "−" : "+"}
                {Math.abs(Math.round(delta))}%
              </span>{" "}
              <span className="text-muted-foreground">
                ({delta > 0 ? "appears to be improving" : delta < 0 ? "appears to be worsening" : "no clear change"}).
                This compares two AI estimates from photographs and is not proof of biological recovery.
              </span>
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}

export function AlertsPanel() {
  const { alerts } = useIntelligence();
  return (
    <Panel title="Alerts" subtitle="Only generated when the data supports them">
      {alerts.length === 0 ? (
        <Empty>No alerts right now.</Empty>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className="rounded-xl border border-border bg-surface/60 p-4">
              <p className="font-medium">
                <span className="mr-2">{a.icon}</span>
                {a.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function SettingsPanel() {
  const { lang, setLang, t } = useI18n();
  const farm = useFarm();
  return (
    <div className="space-y-5">
      <Panel title={t("language")}>
        <div className="flex gap-2">
          {(["en", "te"] as const).map((l) => (
            <Button key={l} variant={lang === l ? "default" : "secondary"} onClick={() => setLang(l)}>
              {l === "en" ? "English" : "తెలుగు"}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Hindi and other languages can be added in src/lib/i18n.tsx.</p>
      </Panel>
      <Panel title="Data mode">
        <div className="flex gap-2">
          <Button variant={farm.demo ? "default" : "secondary"} onClick={() => farm.setDemo(true)}>
            Demo mode
          </Button>
          <Button variant={!farm.demo ? "default" : "secondary"} onClick={() => farm.setDemo(false)}>
            Real-time mode
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Demo mode uses clearly-labelled sample data so the app works with no internet or API access.
        </p>
      </Panel>
      <Panel title="Stored data">
        <p className="text-sm text-muted-foreground">
          Scans are stored only in this browser (no account, no personal data uploaded).
        </p>
        <Button className="mt-3" variant="secondary" onClick={farm.clearHistory}>
          Clear farm history
        </Button>
      </Panel>
      <Panel title="Model status">
        <p className="text-sm text-muted-foreground">
          Custom vision classifier: <span className="font-mono">Model evaluation not yet performed.</span> Diagnoses
          currently come from a multimodal AI vision model with schema-validated output. Training and evaluation
          scaffolding lives in <span className="font-mono">/ml</span>.
        </p>
      </Panel>
    </div>
  );
}
