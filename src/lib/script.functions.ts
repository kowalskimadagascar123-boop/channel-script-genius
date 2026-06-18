import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  topic: z.string().min(3).max(300),
  duration: z.enum(["short", "medium", "long"]),
  tone: z.enum(["casual", "educativo", "energetico", "inspirador", "humoristico"]),
  audience: z.string().max(200).optional().default(""),
});

const CATEGORY_LABELS: Record<string, string> = {
  games: "Games / Gameplay",
  infantil: "Infantil / Kids",
  educativo: "Educativo",
  rimas: "Rimas / Música / Poesia",
  lifestyle: "Vlog / Lifestyle",
  tech: "Tecnologia",
  comedia: "Comédia / Humor",
  outro: "Outro",
};

const STYLE_LABELS: Record<string, string> = {
  tutorial: "Tutoriais e passo-a-passo",
  reacao: "Reações e comentários",
  storytelling: "Storytelling / contação",
  gameplay: "Gameplay narrado",
  rimas: "RIMAS e versos (sempre incluir rimas no roteiro)",
  listas: "Top listas / rankings",
};

export const generateScript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente.");

    // Carregar perfil pra personalizar
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("channel_category, content_style, target_audience, preferred_tone, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    const durationMap = {
      short: "1-3 minutos (vídeo curto / Shorts)",
      medium: "5-8 minutos",
      long: "10-15 minutos",
    };

    const usesRhymes =
      profile?.content_style === "rimas" || profile?.channel_category === "rimas";

    const profileBlock = profile
      ? `PERFIL DO CRIADOR:
- Nome: ${profile.display_name ?? "criador"}
- Tipo de canal: ${CATEGORY_LABELS[profile.channel_category ?? ""] ?? profile.channel_category ?? "geral"}
- Estilo: ${STYLE_LABELS[profile.content_style ?? ""] ?? profile.content_style ?? "variado"}
- Público habitual: ${profile.target_audience ?? "geral"}
- Tom preferido: ${profile.preferred_tone ?? "casual"}`
      : "";

    const rhymesRule = usesRhymes
      ? `\n\n⚠️ IMPORTANTE: O canal trabalha com RIMAS. Você DEVE escrever boa parte da fala em rimas (estilo rap/poesia/cordel brasileiro), com métrica e flow. O gancho, CTA e encerramento OBRIGATORIAMENTE em rimas.`
      : "";

    const system = `Você é um roteirista de YouTube brasileiro experiente, que escreve como o próprio criador FALA — não como um texto formal.

${profileBlock}${rhymesRule}

REGRAS OBRIGATÓRIAS DE NATURALIDADE:
- Escreva em 1ª pessoa, como se o YouTuber estivesse gravando AGORA, falando direto pra câmera.
- Use linguagem coloquial brasileira: "cara", "mano", "tipo assim", "sério", "olha só", "pô", "véi" (com moderação).
- Frases curtas. Pensamentos cortados. Repetições naturais.
- NUNCA frases robóticas tipo "Neste vídeo, abordaremos..." ou "Espero que tenham gostado".
- Inclua reações genuínas, pausas ("...") e ênfases (CAPS em palavras-chave).
- Sugira ações na tela: [MOSTRAR GAMEPLAY], [CORTE RÁPIDO], [ZOOM NA CARA], [REAÇÃO].

ESTRUTURA DO ROTEIRO (markdown):
1. **🎬 Título sugerido**
2. **🎯 Ideia central** (1 frase)
3. **🔥 Gancho (0-15s)** — fala palavra por palavra
4. **📖 Desenvolvimento** — blocos numerados
5. **💬 CTA natural**
6. **👋 Encerramento**
7. **🖼️ Ideias de thumbnail** (2-3 opções)
8. **📝 Descrição do vídeo** (pronta pra colar — inclua LINKS e blocos de \`\`\`código\`\`\` quando fizer sentido)
9. **📌 Comentário fixado** (com links/jogos/sites/códigos em blocos copiáveis)
10. **🏷️ Tags**

Adapte tudo ao perfil do criador acima.`;

    const user = `Tema/ideia do vídeo: ${data.topic}
Duração-alvo: ${durationMap[data.duration]}
Tom desta vez: ${data.tone}
Público desta vez: ${data.audience || "padrão do perfil"}

Crie o roteiro completo agora.`;

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
