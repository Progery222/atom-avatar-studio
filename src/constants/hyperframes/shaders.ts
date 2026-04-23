import type { ShaderTransition } from '@/types/hyperframes';

export const SHADER_TRANSITIONS: ShaderTransition[] = [
  {
    id: 'domain-warp',
    name: 'Domain Warp',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv;
        float progress = uProgress;
        vec2 fromP = p + 0.1 * sin(progress * 3.14159 + p.y * 10.0);
        vec2 toP = p - 0.1 * sin((1.0 - progress) * 3.14159 + p.y * 10.0);
        vec4 fromColor = texture2D(uFrom, fromP);
        vec4 toColor = texture2D(uTo, toP);
        gl_FragColor = mix(fromColor, toColor, progress);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 1.0,
    thumbnail: '/shaders/domain-warp.png',
  },
  {
    id: 'glitch',
    name: 'Glitch',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float progress = uProgress;
        vec2 p = vUv;
        float glitchStrength = sin(progress * 3.14159) * 0.1;
        float offset = rand(vec2(floor(p.y * 20.0), progress)) * glitchStrength;
        vec4 fromColor = texture2D(uFrom, p + vec2(offset, 0.0));
        vec4 toColor = texture2D(uTo, p - vec2(offset, 0.0));
        gl_FragColor = mix(fromColor, toColor, progress);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.8,
    thumbnail: '/shaders/glitch.png',
  },
  {
    id: 'light-leak',
    name: 'Light Leak',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float progress = uProgress;
        vec2 p = vUv;
        float lightIntensity = sin(progress * 3.14159) * 1.5;
        vec2 lightCenter = vec2(0.5 + progress * 0.3, 0.5);
        float dist = distance(p, lightCenter);
        float light = lightIntensity * smoothstep(0.8, 0.0, dist);
        vec4 fromColor = texture2D(uFrom, p);
        vec4 toColor = texture2D(uTo, p);
        vec4 lightColor = vec4(1.0, 0.9, 0.7, light);
        vec4 mixed = mix(fromColor, toColor, progress);
        gl_FragColor = mixed + lightColor * light;
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 1.2,
    thumbnail: '/shaders/light-leak.png',
  },
  {
    id: 'ripple-waves',
    name: 'Ripple Waves',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float progress = uProgress;
        vec2 p = vUv;
        float dist = distance(p, vec2(0.5));
        float wave = sin(dist * 30.0 - progress * 10.0) * sin(progress * 3.14159) * 0.02;
        vec4 fromColor = texture2D(uFrom, p + wave);
        vec4 toColor = texture2D(uTo, p - wave);
        gl_FragColor = mix(fromColor, toColor, progress);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 1.0,
    thumbnail: '/shaders/ripple-waves.png',
  },
  {
    id: 'cross-fade',
    name: 'Cross Fade',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        vec4 fromColor = texture2D(uFrom, vUv);
        vec4 toColor = texture2D(uTo, vUv);
        gl_FragColor = mix(fromColor, toColor, uProgress);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.6,
    thumbnail: '/shaders/cross-fade.png',
  },
  {
    id: 'wipe-right',
    name: 'Wipe Right',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float edge = uProgress;
        float softness = 0.02;
        float mixFactor = smoothstep(edge - softness, edge + softness, vUv.x);
        vec4 fromColor = texture2D(uFrom, vUv);
        vec4 toColor = texture2D(uTo, vUv);
        gl_FragColor = mix(fromColor, toColor, mixFactor);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.5,
    thumbnail: '/shaders/wipe-right.png',
  },
  {
    id: 'zoom-blur',
    name: 'Zoom Blur',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float progress = uProgress;
        vec2 center = vec2(0.5);
        vec2 dir = vUv - center;
        float dist = length(dir);
        float blurAmount = sin(progress * 3.14159) * 0.05;
        vec4 fromColor = texture2D(uFrom, vUv + dir * blurAmount);
        vec4 toColor = texture2D(uTo, vUv - dir * blurAmount);
        gl_FragColor = mix(fromColor, toColor, progress);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.8,
    thumbnail: '/shaders/zoom-blur.png',
  },
  {
    id: 'pixelate',
    name: 'Pixelate',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float progress = uProgress;
        float pixelSize = mix(1.0, 40.0, sin(progress * 3.14159));
        vec2 pixelUv = floor(vUv * pixelSize) / pixelSize;
        vec4 fromColor = texture2D(uFrom, pixelUv);
        vec4 toColor = texture2D(uTo, pixelUv);
        gl_FragColor = mix(fromColor, toColor, progress);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.7,
    thumbnail: '/shaders/pixelate.png',
  },
  {
    id: 'circle-reveal',
    name: 'Circle Reveal',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float dist = distance(vUv, vec2(0.5));
        float radius = uProgress * 0.8;
        float softness = 0.02;
        float mixFactor = smoothstep(radius - softness, radius + softness, dist);
        vec4 fromColor = texture2D(uFrom, vUv);
        vec4 toColor = texture2D(uTo, vUv);
        gl_FragColor = mix(toColor, fromColor, mixFactor);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.8,
    thumbnail: '/shaders/circle-reveal.png',
  },
  {
    id: 'dissolve',
    name: 'Dissolve',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        float noise = rand(vUv * 100.0);
        float threshold = uProgress;
        float mixFactor = smoothstep(threshold - 0.1, threshold + 0.1, noise);
        vec4 fromColor = texture2D(uFrom, vUv);
        vec4 toColor = texture2D(uTo, vUv);
        gl_FragColor = mix(fromColor, toColor, mixFactor);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 1.0,
    thumbnail: '/shaders/dissolve.png',
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float edge = uProgress;
        float softness = 0.015;
        float mixFactor = smoothstep(edge - softness, edge + softness, vUv.y);
        vec4 fromColor = texture2D(uFrom, vUv + vec2(0.0, uProgress * 0.1));
        vec4 toColor = texture2D(uTo, vUv - vec2(0.0, (1.0 - uProgress) * 0.1));
        gl_FragColor = mix(fromColor, toColor, mixFactor);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.6,
    thumbnail: '/shaders/slide-up.png',
  },
  {
    id: 'chromatic-aberration',
    name: 'Chromatic Aberration',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float progress = uProgress;
        float aberration = sin(progress * 3.14159) * 0.01;
        vec2 dir = vUv - vec2(0.5);
        vec4 fromR = texture2D(uFrom, vUv + dir * aberration);
        vec4 fromG = texture2D(uFrom, vUv);
        vec4 fromB = texture2D(uFrom, vUv - dir * aberration);
        vec4 fromColor = vec4(fromR.r, fromG.g, fromB.b, 1.0);
        vec4 toColor = texture2D(uTo, vUv);
        gl_FragColor = mix(fromColor, toColor, progress);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.8,
    thumbnail: '/shaders/chromatic-aberration.png',
  },
  {
    id: 'flash-white',
    name: 'Flash White',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float progress = uProgress;
        float flash = sin(progress * 3.14159);
        vec4 fromColor = texture2D(uFrom, vUv);
        vec4 toColor = texture2D(uTo, vUv);
        vec4 mixed = mix(fromColor, toColor, progress);
        gl_FragColor = mixed + vec4(flash * 0.8);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 0.5,
    thumbnail: '/shaders/flash-white.png',
  },
  {
    id: 'ink-spread',
    name: 'Ink Spread',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float progress = uProgress;
        vec2 center = vec2(0.5);
        float dist = distance(vUv, center);
        float radius = progress * 0.9;
        float edge = 0.05;
        float ink = smoothstep(radius, radius - edge, dist);
        vec4 fromColor = texture2D(uFrom, vUv);
        vec4 toColor = texture2D(uTo, vUv);
        gl_FragColor = mix(fromColor, toColor, ink);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 1.0,
    thumbnail: '/shaders/ink-spread.png',
  },
  {
    id: 'kaleidoscope',
    name: 'Kaleidoscope',
    type: 'glsl',
    glslFragment: `
      precision mediump float;
      uniform float uProgress;
      uniform sampler2D uFrom;
      uniform sampler2D uTo;
      varying vec2 vUv;
      void main() {
        float progress = uProgress;
        vec2 p = vUv - 0.5;
        float angle = atan(p.y, p.x);
        float segments = mix(1.0, 6.0, sin(progress * 3.14159));
        angle = mod(angle, 3.14159 * 2.0 / segments);
        angle = abs(angle - 3.14159 / segments);
        float dist = length(p);
        vec2 kaleidUv = vec2(cos(angle), sin(angle)) * dist + 0.5;
        vec4 fromColor = texture2D(uFrom, kaleidUv);
        vec4 toColor = texture2D(uTo, kaleidUv);
        gl_FragColor = mix(fromColor, toColor, progress);
      }
    `,
    uniforms: { uProgress: 0 },
    duration: 1.0,
    thumbnail: '/shaders/kaleidoscope.png',
  },
];
