<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type Settings } from '$lib/api';
	import { toast } from 'svelte-sonner';

	interface ApiKeys {
		openai_api_key?: string;
		google_api_key?: string;
	}

	interface TestResult {
		provider: string;
		status: 'success' | 'error' | 'testing';
		message: string;
	}

	let apiKeys: ApiKeys = {};
	let settings: Partial<Settings> = {
		default_style: 'photographic',
		default_quality: 'standard',
		nsfw_filter: true,
		provider: 'openai'
	};
	let testResults: TestResult[] = [];
	let loading = false;
	let saving = false;
	let supportedProviders = ['openai', 'google'];

	onMount(async () => {
		await loadSettings();
	});

	async function loadSettings() {
		try {
			loading = true;
			const data = await api.getSettings();
			settings = {
				default_style: data.default_style || 'photographic',
				default_quality: data.default_quality || 'standard',
				nsfw_filter: data.nsfw_filter ?? true,
				provider: data.provider || 'openai'
			};
			apiKeys = {
				openai_api_key: data.openai_api_key || '',
				google_api_key: data.google_api_key || ''
			};
		} catch (err) {
			console.error('Failed to load settings:', err);
			toast.error('Failed to load settings');
		} finally {
			loading = false;
		}
	}

	async function saveSettings() {
		try {
			saving = true;
			const data = {
				...settings,
				...apiKeys
			};
			await api.updateSettings(data);
			toast.success('Settings saved successfully');
		} catch (err) {
			console.error('Failed to save settings:', err);
			toast.error('Failed to save settings');
		} finally {
			saving = false;
		}
	}

	async function testProvider(provider: string) {
		if (!apiKeys[`${provider}_api_key` as keyof ApiKeys]) {
			toast.error(`Please enter ${getProviderDisplayName(provider)} API key first`);
			return;
		}

		const existingIndex = testResults.findIndex(r => r.provider === provider);
		if (existingIndex >= 0) {
			testResults[existingIndex] = { provider, status: 'testing', message: 'Testing connection...' };
		} else {
			testResults = [...testResults, { provider, status: 'testing', message: 'Testing connection...' }];
		}

		try {
			const result = await api.testProvider(provider);
			const resultIndex = testResults.findIndex(r => r.provider === provider);
			if (resultIndex >= 0) {
				testResults[resultIndex] = {
					provider,
					status: result.status === 'success' ? 'success' : 'error',
					message: result.message
				};
			}
		} catch (err) {
			const resultIndex = testResults.findIndex(r => r.provider === provider);
			if (resultIndex >= 0) {
				testResults[resultIndex] = {
					provider,
					status: 'error',
					message: 'Connection test failed'
				};
			}
		}
	}

	async function resetSettings() {
		if (confirm('Are you sure you want to reset all settings to default values?')) {
			try {
				await api.resetSettings();
				await loadSettings();
				testResults = [];
				toast.success('Settings reset successfully');
			} catch (err) {
				console.error('Failed to reset settings:', err);
				toast.error('Failed to reset settings');
			}
		}
	}

	function getProviderDisplayName(provider: string): string {
		switch (provider) {
			case 'openai': return 'OpenAI';
			case 'google': return 'Google';
			default: return provider;
		}
	}

	function getTestResult(provider: string): TestResult | undefined {
		return testResults.find(r => r.provider === provider);
	}
</script>

<svelte:head>
	<title>Settings - AI Prompt Helper</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
		<p class="text-gray-600">Configure your AI providers and application preferences</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<span class="ml-3 text-gray-600">Loading settings...</span>
		</div>
	{:else}
		<div class="space-y-8">
			<!-- API Keys Section -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">API Keys</h2>
				<div class="space-y-6">
					{#each supportedProviders as provider}
						{@const testResult = getTestResult(provider)}
						<div class="space-y-3">
							<label for="{provider}-key" class="block text-sm font-medium text-gray-700">
								{getProviderDisplayName(provider)} API Key
							</label>
							<div class="flex gap-3">
								<input
									id="{provider}-key"
									type="password"
									bind:value={apiKeys[`${provider}_api_key`]}
									placeholder="Enter your {getProviderDisplayName(provider)} API key"
									class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<button
									on:click={() => testProvider(provider)}
									disabled={!apiKeys[`${provider}_api_key`] || testResult?.status === 'testing'}
									class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									{#if testResult?.status === 'testing'}
										Testing...
									{:else}
										Test
									{/if}
								</button>
							</div>
							{#if testResult}
								<div class="flex items-center gap-2 text-sm">
									{#if testResult.status === 'success'}
										<div class="w-2 h-2 bg-green-500 rounded-full"></div>
										<span class="text-green-700">{testResult.message}</span>
									{:else if testResult.status === 'error'}
										<div class="w-2 h-2 bg-red-500 rounded-full"></div>
										<span class="text-red-700">{testResult.message}</span>
									{:else}
										<div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
										<span class="text-yellow-700">{testResult.message}</span>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- General Settings Section -->
			<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">General Settings</h2>
				<div class="space-y-6">
					<div>
						<label for="provider" class="block text-sm font-medium text-gray-700 mb-2">
							Default Provider
						</label>
						<select
							id="provider"
							bind:value={settings.provider}
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							{#each supportedProviders as provider}
								<option value={provider}>{getProviderDisplayName(provider)}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="style" class="block text-sm font-medium text-gray-700 mb-2">
							Default Style
						</label>
						<select
							id="style"
							bind:value={settings.default_style}
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="photographic">Photographic</option>
							<option value="artistic">Artistic</option>
							<option value="cinematic">Cinematic</option>
							<option value="anime">Anime</option>
						</select>
					</div>

					<div>
						<label for="quality" class="block text-sm font-medium text-gray-700 mb-2">
							Default Quality
						</label>
						<select
							id="quality"
							bind:value={settings.default_quality}
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="standard">Standard</option>
							<option value="hd">HD</option>
						</select>
					</div>

					<div class="flex items-center">
						<input
							id="nsfw-filter"
							type="checkbox"
							bind:checked={settings.nsfw_filter}
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<label for="nsfw-filter" class="ml-2 block text-sm text-gray-700">
							Enable NSFW filter
						</label>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex justify-between">
				<button
					on:click={resetSettings}
					class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
				>
					Reset to Defaults
				</button>
				<button
					on:click={saveSettings}
					disabled={saving}
					class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{#if saving}
						Saving...
					{:else}
						Save Settings
					{/if}
				</button>
			</div>
		</div>
	{/if}
</div>