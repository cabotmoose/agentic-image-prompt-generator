import type { ReactNode } from 'react';
import EditableField from '@/components/EditableField';
import EditableListField from '@/components/EditableListField';
import { getSuggestionsForField } from '@/lib/fieldSuggestions';
import type { FieldSuggestionKey } from '@/lib/fieldSuggestions';
import type { GeneratePromptResponse, GeneratedPromptData, Subject } from '@/services/api';

interface RefineStepProps {
  editableData: GeneratedPromptData | null;
  onCameraChange: (field: keyof GeneratedPromptData['camera'], value: string) => void;
  onTopLevelChange: (field: keyof Omit<GeneratedPromptData, 'camera' | 'subjects'>, value: string) => void;
  onSubjectChange: <K extends keyof Subject>(index: number, field: K, value: string) => void;
  navigation: ReactNode;
  response: GeneratePromptResponse | null;
}

const multiValueFields = new Set<FieldSuggestionKey>([
  'camera.framing',
  'style',
  'environment',
  'lighting',
  'subjects.mood',
  'subjects.body_attributes',
  'subjects.wardrobe',
  'subjects.pose',
]);

const splitValues = (value?: string | null) => {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const joinValues = (values: string[]) =>
  values
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .join(', ');

const renderEditableValue = (
  value: string,
  fieldKey: FieldSuggestionKey,
  onChange: (nextValue: string) => void
) => {
  const suggestions = getSuggestionsForField(fieldKey);
  if (multiValueFields.has(fieldKey)) {
    return (
      <EditableListField
        values={splitValues(value)}
        suggestions={suggestions}
        onChange={(values) => onChange(joinValues(values))}
      />
    );
  }

  return <EditableField value={value} suggestions={suggestions} onChange={onChange} />;
};

export function RefineStep({
  editableData,
  onCameraChange,
  onTopLevelChange,
  onSubjectChange,
  navigation,
  response,
}: RefineStepProps) {
  return (
    <section className="w-full flex-shrink-0 p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="space-y-2 max-w-3xl">
          <h2 className="text-2xl font-semibold text-white">Step 2 · Refine the technical recipe</h2>
          <p className="text-sm text-slate-400">
            Edit individual keywords to fine-tune the composition. Each value supports quick replacements from curated
            suggestions or you can add your own variations.
          </p>
        </div>
        {navigation}
      </div>

      {editableData ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner">
              <h3 className="text-lg font-semibold text-white mb-4">Camera setup</h3>
              <dl className="space-y-3 text-sm text-slate-200">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Angle</dt>
                  {renderEditableValue(
                    editableData.camera.angle,
                    'camera.angle',
                    (value) => onCameraChange('angle', value)
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Lens</dt>
                  {renderEditableValue(
                    editableData.camera.lens,
                    'camera.lens',
                    (value) => onCameraChange('lens', value)
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Framing</dt>
                  {renderEditableValue(
                    editableData.camera.framing,
                    'camera.framing',
                    (value) => onCameraChange('framing', value)
                  )}
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner">
              <h3 className="text-lg font-semibold text-white mb-4">Scene styling</h3>
              <dl className="space-y-3 text-sm text-slate-200">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Style</dt>
                  {renderEditableValue(
                    editableData.style,
                    'style',
                    (value) => onTopLevelChange('style', value)
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Environment</dt>
                  {renderEditableValue(
                    editableData.environment,
                    'environment',
                    (value) => onTopLevelChange('environment', value)
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Lighting</dt>
                  {renderEditableValue(
                    editableData.lighting,
                    'lighting',
                    (value) => onTopLevelChange('lighting', value)
                  )}
                </div>
              </dl>
            </div>

            {editableData.subjects && editableData.subjects.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Subjects</h3>
                  <p className="text-xs text-slate-500">
                    Adjust individual subject attributes to match your scene.
                  </p>
                </div>
                {editableData.subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-4 space-y-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Subject {index + 1}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Mood</span>
                        {renderEditableValue(
                          subject.mood,
                          'subjects.mood',
                          (value) => onSubjectChange(index, 'mood', value)
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Wardrobe</span>
                        {renderEditableValue(
                          subject.wardrobe,
                          'subjects.wardrobe',
                          (value) => onSubjectChange(index, 'wardrobe', value)
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Pose</span>
                        {renderEditableValue(
                          subject.pose,
                          'subjects.pose',
                          (value) => onSubjectChange(index, 'pose', value)
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Age</span>
                        <EditableField
                          value={subject.age}
                          type="number"
                          onChange={(value) => onSubjectChange(index, 'age', value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Body attributes</span>
                        {renderEditableValue(
                          subject.body_attributes,
                          'subjects.body_attributes',
                          (value) => onSubjectChange(index, 'body_attributes', value)
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-inner">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Live JSON</h3>
                {response?.processing_time && (
                  <span className="text-xs text-slate-500">
                    Generated in {response.processing_time.toFixed(2)}s
                  </span>
                )}
              </div>
              <pre className="mt-4 max-h-[480px] overflow-y-auto rounded-xl bg-slate-900/80 p-4 text-xs text-emerald-200">
                {JSON.stringify(editableData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40">
          <p className="text-center text-sm text-slate-400">Complete Step 1 to unlock refinements.</p>
        </div>
      )}
    </section>
  );
}
