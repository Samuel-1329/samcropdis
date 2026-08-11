import type { ForecastDay, GeoLocation, HourPoint, SoilInfo, WeatherBundle } from "./types";

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

async function cachedJson<T>(key: string, url: string, signal?: AbortSignal): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = (await res.json()) as T;
  cache.set(key, { at: Date.now(), data });
  return data;
}

export const DEMO_LOCATION: GeoLocation = {
  latitude: 16.5062,
  longitude: 80.648,
  district: "Krishna",
  state: "Andhra Pradesh",
  country: "India",
  label: "Vijayawada, Krishna, Andhra Pradesh",
};

/** Deterministic, clearly-labelled demo weather (monsoon-like AP conditions). */
export function demoWeather(): WeatherBundle {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const hourly: HourPoint[] = Array.from({ length: 72 }, (_, i) => {
    const t = new Date(start.getTime() + i * 3600_000);
    const h = t.getHours();
    const dayCurve = Math.cos(((h - 15) / 24) * Math.PI * 2);
    return {
      time: t.toISOString(),
      temperature: Math.round((29 + dayCurve * 4) * 10) / 10,
      humidity: Math.min(97, Math.round(78 - dayCurve * 12 + (i > 4 && i < 14 ? 8 : 0))),
      precipProb: i > 3 && i < 12 ? 74 : i % 17 === 0 ? 40 : 18,
      rain: i > 4 && i < 11 ? 2.4 : 0,
      wind: Math.round((9 + Math.sin(i / 3) * 4) * 10) / 10,
    };
  });
  const daily: ForecastDay[] = Array.from({ length: 7 }, (_, d) => {
    const date = new Date(start.getTime() + d * 86400_000);
    const iso = date.toISOString().slice(0, 10);
    return {
      date: iso,
      tempMax: 33 - (d % 3),
      tempMin: 25 - (d % 2),
      rainSum: d === 0 ? 14.2 : d === 1 ? 6.5 : d === 3 ? 3.1 : 0.2,
      precipProbMax: d === 0 ? 78 : d === 1 ? 61 : d === 3 ? 44 : 15,
      windMax: 14 + (d % 4) * 2,
      uvMax: 8 - (d % 3),
      sunrise: `${iso}T05:52`,
      sunset: `${iso}T18:14`,
    };
  });
  return {
    now: {
      temperature: hourly[0].temperature,
      humidity: hourly[0].humidity,
      rainfall: 1.8,
      precipitationProbability: 72,
      windSpeed: 11.4,
      uv: 6.1,
      cloudCover: 84,
      isDay: true,
      time: hourly[0].time,
    },
    hourly,
    daily,
    source: "DEMO",
    timezone: "Asia/Kolkata",
  };
}

export async function fetchWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherBundle> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,cloud_cover,uv_index,is_day` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,rain,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset` +
    `&forecast_days=7&timezone=auto`;

  type Raw = {
    timezone: string;
    current: Record<string, number>;
    hourly: Record<string, (number | string)[]>;
    daily: Record<string, (number | string)[]>;
  };
  const raw = await cachedJson<Raw>(`w:${lat.toFixed(2)},${lon.toFixed(2)}`, url, signal);

  const nowIdx = Math.max(
    0,
    (raw.hourly["time"] as string[]).findIndex((t) => new Date(t).getTime() >= Date.now() - 3600_000),
  );

  const hourly: HourPoint[] = (raw.hourly["time"] as string[])
    .slice(nowIdx, nowIdx + 72)
    .map((t, i) => {
      const k = nowIdx + i;
      return {
        time: t,
        temperature: Number(raw.hourly["temperature_2m"][k] ?? 0),
        humidity: Number(raw.hourly["relative_humidity_2m"][k] ?? 0),
        precipProb: Number(raw.hourly["precipitation_probability"][k] ?? 0),
        rain: Number(raw.hourly["rain"][k] ?? 0),
        wind: Number(raw.hourly["wind_speed_10m"][k] ?? 0),
      };
    });

  const daily: ForecastDay[] = (raw.daily["time"] as string[]).map((d, i) => ({
    date: d,
    tempMax: Number(raw.daily["temperature_2m_max"][i] ?? 0),
    tempMin: Number(raw.daily["temperature_2m_min"][i] ?? 0),
    rainSum: Number(raw.daily["precipitation_sum"][i] ?? 0),
    precipProbMax: Number(raw.daily["precipitation_probability_max"][i] ?? 0),
    windMax: Number(raw.daily["wind_speed_10m_max"][i] ?? 0),
    uvMax: Number(raw.daily["uv_index_max"][i] ?? 0),
    sunrise: String(raw.daily["sunrise"][i] ?? ""),
    sunset: String(raw.daily["sunset"][i] ?? ""),
  }));

  return {
    now: {
      temperature: Number(raw.current["temperature_2m"] ?? 0),
      humidity: Number(raw.current["relative_humidity_2m"] ?? 0),
      rainfall: Number(raw.current["rain"] ?? raw.current["precipitation"] ?? 0),
      precipitationProbability: hourly[0]?.precipProb ?? 0,
      windSpeed: Number(raw.current["wind_speed_10m"] ?? 0),
      uv: Number(raw.current["uv_index"] ?? 0),
      cloudCover: Number(raw.current["cloud_cover"] ?? 0),
      isDay: Number(raw.current["is_day"] ?? 1) === 1,
      time: new Date().toISOString(),
    },
    hourly,
    daily,
    source: "Open-Meteo",
    timezone: raw.timezone,
  };
}

