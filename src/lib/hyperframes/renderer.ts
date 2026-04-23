import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import type { RenderSettings, RenderJob } from '@/types/hyperframes';
import { uploadFileToSupabase } from '@/lib/supabase';

const RESOLUTION_MAP: Record<RenderSettings['resolution'], { width: number; height: number }> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

const CODEC_MAP: Record<RenderSettings['codec'], string> = {
  h264: 'libx264',
  h265: 'libx265',
  vp9: 'libvpx-vp9',
};

const QUALITY_CRF: Record<RenderSettings['quality'], number> = {
  low: 28,
  medium: 23,
  high: 18,
};

const RENDER_TIMEOUT_MS = 5 * 60 * 1000;

export const renderJobs = new Map<string, RenderJob>();

let renderQueue: Promise<void> = Promise.resolve();

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Render timed out')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

async function cleanupDir(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}

async function captureFrames(
  htmlPath: string,
  outputDir: string,
  width: number,
  height: number,
  fps: number,
  durationSec: number,
  jobId: string,
): Promise<void> {
  let puppeteer: typeof import('puppeteer') | null = null;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    throw new Error('Puppeteer is not available in this environment. Install puppeteer to enable rendering.');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

    // Wait for GSAP to load and runtime to initialize
    await page.waitForFunction('typeof window.setCurrentTime === "function"', { timeout: 10000 });

    const totalFrames = Math.ceil(durationSec * fps);

    for (let i = 0; i < totalFrames; i++) {
      const frameTime = i / fps;

      // Use the seekable setCurrentTime exposed by our GSAP runtime
      await page.evaluate((t: number) => {
        (window as unknown as { setCurrentTime: (t: number) => void }).setCurrentTime(t);
      }, frameTime);

      // Wait one animation frame for GSAP to render
      await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

      const padded = String(i).padStart(6, '0');
      await page.screenshot({ path: path.join(outputDir, `frame_${padded}.png`), type: 'png' });

      const job = renderJobs.get(jobId);
      if (job) {
        const progress = Math.round((i / totalFrames) * 60);
        renderJobs.set(jobId, { ...job, progress, status: 'rendering' });
      }
    }
  } finally {
    await browser.close();
  }
}

async function encodeFrames(
  framesDir: string,
  outputPath: string,
  settings: RenderSettings,
  jobId: string,
): Promise<void> {
  let ffmpeg: typeof import('fluent-ffmpeg') | null = null;
  try {
    ffmpeg = (await import('fluent-ffmpeg')).default;
  } catch {
    throw new Error('fluent-ffmpeg is not available in this environment.');
  }

  const ffmpegPath: string | undefined = undefined;

  const job = renderJobs.get(jobId);
  if (job) {
    renderJobs.set(jobId, { ...job, status: 'encoding', progress: 65 });
  }

  return new Promise<void>((resolve, reject) => {
    let cmd = ffmpeg(path.join(framesDir, 'frame_%06d.png'));
    if (ffmpegPath) cmd = cmd.setFfmpegPath(ffmpegPath);

    cmd = cmd
      .inputOptions([`-framerate ${settings.fps}`])
      .videoCodec(CODEC_MAP[settings.codec])
      .outputOptions([
        `-crf ${QUALITY_CRF[settings.quality]}`,
        '-pix_fmt yuv420p',
        '-preset fast',
      ])
      .outputFormat(settings.format === 'webm' ? 'webm' : 'mp4')
      .output(outputPath)
      .on('progress', (info: { percent?: number }) => {
        const j = renderJobs.get(jobId);
        if (j && info.percent != null) {
          renderJobs.set(jobId, { ...j, progress: 65 + Math.round(info.percent * 0.35) });
        }
      })
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err));

    cmd.run();
  });
}

export async function renderComposition(
  html: string,
  settings: RenderSettings,
  durationSec: number = 10,
): Promise<{ jobId: string; outputUrl: string }> {
  const jobId = randomUUID();
  const tmpDir = path.join(os.tmpdir(), `hyperframes-${jobId}`);

  const job: RenderJob = {
    id: jobId,
    compositionId: '',
    status: 'queued',
    progress: 0,
    outputUrl: null,
    error: null,
    startedAt: null,
    completedAt: null,
  };
  renderJobs.set(jobId, job);

  const execute = async () => {
    try {
      renderJobs.set(jobId, { ...renderJobs.get(jobId)!, status: 'rendering', startedAt: Date.now() });

      await fs.mkdir(tmpDir, { recursive: true });
      const htmlPath = path.join(tmpDir, 'composition.html');
      await fs.writeFile(htmlPath, html, 'utf-8');

      const { width, height } = RESOLUTION_MAP[settings.resolution];

      await withTimeout(
        captureFrames(htmlPath, tmpDir, width, height, settings.fps, durationSec, jobId),
        RENDER_TIMEOUT_MS,
      );

      const ext = settings.format === 'webm' ? 'webm' : 'mp4';
      const outputPath = path.join(tmpDir, `output.${ext}`);

      await withTimeout(
        encodeFrames(tmpDir, outputPath, settings, jobId),
        RENDER_TIMEOUT_MS,
      );

      const videoBuffer = await fs.readFile(outputPath);
      const uploadPath = `renders/${jobId}/output.${ext}`;
      const outputUrl = await uploadFileToSupabase(
        'hyperframes-renders',
        uploadPath,
        new Blob([videoBuffer]),
      );

      renderJobs.set(jobId, {
        ...renderJobs.get(jobId)!,
        status: 'done',
        progress: 100,
        outputUrl,
        completedAt: Date.now(),
      });

      return { jobId, outputUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      renderJobs.set(jobId, {
        ...renderJobs.get(jobId)!,
        status: 'error',
        error: message,
        completedAt: Date.now(),
      });
      throw err;
    } finally {
      await cleanupDir(tmpDir);
    }
  };

  return new Promise<{ jobId: string; outputUrl: string }>((resolve, reject) => {
    renderQueue = renderQueue.then(async () => {
      try {
        const result = await execute();
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function getRenderJob(jobId: string): RenderJob | undefined {
  return renderJobs.get(jobId);
}
