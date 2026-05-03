"use client";

import * as React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/* ============================================================
 *  Button
 * ============================================================ */
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-white hover:bg-ink-soft focus-visible:ring-ink",
  secondary:
    "bg-paper-alt text-ink hover:bg-border focus-visible:ring-ink",
  ghost: "bg-transparent text-ink hover:bg-paper-alt focus-visible:ring-ink",
  outline:
    "bg-transparent text-ink border border-border hover:bg-paper-alt focus-visible:ring-ink",
  danger:
    "bg-red text-white hover:opacity-90 focus-visible:ring-red",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

/* ============================================================
 *  Input
 * ============================================================ */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

/* ============================================================
 *  Label
 * ============================================================ */
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-medium text-ink-soft uppercase tracking-wide",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

/* ============================================================
 *  Card / Section
 * ============================================================ */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-5 py-4 border-b border-border",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="font-serif text-[17px] leading-tight text-ink">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

/* ============================================================
 *  Section header com label-mono (estilo do protótipo)
 * ============================================================ */
export function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted whitespace-nowrap">
        {children}
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ============================================================
 *  Tabs simples
 * ============================================================ */
export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)} data-tabs-value={value}>
      <TabsContext.Provider value={{ value, setValue: onValueChange }}>
        {children}
      </TabsContext.Provider>
    </div>
  );
}
const TabsContext = React.createContext<{
  value: string;
  setValue: (v: string) => void;
}>({ value: "", setValue: () => {} });

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-paper-alt p-1 text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      data-state={active ? "active" : "inactive"}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "px-3 py-1.5 rounded text-xs font-medium transition-colors",
        active
          ? "bg-card text-ink shadow-sm"
          : "text-ink-soft hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}

/* ============================================================
 *  Badge
 * ============================================================ */
type BadgeTone = "default" | "ok" | "warn" | "danger" | "info" | "violet";
const badgeTones: Record<BadgeTone, string> = {
  default: "bg-paper-alt text-ink-soft",
  ok: "bg-green-soft text-green",
  warn: "bg-amber-soft text-amber",
  danger: "bg-red-soft text-red",
  info: "bg-blue-soft text-blue",
  violet: "bg-violet-soft text-violet",
};
export function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ============================================================
 *  StatCard (replica o stat-card do protótipo)
 * ============================================================ */
type StatTone = "ink" | "blue" | "green" | "amber" | "red" | "violet";
const statTones: Record<StatTone, string> = {
  ink: "before:bg-ink",
  blue: "before:bg-blue",
  green: "before:bg-green",
  amber: "before:bg-amber",
  red: "before:bg-red",
  violet: "before:bg-violet",
};
export function StatCard({
  label,
  value,
  sub,
  tone = "ink",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: StatTone;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card px-5 py-4",
        "before:content-[''] before:absolute before:top-0 before:inset-x-0 before:h-[3px]",
        statTones[tone],
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-ink-muted mb-1">
        {label}
      </div>
      <div className="font-serif text-[22px] leading-none text-ink">
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-muted mt-1.5">{sub}</div>}
    </div>
  );
}

/* ============================================================
 *  Number input pt-BR (formata enquanto digita)
 * ============================================================ */
function parseNumberBR(s: string): number | null {
  if (!s.trim()) return null;
  const cleaned = s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

const fmtCacheBR = new Map<number, Intl.NumberFormat>();
function getFmtBR(maxDecimals: number) {
  let f = fmtCacheBR.get(maxDecimals);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    });
    fmtCacheBR.set(maxDecimals, f);
  }
  return f;
}

export interface NumberInputBRProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number | null | undefined;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  /** Casas decimais máximas. Default 2 (R$). Use 4-6 para taxas como INCC. */
  maxDecimals?: number;
}
export const NumberInputBR = React.forwardRef<HTMLInputElement, NumberInputBRProps>(
  function NumberInputBR(
    { value, onChange, prefix, suffix, className, maxDecimals = 2, ...props },
    ref,
  ) {
    const fmt = getFmtBR(maxDecimals);
    const [text, setText] = React.useState<string>(() =>
      value == null || value === 0 ? "" : fmt.format(value),
    );
    const [focused, setFocused] = React.useState(false);

    React.useEffect(() => {
      if (!focused) {
        setText(value == null || value === 0 ? "" : fmt.format(value));
      }
    }, [value, focused, fmt]);

    return (
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-xs text-ink-muted font-mono pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn(
            "font-mono text-right tabular-nums",
            prefix && "pl-9",
            suffix && "pr-9",
            className,
          )}
          value={text}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            const n = parseNumberBR(text);
            if (n != null) onChange(n);
            else if (text.trim() === "") onChange(0);
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            const n = parseNumberBR(raw);
            if (n != null) onChange(n);
          }}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-xs text-ink-muted font-mono pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  },
);

/* ============================================================
 *  Chips de meses (1..N)
 * ============================================================ */
export function MesesChips({
  total,
  selected,
  onChange,
}: {
  total: number;
  selected: number[];
  onChange: (v: number[]) => void;
}) {
  const set = new Set(selected);
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((m) => {
        const on = set.has(m);
        return (
          <button
            type="button"
            key={m}
            aria-pressed={on}
            aria-label={`Mês ${m}${on ? " selecionado" : ""}`}
            onClick={() => {
              const next = new Set(set);
              if (next.has(m)) next.delete(m);
              else next.add(m);
              onChange([...next].sort((a, b) => a - b));
            }}
            className={cn(
              "h-7 min-w-7 px-2 text-[11px] font-mono rounded-full border transition-colors",
              on
                ? "bg-ink text-white border-ink"
                : "bg-card text-ink-soft border-border hover:border-ink-soft",
            )}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
 *  Tooltip (Radix UI)
 * ============================================================ */
export function TooltipProvider({
  children,
  delayDuration = 200,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      {children}
    </RadixTooltip.Provider>
  );
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}) {
  if (!content) return <>{children}</>;
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-50 max-w-xs rounded-md bg-ink text-white px-3 py-2 text-[12px] leading-relaxed shadow-lg",
            "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
            "data-[state=delayed-open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-ink" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

/**
 * Ícone "?" pequeno com tooltip explicativo. Usado ao lado dos labels do form.
 */
export function FieldHelp({ text }: { text: React.ReactNode }) {
  if (!text) return null;
  return (
    <Tooltip content={text}>
      <span
        tabIndex={0}
        aria-label="Ajuda sobre este campo"
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-ink-muted text-ink-muted text-[9px] font-bold leading-none cursor-help select-none hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      >
        ?
      </span>
    </Tooltip>
  );
}

/* ============================================================
 *  Field wrapper (label + input + hint + ajuda)
 * ============================================================ */
export function Field({
  label,
  hint,
  help,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  help?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="flex items-center gap-1.5">
        {label}
        {help && <FieldHelp text={help} />}
      </Label>
      {children}
      {hint && <span className="text-[11px] text-ink-muted">{hint}</span>}
    </div>
  );
}
