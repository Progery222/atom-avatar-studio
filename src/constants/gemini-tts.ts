/**
 * Gemini 3.1 Flash TTS Configuration
 * Google Cloud Text-to-Speech API integration
 */

export type GeminiVoiceType = 'Studio' | 'Chirp3-HD' | 'Neural2' | 'WaveNet' | 'Standard';

export interface GeminiVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  description: string;
  locale: string;
  type: GeminiVoiceType;
  previewUrl?: string;
}

export interface GeminiAudioTag {
  tag: string;
  description: string;
  example: string;
}

export interface GeminiSceneStyle {
  id: string;
  name: string;
  prompt: string;
  description: string;
}

export interface GeminiSpeakingRate {
  value: number;
  label: string;
  description: string;
}

export interface GeminiPitch {
  value: number;
  label: string;
  description: string;
}

// Available Google Cloud TTS Voices - verified from API
export const GEMINI_VOICES: GeminiVoice[] = [
  // English (US) - Studio voices (GA, support SSML)
  {
    id: 'en-US-Studio-O',
    name: 'Studio O',
    gender: 'Female',
    description: 'Professional female voice for narration',
    locale: 'en-US',
    type: 'Studio',
  },
  {
    id: 'en-US-Studio-Q',
    name: 'Studio Q',
    gender: 'Male',
    description: 'Professional male voice for narration',
    locale: 'en-US',
    type: 'Studio',
  },
  // English (UK) - Studio voices
  {
    id: 'en-GB-Studio-B',
    name: 'Studio B (UK)',
    gender: 'Male',
    description: 'British male voice, authoritative',
    locale: 'en-GB',
    type: 'Studio',
  },
  {
    id: 'en-GB-Studio-C',
    name: 'Studio C (UK)',
    gender: 'Female',
    description: 'British female voice, elegant',
    locale: 'en-GB',
    type: 'Studio',
  },
  // Russian - Standard voices
  {
    id: 'ru-RU-Standard-A',
    name: 'Алёна',
    gender: 'Female',
    description: 'Русский женский голос, нейтральный',
    locale: 'ru-RU',
    type: 'Standard',
  },
  {
    id: 'ru-RU-Standard-B',
    name: 'Фёдор',
    gender: 'Male',
    description: 'Русский мужской голос',
    locale: 'ru-RU',
    type: 'Standard',
  },
  {
    id: 'ru-RU-Standard-C',
    name: 'Мария',
    gender: 'Female',
    description: 'Русский женский голос',
    locale: 'ru-RU',
    type: 'Standard',
  },
  {
    id: 'ru-RU-Standard-D',
    name: 'Олег',
    gender: 'Male',
    description: 'Русский мужской голос, глубокий',
    locale: 'ru-RU',
    type: 'Standard',
  },
  {
    id: 'ru-RU-Standard-E',
    name: 'Елена',
    gender: 'Female',
    description: 'Русский женский голос, мягкий',
    locale: 'ru-RU',
    type: 'Standard',
  },
  // Russian - WaveNet voices (higher quality)
  {
    id: 'ru-RU-Wavenet-A',
    name: 'Анна (WaveNet)',
    gender: 'Female',
    description: 'Русский женский голос, WaveNet',
    locale: 'ru-RU',
    type: 'WaveNet',
  },
  {
    id: 'ru-RU-Wavenet-B',
    name: 'Дмитрий (WaveNet)',
    gender: 'Male',
    description: 'Русский мужской голос, WaveNet',
    locale: 'ru-RU',
    type: 'WaveNet',
  },
  // Russian - Chirp 3 HD voices (newest GA quality)
  {
    id: 'ru-RU-Chirp3-HD-Kore',
    name: 'Кора (Chirp 3)',
    gender: 'Female',
    description: 'Русский женский, Chirp 3 HD',
    locale: 'ru-RU',
    type: 'Chirp3-HD',
  },
  {
    id: 'ru-RU-Chirp3-HD-Leda',
    name: 'Леда (Chirp 3)',
    gender: 'Female',
    description: 'Русский женский, Chirp 3 HD',
    locale: 'ru-RU',
    type: 'Chirp3-HD',
  },
  {
    id: 'ru-RU-Chirp3-HD-Zephyr',
    name: 'Зефир (Chirp 3)',
    gender: 'Female',
    description: 'Русский женский, Chirp 3 HD',
    locale: 'ru-RU',
    type: 'Chirp3-HD',
  },
  {
    id: 'ru-RU-Chirp3-HD-Charon',
    name: 'Харон (Chirp 3)',
    gender: 'Male',
    description: 'Русский мужской, Chirp 3 HD',
    locale: 'ru-RU',
    type: 'Chirp3-HD',
  },
  {
    id: 'ru-RU-Chirp3-HD-Fenrir',
    name: 'Фенрир (Chirp 3)',
    gender: 'Male',
    description: 'Русский мужской, Chirp 3 HD',
    locale: 'ru-RU',
    type: 'Chirp3-HD',
  },
  {
    id: 'ru-RU-Chirp3-HD-Orus',
    name: 'Орус (Chirp 3)',
    gender: 'Male',
    description: 'Русский мужской, Chirp 3 HD',
    locale: 'ru-RU',
    type: 'Chirp3-HD',
  },
  {
    id: 'ru-RU-Chirp3-HD-Puck',
    name: 'Пак (Chirp 3)',
    gender: 'Male',
    description: 'Русский мужской, Chirp 3 HD',
    locale: 'ru-RU',
    type: 'Chirp3-HD',
  },
];

