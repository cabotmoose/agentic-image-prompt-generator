import type { ReactNode } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';
import type { GeneratePromptResponse, GeneratedPromptData } from '@/services/api';

interface FinalizeStepProps {
  editableData: GeneratedPromptData | null;
  response: GeneratePromptResponse | null;
  copied: boolean;
  onCopy: () => void;
  navigation: ReactNode;
}

const renderList = (values: string[]) =>
  values.length > 0 ? values.join(', ') : '—';

export function FinalizeStep({ editableData, response, copied, onCopy, navigation }: FinalizeStepProps) {
  return (
    <section className="w-full flex-shrink-0 p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="space-y-2 max-w-3xl">
          <h2 className="text-2xl font-semibold text-white">Step 3 – Finalize & export</h2>
          <p className="text-sm text-slate-400">
            Review the structured payload and hand it off to your downstream image generator or workflow automation.
          </p>
        </div>
        {navigation}
      </div>

      {editableData ? (
        <div className="flex flex-col gap-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Ready for handoff</h3>
                <p className="text-sm text-slate-400">
                  Every section of the schema is populated. Copy the payload or export it into your generation pipeline.
                </p>
              </div>
            </div>

            <div className="grid gap-4 text-sm text-slate-200 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Overview</h4>
                <p>
                  <strong className="text-slate-100">Version:</strong> {editableData.version}
                </p>
                <p>
                  <strong className="text-slate-100">Intent:</strong> {editableData.intent || '—'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Prompt</h4>
                <p>
                  <strong className="text-slate-100">Primary:</strong> {editableData.prompt.primary || '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Negative:</strong> {editableData.prompt.negative || '—'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Composition</h4>
                <p>
                  <strong className="text-slate-100">Camera:</strong>{' '}
                  {renderList([
                    editableData.composition.camera.angle ?? '',
                    editableData.composition.camera.lens ?? '',
                    editableData.composition.camera.framing ?? '',
                    editableData.composition.camera.depth_of_field ?? '',
                  ].filter(Boolean))}
                </p>
                <p>
                  <strong className="text-slate-100">Shot:</strong> {editableData.composition.shot || '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Aspect ratio:</strong> {editableData.composition.aspect_ratio || '—'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Scene</h4>
                <p>
                  <strong className="text-slate-100">Environment:</strong> {editableData.environment || '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Lighting:</strong> {editableData.lighting || '—'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Style & colour</h4>
                <p>
                  <strong className="text-slate-100">Keywords:</strong> {renderList(editableData.style.keywords)}
                </p>
                <p>
                  <strong className="text-slate-100">Medium:</strong> {editableData.style.medium || '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Aesthetic bias:</strong>{' '}
                  {renderList(editableData.style.aesthetic_bias)}
                </p>
                <p>
                  <strong className="text-slate-100">Palette:</strong> {editableData.color.palette || '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Dominant colours:</strong>{' '}
                  {renderList(editableData.color.dominant_colors)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Generation params</h4>
                <p>
                  <strong className="text-slate-100">Resolution:</strong>{' '}
                  {editableData.params.width && editableData.params.height
                    ? `${editableData.params.width} × ${editableData.params.height}`
                    : '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Steps:</strong> {editableData.params.steps ?? '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Guidance:</strong> {editableData.params.guidance ?? '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Sampler:</strong> {editableData.params.sampler || '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Seed:</strong> {editableData.params.seed ?? '—'}
                </p>
                <p>
                  <strong className="text-slate-100">Images:</strong> {editableData.params.images ?? '—'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Post & safety</h4>
                <p>
                  <strong className="text-slate-100">Upscale:</strong>{' '}
                  {editableData.post.upscale.mode || '—'}
                  {editableData.post.upscale.strength !== undefined
                    ? ` (strength ${editableData.post.upscale.strength})`
                    : ''}
                </p>
                <p>
                  <strong className="text-slate-100">Face restore:</strong>{' '}
                  {editableData.post.face_restore ? 'Enabled' : 'Disabled'}
                </p>
                <p>
                  <strong className="text-slate-100">Allow NSFW:</strong>{' '}
                  {editableData.safety.allow_nsfw ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {editableData.subjects.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Subjects</h4>
                {editableData.subjects.map((subject, index) => (
                  <div key={index} className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3 text-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Subject {index + 1}</p>
                    <p>
                      <strong className="text-slate-100">Role:</strong> {subject.role || '—'}
                    </p>
                    <p>
                      <strong className="text-slate-100">Age descriptor:</strong> {subject.age || '—'}
                    </p>
                    <p>
                      <strong className="text-slate-100">Mood:</strong> {subject.mood || '—'}
                    </p>
                    <p>
                      <strong className="text-slate-100">Body:</strong> {subject.body_attributes || '—'}
                    </p>
                    <p>
                      <strong className="text-slate-100">Wardrobe:</strong> {subject.wardrobe || '—'}
                    </p>
                    <p>
                      <strong className="text-slate-100">Pose:</strong> {subject.pose || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 space-y-2">
              <h4 className="text-xs uppercase tracking-wide text-slate-500">Controls summary</h4>
              <p>Image prompts: {editableData.controls.image_prompts.length}</p>
              <p>Control nets: {editableData.controls.control_nets.length}</p>
              <p>LoRAs: {editableData.controls.loras.length}</p>
              <p>Provider overrides: {Object.keys(editableData.provider_overrides).length}</p>
              {editableData.notes && (
                <p className="text-slate-300">
                  <strong className="text-slate-100">Notes:</strong> {editableData.notes}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/90 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-lg transition hover:bg-emerald-400"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied to clipboard' : 'Copy final JSON'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Final JSON payload</h3>
              {response?.processing_time && (
                <span className="text-xs text-slate-500">Generated in {response.processing_time.toFixed(2)}s</span>
              )}
            </div>
            <pre className="mt-3 max-h-[520px] overflow-y-auto rounded-xl bg-slate-900/80 p-4 text-xs text-emerald-200">
              {JSON.stringify(editableData, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40">
          <p className="text-center text-sm text-slate-400">Complete Steps 1 and 2 to view your final package.</p>
        </div>
      )}
    </section>
  );
}
