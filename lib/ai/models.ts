export const DEFAULT_CHAT_MODEL = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "Claude Sonnet 4.5",
    description: "Anthropic Claude Sonnet 4.5",
  },
  {
    id: "chat-model-reasoning",
    name: "Claude Sonnet 4.5 (Reasoning)",
    description:
      "Uses advanced chain-of-thought reasoning for complex problems",
  },
];
