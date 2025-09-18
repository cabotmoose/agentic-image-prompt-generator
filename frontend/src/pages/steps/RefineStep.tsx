import type { ReactNode } from 'react';
import EditableField from '@/components/EditableField';
import EditableListField from '@/components/EditableListField';
import { getSuggestionsForField } from '@/lib/fieldSuggestions';
import type { FieldSuggestionKey } from '@/lib/fieldSuggestions';
import type {
  GeneratePromptResponse,
  GeneratedPromptData,
  Subject,
} from '@/services/api';

interface RefineStepProps {
  editableData: GeneratedPromptData | null;
  onVersionChange: (value: string) => void;
  onIntentChange: (value: string) => void;
  onPromptChange: (field: 'primary' | 'negative', value: string) => void;
  onEnvironmentChange: (value: string) => void;
  onLightingChange: (value: string) => void;
  onCompositionCameraChange: (
    field: keyof GeneratedPromptData['composition']['camera'],
    value: string
  ) => void;
  onCompositionFieldChange: (
    field: Exclude<keyof GeneratedPromptData['composition'], 'camera'>,
    value: string
  ) => void;
  onStyleMediumChange: (value: string) => void;
  onStyleListChange: (field: 'keywords' | 'aesthetic_bias', values: string[]) => void;
  onColorPaletteChange: (value: string) => void;
  onColorDominantColorsChange: (values: string[]) => void;
  onParamsChange: (field: keyof GeneratedPromptData['params'], value: string) => void;
  onPostUpscaleChange: (
    field: keyof GeneratedPromptData['post']['upscale'],
    value: string
  ) => void;
  onPostFaceRestoreChange: (value: boolean) => void;
  onSafetyChange: (value: boolean) => void;
  onNotesChange: (value: string) => void;
  onSubjectChange: <K extends keyof Subject>(index: number, field: K, value: string) => void;
  navigation: ReactNode;
  response: GeneratePromptResponse | null;
}

const getSuggestions = (key?: FieldSuggestionKey) => (key ? getSuggestionsForField(key) : []);

const renderEditableString = (
  value: string | undefined,
  onChange: (nextValue: string) => void,
  fieldKey?: FieldSuggestionKey
) => (
  <EditableField value={value ?? ''} suggestions={getSuggestions(fieldKey)} onChange={onChange} />
);

