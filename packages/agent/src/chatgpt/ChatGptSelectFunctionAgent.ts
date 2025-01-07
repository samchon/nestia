import {
  IHttpLlmApplication,
  IHttpLlmFunction,
  ILlmApplication,
} from "@samchon/openapi";
import OpenAI from "openai";
import typia, { IValidation } from "typia";
import { v4 } from "uuid";

import { NestiaChatAgent } from "../NestiaChatAgent";
import { NestiaChatAgentConstant } from "../internal/NestiaChatAgentConstant";
import { NestiaChatAgentDefaultPrompt } from "../internal/NestiaChatAgentDefaultPrompt";
import { NestiaChatAgentSystemPrompt } from "../internal/NestiaChatAgentSystemPrompt";
import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatEvent } from "../structures/INestiaChatEvent";
import { INestiaChatFunctionSelection } from "../structures/INestiaChatFunctionSelection";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { __IChatFunctionReference } from "../structures/internal/__IChatFunctionReference";
import { __IChatSelectFunctionsApplication } from "../structures/internal/__IChatSelectFunctionsApplication";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptSelectFunctionAgent {
  export interface IProps {
    application: IHttpLlmApplication<"chatgpt">;
    service: IChatGptService;
    histories: INestiaChatPrompt[];
    stack: INestiaChatFunctionSelection[];
    dispatch: (event: INestiaChatEvent) => Promise<void>;
    content: string;
    config?: NestiaChatAgent.IConfig;
    divide?: IHttpLlmFunction<"chatgpt">[][];
    completions?: OpenAI.ChatCompletion[];
  }

  export const execute = async (
    props: IProps,
  ): Promise<INestiaChatPrompt[]> => {
    if (props.divide === undefined)
      return step(props, props.application.functions, 0);

    const stacks: INestiaChatFunctionSelection[][] = props.divide.map(() => []);
    const events: INestiaChatEvent[] = [];
    const prompts: INestiaChatPrompt[][] = await Promise.all(
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
    else if (
      (props.config?.eliticism ?? NestiaChatAgentConstant.ELITICISM) === true
    )
      return step(
        props,
        stacks
          .map((row) => Array.from(row.values()).map((s) => s.function))
          .flat(),
        0,
      );

    // RE-COLLECT SELECT FUNCTION EVENTS
    const collection: INestiaChatPrompt.ISelect = {
      id: v4(),
      kind: "select",
      functions: [],
    };
    for (const e of events)
      if (e.type === "select") {
        collection.functions.push({
          function: e.function,
          reason: e.reason,
        });
        await selectFunction({
          application: props.application,
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

  const step = async (
    props: IProps,
    candidates: IHttpLlmFunction<"chatgpt">[],
    retry: number,
    failures?: IFailure[],
  ): Promise<INestiaChatPrompt[]> => {
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
              content: NestiaChatAgentSystemPrompt.SELECT,
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
          parallel_tool_calls: false,
        },
        props.service.options,
      );
    if (props.completions !== undefined) props.completions.push(completion);

    //----
    // VALIDATION
    //----
    if (retry++ < (props.config?.retry ?? NestiaChatAgentConstant.RETRY)) {
      const failures: IFailure[] = [];
      for (const choice of completion.choices)
        for (const tc of choice.message.tool_calls ?? []) {
          if (tc.function.name !== "selectFunctions") continue;
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
    const prompts: INestiaChatPrompt[] = [];
    for (const choice of completion.choices) {
      // TOOL CALLING HANDLER
      if (choice.message.tool_calls)
        for (const tc of choice.message.tool_calls) {
          if (tc.type !== "function") continue;

          const input: __IChatFunctionReference.IProps = JSON.parse(
            tc.function.arguments,
          );
          if (typia.is(input) === false) continue;
          else if (tc.function.name === "selectFunctions") {
            const collection: INestiaChatPrompt.ISelect = {
              id: tc.id,
              kind: "select",
              functions: [],
            };
            for (const reference of input.functions) {
              const func: IHttpLlmFunction<"chatgpt"> | null =
                await selectFunction({
                  application: props.application,
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

  const selectFunction = async (props: {
    application: IHttpLlmApplication<"chatgpt">;
    stack: INestiaChatFunctionSelection[];
    reference: __IChatFunctionReference;
    dispatch: (event: INestiaChatEvent.ISelectFunctionEvent) => Promise<void>;
  }): Promise<IHttpLlmFunction<"chatgpt"> | null> => {
    const func: IHttpLlmFunction<"chatgpt"> | undefined =
      props.application.functions.find(
        (func) => func.name === props.reference.name,
      );
    if (func === undefined) return null;

    props.stack.push({
      function: func,
      reason: props.reference.reason,
    });
    await props.dispatch({
      type: "select",
      function: func,
      reason: props.reference.reason,
    });
    return func;
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
  __IChatSelectFunctionsApplication,
  "chatgpt"
>();

interface IFailure {
  id: string;
  name: string;
  validation: IValidation.IFailure;
}
