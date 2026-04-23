import { buildPrompt, PromptParams } from './prompt-builder';

const KIE_API_KEY = process.env.KIE_API_KEY || '';
const KIE_BASE_URL = 'https://api.kie.ai/api/v1/jobs'; // task creation endpoint
const KIE_MARKET_URL = 'https://api.kie.ai/api/v1/jobs'; // Correct base path for job status

export interface CreateTaskPayload {
  modelId?: string; // New field for model selection
  imageRefUrl: string;
  audioRefUrl?: string;
  spokenText?: string;
  gender?: 'Male' | 'Female';
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  webSearch?: boolean;
  nsfwChecker?: boolean;
  promptParams: PromptParams;
}

export async function createKieTask(payload: CreateTaskPayload) {
  const modelId = payload.modelId || "bytedance/seedance-2-fast";
  
  if (payload.spokenText) {
    payload.promptParams.spokenText = payload.spokenText;
  }
  if (payload.gender) {
    payload.promptParams.gender = payload.gender;
  }
  const prompt = buildPrompt(payload.promptParams);
  
  // Logic varies by model
  let body: any = {
    model: modelId,
    input: {}
  };

  if (modelId === "bytedance/seedance-2-fast") {
    const hasReferenceAudio = Boolean(payload.audioRefUrl);
    const shouldGenerateAudio = hasReferenceAudio || Boolean(payload.spokenText);

    // Seedance 2 Fast docs: first/last-frame mode and multimodal-reference mode are mutually exclusive.
    // When external audio is provided, switch to multimodal reference mode.
    body.input = {
      prompt: prompt,
      generate_audio: shouldGenerateAudio,
      duration: payload.duration || 5,
      resolution: payload.resolution || "720p",
      aspect_ratio: payload.aspectRatio || "16:9",
      web_search: payload.webSearch || false,
      nsfw_checker: payload.nsfwChecker || false
    };

    if (hasReferenceAudio) {
      body.input.reference_image_urls = [payload.imageRefUrl];
      body.input.reference_audio_urls = [payload.audioRefUrl];
    } else {
      body.input.first_frame_url = payload.imageRefUrl;
    }
  } else if (modelId.includes('kling/ai-avatar')) {
    // Kling Avatar Models (Standard & Pro)
    body.input = {
      image_url: payload.imageRefUrl,
      audio_url: payload.audioRefUrl, // Must be provided
      prompt: prompt
    };
  }

  const response = await fetch(`${KIE_BASE_URL}/createTask`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create KIE task: ${await response.text()}`);
  }
  
  const data = await response.json();
  return data.data; // Expected { taskId: string }
}

export async function getKieTaskStatus(taskId: string) {
  // Use appropriate endpoint
  const response = await fetch(`${KIE_MARKET_URL}/recordInfo?taskId=${taskId}`, {
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`
    }
  });
  
  if (!response.ok) {
     throw new Error(`Failed to fetch KIE status: ${await response.text()}`);
  }
  
  return response.json();
}
export async function getKieCredits() {
  const response = await fetch('https://api.kie.ai/api/v1/chat/credit', {
    headers: {
      'Authorization': `Bearer ${KIE_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch KIE credits: ${await response.text()}`);
  }

  return response.json();
}
