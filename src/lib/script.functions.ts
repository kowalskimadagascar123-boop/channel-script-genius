import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  topic: z.string().min(3).max(300),
  duration: z.enum(["short", "medium", "long"]),
  tone: z.enum(["casual", "educativo", "energetico", "inspirador", "humoristico"]),
  audience: z.string().max(200).optional().default(""),
});

export const generateScript = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente.");

    const durationMap = {
      short: "1-3 minutos (vídeo curto / Shorts)",
      medium: "5-8 minutos",
      long: "10-15 minutos",
    };

    const system = `Você é um roteirista profissional de YouTube em português do Brasil.
Crie roteiros completos, envolventes e prontos para gravar.
Sempre estruture com: TÍTULO, GANCHO (primeiros 15s), INTRODUÇÃO, DESENVOLVIMENTO (com blocos numerados), CTA, ENCERRAMENTO e SUGESTÕES DE THUMBNAIL.
Use markdown limpo, emojis com moderação, e linguagem natural falada.`;

    const user = `Tema do vídeo: ${data.topic}
Duração-alvo: ${durationMap[data.duration]}
Tom: ${data.tone}
Público: ${data.audience || "geral"}

Gere o roteiro completo agora.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Limite de uso atingido. Tente novamente em alguns instantes.");
    if (res.status === 402) throw new Error("Créditos esgotados. Adicione créditos no Lovable AI.");
    if (!res.ok) throw new Error(`Erro ao gerar roteiro (${res.status})`);

    const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    return { script: content };
  });
