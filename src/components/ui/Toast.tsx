import { useEffect } from 'react';
import { Check } from 'lucide-react';

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-navy-900 text-white px-4 py-2 text-sm shadow-glow dark:bg-violet-600"
    >
      <Check className="h-4 w-4" aria-hidden />
      {message}
    </div>
  );
}