export function CalcNovaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-violet-400 dark:bg-violet-600 dark:text-white font-bold">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="currentColor" d="M6 18V6h2.5L12 12l3.5-6H18v12h-2.5v-7.5L12 17l-3.5-6.5V18z" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-semibold text-navy-900 dark:text-white">CalcNova</div>
          <div className="text-[10px] uppercase tracking-wider text-navy-400">Every calculation</div>
        </div>
      )}
    </div>
  );
}