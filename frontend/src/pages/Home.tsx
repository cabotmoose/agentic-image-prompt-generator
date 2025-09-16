import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, Loader2, Send } from 'lucide-react';
import EditableField from '@/components/EditableField';
import EditableListField from '@/components/EditableListField';
import { getSuggestionsForField } from '@/lib/fieldSuggestions';
import type { FieldSuggestionKey } from '@/lib/fieldSuggestions';
import {
  generatePrompt,
  GeneratePromptRequest,
  GeneratePromptResponse,
  GeneratedPromptData,
  Subject,
} from '@/services/api';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('openai');
  const [response, setResponse] = useState<GeneratePromptResponse | null>(null);
  const [editableData, setEditableData] = useState<GeneratedPromptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const multiValueFields = useMemo(
    () =>
      new Set<FieldSuggestionKey>([
        'camera.framing',
        'style',
        'environment',
        'lighting',
        'subjects.mood',
        'subjects.body_attributes',
        'subjects.wardrobe',
        'subjects.pose',
      ]),
    []
  );

  const splitValues = (input?: string | null) => {
    if (!input) return [];
    return input
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  };

  const joinValues = (values: string[]) =>
    values
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .join(', ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const request: GeneratePromptRequest = {
        prompt: prompt.trim(),
        provider,
      };
      const result = await generatePrompt(request);
      setResponse(result);
      if (result.success && result.data) {
        setEditableData(result.data);
        setCurrentStep(1);
      } else {
        setEditableData(null);
      }
    } catch (error) {
      setResponse({
        success: false,
        error: 'An unexpected error occurred',
      });
      setEditableData(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!editableData) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(editableData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleCameraChange = (field: keyof GeneratedPromptData['camera'], value: string) => {
    setEditableData((current) => {
      if (!current) return current;
      return {
        ...current,
        camera: {
          ...current.camera,
          [field]: value,
        },
      };
    });
  };

  const handleTopLevelChange = (field: keyof Omit<GeneratedPromptData, 'camera' | 'subjects'>, value: string) => {
    setEditableData((current) => {
      if (!current) return current;
      return {
        ...current,
        [field]: value,
      };
    });
  };

  const handleSubjectChange = <K extends keyof Subject>(index: number, field: K, value: string) => {
    setEditableData((current) => {
      if (!current || !current.subjects) return current;
      const updatedSubjects = current.subjects.map((subject, subjectIndex) => {
        if (subjectIndex !== index) return subject;
        if (field === 'age') {
          const numericValue = Number(value);
          return {
            ...subject,
            [field]: Number.isNaN(numericValue) ? subject.age : numericValue,
          };
        }

        return {
          ...subject,
          [field]: value,
        };
      });

      return {
        ...current,
        subjects: updatedSubjects,
      };
    });
  };

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

  const steps = useMemo(
    () => [
      { title: 'Describe', subtitle: 'Start with your concept' },
      { title: 'Refine', subtitle: 'Adjust technical details' },
      { title: 'Finalize', subtitle: 'Review & copy the output' },
    ],
    []
  );

  const progressPercentage = (currentStep / (steps.length - 1)) * 100;
  const canGoBack = currentStep > 0;
  const canAdvance = () => {
    if (currentStep === 0) return Boolean(editableData);
    if (currentStep === 1) return Boolean(editableData);
    return true;
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleForward = () => {
    if (currentStep === steps.length - 1) {
      setPrompt('');
      setProvider('openai');
      setResponse(null);
      setEditableData(null);
      setCopied(false);
      setCurrentStep(0);
      return;
    }

    if (!canAdvance()) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent)] py-12 px-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Agentic Image Prompt Generator</h1>
          <p className="text-lg text-slate-300">
            Move from an idea to a production-ready prompt in three guided steps.
          </p>
        </header>

        <div className="bg-slate-900/80 border border-slate-700 rounded-3xl p-6 shadow-2xl backdrop-blur">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium text-slate-300">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;
                  return (
                    <div key={step.title} className="flex flex-col items-center gap-1">
                      <span className={isActive || isComplete ? 'text-blue-400' : ''}>{step.title}</span>
                      <span className="text-xs text-slate-500">{step.subtitle}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800 relative">
                <div
                  className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-800">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentStep * 100}%)` }}
              >
                <section className="w-full flex-shrink-0 p-8 space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">Step 1 · Describe your concept</h2>
                    <p className="text-sm text-slate-400 max-w-2xl">
                      Provide a concise description of the image you want to create. Choose your preferred provider and
                      let the generator build the initial technical blueprint.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                    <div className="space-y-2">
                      <label htmlFor="prompt" className="block text-sm font-semibold text-slate-200">
                        Base idea
                      </label>
                      <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. A futuristic city street bustling with neon-lit rain"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={6}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="provider" className="block text-sm font-semibold text-slate-200">
                        AI provider
                      </label>
                      <select
                        id="provider"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google">Google</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !prompt.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Generate structured prompt
                        </>
                      )}
                    </button>

                    {response && !response.success && (
                      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {response.error || 'Unable to generate a prompt. Please try again.'}
                      </div>
                    )}
                  </form>
                </section>

                <section className="w-full flex-shrink-0 p-8 space-y-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold text-white">Step 2 · Refine the technical recipe</h2>
                      <p className="text-sm text-slate-400 max-w-3xl">
                        Edit individual keywords to fine-tune the composition. Each value supports quick replacements from
                        curated suggestions or you can add your own variations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleForward}
                      disabled={currentStep !== 1 || !canAdvance()}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
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
                                (value) => handleCameraChange('angle', value)
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <dt className="text-xs uppercase tracking-wide text-slate-500">Lens</dt>
                              {renderEditableValue(
                                editableData.camera.lens,
                                'camera.lens',
                                (value) => handleCameraChange('lens', value)
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <dt className="text-xs uppercase tracking-wide text-slate-500">Framing</dt>
                              {renderEditableValue(
                                editableData.camera.framing,
                                'camera.framing',
                                (value) => handleCameraChange('framing', value)
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
                                (value) => handleTopLevelChange('style', value)
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <dt className="text-xs uppercase tracking-wide text-slate-500">Environment</dt>
                              {renderEditableValue(
                                editableData.environment,
                                'environment',
                                (value) => handleTopLevelChange('environment', value)
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <dt className="text-xs uppercase tracking-wide text-slate-500">Lighting</dt>
                              {renderEditableValue(
                                editableData.lighting,
                                'lighting',
                                (value) => handleTopLevelChange('lighting', value)
                              )}
                            </div>
                          </dl>
                        </div>

                        {editableData.subjects && editableData.subjects.length > 0 && (
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-white">Subjects</h3>
                              <span className="text-xs text-slate-500">{editableData.subjects.length} configured</span>
                            </div>
                            {editableData.subjects.map((subject, index) => (
                              <div key={index} className="rounded-xl border border-slate-800/70 bg-slate-900/70 p-4 space-y-3">
                                <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 md:grid-cols-2">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs uppercase tracking-wide text-slate-500">Mood</span>
                                    {renderEditableValue(
                                      subject.mood,
                                      'subjects.mood',
                                      (value) => handleSubjectChange(index, 'mood', value)
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs uppercase tracking-wide text-slate-500">Age</span>
                                    <EditableField
                                      value={subject.age}
                                      type="number"
                                      onChange={(value) => handleSubjectChange(index, 'age', value)}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1 md:col-span-2">
                                    <span className="text-xs uppercase tracking-wide text-slate-500">Body attributes</span>
                                    {renderEditableValue(
                                      subject.body_attributes,
                                      'subjects.body_attributes',
                                      (value) => handleSubjectChange(index, 'body_attributes', value)
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs uppercase tracking-wide text-slate-500">Wardrobe</span>
                                    {renderEditableValue(
                                      subject.wardrobe,
                                      'subjects.wardrobe',
                                      (value) => handleSubjectChange(index, 'wardrobe', value)
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-xs uppercase tracking-wide text-slate-500">Pose</span>
                                    {renderEditableValue(
                                      subject.pose,
                                      'subjects.pose',
                                      (value) => handleSubjectChange(index, 'pose', value)
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

                        <p className="text-sm text-slate-400">
                          Adjusting fields updates the JSON instantly. Use the Continue button when you&apos;re satisfied with
                          the configuration.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40">
                      <p className="text-center text-sm text-slate-400">
                        Generate a structured prompt in Step 1 to unlock the editor.
                      </p>
                    </div>
                  )}
                </section>

                <section className="w-full flex-shrink-0 p-8 space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">Step 3 · Finalize & deploy</h2>
                    <p className="text-sm text-slate-400 max-w-3xl">
                      Review the finished prompt data and copy it directly into your creative tooling. You can always go
                      back to adjust a detail before deploying.
                    </p>
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
                            <p><strong className="text-slate-100">Angle:</strong> {editableData.camera.angle}</p>
                            <p><strong className="text-slate-100">Lens:</strong> {editableData.camera.lens}</p>
                            <p><strong className="text-slate-100">Framing:</strong> {editableData.camera.framing}</p>
                          </div>
                          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                            <h4 className="text-xs uppercase tracking-wide text-slate-500">Scene</h4>
                            <p><strong className="text-slate-100">Style:</strong> {editableData.style}</p>
                            <p><strong className="text-slate-100">Environment:</strong> {editableData.environment}</p>
                            <p><strong className="text-slate-100">Lighting:</strong> {editableData.lighting}</p>
                          </div>
                          {editableData.subjects && editableData.subjects.length > 0 && (
                            <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                              <h4 className="text-xs uppercase tracking-wide text-slate-500">Subjects</h4>
                              {editableData.subjects.map((subject, index) => (
                                <div key={index} className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-500">Subject {index + 1}</p>
                                  <p><strong className="text-slate-100">Mood:</strong> {subject.mood}</p>
                                  <p><strong className="text-slate-100">Age:</strong> {subject.age}</p>
                                  <p><strong className="text-slate-100">Body:</strong> {subject.body_attributes}</p>
                                  <p><strong className="text-slate-100">Wardrobe:</strong> {subject.wardrobe}</p>
                                  <p><strong className="text-slate-100">Pose:</strong> {subject.pose}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={copyToClipboard}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/90 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-lg transition hover:bg-emerald-400"
                        >
                          <Copy className="h-4 w-4" />
                          {copied ? 'Copied to clipboard' : 'Copy final JSON'}
                        </button>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-inner">
                        <h3 className="text-sm font-semibold text-slate-200">Final JSON payload</h3>
                        <pre className="mt-3 max-h-[520px] overflow-y-auto rounded-xl bg-slate-900/80 p-4 text-xs text-emerald-200">
                          {JSON.stringify(editableData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40">
                      <p className="text-center text-sm text-slate-400">
                        Complete Steps 1 and 2 to view your final package.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={!canGoBack}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              {currentStep === 1 ? (
                <div className="h-10" />
              ) : (
                <button
                  type="button"
                  onClick={handleForward}
                  disabled={!canAdvance()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500/90 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      Start new prompt
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
