export const SEEDANCE_EMOTIONS = [
  { id: 'neutral', name: 'Нейтральная', prompt: 'neutral expression, relaxed facial muscles.' },
  { id: 'joyful', name: 'Радостная', prompt: 'joyful mood with wide bright smile, energetic eye movement, raised eyebrows.' },
  { id: 'serious', name: 'Серьезная', prompt: 'serious mood, slightly furrowed brows, intense focused gaze, slow blinking.' },
  { id: 'empathetic', name: 'Эмпатичная', prompt: 'empathetic facial expression, soft kind eyes, subtle nodding.' },
  { id: 'sarcastic', name: 'Саркастичная', prompt: 'sarcastic smirk, one eyebrow raised, slight eye roll.' },
];

export const SEEDANCE_CAMERA_EFFECTS = [
  { id: 'static', name: 'Статичный', prompt: '[0s] Static framing, steady tripod shot, no camera movement.' },
  { id: 'dramatic_push', name: 'Резкий наезд', prompt: '[0s] Wide shot. [1s] Dramatic dolly-in zoom. [3s] Close-up face. [5s] Final hold.' },
  { id: 'side_sweep', name: 'Сдвиг вбок', prompt: '[0s-5s] Smooth horizontal camera sweep from left to right, cinematic parallax, dynamic movement.' },
  { id: 'vlog_handheld', name: 'Влог / Тряска', prompt: '[0s-5s] Handheld documentary style, subtle camera shake, natural head tilts and nods, realistic handheld feel.' },
  { id: 'orbital_360', name: 'Орбита 360', prompt: '[0s-5s] Continuous 360-degree orbital rotation around subject, smooth arc camera movement, multiple angle perspectives, cinematic orbit.' },
  { id: 'floating', name: 'Невесомость', prompt: '[0s-5s] Gentle floating vertical movement, weightless bounce, ethereal swaying, dreamlike vertical drift.' },
];

export const SEEDANCE_LIGHTING = [
  { id: 'studio', name: 'Студия', prompt: 'Professional high-end studio lighting, soft key light, clear visibility, clean background.' },
  { id: 'neon', name: 'Неон', prompt: 'Vibrant neon cinematic lighting, cyan and magenta highlights, cyberpunk atmosphere, glowing accents.' },
  { id: 'dramatic', name: 'Нуар', prompt: 'Hard dramatic lighting, deep chiaroscuro shadows, high contrast, moody atmosphere.' },
  { id: 'golden_hour', name: 'Закат', prompt: 'Warm golden hour lighting, soft orange glow, sunset atmosphere, long soft shadows.' },
  { id: 'natural', name: 'Дневной', prompt: 'Soft natural daylight from a window, realistic environment lighting, balanced highlights.' },
];
