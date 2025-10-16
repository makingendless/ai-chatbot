import { tool } from "ai";
import { z } from "zod";

const voiceInputSchema = z.object({
  voice: z.string(),
  turn_prefix: z.string(),
});

export const playaiTtsDialog = tool({
  description:
    "Generate a multi-speaker dialogue audio using PlayAI TTS Dialog. Provide dialogue text with speaker turn prefixes.",
  inputSchema: z.object({
    input: z.string(),
    voices: z.array(voiceInputSchema).min(1).max(2).optional(),
    response_format: z.enum(["url", "bytes"]).optional(),
    seed: z.number().int().optional(),
  }),
  execute: async ({ input, voices, response_format, seed }) => {
    const falApiKey = process.env.FAL_KEY;
    if (!falApiKey) {
      throw new Error("FAL_KEY is not configured");
    }

    const endpointUrl = "https://fal.run/fal-ai/playai/tts/dialog";

    const payload: Record<string, unknown> = { input };
    if (voices) {
      payload.voices = voices;
    }
    if (response_format) {
      payload.response_format = response_format;
    }
    if (typeof seed === "number") {
      payload.seed = seed;
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
      audio?: {
        url?: string;
        content_type?: string;
        duration?: number;
        file_name?: string;
        file_size?: number;
      };
    } = await response.json();

    const audio = data.audio;
    if (!audio?.url) {
      throw new Error("FAL response did not include an audio URL");
    }

    return {
      audioUrl: audio.url,
      contentType: audio.content_type || "audio/mpeg",
      duration: audio.duration,
      fileName: audio.file_name,
      fileSize: audio.file_size,
      source: "fal-ai/playai/tts/dialog",
    };
  },
});
