import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const OnboardingSchema = z.object({
  channel_category: z.string().min(1).max(50),
  content_style: z.string().min(1).max(50),
  target_audience: z.string().min(1).max(50),
  preferred_tone: z.string().min(1).max(50),
  youtube_channel_url: z.string().trim().max(300).optional().default(""),
});

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => OnboardingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const url = (data.youtube_channel_url ?? "").trim();
    const { error } = await context.supabase
      .from("profiles")
      .update({
        channel_category: data.channel_category,
        content_style: data.content_style,
        target_audience: data.target_audience,
        preferred_tone: data.preferred_tone,
        youtube_channel_url: url || null,
        onboarding_completed: true,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ChannelUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(5)
    .max(300)
    .refine((u) => /youtube\.com|youtu\.be/i.test(u), {
      message: "Coloque um link do YouTube válido (youtube.com/@seucanal).",
    }),
});

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function extractFromHtml(html: string) {
  const og = (prop: string) => {
    const re = new RegExp(
      `<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    return html.match(re)?.[1] ?? "";
  };
  const ogTitle = og("og:title");
  const ogDesc = og("og:description");

  const subsMatches = uniq(
    Array.from(
      html.matchAll(
        /"(?:subscriberCountText|subscriberCount)"\s*:\s*(?:{[^}]*?"(?:simpleText|content)"\s*:\s*"([^"]+)"|"([^"]+)")/g,
      ),
    ).map((m) => m[1] || m[2]),
  ).slice(0, 3);

  const videoTitles = uniq(
    Array.from(
      html.matchAll(
        /"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]{6,120})"/g,
      ),
    ).map((m) => m[1]),
  ).slice(0, 30);

  return { ogTitle, ogDesc, subs: subsMatches, videoTitles };
}

export const analyzeChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ChannelUrlSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente.");

    let target = data.url;
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;

    let html = "";
    try {
      const res = await fetch(target, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      html = await res.text();
    } catch (e) {
      throw new Error(
        "Não consegui abrir esse link. Confere se tá certinho (ex: https://www.youtube.com/@seucanal).",
      );
    }

    const ex = extractFromHtml(html);

    const snippet = `URL: ${target}
Título (og): ${ex.ogTitle}
Descrição (og): ${ex.ogDesc}
Inscritos (raw): ${ex.subs.join(" | ") || "não encontrado"}
Títulos de vídeos detectados (amostra):
${ex.videoTitles.map((t, i) => `${i + 1}. ${t}`).join("\n") || "(nenhum)"}
`.slice(0, 6000);

    const system = `Você analisa canais do YouTube brasileiros pra criar um BRIEFING INTERNO que vai alimentar uma IA roteirista. Responda APENAS em markdown estruturado em português do Brasil, conciso e factual, sem enrolação. NÃO invente dados que não estão no input. Se algo não está claro, escreva "não identificado".`;

    const user = `A partir dos dados extraídos abaixo do canal, gere um briefing curto com estas seções:

## Canal
- Nome
- Inscritos (se aparecer)
- Nicho aparente

## Temas mais frequentes
(lista de 3-6 tópicos com base nos títulos)

## Estilo e tom percebido
(formato dos vídeos, energia, linguagem, padrões de título — clickbait, perguntas, números, emojis…)

## Vícios e padrões recorrentes
(palavras/frases/erros/manias que aparecem MUITO nos títulos — ex: começar com "EU", uso excessivo de CAPS, ponto de exclamação demais, repetição de termo X)

## Recomendações pra próximos roteiros
(3 a 5 bullets curtos: o que manter, o que evitar, ângulos novos pra explorar)

DADOS EXTRAÍDOS:
${snippet}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (res.status === 429) throw new Error("Limite de uso atingido. Tente em alguns instantes.");
    if (res.status === 402) throw new Error("Créditos da IA esgotados.");
    if (!res.ok) throw new Error(`Erro ao analisar (${res.status})`);
    const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const analysis = json.choices?.[0]?.message?.content ?? "";

    const { error: upErr } = await context.supabase
      .from("profiles")
      .update({ youtube_channel_url: target, channel_analysis: analysis })
      .eq("id", context.userId);
    if (upErr) throw new Error(upErr.message);

    return { analysis };
  });
