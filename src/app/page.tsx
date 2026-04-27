"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileAudio, Play, Loader2, Download, Video, Settings2, ChevronDown, Monitor, Maximize, Clock, Search, ShieldCheck, Bug, Timer, User, UserCheck, Wallet, Coins, Activity, RefreshCw, Sparkles, Volume2, Wand2, History, Trash2, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFileToSupabase } from "@/lib/supabase";
import { AI_MODELS, CAMERA_EFFECTS } from "@/constants/models";
import { SEEDANCE_CAMERA_EFFECTS, SEEDANCE_EMOTIONS, SEEDANCE_LIGHTING } from "@/constants/presets";
import { GEMINI_FLASH_DEFAULT_CONFIG } from "@/constants/gemini-flash-tts";
import { Smile, Frown, VenetianMask, Zap, Sun, Moon, Palette, CloudSun } from "lucide-react";
import { historyService, HistoryItem } from "@/lib/history-service";
import HeyGenTab from "@/components/heygen-tab";
import GptImageTab from "@/components/gpt-image-tab";
import GeminiFlashTTSSettings from "@/components/GeminiFlashTTSSettings";
import TTSPreview from "@/components/TTSPreview";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<'video' | 'images'>('video');
  const [videoSubTab, setVideoSubTab] = useState<'seedance' | 'kling' | 'heygen'>('seedance');
  const [imageSubTab, setImageSubTab] = useState<'text-to-image' | 'image-to-image'>('text-to-image');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [audioMode, setAudioMode] = useState<"text" | "file">("text");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [ttsText, setTtsText] = useState("");
  const [ttsProvider, setTtsProvider] = useState<"openai" | "elevenlabs" | "gemini-flash" | "internal">("internal");

  // Gemini Flash TTS Settings
  const [geminiFlashVoiceName, setGeminiFlashVoiceName] = useState(GEMINI_FLASH_DEFAULT_CONFIG.voiceName);
  const [geminiFlashLanguageCode, setGeminiFlashLanguageCode] = useState(GEMINI_FLASH_DEFAULT_CONFIG.languageCode);
  const [showGeminiFlashSettings, setShowGeminiFlashSettings] = useState(false);

  // TTS Preview State
  const [ttsPreviewUrl, setTtsPreviewUrl] = useState<string | null>(null);
  const [attachedAudioUrl, setAttachedAudioUrl] = useState<string | null>(null);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [ttsPreviewError, setTtsPreviewError] = useState<string | null>(null);

  // OpenAI TTS Settings
  const [openaiVoiceId, setOpenaiVoiceId] = useState("alloy");

  // ElevenLabs TTS Settings
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState("Rachel");

  const [emotion, setEmotion] = useState("neutral");
  const [dynamism, setDynamism] = useState(2);
  const [camera, setCamera] = useState("static");
  const [lightingId, setLightingId] = useState("studio");
  const [voiceGender, setVoiceGender] = useState<"Male" | "Female">("Female");

  // Advanced settings
  const [modelId, setModelId] = useState<string>(AI_MODELS[0].id);
  const [cameraEffectId, setCameraEffectId] = useState<string>(CAMERA_EFFECTS[0].id);
  const [resolution, setResolution] = useState<string>("480p");
  const [aspectRatio, setAspectRatio] = useState<string>("9:16");
  const [duration, setDuration] = useState(5);
  const [webSearch, setWebSearch] = useState(false);
  const [nsfwChecker, setNsfwChecker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedModel = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];

  // Auto-select first model when switching video sub-tabs
  useEffect(() => {
    if (videoSubTab === 'seedance') {
      const seedanceModel = AI_MODELS.find(m => m.provider === 'bytedance');
      if (seedanceModel) setModelId(seedanceModel.id);
    } else if (videoSubTab === 'kling') {
      const klingModel = AI_MODELS.find(m => m.provider === 'kling');
      if (klingModel) setModelId(klingModel.id);
    }
  }, [videoSubTab]);

  // Reset resolutions and aspect ratios when switching models
  useEffect(() => {
    // Set default resolution to 480p for Seedance, else first available
    if (selectedModel.id === 'bytedance/seedance-2-fast') {
      setResolution("480p");
    } else if (selectedModel.supportedResolutions.length > 0) {
      if (!selectedModel.supportedResolutions.includes(resolution)) {
        setResolution(selectedModel.supportedResolutions[0]);
      }
    }

    // Set default aspect ratio to 9:16 for Seedance
    if (selectedModel.id === 'bytedance/seedance-2-fast') {
      setAspectRatio("9:16");
    } else if (selectedModel.supportedAspectRatios.length > 0) {
      if (!selectedModel.supportedAspectRatios.includes(aspectRatio)) {
        setAspectRatio(selectedModel.supportedAspectRatios[0]);
      }
    }
    // Reset advanced settings if not supported
    if (!selectedModel.hasAdvancedSeedanceSettings) {
      setEmotion("neutral");
      setDynamism(2);
      setLightingId("studio");
      setCamera("static");
    }
  }, [modelId, selectedModel]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [stepText, setStepText] = useState("");
  const [videoResult, setVideoResult] = useState<string | null>(null);
  
  const [lastPayload, setLastPayload] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const [generationDuration, setGenerationDuration] = useState<number | null>(null);
  const [actualCost, setActualCost] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceBefore, setBalanceBefore] = useState<number | null>(null);
  const [heygenBalance, setHeygenBalance] = useState<string | null>(null);
  const [gptImageCredits, setGptImageCredits] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(historyService.getHistory());
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/credits");
      const result = await res.json();
      if (result.success) {
        setBalance(result.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch balance", err);
    }
  };

  const fetchHeygenBalance = async () => {
    try {
      const res = await fetch("/api/heygen/balance");
      const data = await res.json();
      if (data.success) {
        const b = data.data;
        if (b.wallet?.remaining_balance !== undefined) {
          setHeygenBalance(`$${b.wallet.remaining_balance.toFixed(2)}`);
        } else if (b.subscription?.remaining !== undefined) {
          setHeygenBalance(`${b.subscription.remaining} кредитов`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch HeyGen balance", err);
    }
  };

  const fetchGptImageCredits = async () => {
    try {
      const res = await fetch("/api/gpt-image/credits");
      const result = await res.json();
      if (result.success && typeof result.data === 'number') {
        setGptImageCredits(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch GPT Image credits", err);
    }
  };

  // TTS Preview Functions
  const handleGenerateTTSPreview = async () => {
    if (!ttsText.trim()) {
      setTtsPreviewError("Введите текст для генерации аудио");
      return;
    }

    setIsGeneratingTTS(true);
    setTtsPreviewError(null);
    setTtsPreviewUrl(null);

    try {
      const ttsBody: any = { provider: ttsProvider, text: ttsText };

      if (ttsProvider === "gemini-flash") {
        ttsBody.geminiOptions = {
          voiceName: geminiFlashVoiceName,
          languageCode: geminiFlashLanguageCode,
        };
      } else if (ttsProvider === "openai") {
        ttsBody.voiceId = openaiVoiceId;
      } else if (ttsProvider === "elevenlabs") {
        ttsBody.voiceId = elevenlabsVoiceId;
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsBody),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Ошибка генерации аудио");
      }

      setTtsPreviewUrl(data.audioUrl);
    } catch (error: any) {
      setTtsPreviewError(error.message);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handleAddTTSPreview = () => {
    if (ttsPreviewUrl) {
      setAttachedAudioUrl(ttsPreviewUrl);
      setAudioMode("file");
      setAudioFile(null); // Clear any uploaded file
    }
  };

  const handleDownloadTTSPreview = () => {
    if (ttsPreviewUrl) {
      const a = document.createElement("a");
      a.href = ttsPreviewUrl;
      const extension = ttsPreviewUrl.toLowerCase().includes(".wav") ? "wav" : "mp3";
      a.download = `tts_preview_${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleCancelTTSPreview = () => {
    setTtsPreviewUrl(null);
    setTtsPreviewError(null);
    setIsGeneratingTTS(false);
  };

  useEffect(() => {
    fetchBalance();
    fetchHeygenBalance();
    fetchGptImageCredits();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    setStepText("Рендеринг видео...");
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?taskId=${taskId}`);
        const result = await res.json();
        
        if (result.success && result.data?.data) {
          const taskData = result.data.data;
          const state = taskData.state;

          if (state === 'success') {
            clearInterval(interval);
            if (timerRef.current) clearInterval(timerRef.current);
            const finalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
            setGenerationDuration(finalDuration);
            fetchBalance(); // Refresh balance after success

            // Calculate actual cost from balance difference
            setTimeout(async () => {
              const res = await fetch("/api/credits");
              const result = await res.json();
              const newBalance = result.success ? result.data.data : null;
              
              if (balanceBefore !== null && newBalance !== null) {
                const diff = balanceBefore - newBalance;
                if (diff > 0) {
                  setActualCost(diff);
                  // Update history with actual cost
                  historyService.updateItem(taskId, {
                    status: 'success',
                    resultVideoUrl: finalUrl,
                    cost: diff
                  });
                  setHistory(historyService.getHistory());
                }
              }
            }, 1500);

            let finalUrl = taskData.video_url || taskData.result_url;
            
            if (!finalUrl && taskData.resultJson) {
              try {
                const parsedResult = JSON.parse(taskData.resultJson);
                finalUrl = parsedResult.resultUrls?.[0] || parsedResult.video_url;
              } catch (e) {
                console.error("Ошибка парсинга resultJson", e);
              }
            }

            if (finalUrl) {
              setVideoResult(finalUrl);
              setIsGenerating(false);
              
              // Try to find actual credits consumed
              const consumed = taskData.credits_consumed || taskData.amount || taskData.total_credits || taskData.usage?.credits;
              if (consumed) {
                setActualCost(Number(consumed));
              }

              // Update history
              historyService.updateItem(taskId, {
                status: 'success',
                resultVideoUrl: finalUrl,
                cost: consumed ? Number(consumed) : null
              });
              setHistory(historyService.getHistory());
            }
          } else if (state === 'fail') {
            clearInterval(interval);
            if (timerRef.current) clearInterval(timerRef.current);
            setIsGenerating(false);
            fetchBalance(); // Refresh balance on fail too
            const errorMsg = taskData.failMsg || result.data.msg || "Ошибка генерации на сервере.";
            
            // Update history on failure
            historyService.updateItem(taskId, { status: 'fail' });
            setHistory(historyService.getHistory());

            alert(`Ошибка: ${errorMsg}`);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000);
  };

  const getEstimatedCost = () => {
    const price = selectedModel.pricing?.[resolution] || selectedModel.creditPricePerSec || 0;
    return Math.round(duration * price * 10) / 10;
  };

  const handleGenerate = async () => {
    if (!imageFile) return alert("Пожалуйста, загрузите изображение аватара.");
    if (audioMode === "file" && !audioFile && !attachedAudioUrl && !ttsPreviewUrl) return alert("Пожалуйста, загрузите аудиофайл или сгенерируйте превью.");
    if (audioMode === "text" && !ttsText.trim()) return alert("Пожалуйста, введите текст для озвучки.");

    try {
      // Save balance before generation
      setBalanceBefore(balance);

      setIsGenerating(true);
      setStepText("Загрузка ресурсов...");
      setGenerationDuration(null);
      setActualCost(null);
      setTimer(0);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimer(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      const imageUrl = await uploadFileToSupabase('media', `avatar_${Date.now()}.png`, imageFile);
      let finalAudioUrl = "";

      // Priority: 1. audioFile upload, 2. ttsPreviewUrl, 3. generate new TTS
      if (audioMode === "file" && audioFile) {
        const originalExt = audioFile.name.split('.').pop()?.toLowerCase();
        const safeExt = originalExt && originalExt.length <= 5 ? originalExt : 'mp3';
        finalAudioUrl = await uploadFileToSupabase('media', `audio_${Date.now()}.${safeExt}`, audioFile);
      } else if (audioMode === "file" && attachedAudioUrl) {
        finalAudioUrl = attachedAudioUrl;
      } else if (ttsPreviewUrl) {
        // Use pre-generated TTS preview
        finalAudioUrl = ttsPreviewUrl;
      } else if (audioMode === "text" && ttsProvider !== "internal") {
        setStepText("Синтез голоса...");
        const ttsBody: any = { provider: ttsProvider, text: ttsText };

        // Add provider-specific options
        if (ttsProvider === "gemini-flash") {
          ttsBody.geminiOptions = {
            voiceName: geminiFlashVoiceName,
            languageCode: geminiFlashLanguageCode,
          };
        } else if (ttsProvider === "openai") {
          // OpenAI uses voice names like alloy, echo, nova, etc.
          ttsBody.voiceId = openaiVoiceId;
        } else if (ttsProvider === "elevenlabs") {
          // ElevenLabs uses specific voice IDs
          ttsBody.voiceId = elevenlabsVoiceId;
        }

        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ttsBody)
        });
        const ttsData = await ttsRes.json();
        if (!ttsData.success) throw new Error(ttsData.error);
        finalAudioUrl = ttsData.audioUrl;
      }

      setAttachedAudioUrl(null);
      setTtsPreviewUrl(null);

      setStepText("Запуск двигателя...");
      
      const payloadBody = {
        modelId,
        imageRefUrl: imageUrl,
        audioUrl: finalAudioUrl || undefined,
        spokenText: (audioMode === "text" && ttsProvider === "internal") ? ttsText : undefined,
        ttsProvider: (audioMode === "text" && ttsProvider !== "internal") ? ttsProvider : undefined,
        voiceId: ttsProvider === "openai"
          ? openaiVoiceId
          : ttsProvider === "elevenlabs"
            ? elevenlabsVoiceId
            : undefined,
        geminiOptions: ttsProvider === "gemini-flash"
            ? {
                voiceName: geminiFlashVoiceName,
                languageCode: geminiFlashLanguageCode,
              }
            : undefined,
        emotion,
        dynamism,
        cameraStyle: camera,
        lightingId,
        cameraEffectPrompt: selectedModel.hasCameraEffects ? CAMERA_EFFECTS.find(e => e.id === cameraEffectId)?.prompt : undefined,
        gender: voiceGender,
        resolution,
        aspectRatio,
        duration,
        webSearch,
        nsfwChecker
      };
      setLastPayload(payloadBody);

      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody)
      });

      const generateData = await generateRes.json();
      if (!generateData.success) throw new Error(generateData.error);

      pollTaskStatus(generateData.taskId);

      // Add to local history
      const taskId = generateData.taskId || `temp_${Date.now()}`;
      historyService.addItem({
        id: taskId,
        timestamp: Date.now(),
        modelId,
        modelName: selectedModel.name,
        status: 'pending',
        cost: null,
        inputImageUrl: imageUrl,
        params: {
          emotion,
          camera,
          resolution,
          aspectRatio,
          duration,
          lighting: lightingId
        }
      });
      setHistory(historyService.getHistory());

    } catch (error: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      console.error(error);
      alert("Ошибка: " + error.message);
      setIsGenerating(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 selection:bg-primary/20">
      
      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">История генераций</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { if(confirm("Очистить историю?")) { historyService.clearHistory(); setHistory([]); } }}
                    className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                    title="Очистить всё"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-white/20">
                    <History className="w-12 h-12 mb-4 opacity-10" />
                    <p>История пуста</p>
                  </div>
                ) : (
                  history.map((item, index) => (
                    <div key={item.id || `hist_${item.timestamp}_${index}`} className="bg-white/5 border border-white/5 rounded-xl p-3 flex gap-4 hover:border-white/10 transition-colors">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-black/40 border border-white/5 relative">
                        {item.inputImageUrl && <img src={item.inputImageUrl} className="w-full h-full object-cover opacity-60" />}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {item.status === 'pending' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                          {item.status === 'success' && item.resultVideoUrl && (
                            <a href={item.resultVideoUrl} target="_blank" className="p-1.5 bg-primary rounded-full shadow-lg hover:scale-110 transition-transform">
                              <Play className="w-3 h-3 fill-primary-foreground text-primary-foreground" />
                            </a>
                          )}
                          {item.status === 'fail' && <X className="w-5 h-5 text-red-500" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-white/90 truncate">{item.modelName}</h4>
                            <div className="flex items-center gap-3 text-[10px] text-white/40 mt-1">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleTimeString()}</span>
                              <span className="flex items-center gap-1 uppercase tracking-wider">{item.params.aspectRatio} • {item.params.resolution}</span>
                            </div>
                          </div>
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                            item.status === 'success' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            item.status === 'fail' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                          )}>
                            {item.status === 'pending' ? 'В обработке' : item.status === 'success' ? 'Готово' : 'Ошибка'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            {item.cost && (
<div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/10">
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span className="text-[10px] font-mono font-bold text-amber-200">-{item.cost}</span>
                              </div>
                            )}
                            <span className="text-[10px] text-white/30 font-mono opacity-50">{item.id}</span>
                          </div>
                          {item.resultVideoUrl && (
                            <a 
                              href={item.resultVideoUrl} 
                              download 
                              className="text-[10px] text-primary hover:underline flex items-center gap-1"
                              target="_blank"
                            >
                              Открыть <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Header with Balance */}
      <header className="mb-14 flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Atom Studio Avatar</h1>
          </div>
          <p className="text-white/40 text-sm max-w-sm">
            Оживите любой портрет с помощью глубокой экспрессивной анимации
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-950/50 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-xl group hover:border-primary/30 transition-all">
           <div className="flex flex-col items-end">
               <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-1">
                 {activeCategory === 'images'
                   ? 'GPT Image Credits'
                   : videoSubTab === 'heygen'
                     ? 'HeyGen Balance'
                     : 'Кошелек'}
               </span>
               <div className="flex items-center gap-2">
                 {activeCategory === 'images' ? (
                   <>
                     <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                     <span className="font-mono font-bold text-xl text-amber-50">
                       {gptImageCredits !== null ? gptImageCredits.toLocaleString() : "..."}
                     </span>
                     <span className="text-xs text-white/30 ml-1">кр</span>
                   </>
                 ) : videoSubTab === 'heygen' ? (
                   <>
                     <Wallet className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                     <span className="font-mono font-bold text-xl text-green-50">
                       {heygenBalance !== null ? heygenBalance : "..."}
                     </span>
                   </>
                 ) : (
                   <>
                     <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                     <span className="font-mono font-bold text-xl text-amber-50">
                       {balance !== null ? balance.toLocaleString() : "..."}
                     </span>
                     <span className="text-xs text-white/30 ml-1">кр</span>
                   </>
                 )}
               </div>
            </div>
           <div className="w-px h-10 bg-white/10 mx-1" />
           <button 
             onClick={() => setShowHistory(true)} 
             className="p-2.5 hover:bg-white/5 rounded-xl transition-all active:scale-95 text-white/40 hover:text-primary relative"
             title="История генераций"
           >
             <History className="w-5 h-5" />
             {history.some(h => h.status === 'pending') && (
               <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse border-2 border-zinc-950" />
             )}
           </button>
        </div>
      </header>

      {/* Category Tab Bar */}
      <div className="flex gap-1 mb-2 bg-zinc-950/50 border border-white/10 rounded-xl p-1 max-w-md" data-testid="category-tab-bar">
        <button
          onClick={() => setActiveCategory('video')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeCategory === 'video'
              ? 'bg-purple-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          data-category="video"
        >
          Видео
        </button>
        <button
          onClick={() => setActiveCategory('images')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeCategory === 'images'
              ? 'bg-purple-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          data-category="images"
        >
          Картинки
        </button>
      </div>

      {/* Sub Tab Bar */}
      {activeCategory === 'video' && (
        <div className="flex gap-1 mb-6 bg-zinc-950/50 border border-white/10 rounded-xl p-1 max-w-md" data-testid="video-sub-tab-bar">
          <button
            onClick={() => setVideoSubTab('seedance')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              videoSubTab === 'seedance'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            data-subtab="seedance"
          >
            Seedance
          </button>
          <button
            onClick={() => setVideoSubTab('kling')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              videoSubTab === 'kling'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            data-subtab="kling"
          >
            Kling
          </button>
          <button
            onClick={() => setVideoSubTab('heygen')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              videoSubTab === 'heygen'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            data-subtab="heygen"
          >
            HeyGen
          </button>
        </div>
      )}

      {activeCategory === 'images' && (
        <div className="flex gap-1 mb-6 bg-zinc-950/50 border border-white/10 rounded-xl p-1 max-w-md" data-testid="images-sub-tab-bar">
          <button
            onClick={() => setImageSubTab('text-to-image')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              imageSubTab === 'text-to-image'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            data-subtab="text-to-image"
          >
            Text-to-Image
          </button>
          <button
            onClick={() => setImageSubTab('image-to-image')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              imageSubTab === 'image-to-image'
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            data-subtab="image-to-image"
          >
            Image-to-Image
          </button>
        </div>
      )}

      {/* Seedance/Kling Content — always mounted, hidden via CSS when inactive */}
      <div style={{ display: activeCategory === 'video' && (videoSubTab === 'seedance' || videoSubTab === 'kling') ? 'block' : 'none' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        
        {/* LEFT PANEL - CONTROLS */}
        <motion.section initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
          
          {/* Model Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Выберите Модель
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1 bg-white/5 rounded-xl border border-white/5">
              {AI_MODELS.filter((model) =>
                videoSubTab === 'seedance' ? model.provider === 'bytedance' : model.provider === 'kling'
              ).map((model) => (
                <button
                  key={model.id}
                  onClick={() => setModelId(model.id)}
                  className={cn(
                    "relative py-3 px-2 rounded-lg text-xs font-medium transition-all overflow-hidden flex flex-col items-center gap-1 min-h-[64px] justify-center text-center",
                    modelId === model.id ? "bg-white/10 text-white shadow-lg" : "text-white/70 hover:text-white/90"
                  )}
                >
                  {modelId === model.id && (
                    <motion.div layoutId="activeModel" className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                  )}
                  <span className="relative z-10 font-bold leading-tight">{model.name}</span>
                  <span className="text-[9px] opacity-60 font-normal uppercase tracking-wider">{model.provider === 'bytedance' ? 'ByteDance' : 'Kling AI'}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/30 px-1 leading-relaxed italic">
              {selectedModel.description}
            </p>
          </div>

          <div className="h-px bg-white/5 mx-2" />

          {/* Avatar Upload */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">1. Изображение аватара</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors w-full rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden bg-white/5"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-[400px] object-contain rounded-lg" />
              ) : (
                <div className="text-center flex flex-col items-center text-white/50">
                  <Upload className="w-8 h-8 mb-2 opacity-80" />
                  <span className="text-sm">Нажмите для загрузки портрета (JPG, PNG)</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            </div>
          </div>

          {/* Audio Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center justify-between">
              <span>2. Источник аудио</span>
              {selectedModel.type === 'integrated' ? (
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button onClick={() => setAudioMode("text")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", audioMode === "text" ? "bg-primary text-white" : "text-white/60 hover:text-white")}>Текст в речь</button>
                  <button onClick={() => setAudioMode("file")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", audioMode === "file" ? "bg-primary text-white" : "text-white/60 hover:text-white")}>Аудиофайл</button>
                </div>
              ) : (
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button onClick={() => setAudioMode("text")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", audioMode === "text" ? "bg-primary text-white" : "text-white/60 hover:text-white")}>TTS</button>
                  <button onClick={() => setAudioMode("file")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", audioMode === "file" ? "bg-primary text-white" : "text-white/60 hover:text-white")}>Аудиофайл</button>
                </div>
              )}
            </h3>

{/* Audio Source Content */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {selectedModel.type === 'integrated' && audioMode === "text" ? (
                  <motion.div key="seedance-text" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <button onClick={() => setTtsProvider("openai")} className={cn("flex-1 py-1.5 text-[11px] rounded-lg border min-w-[60px]", ttsProvider === "openai" ? "bg-white/10 border-primary text-primary" : "border-white/10 text-white/60 hover:bg-white/5")}>OpenAI</button>
                      <button onClick={() => setTtsProvider("elevenlabs")} className={cn("flex-1 py-1.5 text-[11px] rounded-lg border min-w-[60px]", ttsProvider === "elevenlabs" ? "bg-white/10 border-primary text-primary" : "border-white/10 text-white/60 hover:bg-white/5")}>ElevenLabs</button>
                      <button onClick={() => { setTtsProvider("gemini-flash"); setShowGeminiFlashSettings(true); }} className={cn("flex-1 py-1.5 text-[11px] rounded-lg border min-w-[60px] flex items-center justify-center gap-1", ttsProvider === "gemini-flash" ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400 text-amber-300" : "border-white/10 text-white/60 hover:bg-white/5")}>
                        <Sparkles className="w-3 h-3" />
                        Flash
                      </button>
                      <button onClick={() => setTtsProvider("internal")} className={cn("flex-1 py-1.5 text-[11px] rounded-lg border min-w-[60px]", ttsProvider === "internal" ? "bg-white/10 border-primary text-primary" : "border-white/10 text-white/60 hover:bg-white/5")}>Встроенный</button>
                    </div>


                    {/* Gemini Flash TTS Settings */}
                    {ttsProvider === "gemini-flash" && (
                      <GeminiFlashTTSSettings
                        voiceName={geminiFlashVoiceName}
                        onVoiceNameChange={setGeminiFlashVoiceName}
                        languageCode={geminiFlashLanguageCode}
                        onLanguageCodeChange={setGeminiFlashLanguageCode}
                        showSettings={showGeminiFlashSettings}
                        onToggleSettings={setShowGeminiFlashSettings}
                      />
                    )}

                    {/* OpenAI Voice Selection */}
                    {ttsProvider === "openai" && (
                      <div className="space-y-2">
                        <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3" /> Голос
                        </label>
                        <select
                          value={openaiVoiceId}
                          onChange={(e) => setOpenaiVoiceId(e.target.value)}
                          className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white [&>option]:text-white [&>option]:bg-zinc-900"
                        >
                          <option value="alloy">Alloy — нейтральный, универсальный</option>
                          <option value="echo">Echo — тёплый, дружелюбный</option>
                          <option value="fable">Fable — британский, элегантный</option>
                          <option value="onyx">Onyx — глубокий, уверенный (мужской)</option>
                          <option value="nova">Nova — яркий, энергичный</option>
                          <option value="shimmer">Shimmer — мягкий, успокаивающий</option>
                        </select>
                      </div>
                    )}

                    {/* ElevenLabs Voice Selection */}
                    {ttsProvider === "elevenlabs" && (
                      <div className="space-y-2">
                        <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3" /> Голос
                        </label>
                        <select
                          value={elevenlabsVoiceId}
                          onChange={(e) => setElevenlabsVoiceId(e.target.value)}
                          className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white [&>option]:text-white [&>option]:bg-zinc-900"
                        >
                          <option value="Rachel">Rachel — мягкий, американский</option>
                          <option value="Domi">Domi — энергичный, уверенный</option>
                          <option value="Beatrice">Beatrice — британский, элегантный</option>
                          <option value="Clarence">Clarence — глубокий, мужской</option>
                          <option value="Thomas">Thomas — британский, мужской</option>
                          <option value="Lily">Lily — молодой, дружелюбный</option>
                          <option value="James">James — профессиональный, мужской</option>
                          <option value="Sarah">Sarah — тёплый, женский</option>
                          <option value="Antoni">Antoni — современный, мужской</option>
                          <option value="Elli">Elli — молодой, женский</option>
                          <option value="Fin">Fin — глубокий, мужской</option>
                          <option value="Aria">Aria — американский, женский</option>
                          <option value="Roger">Roger — уверенный, мужской</option>
                          <option value="Jenny">Jenny — универсальный, женский</option>
                          <option value="Matthew">Matthew — профессиональный, мужской</option>
                          <option value="Michael">Michael — спокойный, мужской</option>
                          <option value="Emiley">Emiley — молодая, женский</option>
                          <option value="Zoe">Zoe — британский, женский</option>
                          <option value="Jessica">Jessica — дружелюбный, женский</option>
                          <option value="Daniel">Daniel — классический, мужской</option>
                          <option value="Clyde">Clyde — южный акцент, мужской</option>
                        </select>
                      </div>
                    )}

                    <textarea 
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder={ttsProvider === "gemini-flash" ? "Введите текст... Используйте теги [laughs], [whispers], [sigh] для эмоций" : "Введите текст, который должен произнести аватар..."}
                      className="w-full glass-input rounded-xl p-4 min-h-[100px] resize-none text-sm placeholder:text-white/30"
                    />

                    {/* TTS Preview Controls */}
                    {ttsProvider !== "internal" && (
                      <div className="space-y-3">
                        <button
                          onClick={handleGenerateTTSPreview}
                          disabled={isGeneratingTTS || !ttsText.trim()}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 border border-primary/30 text-primary text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {isGeneratingTTS ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Генерация...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Прослушать аудио
                            </>
                          )}
                        </button>

                        <TTSPreview
                          audioUrl={ttsPreviewUrl}
                          isGenerating={isGeneratingTTS}
                          error={ttsPreviewError}
                          onAdd={handleAddTTSPreview}
                          onCancel={handleCancelTTSPreview}
                          onDownload={handleDownloadTTSPreview}
                        />
                      </div>
                    )}
                  </motion.div>
                ) : selectedModel.type === 'integrated' && audioMode === "file" ? (
                  <motion.div key="seedance-file" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div 
                      onClick={() => audioInputRef.current?.click()}
                      className="border border-white/10 hover:border-primary/50 transition-colors w-full h-24 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white/5 relative"
                    >
                      <input type="file" accept="audio/*" className="hidden" ref={audioInputRef} onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
                      <FileAudio className="w-6 h-6 mb-2 text-primary/60" />
                      <span className="text-[11px] text-white/70 max-w-[80%] truncate text-center font-medium">
                        {audioFile ? audioFile.name : "Загрузите свой аудиофайл (MP3/WAV)"}
                      </span>
                      {audioFile && <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Uploaded</div>}
                    </div>
                  </motion.div>
                ) : selectedModel.type !== 'integrated' && audioMode === "text" ? (
                  <motion.div key="kling-text" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                    <div className="flex gap-2 mb-2">
                      <button onClick={() => setTtsProvider("openai")} className={cn("flex-1 py-1.5 text-[11px] rounded-lg border", ttsProvider === "openai" ? "bg-white/10 border-primary text-primary" : "border-white/10 text-white/60 hover:bg-white/5")}>OpenAI</button>
                      <button onClick={() => setTtsProvider("elevenlabs")} className={cn("flex-1 py-1.5 text-[11px] rounded-lg border", ttsProvider === "elevenlabs" ? "bg-white/10 border-primary text-primary" : "border-white/10 text-white/60 hover:bg-white/5")}>ElevenLabs</button>
                      <button onClick={() => { setTtsProvider("gemini-flash"); setShowGeminiFlashSettings(true); }} className={cn("flex-1 py-1.5 text-[11px] rounded-lg border flex items-center justify-center gap-1", ttsProvider === "gemini-flash" ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400 text-amber-300" : "border-white/10 text-white/60 hover:bg-white/5")}>
                        <Sparkles className="w-3 h-3" />
                        Flash
                      </button>
                      <button onClick={() => setTtsProvider("internal")} className={cn("flex-1 py-1.5 text-[11px] rounded-lg border", ttsProvider === "internal" ? "bg-white/10 border-primary text-primary" : "border-white/10 text-white/60 hover:bg-white/5")}>Р’СЃС‚СЂРѕРµРЅРЅС‹Р№</button>
                    </div>

                    {/* Gemini Flash TTS Settings */}
                    {ttsProvider === "gemini-flash" && (
                      <GeminiFlashTTSSettings
                        voiceName={geminiFlashVoiceName}
                        onVoiceNameChange={setGeminiFlashVoiceName}
                        languageCode={geminiFlashLanguageCode}
                        onLanguageCodeChange={setGeminiFlashLanguageCode}
                        showSettings={showGeminiFlashSettings}
                        onToggleSettings={setShowGeminiFlashSettings}
                      />
                    )}

                    {/* OpenAI Voice Selection */}
                    {ttsProvider === "openai" && (
                      <div className="space-y-2">
                        <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3" /> Голос
                        </label>
                        <select
                          value={openaiVoiceId}
                          onChange={(e) => setOpenaiVoiceId(e.target.value)}
                          className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white [&>option]:text-white [&>option]:bg-zinc-900"
                        >
                          <option value="alloy">Alloy — нейтральный, универсальный</option>
                          <option value="echo">Echo — тёплый, дружелюбный</option>
                          <option value="fable">Fable — британский, элегантный</option>
                          <option value="onyx">Onyx — глубокий, уверенный (мужской)</option>
                          <option value="nova">Nova — яркий, энергичный</option>
                          <option value="shimmer">Shimmer — мягкий, успокаивающий</option>
                        </select>
                      </div>
                    )}

                    {/* ElevenLabs Voice Selection */}
                    {ttsProvider === "elevenlabs" && (
                      <div className="space-y-2">
                        <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3" /> Голос
                        </label>
                        <select
                          value={elevenlabsVoiceId}
                          onChange={(e) => setElevenlabsVoiceId(e.target.value)}
                          className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white [&>option]:text-white [&>option]:bg-zinc-900"
                        >
                          <option value="Rachel">Rachel — мягкий, американский</option>
                          <option value="Domi">Domi — энергичный, уверенный</option>
                          <option value="Beatrice">Beatrice — британский, элегантный</option>
                          <option value="Clarence">Clarence — глубокий, мужской</option>
                          <option value="Thomas">Thomas — британский, мужской</option>
                          <option value="Lily">Lily — молодой, дружелюбный</option>
                          <option value="James">James — профессиональный, мужской</option>
                          <option value="Sarah">Sarah — тёплый, женский</option>
                          <option value="Antoni">Antoni — современный, мужской</option>
                          <option value="Elli">Elli — молодой, женский</option>
                          <option value="Fin">Fin — глубокий, мужской</option>
                          <option value="Aria">Aria — американский, женский</option>
                          <option value="Roger">Roger — уверенный, мужской</option>
                          <option value="Jenny">Jenny — универсальный, женский</option>
                          <option value="Matthew">Matthew — профессиональный, мужской</option>
                          <option value="Michael">Michael — спокойный, мужской</option>
                          <option value="Emiley">Emiley — молодая, женский</option>
                          <option value="Zoe">Zoe — британский, женский</option>
                          <option value="Jessica">Jessica — дружелюбный, женский</option>
                          <option value="Daniel">Daniel — классический, мужской</option>
                          <option value="Clyde">Clyde — южный акцент, мужской</option>
                        </select>
                      </div>
                    )}

                    <textarea
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder={ttsProvider === "gemini-flash" ? "Введите текст... Используйте теги [laughs], [whispers], [sigh] для эмоций" : "Введите текст для генерации голоса через TTS..."}
                      className="w-full glass-input rounded-xl p-4 min-h-[100px] resize-none text-sm placeholder:text-white/30"
                    />

                    {/* TTS Preview Controls */}
                    <div className="space-y-3">
                      <button
                        onClick={handleGenerateTTSPreview}
                        disabled={isGeneratingTTS || !ttsText.trim()}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 border border-primary/30 text-primary text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isGeneratingTTS ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Генерация...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Прослушать аудио
                          </>
                        )}
                      </button>

                      <TTSPreview
                        audioUrl={ttsPreviewUrl}
                        isGenerating={isGeneratingTTS}
                        error={ttsPreviewError}
                        onAdd={handleAddTTSPreview}
                        onCancel={handleCancelTTSPreview}
                        onDownload={handleDownloadTTSPreview}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="kling-file" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div 
                      onClick={() => audioInputRef.current?.click()}
                      className="border border-white/10 hover:border-primary/50 transition-colors w-full h-24 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white/5 relative"
                    >
                      <input type="file" accept="audio/*" className="hidden" ref={audioInputRef} onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
                      <FileAudio className="w-6 h-6 mb-2 text-primary/60" />
                      <span className="text-[11px] text-white/70 max-w-[80%] truncate text-center font-medium">
                        {audioFile ? audioFile.name : "Загрузите свой аудиофайл (MP3/WAV)"}
                      </span>
                      {audioFile && <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Uploaded</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice Gender Toggle - hidden when Gemini Flash is selected */}
              {ttsProvider !== "gemini-flash" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setVoiceGender("Male")} 
                    className={cn("flex-1 py-2 rounded-lg border text-xs flex items-center justify-center gap-2 transition-all", 
                      voiceGender === "Male" ? "bg-primary/20 border-primary text-primary" : "border-white/5 text-white/70 hover:bg-white/10")}
                  >
                    Мужской
                  </button>
                  <button 
                    onClick={() => setVoiceGender("Female")} 
                    className={cn("flex-1 py-2 rounded-lg border text-xs flex items-center justify-center gap-2 transition-all", 
                      voiceGender === "Female" ? "bg-primary/20 border-primary text-primary" : "border-white/5 text-white/70 hover:bg-white/10")}
                  >
                    Женский
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Animation & Camera Effects */}
          {selectedModel.id === 'bytedance/seedance-2-fast' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center justify-between">
              <span>3. Настройки эффектов</span>
            </h3>
            
            <div className="space-y-5">
              {selectedModel.hasAdvancedSeedanceSettings ? (
                <div className="space-y-6">
                  {/* Emotions Grid */}
                  <div className="space-y-3">
                    <label className="text-xs text-white/60 block">Эмоциональное состояние аватара</label>
                    <div className="grid grid-cols-5 gap-2">
                      {SEEDANCE_EMOTIONS.map((emo) => (
                        <button
                          key={emo.id}
                          onClick={() => setEmotion(emo.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1.5",
                            emotion === emo.id 
                              ? "bg-primary/20 border-primary text-primary" 
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                          )}
                        >
                          {emo.id === 'neutral' && <Smile className="w-4 h-4" />}
                          {emo.id === 'joyful' && <Sparkles className="w-4 h-4" />}
                          {emo.id === 'serious' && <Frown className="w-4 h-4" />}
                          {emo.id === 'empathetic' && <VenetianMask className="w-4 h-4" />}
                          {emo.id === 'sarcastic' && <Wand2 className="w-4 h-4" />}
                          <span className="text-[9px] font-medium text-center leading-tight">{emo.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Camera Grid for Seedance */}
                  <div className="space-y-3">
                    <label className="text-xs text-white/60 block">Траектория движения камеры</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SEEDANCE_CAMERA_EFFECTS.map((cam) => (
                        <button
                          key={cam.id}
                          onClick={() => setCamera(cam.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1.5",
                            camera === cam.id 
                              ? "bg-primary/20 border-primary text-primary" 
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                          )}
                        >
                          {cam.id === 'static' && <Monitor className="w-4 h-4" />}
                          {cam.id === 'dramatic_push' && <Maximize className="w-4 h-4" />}
                          {cam.id === 'side_sweep' && <ChevronDown className="w-4 h-4 -rotate-90" />}
                          {cam.id === 'vlog_handheld' && <User className="w-4 h-4 opacity-70" />}
                          {cam.id === 'orbital_360' && <RefreshCw className="w-4 h-4" />}
                          {cam.id === 'floating' && <Activity className="w-4 h-4" />}
                          <span className="text-[9px] font-medium text-center leading-tight">{cam.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lighting Grid */}
                  <div className="space-y-3">
                    <label className="text-xs text-white/60 block">Световая атмосфера (Lighting)</label>
                    <div className="grid grid-cols-5 gap-2">
                      {SEEDANCE_LIGHTING.map((light) => (
                        <button
                          key={light.id}
                          onClick={() => setLightingId(light.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1.5",
                            lightingId === light.id 
                              ? "bg-primary/20 border-primary text-primary" 
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                          )}
                        >
                          {light.id === 'studio' && <Sun className="w-4 h-4" />}
                          {light.id === 'neon' && <Zap className="w-4 h-4" />}
                          {light.id === 'dramatic' && <Moon className="w-4 h-4" />}
                          {light.id === 'golden_hour' && <CloudSun className="w-4 h-4" />}
                          {light.id === 'natural' && <Palette className="w-4 h-4" />}
                          <span className="text-[9px] font-medium text-center leading-tight">{light.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/60 mb-1 flex justify-between">
                      <span>Интенсивность динамики</span>
                      <span className="text-primary">{dynamism}</span>
                    </label>
                    <input type="range" min="1" max="3" step="1" value={dynamism} onChange={e => setDynamism(Number(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" />
                    <div className="flex justify-between text-[10px] text-white/40 mt-1 px-1">
                      <span>Статично</span><span>Плавно</span><span>Энергично</span>
                    </div>
                  </div>
                </div>
              ) : selectedModel.hasCameraEffects ? (
                <div className="space-y-3">
                  <label className="text-xs text-white/60 block">Пресеты движения камеры</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {CAMERA_EFFECTS.map((effect) => (
                      <button
                        key={effect.id}
                        onClick={() => setCameraEffectId(effect.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1.5",
                          cameraEffectId === effect.id 
                            ? "bg-primary/20 border-primary text-primary" 
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        {effect.id === 'static' && <Monitor className="w-4 h-4" />}
                        {effect.id === 'zoom_in' && <Maximize className="w-4 h-4" />}
                        {effect.id === 'pan' && <ChevronDown className="w-4 h-4 -rotate-90" />}
                        {effect.id === 'handheld' && <User className="w-4 h-4 opacity-70" />}
                        {effect.id === 'orbit' && <RefreshCw className="w-4 h-4" />}
                        {effect.id === 'pulse' && <Activity className="w-4 h-4" />}
                        <span className="text-[9px] font-medium text-center leading-tight">{effect.name}</span>
                      </button>
                    ))}
                  </div>
</div>
              ) : null}
            </div>
          </div>
          )}

          {/* Advanced Settings Toggle - Only for Seedance */}
          {selectedModel.id === 'bytedance/seedance-2-fast' && (
            <div className="border-t border-white/5 pt-4">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                <span>Расширенные настройки</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 mt-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {selectedModel.supportedResolutions.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                            <Monitor className="w-3 h-3" /> Разрешение
                          </label>
                          <select value={resolution} onChange={e => setResolution(e.target.value as any)} className="w-full glass-input rounded-lg p-2 text-xs bg-zinc-900 text-white">
                            {selectedModel.supportedResolutions.map(res => (
                              <option key={res} value={res} className="bg-zinc-900 text-white">{res} {res === '480p' ? '(Быстро)' : '(Баланс)'}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-white/60 flex items-center gap-1.5">
                          <Maximize className="w-3 h-3" /> Формат
                        </label>
                        <div className="w-full glass-input rounded-lg p-2 text-[10px] text-white/70 italic">
                          {aspectRatio}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-white/40 flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Длительность</span>
                        <span>{duration} сек</span>
                      </label>
                      <input type="range" min="4" max="15" step="1" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>

                    <div className="flex gap-4 pt-2">
                      <label className="flex-1 flex items-center justify-between p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-[11px] text-white/70 flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Поиск в веб</span>
                        <input type="checkbox" checked={webSearch} onChange={e => setWebSearch(e.target.checked)} className="rounded bg-zinc-800 border-white/10 text-primary" />
                      </label>
                      <label className="flex-1 flex items-center justify-between p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-[11px] text-white/70 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> NSFW Фильтр</span>
                        <input type="checkbox" checked={nsfwChecker} onChange={e => setNsfwChecker(e.target.checked)} className="rounded bg-zinc-800 border-white/10 text-primary" />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            disabled={isGenerating}
            onClick={handleGenerate}
            className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] border border-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex flex-col items-center justify-center relative overflow-hidden group"
          >
            <div className="flex items-center gap-2 relative z-10">
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{stepText}</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Сгенерировать видео аватара</span>
                </>
              )}
            </div>
            
            {!isGenerating && (
              <div className="flex flex-col items-center mt-1">
                <div className="flex items-center gap-1.5 text-[10px] text-black/60 opacity-70 group-hover:opacity-100 transition-opacity relative z-10 font-bold">
                   <Coins className="w-3 h-3" />
                   <span>Расход: ~{getEstimatedCost()} кредитов</span>
                </div>
                {actualCost !== null && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Списано: {actualCost} кредитов</span>
                  </motion.div>
                )}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        </motion.section>

        {/* RIGHT PANEL - PREVIEW / RESULT */}
        <motion.section initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="self-start lg:self-start">
          <div className="glass-panel rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden relative min-h-[300px] lg:min-h-[400px]">
            
            {!isGenerating && !videoResult && (
              <div className="text-center opacity-40">
                <Video className="w-16 h-16 mx-auto mb-4" />
                <p>Ваше сгенерированное видео появится здесь.</p>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center z-20">
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-medium animate-pulse text-primary">{stepText}</h3>
                <div className="flex items-center gap-2 mt-4 text-white/60 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  <Timer className="w-4 h-4 animate-pulse text-primary" />
                  <span className="text-sm tabular-nums">Прошло времени: {timer}с</span>
                </div>
                <p className="text-white/30 text-xs mt-4">Это может занять пару минут...</p>
              </div>
            )}

            {videoResult && !isGenerating && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center relative">
                <video 
                  src={videoResult} 
                  controls 
                  autoPlay 
                  loop 
                  className="w-auto max-h-[450px] h-auto object-contain rounded-xl bg-black"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  {generationDuration && (
                    <div className="bg-black/60 backdrop-blur-md text-white/80 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border border-white/10">
                      <Timer className="w-3 h-3 text-primary" />
                      {generationDuration}с
                    </div>
                  )}
                  <a href={videoResult} download className="bg-black/50 hover:bg-black/80 backdrop-blur-md text-white p-2 rounded-full transition-colors" title="Скачать видео">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            )}

            {/* Ambient Background glow in player window */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none -z-10" />
          </div>

          {/* DEBUG WINDOW - PAYLOAD VIEW */}
          {lastPayload && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-6 glass-panel rounded-2xl overflow-hidden border border-white/5"
            >
              <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                   <Bug className="w-3.5 h-3.5 text-primary" /> Отладочная информация API (JSON)
                </div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest">Request Payload</div>
              </div>
              <div className="p-4 bg-zinc-950/50">
                 <pre className="text-[10px] font-mono text-primary/80 overflow-x-auto leading-relaxed custom-scrollbar max-h-48">
                   {JSON.stringify(lastPayload, null, 2)}
                 </pre>
              </div>
            </motion.div>
          )}
        </motion.section>

      </div>
      </div>

      {/* HeyGen Content — always mounted, hidden via CSS when inactive */}
      <div style={{ display: activeCategory === 'video' && videoSubTab === 'heygen' ? 'block' : 'none' }}>
        <HeyGenTab />
      </div>

      {/* GPT Image Content — always mounted, hidden via CSS when inactive */}
      <div style={{ display: activeCategory === 'images' ? 'block' : 'none' }}>
        <GptImageTab />
      </div>

    </main>
  );
}
