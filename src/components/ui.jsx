export function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export function Card({ className, children, ...props }) {
  return (
    <section className={cn("panel app-card", className)} {...props}>
      {children}
    </section>
  );
}

export function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="app-section-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="app-section-icon mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={19} strokeWidth={2.2} />
          </div>
        ) : null}

        <div>
          {eyebrow ? (
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
              {eyebrow}
            </p>
          ) : null}

          <h2 className="app-section-title text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {title}
          </h2>

          {description ? (
            <p className="app-section-description mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  compact = false,
}) {
  return (
    <div
      className={cn(
        "app-empty-state flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-center",
        compact ? "px-5 py-8" : "px-6 py-14",
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
          <Icon size={22} />
        </div>
      ) : null}

      <h3 className="font-semibold text-slate-800">{title}</h3>

      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function TeamBadge({ name, color }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold 
text-slate-700" style={{ borderColor: `${color}55` }}>
      <span
        className="h-2.5 w-2.5 rounded-full shadow-sm"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = "blue",
}) {
  const tones = {
    blue: "from-blue-500 to-cyan-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-400 to-orange-500",
    red: "from-rose-500 to-red-600",
    violet: "from-violet-500 to-indigo-600",
    slate: "from-slate-500 to-slate-700",
  };

  return (
    <div className="app-metric-card panel relative overflow-hidden p-5">
      <div
        className={cn(
          "absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-10 blur-xl",
          tones[accent] ?? tones.blue,
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="app-metric-label text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="app-metric-value mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          {helper ? (
            <p className="app-metric-helper mt-1.5 text-xs leading-5 text-slate-500">
              {helper}
            </p>
          ) : null}
        </div>

        {Icon ? (
          <div
            className={cn(
              "app-metric-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
              tones[accent] ?? tones.blue,
            )}
          >
            <Icon size={19} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-3 shadow-xl backdrop-blur">
      {label !== undefined ? (
        <p className="mb-2 text-xs font-bold text-slate-800">{label}</p>
      ) : null}

      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <div
            key={`${item.dataKey}-${index}`}
            className="flex items-center justify-between gap-5 text-xs"
          >
            <span className="flex items-center gap-2 text-slate-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <strong className="text-slate-900">
              {formatter
                ? formatter(item.value, item.name, item)
                : item.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
