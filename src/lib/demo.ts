import type { Diagnosis, ScanRecord } from "./types";

/** Clearly-labelled demo diagnosis used by Demo Mode / Presentation Mode. */
export const DEMO_DIAGNOSIS: Diagnosis = {
  crop: "Rice",
  condition: "disease",
  disease: "Bacterial leaf blight (suspected)",
  confidence: 82,
  severity: "moderate",
  severity_percent: 58,
  symptoms: [
    "Long water-soaked streaks running along the leaf edge",
    "Yellow to straw-coloured drying from the leaf tip downward",
    "Wavy lesion margins rather than sharp round spots",
    "Several leaves on the same tiller affected",
  ],
  reasoning:
    "The lesions start at the leaf tip and edge and move down in long wavy streaks. This pattern, together with warm and very humid weather after rain, matches bacterial leaf blight more closely than a fungal spot disease, which usually makes separate round or eye-shaped spots.",
  could_be_wrong: [
    "Leaf tip drying can also come from salt stress or potassium shortage",
    "Early blast lesions can look similar in a low-quality photo",
    "Only one photo was reviewed, not the whole field",
  ],
  distinguish_tips: [
    "Bacterial blight streaks feel dry and straw-like and often ooze in early morning; blast lesions are spindle shaped with grey centres",
    "Nutrient problems usually appear evenly across many plants, disease appears in patches",
  ],
  immediate_actions: [
    "Mark and inspect the affected patch and count how many hills show symptoms",
    "Drain excess standing water where possible to reduce leaf wetness",
    "Stop any further nitrogen top-dressing until the spread slows",
    "Avoid walking through wet infected plants and then healthy ones",
  ],
  treatment: [
    "Improve field drainage and avoid over-flooding",
    "Remove and destroy severely infected debris after harvest",
    "Plan resistant varieties for the next season",
    "Any chemical or biological product must follow the locally approved label and the recommendation of your district agricultural officer — dosages are not provided here",
  ],
  alternative_diagnoses: [
    { name: "Bacterial leaf blight", probability: 71 },
    { name: "Rice blast (leaf stage)", probability: 19 },
    { name: "Potassium deficiency", probability: 10 },
  ],
  image_quality: { usable: true, issues: [], advice: [] },
};

export function demoHistory(imageDataUrl: string): ScanRecord[] {
  const day = 86400_000;
  const base = Date.now();
  const make = (offset: number, severity: number, disease: string): ScanRecord => ({
    id: `demo-${offset}`,
    createdAt: new Date(base - offset * day).toISOString(),
    crop: "Rice",
    imageDataUrl,
    diagnosis: {
      ...DEMO_DIAGNOSIS,
      disease,
      severity_percent: severity,
      severity: severity > 55 ? "high" : severity > 30 ? "moderate" : "low",
      confidence: 80,
    },
    location: {
      latitude: 16.5062,
      longitude: 80.648,
      district: "Krishna",
      state: "Andhra Pradesh",
      country: "India",
      label: "Vijayawada, Krishna, Andhra Pradesh",
    },
    weather: { temperature: 30, humidity: 84, rainfall: 2.2, precipProb: 70 },
    risk: severity > 55 ? "HIGH" : "MODERATE",
    action: severity > 55 ? "WAIT" : "MONITOR",
    demo: true,
  });
  return [make(0, 21, "Bacterial leaf blight (recovering)"), make(3, 45, "Bacterial leaf blight"), make(6, 62, "Bacterial leaf blight")];
}

/** A tiny inline SVG leaf used as the demo photo so Demo Mode needs no network. */
export const DEMO_LEAF_IMAGE =
  "data:image/svg+xml;base64," +
  btoaSafe(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1d3b22"/><stop offset="100%" stop-color="#0d1f13"/></linearGradient></defs>
  <rect width="480" height="480" fill="url(#g)"/>
  <path d="M240 40 C150 150 150 330 240 440 C330 330 330 150 240 40 Z" fill="#3f7d34"/>
  <path d="M240 40 L240 440" stroke="#7bbd63" stroke-width="4"/>
  <path d="M200 120 q30 40 0 90" stroke="#c8b45a" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M275 180 q-25 60 5 120" stroke="#b99a48" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M215 260 q35 50 -5 110" stroke="#a98c3e" stroke-width="9" fill="none" stroke-linecap="round"/>
  <text x="240" y="466" font-family="monospace" font-size="18" fill="#9fd08a" text-anchor="middle">DEMO LEAF</text>
</svg>`);

function btoaSafe(s: string): string {
  if (typeof btoa === "function") return btoa(s);
  return Buffer.from(s, "utf-8").toString("base64");
}
