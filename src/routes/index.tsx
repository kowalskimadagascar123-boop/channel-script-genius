import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";

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
        <Link
          to="/auth"
          className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-card"
        >
          Entrar
        </Link>
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
          A gente aprende sobre o seu canal e gera roteiros que soam como você — com gancho,
          thumbnail, descrição e comentário fixado prontos pra colar.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            <Wand2 className="h-4 w-4" />
            Criar conta grátis
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 font-medium backdrop-blur transition hover:bg-card"
          >
            Ver o que faz
          </a>
        </div>

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
