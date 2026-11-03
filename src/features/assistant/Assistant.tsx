import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, WifiOff, Trash2 } from 'lucide-react';
import { answerOffline, type AssistantReply } from './offlineEngine';
import { useHistory } from '@/hooks/useHistory';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  details?: string[];
  kind?: AssistantReply['kind'];
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// If you configured the endpoint in .env, it reads it here.
const ENDPOINT = import.meta.env.VITE_ASSISTANT_ENDPOINT as string | undefined;

export function Assistant() {
  const { addHistory } = useHistory();
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: 'assistant',
      text:
        'Hi. I am the CalcNova math assistant. I can help with arithmetic, equations, calculus, finance, stats and unit conversions. What would you like to calculate?',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [remoteAvailable, setRemoteAvailable] = useState<boolean>(!!ENDPOINT);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lastValue, setLastValue] = useState<number | undefined>(undefined);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, busy]);

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;
    
    setInput('');
    setBusy(true);

    const userMsg: Msg = { id: uid(), role: 'user', text: question };
    setMessages((m) => [...m, userMsg]);

    let reply: AssistantReply;
    let usedRemote = false;

    if (remoteAvailable && ENDPOINT) {
      try {
        // Pass the previous value as context to the AI
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ question, previousValue: lastValue }),
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = (await res.json()) as { text?: string; details?: string[] };
        reply = {
          kind: 'answer',
          text: data.text ?? '(No answer)',
          details: data.details,
        };
        usedRemote = true;
      } catch {
        setRemoteAvailable(false);
        reply = {
          kind: 'error',
          text:
            'Could not reach the online assistant. Falling back to the local engine — ask me again and I will answer offline.',
        };
      }
    } else {
      // Use the upgraded local engine
      reply = answerOffline(question, lastValue);
    }

    // Save the new context for the next follow-up
    if (reply.kind === 'answer' && reply.lastValue !== undefined) {
      setLastValue(reply.lastValue);
    }

    setMessages((m) => [
      ...m,
      {
        id: uid(),
        role: 'assistant',
        text: reply.text,
        details: reply.details,
        kind: reply.kind,
      },
    ]);

    if (reply.kind === 'answer' && !usedRemote) {
      addHistory(question, reply.text, 'Assistant');
    }

    setBusy(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        text: 'Cleared. Ask me another maths question.',
      },
    ]);
    setLastValue(undefined);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-180px)] max-w-3xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-violet-600" aria-hidden />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Math assistant</h1>
          <p className="text-sm text-navy-500 dark:text-navy-400">
            {remoteAvailable ? (
              <>Online mode — powered by secure serverless endpoint.</>
            ) : (
              <>Offline mode — everything runs on your device. Nothing is uploaded.</>
            )}
          </p>
        </div>
        {!remoteAvailable && (
          <span className="hidden items-center gap-1 rounded-full bg-navy-100 px-2 py-1 text-xs text-navy-600 dark:bg-navy-800 dark:text-navy-300 sm:inline-flex">
            <WifiOff className="h-3 w-3" aria-hidden /> Local
          </span>
        )}
        <button className="btn-ghost" onClick={clearChat} aria-label="Clear chat">
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </header>

      <div
        className="card flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Assistant conversation"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : m.kind === 'error'
                    ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    : m.kind === 'unsupported'
                      ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'bg-navy-100 text-navy-900 dark:bg-navy-800 dark:text-navy-100'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              {m.details && m.details.length > 0 && (
                <ul className="mt-2 space-y-0.5 border-t border-black/10 pt-2 text-xs opacity-90 dark:border-white/10">
                  {m.details.map((d, i) => (
                    <li key={i}>· {d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-navy-100 px-3.5 py-2.5 text-sm text-navy-500 dark:bg-navy-800 dark:text-navy-400">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex gap-2"
      >
        <input
          className="input"
          placeholder="e.g. solve 2x + 5 = 17, or mean of 2,4,5"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Ask a maths question"
        />
        <button className="btn-primary" type="submit" disabled={busy || !input.trim()}>
          <Send className="h-4 w-4" aria-hidden /> Send
        </button>
      </form>

      <details className="text-xs text-navy-500 dark:text-navy-400">
        <summary className="cursor-pointer">What can I ask?</summary>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Arithmetic: <code>2 + 3 * 4</code>, <code>sqrt(81)</code></li>
          <li>Equations: <code>solve 2x + 5 = 17</code></li>
          <li>Calculus: <code>derivative of x^2 * sin(x)</code></li>
          <li>Finance: <code>loan 200000 at 5% for 30 years</code></li>
          <li>Units: <code>convert 5 km to miles</code></li>
          <li>Stats: <code>mean of 2, 4, 4, 5</code></li>
          <li>Follow-ups: <code>divided by 3</code> (after a previous answer)</li>
        </ul>
      </details>
    </div>
  );
}