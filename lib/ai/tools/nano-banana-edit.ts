import { tool } from 'ai';
import { z } from 'zod';

export const nanoBananaEdit = tool({
  description:
    'Edit images with Google Nano Banana. Accepts multiple input image URLs and a text prompt. Returns one or more edited image URLs plus a descriptive text. Render resulting images using markdown.',
  inputSchema: z.object({
    prompt: z.string(),
    image_urls: z.array(z.string()).min(1),
    num_images: z.number().int().min(1).max(4).optional(),
    output_format: z.enum(['jpeg', 'png']).optional(),
    sync_mode: z.boolean().optional(),
  }),
  execute: async ({
    prompt,
    image_urls,
    num_images,
    output_format,
    sync_mode,
  }) => {
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      throw new Error('FAL_KEY is not configured');
    }

    const endpointUrl = 'https://fal.run/fal-ai/nano-banana/edit';

    const payload: Record<string, unknown> = { prompt, image_urls };
    if (typeof num_images === 'number') payload.num_images = num_images;
    if (output_format) payload.output_format = output_format;
    if (typeof sync_mode === 'boolean') payload.sync_mode = sync_mode;

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`FAL request failed: ${response.status} ${errorText}`);
    }

    const data: {
      images?: Array<{
        url?: string;
        content_type?: string;
        file_name?: string;
      }>;
      description?: string;
    } = await response.json();

    const images = (data.images || []).filter((img) => Boolean(img.url));
    if (images.length === 0) {
      throw new Error('FAL response did not include any image URLs');
    }

    return {
      images: images.map((img) => ({
        url: img.url as string,
        contentType:
          img.content_type ||
          (output_format === 'png' ? 'image/png' : 'image/jpeg'),
        fileName: img.file_name,
      })),
      description: data.description,
      source: 'fal-ai/nano-banana/edit',
    };
  },
});
