import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GeneratePromptRequest {
  prompt: string;
  provider?: string;
  provider_api_keys?: Record<string, string>;
}

export interface GeneratePromptFromImageRequest {
  image_base64: string;
  filename?: string;
  provider?: string;
  provider_api_keys?: Record<string, string>;
}

export interface PromptTexts {
  primary: string;
  negative?: string;
}

export interface CameraSettings {
  angle?: string;
  lens?: string;
  framing?: string;
  depth_of_field?: string;
}

export interface Composition {
  camera: CameraSettings;
  shot?: string;
  aspect_ratio?: string;
}

export interface Subject {
  role?: string;
  age?: string;
  body_attributes?: string;
  wardrobe?: string;
  pose?: string;
  mood?: string;
}

export interface StyleSettings {
  keywords: string[];
  medium?: string;
  aesthetic_bias: string[];
}

export interface ColorSettings {
  palette?: string;
  dominant_colors: string[];
}

export interface ImagePromptControl {
  uri: string;
  weight?: number;
  type?: string;
}

export interface ControlNetConfig {
  type: string;
  image_uri: string;
  weight?: number;
  start?: number;
  end?: number;
}

export interface LoraConfig {
  name: string;
  weight?: number;
}

export interface PromptControls {
  image_prompts: ImagePromptControl[];
  control_nets: ControlNetConfig[];
  loras: LoraConfig[];
}

export interface GenerationParams {
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  sampler?: string;
  seed?: number;
  images?: number;
}

export interface UpscaleSettings {
  mode?: string;
  strength?: number;
}

export interface PostProcessingSettings {
  upscale: UpscaleSettings;
  face_restore?: boolean;
}

export interface SafetySettings {
  allow_nsfw?: boolean;
}

export type ProviderOverrides = Record<string, Record<string, unknown>>;

export interface GeneratedPromptData {
  version: string;
  intent?: string;
  prompt: PromptTexts;
  subjects: Subject[];
  environment?: string;
  composition: Composition;
  lighting?: string;
  style: StyleSettings;
  color: ColorSettings;
  controls: PromptControls;
  params: GenerationParams;
  post: PostProcessingSettings;
  safety: SafetySettings;
  provider_overrides: ProviderOverrides;
  notes?: string;
}

export interface GeneratePromptResponse {
  success: boolean;
  data?: GeneratedPromptData;
  processing_time?: number;
  error?: string;
  token_usage?: unknown;
}

export const generatePrompt = async (request: GeneratePromptRequest): Promise<GeneratePromptResponse> => {
  try {
    const response = await api.post<GeneratePromptResponse>('/api/generate-prompt', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        error: error.response.data?.error || 'An error occurred while generating the prompt',
      };
    }
    return {
      success: false,
      error: 'Network error: Unable to connect to the server',
    };
  }
};

export const generatePromptFromImage = async (
  request: GeneratePromptFromImageRequest
): Promise<GeneratePromptResponse> => {
  try {
    const response = await api.post<GeneratePromptResponse>('/api/describe-image', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        error: error.response.data?.error || 'An error occurred while analysing the image',
      };
    }
    return {
      success: false,
      error: 'Network error: Unable to connect to the server',
    };
  }
};

