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

export function FinalizeStep({ editableData, response, copied, onCopy, navigation }: FinalizeStepProps) {
  return (
    <section className="w-full flex-shrink-0 p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="space-y-2 max-w-3xl">
          <h2 className="text-2xl font-semibold text-white">Step 3 · Finalize & export</h2>
          <p className="text-sm text-slate-400">
            Review your structured prompt, copy the final payload, and hand it off to your image generator of choice.
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
                  This JSON package holds everything your image generator needs.
                </p>
              </div>
            </div>

            <div className="grid gap-4 text-sm text-slate-200 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Camera</h4>
                <p>
                  <strong className="text-slate-100">Angle:</strong> {editableData.camera.angle}
                </p>
                <p>
                  <strong className="text-slate-100">Lens:</strong> {editableData.camera.lens}
                </p>
                <p>
                  <strong className="text-slate-100">Framing:</strong> {editableData.camera.framing}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-slate-500">Scene</h4>
                <p>
                  <strong className="text-slate-100">Style:</strong> {editableData.style}
                </p>
                <p>
                  <strong className="text-slate-100">Environment:</strong> {editableData.environment}
                </p>
                <p>
                  <strong className="text-slate-100">Lighting:</strong> {editableData.lighting}
                </p>
              </div>
              {editableData.subjects && editableData.subjects.length > 0 && (
                <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500">Subjects</h4>
                  {editableData.subjects.map((subject, index) => (
                    <div key={index} className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Subject {index + 1}</p>
                      <p>
                        <strong className="text-slate-100">Mood:</strong> {subject.mood}
                      </p>
                      <p>
                        <strong className="text-slate-100">Age:</strong> {subject.age}
                      </p>
                      <p>
                        <strong className="text-slate-100">Body:</strong> {subject.body_attributes}
                      </p>
                      <p>
                        <strong className="text-slate-100">Wardrobe:</strong> {subject.wardrobe}
                      </p>
                      <p>
                        <strong className="text-slate-100">Pose:</strong> {subject.pose}
                      </p>
                    </div>
                  ))}
                </div>
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
