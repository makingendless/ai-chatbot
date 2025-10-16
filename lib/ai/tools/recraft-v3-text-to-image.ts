import { tool } from "ai";
import { z } from "zod";

export const recraftV3TextToImage = tool({
  description:
    "Generate images from text using Recraft V3. Optionally control size, style, colors, and safety checker.",
  inputSchema: z.object({
    prompt: z.string(),
    image_size: z.string().optional(),
    style: z.string().optional(),
    colors: z
      .array(z.tuple([z.number().int(), z.number().int(), z.number().int()]))
      .optional(),
    style_id: z.string().optional(),
    enable_safety_checker: z.boolean().optional(),
  }),
  execute: async ({
    prompt,
    image_size,
    style,
    colors,
    style_id,
    enable_safety_checker,
  }) => {
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      throw new Error("FAL_KEY is not configured");
    }

    const endpointUrl = "https://fal.run/fal-ai/recraft/v3/text-to-image";

    const payload: Record<string, unknown> = { prompt };
    if (image_size) {
      payload.image_size = image_size;
    }
    if (style) {
      payload.style = style;
    }
    if (colors) {
      payload.colors = colors;
    }
    if (style_id) {
      payload.style_id = style_id;
    }
    if (typeof enable_safety_checker === "boolean") {
      payload.enable_safety_checker = enable_safety_checker;
    }

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        Authorization: `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`FAL request failed: ${response.status} ${errorText}`);
    }

    const data: {
      images?: Array<{ url?: string }>;
    } = await response.json();

    const images = (data.images || []).filter((img) => Boolean(img.url));
    if (images.length === 0) {
      throw new Error("FAL response did not include any image URLs");
    }

    return {
      images: images.map((img) => ({ url: img.url as string })),
      source: "fal-ai/recraft/v3/text-to-image",
    };
  },
});
