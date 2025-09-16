export type FieldSuggestionKey =
  | 'camera.angle'
  | 'camera.lens'
  | 'camera.framing'
  | 'style'
  | 'environment'
  | 'lighting'
  | 'subjects.mood'
  | 'subjects.body_attributes'
  | 'subjects.wardrobe'
  | 'subjects.pose';

const suggestions: Record<FieldSuggestionKey, string[]> = {
  'camera.angle': [
    'eye-level',
    'high angle',
    'low angle',
    "bird's-eye view",
    "worm's-eye view",
    'dutch angle',
    'wide-angle',
  ],
  'camera.lens': [
    'macro',
    'telephoto',
    'wide-angle',
    'fisheye',
    'standard prime',
    'zoom',
    'portrait lens',
  ],
  'camera.framing': [
    'close-up',
    'medium shot',
    'long shot',
    'extreme close-up',
    'full body',
    'panoramic',
    "over-the-shoulder",
  ],
  style: [
    'photorealistic',
    'cinematic',
    'surreal',
    'noir',
    'vintage film',
    'concept art',
    'illustrative',
  ],
  environment: [
    'studio backdrop',
    'urban street',
    'forest clearing',
    'cozy interior',
    'futuristic city',
    'mountain summit',
    'seaside cliffs',
  ],
  lighting: [
    'golden hour',
    'soft diffused',
    'dramatic high contrast',
    'backlit silhouette',
    'neon glow',
    'moonlit',
    'studio softbox',
  ],
  'subjects.mood': [
    'joyful',
    'melancholic',
    'confident',
    'mysterious',
    'playful',
    'serene',
    'intense',
  ],
  'subjects.body_attributes': [
    'athletic build',
    'graceful',
    'slender',
    'strong',
    'elegant posture',
    'dynamic motion',
    'relaxed stance',
  ],
  'subjects.wardrobe': [
    'casual streetwear',
    'formal attire',
    'futuristic armor',
    'bohemian layers',
    'minimalist monochrome',
    'vibrant patterns',
    'vintage dress',
  ],
  'subjects.pose': [
    'power stance',
    'walking forward',
    'looking over shoulder',
    'mid-leap',
    'crossed arms',
    'hands in pockets',
    'seated profile',
  ],
};

export const getSuggestionsForField = (key: FieldSuggestionKey) => suggestions[key];
