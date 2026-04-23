import type { Composition } from '@/types/hyperframes';

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  composition: Omit<Composition, 'id' | 'createdAt' | 'updatedAt'>;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'blank-1080p',
    name: 'Blank Canvas (1080p)',
    description: 'Empty 1920×1080 composition at 30fps',
    thumbnail: '/templates/blank-1080p.png',
    composition: {
      name: 'Untitled',
      html: '<div class="composition" style="width:1920px;height:1080px;background:#09090b;"></div>',
      css: '',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 10,
      tracks: [
        { id: 'track-1', name: 'Video 1', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
        { id: 'track-2', name: 'Audio 1', type: 'audio', clips: [], locked: false, visible: true, volume: 1 },
      ],
      metadata: { author: '', tags: [], description: '', templateId: 'blank-1080p' },
    },
  },
  {
    id: 'blank-vertical',
    name: 'Blank Canvas (Vertical)',
    description: 'Empty 1080×1920 composition for stories/reels',
    thumbnail: '/templates/blank-vertical.png',
    composition: {
      name: 'Untitled',
      html: '<div class="composition" style="width:1080px;height:1920px;background:#09090b;"></div>',
      css: '',
      width: 1080,
      height: 1920,
      fps: 30,
      duration: 10,
      tracks: [
        { id: 'track-1', name: 'Video 1', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
        { id: 'track-2', name: 'Audio 1', type: 'audio', clips: [], locked: false, visible: true, volume: 1 },
      ],
      metadata: { author: '', tags: [], description: '', templateId: 'blank-vertical' },
    },
  },
  {
    id: 'social-story',
    name: 'Social Story',
    description: 'Instagram/TikTok story with text overlay and gradient background',
    thumbnail: '/templates/social-story.png',
    composition: {
      name: 'Social Story',
      html: `<div class="composition" style="width:1080px;height:1920px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;">
  <h1 data-start="0" data-duration="5" data-track-index="0" style="font-size:64px;font-weight:700;margin-bottom:24px;">Your Title</h1>
  <p data-start="1" data-duration="4" data-track-index="0" style="font-size:32px;opacity:0.9;">Your message here</p>
</div>`,
      css: '',
      width: 1080,
      height: 1920,
      fps: 30,
      duration: 5,
      tracks: [
        { id: 'track-1', name: 'Content', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
      ],
      metadata: { author: '', tags: ['social', 'story'], description: 'Social media story template', templateId: 'social-story' },
    },
  },
  {
    id: 'promo-horizontal',
    name: 'Promo Video (Horizontal)',
    description: 'Product promo with intro, features, and CTA sections',
    thumbnail: '/templates/promo-horizontal.png',
    composition: {
      name: 'Promo Video',
      html: `<div class="composition" style="width:1920px;height:1080px;background:#09090b;color:white;">
  <section data-start="0" data-duration="3" data-track-index="0" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <h2 style="font-size:36px;opacity:0.6;letter-spacing:8px;">INTRODUCING</h2>
    <h1 style="font-size:80px;font-weight:800;margin-top:16px;">Product Name</h1>
  </section>
  <section data-start="3" data-duration="6" data-track-index="0" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
    <p style="font-size:32px;max-width:800px;text-align:center;line-height:1.6;">Key features and benefits listed here</p>
  </section>
  <section data-start="9" data-duration="4" data-track-index="0" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
    <h2 style="font-size:56px;margin-bottom:24px;">Get Started Today</h2>
    <div style="padding:16px 48px;font-size:24px;background:#8b5cf6;border-radius:8px;">Learn More</div>
  </section>
</div>`,
      css: '',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 13,
      tracks: [
        { id: 'track-1', name: 'Content', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
        { id: 'track-2', name: 'Audio', type: 'audio', clips: [], locked: false, visible: true, volume: 1 },
      ],
      metadata: { author: '', tags: ['promo', 'marketing'], description: 'Horizontal promo video template', templateId: 'promo-horizontal' },
    },
  },
  {
    id: 'title-sequence',
    name: 'Cinematic Title Sequence',
    description: 'Elegant film-style title card with serif typography',
    thumbnail: '/templates/title-sequence.png',
    composition: {
      name: 'Title Sequence',
      html: `<div class="composition" style="width:1920px;height:1080px;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#e8d5b7;font-family:serif;">
  <h1 data-start="0" data-duration="4" data-track-index="0" data-ease="ease-in-out" style="font-size:96px;letter-spacing:16px;margin-bottom:24px;">TITLE</h1>
  <div style="width:120px;height:2px;background:#e8d5b7;margin-bottom:24px;"></div>
  <p data-start="1" data-duration="3" data-track-index="0" style="font-size:32px;letter-spacing:8px;opacity:0.8;">A Story</p>
</div>`,
      css: '',
      width: 1920,
      height: 1080,
      fps: 24,
      duration: 5,
      tracks: [
        { id: 'track-1', name: 'Content', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
        { id: 'track-2', name: 'Music', type: 'audio', clips: [], locked: false, visible: true, volume: 0.5 },
      ],
      metadata: { author: '', tags: ['cinematic', 'title', 'film'], description: 'Cinematic title sequence template', templateId: 'title-sequence' },
    },
  },
  {
    id: 'data-dashboard',
    name: 'Data Dashboard',
    description: 'Animated stats and metrics display',
    thumbnail: '/templates/data-dashboard.png',
    composition: {
      name: 'Data Dashboard',
      html: `<div class="composition" style="width:1920px;height:1080px;background:#0a0a0a;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;">
  <div data-start="0" data-duration="5" data-track-index="0" style="text-align:center;">
    <div style="font-size:144px;font-weight:800;background:linear-gradient(135deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">1,234</div>
    <div style="font-size:36px;opacity:0.6;margin-top:16px;letter-spacing:4px;">TOTAL USERS</div>
  </div>
</div>`,
      css: '',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      tracks: [
        { id: 'track-1', name: 'Content', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
      ],
      metadata: { author: '', tags: ['data', 'dashboard', 'stats'], description: 'Data dashboard template', templateId: 'data-dashboard' },
    },
  },
  {
    id: 'quote-card',
    name: 'Quote Card',
    description: 'Elegant quotation with attribution on dark background',
    thumbnail: '/templates/quote-card.png',
    composition: {
      name: 'Quote Card',
      html: `<div class="composition" style="width:1920px;height:1080px;background:#09090b;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px;">
  <blockquote data-start="0" data-duration="5" data-track-index="0" style="font-size:48px;font-style:italic;max-width:1200px;text-align:center;line-height:1.4;margin-bottom:32px;">"The best way to predict the future is to create it."</blockquote>
  <p data-start="1" data-duration="4" data-track-index="0" style="font-size:24px;opacity:0.6;">— Peter Drucker</p>
</div>`,
      css: '',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      tracks: [
        { id: 'track-1', name: 'Content', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
      ],
      metadata: { author: '', tags: ['quote', 'text', 'elegant'], description: 'Quote card template', templateId: 'quote-card' },
    },
  },
  {
    id: 'presentation',
    name: 'Presentation Slide',
    description: 'Clean slide with title and bullet points',
    thumbnail: '/templates/presentation.png',
    composition: {
      name: 'Presentation',
      html: `<div class="composition" style="width:1920px;height:1080px;background:#09090b;color:white;padding:120px;">
  <h1 data-start="0" data-duration="5" data-track-index="0" style="font-size:64px;font-weight:700;margin-bottom:48px;border-left:6px solid #8b5cf6;padding-left:24px;">Slide Title</h1>
  <ul data-start="0.5" data-duration="4.5" data-track-index="0" style="list-style:none;padding:0;">
    <li style="font-size:32px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.1);">First key point</li>
    <li style="font-size:32px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.1);">Second key point</li>
    <li style="font-size:32px;padding:16px 0;">Third key point</li>
  </ul>
</div>`,
      css: '',
      width: 1920,
      height: 1080,
      fps: 30,
      duration: 5,
      tracks: [
        { id: 'track-1', name: 'Content', type: 'video', clips: [], locked: false, visible: true, volume: 1 },
      ],
      metadata: { author: '', tags: ['presentation', 'slide', 'clean'], description: 'Presentation slide template', templateId: 'presentation' },
    },
  },
];
