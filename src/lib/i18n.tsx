import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "te";

const dict = {
  en: {
    brand: "AgriShield AI",
    tagline: "From Field Image to Intelligent Action.",
    heroTitle: "AI That Understands Your Field.",
    heroSub:
      "Turn a simple crop photo into real-time, weather-aware agricultural intelligence.",
    scanCta: "Scan My Crop",
    demoCta: "Explore Demo Farm",
    overview: "Overview",
    cropDoctor: "Crop Doctor",
    weather: "Weather Intelligence",
    risk: "Disease Risk",
    map: "Farm Map",
    soil: "Soil Intelligence",
    history: "Farm History",
    alerts: "Alerts",
    settings: "Settings",
    farmHealth: "AI Crop Health Score",
    nextAction: "Next Recommended Action",
    bestWindow: "Best Action Window",
    forecast7: "7-day forecast",
    recent: "Recent diagnoses",
    selectCrop: "What crop are you growing?",
    uploadImage: "Upload or capture a leaf photo",
    location: "Location",
    useMyLocation: "Use my current location",
    enterManually: "Enter location manually",
    analyze: "Analyse my crop",
    analysing: "Analysing…",
    diagnosis: "Diagnosis",
    whatAiSees: "What the AI sees",
    whyDiagnosis: "Why this diagnosis",
    whatToDo: "What to do now",
    treatment: "Treatment",
    weatherAction: "Weather-aware action",
    riskForecast: "Risk forecast",
    alternatives: "Possible alternatives",
    couldBeWrong: "Things that could make this diagnosis wrong",
    sources: "Sources",
    demoData: "DEMO DATA",
    live: "LIVE",
    presentation: "Presentation Mode",
    language: "Language",
    lowConfidence: "Low confidence — please upload a clearer image.",
    noLeaf: "I couldn't reliably identify a crop leaf in this image.",
    speak: "Speak your symptoms",
    listening: "Listening…",
    disclaimer:
      "AgriShield AI is a decision-support tool, not a replacement for an agricultural expert. Confirm chemical treatments with your local agricultural officer.",
  },
  te: {
    brand: "అగ్రిషీల్డ్ AI",
    tagline: "పొలం ఫోటో నుండి తెలివైన చర్య వరకు.",
    heroTitle: "మీ పొలాన్ని అర్థం చేసుకునే AI.",
    heroSub: "ఒక సాధారణ పంట ఫోటోను వాతావరణ ఆధారిత వ్యవసాయ సలహాగా మార్చండి.",
    scanCta: "నా పంటను స్కాన్ చేయండి",
    demoCta: "డెమో ఫారం చూడండి",
    overview: "సమగ్ర వివరణ",
    cropDoctor: "పంట డాక్టర్",
    weather: "వాతావరణ సమాచారం",
    risk: "వ్యాధి ప్రమాదం",
    map: "పొలం మ్యాప్",
    soil: "నేల సమాచారం",
    history: "పొలం చరిత్ర",
    alerts: "హెచ్చరికలు",
    settings: "సెట్టింగ్‌లు",
    farmHealth: "AI పంట ఆరోగ్య స్కోరు",
    nextAction: "తదుపరి సిఫార్సు చర్య",
    bestWindow: "ఉత్తమ సమయం",
    forecast7: "7 రోజుల సూచన",
    recent: "ఇటీవలి నిర్ధారణలు",
    selectCrop: "మీరు ఏ పంట పండిస్తున్నారు?",
    uploadImage: "ఆకు ఫోటో అప్‌లోడ్ చేయండి",
    location: "ప్రాంతం",
    useMyLocation: "నా ప్రస్తుత ప్రాంతం",
    enterManually: "ప్రాంతం టైప్ చేయండి",
    analyze: "నా పంటను విశ్లేషించండి",
    analysing: "విశ్లేషిస్తోంది…",
    diagnosis: "నిర్ధారణ",
    whatAiSees: "AI చూసినవి",
    whyDiagnosis: "ఈ నిర్ధారణ ఎందుకు",
    whatToDo: "ఇప్పుడు ఏమి చేయాలి",
    treatment: "చికిత్స",
    weatherAction: "వాతావరణ ఆధారిత చర్య",
    riskForecast: "ప్రమాద సూచన",
    alternatives: "ఇతర అవకాశాలు",
    couldBeWrong: "ఈ నిర్ధారణ తప్పు కావడానికి కారణాలు",
    sources: "మూలాలు",
    demoData: "డెమో డేటా",
    live: "లైవ్",
    presentation: "ప్రెజెంటేషన్ మోడ్",
    language: "భాష",
    lowConfidence: "నమ్మకం తక్కువ — దయచేసి స్పష్టమైన ఫోటో అప్‌లోడ్ చేయండి.",
    noLeaf: "ఈ ఫోటోలో పంట ఆకును స్పష్టంగా గుర్తించలేకపోయాను.",
    speak: "మీ లక్షణాలు చెప్పండి",
    listening: "వింటోంది…",
    disclaimer:
      "అగ్రిషీల్డ్ AI ఒక సహాయక సాధనం మాత్రమే; వ్యవసాయ నిపుణుడికి ప్రత్యామ్నాయం కాదు. రసాయన చికిత్సలను స్థానిక వ్యవసాయ అధికారితో నిర్ధారించుకోండి.",
  },
} as const;

export type TranslationKey = keyof (typeof dict)["en"];

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TranslationKey) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("agrishield.lang");
    if (stored === "en" || stored === "te") setLang(stored);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang: (l) => {
        setLang(l);
        try {
          window.localStorage.setItem("agrishield.lang", l);
        } catch {
          /* ignore */
        }
      },
      t: (k) => dict[lang][k] ?? dict.en[k],
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
