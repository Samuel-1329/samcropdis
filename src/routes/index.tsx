import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudRain, Leaf, Radar, ShieldCheck, Sprout } from "lucide-react";
import { Farm3D } from "@/components/three/Farm3D";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriShield AI — From Field Image to Intelligent Action" },
      {
        name: "description",
        content:
          "Turn a crop photo into weather-aware agricultural intelligence: AI leaf diagnosis, disease risk forecasting and spray-safety timing for farmers.",
      },
      { property: "og:title", content: "AgriShield AI — From Field Image to Intelligent Action" },
      {
        property: "og:description",
        content: "AI crop disease diagnosis combined with live weather, soil and risk engines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen hero-gradient">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="flex items-center gap-2 font-semibold">
          <Sprout className="size-5 text-primary" /> {t("brand")}
        </span>
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          Dashboard
        </Link>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 pt-6 pb-16 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">{t("tagline")}</p>
            <h1 className="mt-4 text-4xl leading-tight font-bold sm:text-5xl">
              <span className="text-gradient">{t("heroTitle")}</span>
            </h1>
            <p className="mt-4 max-w-lg text-muted-foreground">{t("heroSub")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  <Leaf className="size-4" /> {t("scanCta")}
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/dashboard" search={{}}>
                  <Radar className="size-4" /> {t("demoCta")}
                </Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <li className="glass rounded-xl p-3">
                <ShieldCheck className="mb-1 size-4 text-primary" /> Schema-validated AI diagnosis
              </li>
              <li className="glass rounded-xl p-3">
                <CloudRain className="mb-1 size-4 text-water" /> Live Open-Meteo weather
              </li>
              <li className="glass rounded-xl p-3">
                <Radar className="mb-1 size-4 text-warning" /> 72-hour disease risk engine
              </li>
            </ul>
          </div>

          <div className="glass h-[360px] overflow-hidden rounded-3xl sm:h-[460px]">
            <Farm3D risk="MODERATE" raining />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <p className="glass rounded-2xl p-5 text-xs text-muted-foreground">{t("disclaimer")}</p>
        </section>
      </main>
    </div>
  );
}
