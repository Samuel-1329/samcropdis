import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

/** Microphone input using the browser Web Speech API (English + Telugu). */
export function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { lang, t } = useI18n();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
  }, []);

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang === "te" ? "te-IN" : "en-IN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from({ length: e.results.length }, (_, i) => e.results[i]?.[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (text) onTranscript(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant={listening ? "default" : "secondary"}
      size="sm"
      onClick={toggle}
      aria-pressed={listening}
      aria-label={t("speak")}
    >
      {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      {listening ? t("listening") : t("speak")}
    </Button>
  );
}
