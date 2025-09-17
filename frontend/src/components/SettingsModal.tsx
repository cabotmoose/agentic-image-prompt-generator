import { FormEvent, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ProviderApiKeys } from '@/context/SessionContext';
import { useSession } from '@/hooks/useSession';

const PROVIDERS: Array<{ id: string; label: string; helper?: string }> = [
  { id: 'openai', label: 'OpenAI API Key' },
  { id: 'anthropic', label: 'Anthropic API Key' },
  { id: 'google', label: 'Google API Key' },
  { id: 'lmstudio', label: 'LM Studio API Key', helper: 'Optional when running locally with open endpoints.' },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { apiKeys, setApiKeys, resetTokenUsage, tokenUsage } = useSession();
  const [draftKeys, setDraftKeys] = useState<ProviderApiKeys>({});

  const initialDraft = useMemo(() => {
    const base: ProviderApiKeys = {};
    PROVIDERS.forEach(({ id }) => {
      base[id] = apiKeys[id] ?? '';
    });
    return base;
  }, [apiKeys]);

  const tokenUsageDisplay = useMemo(
    () => tokenUsage.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    [tokenUsage]
  );

  useEffect(() => {
    if (open) {
      setDraftKeys(initialDraft);
    }
  }, [open, initialDraft]);

  if (!open) {
    return null;
  }

  const handleChange = (provider: string, key: string) => {
    setDraftKeys((prev) => ({ ...prev, [provider]: key }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiKeys(draftKeys);
    onClose();
  };

  const handleResetUsage = () => {
    resetTokenUsage();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Session Settings</h2>
            <p className="text-sm text-slate-400">
              Provide API keys for providers that are missing from your environment. Keys are stored in session storage and
              cleared when the tab is closed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-transparent p-1 text-slate-400 transition hover:border-slate-700 hover:text-white"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {PROVIDERS.map(({ id, label, helper }) => (
              <div key={id} className="space-y-2">
                <label htmlFor={`api-key-${id}`} className="block text-sm font-medium text-slate-200">
                  {label}
                </label>
                <input
                  id={`api-key-${id}`}
                  type="password"
                  spellCheck={false}
                  placeholder="Enter API key"
                  value={draftKeys[id] ?? ''}
                  onChange={(event) => handleChange(id, event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
                <p className="text-xs text-slate-500">
                  {helper ?? 'Leave blank to use environment configuration.'}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-200">Running token usage</p>
              <p className="text-xs text-slate-500">Tracks cumulative tokens for this session.</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-blue-300">{tokenUsageDisplay}</p>
              <button
                type="button"
                onClick={handleResetUsage}
                className="text-xs font-medium text-blue-400 transition hover:text-blue-200"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-500/90 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400"
            >
              Save session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
