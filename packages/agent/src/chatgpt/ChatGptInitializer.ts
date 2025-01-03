import { ILlmFunction } from "@samchon/openapi";
import OpenAI from "openai";
import typia from "typia";

import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { __IChatInitialApplication } from "../structures/internal/__IChatInitialApplication";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptInitializer {
  export interface IProps {
    service: IChatGptService;
    histories: INestiaChatPrompt[];
    content: string;
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
            {
              // SYTEM PROMPT
              role: "system",
              content: [
                "You are a helpful assistant.",
                "Use the supplied tools to assist the user.",
              ].join("\n"),
            },
            // PREVIOUS HISTORIES
            ...props.histories.map(ChatGptHistoryDecoder.decode).flat(),
            // USER INPUT
            {
              role: "user",
              content: props.content,
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
