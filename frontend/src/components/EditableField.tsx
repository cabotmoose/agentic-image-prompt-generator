import { useEffect, useRef, useState } from 'react';

type EditableFieldProps = {
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  type?: 'text' | 'number';
  autoOpen?: boolean;
};

export default function EditableField({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Click to edit',
  type = 'text',
  autoOpen = false,
}: EditableFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setDraft(String(value ?? ''));
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setDraft(String(value ?? ''));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, value]);

  useEffect(() => {
    if (autoOpen && !autoOpenRef.current) {
      setIsOpen(true);
    }
    autoOpenRef.current = autoOpen;
  }, [autoOpen]);

  const commitChange = (nextValue: string) => {
    setIsOpen(false);
    setDraft(nextValue);
    onChange(nextValue.trim());
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="px-2.5 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 shadow-sm transition hover:border-slate-500 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
      >
        {String(value ?? '') || placeholder}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-xl z-20 p-3">
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitChange(draft);
              }
              if (event.key === 'Escape') {
                setIsOpen(false);
                setDraft(String(value ?? ''));
              }
            }}
            type={type}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          />

          {suggestions.length > 0 && (
            <div className="mt-3 max-h-44 overflow-y-auto space-y-1">
              {suggestions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => commitChange(option)}
                  className="w-full text-left px-3 py-1.5 text-sm rounded-md text-slate-100 hover:bg-slate-800/80"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setDraft(String(value ?? ''));
              }}
              className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => commitChange(draft)}
              className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-500 text-white shadow hover:bg-blue-400"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
