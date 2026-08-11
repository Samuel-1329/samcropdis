import type {
  ActionVerdict,
  Diagnosis,
  FarmAlert,
  RiskAssessment,
  RiskLevel,
  ScanRecord,
  SoilInfo,
  SprayAssessment,
  WeatherBundle,
} from "./types";

/* ------------------------------------------------------------------ */
/* Disease risk engine — transparent, rule based, fully explainable.   */
/* ------------------------------------------------------------------ */

function levelFromScore(score: number): RiskLevel {
  if (score >= 78) return "CRITICAL";
  if (score >= 58) return "HIGH";
  if (score >= 35) return "MODERATE";
  return "LOW";
}

function windowScore(
  hours: { temperature: number; humidity: number; precipProb: number; rain: number; wind: number }[],
  diseasePressure: number,
): { score: number; reasons: string[] } {
  if (hours.length === 0) return { score: diseasePressure, reasons: ["No weather data available"] };
  const avg = (f: (h: (typeof hours)[number]) => number) =>
    hours.reduce((s, h) => s + f(h), 0) / hours.length;

  const humidity = avg((h) => h.humidity);
  const temp = avg((h) => h.temperature);
  const rain = hours.reduce((s, h) => s + h.rain, 0);
  const precipProb = Math.max(...hours.map((h) => h.precipProb));
  const wind = avg((h) => h.wind);

  const reasons: string[] = [];
  let score = diseasePressure;

  if (humidity >= 85) {
    score += 24;
    reasons.push(`Very high humidity (~${Math.round(humidity)}%) favours fungal and bacterial spread`);
  } else if (humidity >= 70) {
    score += 14;
    reasons.push(`Elevated humidity (~${Math.round(humidity)}%) supports pathogen development`);
  } else if (humidity < 45) {
    score -= 8;
    reasons.push(`Dry air (~${Math.round(humidity)}%) slows most leaf pathogens`);
  }

  if (temp >= 22 && temp <= 32) {
    score += 16;
    reasons.push(`Temperature (~${Math.round(temp)}°C) is in the range many crop pathogens prefer`);
  } else if (temp > 36 || temp < 12) {
    score -= 10;
    reasons.push(`Temperature (~${Math.round(temp)}°C) is outside the typical infection range`);
  }

  if (rain >= 8) {
    score += 20;
    reasons.push(`Substantial rainfall (~${rain.toFixed(1)} mm) keeps leaves wet for long periods`);
  } else if (rain > 0.5) {
    score += 10;
    reasons.push(`Light rainfall (~${rain.toFixed(1)} mm) creates leaf wetness`);
  }

  if (precipProb >= 60) {
    score += 10;
    reasons.push(`High chance of further rain (${Math.round(precipProb)}%)`);
  }

  if (wind >= 25) {
    score += 6;
    reasons.push(`Strong wind (~${Math.round(wind)} km/h) can carry spores between plants`);
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

function pressureFromDiagnosis(diagnosis: Diagnosis | null): number {
  if (!diagnosis) return 18;
  if (diagnosis.condition === "healthy") return 10;
  if (diagnosis.condition === "not_a_plant" || diagnosis.condition === "unclear") return 15;
  const bySeverity: Record<string, number> = {
    none: 10,
    low: 20,
    moderate: 32,
    high: 44,
    critical: 52,
    unknown: 24,
  };
  const base = bySeverity[diagnosis.severity] ?? 24;
  return base * (0.6 + (diagnosis.confidence / 100) * 0.4);
}

export function assessRisk(
  weather: WeatherBundle | null,
  diagnosis: Diagnosis | null,
): RiskAssessment {
  const pressure = pressureFromDiagnosis(diagnosis);
  if (!weather) {
    const level = levelFromScore(pressure);
    const w = { label: "Now", level, score: Math.round(pressure) };
    return {
      current: w,
      windows: [w],
      reasons: ["Weather temporarily unavailable — risk is based on the image diagnosis only."],
    };
  }

  const slice = (from: number, to: number) => weather.hourly.slice(from, to);
  const now = windowScore(slice(0, 6), pressure);
  const h24 = windowScore(slice(0, 24), pressure);
  const h48 = windowScore(slice(24, 48), pressure);
  const h72 = windowScore(slice(48, 72), pressure);

  return {
    current: { label: "Now", level: levelFromScore(now.score), score: now.score },
    windows: [
      { label: "Next 24h", level: levelFromScore(h24.score), score: h24.score },
      { label: "24–48h", level: levelFromScore(h48.score), score: h48.score },
      { label: "48–72h", level: levelFromScore(h72.score), score: h72.score },
    ],
    reasons: Array.from(new Set([...now.reasons, ...h24.reasons])).slice(0, 6),
  };
}

/* ------------------------------------------------------------------ */
/* Spray safety engine                                                 */
/* ------------------------------------------------------------------ */

export function assessSpray(weather: WeatherBundle | null): SprayAssessment {
  if (!weather) {
    return {
      verdict: "CAUTION",
      reasons: ["Weather data unavailable — check local conditions before any application."],
      window: null,
    };
  }
  const next6 = weather.hourly.slice(0, 6);
  const reasons: string[] = [];
  let verdict: SprayAssessment["verdict"] = "SAFE";

  const rainSoon = next6.reduce((s, h) => s + h.rain, 0);
  const probSoon = next6.length ? Math.max(...next6.map((h) => h.precipProb)) : 0;
  const wind = weather.now.windSpeed;
  const temp = weather.now.temperature;
  const humidity = weather.now.humidity;
  const hour = new Date().getHours();

  if (rainSoon > 1 || probSoon >= 60) {
    verdict = "WAIT";
    reasons.push(
      `Rain is likely within the next 6 hours (${Math.round(probSoon)}% chance, ~${rainSoon.toFixed(1)} mm) — spray would wash off.`,
    );
  } else if (probSoon >= 35) {
    verdict = "CAUTION";
    reasons.push(`Some chance of rain within 6 hours (${Math.round(probSoon)}%).`);
  } else {
    reasons.push(`Low rain chance in the next 6 hours (${Math.round(probSoon)}%).`);
  }

  if (wind >= 20) {
    verdict = "WAIT";
    reasons.push(`Wind is too strong for spraying (${Math.round(wind)} km/h) — high drift risk.`);
  } else if (wind >= 12) {
    if (verdict === "SAFE") verdict = "CAUTION";
    reasons.push(`Moderate wind (${Math.round(wind)} km/h) — drift is possible.`);
  } else {
    reasons.push(`Wind is calm (${Math.round(wind)} km/h).`);
  }

  if (temp >= 35) {
    if (verdict === "SAFE") verdict = "CAUTION";
    reasons.push(`High temperature (${Math.round(temp)}°C) increases evaporation and leaf-burn risk.`);
  }
  if (humidity < 35) {
    if (verdict === "SAFE") verdict = "CAUTION";
    reasons.push(`Very dry air (${Math.round(humidity)}%) causes droplets to evaporate quickly.`);
  }
  if (hour >= 11 && hour <= 15) {
    if (verdict === "SAFE") verdict = "CAUTION";
    reasons.push("Midday heat — early morning or late evening is usually better.");
  }

  return { verdict, reasons, window: findWindow(weather) };
}

/** Finds the next calm, dry daytime block. Returns null when data does not support one. */
export function findWindow(weather: WeatherBundle | null): string | null {
  if (!weather) return null;
  const hours = weather.hourly.slice(0, 60);
  for (let i = 0; i < hours.length - 2; i++) {
    const block = hours.slice(i, i + 3);
    if (block.length < 3) break;
    const start = new Date(block[0]!.time);
    const h = start.getHours();
    const daylight = h >= 6 && h <= 18;
    const dry = block.every((b) => b.rain < 0.2 && b.precipProb < 30);
    const calm = block.every((b) => b.wind < 15);
    const cool = block.every((b) => b.temperature < 34);
    if (daylight && dry && calm && cool) {
      const end = new Date(block[2]!.time);
      const fmt = (d: Date) =>
        d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      const day =
        start.toDateString() === new Date().toDateString()
          ? "Today"
          : start.toLocaleDateString([], { weekday: "long" });
      return `${day} ${fmt(start)} – ${fmt(end)}`;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* AI Decision Support Score (multi-signal) & AI Crop Health Score     */
/* ------------------------------------------------------------------ */

export interface SignalBreakdown {
  image: number;
  weather: number;
  location: number;
  soil: number;
  total: number;
}

export function decisionSupportScore(
  diagnosis: Diagnosis | null,
  weather: WeatherBundle | null,
  hasLocation: boolean,
  soil: SoilInfo | null,
): SignalBreakdown {
  const image = diagnosis
    ? Math.round(diagnosis.confidence * (diagnosis.image_quality.usable ? 1 : 0.6))
    : 0;
  const weatherScore = weather ? (weather.source === "Open-Meteo" ? 88 : 60) : 0;
  const location = hasLocation ? 75 : 20;
  const soilScore = soil?.available ? (soil.source === "SoilGrids (ISRIC)" ? 70 : 50) : 25;
  const total = Math.round(
    image * 0.45 + weatherScore * 0.28 + location * 0.15 + soilScore * 0.12,
  );
  return { image, weather: weatherScore, location, soil: soilScore, total };
}

export function cropHealthScore(
  diagnosis: Diagnosis | null,
  risk: RiskAssessment,
  history: ScanRecord[],
): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 82;

  if (diagnosis) {
    if (diagnosis.condition === "healthy") {
      score += 10;
      factors.push("Image analysis found no clear disease symptoms (+10)");
    } else if (diagnosis.condition === "unclear" || diagnosis.condition === "not_a_plant") {
      score -= 4;
      factors.push("Diagnosis unclear — score is less reliable (−4)");
    } else {
      const penalty = Math.round((diagnosis.severity_percent / 100) * 45);
      score -= penalty;
      factors.push(`Detected ${diagnosis.disease} at ~${diagnosis.severity_percent}% severity (−${penalty})`);
    }
  } else {
    score -= 6;
    factors.push("No scan yet — score uses environment signals only (−6)");
  }

  const riskPenalty = Math.round(risk.current.score * 0.25);
  score -= riskPenalty;
  factors.push(`Weather-driven disease risk is ${risk.current.level} (−${riskPenalty})`);

  if (history.length >= 2) {
    const first = history[history.length - 1]!;
    const last = history[0]!;
    const delta = first.diagnosis.severity_percent - last.diagnosis.severity_percent;
    if (delta > 5) {
      score += 6;
      factors.push(`Severity trend improving across ${history.length} scans (+6)`);
    } else if (delta < -5) {
      score -= 6;
      factors.push(`Severity trend worsening across ${history.length} scans (−6)`);
    }
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), factors };
}

/* ------------------------------------------------------------------ */
/* Action verdict + alerts                                             */
/* ------------------------------------------------------------------ */

export function actionVerdict(
  diagnosis: Diagnosis | null,
  risk: RiskAssessment,
  spray: SprayAssessment,
): { verdict: ActionVerdict; explanation: string } {
  const diseased =
    !!diagnosis && (diagnosis.condition === "disease" || diagnosis.condition === "pest");

  if (!diseased) {
    return {
      verdict: "MONITOR",
      explanation:
        "No confirmed disease or pest in this image. Keep scouting the field, especially after rain.",
    };
  }
  if (spray.verdict === "WAIT") {
    return {
      verdict: "WAIT",
      explanation:
        "A problem was detected, but current weather makes any spray application ineffective or unsafe. " +
        (spray.reasons[0] ?? ""),
    };
  }
  if (risk.current.level === "HIGH" || risk.current.level === "CRITICAL") {
    return {
      verdict: "NOW",
      explanation:
        "Disease pressure is high and conditions currently allow field action. Act during the recommended window and confirm the product with your local agricultural officer.",
    };
  }
  return {
    verdict: "MONITOR",
    explanation:
      "Symptoms are present but pressure is not high right now. Re-check affected plants every 24–48 hours.",
  };
}

export function buildAlerts(
  weather: WeatherBundle | null,
  risk: RiskAssessment,
  diagnosis: Diagnosis | null,
): FarmAlert[] {
  const alerts: FarmAlert[] = [];
  if (weather) {
    const rain24 = weather.hourly.slice(0, 24).reduce((s, h) => s + h.rain, 0);
    if (rain24 >= 10) {
      alerts.push({
        id: "rain",
        icon: "🌧",
        title: "Heavy rainfall expected",
        detail: `About ${rain24.toFixed(1)} mm of rain is forecast in the next 24 hours. Delay any spraying and check field drainage.`,
        tone: "water",
      });
    }
    if (weather.now.windSpeed >= 20) {
      alerts.push({
        id: "wind",
        icon: "💨",
        title: "Wind too strong for spraying",
        detail: `Wind is ${Math.round(weather.now.windSpeed)} km/h. Spray drift risk is high.`,
        tone: "warning",
      });
    }
    if (weather.now.temperature >= 22 && weather.now.temperature <= 32 && weather.now.humidity >= 80) {
      alerts.push({
        id: "temp",
        icon: "🌡",
        title: "Temperature and humidity in risk range",
        detail: `${Math.round(weather.now.temperature)}°C with ${Math.round(weather.now.humidity)}% humidity favours many leaf diseases.`,
        tone: "moderate",
      });
    }
  }
  const worsening = risk.windows.some((w) => w.score > risk.current.score + 8);
  if (worsening) {
    alerts.push({
      id: "risk",
      icon: "⚠",
      title: "Disease risk increasing",
      detail: "Forecast conditions push disease risk higher over the next 72 hours.",
      tone: "moderate",
    });
  }
  if (diagnosis && (diagnosis.condition === "disease" || diagnosis.condition === "pest")) {
    alerts.push({
      id: "scout",
      icon: "🌱",
      title: "Crop monitoring recommended",
      detail: `Re-inspect plants showing ${diagnosis.disease} symptoms every 24–48 hours and photograph the same leaves for comparison.`,
      tone: "healthy",
    });
  }
  return alerts;
}

export const riskToneClass: Record<RiskLevel, string> = {
  LOW: "text-healthy",
  MODERATE: "text-warning",
  HIGH: "text-moderate",
  CRITICAL: "text-danger",
};
