/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554'
				},
				secondary: {
					50: '#faf5ff',
					100: '#f3e8ff',
					200: '#e9d5ff',
					300: '#d8b4fe',
					400: '#c084fc',
					500: '#6366f1',
					600: '#8b5cf6',
					700: '#7c3aed',
					800: '#6d28d9',
					900: '#581c87',
					950: '#3b0764'
				}
			},
			fontFamily: {
				sans: ['Inter', 'Source Sans Pro', 'system-ui', 'sans-serif'],
				heading: ['Inter', 'system-ui', 'sans-serif']
			}
		}
	},
	plugins: []
};