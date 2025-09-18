import type { ChangeEvent, ReactNode } from 'react';
import { CheckCircle2, Copy, Loader2, Sparkles } from 'lucide-react';
import type {
  GeneratePromptResponse,
  GeneratedPromptData,
  ProviderOptimizedPayload,
  ProviderTargetModel,
} from '@/services/api';

interface FinalizeStepProps {
  editableData: GeneratedPromptData | null;
  response: GeneratePromptResponse | null;
  copied: boolean;
  onCopy: () => void;
  conversionTarget: ProviderTargetModel;
  onConversionTargetChange: (target: ProviderTargetModel) => void;
  onConvert: () => void;
  conversionLoading: boolean;
  conversionResult: ProviderOptimizedPayload | null;
  conversionError: string | null;
  conversionTokenUsage: number | null;
  onResetConversion: () => void;
  navigation: ReactNode;
}

const renderList = (values: string[]) => (values.length > 0 ? values.join(', ') : '—');

const MODEL_OPTIONS: Array<{ value: ProviderTargetModel; label: string; helper: string }> = [
  { value: 'flux.1', label: 'Flux.1', helper: 'Cinematic diffusion tuned for Runway / Flux deployments' },
  { value: 'wan-2.2', label: 'WAN 2.2', helper: 'Anime diffusion focused on clean line art, flat shading, and camera-driven framing' },
  { value: 'sdxl', label: 'SDXL', helper: 'General-purpose SDXL base + refiner workflow' },
];

const formatRecord = (record: Record<string, unknown>): string[] => {
  const entries = Object.entries(record);
  if (entries.length === 0) {
    return ['—'];
  }
  return entries.map(([key, value]) => `${key}: ${String(value)}`);
};

