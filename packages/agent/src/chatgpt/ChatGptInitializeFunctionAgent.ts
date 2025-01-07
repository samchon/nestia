import { ILlmFunction } from "@samchon/openapi";
import OpenAI from "openai";
import typia from "typia";

import { NestiaChatAgent } from "../NestiaChatAgent";
import { NestiaChatAgentCostAggregator } from "../internal/NestiaChatAgentCostAggregator";
import { NestiaChatAgentDefaultPrompt } from "../internal/NestiaChatAgentDefaultPrompt";
import { NestiaChatAgentSystemPrompt } from "../internal/NestiaChatAgentSystemPrompt";
import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatCost } from "../structures/INestiaChatCost";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { __IChatInitialApplication } from "../structures/internal/__IChatInitialApplication";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptInitializeFunctionAgent {
  export interface IProps {
    service: IChatGptService;
    histories: INestiaChatPrompt[];
    content: string;
    cost: INestiaChatCost;
    config?: NestiaChatAgent.IConfig | undefined;
  }
  export interface IOutput {
    mounted: boolean;
    prompts: INestiaChatPrompt[];
  }

  export const execute = async (props: IProps): Promise<IOutput> => {
    //----
    // EXECUTE CHATGPT API
    //----
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
            // PREVIOUS HISTORIES
            ...props.histories.map(ChatGptHistoryDecoder.decode).flat(),
            // USER INPUT
            {
              role: "user",
              content: props.content,
            },
            {
              // SYTEM PROMPT
              role: "system",
              content:
                props.config?.systemPrompt?.initialize?.(props.histories) ??
                NestiaChatAgentSystemPrompt.INITIALIZE,
            },
          ],
          // GETTER FUNCTION
          tools: [
            {
              type: "function",
              function: {
                name: FUNCTION.name,
                description: FUNCTION.description,
                parameters: FUNCTION.parameters as any,
              },
            },
          ],
          tool_choice: "auto",
          parallel_tool_calls: false,
        },
        props.service.options,
      );
    NestiaChatAgentCostAggregator.aggregate(props.cost, completion);

    //----
    // PROCESS COMPLETION
    //----
    const prompts: INestiaChatPrompt[] = [];
    for (const choice of completion.choices) {
      if (
        choice.message.role === "assistant" &&
        !!choice.message.content?.length
      )
        prompts.push({
          kind: "text",
          role: "assistant",
          text: choice.message.content,
        });
    }
    return {
      mounted: completion.choices.some(
        (c) =>
          !!c.message.tool_calls?.some(
            (tc) =>
              tc.type === "function" && tc.function.name === FUNCTION.name,
          ),
      ),
      prompts,
    };
  };
}

const FUNCTION: ILlmFunction<"chatgpt"> = typia.llm.application<
  __IChatInitialApplication,
  "chatgpt"
>().functions[0]!;
