import { z } from "zod";

export const CROPS = [
  "Rice",
  "Tomato",
  "Cotton",
  "Chilli",
  "Maize",
  "Potato",
  "Wheat",
  "Other",
] as const;

export const diagnosisSchema = z.object({
  crop: z.string(),
  condition: z.enum(["healthy", "disease", "pest", "nutrient_deficiency", "unclear", "not_a_plant"]),
  disease: z.string(),
  confidence: z.number().min(0).max(100),
  severity: z.enum(["none", "low", "moderate", "high", "critical", "unknown"]),
  severity_percent: z.number().min(0).max(100),
  symptoms: z.array(z.string()),
  reasoning: z.string(),
  could_be_wrong: z.array(z.string()),
  distinguish_tips: z.array(z.string()),
  immediate_actions: z.array(z.string()),
  treatment: z.array(z.string()),
  alternative_diagnoses: z.array(
    z.object({ name: z.string(), probability: z.number().min(0).max(100) }),
  ),
  image_quality: z.object({
    usable: z.boolean(),
    issues: z.array(z.string()),
    advice: z.array(z.string()),
  }),
});

export type Diagnosis = z.infer<typeof diagnosisSchema>;

export interface GeoLocation {
  latitude: number;
  longitude: number;
  district: string;
  state: string;
  country: string;
  label: string;
}

export interface WeatherNow {
  temperature: number;
  humidity: number;
  rainfall: number;
  precipitationProbability: number;
  windSpeed: number;
  uv: number;
  cloudCover: number;
  isDay: boolean;
  time: string;
}

export interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  rainSum: number;
  precipProbMax: number;
  windMax: number;
  uvMax: number;
  sunrise: string;
  sunset: string;
}

export interface HourPoint {
  time: string;
  temperature: number;
  humidity: number;
  precipProb: number;
  rain: number;
  wind: number;
}

export interface WeatherBundle {
  now: WeatherNow;
  hourly: HourPoint[];
  daily: ForecastDay[];
  source: "Open-Meteo" | "DEMO";
  timezone: string;
}

export interface SoilInfo {
  available: boolean;
  phh2o?: number;
  clay?: number;
  sand?: number;
  soc?: number;
  texture?: string;
  source: "SoilGrids (ISRIC)" | "DEMO" | "unavailable";
  note?: string;
}

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type SprayVerdict = "SAFE" | "CAUTION" | "WAIT";
export type ActionVerdict = "NOW" | "WAIT" | "MONITOR";

export interface RiskWindow {
  label: string;
  level: RiskLevel;
  score: number;
}

export interface RiskAssessment {
  current: RiskWindow;
  windows: RiskWindow[];
  reasons: string[];
}

export interface SprayAssessment {
  verdict: SprayVerdict;
  reasons: string[];
  window: string | null;
}

export interface ScanRecord {
  id: string;
  createdAt: string;
  crop: string;
  imageDataUrl: string;
  diagnosis: Diagnosis;
  location: GeoLocation | null;
  weather: { temperature: number; humidity: number; rainfall: number; precipProb: number } | null;
  risk: RiskLevel;
  action: string;
  demo: boolean;
}

export interface FarmAlert {
  id: string;
  icon: string;
  title: string;
  detail: string;
  tone: "healthy" | "warning" | "moderate" | "danger" | "water";
}