export function FinalizeStep({
  editableData,
  response,
  copied,
  onCopy,
  conversionTarget,
  onConversionTargetChange,
  onConvert,
  conversionLoading,
  conversionResult,
  conversionError,
  conversionTokenUsage,
  onResetConversion,
  navigation,
}: FinalizeStepProps) {
  const handleTargetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextTarget = event.target.value as ProviderTargetModel;
    if (nextTarget === conversionTarget) {
      return;
    }
    onResetConversion();
    onConversionTargetChange(nextTarget);
  };

  const selectedModel = MODEL_OPTIONS.find((option) => option.value === conversionTarget);

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
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-inner space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-500/20 p-2 text-purple-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Provider-optimised handoff</h3>
                  <p className="text-sm text-slate-400">
                    Generate ready-to-send payloads for supported diffusion backends only when you need them.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="provider-target" className="text-xs uppercase tracking-wide text-slate-500">
                    Target model
                  </label>
                  <select
                    id="provider-target"
                    value={conversionTarget}
                    onChange={handleTargetChange}
                    disabled={conversionLoading}
                    className="w-56 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {MODEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedModel && (
                    <p className="text-xs text-slate-500">{selectedModel.helper}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onConvert}
                  disabled={conversionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/80 px-5 py-3 text-sm font-semibold text-purple-950 shadow-lg transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {conversionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Converting…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Convert for provider
                    </>
                  )}
                </button>
                {(conversionResult || conversionError) && (
                  <button
                    type="button"
                    onClick={onResetConversion}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Clear result
                  </button>
                )}
              </div>
            </div>

            {!conversionResult && !conversionError && !conversionLoading && (
              <p className="text-sm text-slate-400">
                Conversions trigger an additional crew run using your selected provider. Choose a target model and click
                convert when you are ready.
              </p>
            )}

            {conversionError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                {conversionError}
              </div>
            )}

            {conversionResult && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 space-y-2">
                    <h4 className="text-xs uppercase tracking-wide text-slate-500">Summary</h4>
                    <p>
                      <strong className="text-slate-100">Target:</strong> {conversionResult.target_model}
                    </p>
                    <p>
                      <strong className="text-slate-100">Model identifier:</strong> {conversionResult.model_identifier}
                    </p>
                    <p>
                      <strong className="text-slate-100">Prompt:</strong> {conversionResult.prompt}
                    </p>
                    <p>
                      <strong className="text-slate-100">Negative:</strong> {conversionResult.negative_prompt || "—"}
                    </p>
                    {conversionTokenUsage !== null && (
                      <p>
                        <strong className="text-slate-100">Token usage:</strong>{" "}
                        {conversionTokenUsage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 space-y-2">
                    <h4 className="text-xs uppercase tracking-wide text-slate-500">Settings & controls</h4>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Recommended settings</p>
                    <p className="text-slate-300">{formatRecord(conversionResult.recommended_settings).join(" | ")}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Control assets</p>
                    <p className="text-slate-300">{formatRecord(conversionResult.control_assets).join(" | ")}</p>
                  </div>
                </div>

                {conversionResult.notes.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 space-y-2">
                    <h4 className="text-xs uppercase tracking-wide text-slate-500">Notes</h4>
                    <ul className="list-disc space-y-1 pl-5 text-slate-300">
                      {conversionResult.notes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500">Provider payload</h4>
                  <pre className="mt-2 max-h-[340px] overflow-y-auto rounded-xl bg-slate-900/80 p-3 text-xs text-purple-200">
                    {JSON.stringify(conversionResult.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

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
                  <strong className="text-slate-100">Intent:</strong> {editableData.intent || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Prompt</h4>
                <p>
                  <strong className="text-slate-100">Primary:</strong> {editableData.prompt.primary || "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Negative:</strong> {editableData.prompt.negative || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Composition</h4>
                <p>
                  <strong className="text-slate-100">Camera:</strong>{" "}
                  {renderList([
                    editableData.composition.camera.angle ?? "",
                    editableData.composition.camera.lens ?? "",
                    editableData.composition.camera.framing ?? "",
                    editableData.composition.camera.depth_of_field ?? "",
                  ].filter(Boolean))}
                </p>
                <p>
                  <strong className="text-slate-100">Shot:</strong> {editableData.composition.shot || "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Aspect ratio:</strong> {editableData.composition.aspect_ratio || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Scene</h4>
                <p>
                  <strong className="text-slate-100">Environment:</strong> {editableData.environment || "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Lighting:</strong> {editableData.lighting || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Style & colour</h4>
                <p>
                  <strong className="text-slate-100">Keywords:</strong> {renderList(editableData.style.keywords)}
                </p>
                <p>
                  <strong className="text-slate-100">Medium:</strong> {editableData.style.medium || "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Aesthetic bias:</strong>{" "}
                  {renderList(editableData.style.aesthetic_bias)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Colour</h4>
                <p>
                  <strong className="text-slate-100">Palette:</strong> {editableData.color.palette || "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Dominant:</strong> {renderList(editableData.color.dominant_colors)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Parameters</h4>
                <p>
                  <strong className="text-slate-100">Resolution:</strong>{" "}
                  {editableData.params.width ?? "—"} × {editableData.params.height ?? "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Steps:</strong> {editableData.params.steps ?? "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Guidance:</strong> {editableData.params.guidance ?? "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Sampler:</strong> {editableData.params.sampler || "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Seed:</strong> {editableData.params.seed ?? "—"}
                </p>
                <p>
                  <strong className="text-slate-100">Images:</strong> {editableData.params.images ?? "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Post & safety</h4>
                <p>
                  <strong className="text-slate-100">Upscale:</strong>{" "}
                  {editableData.post.upscale.mode || "—"}
                  {editableData.post.upscale.strength !== undefined
                    ? ` (strength ${editableData.post.upscale.strength})`
                    : ""}
                </p>
                <p>
                  <strong className="text-slate-100">Face restore:</strong>{" "}
                  {editableData.post.face_restore ? "Enabled" : "Disabled"}
                </p>
                <p>
                  <strong className="text-slate-100">Allow NSFW:</strong>{" "}
                  {editableData.safety.allow_nsfw ? "Yes" : "No"}
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
                      <strong className="text-slate-100">Role:</strong> {subject.role || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-100">Age descriptor:</strong> {subject.age || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-100">Mood:</strong> {subject.mood || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-100">Body:</strong> {subject.body_attributes || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-100">Wardrobe:</strong> {subject.wardrobe || "—"}
                    </p>
                    <p>
                      <strong className="text-slate-100">Pose:</strong> {subject.pose || "—"}
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
              {copied ? "Copied to clipboard" : "Copy final JSON"}
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
