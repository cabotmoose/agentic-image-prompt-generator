import { useState } from 'react';
import EditableField from './EditableField';

type EditableListFieldProps = {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
};

export default function EditableListField({ values, onChange, suggestions = [] }: EditableListFieldProps) {
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  const handleValueChange = (index: number, nextValue: string) => {
    const trimmed = nextValue.trim();
    if (!trimmed) {
      handleRemove(index);
      return;
    }

    const updated = values.map((currentValue, currentIndex) => {
      if (currentIndex !== index) return currentValue;
      return trimmed;
    });
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = values.filter((_, currentIndex) => currentIndex !== index);
    onChange(updated);
  };

  const handleAdd = () => {
    if (pendingValue !== null) return;
    setPendingValue('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex items-center gap-2">
          <EditableField
            value={value}
            suggestions={suggestions}
            onChange={(nextValue) => handleValueChange(index, nextValue)}
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="text-xs text-red-400 hover:text-red-200"
            aria-label="Remove value"
          >
            ×
          </button>
        </div>
      ))}

      {pendingValue !== null && (
        <div className="flex items-center gap-2">
          <EditableField
            value={pendingValue}
            suggestions={suggestions}
            placeholder="New value"
            autoOpen
            onChange={(nextValue) => {
              const trimmed = nextValue.trim();
              if (!trimmed) {
                setPendingValue(null);
                return;
              }
              onChange([...values, trimmed]);
              setPendingValue(null);
            }}
          />
          <button
            type="button"
            onClick={() => setPendingValue(null)}
            className="text-xs text-red-400 hover:text-red-200"
            aria-label="Cancel new value"
          >
            ×
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={pendingValue !== null}
        className="px-3 py-1.5 text-xs font-medium border border-dashed border-slate-700 text-slate-200 rounded-lg hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + Add value
      </button>
    </div>
  );
}
