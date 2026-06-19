import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import {
  listConversations,
  createConversation,
  getMessages,
  sendMessage,
  deleteConversation,
} from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Clapperboard,
  LogOut,
  Plus,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Download,
  Pencil,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type Area = "script" | "thumbnail" | "description" | "comment";
type Convo = { id: string; title: string; area: Area; updated_at: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url: string | null;
  created_at: string;
};

const AREAS: { id: Area; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "script", label: "Roteiro", icon: Pencil },
  { id: "thumbnail", label: "Thumbnail", icon: ImageIcon },
  { id: "description", label: "Descrição", icon: FileText },
  { id: "comment", label: "Comentário", icon: MessageSquare },
];

const PLACEHOLDERS: Record<Area, string> = {
  script: "Ex: roteiro de gameplay de Roblox que prende as crianças",
  thumbnail: "Ex: thumbnail estilo MrBeast, fundo vermelho, cara de surpresa",
  description: "Ex: descrição pro vídeo de Roblox com link do jogo e do Discord",
  comment: "Ex: comentário fixado com cupom DESCONTO10 e link do canal",
};

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [{ title: "RoteiroTube — Chat de criação para YouTube" }],
  }),
  component: AppChat,
});

function CopyButton({ text }: { text: string }) {
  const [c, setC] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setC(true);
        toast.success("Copiado!");
        setTimeout(() => setC(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-card/80 px-2 py-1 text-xs transition hover:bg-card"
    >
      {c ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {c ? "Ok" : "Copiar"}
    </button>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const text = String(children).replace(/\n$/, "");
  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-border bg-background/60">
      <div className="absolute right-2 top-2">
        <CopyButton text={text} />
      </div>
      <pre className="overflow-x-auto p-4 pr-20 text-sm">
        <code>{text}</code>
      </pre>
    </div>
  );
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-display prose-h1:text-xl prose-h2:text-lg prose-h2:mt-4 prose-h3:text-base prose-p:leading-relaxed prose-p:my-2 prose-strong:text-primary prose-li:my-0.5 prose-hr:border-border prose-a:text-primary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className || "") || String(children).includes("\n");
            if (isBlock) return <CodeBlock>{children}</CodeBlock>;
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function AppChat() {
  const navigate = useNavigate();
  const loadProfile = useServerFn(getMyProfile);
  const listFn = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const msgsFn = useServerFn(getMessages);
  const sendFn = useServerFn(sendMessage);
  const delFn = useServerFn(deleteConversation);

  const [area, setArea] = useState<Area>("script");
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial: profile check
  useEffect(() => {
    loadProfile().then((p) => {
      if (!p?.onboarding_completed) navigate({ to: "/onboarding" });
    });
  }, [loadProfile, navigate]);

  // Load conversations when area changes
  useEffect(() => {
    let mounted = true;
    listFn({ data: { area } }).then(async (rows) => {
      if (!mounted) return;
      const list = rows as Convo[];
      setConvos(list);
      if (list.length > 0) {
        setActiveId(list[0].id);
      } else {
        // Auto-create first conversation
        const c = (await createFn({ data: { area } })) as Convo;
        setConvos([c]);
        setActiveId(c.id);
      }
    });
    return () => {
      mounted = false;
    };
  }, [area, listFn, createFn]);

  // Load messages when active changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setLoadingConvo(true);
    msgsFn({ data: { conversationId: activeId } })
      .then((rows) => setMessages(rows as Msg[]))
      .finally(() => setLoadingConvo(false));
  }, [activeId, msgsFn]);

  // Pending topic from landing
  useEffect(() => {
    if (!activeId || messages.length > 0) return;
    if (typeof window === "undefined") return;
    const pending = sessionStorage.getItem("pendingTopic");
    if (pending) {
      sessionStorage.removeItem("pendingTopic");
      setInput(pending);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [activeId, messages.length]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Keep input focused
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId, area]);

  const newChat = async () => {
    const c = (await createFn({ data: { area } })) as Convo;
    setConvos((cs) => [c, ...cs]);
    setActiveId(c.id);
    setMessages([]);
    setSidebarOpen(false);
  };

  const removeConvo = async (id: string) => {
    if (!confirm("Apagar essa conversa?")) return;
    await delFn({ data: { conversationId: id } });
    const next = convos.filter((c) => c.id !== id);
    setConvos(next);
    if (activeId === id) {
      if (next.length > 0) setActiveId(next[0].id);
      else {
        const c = (await createFn({ data: { area } })) as Convo;
        setConvos([c]);
        setActiveId(c.id);
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    const optimistic: Msg = {
      id: "tmp-" + Date.now(),
      role: "user",
      content: text,
      image_url: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    try {
      const out = await sendFn({ data: { conversationId: activeId, content: text } });
      const assistant = (out as { assistant: Msg }).assistant;
      setMessages((m) => [...m, assistant]);
      // Update convo title in sidebar after first msg
      setConvos((cs) =>
        cs.map((c) =>
          c.id === activeId && c.title === "Nova conversa"
            ? { ...c, title: text.slice(0, 50) }
            : c,
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar.");
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-hero text-foreground">
      <Toaster richColors theme="dark" position="top-center" />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card/95 backdrop-blur transition-transform md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-glow">
              <Clapperboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-semibold">RoteiroTube</span>
          </div>
          <button
            className="md:hidden rounded-md p-1 hover:bg-muted"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Area tabs */}
        <div className="grid grid-cols-2 gap-1.5 border-b border-border p-3">
          {AREAS.map((a) => {
            const Icon = a.icon;
            const active = area === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setArea(a.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  active
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-input/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {a.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={newChat}
          className="mx-3 mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gradient px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.01]"
        >
          <Plus className="h-4 w-4" /> Nova conversa
        </button>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {convos.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-lg border px-2 py-2 text-sm transition ${
                  activeId === c.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-transparent hover:bg-muted/50"
                }`}
              >
                <button
                  onClick={() => {
                    setActiveId(c.id);
                    setSidebarOpen(false);
                  }}
                  className="flex-1 truncate text-left"
                >
                  {c.title || "Nova conversa"}
                </button>
                <button
                  onClick={() => removeConvo(c.id)}
                  className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-destructive/20 hover:text-destructive transition"
                  aria-label="Apagar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={logout}
          className="m-3 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm transition hover:bg-card"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border bg-card/40 px-4 py-3 backdrop-blur">
          <button
            className="md:hidden rounded-md p-1.5 hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-base font-semibold">
            {AREAS.find((a) => a.id === area)?.label}
          </h1>
          <span className="text-xs text-muted-foreground">
            · Converse com a IA pra criar e ajustar
          </span>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {loadingConvo && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingConvo && messages.length === 0 && (
              <div className="rounded-2xl border border-border bg-card/50 p-6 text-center">
                <h2 className="font-display text-lg font-semibold">
                  Como posso te ajudar com {AREAS.find((a) => a.id === area)?.label.toLowerCase()}?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Descreva sua ideia abaixo. Depois você pode pedir pra modificar, encurtar, trocar o
                  tom — eu lembro do contexto.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {m.image_url && (
                      <div className="rounded-2xl border border-border bg-background/40 p-3">
                        <img
                          src={m.image_url}
                          alt="Thumbnail"
                          className="w-full rounded-xl border border-border"
                        />
                        <a
                          href={m.image_url}
                          download="thumbnail.png"
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition hover:bg-input"
                        >
                          <Download className="h-4 w-4" /> Baixar
                        </a>
                      </div>
                    )}
                    {m.content && <Markdown content={m.content} />}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {area === "thumbnail" ? "Gerando imagem..." : "Pensando..."}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-card/40 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-input/40 p-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={PLACEHOLDERS[area]}
                rows={1}
                disabled={sending}
                className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow transition hover:scale-[1.04] disabled:opacity-50"
                aria-label="Enviar"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Enter envia · Shift+Enter quebra linha
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
