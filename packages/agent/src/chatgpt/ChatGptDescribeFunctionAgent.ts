import OpenAI from "openai";

import { NestiaChatAgent } from "../NestiaChatAgent";
import { NestiaChatAgentCostAggregator } from "../internal/NestiaChatAgentCostAggregator";
import { NestiaChatAgentDefaultPrompt } from "../internal/NestiaChatAgentDefaultPrompt";
import { NestiaChatAgentSystemPrompt } from "../internal/NestiaChatAgentSystemPrompt";
import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { INestiaChatTokenUsage } from "../structures/INestiaChatTokenUsage";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptDescribeFunctionAgent {
  export interface IProps {
    service: IChatGptService;
    histories: INestiaChatPrompt.IExecute[];
    usage: INestiaChatTokenUsage;
    config?: NestiaChatAgent.IConfig;
  }

  export const execute = async (
    props: IProps,
  ): Promise<INestiaChatPrompt.IDescribe[]> => {
    if (props.histories.length === 0) return [];

    const completion: OpenAI.ChatCompletion =
      await props.service.api.chat.completions.create(
        {
          model: props.service.model,
          messages: [
            // COMMON SYSTEM PROMPT
            {
              role: "system",
              content: NestiaChatAgentDefaultPrompt.write(props.config),
            } satisfies OpenAI.ChatCompletionSystemMessageParam,
            // PREVIOUS FUNCTION CALLING HISTORIES
            ...props.histories.map(ChatGptHistoryDecoder.decode).flat(),
            // SYTEM PROMPT
            {
              role: "assistant",
              content:
                props.config?.systemPrompt?.describe?.(props.histories) ??
                NestiaChatAgentSystemPrompt.DESCRIBE,
            },
          ],
        },
        props.service.options,
      );
    NestiaChatAgentCostAggregator.aggregate(props.usage, completion);

    return completion.choices
      .map((choice) =>
        choice.message.role === "assistant" && !!choice.message.content?.length
          ? choice.message.content
          : null,
      )
      .filter((str) => str !== null)
      .map((content) => ({
        kind: "describe",
        executions: props.histories,
        text: content,
      }));
  };
}
