export type FieldSuggestionKey =
  | 'prompt.primary'
  | 'prompt.negative'
  | 'composition.camera.angle'
  | 'composition.camera.lens'
  | 'composition.camera.framing'
  | 'composition.camera.depth_of_field'
  | 'composition.shot'
  | 'composition.aspect_ratio'
  | 'style.keywords'
  | 'style.medium'
  | 'style.aesthetic_bias'
  | 'environment'
  | 'lighting'
  | 'color.palette'
  | 'color.dominant_colors'
  | 'subjects.mood'
  | 'subjects.body_attributes'
  | 'subjects.wardrobe'
  | 'subjects.pose'
  | 'post.upscale.mode';

const suggestions: Record<FieldSuggestionKey, string[]> = {
  'prompt.primary': [
    'cinematic portrait of a visionary leader',
    'dreamy landscape bathed in morning mist',
    'hyper-detailed sci-fi environment with neon accents',
    'artisan product shot with dramatic shadows',
  ],
  'prompt.negative': [
    'blurry',
    'overexposed',
    'distorted proportions',
    'extra limbs',
    'text artifacts',
  ],
  'composition.camera.angle': [
    'eye-level',
    'high angle',
    'low angle',
    "bird's-eye view",
    "worm's-eye view",
    'dutch angle',
    'wide-angle',
  ],
  'composition.camera.lens': [
    'macro',
    'telephoto',
    'wide-angle',
    'fisheye',
    'standard prime',
    'zoom',
    'portrait lens',
  ],
  'composition.camera.framing': [
    'close-up',
    'medium shot',
    'long shot',
    'extreme close-up',
    'full body',
    'panoramic',
    "over-the-shoulder",
  ],
  'composition.camera.depth_of_field': [
    'shallow',
    'deep focus',
    'tilt-shift',
    'selective focus',
    'soft falloff',
  ],
  'composition.shot': [
    'portrait',
    'wide',
    'close-up',
    'establishing',
    'macro detail',
  ],
  'composition.aspect_ratio': ['1:1', '3:2', '4:3', '16:9', '21:9', '9:16'],
  'style.keywords': [
    'photorealistic',
    'cinematic',
    'surreal',
    'noir',
    'vintage film',
    'concept art',
    'illustrative',
  ],
  'style.medium': [
    'photography',
    'digital painting',
    'oil painting',
    'watercolour',
    '3d render',
    'mixed media',
  ],
  'style.aesthetic_bias': [
    'clean skin',
    'natural tones',
    'rich contrast',
    'matte finish',
    'high gloss',
    'film grain',
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
  'color.palette': [
    'warm, muted',
    'cool monochrome',
    'vibrant complementary',
    'earthy neutrals',
    'analogous sunset',
  ],
  'color.dominant_colors': ['#f5d0c5', '#203040', '#ffd166', '#1b998b', '#ef476f', '#073b4c'],
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
  'post.upscale.mode': ['2x', '3x', '4x', '6x'],
};

export const getSuggestionsForField = (key: FieldSuggestionKey) => suggestions[key];

