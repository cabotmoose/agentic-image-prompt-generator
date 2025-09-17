import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useState } from 'react';

export type ProviderApiKeys = Record<string, string>;

interface SessionSnapshot {
  apiKeys: ProviderApiKeys;
  tokenUsage: number;
}

interface SessionContextValue extends SessionSnapshot {
  setApiKey: (provider: string, apiKey: string) => void;
  setApiKeys: (apiKeys: ProviderApiKeys) => void;
  addTokenUsage: (amount: number) => void;
  resetTokenUsage: () => void;
}

const SESSION_STORAGE_KEY = 'agentic-image-prompt-session';

const defaultSnapshot: SessionSnapshot = {
  apiKeys: {},
  tokenUsage: 0,
};

// eslint-disable-next-line react-refresh/only-export-components
export const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const normaliseKeys = (apiKeys: ProviderApiKeys): ProviderApiKeys => {
  const sanitised: ProviderApiKeys = {};
  Object.entries(apiKeys).forEach(([provider, key]) => {
    const trimmed = key.trim();
    if (trimmed.length > 0) {
      sanitised[provider] = trimmed;
    }
  });
  return sanitised;
};

const loadSnapshot = (): SessionSnapshot => {
  if (typeof window === 'undefined') {
    return defaultSnapshot;
  }

  try {
    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      return defaultSnapshot;
    }

    const parsed = JSON.parse(stored) as Partial<SessionSnapshot>;
    return {
      apiKeys: parsed.apiKeys ? normaliseKeys(parsed.apiKeys) : {},
      tokenUsage: typeof parsed.tokenUsage === 'number' && Number.isFinite(parsed.tokenUsage)
        ? parsed.tokenUsage
        : 0,
    };
  } catch (error) {
    console.warn('Failed to restore session snapshot', error);
    return defaultSnapshot;
  }
};

export function SessionProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() => loadSnapshot());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const toStore: SessionSnapshot = {
      apiKeys: snapshot.apiKeys,
      tokenUsage: snapshot.tokenUsage,
    };
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toStore));
  }, [snapshot]);

  const setApiKey = useCallback((provider: string, apiKey: string) => {
    setSnapshot((prev) => {
      const nextKeys = { ...prev.apiKeys };
      const trimmed = apiKey.trim();
      if (trimmed) {
        nextKeys[provider] = trimmed;
      } else {
        delete nextKeys[provider];
      }
      return { ...prev, apiKeys: nextKeys };
    });
  }, []);

  const setApiKeys = useCallback((apiKeys: ProviderApiKeys) => {
    setSnapshot((prev) => ({ ...prev, apiKeys: normaliseKeys(apiKeys) }));
  }, []);

  const addTokenUsage = useCallback((amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    setSnapshot((prev) => ({ ...prev, tokenUsage: prev.tokenUsage + amount }));
  }, []);

  const resetTokenUsage = useCallback(() => {
    setSnapshot((prev) => ({ ...prev, tokenUsage: 0 }));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      apiKeys: snapshot.apiKeys,
      tokenUsage: snapshot.tokenUsage,
      setApiKey,
      setApiKeys,
      addTokenUsage,
      resetTokenUsage,
    }),
    [snapshot.apiKeys, snapshot.tokenUsage, setApiKey, setApiKeys, addTokenUsage, resetTokenUsage]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