// Audio tags for controlling expressivity inline
export const GEMINI_AUDIO_TAGS: GeminiAudioTag[] = [
  { tag: '[laughs]', description: 'Laughter', example: 'That was hilarious [laughs]' },
  { tag: '[sigh]', description: 'Sighing', example: '[sigh] I wish I could help' },
  { tag: '[whispers]', description: 'Whispering', example: '[whispers] I have a secret' },
  { tag: '[shouts]', description: 'Shouting', example: '[shouts] Watch out!' },
  { tag: '[gasps]', description: 'Gasping', example: '[gasps] You startled me!' },
  { tag: '[pauses]', description: 'Pause', example: 'Let me think [pauses] about it' },
  { tag: '[clears throat]', description: 'Clearing throat', example: '[clears throat] Attention please' },
  { tag: '[sighs]', description: 'Deep sigh', example: '[sighs] What a day' },
  { tag: '[yawns]', description: 'Yawning', example: '[yawns] So tired' },
  { tag: '[cheers]', description: 'Cheering', example: '[cheers] We won!' },
  { tag: '[screams]', description: 'Screaming', example: '[screams] No!' },
  { tag: '[coughs]', description: 'Coughing', example: '[coughs] Excuse me' },
  { tag: '[sniffs]', description: 'Sniffing', example: '[sniffs] Do you smell that?' },
  { tag: '[mumbles]', description: 'Mumbling', example: '[mumbles] I dont know' },
  { tag: '[laughing]', description: 'Continuous laughter', example: '[laughing] Stop it!' },
];

