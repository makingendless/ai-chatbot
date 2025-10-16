import { tool } from "ai";
import { z } from "zod";

export const briaBackgroundRemove = tool({
  description:
    "Remove background from an image using Bria RMBG 2.0. Returns a PNG with transparent background.",
  inputSchema: z.object({
    image_url: z.string(),
    sync_mode: z.boolean().optional(),
  }),
  execute: async ({ image_url, sync_mode }) => {
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      throw new Error("FAL_KEY is not configured");
    }

    const endpointUrl = "https://fal.run/fal-ai/bria/background/remove";

    const payload: Record<string, unknown> = { image_url };
    if (typeof sync_mode === "boolean") {
      payload.sync_mode = sync_mode;
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
      image?: {
        url?: string;
        content_type?: string;
        file_name?: string;
        width?: number;
        height?: number;
        file_size?: number;
      };
    } = await response.json();

    const image = data.image;
    if (!image?.url) {
      throw new Error("FAL response did not include an image URL");
    }

    return {
      imageUrl: image.url,
      contentType: image.content_type || "image/png",
      fileName: image.file_name,
      width: image.width,
      height: image.height,
      fileSize: image.file_size,
      source: "fal-ai/bria/background/remove",
    };
  },
});
