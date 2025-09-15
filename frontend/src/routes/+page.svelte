<script lang="ts">
	import { onMount } from 'svelte';
	import { api, type PromptResponse, type HistoryItem } from '$lib/api';
	import { Wand2, Copy, Download, History, Sparkles, Camera, Users, MapPin, Sun, AlertTriangle, X } from 'lucide-svelte';

	let initialPrompt = '';
	let isGenerating = false;
	let generatedPrompt: PromptResponse | null = null;
	let recentPrompts: HistoryItem[] = [];
	let error = '';
	let providers: string[] = [];
	let selectedProvider = '';
	let nsfwFilter = true;

	onMount(async () => {
		try {
			const response = await api.getProviders();
			if (response.success && response.providers) {
				providers = response.providers.map((p: any) => p.name);
				if (providers.length > 0) {
					selectedProvider = providers[0];
				}
			}
			await loadRecentPrompts();
		} catch (err) {
			console.error('Failed to load initial data:', err);
		}
	});

	async function loadRecentPrompts() {
		try {
			recentPrompts = await api.getRecentPrompts(5);
		} catch (err) {
			console.error('Failed to load recent prompts:', err);
		}
	}

	async function generatePrompt() {
		if (!initialPrompt.trim()) {
			error = 'Please enter a prompt';
			return;
		}

		isGenerating = true;
		error = '';
		generatedPrompt = null;

		try {
			const response = await api.generatePrompt({
			input_text: initialPrompt,
			provider: selectedProvider,
			nsfw_filter: nsfwFilter
		});
			generatedPrompt = {
				id: response.id || Date.now().toString(),
				initial_prompt: initialPrompt,
				enhanced_prompt: response.prompt,
				camera: response.camera || '',
				subjects: Array.isArray(response.subjects) ? response.subjects.join(', ') : (response.subjects || ''),
				environment: response.environment || '',
				lighting: response.lighting || '',
				nsfw: response.nsfw,
				provider: selectedProvider,
				created_at: response.created_at || new Date().toISOString()
			};
			await loadRecentPrompts();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate prompt';
		} finally {
			isGenerating = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			// Could add a toast notification here
			console.log('Copied to clipboard');
		});
	}

	function downloadPrompt() {
		if (!generatedPrompt) return;

		const content = `Enhanced Prompt: ${generatedPrompt.enhanced_prompt}\n\nDetails:\nCamera: ${generatedPrompt.camera}\nSubjects: ${generatedPrompt.subjects}\nEnvironment: ${generatedPrompt.environment}\nLighting: ${generatedPrompt.lighting}\nNSFW: ${generatedPrompt.nsfw ? 'Yes' : 'No'}\nProvider: ${generatedPrompt.provider}\nGenerated: ${new Date(generatedPrompt.created_at).toLocaleString()}`;

		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `prompt-${generatedPrompt.id}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function useRecentPrompt(prompt: HistoryItem) {
		initialPrompt = prompt.initial_prompt;
		generatedPrompt = {
			id: prompt.id,
			initial_prompt: prompt.initial_prompt,
			enhanced_prompt: prompt.enhanced_prompt,
			camera: prompt.camera,
			subjects: prompt.subjects,
			environment: prompt.environment,
			lighting: prompt.lighting,
			nsfw: prompt.nsfw,
			provider: prompt.provider,
			created_at: prompt.created_at
		};
	}
</script>

<svelte:head>
	<title>Text-to-Image Prompt Generator</title>
	<meta name="description" content="AI-powered prompt enhancement using CrewAI" />
</svelte:head>

<div class="space-y-12">
	<!-- Hero Section -->
	<div class="text-center space-y-6 py-8">
		<div class="flex justify-center">
			<div class="p-6 bg-gradient-to-br from-primary-500 via-purple-500 to-secondary-500 rounded-3xl shadow-glow-purple animate-float hover-lift">
				<Sparkles class="w-16 h-16 text-white" />
			</div>
		</div>
		<div class="space-y-4">
			<h1 class="text-5xl md:text-6xl font-bold text-gradient-hero leading-tight">
				AI Prompt Generator
			</h1>
			<p class="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
				Transform your simple ideas into <span class="text-gradient font-semibold">detailed, professional prompts</span> using our AI-powered enhancement engine.
			</p>
		</div>
		<div class="flex justify-center space-x-4 pt-4">
			<div class="px-4 py-2 bg-gradient-card rounded-full border border-white/30 backdrop-blur-sm">
				<span class="text-sm font-medium text-gray-700">✨ Powered by CrewAI</span>
			</div>
			<div class="px-4 py-2 bg-gradient-card rounded-full border border-white/30 backdrop-blur-sm">
				<span class="text-sm font-medium text-gray-700">🚀 Multi-AI Support</span>
			</div>
		</div>
	</div>

	<!-- Main Generation Interface -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Input Section -->
		<div class="lg:col-span-2 space-y-6">
			<div class="card-gradient p-8 hover-lift">
				<h2 class="text-3xl font-bold mb-6 flex items-center space-x-3">
					<div class="p-2 bg-gradient-to-r from-primary-500 to-purple-500 rounded-lg">
						<Wand2 class="w-6 h-6 text-white" />
					</div>
					<span class="text-gradient">Generate Enhanced Prompt</span>
				</h2>

				<div class="space-y-4">
					<!-- Prompt Input -->
					<div>
						<label for="prompt" class="block text-sm font-medium text-gray-700 mb-2">
							Your Initial Prompt
						</label>
						<textarea
							id="prompt"
							bind:value={initialPrompt}
							placeholder="Enter your basic prompt idea... (e.g., 'a cat sitting in a garden')"
							class="textarea h-40 text-lg"
							disabled={isGenerating}
						></textarea>
					</div>

					<!-- Options -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="provider" class="block text-sm font-medium text-gray-700 mb-2">
								AI Provider
							</label>
							<select id="provider" bind:value={selectedProvider} class="input" disabled={isGenerating}>
								{#each providers as provider}
									<option value={provider}>{provider}</option>
								{/each}
							</select>
						</div>

						<div class="flex items-center space-x-3 pt-6">
							<input
								id="nsfw-filter"
								type="checkbox"
								bind:checked={nsfwFilter}
								class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
								disabled={isGenerating}
							/>
							<label for="nsfw-filter" class="text-sm font-medium text-gray-700">
								Enable NSFW Filter
							</label>
						</div>
					</div>

					<!-- Generate Button -->
					<button
						on:click={generatePrompt}
					disabled={isGenerating || !initialPrompt.trim()}
					class="btn btn-gradient w-full py-4 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 {isGenerating ? 'animate-pulse-glow' : ''} relative overflow-hidden"
				>
					{#if isGenerating}
						<div class="flex items-center justify-center space-x-3">
							<div class="relative">
								<div class="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
								<div class="absolute inset-0 animate-pulse">
									<div class="rounded-full h-6 w-6 bg-white/20"></div>
								</div>
							</div>
							<span class="animate-pulse">Generating Amazing Prompt...</span>
						</div>
						<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
					{:else}
						<div class="flex items-center justify-center space-x-3">
							<Sparkles class="w-6 h-6 animate-pulse" />
							<span>Generate Enhanced Prompt</span>
							<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
						</div>
					{/if}
				</button>

					<!-- Error Message -->
				{#if error}
					<div class="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-lg animate-shake">
						<div class="flex items-center space-x-3">
							<div class="p-1 bg-red-100 rounded-full">
								<AlertTriangle class="w-5 h-5 text-red-500" />
							</div>
							<span class="font-medium">{error}</span>
							<button 
								on:click={() => error = ''}
								class="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors"
								title="Dismiss error"
							>
								<X class="w-4 h-4" />
							</button>
						</div>
					</div>
				{/if}
				</div>
			</div>

			<!-- Results Section -->
			{#if generatedPrompt}
				<div class="card-gradient p-8 hover-lift animate-shimmer">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-2xl font-bold text-gradient flex items-center space-x-2">
							<Sparkles class="w-6 h-6 text-primary-500" />
							<span>Enhanced Prompt</span>
						</h3>
						<div class="flex space-x-3">
							<button
								on:click={() => copyToClipboard(generatedPrompt?.enhanced_prompt || '')}
								class="btn btn-outline hover-lift"
								title="Copy to clipboard"
							>
								<Copy class="w-4 h-4" />
								<span class="hidden sm:inline ml-2">Copy</span>
							</button>
							<button
								on:click={downloadPrompt}
								class="btn btn-outline hover-lift"
								title="Download as text file"
							>
								<Download class="w-4 h-4" />
								<span class="hidden sm:inline ml-2">Download</span>
							</button>
						</div>
					</div>

					<div class="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/30 shadow-lg">
						<p class="text-gray-800 leading-relaxed text-lg font-medium">{generatedPrompt.enhanced_prompt}</p>
					</div>

					<!-- Prompt Details -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div class="flex items-center space-x-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 hover-lift">
							<div class="p-2 bg-blue-500 rounded-lg">
								<Camera class="w-5 h-5 text-white" />
							</div>
							<div>
								<p class="text-xs text-blue-600 font-bold uppercase tracking-wide">Camera</p>
								<p class="text-sm text-blue-800 font-medium">{generatedPrompt.camera}</p>
							</div>
						</div>

						<div class="flex items-center space-x-3 p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50 hover-lift">
							<div class="p-2 bg-green-500 rounded-lg">
								<Users class="w-5 h-5 text-white" />
							</div>
							<div>
								<p class="text-xs text-green-600 font-bold uppercase tracking-wide">Subjects</p>
								<p class="text-sm text-green-800 font-medium">{generatedPrompt.subjects}</p>
							</div>
						</div>

						<div class="flex items-center space-x-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50 hover-lift">
							<div class="p-2 bg-purple-500 rounded-lg">
								<MapPin class="w-5 h-5 text-white" />
							</div>
							<div>
								<p class="text-xs text-purple-600 font-bold uppercase tracking-wide">Environment</p>
								<p class="text-sm text-purple-800 font-medium">{generatedPrompt.environment}</p>
							</div>
						</div>

						<div class="flex items-center space-x-3 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl border border-yellow-200/50 hover-lift">
							<div class="p-2 bg-yellow-500 rounded-lg">
								<Sun class="w-5 h-5 text-white" />
							</div>
							<div>
								<p class="text-xs text-yellow-600 font-bold uppercase tracking-wide">Lighting</p>
								<p class="text-sm text-yellow-800 font-medium">{generatedPrompt.lighting}</p>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Recent Prompts Sidebar -->
		<div class="space-y-6">
			<div class="card-gradient p-6 hover-lift">
				<h3 class="text-xl font-bold mb-6 flex items-center space-x-3">
					<div class="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg">
						<History class="w-5 h-5 text-white" />
					</div>
					<span class="text-gradient">Recent Prompts</span>
				</h3>

				{#if recentPrompts.length > 0}
					<div class="space-y-3">
						{#each recentPrompts as prompt}
						<button 
							type="button"
							class="w-full text-left p-4 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white/80 transition-all duration-300 cursor-pointer hover-lift border border-white/30" 
							on:click={() => useRecentPrompt(prompt)}
							on:keydown={(e) => e.key === 'Enter' && useRecentPrompt(prompt)}
							title="Use this prompt: {prompt.initial_prompt}"
						>
								<p class="text-sm text-gray-800 font-medium truncate mb-2">{prompt.initial_prompt}</p>
								<p class="text-xs text-gray-500 font-medium">
									{new Date(prompt.created_at).toLocaleDateString()}
								</p>
							</button>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8">
						<div class="p-4 bg-gray-100/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
							<History class="w-8 h-8 text-gray-400" />
						</div>
						<p class="text-gray-500 font-medium">No recent prompts yet</p>
						<p class="text-gray-400 text-sm mt-1">Generate your first prompt to see history</p>
					</div>
				{/if}
			</div>

			<!-- Quick Tips -->
			<div class="card-gradient p-6 hover-lift">
				<h3 class="text-xl font-bold mb-6 flex items-center space-x-2">
					<span class="text-2xl">💡</span>
					<span class="text-gradient">Quick Tips</span>
				</h3>
				<div class="space-y-4">
					<div class="flex items-start space-x-3 p-3 bg-white/40 rounded-lg">
						<span class="text-primary-500 font-bold">•</span>
						<p class="text-sm text-gray-700 font-medium">Be specific about subjects and actions</p>
					</div>
					<div class="flex items-start space-x-3 p-3 bg-white/40 rounded-lg">
						<span class="text-primary-500 font-bold">•</span>
						<p class="text-sm text-gray-700 font-medium">Mention desired art style or mood</p>
					</div>
					<div class="flex items-start space-x-3 p-3 bg-white/40 rounded-lg">
						<span class="text-primary-500 font-bold">•</span>
						<p class="text-sm text-gray-700 font-medium">Include lighting preferences</p>
					</div>
					<div class="flex items-start space-x-3 p-3 bg-white/40 rounded-lg">
						<span class="text-primary-500 font-bold">•</span>
						<p class="text-sm text-gray-700 font-medium">Specify camera angles if needed</p>
					</div>
					<div class="flex items-start space-x-3 p-3 bg-white/40 rounded-lg">
						<span class="text-primary-500 font-bold">•</span>
						<p class="text-sm text-gray-700 font-medium">Use descriptive adjectives</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>