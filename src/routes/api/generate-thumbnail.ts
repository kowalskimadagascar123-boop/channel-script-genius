import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-thumbnail")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { topic } = (await request.json()) as { topic: string };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const prompt = `YouTube thumbnail, ultra eye-catching, vibrant saturated colors, dramatic lighting, bold expressive face reaction (mouth open, surprised), large bold sans-serif text overlay with short impactful words in Portuguese, high contrast, cinematic depth, 16:9 composition. Topic: ${topic}`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-image-2",
            prompt,
            quality: "low",
            size: "1536x1024",
            stream: true,
            partial_images: 2,
          }),
        });
        if (!upstream.ok || !upstream.body) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
