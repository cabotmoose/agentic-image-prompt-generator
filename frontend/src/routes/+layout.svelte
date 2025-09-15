<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { Settings, Home, Sparkles } from 'lucide-svelte';

	$: currentPath = $page.url.pathname;
</script>

<div class="min-h-screen">
	<!-- Navigation -->
	<nav class="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-20">
				<!-- Logo -->
				<div class="flex items-center space-x-4 group">
					<div class="p-3 bg-gradient-to-br from-primary-500 via-purple-500 to-secondary-500 rounded-xl shadow-lg group-hover:shadow-glow transition-all duration-300 animate-float">
						<Sparkles class="w-7 h-7 text-white" />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-gradient-hero">Prompt Generator</h1>
						<p class="text-sm text-gray-600 font-medium">AI-powered prompt enhancement</p>
					</div>
				</div>

				<!-- Navigation Links -->
				<div class="flex items-center space-x-2">
					<a
						href="/"
						class="flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 hover-lift {currentPath === '/'
							? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
							: 'text-gray-700 hover:text-primary-600 hover:bg-white/60 backdrop-blur-sm'}"
					>
						<Home class="w-5 h-5" />
						<span>Home</span>
					</a>
					<a
						href="/settings"
						class="flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 hover-lift {currentPath === '/settings'
							? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
							: 'text-gray-700 hover:text-primary-600 hover:bg-white/60 backdrop-blur-sm'}"
					>
						<Settings class="w-5 h-5" />
						<span>Settings</span>
					</a>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<slot />
	</main>
	
	<!-- Background decoration -->
	<div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
		<div class="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-200/30 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
	</div>
</div>