const splitIntoTokens = (value?: string) => {
  if (!value) {
    return [];
  }
  return value
    .split(/[.,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const containsTokenDelimiter = (value?: string) => Boolean(value && /[.,]/.test(value));

const determineDelimiter = (value?: string, fallback: string = ', ') => {
  if (!value) {
    return fallback;
  }
  const commaCount = (value.match(/,/g) ?? []).length;
  const periodCount = (value.match(/\./g) ?? []).length;
  if (periodCount > commaCount) {
    return '. ';
  }
  if (commaCount > 0) {
    return ', ';
  }
  if (periodCount > 0) {
    return '. ';
  }
  return fallback;
};

const joinTokens = (tokens: string[], delimiter: string) => {
  const cleaned = tokens.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  if (cleaned.length === 0) {
    return '';
  }
  const joined = cleaned.join(delimiter);
  if (delimiter.trim() === '.' && !joined.endsWith('.')) {
    return `${joined}.`;
  }
  return joined;
};

const renderTokenizedValue = (
  value: string | undefined,
  onChange: (nextValue: string) => void,
  fieldKey?: FieldSuggestionKey,
  fallbackDelimiter?: string
) => {
  const tokens = splitIntoTokens(value);
  const shouldTokenize = containsTokenDelimiter(value) && tokens.length > 0;
  if (!shouldTokenize) {
    return renderEditableString(value, onChange, fieldKey);
  }

  const delimiter = determineDelimiter(value, fallbackDelimiter);
  return (
    <EditableListField
      values={tokens}
      suggestions={getSuggestions(fieldKey)}
      onChange={(nextTokens) => onChange(joinTokens(nextTokens, delimiter))}
    />
  );
};

export function RefineStep({
  editableData,
  onVersionChange,
  onIntentChange,
  onPromptChange,
  onEnvironmentChange,
  onLightingChange,
  onCompositionCameraChange,
  onCompositionFieldChange,
  onStyleMediumChange,
  onStyleListChange,
  onColorPaletteChange,
  onColorDominantColorsChange,
  onParamsChange,
  onPostUpscaleChange,
  onPostFaceRestoreChange,
  onSafetyChange,
  onNotesChange,
  onSubjectChange,
  navigation,
  response,
}: RefineStepProps) {
  return (
    <section className="w-full flex-shrink-0 p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="space-y-2 max-w-3xl">
          <h2 className="text-2xl font-semibold text-white">Step 2 – Refine the technical recipe</h2>
          <p className="text-sm text-slate-400">
            Audit each section of the structured prompt. Update camera, style, and generation parameters to match your
            creative direction.
          </p>
        </div>
        {navigation}
      </div>

      {editableData ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner">
              <h3 className="text-lg font-semibold text-white mb-4">Overview & prompt</h3>
              <dl className="grid gap-4 text-sm text-slate-200 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Version</dt>
                  {renderEditableString(editableData.version, onVersionChange)}
                </div>
                <div className="flex flex-col gap-1 md:col-span-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Intent</dt>
                  {renderEditableString(editableData.intent, onIntentChange)}
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Primary prompt</dt>
                  {renderTokenizedValue(
                    editableData.prompt.primary,
                    (value) => onPromptChange('primary', value),
                    'prompt.primary',
                    '. '
                  )}
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Negative prompt</dt>
                  {renderTokenizedValue(
                    editableData.prompt.negative,
                    (value) => onPromptChange('negative', value),
                    'prompt.negative',
                    ', '
                  )}
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Composition</h3>
                <p className="text-xs text-slate-500">Tune the camera recipe and framing rules.</p>
              </div>
              <dl className="grid gap-4 text-sm text-slate-200 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Angle</dt>
                  {renderTokenizedValue(
                    editableData.composition.camera.angle,
                    (value) => onCompositionCameraChange('angle', value),
                    'composition.camera.angle'
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Lens</dt>
                  {renderTokenizedValue(
                    editableData.composition.camera.lens,
                    (value) => onCompositionCameraChange('lens', value),
                    'composition.camera.lens'
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Framing</dt>
                  {renderTokenizedValue(
                    editableData.composition.camera.framing,
                    (value) => onCompositionCameraChange('framing', value),
                    'composition.camera.framing'
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Depth of field</dt>
                  {renderTokenizedValue(
                    editableData.composition.camera.depth_of_field,
                    (value) => onCompositionCameraChange('depth_of_field', value),
                    'composition.camera.depth_of_field'
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Shot type</dt>
                  {renderTokenizedValue(
                    editableData.composition.shot,
                    (value) => onCompositionFieldChange('shot', value),
                    'composition.shot'
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Aspect ratio</dt>
                  {renderEditableString(
                    editableData.composition.aspect_ratio,
                    (value) => onCompositionFieldChange('aspect_ratio', value),
                    'composition.aspect_ratio'
                  )}
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Scene styling</h3>
                <p className="text-xs text-slate-500">Update atmosphere, style, and colour accents.</p>
              </div>
              <dl className="grid gap-4 text-sm text-slate-200 md:grid-cols-2">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Environment</dt>
                  {renderTokenizedValue(
                    editableData.environment,
                    onEnvironmentChange,
                    'environment',
                    ', '
                  )}
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Lighting</dt>
                  {renderTokenizedValue(
                    editableData.lighting,
                    onLightingChange,
                    'lighting',
                    ', '
                  )}
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Style keywords</dt>
                  <EditableListField
                    values={editableData.style.keywords}
                    suggestions={getSuggestions('style.keywords')}
                    onChange={(values) => onStyleListChange('keywords', values)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Style medium</dt>
                  {renderTokenizedValue(editableData.style.medium, onStyleMediumChange, 'style.medium')}
                </div>
                <div className="flex flex-col gap-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Aesthetic bias</dt>
                  <EditableListField
                    values={editableData.style.aesthetic_bias}
                    suggestions={getSuggestions('style.aesthetic_bias')}
                    onChange={(values) => onStyleListChange('aesthetic_bias', values)}
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Colour palette</dt>
                  {renderTokenizedValue(
                    editableData.color.palette,
                    onColorPaletteChange,
                    'color.palette',
                    ', '
                  )}
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Dominant colours</dt>
                  <EditableListField
                    values={editableData.color.dominant_colors}
                    suggestions={getSuggestions('color.dominant_colors')}
                    onChange={onColorDominantColorsChange}
                  />
                </div>
              </dl>
            </div>

            {editableData.subjects.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">Subjects</h3>
                  <p className="text-xs text-slate-500">Adjust character attributes and wardrobe notes.</p>
                </div>
                {editableData.subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-800/70 bg-slate-950/60 p-4 space-y-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500">Subject {index + 1}</p>
                    <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Role</span>
                        {renderTokenizedValue(subject.role, (value) => onSubjectChange(index, 'role', value))}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Age descriptor</span>
                        {renderTokenizedValue(subject.age, (value) => onSubjectChange(index, 'age', value))}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Mood</span>
                        {renderTokenizedValue(
                          subject.mood,
                          (value) => onSubjectChange(index, 'mood', value),
                          'subjects.mood'
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Wardrobe</span>
                        {renderTokenizedValue(
                          subject.wardrobe,
                          (value) => onSubjectChange(index, 'wardrobe', value),
                          'subjects.wardrobe'
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Pose</span>
                        {renderTokenizedValue(
                          subject.pose,
                          (value) => onSubjectChange(index, 'pose', value),
                          'subjects.pose'
                        )}
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Body attributes</span>
                        {renderTokenizedValue(
                          subject.body_attributes,
                          (value) => onSubjectChange(index, 'body_attributes', value),
                          'subjects.body_attributes'
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Generation settings</h3>
                <p className="text-xs text-slate-500">Verify sampler parameters and post-processing toggles.</p>
              </div>
              <dl className="grid gap-4 text-sm text-slate-200 md:grid-cols-2">
                {(['width', 'height', 'steps', 'seed', 'images'] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-1">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{field}</dt>
                    <EditableField
                      value={editableData.params[field] ?? ''}
                      type="number"
                      onChange={(value) => onParamsChange(field, value)}
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Guidance</dt>
                  <EditableField
                    value={editableData.params.guidance ?? ''}
                    type="number"
                    onChange={(value) => onParamsChange('guidance', value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Sampler</dt>
                  {renderTokenizedValue(
                    editableData.params.sampler,
                    (value) => onParamsChange('sampler', value),
                    undefined,
                    ', '
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Upscale mode</dt>
                  {renderTokenizedValue(
                    editableData.post.upscale.mode,
                    (value) => onPostUpscaleChange('mode', value),
                    'post.upscale.mode',
                    ', '
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Upscale strength</dt>
                  <EditableField
                    value={editableData.post.upscale.strength ?? ''}
                    type="number"
                    onChange={(value) => onPostUpscaleChange('strength', value)}
                  />
                </div>
              </dl>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={Boolean(editableData.post.face_restore)}
                    onChange={(event) => onPostFaceRestoreChange(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-400"
                  />
                  Face restore
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={Boolean(editableData.safety.allow_nsfw)}
                    onChange={(event) => onSafetyChange(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-400"
                  />
                  Allow NSFW content
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-4">
              <h3 className="text-lg font-semibold text-white">Notes</h3>
              <textarea
                value={editableData.notes ?? ''}
                onChange={(event) => onNotesChange(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                placeholder="Add execution tips, fallback strategies, or escalation guidance"
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-4">
              <h3 className="text-lg font-semibold text-white">Controls & overrides</h3>
              <div className="text-xs text-slate-400 space-y-3">
                <div>
                  <p className="font-semibold text-slate-200">Image prompts</p>
                  <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-950/60 p-3 text-[11px] text-slate-300">
                    {JSON.stringify(editableData.controls.image_prompts, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Control nets</p>
                  <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-950/60 p-3 text-[11px] text-slate-300">
                    {JSON.stringify(editableData.controls.control_nets, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">LoRAs</p>
                  <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-950/60 p-3 text-[11px] text-slate-300">
                    {JSON.stringify(editableData.controls.loras, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Provider overrides</p>
                  <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-950/60 p-3 text-[11px] text-slate-300">
                    {JSON.stringify(editableData.provider_overrides, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
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
              <pre className="mt-4 max-h-[560px] overflow-y-auto rounded-xl bg-slate-900/80 p-4 text-xs text-emerald-200">
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
