import { useState } from "react";
import { Check, Crown, Star, X, Zap } from "lucide-react";
import { setTier, type UserSession } from "@/lib/linkClient";

type PlanKey = "free" | "pro" | "extended";

const PLANS: Record<
  PlanKey,
  { name: string; icon: typeof Zap; price: number; tagline: string; features: string[]; badge?: string }
> = {
  free: {
    name: "Free",
    icon: Zap,
    price: 0,
    tagline: "Get started with the basics",
    features: [
      "Up to 3 rooms",
      "Basic file transfer",
      "1 GB storage",
      "Task list — no icons, no end task",
      "No admin / terminal access",
    ],
  },
  pro: {
    name: "Pro",
    icon: Star,
    price: 8,
    tagline: "For everyday remote work",
    badge: "Best value",
    features: [
      "Unlimited rooms",
      "Priority file transfer",
      "50 GB storage",
      "Task list — end task allowed (no icons)",
      "Admin / terminal access",
      "Power actions & alerts",
    ],
  },
  extended: {
    name: "Extended",
    icon: Crown,
    price: 25,
    tagline: "Full control, nothing held back",
    badge: "Best star",
    features: [
      "Everything in Pro",
      "500 GB storage",
      "Task list — full icons for App, Background, Window & Browser",
      "Browser tab-level task list",
      "Cursor & screen control",
      "Priority support",
    ],
  },
};

const DURATIONS = [
  { months: 1, label: "1 month", discount: 0 },
  { months: 3, label: "3 months", discount: 5 },
  { months: 6, label: "6 months", discount: 10 },
  { months: 12, label: "12 months", discount: 20 },
];

export function PricingDialog({
  open,
  onClose,
  user,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  user: UserSession;
  onUpdated: (user: UserSession) => void;
}) {
  const [buyPlan, setBuyPlan] = useState<PlanKey | null>(null);
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const chosen = buyPlan ? PLANS[buyPlan] : null;
  const duration = DURATIONS.find((d) => d.months === months) ?? DURATIONS[0];
  const total = chosen ? Math.round(chosen.price * months * (1 - duration.discount / 100)) : 0;

  async function confirmBuy() {
    if (!buyPlan) return;
    setBusy(true);
    try {
      const updated = await setTier(user, buyPlan, months);
      onUpdated(updated);
      setBuyPlan(null);
    } catch {
      /* surfaced via the disabled state resetting — kept simple here */
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-border bg-card p-6 shadow-2xl md:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Choose your plan</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Signed in as <span className="text-foreground">{user.username}</span> — currently on{" "}
              <span className="font-semibold text-primary">{user.tierLabel}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="ios-btn grid size-9 place-items-center rounded-full bg-cardhover text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            const Icon = plan.icon;
            const isCurrent = user.tier === key;
            return (
              <div
                key={key}
                className={`relative flex flex-col rounded-2xl border p-5 ${
                  isCurrent ? "border-primary bg-primary/5" : "border-border bg-cardhover/40"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
                    {plan.badge}
                  </span>
                )}
                <Icon className="size-6 text-primary" />
                <h3 className="mt-3 text-base font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  ${plan.price}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  onClick={() => {
                    setBuyPlan(key);
                    setMonths(1);
                  }}
                  className={`ios-btn mt-5 w-full rounded-xl py-2.5 text-xs font-bold disabled:opacity-40 ${
                    key === "free"
                      ? "border border-border bg-cardhover text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {isCurrent ? "Current plan" : key === "free" ? "Downgrade to Free" : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {chosen && (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {chosen.name === "Free" ? "Confirm downgrade" : `Subscribe to ${chosen.name}`}
              </h3>
              <button
                onClick={() => setBuyPlan(null)}
                className="ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {chosen.price > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.months}
                    onClick={() => setMonths(d.months)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs ${
                      months === d.months ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    <div className="font-semibold">{d.label}</div>
                    {d.discount > 0 && <div className="text-[10px]">{d.discount}% off</div>}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-border bg-cardhover/60 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{chosen.name} · {months} mo</span>
                <span className="font-bold text-foreground">${total}</span>
              </div>
            </div>

            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
              No payment processor is connected yet — this updates your plan directly without charging
              anything. Real billing needs a Stripe (or similar) account wired in first.
            </p>

            <button
              disabled={busy}
              onClick={() => void confirmBuy()}
              className="ios-btn mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40"
            >
              {busy ? "…" : chosen.price > 0 ? `Buy — $${total}` : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
