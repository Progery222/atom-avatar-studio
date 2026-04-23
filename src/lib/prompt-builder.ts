import { SEEDANCE_CAMERA_EFFECTS, SEEDANCE_EMOTIONS, SEEDANCE_LIGHTING } from '@/constants/presets';

export interface PromptParams {
  emotion: string;
  dynamism: 1 | 2 | 3;
  cameraStyle: string;
  lightingId?: string;
  spokenText?: string;
  gender?: 'Male' | 'Female';
  cameraEffectPrompt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMISM MODIFIERS — applied per camera type
// ─────────────────────────────────────────────────────────────────────────────
const DYNAMISM_MODIFIERS: Record<string, Record<1 | 2 | 3, string>> = {
  static: {
    1: 'completely still, no movement whatsoever.',
    2: 'very subtle micro-movements, nearly static.',
    3: 'slight breathing motion, minimal sway.',
  },
  dramatic_push: {
    1: 'slow gentle push-in, soft zoom.',
    2: 'moderate dolly-in zoom, steady pace.',
    3: 'fast aggressive dolly-in, intense dramatic zoom.',
  },
  side_sweep: {
    1: 'slow gentle horizontal drift.',
    2: 'smooth medium-speed horizontal sweep.',
    3: 'fast energetic horizontal sweep, strong parallax.',
  },
  vlog_handheld: {
    1: 'very subtle handheld micro-shake, nearly stable.',
    2: 'natural handheld shake, organic movement.',
    3: 'strong handheld shake, energetic documentary feel.',
  },
  orbital_360: {
    1: 'very slow orbital rotation, almost imperceptible.',
    2: 'smooth medium-speed 360 orbit.',
    3: 'fast continuous 360-degree orbit, dynamic spin.',
  },
  floating: {
    1: 'barely perceptible vertical drift, ultra-gentle float.',
    2: 'smooth rhythmic vertical float, gentle bounce.',
    3: 'strong floating bounce, highly dynamic vertical sway.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EMOTION × CAMERA CONTEXT MODIFIERS
// Some emotions amplify differently depending on camera motion
// ─────────────────────────────────────────────────────────────────────────────
const EMOTION_CAMERA_CONTEXT: Partial<Record<string, Partial<Record<string, string>>>> = {
  joyful: {
    orbital_360: 'beaming smile throughout the rotation, eyes following the camera.',
    vlog_handheld: 'laughing and nodding, energetic head bobs.',
    floating: 'joyful floating, light-hearted bouncy energy.',
  },
  serious: {
    dramatic_push: 'intense unwavering gaze as camera pushes in, commanding presence.',
    static: 'stoic expression, powerful stillness.',
  },
  sarcastic: {
    side_sweep: 'eyebrow raised as camera sweeps, knowing smirk.',
    vlog_handheld: 'casual sarcastic delivery, slight eye-roll.',
  },
  empathetic: {
    floating: 'soft empathetic expression, gentle floating warmth.',
    static: 'warm direct eye contact, compassionate stillness.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTING × EMOTION SYNERGY
// ─────────────────────────────────────────────────────────────────────────────
const LIGHTING_EMOTION_SYNERGY: Partial<Record<string, Partial<Record<string, string>>>> = {
  neon: {
    joyful: 'neon reflections dancing in joyful eyes.',
    sarcastic: 'neon-lit smirk, cyberpunk attitude.',
  },
  dramatic: {
    serious: 'deep shadows accentuating intense expression.',
    sarcastic: 'noir-style dramatic shadows, mysterious smirk.',
  },
  golden_hour: {
    empathetic: 'warm golden light enhancing soft empathetic glow.',
    joyful: 'golden hour radiance amplifying joyful energy.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BUILDER
// ─────────────────────────────────────────────────────────────────────────────
export function buildPrompt({
  emotion,
  dynamism,
  cameraStyle,
  lightingId,
  spokenText,
  gender,
  cameraEffectPrompt,
}: PromptParams): string {
  const parts: string[] = [];

  const emotionId = emotion.toLowerCase();
  const cameraId = cameraStyle;
  const lightId = lightingId || 'studio';

  // ── 1. CAMERA MOTION (highest priority — placed first for model attention) ──
  const camera = SEEDANCE_CAMERA_EFFECTS.find(c => c.id === cameraId);
  if (camera) {
    parts.push(camera.prompt);
  } else if (cameraEffectPrompt) {
    parts.push(cameraEffectPrompt);
  }

  // ── 2. DYNAMISM MODIFIER (context-aware per camera type) ──
  const dynamismMod = DYNAMISM_MODIFIERS[cameraId]?.[dynamism];
  if (dynamismMod) {
    parts.push(dynamismMod);
  } else {
    // Generic fallback
    if (dynamism === 1) parts.push('minimal movement, calm and controlled.');
    if (dynamism === 2) parts.push('smooth natural movement, balanced energy.');
    if (dynamism === 3) parts.push('highly dynamic, expressive, energetic motion.');
  }

  // ── 3. EMOTION (base expression) ──
  const emotionPreset = SEEDANCE_EMOTIONS.find(e => e.id === emotionId);
  if (emotionPreset) {
    parts.push(emotionPreset.prompt);
  }

  // ── 4. EMOTION × CAMERA CONTEXT SYNERGY ──
  const emotionCameraBonus = EMOTION_CAMERA_CONTEXT[emotionId]?.[cameraId];
  if (emotionCameraBonus) {
    parts.push(emotionCameraBonus);
  }

  // ── 5. LIGHTING ──
  const lighting = SEEDANCE_LIGHTING.find(l => l.id === lightId);
  if (lighting) {
    parts.push(lighting.prompt);
  }

  // ── 6. LIGHTING × EMOTION SYNERGY ──
  const lightingEmotionBonus = LIGHTING_EMOTION_SYNERGY[lightId]?.[emotionId];
  if (lightingEmotionBonus) {
    parts.push(lightingEmotionBonus);
  }

  // ── 7. VOICE / GENDER ──
  if (gender === 'Male') parts.push('The speaker has a deep masculine voice.');
  if (gender === 'Female') parts.push('The speaker has a clear feminine voice.');

  // ── 8. SPOKEN TEXT ──
  if (spokenText && spokenText.trim().length > 0) {
    parts.push(`The character is speaking the following words clearly: "${spokenText.trim()}".`);
  }

  return parts.join(' ');
}
