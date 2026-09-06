import { useState } from "react";
import { Lock, User } from "lucide-react";
import { signup, userLogin, saveUserSession, type UserSession } from "@/lib/linkClient";

export function AccountLogin({ onLoggedIn }: { onLoggedIn: (user: UserSession) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const user = mode === "login" ? await userLogin(username.trim(), password) : await signup(username.trim(), password);
      saveUserSession(user);
      onLoggedIn(user);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-[28px] border border-border bg-card p-7 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-foreground">FileLink</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "login" ? "Log in to continue" : "Create an account"}
          </p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Username</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void submit()}
                placeholder="yourname"
                className="w-full rounded-xl border border-border bg-cardhover py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void submit()}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-cardhover py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          </label>
        </div>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        <button
          disabled={busy || !username.trim() || !password}
          onClick={() => void submit()}
          className="ios-btn mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary"
        >
          {mode === "login" ? "No account yet? Create one" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
