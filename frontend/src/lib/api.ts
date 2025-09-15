const API_BASE_URL = 'http://localhost:8000';

export interface PromptRequest {
	input_text: string;
	style?: string;
	quality?: string;
	nsfw_filter?: boolean;
	provider?: string;
}

export interface PromptResponse {
	id: string;
	prompt: string;
	camera?: string;
	subjects?: string[];
	environment?: string;
	lighting?: string;
	nsfw: boolean;
	metadata?: any;
	created_at: string;
}

export interface Settings {
	openai_api_key?: string;
	google_api_key?: string;
	default_style: string;
	default_quality: string;
	nsfw_filter: boolean;
	provider: string;
}

export interface HistoryItem {
	id: string;
	initial_prompt: string;
	enhanced_prompt: string;
	camera: string;
	subjects: string;
	environment: string;
	lighting: string;
	nsfw: boolean;
	provider: string;
	created_at: string;
}

export interface PaginatedHistory {
	items: HistoryItem[];
	total: number;
	page: number;
	per_page: number;
	total_pages: number;
}

class ApiService {
	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${API_BASE_URL}${endpoint}`;
		const config: RequestInit = {
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			...options
		};

		try {
			const response = await fetch(url, config);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
				throw new Error(errorData.detail || `HTTP ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Network error');
		}
	}

	// Generation endpoints
	async generatePrompt(request: PromptRequest): Promise<PromptResponse> {
		return this.request<PromptResponse>('/api/generate', {
			method: 'POST',
			body: JSON.stringify(request)
		});
	}

	async getProviders(): Promise<{providers: string[]}> {
		// Since there's no providers endpoint, return available providers based on settings
		return { providers: ['openai', 'google'] };
	}

	async getRecentPrompts(limit: number = 5): Promise<HistoryItem[]> {
		const response = await this.request<PromptResponse[]>(`/api/history?limit=${limit}`);
		return response.map(item => ({
			id: item.id,
			initial_prompt: '', // Not available in this response
			enhanced_prompt: item.prompt,
			camera: item.camera || '',
			subjects: Array.isArray(item.subjects) ? item.subjects.join(', ') : '',
			environment: item.environment || '',
			lighting: item.lighting || '',
			nsfw: item.nsfw,
			provider: 'openai', // Default since not in response
			created_at: item.created_at
		}));
	}

	// Settings endpoints
	async getSettings(): Promise<Settings> {
		return this.request<Settings>('/api/settings');
	}

	async updateSettings(settings: Partial<Settings>): Promise<Settings> {
		return this.request<Settings>('/api/settings', {
			method: 'POST',
			body: JSON.stringify(settings)
		});
	}

	async saveSettings(data: { api_keys: any; settings: any }): Promise<void> {
		return this.request('/api/settings', {
			method: 'POST',
			body: JSON.stringify({ ...data.settings, ...data.api_keys })
		});
	}

	async testProvider(provider: string): Promise<{ status: string; message: string }> {
		return this.request('/api/test-connection', {
			method: 'POST',
			body: JSON.stringify({ provider })
		});
	}

	async getSupportedProviders(): Promise<{providers: string[]}> {
		return { providers: ['openai', 'google'] };
	}

	async deleteApiKey(provider: string): Promise<{ message: string }> {
		return this.request(`/api/settings/api-key/${provider}`, {
			method: 'DELETE'
		});
	}

	async resetSettings(): Promise<{ message: string }> {
		return this.request('/api/settings/reset', {
			method: 'POST'
		});
	}

	// History endpoints
	async getHistory(page: number = 1, perPage: number = 10): Promise<PaginatedHistory> {
		return this.request<PaginatedHistory>(`/api/history?page=${page}&per_page=${perPage}`);
	}

	async getHistoryItem(id: string): Promise<HistoryItem> {
		return this.request<HistoryItem>(`/api/history/${id}`);
	}

	async deleteHistoryItem(id: string): Promise<{ message: string }> {
		return this.request(`/api/history/${id}`, {
			method: 'DELETE'
		});
	}

	async clearHistory(): Promise<{ message: string }> {
		return this.request('/api/history/clear', {
			method: 'DELETE'
		});
	}

	async getHistoryStats(): Promise<{ total_prompts: number; total_providers: number; most_used_provider: string }> {
		return this.request('/api/history/stats');
	}

	async searchHistory(query: string, page: number = 1, perPage: number = 10): Promise<PaginatedHistory> {
		return this.request<PaginatedHistory>(`/api/history/search?q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`);
	}
}

export const api = new ApiService();