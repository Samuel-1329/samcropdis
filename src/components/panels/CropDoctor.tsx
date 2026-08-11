import { useRef, useState } from "react";
import { AlertTriangle, Camera, Loader2, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Panel, Empty, Bar, RiskPill } from "@/components/ui-kit";
import { LocationPicker } from "@/components/LocationPicker";
import { VoiceInput } from "@/components/VoiceInput";
import { useFarm, useIntelligence } from "@/components/FarmProvider";
import { CROPS } from "@/lib/types";
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, checkImageQuality, compressImage, type QualityReport } from "@/lib/imageQuality";
import { useI18n } from "@/lib/i18n";
import { Advisory } from "@/components/panels/Advisory";

export function CropDoctor() {
  const { t } = useI18n();
  const farm = useFarm();
  const intel = useIntelligence();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [quality, setQuality] = useState<QualityReport | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [customCrop, setCustomCrop] = useState("");

  async function handleFile(file: File | undefined) {
    setFileError(null);
    setQuality(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Please use a JPG, JPEG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setFileError("That image is larger than 10 MB. Please use a smaller photo.");
      return;
    }
    const dataUrl = await compressImage(file);
    farm.setImage(dataUrl);
    try {
      setQuality(await checkImageQuality(dataUrl));
    } catch {
      setQuality(null);
    }
  }

  const canAnalyse = !!farm.image && !farm.analysing;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Panel title="1 · Crop" subtitle={t("selectCrop")}>
          <div className="flex flex-wrap gap-2">
            {CROPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => farm.setCrop(c)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  farm.crop === c
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface/60 hover:bg-accent"
                }`}
                aria-pressed={farm.crop === c}
              >
                {c}
              </button>
            ))}
          </div>
          {farm.crop === "Other" && (
            <Input
              className="mt-3"
              placeholder="Type your crop name"
              value={customCrop}
              onChange={(e) => {
                setCustomCrop(e.target.value);
                if (e.target.value.trim()) farm.setCrop(e.target.value.trim());
              }}
              aria-label="Custom crop name"
            />
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Growth stage (optional)"
              value={farm.growthStage}
              onChange={(e) => farm.setGrowthStage(e.target.value)}
              aria-label="Crop growth stage"
            />
            <div className="flex items-center">
              <VoiceInput onTranscript={(text) => farm.setNotes(`${farm.notes} ${text}`.trim())} />
            </div>
          </div>
          <Textarea
            className="mt-2"
            rows={2}
            placeholder="Describe what you see (optional) — e.g. brown spots on rice leaves"
            value={farm.notes}
            onChange={(e) => farm.setNotes(e.target.value)}
            aria-label="Additional symptoms"
          />
        </Panel>

        <Panel title="2 · Leaf photo" subtitle={t("uploadImage")}>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Upload photo
            </Button>
            <Button type="button" variant="secondary" onClick={() => cameraRef.current?.click()}>
              <Camera className="size-4" /> Take photo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </div>

          {fileError && <p className="mt-3 text-sm text-danger">{fileError}</p>}

          {farm.image && (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <img
                src={farm.image}
                alt="Uploaded crop leaf for diagnosis"
                className="max-h-64 w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {quality && quality.issues.length > 0 && (
            <div className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-warning">
                <AlertTriangle className="size-4" /> Photo quality check
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {quality.issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
                {quality.advice.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {quality && quality.issues.length === 0 && (
            <p className="mt-3 text-xs text-healthy">Photo quality looks good for analysis.</p>
          )}
        </Panel>

        <Panel title="3 · Location" subtitle="Weather, soil and risk use this position">
          <LocationPicker value={farm.location} onChange={farm.setLocation} />
          {farm.weatherError && (
            <p className="mt-3 text-xs text-warning">
              {farm.weatherError} The diagnosis will still run without weather.
            </p>
          )}
        </Panel>

        <div className="flex flex-wrap gap-2">
          <Button
            size="lg"
            disabled={!canAnalyse}
            onClick={() => farm.image && void farm.runDiagnosis(farm.image)}
          >
            {farm.analysing ? <Loader2 className="size-4 animate-spin" /> : null}
            {farm.analysing ? t("analysing") : t("analyze")}
          </Button>
          {farm.diagnosis && (
            <Button variant="ghost" onClick={farm.resetDiagnosis}>
              <RefreshCw className="size-4" /> New scan
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {farm.analysisError && (
          <Panel title="Analysis failed">
            <p className="text-sm text-danger">{farm.analysisError}</p>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => farm.image && void farm.runDiagnosis(farm.image)}
            >
              <RefreshCw className="size-4" /> Retry
            </Button>
          </Panel>
        )}

        {!farm.diagnosis && !farm.analysing && !farm.analysisError && (
          <Panel title="Advisory">
            <Empty>
              Choose your crop, add a clear leaf photo and your location, then run the analysis. Your
              advisory will appear here.
            </Empty>
          </Panel>
        )}

        {farm.analysing && (
          <Panel title="Analysing">
            <div className="space-y-3">
              <Bar label="Reading image" value={70} tone="healthy" />
              <Bar label="Matching symptoms" value={45} tone="water" />
              <Bar label="Combining weather + soil" value={30} tone="warning" />
              <p className="text-xs text-muted-foreground">
                This usually takes a few seconds. Please keep the page open.
              </p>
            </div>
          </Panel>
        )}

        {farm.diagnosis && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <RiskPill level={intel.risk.current.level} />
              <span className="text-xs text-muted-foreground">
                AI Decision Support Score:{" "}
                <span className="font-mono text-foreground">{intel.signals.total}/100</span>
              </span>
            </div>
            <Advisory />
          </>
        )}
      </div>
    </div>
  );
}
