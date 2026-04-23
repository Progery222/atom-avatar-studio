import type { OnboardingStep } from '@/types/hyperframes';

export const HYPERFRAMES_WIZARD_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to HyperFrames',
    description:
      'HyperFrames is a timeline-based video composition editor. Create rich HTML compositions, add avatar videos, and render to MP4 — all in the browser.',
    targetSelector: '[data-hf-tab="hyperframes"]',
    placement: 'bottom',
  },
  {
    id: 'code-editor',
    title: 'Code Editor',
    description:
      'Write HTML and CSS compositions here. Your code renders live in the preview panel. Use data-attributes on elements to control timing and transitions.',
    targetSelector: '.cm-editor',
    placement: 'right',
  },
  {
    id: 'live-preview',
    title: 'Live Preview',
    description:
      'See your composition rendered in real-time. Hit play to preview animations and transitions at the correct frame rate.',
    targetSelector: '[data-hf="player"]',
    placement: 'left',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    description:
      'Arrange clips on tracks to control when elements appear. Drag clips to reposition, resize edges to trim duration. The red playhead shows current time.',
    targetSelector: '.hf-timeline',
    placement: 'top',
  },
  {
    id: 'block-catalog',
    title: 'Block Catalog',
    description:
      'Browse pre-built scene blocks — social cards, cinematic intros, data visualizations, and more. Drag a block onto the timeline to add it to your composition.',
    targetSelector: '[data-hf-panel="catalog"]',
    placement: 'right',
  },
  {
    id: 'shader-transitions',
    title: 'Shader Transitions',
    description:
      'Add GPU-powered transition effects between clips — dissolves, wipes, glitches, and more. Each transition is a GLSL shader you can customize.',
    targetSelector: '[data-hf-panel="shaders"]',
    placement: 'right',
  },
  {
    id: 'import-avatars',
    title: 'Import Avatars',
    description:
      'Bring in AI-generated avatar videos from the Generate tab. Imported clips appear in your media library and can be placed on any video track.',
    targetSelector: '[data-hf="import"]',
    placement: 'bottom',
  },
  {
    id: 'render-video',
    title: 'Render to Video',
    description:
      "Export your finished composition as an MP4 video. Choose resolution, frame rate, and codec. That's it — you're ready to create!",
    targetSelector: '[data-hf="render"]',
    placement: 'left',
    action: 'complete',
  },
];
