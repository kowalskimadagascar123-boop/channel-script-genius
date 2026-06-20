import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import JSZip from "jszip";

export const Route = createFileRoute("/codigo")({
  head: () => ({
    meta: [
      { title: "Código-fonte" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CodigoPage,
});

const PASSWORD = "36737829";

// Bundle all source files at build time as raw strings.
const rawFiles = import.meta.glob(
  [
    "/src/**/*",
    "/supabase/**/*",
    "/public/**/*",
    "/*.{ts,tsx,js,jsx,json,md,css,html,toml,yaml,yml,mjs,cjs}",
    "/.env*",
    "/.prettierrc",
    "/.prettierignore",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

function CodigoPage() {
  const [pwd, setPwd] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const files = useMemo(() => Object.keys(rawFiles).sort(), []);
  const filtered = useMemo(
    () => files.filter((f) => f.toLowerCase().includes(filter.toLowerCase())),
    [files, filter],
  );

  function tryUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (pwd === PASSWORD) {
      setOk(true);
      setErr("");
    } else {
      setErr("Senha incorreta");
    }
  }

  async function downloadZip() {
    const zip = new JSZip();
    for (const [path, content] of Object.entries(rawFiles)) {
      zip.file(path.replace(/^\//, ""), content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codigo-fonte-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadFile(path: string) {
    const content = rawFiles[path];
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() || "file.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <form
          onSubmit={tryUnlock}
          className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <h1 className="text-xl font-semibold">Área restrita</h1>
          <p className="text-sm text-muted-foreground">
            Digite a senha para acessar o código-fonte.
          </p>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Senha"
            autoFocus
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur p-4">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="text-lg font-semibold">Código-fonte ({files.length} arquivos)</h1>
            <p className="text-xs text-muted-foreground">
              Todo o código do site, navegável e baixável.
            </p>
          </div>
          <button
            onClick={downloadZip}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Baixar tudo (.zip)
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 p-4">
        <aside className="space-y-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar arquivos..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="max-h-[70vh] overflow-auto rounded-md border border-border bg-card">
            {filtered.map((f) => (
              <button
                key={f}
                onClick={() => setSelected(f)}
                className={`block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-accent ${
                  selected === f ? "bg-accent font-medium" : ""
                }`}
                title={f}
              >
                {f}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="p-3 text-xs text-muted-foreground">Nenhum arquivo.</p>
            )}
          </div>
        </aside>

        <main className="rounded-md border border-border bg-card overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <code className="text-xs">{selected}</code>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(rawFiles[selected])}
                    className="rounded border border-border px-2 py-1 text-xs hover:bg-accent"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={() => downloadFile(selected)}
                    className="rounded border border-border px-2 py-1 text-xs hover:bg-accent"
                  >
                    Baixar
                  </button>
                </div>
              </div>
              <pre className="max-h-[75vh] overflow-auto p-4 text-xs leading-relaxed">
                <code>{rawFiles[selected]}</code>
              </pre>
            </>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              Selecione um arquivo para ver o conteúdo.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
