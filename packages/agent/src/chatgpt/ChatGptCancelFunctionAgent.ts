import {
  IHttpLlmApplication,
  IHttpLlmFunction,
  ILlmApplication,
} from "@samchon/openapi";
import OpenAI from "openai";
import typia, { IValidation } from "typia";
import { v4 } from "uuid";

import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatEvent } from "../structures/INestiaChatEvent";
import { INestiaChatFunctionSelection } from "../structures/INestiaChatFunctionSelection";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { __IChatCancelFunctionsApplication } from "../structures/internal/__IChatCancelFunctionsApplication";
import { __IChatFunctionReference } from "../structures/internal/__IChatFunctionReference";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptCancelFunctionAgent {
  export interface IProps {
    retry: number;
    application: IHttpLlmApplication<"chatgpt">;
    service: IChatGptService;
    histories: INestiaChatPrompt[];
    stack: INestiaChatFunctionSelection[];
    dispatch: (event: INestiaChatEvent) => Promise<void>;
    content: string;
    divide?: IHttpLlmFunction<"chatgpt">[][];
    eliticism?: boolean;
  }

  export const execute = async (
    props: IProps,
  ): Promise<INestiaChatPrompt.ICancel[]> => {
    if (props.divide === undefined)
      return step(props, props.application.functions, 0);

    const stacks: INestiaChatFunctionSelection[][] = props.divide.map(() => []);
    const events: INestiaChatEvent[] = [];
    const prompts: INestiaChatPrompt.ICancel[][] = await Promise.all(
      props.divide.map((candidates, i) =>
        step(
          {
            ...props,
            stack: stacks[i]!,
            dispatch: async (e) => {
              events.push(e);
            },
          },
          candidates,
          0,
        ),
      ),
    );

    // NO FUNCTION SELECTION, SO THAT ONLY TEXT LEFT
    if (stacks.every((s) => s.length === 0)) return prompts[0]!;
    // ELITICISM
    else if (props.eliticism === true)
      return step(
        props,
        stacks
          .map((row) => Array.from(row.values()).map((s) => s.function))
          .flat(),
        0,
      );

    // RE-COLLECT SELECT FUNCTION EVENTS
    const collection: INestiaChatPrompt.ICancel = {
      id: v4(),
      kind: "cancel",
      functions: [],
    };
    for (const e of events)
      if (e.type === "select") {
        collection.functions.push({
          function: e.function,
          reason: e.reason,
        });
        await cancelFunction({
          stack: props.stack,
          dispatch: props.dispatch,
          reference: {
            name: e.function.name,
            reason: e.reason,
          },
        });
      }
    return [collection];
  };

  export const cancelFunction = async (props: {
    stack: INestiaChatFunctionSelection[];
    reference: __IChatFunctionReference;
    dispatch: (event: INestiaChatEvent.ICancelFunctionEvent) => Promise<void>;
  }): Promise<IHttpLlmFunction<"chatgpt"> | null> => {
    const index: number = props.stack.findIndex(
      (item) => item.function.name === props.reference.name,
    );
    if (index === -1) return null;

    const item: INestiaChatFunctionSelection = props.stack[index]!;
    props.stack.splice(index, 1);
    await props.dispatch({
      type: "cancel",
      function: item.function,
      reason: props.reference.reason,
    });
    return item.function;
  };

  const step = async (
    props: IProps,
    candidates: IHttpLlmFunction<"chatgpt">[],
    retry: number,
    failures?: IFailure[],
  ): Promise<INestiaChatPrompt.ICancel[]> => {
    //----
    // EXECUTE CHATGPT API
    //----
    const completion: OpenAI.ChatCompletion =
      await props.service.api.chat.completions.create(
        {
          model: props.service.model,
          messages: [
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
            // SYTEM PROMPT
            {
              role: "system",
              content: SYSTEM_MESSAGE_OF_ROLE,
            },
            // TYPE CORRECTIONS
            ...emendMessages(failures ?? []),
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
    // VALIDATION
    //----
    if (retry++ < props.retry) {
      const failures: IFailure[] = [];
      for (const choice of completion.choices)
        for (const tc of choice.message.tool_calls ?? []) {
          if (tc.function.name !== "cancelFunctions") continue;
          const input: object = JSON.parse(tc.function.arguments);
          const validation: IValidation<__IChatFunctionReference.IProps> =
            typia.validate<__IChatFunctionReference.IProps>(input);
          if (validation.success === false)
            failures.push({
              id: tc.id,
              name: tc.function.name,
              validation,
            });
        }
      if (failures.length > 0) return step(props, candidates, retry, failures);
    }

    //----
    // PROCESS COMPLETION
    //----
    const prompts: INestiaChatPrompt.ICancel[] = [];
    for (const choice of completion.choices) {
      // TOOL CALLING HANDLER
      if (choice.message.tool_calls)
        for (const tc of choice.message.tool_calls) {
          if (tc.type !== "function") continue;
          const input: __IChatFunctionReference.IProps = JSON.parse(
            tc.function.arguments,
          );
          if (typia.is(input) === false) continue;
          else if (tc.function.name === "cancelFunctions") {
            const collection: INestiaChatPrompt.ICancel = {
              id: tc.id,
              kind: "cancel",
              functions: [],
            };
            for (const reference of input.functions) {
              const func: IHttpLlmFunction<"chatgpt"> | null =
                await cancelFunction({
                  stack: props.stack,
                  dispatch: props.dispatch,
                  reference,
                });
              if (func !== null)
                collection.functions.push({
                  function: func,
                  reason: reference.reason,
                });
            }
            if (collection.functions.length !== 0) prompts.push(collection);
          }
        }
    }
    return prompts;
  };

  const emendMessages = (
    failures: IFailure[],
  ): OpenAI.ChatCompletionMessageParam[] =>
    failures
      .map((f) => [
        {
          role: "assistant",
          tool_calls: [
            {
              type: "function",
              id: f.id,
              function: {
                name: f.name,
                arguments: JSON.stringify(f.validation.data),
              },
            },
          ],
        } satisfies OpenAI.ChatCompletionAssistantMessageParam,
        {
          role: "tool",
          content: JSON.stringify(f.validation.errors),
          tool_call_id: f.id,
        } satisfies OpenAI.ChatCompletionToolMessageParam,
        {
          role: "system",
          content: [
            "You A.I. assistant has composed wrong typed arguments.",
            "",
            "Correct it at the next function calling.",
          ].join("\n"),
        } satisfies OpenAI.ChatCompletionSystemMessageParam,
      ])
      .flat();
}

const CONTAINER: ILlmApplication<"chatgpt"> = typia.llm.application<
  __IChatCancelFunctionsApplication,
  "chatgpt"
>();

interface IFailure {
  id: string;
  name: string;
  validation: IValidation.IFailure;
}

const SYSTEM_MESSAGE_OF_ROLE: string = [
  "You are a helpful assistant for selecting functions to call.",
  "",
  "Use the supplied tools to select some functions of `getApiFunctions()` returned",
  "",
  "If you can't find any proper function to select, just type your own message.",
].join("\n");
