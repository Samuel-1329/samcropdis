import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, Crosshair } from "lucide-react";
import { geocodeSearch, reverseGeocode } from "@/lib/weather";
import type { GeoLocation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LocationPicker({
  value,
  onChange,
}: {
  value: GeoLocation | null;
  onChange: (l: GeoLocation) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      geocodeSearch(query)
        .then(setResults)
        .catch(() => setError("Place search unavailable. Try again or use current location."));
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function useCurrent() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This device does not support location. Please type your place name.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        onChange(loc);
        setBusy(false);
      },
      () => {
        setBusy(false);
        setError("Location permission denied. Please type your place name below.");
      },
      { timeout: 10000, enableHighAccuracy: false },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={useCurrent} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
          Use my current location
        </Button>
        {value && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-xs">
            <MapPin className="size-3.5 text-healthy" />
            {value.label}
            <span className="font-mono text-muted-foreground">
              {value.latitude.toFixed(3)}, {value.longitude.toFixed(3)}
            </span>
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Type a village, town or district (e.g. Vijayawada)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search for a location"
        />
      </div>

      {error && <p className="text-xs text-warning">{error}</p>}

      {results.length > 0 && (
        <ul className="max-h-52 overflow-auto rounded-xl border border-border bg-surface/70">
          {results.map((r) => (
            <li key={`${r.latitude}-${r.longitude}`}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                onClick={() => {
                  onChange(r);
                  setResults([]);
                  setQuery("");
                }}
              >
                {r.label}
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                  {r.latitude.toFixed(2)}, {r.longitude.toFixed(2)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
