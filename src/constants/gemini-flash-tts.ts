/**
 * Gemini 3.1 Flash TTS configuration based on the official Google voice list.
 * Source: https://ai.google.dev/gemini-api/docs/speech-generation
 */

export interface GeminiFlashVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  description: string;
}

export interface GeminiFlashAudioTag {
  tag: string;
  description: string;
}

export const GEMINI_FLASH_VOICES: GeminiFlashVoice[] = [
  { id: 'Achernar', name: 'Achernar', gender: 'Female', description: 'Soft' },
  { id: 'Achird', name: 'Achird', gender: 'Male', description: 'Friendly' },
  { id: 'Algenib', name: 'Algenib', gender: 'Male', description: 'Gravelly' },
  { id: 'Algieba', name: 'Algieba', gender: 'Male', description: 'Smooth' },
  { id: 'Alnilam', name: 'Alnilam', gender: 'Male', description: 'Firm' },
  { id: 'Aoede', name: 'Aoede', gender: 'Female', description: 'Breezy' },
  { id: 'Autonoe', name: 'Autonoe', gender: 'Female', description: 'Bright' },
  { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'Female', description: 'Easy-going' },
  { id: 'Charon', name: 'Charon', gender: 'Male', description: 'Informative' },
  { id: 'Despina', name: 'Despina', gender: 'Female', description: 'Smooth' },
  { id: 'Enceladus', name: 'Enceladus', gender: 'Male', description: 'Breathy' },
  { id: 'Erinome', name: 'Erinome', gender: 'Female', description: 'Clear' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'Male', description: 'Excitable' },
  { id: 'Gacrux', name: 'Gacrux', gender: 'Female', description: 'Mature' },
  { id: 'Iapetus', name: 'Iapetus', gender: 'Male', description: 'Clear' },
  { id: 'Kore', name: 'Kore', gender: 'Female', description: 'Firm' },
  { id: 'Laomedeia', name: 'Laomedeia', gender: 'Female', description: 'Upbeat' },
  { id: 'Leda', name: 'Leda', gender: 'Female', description: 'Youthful' },
  { id: 'Orus', name: 'Orus', gender: 'Male', description: 'Firm' },
  { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'Female', description: 'Forward' },
  { id: 'Puck', name: 'Puck', gender: 'Male', description: 'Upbeat' },
  { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'Male', description: 'Informative' },
  { id: 'Sadachbia', name: 'Sadachbia', gender: 'Male', description: 'Lively' },
  { id: 'Sadaltager', name: 'Sadaltager', gender: 'Male', description: 'Knowledgeable' },
  { id: 'Schedar', name: 'Schedar', gender: 'Male', description: 'Even' },
  { id: 'Sulafat', name: 'Sulafat', gender: 'Female', description: 'Warm' },
  { id: 'Umbriel', name: 'Umbriel', gender: 'Male', description: 'Easy-going' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'Female', description: 'Gentle' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'Female', description: 'Bright' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'Male', description: 'Casual' },
];

export const GEMINI_FLASH_AUDIO_TAGS: GeminiFlashAudioTag[] = [
  { tag: '[laughs]', description: 'Laughter' },
  { tag: '[sigh]', description: 'Sigh' },
  { tag: '[whisper]', description: 'Whisper' },
  { tag: '[short pause]', description: 'Short pause' },
  { tag: '[excitedly]', description: 'Excited delivery' },
  { tag: '[softly]', description: 'Soft delivery' },
  { tag: '[seriously]', description: 'Serious delivery' },
  { tag: '[calmly]', description: 'Calm delivery' },
];

export const GEMINI_FLASH_LANGUAGES = [
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'Arabic' },
  { code: 'bn-BD', name: 'Bangla (Bangladesh)', nativeName: 'Bangla' },
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Espanol' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Francais' },
  { code: 'hi-IN', name: 'Hindi (India)', nativeName: 'Hindi' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)', nativeName: 'Indonesian' },
  { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano' },
  { code: 'ja-JP', name: 'Japanese (Japan)', nativeName: 'Japanese' },
  { code: 'ko-KR', name: 'Korean (Korea)', nativeName: 'Korean' },
  { code: 'mr-IN', name: 'Marathi (India)', nativeName: 'Marathi' },
  { code: 'pl-PL', name: 'Polish (Poland)', nativeName: 'Polski' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Portugues' },
  { code: 'ro-RO', name: 'Romanian (Romania)', nativeName: 'Romanian' },
  { code: 'ru-RU', name: 'Russian (Russia)', nativeName: 'Russian' },
  { code: 'ta-IN', name: 'Tamil (India)', nativeName: 'Tamil' },
  { code: 'te-IN', name: 'Telugu (India)', nativeName: 'Telugu' },
  { code: 'th-TH', name: 'Thai (Thailand)', nativeName: 'Thai' },
  { code: 'tr-TR', name: 'Turkish (Turkey)', nativeName: 'Turkce' },
  { code: 'uk-UA', name: 'Ukrainian (Ukraine)', nativeName: 'Ukrainian' },
  { code: 'vi-VN', name: 'Vietnamese (Vietnam)', nativeName: 'Vietnamese' },
];

export const GEMINI_FLASH_DEFAULT_CONFIG = {
  voiceName: 'Kore',
  languageCode: 'ru-RU',
};

export const GEMINI_FLASH_PREVIEW_TEXTS: Record<string, string> = {
  'ar-EG': 'مرحبا، أنا صوت {voiceName}',
  'bn-BD': 'হ্যালো, আমি {voiceName} কণ্ঠ',
  'de-DE': 'Hallo, ich bin Stimme {voiceName}',
  'en-IN': 'Hello, I am voice {voiceName}',
  'en-US': 'Hello, I am voice {voiceName}',
  'es-ES': 'Hola, soy la voz {voiceName}',
  'fr-FR': 'Bonjour, je suis la voix {voiceName}',
  'hi-IN': 'नमस्ते, मैं {voiceName} की आवाज़ हूँ',
  'id-ID': 'Halo, saya suara {voiceName}',
  'it-IT': 'Ciao, sono la voce {voiceName}',
  'ja-JP': 'こんにちは、{voiceName}の声です',
  'ko-KR': '안녕하세요, {voiceName} 목소리입니다',
  'mr-IN': 'नमस्कार, मी {voiceName} आवाज आहे',
  'pl-PL': 'Cześć, jestem głosem {voiceName}',
  'pt-BR': 'Olá, eu sou a voz {voiceName}',
  'ro-RO': 'Bună, eu sunt vocea {voiceName}',
  'ru-RU': 'Привет, я голос {voiceName}',
  'ta-IN': 'வணக்கம், நான் {voiceName} குரல்',
  'te-IN': 'హలో, నేను {voiceName} కంఠం',
  'th-TH': 'สวัสดี, ฉันคือเสียง {voiceName}',
  'tr-TR': 'Merhaba, ben {voiceName} sesiyim',
  'uk-UA': 'Привіт, я голос {voiceName}',
  'vi-VN': 'Xin chào, tôi là giọng {voiceName}',
};

export function getPreviewText(languageCode: string, voiceName: string): string {
  const template = GEMINI_FLASH_PREVIEW_TEXTS[languageCode] || GEMINI_FLASH_PREVIEW_TEXTS['en-US'];
  return template.replace('{voiceName}', voiceName);
}
