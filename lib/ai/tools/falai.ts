import { tool } from "ai";
import { z } from "zod";

export const falAI = tool({
  description:
    "Use Fal AI to generate content. You would have to render it using markdown syntax.",
  inputSchema: z.object({
    prompt: z.string(),
  }),
  execute: ({ prompt: _prompt }) => {
    return {
      imageUrl: "/images/demo-thumbnail.png",
      alt: "Placeholder image",
      source: "hardcoded",
    };
  },
});
