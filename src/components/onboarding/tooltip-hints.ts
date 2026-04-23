export interface TooltipHint {
  id: string;
  text: string;
  targetSelector: string;
}

export const HYPERFRAMES_TOOLTIP_HINTS: TooltipHint[] = [
  {
    id: 'code-editor',
    text: 'Write HTML with data-start and data-duration attributes to define your composition timeline',
    targetSelector: '[data-hint="code-editor"]',
  },
  {
    id: 'timeline',
    text: 'Drag clips to rearrange. Click to select. Right-click for options.',
    targetSelector: '[data-hint="timeline"]',
  },
  {
    id: 'player',
    text: 'Live preview of your composition. Changes update in real-time.',
    targetSelector: '[data-hint="player"]',
  },
  {
    id: 'block-catalog',
    text: "Browse 37+ pre-built scenes. Click 'Insert' to add to your composition.",
    targetSelector: '[data-hint="block-catalog"]',
  },
  {
    id: 'shader-selector',
    text: 'Choose from 15+ transition effects between clips.',
    targetSelector: '[data-hint="shader-selector"]',
  },
  {
    id: 'export-panel',
    text: 'Render your composition to MP4 video. Choose resolution and quality.',
    targetSelector: '[data-hint="export-panel"]',
  },
  {
    id: 'audio',
    text: 'Add background music, voiceover, or sound effects to your composition.',
    targetSelector: '[data-hint="audio"]',
  },
];
