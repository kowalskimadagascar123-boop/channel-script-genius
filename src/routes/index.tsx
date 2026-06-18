import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Wand2,
  Clapperboard,
  Loader2,
  Copy,
  Check,
  Youtube,
  Zap,
  Clock,
  Target,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateScript } from "@/lib/script.functions";
import { streamImage } from "@/lib/streamImage";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

function CopyableCode({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, "");
  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-border bg-background/60">
      <button
        onClick={onCopy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-card/80 px-2 py-1 text-xs transition hover:bg-card"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Ok" : "Copiar"}
      </button>
      <pre className="overflow-x-auto p-4 pr-20 text-sm">
        <code>{text}</code>
      </pre>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoteiroTube — Gerador de roteiros para YouTube grátis com IA" },
      {
        name: "description",
        content:
          "Crie roteiros profissionais para vídeos do YouTube em segundos. Grátis, com IA, em português. Defina tema, duração e tom — receba o roteiro pronto.",
      },
      { property: "og:title", content: "RoteiroTube — Roteiros de YouTube grátis com IA" },
      {
        property: "og:description",
        content: "Gere roteiros completos para seus vídeos do YouTube com IA, gratuitamente.",
      },
    ],
  }),
  component: Home,
});

type Duration = "short" | "medium" | "long";
type Tone = "casual" | "educativo" | "energetico" | "inspirador" | "humoristico";

function Home() {
  const run = useServerFn(generateScript);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState<Duration>("medium");
  const [tone, setTone] = useState<Tone>("casual");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailFinal, setThumbnailFinal] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 3) {
      toast.error("Descreva melhor o tema do vídeo.");
      return;
    }
    setLoading(true);
    setScript("");
    setThumbnail(null);
    setThumbnailFinal(false);
    try {
      const out = await run({ data: { topic, duration, tone, audience } });
      setScript(out.script);
      setTimeout(() => {
        document.getElementById("roteiro")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar roteiro.");
    } finally {
      setLoading(false);
    }
  };

  const generateThumb = async () => {
    setThumbLoading(true);
    setThumbnail(null);
    setThumbnailFinal(false);
    try {
      await streamImage("/api/generate-thumbnail", { topic }, (url, final) => {
        setThumbnail(url);
        if (final) setThumbnailFinal(true);
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar thumbnail.");
    } finally {
      setThumbLoading(false);
    }
  };

  const downloadThumb = () => {
    if (!thumbnail) return;
    const a = document.createElement("a");
    a.href = thumbnail;
    a.download = "thumbnail.png";
    a.click();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success("Roteiro copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-hero">
      <Toaster richColors theme="dark" position="top-center" />

      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Clapperboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">RoteiroTube</span>
        </div>
        <a
          href="#gerador"
          className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card"
        >
          Criar roteiro
        </a>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-12 pb-16 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          100% grátis · sem cadastro · IA em português
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl">
          Roteiros de YouTube <span className="text-brand-gradient">prontos em segundos</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Descreva sua ideia, escolha duração e tom — nossa IA escreve um roteiro completo com gancho,
          desenvolvimento, CTA e até sugestões de thumbnail.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#gerador"
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <Wand2 className="h-4 w-4" />
            Gerar meu roteiro grátis
          </a>
          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 font-medium backdrop-blur transition hover:bg-card"
          >
            Como funciona
          </a>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4">
          {[
            { icon: Zap, label: "Em 10 segundos" },
            { icon: Youtube, label: "Otimizado p/ YouTube" },
            { icon: Target, label: "Ganchos que prendem" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card/40 p-4 backdrop-blur shadow-card"
            >
              <Icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Generator */}
      <section id="gerador" className="container mx-auto px-6 pb-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card/70 p-6 backdrop-blur shadow-card sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
              <Wand2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Gerador de Roteiro</h2>
              <p className="text-sm text-muted-foreground">Preencha abaixo e receba seu roteiro.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Tema do vídeo *</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: 5 dicas para começar a investir do zero em 2026"
                rows={3}
                className="w-full resize-none rounded-xl border border-input bg-input/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Público-alvo (opcional)</label>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ex: iniciantes, mães, devs..."
                className="w-full rounded-xl border border-input bg-input/40 px-4 py-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  <Clock className="mr-1 inline h-3.5 w-3.5" /> Duração
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { v: "short", l: "Curto" },
                      { v: "medium", l: "Médio" },
                      { v: "long", l: "Longo" },
                    ] as { v: Duration; l: string }[]
                  ).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setDuration(o.v)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        duration === o.v
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border bg-input/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Tom</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full rounded-xl border border-input bg-input/40 px-4 py-2.5 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  <option value="casual">Casual</option>
                  <option value="educativo">Educativo</option>
                  <option value="energetico">Energético</option>
                  <option value="inspirador">Inspirador</option>
                  <option value="humoristico">Humorístico</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3.5 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.01] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Criando seu roteiro...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Gerar roteiro grátis
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result */}
        {script && (
          <div
            id="roteiro"
            className="mx-auto mt-8 max-w-3xl rounded-3xl border border-border bg-card/70 p-6 backdrop-blur shadow-card sm:p-10"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Seu roteiro</h3>
              <button
                onClick={copy}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-input/40 px-4 py-2 text-sm transition hover:bg-input"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-6 prose-h3:text-lg prose-p:leading-relaxed prose-strong:text-primary prose-li:my-1 prose-hr:border-border prose-a:text-primary prose-code:text-primary prose-code:before:hidden prose-code:after:hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => <>{children}</>,
                  code: ({ className, children, ...props }) => {
                    const isBlock = /language-/.test(className || "") || String(children).includes("\n");
                    if (isBlock) return <CopyableCode>{children}</CopyableCode>;
                    return (
                      <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {script}
              </ReactMarkdown>
            </div>

            {/* Thumbnail generator */}
            <div className="mt-8 rounded-2xl border border-border bg-background/40 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Thumbnail do vídeo</h4>
                </div>
                {thumbnail && thumbnailFinal && (
                  <button
                    onClick={downloadThumb}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition hover:bg-input"
                  >
                    <Download className="h-4 w-4" /> Baixar
                  </button>
                )}
              </div>

              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Thumbnail gerada"
                  className={`w-full rounded-xl border border-border transition-[filter] duration-500 ${
                    thumbnailFinal ? "blur-0" : "blur-xl"
                  }`}
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-background/40 text-sm text-muted-foreground">
                  Clique abaixo para gerar uma capa
                </div>
              )}

              <button
                onClick={generateThumb}
                disabled={thumbLoading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.01] disabled:opacity-70"
              >
                {thumbLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando capa...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    {thumbnail ? "Gerar outra" : "Gerar thumbnail com IA"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* How it works */}
      <section id="como-funciona" className="container mx-auto px-6 pb-24">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Como funciona</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Três passos simples para sair da ideia ao roteiro pronto para gravar.
        </p>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Descreva sua ideia",
              d: "Diga o tema do vídeo e, se quiser, o público que vai assistir.",
            },
            {
              n: "02",
              t: "Escolha o formato",
              d: "Selecione a duração e o tom que combinam com o seu canal.",
            },
            {
              n: "03",
              t: "Receba e grave",
              d: "Roteiro completo com gancho, blocos, CTA e ideias de thumbnail.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur shadow-card"
            >
              <div className="text-brand-gradient font-display text-3xl font-bold">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Feito com <span className="text-primary">♥</span> para criadores · RoteiroTube
      </footer>
    </div>
  );
}
