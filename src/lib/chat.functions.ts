import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AREA = z.enum(["script", "thumbnail", "description", "comment"]);
export type Area = z.infer<typeof AREA>;

const AREA_LABELS: Record<Area, string> = {
  script: "Roteiro",
  thumbnail: "Thumbnail",
  description: "Descrição",
  comment: "Comentário fixado",
};

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

function systemFor(area: Area, profile: any): string {
  const usesRhymes =
    profile?.content_style === "rimas" || profile?.channel_category === "rimas";
  const profileBlock = profile
    ? `PERFIL DO CRIADOR:
- Nome: ${profile.display_name ?? "criador"}
- Canal: ${CATEGORY_LABELS[profile.channel_category ?? ""] ?? profile.channel_category ?? "geral"}
- Estilo: ${profile.content_style ?? "variado"}
- Público: ${profile.target_audience ?? "geral"}
- Tom: ${profile.preferred_tone ?? "casual"}`
    : "";
  const rhymes = usesRhymes
    ? `\n⚠️ Canal de RIMAS: sempre que fizer sentido, escreva em rimas (rap/cordel/poesia BR), com flow e métrica.`
    : "";
  const channelAnalysis = profile?.channel_analysis
    ? `\n\n📊 BRIEFING INTERNO DO CANAL (contexto seu — NÃO mencionar, NÃO citar, NÃO repetir pro usuário; use só pra calibrar tom, temas, vícios a evitar e ângulos novos):\n${profile.channel_analysis}`
    : "";

  const common = `Você conversa em português do Brasil, de forma natural e amigável, como se fosse um parceiro de criação. Mantém o contexto da conversa. Quando o usuário pedir pra modificar, ajustar, encurtar, trocar tom, etc — você refaz com base na última versão. Use markdown quando ajudar (títulos, listas, blocos de \`código\` pra coisas copiáveis).

${profileBlock}${rhymes}${channelAnalysis}`;

  switch (area) {
    case "script":
      return `${common}

Sua função é ajudar a criar e refinar ROTEIROS de vídeos do YouTube.
- Escreva em 1ª pessoa, como se o YouTuber estivesse falando direto pra câmera.
- Linguagem coloquial brasileira ("cara", "tipo", "olha só"). Nada de "neste vídeo abordaremos".
- Frases curtas. Reações naturais. CAPS pra ênfase. Indicações tipo [CORTE], [ZOOM].
- Sempre que o usuário pedir um roteiro novo, entregue: 🎬 Título, 🔥 Gancho (0-15s), 📖 Desenvolvimento em blocos, 💬 CTA, 👋 Encerramento.
- Se o usuário pedir mudança, modifique o roteiro anterior sem recomeçar do zero.`;
    case "thumbnail":
      return `${common}

Sua função é ajudar a criar THUMBNAILS de vídeos do YouTube.
Quando o usuário descrever o vídeo, você vai GERAR uma imagem (a ferramenta de imagem é acionada automaticamente). Antes da imagem, responda em 1 ou 2 frases curtas explicando o conceito visual que você está criando (cores, expressão, texto na capa). Se o usuário pedir variações ou ajustes ("mais vermelho", "rosto mais surpreso", "trocar o texto"), gere uma nova versão da imagem.`;
    case "description":
      return `${common}

Sua função é escrever DESCRIÇÕES de vídeos do YouTube prontas pra colar.
- Comece com 2-3 linhas chamativas (aparecem antes do "mostrar mais").
- Inclua chamada pra inscrição, links úteis em blocos \`\`\`copiáveis\`\`\` (sites, jogos, redes sociais).
- Termine com hashtags relevantes e timestamps se fizer sentido.
- Quando o usuário pedir ajuste, modifique a versão anterior.`;
    case "comment":
      return `${common}

Sua função é escrever COMENTÁRIOS FIXADOS pro vídeo do YouTube.
- Tom de conversa com o público, puxando engajamento (pergunta no final).
- Inclua links, nomes de jogos, códigos, cupons em blocos \`\`\`copiáveis\`\`\` quando o vídeo envolver isso.
- Curto e direto (3-6 linhas).
- Quando o usuário pedir ajuste, modifique a versão anterior.`;
  }
}

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ area: AREA }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("conversations")
      .select("id, title, area, updated_at")
      .eq("user_id", context.userId)
      .eq("area", data.area)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ area: AREA }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("conversations")
      .insert({ user_id: context.userId, area: data.area, title: "Nova conversa" })
      .select("id, title, area, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, role, content, image_url, created_at")
      .eq("conversation_id", data.conversationId)
      .order("created_at");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("conversations")
      .delete()
      .eq("id", data.conversationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente.");

    // Load conversation
    const { data: convo, error: cErr } = await context.supabase
      .from("conversations")
      .select("id, area, title")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (cErr || !convo) throw new Error("Conversa não encontrada.");
    const area = convo.area as Area;

    // Load profile
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("channel_category, content_style, target_audience, preferred_tone, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    // Load history
    const { data: history } = await context.supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", data.conversationId)
      .order("created_at");

    // Save user message
    const { error: insErr } = await context.supabase.from("messages").insert({
      conversation_id: data.conversationId,
      user_id: context.userId,
      role: "user",
      content: data.content,
    });
    if (insErr) throw new Error(insErr.message);

    // If first user message, update title
    const isFirst = (history?.length ?? 0) === 0;
    if (isFirst) {
      const title = data.content.slice(0, 50);
      await context.supabase
        .from("conversations")
        .update({ title })
        .eq("id", data.conversationId);
    }

    let assistantContent = "";
    let imageUrl: string | null = null;

    if (area === "thumbnail") {
      // Generate image
      const lastVisual = [...(history ?? []), { role: "user", content: data.content }]
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join(" | ");
      const prompt = `YouTube thumbnail, ultra eye-catching, vibrant saturated colors, dramatic lighting, bold expressive face, large bold sans-serif Portuguese text overlay, high contrast, 16:9. Concept: ${lastVisual}`;
      const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-image-2",
          prompt,
          quality: "low",
          size: "1536x1024",
        }),
      });
      if (imgRes.status === 429) throw new Error("Limite de uso atingido. Tente novamente.");
      if (imgRes.status === 402) throw new Error("Créditos esgotados.");
      if (!imgRes.ok) throw new Error(`Erro ao gerar imagem (${imgRes.status})`);
      const imgJson = (await imgRes.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
      const item = imgJson.data?.[0];
      if (item?.b64_json) imageUrl = `data:image/png;base64,${item.b64_json}`;
      else if (item?.url) imageUrl = item.url;
      else throw new Error("Imagem não foi retornada.");
      assistantContent = "Aqui está a thumbnail que eu fiz. Se quiser ajustar (mais vermelho, trocar o texto, expressão mais surpresa...), é só me dizer.";
    } else {
      // Text chat
      const messages = [
        { role: "system" as const, content: systemFor(area, profile) },
        ...((history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))),
        { role: "user" as const, content: data.content },
      ];
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
      });
      if (res.status === 429) throw new Error("Limite de uso atingido. Tente novamente.");
      if (res.status === 402) throw new Error("Créditos esgotados.");
      if (!res.ok) throw new Error(`Erro (${res.status})`);
      const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
      assistantContent = json.choices?.[0]?.message?.content ?? "";
    }

    const { data: saved, error: sErr } = await context.supabase
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        user_id: context.userId,
        role: "assistant",
        content: assistantContent,
        image_url: imageUrl,
      })
      .select("id, role, content, image_url, created_at")
      .single();
    if (sErr) throw new Error(sErr.message);

    await context.supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.conversationId);

    return { assistant: saved };
  });

export { AREA_LABELS };
