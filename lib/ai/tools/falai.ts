import { tool } from 'ai';
import { z } from 'zod';

export const falAI = tool({
  description:
    'Use Fal AI to generate content. You would have to render it using markdown syntax.',
  inputSchema: z.object({
    prompt: z.string(),
  }),
  execute: async ({ prompt: inputPrompt }) => {
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      throw new Error('FAL_KEY is not configured');
    }

    const endpointUrl = 'https://fal.run/fal-ai/fast-lightning-sdxl';

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: inputPrompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
        safety_checker_version: 'v1',
        format: 'jpeg',
        sync_mode: false,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`FAL request failed: ${response.status} ${errorText}`);
    }

    const data: {
      images?: Array<{ url?: string; content_type?: string; }>;
      prompt?: string;
      seed?: number;
      has_nsfw_concepts?: boolean[];
    } = await response.json();

    const firstImage = data.images?.[0];
    if (!firstImage?.url) {
      throw new Error('FAL response did not include an image URL');
    }

    return {
      imageUrl: firstImage.url,
      alt: data.prompt || inputPrompt,
      source: 'fal-ai/fast-lightning-sdxl',
      contentType: firstImage.content_type || 'image/jpeg',
      seed: data.seed,
    };
  },
});
