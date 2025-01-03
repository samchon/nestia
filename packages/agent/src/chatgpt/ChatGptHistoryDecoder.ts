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
        role: "tool",
        tool_call_id: history.id,
        content: [
          "You A.I. agent has called a function by tool calling.",
          "Here is the metadata of the function.",
          "",
          "```json",
          JSON.stringify(
            {
              name: history.function.name,
              description: history.function.description,
              parameters: history.function.parameters,
            },
            null,
            2,
          ),
          "```",
          "And as a result of the tool calling, you have assigned the following arguments.",
          "",
          "```json",
          JSON.stringify(history.input, null, 2),
          "```",
          "",
          "At last, the actual function returned the below value.",
          "",
          "```json",
          JSON.stringify(history.response, null, 2),
          "```",
        ].join("\n"),
      },
    ];
  };
}
