import {
  IHttpLlmApplication,
  IHttpLlmFunction,
  ILlmApplication,
} from "@samchon/openapi";
import OpenAI from "openai";
import typia from "typia";

import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatEvent } from "../structures/INestiaChatEvent";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { INestiaChatTextPrompt } from "../structures/INestiaChatTextPrompt";
import { __IChatFunctionReference } from "../structures/internal/__IChatFunctionReference";
import { __IChatSelectionApplication } from "../structures/internal/__IChatSelectionApplication";
import { MapUtil } from "../utils/MapUtil";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptFunctionSelector {
  export interface IProps {
    application: IHttpLlmApplication<"chatgpt">;
    service: IChatGptService;
    histories: INestiaChatPrompt[];
    stack: Map<string, IStackItem>;
    dispatch: (event: INestiaChatEvent) => void;
    content: string;
    completion?: { value: OpenAI.ChatCompletion };
    divide?: IHttpLlmFunction<"chatgpt">[][];
    eliticism?: boolean;
  }
  export interface IStackItem {
    function: IHttpLlmFunction<"chatgpt">;
    count: number;
  }

  export const execute = async (
    props: IProps,
  ): Promise<INestiaChatTextPrompt[]> => {
    if (props.divide === undefined)
      return step(props, props.application.functions);

    const stacks: Map<string, IStackItem>[] = props.divide.map(() => new Map());
    const events: INestiaChatEvent[] = [];
    const prompts: INestiaChatTextPrompt[][] = await Promise.all(
      props.divide.map((candidates, i) =>
        step(
          {
            ...props,
            stack: stacks[i]!,
            dispatch: (e) => events.push(e),
          },
          candidates,
        ),
      ),
    );
    if (stacks.every((s) => s.size === 0)) return prompts[0]!;
    else if (props.eliticism === true)
      return step(
        props,
        stacks.map((s) => Array.from(s.values()).map((s) => s.function)).flat(),
      );

    for (const e of events)
      if (e.type === "select")
        selectFunction({
          application: props.application,
          stack: props.stack,
          dispatch: props.dispatch,
          reference: {
            name: e.function.name,
            reason: "reselect",
          },
        });
      else if (e.type === "cancel")
        cancelFunction({
          stack: props.stack,
          dispatch: props.dispatch,
          reference: {
            name: e.function.name,
            reason: "reselect",
          },
        });
    return [];
  };

  const step = async (
    props: IProps,
    candidates: IHttpLlmFunction<"chatgpt">[],
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
                "You are a helpful assistant for selecting functions to call.",
                "",
                "Use the supplied tools to select some functions of `getApiFunctions()` returned",
              ].join("\n"),
            },
            // CANDIDATE FUNCTIONS
            {
              role: "assistant",
              tool_calls: [
                {
                  type: "function",
                  id: "getApiFunctions",
                  function: {
                    name: "getApiFunctions",
                    arguments: JSON.stringify({}),
                  },
                },
              ],
            },
            {
              role: "tool",
              tool_call_id: "getApiFunctions",
              content: JSON.stringify(
                candidates.map((func) => ({
                  name: func.name,
                  description: func.description,
                })),
              ),
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
          parallel_tool_calls: false,
        },
        props.service.options,
      );
    if (props.completion) props.completion.value = completion;

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
          if (typia.is<__IChatFunctionReference.IProps>(input) === false)
            continue;
          if (tc.function.name === "selectFunction")
            for (const reference of input.functions)
              selectFunction({
                application: props.application,
                stack: props.stack,
                dispatch: props.dispatch,
                reference,
              });
          else if (tc.function.name === "cancelFunction")
            for (const reference of input.functions)
              cancelFunction({
                stack: props.stack,
                dispatch: props.dispatch,
                reference,
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
    application: IHttpLlmApplication<"chatgpt">;
    stack: Map<string, IStackItem>;
    reference: __IChatFunctionReference;
    dispatch: (event: INestiaChatEvent.ISelectFunctionEvent) => void;
  }): void => {
    const func: IHttpLlmFunction<"chatgpt"> | undefined =
      props.application.functions.find(
        (func) => func.name === props.reference.name,
      );
    if (func === undefined) return;

    const item: IStackItem = MapUtil.take(
      props.stack,
      props.reference.name,
      () => ({
        function: func,
        count: 0,
      }),
    );
    ++item.count;

    props.dispatch({
      type: "select",
      function: func,
      reason: props.reference.reason,
    });
  };

  export const cancelFunction = (props: {
    stack: Map<string, IStackItem>;
    reference: __IChatFunctionReference;
    dispatch: (event: INestiaChatEvent.ICancelFunctionEvent) => void;
  }): void => {
    const item: IStackItem | undefined = props.stack.get(props.reference.name);
    if (item === undefined) return;
    else if (--item.count === 0) props.stack.delete(props.reference.name);

    props.dispatch({
      type: "cancel",
      function: item.function,
      reason: props.reference.reason,
    });
  };
}

const CONTAINER: ILlmApplication<"chatgpt"> = typia.llm.application<
  __IChatSelectionApplication,
  "chatgpt"
>();
