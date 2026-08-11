import { Panel, Bar, RiskPill } from "@/components/ui-kit";
import { useFarm, useIntelligence } from "@/components/FarmProvider";
import { useI18n } from "@/lib/i18n";

const severityTone: Record<string, string> = {
  none: "text-healthy",
  low: "text-healthy",
  moderate: "text-warning",
  high: "text-moderate",
  critical: "text-danger",
  unknown: "text-muted-foreground",
};

export function Advisory() {
  const { t } = useI18n();
  const { diagnosis, demo, soil, weather } = useFarm();
  const { risk, spray, verdict, signals } = useIntelligence();
  if (!diagnosis) return null;

  const lowConfidence = diagnosis.confidence < 55;
  const notAPlant = diagnosis.condition === "not_a_plant";

  return (
    <div className="space-y-5">
      {demo && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-2 text-xs font-semibold tracking-wide text-warning uppercase">
          {t("demoData")} — illustrative advisory for demonstration
        </div>
      )}

      {notAPlant && (
        <Panel title="No leaf detected">
          <p className="text-sm text-warning">{t("noLeaf")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Place one leaf close to the camera in natural light and take the photo again.
          </p>
        </Panel>
      )}

      {!notAPlant && lowConfidence && (
        <Panel title="Confidence warning">
          <p className="text-sm text-warning">{t("lowConfidence")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You can retake the photo, upload another leaf, confirm the crop manually, or add a short
            description of the symptoms — all of these improve the result.
          </p>
        </Panel>
      )}

      <Panel title={t("diagnosis")}>
        <dl className="grid gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Crop</dt>
            <dd className="font-medium">{diagnosis.crop}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Disease / Pest</dt>
            <dd className="font-medium">{diagnosis.disease}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Confidence</dt>
            <dd className="font-mono font-medium">{Math.round(diagnosis.confidence)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Severity</dt>
            <dd className={`font-medium capitalize ${severityTone[diagnosis.severity] ?? ""}`}>
              {diagnosis.severity} · {Math.round(diagnosis.severity_percent)}%
            </dd>
          </div>
        </dl>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("whatAiSees")}>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {diagnosis.symptoms.map((s) => (
              <li key={s}>{s}</li>
            ))}
            {diagnosis.symptoms.length === 0 && <li>No clear symptoms were described.</li>}
          </ul>
        </Panel>

        <Panel title={t("whyDiagnosis")}>
          <p className="text-sm text-muted-foreground">{diagnosis.reasoning}</p>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("whatToDo")}>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {diagnosis.immediate_actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </Panel>

        <Panel title={t("treatment")}>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {diagnosis.treatment.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg border border-border bg-surface/60 p-3 text-xs text-muted-foreground">
            No pesticide dose is given by this system. Any chemical product must follow the locally
            approved product label and the recommendation of your district agricultural officer.
          </p>
        </Panel>
      </div>

      <Panel title={t("weatherAction")}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 font-mono text-sm font-bold ${
              verdict.verdict === "NOW"
                ? "border-healthy/40 bg-healthy/15 text-healthy"
                : verdict.verdict === "WAIT"
                  ? "border-danger/40 bg-danger/15 text-danger"
                  : "border-warning/40 bg-warning/15 text-warning"
            }`}
          >
            {verdict.verdict}
          </span>
          <span className="text-sm text-muted-foreground">{verdict.explanation}</span>
        </div>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Spray safety: {spray.verdict}</p>
          <ul className="list-disc space-y-1 pl-5">
            {spray.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p>
            {spray.window
              ? `Next suitable weather window: ${spray.window}.`
              : "The forecast does not show a clearly suitable application window in the next 60 hours."}
          </p>
        </div>
      </Panel>

      <Panel title={t("riskForecast")} right={<RiskPill level={risk.current.level} />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[risk.current, ...risk.windows].map((w) => (
            <Bar
              key={w.label}
              label={`${w.label} — ${w.level}`}
              value={w.score}
              tone={
                w.level === "LOW"
                  ? "healthy"
                  : w.level === "MODERATE"
                    ? "warning"
                    : w.level === "HIGH"
                      ? "moderate"
                      : "danger"
              }
            />
          ))}
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {risk.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("alternatives")}>
          <div className="space-y-3">
            {diagnosis.alternative_diagnoses.map((a, i) => (
              <Bar
                key={a.name}
                label={`${i + 1}. ${a.name}`}
                value={a.probability}
                tone={i === 0 ? "water" : "warning"}
              />
            ))}
          </div>
          {diagnosis.distinguish_tips.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {diagnosis.distinguish_tips.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("couldBeWrong")}>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {diagnosis.could_be_wrong.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="AI Decision Support Score" subtitle="How much evidence each signal contributes">
        <div className="grid gap-3 sm:grid-cols-2">
          <Bar label="Image evidence" value={signals.image} tone="healthy" />
          <Bar label="Weather evidence" value={signals.weather} tone="water" />
          <Bar label="Location evidence" value={signals.location} tone="warning" />
          <Bar label="Soil / context evidence" value={signals.soil} tone="moderate" />
        </div>
        <p className="mt-4 text-sm">
          Combined score: <span className="font-mono text-lg font-bold">{signals.total}</span>/100
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          This is a transparency indicator of how much usable evidence the system had — not a
          scientific or medical certainty measure.
        </p>
      </Panel>

      <Panel title="Sources">
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Weather: {weather ? weather.source : "unavailable"} (Open-Meteo forecast API)</li>
          <li>Soil: {soil?.source ?? "unavailable"} (ISRIC SoilGrids)</li>
          <li>Geocoding: Open-Meteo Geocoding · OpenStreetMap Nominatim</li>
          <li>
            Disease knowledge references: PlantVillage, PlantDoc, Paddy Doctor, IP102 (see /ml and
            README for citations)
          </li>
          <li>Agronomic guidance: general extension practice — confirm locally before acting</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{t("disclaimer")}</p>
      </Panel>
    </div>
  );
}
