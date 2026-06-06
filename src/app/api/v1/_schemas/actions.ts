import { z } from 'zod';

export const uploadSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('url'),
    url: z.string().url(),
    kind: z.enum(['image', 'audio']),
  }),
  z.object({
    source: z.literal('base64'),
    data: z.string().min(1),
    content_type: z.string().min(1),
    kind: z.enum(['image', 'audio']),
    filename: z.string().min(1).optional(),
  }),
]);

export type UploadInput = z.infer<typeof uploadSchema>;
