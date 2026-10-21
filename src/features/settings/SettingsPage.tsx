import { useSettings } from '@/hooks/useSettings';
import type { AngleMode, ThemeMode } from '@/types';
import { useState } from 'react';

export function SettingsPage() {
  const { settings, setSettings, reset } = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-navy-500 dark:text-navy-400">Preferences are stored locally in your browser.</p>
      </header>

      <section className="card p-4 space-y-4">
        <div>
          <span className="label">Theme</span>
          <div className="mt-2 inline-flex rounded-lg border border-navy-200 p-0.5 dark:border-navy-700">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
              <button
                key={t}
                onClick={() => setSettings({ theme: t })}
                aria-pressed={settings.theme === t}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${
                  settings.theme === t ? 'bg-violet-600 text-white' : 'text-navy-600 dark:text-navy-300'
                }`}
              >{t}</button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Angle mode</span>
          <div className="mt-2 inline-flex rounded-lg border border-navy-200 p-0.5 dark:border-navy-700">
            {(['deg', 'rad'] as AngleMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setSettings({ angleMode: m })}
                aria-pressed={settings.angleMode === m}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  settings.angleMode === m ? 'bg-violet-600 text-white' : 'text-navy-600 dark:text-navy-300'
                }`}
              >{m.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Significant digits</span>
          <input
            type="range"
            min={2}
            max={16}
            step={1}
            value={settings.precision}
            onChange={(e) => setSettings({ precision: Number(e.target.value) })}
            className="mt-2 w-full accent-violet-600"
            aria-valuemin={2}
            aria-valuemax={16}
            aria-valuenow={settings.precision}
          />
          <div className="text-xs text-navy-500 mt-1">Precision: {settings.precision} digits</div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.thousandsSeparator}
            onChange={(e) => setSettings({ thousandsSeparator: e.target.checked })}
            className="h-4 w-4 accent-violet-600"
          />
          Show thousands separators in results
        </label>
      </section>

      <section className="card p-4 space-y-3">
        <div className="label">Reset</div>
        <p className="text-sm text-navy-500 dark:text-navy-400">Restore default settings. History and notebooks are not affected.</p>
        {!confirmReset ? (
          <button className="btn-soft" onClick={() => setConfirmReset(true)}>Reset settings</button>
        ) : (
          <div className="flex gap-2">
            <button className="btn-soft" onClick={() => setConfirmReset(false)}>Cancel</button>
            <button className="btn-primary" onClick={() => { reset(); setConfirmReset(false); }}>Confirm reset</button>
          </div>
        )}
      </section>

      <section className="card p-4">
        <div className="label mb-2">Keyboard shortcuts</div>
        <ul className="text-sm space-y-1 font-mono">
          <li>0–9 . + − * / ( )  →  input</li>
          <li>Enter / =  →  evaluate</li>
          <li>Backspace  →  delete</li>
          <li>Esc  →  clear all</li>
        </ul>
      </section>

      <section className="card p-4 text-xs text-navy-500 dark:text-navy-400 space-y-1">
        <p>All CalcNova calculations and saved data live in your browser. No account, no server, no tracking.</p>
        <p>Online exchange rates and AI assistance are not enabled in this build. Do not expect them to work offline.</p>
      </section>
    </div>
  );
}