export async function geocodeSearch(query: string): Promise<GeoLocation[]> {
  if (!query.trim()) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const data = await cachedJson<{
    results?: {
      latitude: number;
      longitude: number;
      name: string;
      admin1?: string;
      admin2?: string;
      country?: string;
    }[];
  }>(`g:${query}`, url);
  return (data.results ?? []).map((r) => ({
    latitude: r.latitude,
    longitude: r.longitude,
    district: r.admin2 ?? r.name,
    state: r.admin1 ?? "",
    country: r.country ?? "",
    label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  const fallback: GeoLocation = {
    latitude: lat,
    longitude: lon,
    district: "Unknown district",
    state: "",
    country: "",
    label: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
  };
  try {
    const data = await cachedJson<{
      address?: Record<string, string>;
      display_name?: string;
    }>(
      `r:${lat.toFixed(2)},${lon.toFixed(2)}`,
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10`,
    );
    const a = data.address ?? {};
    return {
      latitude: lat,
      longitude: lon,
      district: a["state_district"] ?? a["county"] ?? a["city"] ?? a["town"] ?? fallback.district,
      state: a["state"] ?? "",
      country: a["country"] ?? "",
      label:
        [a["state_district"] ?? a["county"] ?? a["city"], a["state"], a["country"]]
          .filter(Boolean)
          .join(", ") || fallback.label,
    };
  } catch {
    return fallback;
  }
}

function textureOf(clay?: number, sand?: number): string | undefined {
  if (clay === undefined || sand === undefined) return undefined;
  if (clay >= 40) return "Clay / heavy soil";
  if (sand >= 65) return "Sandy / light soil";
  return "Loam / medium soil";
}

export async function fetchSoil(lat: number, lon: number): Promise<SoilInfo> {
  try {
    const url =
      `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat}&lon=${lon}` +
      `&property=phh2o&property=clay&property=sand&property=soc&depth=0-5cm&value=mean`;
    const data = await cachedJson<{
      properties?: { layers?: { name: string; depths: { values: { mean: number | null } }[] }[] };
    }>(`s:${lat.toFixed(2)},${lon.toFixed(2)}`, url);
    const layers = data.properties?.layers ?? [];
    const pick = (n: string) => {
      const v = layers.find((l) => l.name === n)?.depths?.[0]?.values?.mean;
      return v === null || v === undefined ? undefined : v;
    };
    const ph = pick("phh2o");
    const clay = pick("clay");
    const sand = pick("sand");
    const soc = pick("soc");
    if (ph === undefined && clay === undefined) throw new Error("no data");
    return {
      available: true,
      phh2o: ph !== undefined ? Math.round((ph / 10) * 10) / 10 : undefined,
      clay: clay !== undefined ? Math.round(clay / 10) : undefined,
      sand: sand !== undefined ? Math.round(sand / 10) : undefined,
      soc: soc !== undefined ? Math.round(soc / 10) / 10 : undefined,
      texture: textureOf(clay !== undefined ? clay / 10 : undefined, sand !== undefined ? sand / 10 : undefined),
      source: "SoilGrids (ISRIC)",
    };
  } catch {
    return {
      available: false,
      source: "unavailable",
      note: "Soil service unavailable — advisory continues without soil context.",
    };
  }
}

export function demoSoil(): SoilInfo {
  return {
    available: true,
    phh2o: 6.8,
    clay: 38,
    sand: 31,
    soc: 1.1,
    texture: "Clay loam (demo)",
    source: "DEMO",
  };
}
