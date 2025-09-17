import { FormEvent } from 'react';
import type { ReactNode } from 'react';
import { Loader2, Send } from 'lucide-react';
import type { GeneratePromptResponse } from '@/services/api';

export interface ProviderOption {
  value: string;
  label: string;
}

interface DescribeStepProps {
  inputMode: 'text' | 'image';
  onModeChange: (mode: 'text' | 'image') => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  textProvider: string;
  onTextProviderChange: (provider: string) => void;
  visionProvider: string;
  onVisionProviderChange: (provider: string) => void;
  referenceImage: File | null;
  imagePreview: string | null;
  onReferenceImageChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  response: GeneratePromptResponse | null;
  navigation: ReactNode;
  textProviders: ProviderOption[];
  visionProviders: ProviderOption[];
  isSubmitDisabled: boolean;
}

export function DescribeStep(props: DescribeStepProps) {
  const {
    inputMode,
    onModeChange,
    prompt,
    onPromptChange,
    textProvider,
    onTextProviderChange,
    visionProvider,
    onVisionProviderChange,
    referenceImage,
    imagePreview,
    onReferenceImageChange,
    onSubmit,
    loading,
    response,
    navigation,
    textProviders,
    visionProviders,
    isSubmitDisabled,
  } = props;

  return (
    <section className="w-full flex-shrink-0 p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="space-y-2 max-w-3xl">
          <h2 className="text-2xl font-semibold text-white">Step 1 · Describe your concept</h2>
          <p className="text-sm text-slate-400">
            Provide a concise description or upload a reference image. Choose a compatible provider and let the generator
            build the initial technical blueprint.
          </p>
        </div>
        {navigation}
      </div>

      <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onModeChange('text')}
            className={`flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${
              inputMode === 'text'
                ? 'border-blue-500 bg-blue-500/10 text-blue-200 shadow-lg'
                : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
          >
            Describe with text
          </button>
          <button
            type="button"
            onClick={() => onModeChange('image')}
            className={`flex-1 min-w-[200px] rounded-xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${
              inputMode === 'image'
                ? 'border-blue-500 bg-blue-500/10 text-blue-200 shadow-lg'
                : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
            }`}
          >
            Use reference image
          </button>
        </div>

        {inputMode === 'text' ? (
          <div className="space-y-2">
            <label htmlFor="prompt" className="block text-sm font-semibold text-slate-200">
              Base idea
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="e.g. A futuristic city street bustling with neon-lit rain"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="reference-image" className="block text-sm font-semibold text-slate-200">
              Reference image
            </label>
            <div className="space-y-3">
              <label
                htmlFor="reference-image"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-8 text-center text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <span className="font-medium">{referenceImage ? 'Change image' : 'Upload an image'}</span>
                <span className="text-xs text-slate-500">PNG, JPG up to 10MB</span>
              </label>
              <input
                id="reference-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  onReferenceImageChange(file);
                  event.target.value = '';
                }}
              />
              {referenceImage && imagePreview && (
                <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <img src={imagePreview} alt="Reference preview" className="h-20 w-20 rounded-lg object-cover" />
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-200">{referenceImage.name}</p>
                    <p className="text-xs text-slate-500">{Math.max(1, Math.round(referenceImage.size / 1024))} KB</p>
                    <button
                      type="button"
                      onClick={() => onReferenceImageChange(null)}
                      className="text-xs font-medium text-blue-300 hover:text-blue-200"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor={inputMode === 'text' ? 'provider' : 'vision-provider'}
            className="block text-sm font-semibold text-slate-200"
          >
            {inputMode === 'text' ? 'AI provider' : 'Vision-enabled provider'}
          </label>
          <select
            id={inputMode === 'text' ? 'provider' : 'vision-provider'}
            value={inputMode === 'text' ? textProvider : visionProvider}
            onChange={(event) =>
              inputMode === 'text'
                ? onTextProviderChange(event.target.value)
                : onVisionProviderChange(event.target.value)
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(inputMode === 'text' ? textProviders : visionProviders).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {inputMode === 'text' ? 'Generating...' : 'Analysing...'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {inputMode === 'text' ? 'Generate structured prompt' : 'Describe reference image'}
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
  );
}
