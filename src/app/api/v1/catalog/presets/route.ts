import { withApi } from '@/lib/api/with-api';
import { SEEDANCE_EMOTIONS, SEEDANCE_CAMERA_EFFECTS, SEEDANCE_LIGHTING } from '@/constants/presets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withApi(
  () => ({
    data: {
      emotions: SEEDANCE_EMOTIONS.map((e) => ({ id: e.id, name: e.name })),
      camera_styles: SEEDANCE_CAMERA_EFFECTS.map((c) => ({ id: c.id, name: c.name })),
      lighting: SEEDANCE_LIGHTING.map((l) => ({ id: l.id, name: l.name })),
      dynamism: [1, 2, 3],
    },
  }),
  { scope: 'read' },
);
