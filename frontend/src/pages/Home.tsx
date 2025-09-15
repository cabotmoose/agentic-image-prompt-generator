import React, { useState } from 'react';
import { Copy, Send, Loader2 } from 'lucide-react';
import { generatePrompt, GeneratePromptRequest, GeneratePromptResponse } from '@/services/api';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('openai');
  const [response, setResponse] = useState<GeneratePromptResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
    } catch (error) {
      setResponse({
        success: false,
        error: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!response) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Image Prompt Generator
          </h1>
          <p className="text-lg text-gray-600">
            Transform your vague ideas into detailed image prompts
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Your Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your image idea... (e.g., 'a cat in a garden')"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                required
              />
            </div>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Prompt
                </>
              )}
            </button>
          </form>
        </div>

        {response && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Response
              </h2>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>

            {response.success ? (
              <div className="space-y-4">
                {response.processing_time && (
                  <p className="text-sm text-gray-500">
                    Processing time: {response.processing_time.toFixed(2)}s
                  </p>
                )}
                
                {response.data && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Structured Prompt Data:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Camera Settings:</h4>
                        <ul className="text-gray-600 space-y-1">
                          <li><strong>Angle:</strong> {response.data.camera.angle}</li>
                          <li><strong>Lens:</strong> {response.data.camera.lens}</li>
                          <li><strong>Framing:</strong> {response.data.camera.framing}</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">Scene Details:</h4>
                        <ul className="text-gray-600 space-y-1">
                          <li><strong>Style:</strong> {response.data.style}</li>
                          <li><strong>Environment:</strong> {response.data.environment}</li>
                          <li><strong>Lighting:</strong> {response.data.lighting}</li>
                        </ul>
                      </div>
                      
                      {response.data.subjects && response.data.subjects.length > 0 && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-700 mb-1">Subjects:</h4>
                          {response.data.subjects.map((subject, index) => (
                            <div key={index} className="bg-white rounded p-3 mb-2">
                              <ul className="text-gray-600 space-y-1">
                                <li><strong>Mood:</strong> {subject.mood}</li>
                                <li><strong>Age:</strong> {subject.age}</li>
                                <li><strong>Body Attributes:</strong> {subject.body_attributes}</li>
                                <li><strong>Wardrobe:</strong> {subject.wardrobe}</li>
                                <li><strong>Pose:</strong> {subject.pose}</li>
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Raw JSON Response:</h3>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2">Error</h3>
                <p className="text-red-600">{response.error}</p>
                <div className="mt-3">
                  <h4 className="font-medium text-red-800 mb-1">Raw JSON Response:</h4>
                  <pre className="bg-red-900 text-red-100 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}