import OpenAI from "openai";

import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";

export namespace ChatGptHistoryDecoder {
  export const decode = (
    history: INestiaChatPrompt,
  ): OpenAI.ChatCompletionMessageParam[] => {
    if (history.kind === "text")
      return [
        {
          role: history.role,
          content: history.text,
        },
      ];
    return [
      {
        role: "assistant",
        tool_calls: [
          {
            type: "function",
            id: history.id,
            function: {
              name: history.function.name,
              arguments: JSON.stringify(history.arguments),
            },
          },
        ],
      },
      {
        role: "tool",
        tool_call_id: history.id,
        content:
          typeof history.response.body === "string"
            ? history.response.body
            : JSON.stringify(history.response.body),
      },
    ];
  };
}