// Scene styles for prompt-based direction
export const GEMINI_SCENE_STYLES: GeminiSceneStyle[] = [
  {
    id: 'casual',
    name: 'Casual Conversation',
    prompt: 'You are having a casual conversation with a friend. Speak naturally and warmly.',
    description: 'Relaxed, friendly tone',
  },
  {
    id: 'professional',
    name: 'Professional',
    prompt: 'You are delivering a professional presentation. Speak clearly and authoritatively with precise articulation.',
    description: 'Business, formal setting',
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    prompt: 'You are an engaging storyteller captivating your audience. Use expressive and dynamic delivery.',
    description: 'Narrative, expressive',
  },
  {
    id: 'news',
    name: 'News Anchor',
    prompt: 'You are a news anchor delivering breaking news. Speak with urgency but maintain clarity and professionalism.',
    description: 'Broadcast, urgent',
  },
  {
    id: 'intimate',
    name: 'Intimate',
    prompt: 'You are sharing a personal secret in a quiet, intimate setting. Speak softly and with emotional vulnerability.',
    description: 'Personal, emotional',
  },
  {
    id: 'enthusiastic',
    name: 'Enthusiastic',
    prompt: 'You are extremely excited about something amazing. Speak with high energy and enthusiasm.',
    description: 'High energy, excited',
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    prompt: 'You are performing in a dramatic theater scene. Speak with theatrical expression and emotional depth.',
    description: 'Theatrical, intense',
  },
  {
    id: 'calm',
    name: 'Calm & Meditative',
    prompt: 'You are leading a meditation session. Speak slowly, calmly, and soothingly.',
    description: 'Relaxing, peaceful',
  },
  {
    id: 'suspense',
    name: 'Suspenseful',
    prompt: 'You are building suspense in a mystery thriller. Speak with tension and anticipation.',
    description: 'Tense, mysterious',
  },
  {
    id: 'educational',
    name: 'Educational',
    prompt: 'You are a patient teacher explaining a complex topic. Speak clearly with educational warmth.',
    description: 'Instructional, clear',
  },
];

// Speaking rate options (speed)
export const GEMINI_SPEAKING_RATES: GeminiSpeakingRate[] = [
  { value: 0.25, label: 'Very Slow', description: '0.25x - Deep, deliberate' },
  { value: 0.5, label: 'Slow', description: '0.5x - Relaxed pace' },
  { value: 0.75, label: 'Slightly Slow', description: '0.75x - Measured' },
  { value: 1.0, label: 'Normal', description: '1.0x - Natural speed' },
  { value: 1.25, label: 'Slightly Fast', description: '1.25x - Brisk' },
  { value: 1.5, label: 'Fast', description: '1.5x - Quick delivery' },
  { value: 2.0, label: 'Very Fast', description: '2.0x - Rapid' },
  { value: 4.0, label: 'Maximum', description: '4.0x - Fastest' },
];

// Pitch adjustment options (in semitones)
export const GEMINI_PITCH_OPTIONS: GeminiPitch[] = [
  { value: -20, label: 'Very Low', description: '-20 semitones - Deepest' },
  { value: -10, label: 'Low', description: '-10 semitones - Deep' },
  { value: -5, label: 'Slightly Low', description: '-5 semitones - Lower' },
  { value: 0, label: 'Default', description: '0 - Normal pitch' },
  { value: 5, label: 'Slightly High', description: '+5 semitones - Higher' },
  { value: 10, label: 'High', description: '+10 semitones - High' },
  { value: 20, label: 'Very High', description: '+20 semitones - Highest' },
];

// Audio encoding formats
export const GEMINI_AUDIO_ENCODINGS = [
  { value: 'MP3', label: 'MP3', description: 'Compressed, universal format' },
  { value: 'LINEAR16', label: 'LINEAR16', description: 'Uncompressed WAV quality' },
  { value: 'OGG_OPUS', label: 'OGG_OPUS', description: 'High quality compression' },
  { value: 'PCM', label: 'PCM', description: 'Raw audio data' },
];

// Sample rates
export const GEMINI_SAMPLE_RATES = [
  { value: 24000, label: '24kHz', description: 'Standard quality' },
  { value: 48000, label: '48kHz', description: 'High quality' },
];

// Language locales supported
export const GEMINI_LOCALES = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'ar-XA', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv-SE', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська' },
];

// Default configuration
export const GEMINI_DEFAULT_CONFIG = {
  model: 'google-cloud-tts',
  voice: 'en-US-Studio-O',
  locale: 'en-US',
  sceneStyle: 'casual',
  speakingRate: 1.0,
  pitch: 0,
  audioEncoding: 'MP3',
  sampleRate: 24000,
};
