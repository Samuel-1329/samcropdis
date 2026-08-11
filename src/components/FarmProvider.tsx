import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { diagnoseImage } from "@/lib/diagnose.functions";
import {
  DEMO_LOCATION,
  demoSoil,
  demoWeather,
  fetchSoil,
  fetchWeather,
  reverseGeocode,
} from "@/lib/weather";
import { DEMO_DIAGNOSIS, DEMO_LEAF_IMAGE, demoHistory } from "@/lib/demo";
import { loadScans, saveScan, clearScans } from "@/lib/history";
import {
  actionVerdict,
  assessRisk,
  assessSpray,
  buildAlerts,
  cropHealthScore,
  decisionSupportScore,
} from "@/lib/engines";
import type { Diagnosis, GeoLocation, ScanRecord, SoilInfo, WeatherBundle } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

interface FarmState {
  demo: boolean;
  setDemo: (v: boolean) => void;
  crop: string;
  setCrop: (c: string) => void;
  growthStage: string;
  setGrowthStage: (s: string) => void;
  notes: string;
  setNotes: (s: string) => void;
  location: GeoLocation | null;
  setLocation: (l: GeoLocation | null) => void;
  weather: WeatherBundle | null;
  weatherError: string | null;
  soil: SoilInfo | null;
  diagnosis: Diagnosis | null;
  image: string | null;
  setImage: (v: string | null) => void;
  analysing: boolean;
  analysisError: string | null;
  history: ScanRecord[];
  runDiagnosis: (imageDataUrl: string) => Promise<void>;
  resetDiagnosis: () => void;
  clearHistory: () => void;
  loadDemoScenario: () => void;
}

const Ctx = createContext<FarmState | null>(null);

export function FarmProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const diagnose = useServerFn(diagnoseImage);

  const [demo, setDemoRaw] = useState(false);
  const [crop, setCrop] = useState("Rice");
  const [growthStage, setGrowthStage] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [soil, setSoil] = useState<SoilInfo | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    setHistory(loadScans());
  }, []);

  // Weather + soil follow the selected location.
  useEffect(() => {
    if (demo) {
      setWeather(demoWeather());
      setSoil(demoSoil());
      setWeatherError(null);
      return;
    }
    if (!location) return;
    let cancelled = false;
    setWeatherError(null);
    fetchWeather(location.latitude, location.longitude)
      .then((w) => !cancelled && setWeather(w))
      .catch(() => {
        if (cancelled) return;
        setWeather(null);
        setWeatherError("Weather temporarily unavailable.");
      });
    fetchSoil(location.latitude, location.longitude)
      .then((s) => !cancelled && setSoil(s))
      .catch(() => !cancelled && setSoil({ available: false, source: "unavailable" }));
    return () => {
      cancelled = true;
    };
  }, [location, demo]);

  const setDemo = useCallback((v: boolean) => {
    setDemoRaw(v);
    if (v) {
      setCrop("Rice");
      setLocation(DEMO_LOCATION);
      setWeather(demoWeather());
      setSoil(demoSoil());
      setDiagnosis(DEMO_DIAGNOSIS);
      setImage(DEMO_LEAF_IMAGE);
    } else {
      setDiagnosis(null);
      setImage(null);
    }
  }, []);

  const loadDemoScenario = useCallback(() => {
    setDemo(true);
    setHistory(demoHistory(DEMO_LEAF_IMAGE));
  }, [setDemo]);

  const runDiagnosis = useCallback(
    async (imageDataUrl: string) => {
      setAnalysing(true);
      setAnalysisError(null);
      setImage(imageDataUrl);
      try {
        const res = await diagnose({
          data: {
            imageDataUrl,
            crop,
            language: lang,
            ...(growthStage ? { growthStage } : {}),
            ...(notes ? { notes } : {}),
            context: {
              ...(location ? { place: location.label } : {}),
              ...(weather
                ? {
                    temperature: weather.now.temperature,
                    humidity: weather.now.humidity,
                    rainfall: weather.now.rainfall,
                    precipProb: weather.now.precipitationProbability,
                  }
                : {}),
              ...(soil?.available && soil.texture ? { soil: soil.texture } : {}),
            },
          },
        });

        if (!res.ok) {
          setAnalysisError(res.error);
          toast.error(res.error);
          return;
        }

        const d = res.diagnosis;
        setDiagnosis(d);

        const risk = assessRisk(weather, d);
        const spray = assessSpray(weather);
        const verdict = actionVerdict(d, risk, spray);
        const record: ScanRecord = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          crop: d.crop || crop,
          imageDataUrl,
          diagnosis: d,
          location,
          weather: weather
            ? {
                temperature: weather.now.temperature,
                humidity: weather.now.humidity,
                rainfall: weather.now.rainfall,
                precipProb: weather.now.precipitationProbability,
              }
            : null,
          risk: risk.current.level,
          action: verdict.verdict,
          demo: false,
        };
        setHistory(saveScan(record));
        toast.success("Advisory ready");
      } catch {
        const msg = "Something went wrong while analysing. Please try again.";
        setAnalysisError(msg);
        toast.error(msg);
      } finally {
        setAnalysing(false);
      }
    },
    [crop, diagnose, growthStage, lang, location, notes, soil, weather],
  );

  const value = useMemo<FarmState>(
    () => ({
      demo,
      setDemo,
      crop,
      setCrop,
      growthStage,
      setGrowthStage,
      notes,
      setNotes,
      location,
      setLocation,
      weather,
      weatherError,
      soil,
      diagnosis,
      image,
      setImage,
      analysing,
      analysisError,
      history,
      runDiagnosis,
      resetDiagnosis: () => {
        setDiagnosis(null);
        setImage(null);
        setAnalysisError(null);
      },
      clearHistory: () => setHistory(clearScans()),
      loadDemoScenario,
    }),
    [
      analysing,
      analysisError,
      crop,
      demo,
      diagnosis,
      growthStage,
      history,
      image,
      loadDemoScenario,
      location,
      notes,
      runDiagnosis,
      setDemo,
      soil,
      weather,
      weatherError,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFarm(): FarmState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFarm must be used inside FarmProvider");
  return ctx;
}

/** Derived intelligence for the whole app (risk, spray, scores, alerts). */
export function useIntelligence() {
  const { weather, diagnosis, location, soil, history } = useFarm();
  return useMemo(() => {
    const risk = assessRisk(weather, diagnosis);
    const spray = assessSpray(weather);
    const verdict = actionVerdict(diagnosis, risk, spray);
    const signals = decisionSupportScore(diagnosis, weather, !!location, soil);
    const health = cropHealthScore(diagnosis, risk, history);
    const alerts = buildAlerts(weather, risk, diagnosis);
    return { risk, spray, verdict, signals, health, alerts };
  }, [diagnosis, history, location, soil, weather]);
}
