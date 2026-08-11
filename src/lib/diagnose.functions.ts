import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { diagnosisSchema, type Diagnosis } from "./types";

const inputSchema = z.object({
  imageDataUrl: z.string().min(32),
  crop: z.string().min(1),
  growthStage: z.string().optional(),
  notes: z.string().optional(),
  language: z.enum(["en", "te"]).default("en"),
  context: z
    .object({
      place: z.string().optional(),
      temperature: z.number().optional(),
      humidity: z.number().optional(),
      rainfall: z.number().optional(),
      precipProb: z.number().optional(),
      soil: z.string().optional(),
    })
    .optional(),
});

const SYSTEM = `You are an agronomy vision assistant for the AgriShield AI decision-support system.
You look at a farmer's crop photograph and return a STRICT JSON diagnosis.

Hard rules:
- Never invent certainty. If the image is blurry, dark, too far away, or shows no plant leaf, say so.
- If the image does not contain a plant or crop leaf, set condition to "not_a_plant", disease to "No crop leaf identified", confidence <= 20.
- If you cannot tell which problem it is, use condition "unclear".
- NEVER give pesticide dosages, concentrations, or product brand names. Give practice-level guidance only
  (sanitation, water management, resistant varieties, timing, scouting) and state that any chemical must follow
  locally approved product labels and the local agricultural authority's recommendation.
- confidence is 0-100 and must honestly reflect image evidence.
- alternative_diagnoses probabilities should roughly sum to 100 with the main diagnosis.
- Language of all human-readable text fields must match the requested language ("en" = simple English, "te" = Telugu).
- Keep the language simple enough for a farmer with no scientific training.

Return ONLY JSON matching this shape:
{"crop":string,"condition":"healthy"|"disease"|"pest"|"nutrient_deficiency"|"unclear"|"not_a_plant","disease":string,
"confidence":number,"severity":"none"|"low"|"moderate"|"high"|"critical"|"unknown","severity_percent":number,
"symptoms":string[],"reasoning":string,"could_be_wrong":string[],"distinguish_tips":string[],
"immediate_actions":string[],"treatment":string[],
"alternative_diagnoses":[{"name":string,"probability":number}],
"image_quality":{"usable":boolean,"issues":string[],"advice":string[]}}`;

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced?.[1] ?? text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  return JSON.parse(body.slice(start, end + 1));
}

export const diagnoseImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; diagnosis: Diagnosis } | { ok: false; error: string; code: number }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, error: "AI service is not configured on the server.", code: 500 };

    const ctx = data.context ?? {};
    const userText = [
      `Crop selected by the farmer: ${data.crop}`,
      data.growthStage ? `Growth stage: ${data.growthStage}` : "",
      data.notes ? `Farmer's own description: ${data.notes}` : "",
      ctx.place ? `Location: ${ctx.place}` : "",
      ctx.temperature !== undefined ? `Temperature: ${ctx.temperature} C` : "",
      ctx.humidity !== undefined ? `Humidity: ${ctx.humidity} %` : "",
      ctx.rainfall !== undefined ? `Recent rainfall: ${ctx.rainfall} mm` : "",
      ctx.precipProb !== undefined ? `Chance of rain soon: ${ctx.precipProb} %` : "",
      ctx.soil ? `Soil context: ${ctx.soil}` : "",
      `Answer language: ${data.language}`,
      "Diagnose the attached photograph and return only the JSON object.",
    ]
      .filter(Boolean)
      .join("\n");

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          messages: [
            { role: "system", content: SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: data.imageDataUrl } },
              ],
            },
          ],
        }),
      });
    } catch {
      return { ok: false, error: "Could not reach the AI service. Check your connection and retry.", code: 503 };
    }

    if (res.status === 429)
      return { ok: false, error: "AI rate limit reached. Please wait a moment and try again.", code: 429 };
    if (res.status === 402)
      return { ok: false, error: "AI credits exhausted. Add credits in your Lovable workspace to continue.", code: 402 };
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `AI service error (${res.status}). ${detail.slice(0, 200)}`, code: res.status };
    }

    try {
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content ?? "";
      const parsed = diagnosisSchema.parse(extractJson(content));
      return { ok: true, diagnosis: parsed };
    } catch {
      return {
        ok: false,
        error: "The AI response could not be read reliably. Please retry with a clearer photo.",
        code: 422,
      };
    }
  });
