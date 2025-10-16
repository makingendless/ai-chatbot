import equal from "fast-deep-equal";
import { memo } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import { Badge } from "@/components/ui/badge";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { Action, Actions } from "./elements/actions";
import { CopyIcon, PencilEditIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  setMode,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMode?: (mode: "view" | "edit") => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  const getToolDisplayName = (name: string) => {
    const map: Record<string, string> = {
      getWeather: "Get Weather",
      fastLightningSDXL: "Fast Lightning SDXL",
      fastSvdLcm: "Fast SVD LCM",
      nanoBananaEdit: "Nano Banana Edit",
      briaBackgroundRemove: "Bria Background Remove",
      playaiTtsDialog: "PlayAI TTS Dialog",
      recraftV3TextToImage: "Recraft V3 Text to Image",
      createDocument: "Create Document",
      updateDocument: "Update Document",
      requestSuggestions: "Request Suggestions",
    };
    return map[name] || name;
  };

  const getToolEmoji = (name: string) => {
    const map: Record<string, string> = {
      getWeather: "🌤️",
      fastLightningSDXL: "⚡️🖼️",
      fastSvdLcm: "⚙️🖼️",
      nanoBananaEdit: "🍌✏️",
      briaBackgroundRemove: "🪄",
      playaiTtsDialog: "🔊",
      recraftV3TextToImage: "🎨",
      createDocument: "📝",
      updateDocument: "✏️",
      requestSuggestions: "💡",
    };
    return map[name] || "🛠️";
  };

  const toolNames = Array.from(
    new Set(
      message.parts
        .map((part) => {
          const type = part?.type as string | undefined;
          if (typeof type === "string" && type.startsWith("tool-")) {
            return type.slice(5);
          }
          if (
            (type === "tool-result" || type === "tool-call") &&
            "toolName" in part &&
            typeof part?.toolName === "string"
          ) {
            return part.toolName as string;
          }
          return null;
        })
        .filter((v) => v !== null)
    )
  );

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!");
  };

  // User messages get edit (on hover) and copy actions
  if (message.role === "user") {
    return (
      <Actions className="-mr-0.5 justify-end">
        <div className="relative">
          {setMode && (
            <Action
              className="-left-10 absolute top-0 opacity-0 transition-opacity group-hover/message:opacity-100"
              onClick={() => setMode("edit")}
              tooltip="Edit"
            >
              <PencilEditIcon />
            </Action>
          )}
          <Action onClick={handleCopy} tooltip="Copy">
            <CopyIcon />
          </Action>
        </div>
      </Actions>
    );
  }

  return (
    <Actions className="-ml-0.5">
      <Action onClick={handleCopy} tooltip="Copy">
        <CopyIcon />
      </Action>

      <Action
        data-testid="message-upvote"
        disabled={vote?.isUpvoted}
        onClick={() => {
          const upvote = fetch("/api/vote", {
            method: "PATCH",
            body: JSON.stringify({
              chatId,
              messageId: message.id,
              type: "up",
            }),
          });

          toast.promise(upvote, {
            loading: "Upvoting Response...",
            success: () => {
              mutate<Vote[]>(
                `/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) {
                    return [];
                  }

                  const votesWithoutCurrent = currentVotes.filter(
                    (currentVote) => currentVote.messageId !== message.id
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: true,
                    },
                  ];
                },
                { revalidate: false }
              );

              return "Upvoted Response!";
            },
            error: "Failed to upvote response.",
          });
        }}
        tooltip="Upvote Response"
      >
        <ThumbUpIcon />
      </Action>

      <Action
        data-testid="message-downvote"
        disabled={vote && !vote.isUpvoted}
        onClick={() => {
          const downvote = fetch("/api/vote", {
            method: "PATCH",
            body: JSON.stringify({
              chatId,
              messageId: message.id,
              type: "down",
            }),
          });

          toast.promise(downvote, {
            loading: "Downvoting Response...",
            success: () => {
              mutate<Vote[]>(
                `/api/vote?chatId=${chatId}`,
                (currentVotes) => {
                  if (!currentVotes) {
                    return [];
                  }

                  const votesWithoutCurrent = currentVotes.filter(
                    (currentVote) => currentVote.messageId !== message.id
                  );

                  return [
                    ...votesWithoutCurrent,
                    {
                      chatId,
                      messageId: message.id,
                      isUpvoted: false,
                    },
                  ];
                },
                { revalidate: false }
              );

              return "Downvoted Response!";
            },
            error: "Failed to downvote response.",
          });
        }}
        tooltip="Downvote Response"
      >
        <ThumbDownIcon />
        {toolNames.length > 0 && (
          <div className="ml-1 flex items-center gap-1">
            {toolNames.map((name) => (
              <Badge
                className="h-8 rounded-full px-4 text-xs"
                key={name}
                variant="secondary"
              >
                <span className="mr-1">{getToolEmoji(name)}</span>
                {getToolDisplayName(name)}
              </Badge>
            ))}
          </div>
        )}
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (!equal(prevProps.message.parts, nextProps.message.parts)) {
      return false;
    }

    return true;
  }
);
