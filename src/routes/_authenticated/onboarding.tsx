import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, saveOnboarding, analyzeChannel } from "@/lib/profile.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, ArrowRight, Check, Clapperboard, Youtube, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

type Question = {
  key: "channel_category" | "content_style" | "target_audience" | "preferred_tone";
  title: string;
  subtitle: string;
  options: { value: string; label: string; emoji: string }[];
};

const QUESTIONS: Question[] = [
  {
    key: "channel_category",
    title: "Sobre o que é seu canal?",
    subtitle: "Escolha a categoria principal do conteúdo que você cria.",
    options: [
      { value: "games", label: "Games / Gameplay", emoji: "🎮" },
      { value: "infantil", label: "Infantil / Kids", emoji: "🧸" },
      { value: "educativo", label: "Educativo", emoji: "📚" },
      { value: "rimas", label: "Rimas / Música / Poesia", emoji: "🎤" },
      { value: "lifestyle", label: "Vlog / Lifestyle", emoji: "✨" },
    ],
  },
  {
    key: "content_style",
    title: "Qual seu estilo de vídeo?",
    subtitle: "O formato que mais combina com você.",
    options: [
      { value: "tutorial", label: "Tutoriais / passo a passo", emoji: "🛠️" },
      { value: "reacao", label: "Reações e comentários", emoji: "😱" },
      { value: "storytelling", label: "Storytelling / contação", emoji: "📖" },
      { value: "gameplay", label: "Gameplay narrado", emoji: "🕹️" },
      { value: "rimas", label: "RIMAS e versos (com flow)", emoji: "🎵" },
    ],
  },
  {
    key: "target_audience",
    title: "Quem é seu público?",
    subtitle: "Pra quem você fala nos seus vídeos.",
    options: [
      { value: "criancas", label: "Crianças (até 12)", emoji: "🧒" },
      { value: "adolescentes", label: "Adolescentes (13-17)", emoji: "🎒" },
      { value: "jovens", label: "Jovens adultos (18-25)", emoji: "🧑" },
      { value: "adultos", label: "Adultos (26+)", emoji: "👤" },
      { value: "geral", label: "Público geral", emoji: "🌍" },
    ],
  },
  {
    key: "preferred_tone",
    title: "Qual seu tom favorito?",
    subtitle: "A energia padrão dos seus vídeos.",
    options: [
      { value: "energetico", label: "Animado e energético", emoji: "⚡" },
      { value: "calmo", label: "Calmo e didático", emoji: "🧘" },
      { value: "humoristico", label: "Engraçado / humor", emoji: "😂" },
      { value: "inspirador", label: "Inspirador e emocional", emoji: "🌟" },
      { value: "rimado", label: "Rimado / poético", emoji: "🎶" },
    ],
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const loadProfile = useServerFn(getMyProfile);
  const save = useServerFn(saveOnboarding);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile().then((p) => {
      if (p?.onboarding_completed) navigate({ to: "/app" });
    });
  }, [loadProfile, navigate]);

  const q = QUESTIONS[step];
  const selected = answers[q.key];
  const isLast = step === QUESTIONS.length - 1;

  const next = async () => {
    if (!selected) {
      toast.error("Escolhe uma opção pra continuar.");
      return;
    }
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          channel_category: answers.channel_category,
          content_style: answers.content_style,
          target_audience: answers.target_audience,
          preferred_tone: answers.preferred_tone,
        },
      });
      toast.success("Tudo pronto! Vamos criar seu primeiro roteiro 🚀");
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero">
      <Toaster richColors theme="dark" position="top-center" />
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Clapperboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">RoteiroTube</span>
        </div>
        <span className="text-sm text-muted-foreground">
          Passo {step + 1} de {QUESTIONS.length}
        </span>
      </header>

      <main className="container mx-auto px-6 pb-16">
        {/* Progress */}
        <div className="mx-auto mb-10 flex max-w-2xl gap-2">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition ${
                i <= step ? "bg-brand-gradient" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card/70 p-8 backdrop-blur shadow-card sm:p-10">
          <h1 className="text-3xl font-bold leading-tight">{q.title}</h1>
          <p className="mt-2 text-muted-foreground">{q.subtitle}</p>

          <div className="mt-8 space-y-3">
            {q.options.map((opt) => {
              const active = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAnswers({ ...answers, [q.key]: opt.value })}
                  className={`group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${
                    active
                      ? "border-primary bg-primary/15 shadow-glow"
                      : "border-border bg-input/30 hover:border-primary/50 hover:bg-input/50"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="flex-1 font-medium">{opt.label}</span>
                  {active && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-30"
            >
              Voltar
            </button>
            <button
              onClick={next}
              disabled={saving || !selected}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLast ? "Finalizar" : "Próximo"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
