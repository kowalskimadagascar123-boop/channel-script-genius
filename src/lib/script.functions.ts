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

    const system = `Você é um roteirista de YouTube brasileiro experiente, que escreve como o próprio criador FALA — não como um texto formal.

REGRAS OBRIGATÓRIAS DE NATURALIDADE:
- Escreva em 1ª pessoa, como se o YouTuber estivesse gravando AGORA, falando direto pra câmera.
- Use linguagem coloquial brasileira: "cara", "mano", "tipo assim", "sério", "olha só", "pô", "véi" (com moderação, sem forçar).
- Frases curtas. Pensamentos cortados. Repetições naturais ("isso, isso aqui é absurdo").
- NUNCA use frases robóticas tipo "Neste vídeo, abordaremos...", "Hoje iremos explorar...", "Espero que tenham gostado".
- Em vez disso: "Cara, presta atenção no que eu vou te mostrar", "Você não vai acreditar nisso aqui".
- Inclua reações genuínas, pausas ("...") e ênfases (CAPS em palavras-chave de impacto).
- Sugira momentos de ação na tela: [MOSTRAR GAMEPLAY], [CORTE RÁPIDO], [ZOOM NA CARA], [REAÇÃO].

ESTRUTURA DO ROTEIRO (em markdown):
1. **🎬 Título sugerido** (chamativo, estilo YouTube real, com gatilho de curiosidade)
2. **🎯 Ideia central** (1 frase: qual é o gancho que prende o público)
3. **🔥 Gancho (0-15s)** — texto falado palavra por palavra, MUITO forte
4. **📖 Desenvolvimento** — blocos numerados com fala + indicações de tela
5. **💬 CTA natural** (pedido de inscrição/like sem soar forçado, integrado ao tema)
6. **👋 Encerramento** (gancho pro próximo vídeo)
7. **🖼️ Ideias de thumbnail** (2-3 opções descritas visualmente — texto curto e expressão facial)
8. **📝 Descrição do vídeo** (pronta pra copiar e colar no YouTube — com quebras de linha, emojis, e se fizer sentido inclua blocos de LINKS, redes sociais, ou trechos copiáveis em \`\`\`código\`\`\`)
9. **📌 Comentário fixado** (escrito como se fosse o próprio criador comentando — engaja, faz pergunta, e se o vídeo envolve site/jogo/ferramenta/código, INCLUI o link ou trecho copiável formatado em bloco de código markdown)
10. **🏷️ Tags** (lista separada por vírgula, otimizada pra SEO)

Importante: o texto entre aspas/blocos é exatamente o que a pessoa vai FALAR. Escreva pra ser lido em voz alta.`;

    const user = `Tema/ideia do vídeo: ${data.topic}
Duração-alvo: ${durationMap[data.duration]}
Tom: ${data.tone}
Público: ${data.audience || "geral do YouTube brasileiro"}

Crie o roteiro completo agora, lembrando: tem que soar como a pessoa falando de verdade, não como IA.`;

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
