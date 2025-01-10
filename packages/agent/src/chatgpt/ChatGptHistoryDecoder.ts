import OpenAI from "openai";

import { INestiaAgentPrompt } from "../structures/INestiaAgentPrompt";

export namespace ChatGptHistoryDecoder {
  export const decode = (
    history: INestiaAgentPrompt,
  ): OpenAI.ChatCompletionMessageParam[] => {
    // NO NEED TO DECODE DESCRIBE
    if (history.type === "describe") return [];
    else if (history.type === "text")
      return [
        {
          role: history.role,
          content: history.text,
        },
      ];
    else if (history.type === "select" || history.type === "cancel")
      return [
        {
          role: "assistant",
          tool_calls: [
            {
              type: "function",
              id: history.id,
              function: {
                name: `${history.type}Functions`,
                arguments: JSON.stringify({
                  functions: history.operations.map((t) => ({
                    name: t.function.name,
                    reason: t.reason,
                  })),
                }),
              },
            },
          ],
        },
        {
          role: "tool",
          tool_call_id: history.id,
          content: "",
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
        content: JSON.stringify({
          function: {
            protocol: history.protocol,
            description: history.function.description,
            parameters: history.function.parameters,
            output: history.function.output,
            ...(history.protocol === "http"
              ? {
                  method: history.function.method,
                  path: history.function.path,
                }
              : {}),
          },
          ...(history.protocol === "http"
            ? {
                status: history.value.status,
                data: history.value.body,
              }
            : {
                value: history.value,
              }),
        }),
      },
    ];
  };
}
