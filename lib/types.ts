import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { briaBackgroundRemove } from "./ai/tools/bria-background-remove";
import type { fastLightningSDXL } from "./ai/tools/fast-lightning-sdxl";
import type { fastSvdLcm } from "./ai/tools/fast-svd-lcm";
import type { getWeather } from "./ai/tools/get-weather";
import type { nanoBananaEdit } from "./ai/tools/nano-banana-edit";
import type { playaiTtsDialog } from "./ai/tools/playai-tts-dialog";
import type { recraftV3TextToImage } from "./ai/tools/recraft-v3-text-to-image";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type fastLightningSDXLTool = InferUITool<typeof fastLightningSDXL>;
type fastSvdLcmTool = InferUITool<typeof fastSvdLcm>;
type nanoBananaEditTool = InferUITool<typeof nanoBananaEdit>;
type briaBackgroundRemoveTool = InferUITool<typeof briaBackgroundRemove>;
type playaiTtsDialogTool = InferUITool<typeof playaiTtsDialog>;
type recraftV3TextToImageTool = InferUITool<typeof recraftV3TextToImage>;

export type ChatTools = {
  getWeather: weatherTool;
  fastLightningSDXL: fastLightningSDXLTool;
  fastSvdLcm: fastSvdLcmTool;
  nanoBananaEdit: nanoBananaEditTool;
  briaBackgroundRemove: briaBackgroundRemoveTool;
  playaiTtsDialog: playaiTtsDialogTool;
  recraftV3TextToImage: recraftV3TextToImageTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
