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

export interface CameraSettings {
  angle: string;
  lens: string;
  framing: string;
}

export interface Subject {
  mood: string;
  body_attributes: string;
  age: number;
  wardrobe: string;
  pose: string;
}

export interface GeneratedPromptData {
  camera: CameraSettings;
  subjects?: Subject[];
  style: string;
  environment: string;
  lighting: string;
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
