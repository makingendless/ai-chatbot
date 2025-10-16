import { tool } from 'ai';
import { z } from 'zod';

export const fastSvdLcm = tool({
  description:
    'Use Stable Video Diffusion Turbo (fast-svd-lcm) to generate a short video from an image URL. Render the resulting video URL using markdown.',
  inputSchema: z.object({
    image_url: z.string(),
    motion_bucket_id: z.number().int().optional(),
    cond_aug: z.number().optional(),
    seed: z.number().int().optional(),
    steps: z.number().int().optional(),
    fps: z.number().int().optional(),
  }),
  execute: async ({
    image_url,
    motion_bucket_id,
    cond_aug,
    seed,
    steps,
    fps,
  }) => {
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      throw new Error('FAL_KEY is not configured');
    }

    const endpointUrl = 'https://fal.run/fal-ai/fast-svd-lcm';

    const payload: Record<string, unknown> = { image_url };
    if (typeof motion_bucket_id === 'number')
      payload.motion_bucket_id = motion_bucket_id;
    if (typeof cond_aug === 'number') payload.cond_aug = cond_aug;
    if (typeof seed === 'number') payload.seed = seed;
    if (typeof steps === 'number') payload.steps = steps;
    if (typeof fps === 'number') payload.fps = fps;

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
      video?: {
        url?: string;
        content_type?: string;
        file_name?: string;
        file_size?: number;
      };
      seed?: number;
    } = await response.json();

    const video = data.video;
    if (!video?.url) {
      throw new Error('FAL response did not include a video URL');
    }

    return {
      videoUrl: video.url,
      contentType: video.content_type || 'video/mp4',
      fileName: video.file_name,
      fileSize: video.file_size,
      seed: data.seed,
      source: 'fal-ai/fast-svd-lcm',
    };
  },
});
