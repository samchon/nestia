import OpenAI from "openai";

import { NestiaAgentDefaultPrompt } from "../internal/NestiaAgentDefaultPrompt";
import { NestiaAgentSystemPrompt } from "../internal/NestiaAgentSystemPrompt";
import { INestiaAgentContext } from "../structures/INestiaAgentContext";
import { INestiaAgentPrompt } from "../structures/INestiaAgentPrompt";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptDescribeFunctionAgent {
  export const execute = async (
    ctx: INestiaAgentContext,
    histories: INestiaAgentPrompt.IExecute[],
  ): Promise<INestiaAgentPrompt.IDescribe[]> => {
    if (histories.length === 0) return [];
    const completion: OpenAI.ChatCompletion = await ctx.request("describe", {
      messages: [
        // COMMON SYSTEM PROMPT
        {
          role: "system",
          content: NestiaAgentDefaultPrompt.write(ctx.config),
        } satisfies OpenAI.ChatCompletionSystemMessageParam,
        // FUNCTION CALLING HISTORIES
        ...histories.map(ChatGptHistoryDecoder.decode).flat(),
        // SYTEM PROMPT
        {
          role: "assistant",
          content:
            ctx.config?.systemPrompt?.describe?.(histories) ??
            NestiaAgentSystemPrompt.DESCRIBE,
        },
      ],
    });
    const descriptions: INestiaAgentPrompt.IDescribe[] = completion.choices
      .map((choice) =>
        choice.message.role === "assistant" && !!choice.message.content?.length
          ? choice.message.content
          : null,
      )
      .filter((str) => str !== null)
      .map(
        (content) =>
          ({
            type: "describe",
            executions: histories,
            text: content,
          }) satisfies INestiaAgentPrompt.IDescribe,
      );
    for (const describe of descriptions) await ctx.dispatch(describe);
    return descriptions;
  };
}
