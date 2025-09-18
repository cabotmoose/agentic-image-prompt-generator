import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Settings } from 'lucide-react';
import SettingsModal from '@/components/SettingsModal';
import { useSession } from '@/hooks/useSession';
import {
  GeneratePromptFromImageRequest,
  GeneratePromptRequest,
  GeneratePromptResponse,
  GeneratedPromptData,
  Subject,
  ConvertPromptResponse,
  ProviderTargetModel,
  generatePrompt,
  generatePromptFromImage,
  convertPrompt,
} from '@/services/api';
import { DescribeStep, ProviderOption } from '@/pages/steps/DescribeStep';
import { RefineStep } from '@/pages/steps/RefineStep';
import { FinalizeStep } from '@/pages/steps/FinalizeStep';

const TEXT_PROVIDERS: ProviderOption[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'lmstudio', label: 'LM Studio (local)' },
];

const VISION_PROVIDERS: ProviderOption[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google' },
];

function normaliseTokenUsage(rawUsage: unknown): number {
  if (typeof rawUsage === 'number' && Number.isFinite(rawUsage)) {
    return rawUsage;
  }

  if (!rawUsage || typeof rawUsage !== 'object') {
    return 0;
  }

  const usageRecord = rawUsage as Record<string, unknown>;
  const nested = usageRecord.usage;
  if (nested && typeof nested === 'object') {
    const nestedTotal = normaliseTokenUsage(nested);
    if (nestedTotal > 0) {
      return nestedTotal;
    }
  }

  const totalKeys = ['total_tokens', 'totalTokens', 'total'];
  for (const key of totalKeys) {
    const value = usageRecord[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  const componentKeys = [
    'prompt_tokens',
    'promptTokens',
    'input_tokens',
    'completion_tokens',
    'completionTokens',
    'output_tokens',
  ];
  let componentTotal = 0;
  let seenComponent = false;
  componentKeys.forEach((key) => {
    const value = usageRecord[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      componentTotal += value;
      seenComponent = true;
    }
  });

  if (seenComponent && componentTotal > 0) {
    return componentTotal;
  }

  return 0;
}

function normaliseGeneratedPromptData(data: GeneratedPromptData): GeneratedPromptData {
  return {
    version: data.version || '1.0',
    intent: data.intent ?? '',
    prompt: {
      primary: data.prompt?.primary ?? '',
      negative: data.prompt?.negative ?? '',
    },
    subjects: (data.subjects ?? []).map((subject) => ({
      role: subject.role ?? '',
      age: subject.age ?? '',
      body_attributes: subject.body_attributes ?? '',
      wardrobe: subject.wardrobe ?? '',
      pose: subject.pose ?? '',
      mood: subject.mood ?? '',
    })),
    environment: data.environment ?? '',
    composition: {
      camera: {
        angle: data.composition?.camera?.angle ?? '',
        lens: data.composition?.camera?.lens ?? '',
        framing: data.composition?.camera?.framing ?? '',
        depth_of_field: data.composition?.camera?.depth_of_field ?? '',
      },
      shot: data.composition?.shot ?? '',
      aspect_ratio: data.composition?.aspect_ratio ?? '',
    },
    lighting: data.lighting ?? '',
    style: {
      keywords: (data.style?.keywords ?? []).filter((keyword) => keyword.trim().length > 0),
      medium: data.style?.medium ?? '',
      aesthetic_bias: (data.style?.aesthetic_bias ?? []).filter((bias) => bias.trim().length > 0),
    },
    color: {
      palette: data.color?.palette ?? '',
      dominant_colors: (data.color?.dominant_colors ?? []).filter((color) => color.trim().length > 0),
    },
    controls: {
      image_prompts: data.controls?.image_prompts ?? [],
      control_nets: data.controls?.control_nets ?? [],
      loras: data.controls?.loras ?? [],
    },
    params: {
      width: data.params?.width,
      height: data.params?.height,
      steps: data.params?.steps,
      guidance: data.params?.guidance,
      sampler: data.params?.sampler ?? '',
      seed: data.params?.seed,
      images: data.params?.images,
    },
    post: {
      upscale: {
        mode: data.post?.upscale?.mode ?? '',
        strength: data.post?.upscale?.strength,
      },
      face_restore: Boolean(data.post?.face_restore),
    },
    safety: {
      allow_nsfw: Boolean(data.safety?.allow_nsfw),
    },
    provider_overrides: { flux: {}, wan: {}, sdxl: {}, ...(data.provider_overrides ?? {}) },
    notes: data.notes ?? '',
  };
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [textProvider, setTextProvider] = useState(TEXT_PROVIDERS[0].value);
  const [visionProvider, setVisionProvider] = useState(VISION_PROVIDERS[0].value);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [response, setResponse] = useState<GeneratePromptResponse | null>(null);
  const [editableData, setEditableData] = useState<GeneratedPromptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversionTarget, setConversionTarget] = useState<ProviderTargetModel>('flux.1');
  const [conversionResponse, setConversionResponse] = useState<ConvertPromptResponse | null>(null);
  const [conversionLoading, setConversionLoading] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const lastEditableSnapshot = useRef<string | null>(null);

  const { apiKeys, addTokenUsage, tokenUsage } = useSession();

  const steps = useMemo(
    () => [
      { title: 'Describe', subtitle: 'Start with your concept' },
      { title: 'Refine', subtitle: 'Adjust technical details' },
      { title: 'Finalize', subtitle: 'Review & copy the output' },
    ],
    []
  );

  const progressPercentage = (currentStep / (steps.length - 1 || 1)) * 100;
  const canGoBack = currentStep > 0;
  const canAdvance = () => {
    if (currentStep === 0) return Boolean(editableData);
    if (currentStep === 1) return Boolean(editableData);
    return true;
  };

  const sanitisedApiKeys = useMemo(
    () => (Object.keys(apiKeys).length > 0 ? apiKeys : undefined),
    [apiKeys]
  );

  const tokenUsageDisplay = useMemo(
    () => tokenUsage.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    [tokenUsage]
  );

  const conversionTokenUsage = useMemo(
    () => (conversionResponse ? normaliseTokenUsage(conversionResponse.token_usage) : null),
    [conversionResponse]
  );

  const resetConversion = useCallback(() => {
    setConversionResponse(null);
    setConversionError(null);
    setConversionLoading(false);
  }, []);

  const handleConversionTargetChange = useCallback((target: ProviderTargetModel) => {
    setConversionTarget(target);
  }, []);

  useEffect(() => {
    if (!editableData) {
      if (lastEditableSnapshot.current !== null) {
        lastEditableSnapshot.current = null;
        resetConversion();
      }
      return;
    }

    const snapshot = JSON.stringify(editableData);
    if (lastEditableSnapshot.current !== snapshot) {
      if (lastEditableSnapshot.current !== null) {
        resetConversion();
      }
      lastEditableSnapshot.current = snapshot;
    }
  }, [editableData, resetConversion]);

  const isSubmitDisabled = loading || (inputMode === 'text' ? !prompt.trim() : !referenceImage);

  const convertFileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const resultString = reader.result as string;
          const parts = resultString.split(',');
          resolve(parts.length > 1 ? parts[1] : resultString);
        } else {
          reject(new Error('Unable to read image'));
        }
      };
      reader.onerror = () => reject(new Error('Unable to read image'));
      reader.readAsDataURL(file);
    });

  const handleReferenceImageSelection = (file: File | null) => {
    setReferenceImage(file);
    if (!file) {
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
      }
    };
    reader.onerror = () => setImagePreview(null);
    reader.readAsDataURL(file);
  };

  const handleModeChange = (mode: 'text' | 'image') => {
    setInputMode(mode);
    setResponse(null);
    if (mode === 'text') {
      handleReferenceImageSelection(null);
    } else {
      setPrompt('');
    }
  };

  const trackTokenUsage = useCallback((usage: unknown) => {
    const total = normaliseTokenUsage(usage);
    if (total > 0) {
      addTokenUsage(total);
    }
  }, [addTokenUsage]);

  const handleConvert = useCallback(async () => {
    if (!editableData) {
      setConversionError('Structured prompt is not available yet.');
      return;
    }

    setConversionLoading(true);
    setConversionError(null);

    try {
      const result = await convertPrompt({
        data: editableData,
        target_model: conversionTarget,
        provider: textProvider,
        provider_api_keys: sanitisedApiKeys,
      });

      if (result.success && result.data) {
        setConversionResponse(result);
      } else {
        setConversionResponse(null);
        setConversionError(result.error || 'Unable to convert the prompt.');
      }

      trackTokenUsage(result.token_usage);
    } catch (error) {
      console.error('Failed to convert prompt:', error);
      setConversionResponse(null);
      setConversionError('An unexpected error occurred during conversion.');
    } finally {
      setConversionLoading(false);
    }
  }, [editableData, conversionTarget, textProvider, sanitisedApiKeys, trackTokenUsage]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputMode === 'text' && !prompt.trim()) return;
    if (inputMode === 'image' && !referenceImage) return;

    setLoading(true);
    try {
      let result: GeneratePromptResponse;

      if (inputMode === 'text') {
        const request: GeneratePromptRequest = {
          prompt: prompt.trim(),
          provider: textProvider,
          provider_api_keys: sanitisedApiKeys,
        };
        result = await generatePrompt(request);
      } else {
        if (!referenceImage) {
          throw new Error('Missing reference image');
        }
        const imageBase64 = await convertFileToBase64(referenceImage);
        const request: GeneratePromptFromImageRequest = {
          image_base64: imageBase64,
          filename: referenceImage.name,
          provider: visionProvider,
          provider_api_keys: sanitisedApiKeys,
        };
        result = await generatePromptFromImage(request);
      }

      setResponse(result);
      if (result.success && result.data) {
        setEditableData(normaliseGeneratedPromptData(result.data));
        setCopied(false);
        setCurrentStep(1);
      } else {
        setEditableData(null);
      }
      trackTokenUsage(result.token_usage);
    } catch (error) {
      console.error('Failed to generate prompt:', error);
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

  const handleVersionChange = (value: string) => {
    setEditableData((current) => (current ? { ...current, version: value || current.version } : current));
  };

  const handleIntentChange = (value: string) => {
    setEditableData((current) => (current ? { ...current, intent: value } : current));
  };

  const handlePromptChange = (field: 'primary' | 'negative', value: string) => {
    setEditableData((current) => {
      if (!current) return current;
      return {
        ...current,
        prompt: {
          ...current.prompt,
          [field]: value,
        },
      };
    });
  };

  const handleEnvironmentChange = (value: string) => {
    setEditableData((current) => (current ? { ...current, environment: value } : current));
  };

  const handleLightingChange = (value: string) => {
    setEditableData((current) => (current ? { ...current, lighting: value } : current));
  };

  const handleCompositionCameraChange = (
    field: keyof GeneratedPromptData['composition']['camera'],
    value: string
  ) => {
    setEditableData((current) => {
      if (!current) return current;
      return {
        ...current,
        composition: {
          ...current.composition,
          camera: {
            ...current.composition.camera,
            [field]: value,
          },
        },
      };
    });
  };

  const handleCompositionFieldChange = (
    field: Exclude<keyof GeneratedPromptData['composition'], 'camera'>,
    value: string
  ) => {
    setEditableData((current) => {
      if (!current) return current;
      return {
        ...current,
        composition: {
          ...current.composition,
          [field]: value,
        },
      };
    });
  };

  const handleStyleMediumChange = (value: string) => {
    setEditableData((current) => {
      if (!current) return current;
      return {
        ...current,
        style: {
          ...current.style,
          medium: value,
        },
      };
    });
  };

  const handleStyleListChange = (field: 'keywords' | 'aesthetic_bias', values: string[]) => {
    setEditableData((current) => {
      if (!current) return current;
      return {
        ...current,
        style: {
          ...current.style,
          [field]: values,
        },
      };
    });
  };

  const handleColorPaletteChange = (value: string) => {
    setEditableData((current) => (current ? { ...current, color: { ...current.color, palette: value } } : current));
  };

  const handleColorDominantColorsChange = (values: string[]) => {
    setEditableData((current) => (current ? { ...current, color: { ...current.color, dominant_colors: values } } : current));
  };

  const handleParamsChange = (field: keyof GeneratedPromptData['params'], rawValue: string) => {
    setEditableData((current) => {
      if (!current) return current;
      const nextParams = { ...current.params } as Record<string, unknown>;
      if (field === 'sampler') {
        nextParams.sampler = rawValue;
      } else {
        const trimmed = rawValue.trim();
        if (!trimmed) {
          delete nextParams[field as string];
        } else {
          const numericValue = Number(trimmed);
          if (!Number.isNaN(numericValue)) {
            nextParams[field as string] = numericValue;
          }
        }
      }
      return {
        ...current,
        params: nextParams as GeneratedPromptData['params'],
      };
    });
  };

  const handlePostUpscaleChange = (
    field: keyof GeneratedPromptData['post']['upscale'],
    rawValue: string
  ) => {
    setEditableData((current) => {
      if (!current) return current;
      const nextUpscale = { ...current.post.upscale };
      if (field === 'mode') {
        nextUpscale.mode = rawValue;
      } else {
        const trimmed = rawValue.trim();
        if (!trimmed) {
          nextUpscale.strength = undefined;
        } else {
          const numericValue = Number(trimmed);
          if (!Number.isNaN(numericValue)) {
            nextUpscale.strength = numericValue;
          }
        }
      }
      return {
        ...current,
        post: {
          ...current.post,
          upscale: nextUpscale,
        },
      };
    });
  };

  const handlePostFaceRestoreChange = (value: boolean) => {
    setEditableData((current) => (current ? { ...current, post: { ...current.post, face_restore: value } } : current));
  };

  const handleSafetyChange = (value: boolean) => {
    setEditableData((current) => (current ? { ...current, safety: { ...current.safety, allow_nsfw: value } } : current));
  };

  const handleNotesChange = (value: string) => {
    setEditableData((current) => (current ? { ...current, notes: value } : current));
  };

  const handleSubjectChange = <K extends keyof Subject>(index: number, field: K, value: string) => {
    setEditableData((current) => {
      if (!current || !current.subjects) return current;
      const updatedSubjects = current.subjects.map((subject, subjectIndex) => {
        if (subjectIndex !== index) return subject;
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

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleForward = () => {
    if (currentStep === steps.length - 1) {
      setPrompt('');
      setInputMode('text');
      setTextProvider(TEXT_PROVIDERS[0].value);
      setVisionProvider(VISION_PROVIDERS[0].value);
      handleReferenceImageSelection(null);
      setResponse(null);
      setEditableData(null);
      setCopied(false);
      resetConversion();
      setConversionTarget('flux.1');
      setConversionLoading(false);
      lastEditableSnapshot.current = null;
      setCurrentStep(0);
      return;
    }

    if (!canAdvance()) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const renderNavigationControls = ({
    continueLabel,
    disableContinue,
    disableBack,
    showBack = true,
  }: {
    continueLabel: string;
    disableContinue: boolean;
    disableBack: boolean;
    showBack?: boolean;
  }) => (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {showBack && (
        <button
          type="button"
          onClick={handleBack}
          disabled={disableBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}
      <button
        type="button"
        onClick={handleForward}
        disabled={disableContinue}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-500/90 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {continueLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent)] py-12 px-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Agentic Image Prompt Generator</h1>
          <p className="text-lg text-slate-300">
            Move from an idea to a production-ready prompt in three guided steps.
          </p>
        </header>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Session settings
          </button>
        </div>

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
                <DescribeStep
                  inputMode={inputMode}
                  onModeChange={handleModeChange}
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  textProvider={textProvider}
                  onTextProviderChange={setTextProvider}
                  visionProvider={visionProvider}
                  onVisionProviderChange={setVisionProvider}
                  referenceImage={referenceImage}
                  imagePreview={imagePreview}
                  onReferenceImageChange={handleReferenceImageSelection}
                  onSubmit={handleSubmit}
                  loading={loading}
                  response={response}
                  navigation={renderNavigationControls({
                    continueLabel: 'Continue',
                    disableContinue: !canAdvance(),
                    disableBack: !canGoBack,
                  })}
                  textProviders={TEXT_PROVIDERS}
                  visionProviders={VISION_PROVIDERS}
                  isSubmitDisabled={isSubmitDisabled}
                />
                <RefineStep
                  editableData={editableData}
                  onVersionChange={handleVersionChange}
                  onIntentChange={handleIntentChange}
                  onPromptChange={handlePromptChange}
                  onEnvironmentChange={handleEnvironmentChange}
                  onLightingChange={handleLightingChange}
                  onCompositionCameraChange={handleCompositionCameraChange}
                  onCompositionFieldChange={handleCompositionFieldChange}
                  onStyleMediumChange={handleStyleMediumChange}
                  onStyleListChange={handleStyleListChange}
                  onColorPaletteChange={handleColorPaletteChange}
                  onColorDominantColorsChange={handleColorDominantColorsChange}
                  onParamsChange={handleParamsChange}
                  onPostUpscaleChange={handlePostUpscaleChange}
                  onPostFaceRestoreChange={handlePostFaceRestoreChange}
                  onSafetyChange={handleSafetyChange}
                  onNotesChange={handleNotesChange}
                  onSubjectChange={handleSubjectChange}
                  response={response}
                  navigation={renderNavigationControls({
                    continueLabel: 'Continue',
                    disableContinue: currentStep !== 1 || !canAdvance(),
                    disableBack: !canGoBack,
                  })}
                />
                <FinalizeStep
                  editableData={editableData}
                  response={response}
                  copied={copied}
                  onCopy={copyToClipboard}
                  conversionTarget={conversionTarget}
                  onConversionTargetChange={handleConversionTargetChange}
                  onConvert={handleConvert}
                  conversionLoading={conversionLoading}
                  conversionResult={conversionResponse?.data ?? null}
                  conversionError={conversionError}
                  conversionTokenUsage={conversionTokenUsage}
                  onResetConversion={resetConversion}
                  navigation={renderNavigationControls({
                    continueLabel: currentStep === steps.length - 1 ? 'Start new prompt' : 'Continue',
                    disableContinue: !canAdvance(),
                    disableBack: !canGoBack,
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-800 pt-6 text-sm text-slate-400">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Session token usage</span>
            <span className="text-base font-semibold text-blue-300">
              {tokenUsageDisplay} tokens consumed
            </span>
          </div>
        </footer>
      </div>

      {settingsOpen && <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

