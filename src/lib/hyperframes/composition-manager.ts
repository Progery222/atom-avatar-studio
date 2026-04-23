import type { Composition, CompositionHistoryEntry } from '@/types/hyperframes';

const STORAGE_KEY = 'hyperframes_compositions';
const HISTORY_KEY = 'hyperframes_history';

function generateId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createComposition(template?: Partial<Composition>): Composition {
  const now = Date.now();
  return {
    id: generateId(),
    name: template?.name ?? 'Untitled',
    html: template?.html ?? '<div class="composition" style="width:1920px;height:1080px;background:#09090b;"></div>',
    css: template?.css ?? '',
    width: template?.width ?? 1920,
    height: template?.height ?? 1080,
    fps: template?.fps ?? 30,
    duration: template?.duration ?? 10,
    tracks: template?.tracks ?? [
      { id: 'track-1', name: 'Video 1', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
      { id: 'track-2', name: 'Audio 1', type: 'audio', clips: [], locked: false, visible: true, volume: 1 },
    ],
    metadata: template?.metadata ?? { author: '', tags: [], description: '', templateId: null },
    createdAt: now,
    updatedAt: now,
  };
}

export function saveComposition(composition: Composition): void {
  if (typeof window === 'undefined') return;

  const compositions = listCompositions();
  const existingIndex = compositions.findIndex((c) => c.id === composition.id);

  if (existingIndex >= 0) {
    compositions[existingIndex] = composition;
  } else {
    compositions.push(composition);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(compositions));
  updateHistoryEntry(composition);
}

export function loadComposition(id: string): Composition | null {
  if (typeof window === 'undefined') return null;

  const compositions = listCompositions();
  return compositions.find((c) => c.id === id) ?? null;
}

export function deleteComposition(id: string): boolean {
  if (typeof window === 'undefined') return false;

  const compositions = listCompositions();
  const filtered = compositions.filter((c) => c.id !== id);

  if (filtered.length === compositions.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  removeHistoryEntry(id);
  return true;
}

export function listCompositions(): Composition[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Composition[];
  } catch {
    return [];
  }
}

export function duplicateComposition(id: string): Composition | null {
  const original = loadComposition(id);
  if (!original) return null;

  const duplicate = createComposition({
    ...original,
    name: `${original.name} (Copy)`,
    metadata: { ...original.metadata, templateId: null },
  });

  saveComposition(duplicate);
  return duplicate;
}

export function exportComposition(composition: Composition): string {
  return JSON.stringify(composition, null, 2);
}

export function importComposition(json: string): Composition | null {
  try {
    const parsed = JSON.parse(json) as Composition;
    if (!parsed.id || !parsed.html || !parsed.tracks) return null;

    const imported = createComposition({
      ...parsed,
      name: parsed.name ?? 'Imported',
    });

    saveComposition(imported);
    return imported;
  } catch {
    return null;
  }
}

export function compositionToHtml(composition: Composition): string {
  const styleBlock = composition.css
    ? `<style id="hf-user-css">${composition.css}</style>`
    : '<style id="hf-user-css"></style>';

  const duration = composition.duration || 10;

  const playerScript = `
<script>
(function() {
  var timeline = null;
  var isPlaying = false;
  var currentTime = 0;
  var animationFrame = null;
  var lastTimestamp = 0;
  var playbackRate = 1;
  var compositionDuration = ${duration};

  function buildTimeline() {
    if (typeof gsap === 'undefined') {
      setTimeout(buildTimeline, 50);
      return;
    }

    if (timeline) {
      timeline.kill();
    }

    timeline = gsap.timeline({ paused: true });

    var elements = document.querySelectorAll('[data-start]');
    elements.forEach(function(el) {
      var start = parseFloat(el.getAttribute('data-start')) || 0;
      var dur = parseFloat(el.getAttribute('data-duration')) || 3;
      var ease = el.getAttribute('data-ease') || 'power2.out';

      gsap.set(el, { opacity: 0, scale: 0.95 });

      timeline.to(el, {
        opacity: 1,
        scale: 1,
        duration: Math.min(0.4, dur * 0.15),
        ease: ease
      }, start);

      if (start + dur < compositionDuration) {
        timeline.to(el, {
          opacity: 0,
          scale: 1.02,
          duration: Math.min(0.3, dur * 0.1),
          ease: 'power2.in'
        }, start + dur - Math.min(0.3, dur * 0.1));
      }
    });

    timeline.duration(compositionDuration);
    timeline.seek(currentTime);
  }

  // Synchronous seek for Puppeteer frame capture
  window.setCurrentTime = function(t) {
    currentTime = t;
    if (timeline) {
      timeline.seek(t);
    }
  };

  function play() {
    if (!timeline) buildTimeline();
    isPlaying = true;
    lastTimestamp = performance.now();
    tick();
  }

  function pause() {
    isPlaying = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function tick() {
    if (!isPlaying) return;

    var now = performance.now();
    var delta = (now - lastTimestamp) / 1000 * playbackRate;
    lastTimestamp = now;

    currentTime += delta;

    if (currentTime >= compositionDuration) {
      currentTime = 0;
      isPlaying = false;
      if (timeline) timeline.seek(0);
      try { parent.postMessage({ type: 'ended' }, '*'); } catch(e) {}
      return;
    }

    if (timeline) {
      timeline.seek(currentTime);
    }

    try { parent.postMessage({ type: 'timeupdate', currentTime: currentTime }, '*'); } catch(e) {}
    animationFrame = requestAnimationFrame(tick);
  }

  // Handle messages from parent (live preview + render control)
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;

    switch (e.data.type) {
      case 'play':
        playbackRate = e.data.playbackRate || 1;
        if (e.data.currentTime !== undefined) {
          currentTime = e.data.currentTime;
          if (timeline) timeline.seek(currentTime);
        }
        play();
        break;

      case 'pause':
        pause();
        break;

      case 'seek':
        currentTime = e.data.currentTime || 0;
        if (timeline) timeline.seek(currentTime);
        try { parent.postMessage({ type: 'timeupdate', currentTime: currentTime }, '*'); } catch(ex) {}
        break;

      case 'updateHtml':
        // Safely replace the composition content without breaking the page
        var wrapper = document.createElement('div');
        wrapper.innerHTML = e.data.html || '';
        // Get the first element from the new HTML
        var newContent = wrapper.firstElementChild;
        var oldContainer = document.querySelector('[data-composition-id]') || document.body.firstElementChild;
        if (newContent && oldContainer && oldContainer.tagName !== 'SCRIPT' && oldContainer.tagName !== 'STYLE') {
          oldContainer.replaceWith(newContent);
        } else if (newContent) {
          // Fallback: insert before scripts
          var scripts = document.body.querySelectorAll('script');
          if (scripts.length > 0) {
            document.body.insertBefore(newContent, scripts[0]);
          } else {
            document.body.appendChild(newContent);
          }
        }
        if (e.data.css !== undefined) {
          var styleEl = document.getElementById('hf-user-css');
          if (styleEl) styleEl.textContent = e.data.css;
        }
        buildTimeline();
        break;

      case 'updateCss':
        var cssEl = document.getElementById('hf-user-css');
        if (cssEl && e.data.css !== undefined) {
          cssEl.textContent = e.data.css;
        }
        break;
    }
  });

  // Auto-init
  function onReady() {
    buildTimeline();
    try { parent.postMessage({ type: 'ready', duration: compositionDuration }, '*'); } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
<\/script>`;

  const escapedName = composition.name.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>' + escapedName + '</title>\n  ' + styleBlock + '\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>\n</head>\n<body style="margin:0;padding:0;overflow:hidden;background:#09090b;">\n  ' + composition.html + '\n  ' + playerScript + '\n</body>\n</html>';
}

// History management
function updateHistoryEntry(composition: Composition): void {
  if (typeof window === 'undefined') return;

  const history = getHistory();
  const entry: CompositionHistoryEntry = {
    id: composition.id,
    name: composition.name,
    lastModified: composition.updatedAt,
    duration: composition.duration,
    trackCount: composition.tracks.length,
    thumbnail: null,
  };

  const existingIndex = history.findIndex((h) => h.id === composition.id);
  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.unshift(entry);
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function removeHistoryEntry(id: string): void {
  if (typeof window === 'undefined') return;

  const history = getHistory();
  const filtered = history.filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export function getHistory(): CompositionHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CompositionHistoryEntry[];
  } catch {
    return [];
  }
}
