import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Wand2,
  Clapperboard,
  Youtube,
  Zap,
  Target,
  ImageIcon,
  MessageSquare,
  Mic2,
  ArrowRight,
  Search,
  UserPlus,
  Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RoteiroTube — Roteiros de YouTube com IA, grátis e em português" },
      {
        name: "description",
        content:
          "Crie roteiros profissionais para vídeos do YouTube em segundos. Personalizado pro seu canal, com thumbnail, descrição e comentário fixado.",
      },
      { property: "og:title", content: "RoteiroTube — Roteiros de YouTube com IA" },
      {
        property: "og:description",
        content: "Roteiros prontos pra gravar, personalizados pro seu canal. Grátis.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (trimmed.length < 3) return;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pendingTopic", trimmed);
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      navigate({ to: "/app" });
    } else {
      navigate({ to: "/auth" });
    }
  };

  return (
    <div className="min-h-screen bg-hero">
      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Clapperboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">RoteiroTube</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#como-funciona"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            Como funciona
          </a>
          <Link
            to="/auth"
            className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pt-12 pb-16 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Grátis · personalizado pro seu canal · IA em português
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[1.05] sm:text-6xl md:text-7xl">
          Roteiros de YouTube <span className="text-brand-gradient">do jeito que você fala</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Digite a ideia do vídeo aqui embaixo. A IA gera o roteiro, a thumbnail, a descrição e
          o comentário fixado — tudo pronto pra colar.
        </p>

        {/* Search bar — gera direto */}
        <form
          onSubmit={handleGenerate}
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card/60 p-2 backdrop-blur shadow-card sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-center gap-2 px-3">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: vídeo de Roblox sobre o jogo Blox Fruits"
              className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <Wand2 className="h-4 w-4" />
            Gerar roteiro
          </button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Clica em <span className="font-semibold text-foreground">Gerar roteiro</span> — a gente
          te leva pro criador com o seu tema já preenchido.
        </p>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4">
          {[
            { icon: Zap, label: "Em segundos" },
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

      {/* Como funciona */}
      <section id="como-funciona" className="container mx-auto px-6 pb-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Como funciona</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          3 passos. Sem complicação.
        </p>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              icon: UserPlus,
              n: "1",
              t: "Cria sua conta",
              d: "Responde 4 perguntinhas rápidas sobre o seu canal pra IA aprender o seu estilo.",
            },
            {
              icon: Pencil,
              n: "2",
              t: "Digita a ideia",
              d: "Na barra de cima ou no botão de criar, descreve o vídeo que você quer fazer.",
            },
            {
              icon: Sparkles,
              n: "3",
              t: "Recebe o roteiro",
              d: "A IA gera o roteiro falado, thumbnail, descrição e comentário fixado — prontos.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-border bg-card/50 p-6 backdrop-blur shadow-card"
            >
              <div className="absolute -top-3 left-6 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-primary-foreground shadow-glow">
                {s.n}
              </div>
              <s.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <Wand2 className="h-4 w-4" />
            Criar meu primeiro roteiro
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 pb-24">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Tudo o que você precisa pra gravar</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Não é só o roteiro — é o pacote inteiro do vídeo.
        </p>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Mic2, t: "Roteiro falado", d: "Como se fosse você gravando — com gírias, pausas e marcações." },
            { icon: ImageIcon, t: "Thumbnail por IA", d: "Capa chamativa gerada na hora pro seu vídeo." },
            { icon: MessageSquare, t: "Descrição + tags", d: "Pronto pra colar no YouTube, otimizado pra SEO." },
            { icon: Target, t: "Comentário fixado", d: "Com links, jogos ou códigos copiáveis quando o tema pede." },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur shadow-card"
            >
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-3xl border border-border bg-card/60 p-8 text-center backdrop-blur shadow-card">
          <h3 className="text-2xl font-bold">Pronto pra começar?</h3>
          <p className="mt-2 text-muted-foreground">
            Cria sua conta, responde 4 perguntinhas sobre seu canal, e bora.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <Wand2 className="h-4 w-4" />
            Começar grátis
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Feito com <span className="text-primary">♥</span> para criadores · RoteiroTube
      </footer>
    </div>
  );
}
