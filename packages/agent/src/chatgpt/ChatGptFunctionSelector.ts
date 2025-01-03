import {
  IHttpLlmApplication,
  IHttpLlmFunction,
  ILlmApplication,
} from "@samchon/openapi";
import OpenAI from "openai";
import typia from "typia";

import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { INestiaChatTextPrompt } from "../structures/INestiaChatTextPrompt";
import { __IChatSelectionApplication } from "../structures/internal/__IChatSelectionApplication";
import { MapUtil } from "../utils/MapUtil";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptFunctionSelector {
  export interface IProps {
    application: IHttpLlmApplication<"chatgpt">;
    service: IChatGptService;
    histories: INestiaChatPrompt[];
    stack: Map<string, IStackItem>;
    content: string;
  }
  export interface IStackItem {
    function: IHttpLlmFunction<"chatgpt">;
    count: number;
  }

  export const execute = async (
    props: IProps,
  ): Promise<INestiaChatTextPrompt[]> => {
    //----
    // EXECUTE CHATGPT API
    //----
    const completion: OpenAI.ChatCompletion =
      await props.service.api.chat.completions.create(
        {
          model: props.service.model,
          messages: [
            // SYTEM PROMPT
            {
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
          // STACK FUNCTIONS
          tools: CONTAINER.functions.map(
            (func) =>
              ({
                type: "function",
                function: {
                  name: func.name,
                  description: func.description,
                  parameters: func.parameters as any,
                },
              }) satisfies OpenAI.ChatCompletionTool,
          ),
          tool_choice: "auto",
          parallel_tool_calls: true,
        },
        props.service.options,
      );

    //----
    // PROCESS COMPLETION
    //----
    const prompts: INestiaChatTextPrompt[] = [];
    for (const choice of completion.choices) {
      // TOOL CALLING HANDLER
      if (choice.message.tool_calls)
        for (const tc of choice.message.tool_calls) {
          if (tc.type !== "function") continue;
          const input: object = JSON.parse(tc.function.arguments);
          if (typia.is<IStackReference>(input) === false) continue;
          if (tc.function.name === "selectFunction")
            selectFunction({
              stack: props.stack,
              reference: input,
            });
          else if (tc.function.name === "cancelFunction")
            cancelFunction({
              stack: props.stack,
              reference: input,
            });
        }

      // ASSISTANT MESSAGE
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
    return prompts;
  };

  const selectFunction = (props: {
    stack: Map<string, IStackItem>;
    reference: IStackReference;
  }): void => {
    const func: IStackItem | undefined = props.stack.get(props.reference.name);
    if (func === undefined) return;

    const item: IStackItem = MapUtil.take(
      props.stack,
      props.reference.name,
      () => ({
        function: func.function,
        count: 0,
      }),
    );
    ++item.count;
  };

  const cancelFunction = (props: {
    stack: Map<string, IStackItem>;
    reference: IStackReference;
  }): void => {
    const item: IStackItem | undefined = props.stack.get(props.reference.name);
    if (item !== undefined && --item.count === 0)
      props.stack.delete(props.reference.name);
  };
}

interface IStackReference {
  name: string;
  reason: string;
}

const CONTAINER: ILlmApplication<"chatgpt"> = typia.llm.application<
  __IChatSelectionApplication,
  "chatgpt"
>();
