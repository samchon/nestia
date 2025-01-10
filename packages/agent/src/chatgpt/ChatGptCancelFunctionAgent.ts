import { IHttpLlmFunction, ILlmApplication } from "@samchon/openapi";
import OpenAI from "openai";
import typia, { IValidation } from "typia";
import { v4 } from "uuid";

import { NestiaAgentConstant } from "../internal/NestiaAgentConstant";
import { NestiaAgentDefaultPrompt } from "../internal/NestiaAgentDefaultPrompt";
import { NestiaAgentPromptFactory } from "../internal/NestiaAgentPromptFactory";
import { NestiaAgentSystemPrompt } from "../internal/NestiaAgentSystemPrompt";
import { INestiaAgentContext } from "../structures/INestiaAgentContext";
import { INestiaAgentController } from "../structures/INestiaAgentController";
import { INestiaAgentEvent } from "../structures/INestiaAgentEvent";
import { INestiaAgentOperation } from "../structures/INestiaAgentOperation";
import { INestiaAgentOperationSelection } from "../structures/INestiaAgentOperationSelection";
import { INestiaAgentPrompt } from "../structures/INestiaAgentPrompt";
import { __IChatCancelFunctionsApplication } from "../structures/internal/__IChatCancelFunctionsApplication";
import { __IChatFunctionReference } from "../structures/internal/__IChatFunctionReference";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptCancelFunctionAgent {
  export const execute = async (
    ctx: INestiaAgentContext,
  ): Promise<INestiaAgentPrompt.ICancel[]> => {
    if (ctx.operations.divided === undefined)
      return step(ctx, ctx.operations.array, 0);

    const stacks: INestiaAgentOperationSelection[][] =
      ctx.operations.divided.map(() => []);
    const events: INestiaAgentEvent[] = [];
    const prompts: INestiaAgentPrompt.ICancel[][] = await Promise.all(
      ctx.operations.divided.map((operations, i) =>
        step(
          {
            ...ctx,
            stack: stacks[i]!,
            dispatch: async (e) => {
              events.push(e);
            },
          },
          operations,
          0,
        ),
      ),
    );

    // NO FUNCTION SELECTION, SO THAT ONLY TEXT LEFT
    if (stacks.every((s) => s.length === 0)) return prompts[0]!;
    // ELITICISM
    else if ((ctx.config?.eliticism ?? NestiaAgentConstant.ELITICISM) === true)
      return step(
        ctx,
        stacks
          .flat()
          .map(
            (s) =>
              ctx.operations.group
                .get(s.controller.name)!
                .get(s.function.name)!,
          ),
        0,
      );

    // RE-COLLECT SELECT FUNCTION EVENTS
    const collection: INestiaAgentPrompt.ICancel = {
      id: v4(),
      type: "cancel",
      operations: [],
    };
    for (const e of events)
      if (e.type === "select") {
        collection.operations.push(
          NestiaAgentPromptFactory.selection({
            protocol: e.operation.protocol as "http",
            controller: e.operation.controller as INestiaAgentController.IHttp,
            function: e.operation.function as IHttpLlmFunction<"chatgpt">,
            reason: e.reason,
            name: e.operation.name,
          }),
        );
        await cancelFunction(ctx, {
          name: e.operation.name,
          reason: e.reason,
        });
      }
    return [collection];
  };

  export const cancelFunction = async (
    ctx: INestiaAgentContext,
    reference: __IChatFunctionReference,
  ): Promise<INestiaAgentOperationSelection | null> => {
    const index: number = ctx.stack.findIndex(
      (item) => item.name === reference.name,
    );
    if (index === -1) return null;

    const item: INestiaAgentOperationSelection = ctx.stack[index]!;
    ctx.stack.splice(index, 1);
    await ctx.dispatch({
      type: "cancel",
      operation: item,
      reason: reference.reason,
    });
    return item;
  };

  const step = async (
    ctx: INestiaAgentContext,
    operations: INestiaAgentOperation[],
    retry: number,
    failures?: IFailure[],
  ): Promise<INestiaAgentPrompt.ICancel[]> => {
    //----
    // EXECUTE CHATGPT API
    //----
    const completion: OpenAI.ChatCompletion = await ctx.request("cancel", {
      messages: [
        // COMMON SYSTEM PROMPT
        {
          role: "system",
          content: NestiaAgentDefaultPrompt.write(ctx.config),
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
            operations.map((op) => ({
              name: op.name,
              description: op.function.description,
              ...(op.protocol === "http"
                ? {
                    method: op.function.method,
                    path: op.function.path,
                    tags: op.function.tags,
                  }
                : {}),
            })),
          ),
        },
        // PREVIOUS HISTORIES
        ...ctx.histories.map(ChatGptHistoryDecoder.decode).flat(),
        // USER INPUT
        {
          role: "user",
          content: ctx.prompt.text,
        },
        // SYTEM PROMPT
        {
          role: "system",
          content:
            ctx.config?.systemPrompt?.cancel?.(ctx.histories) ??
            NestiaAgentSystemPrompt.CANCEL,
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
    });

    //----
    // VALIDATION
    //----
    if (retry++ < (ctx.config?.retry ?? NestiaAgentConstant.RETRY)) {
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
      if (failures.length > 0) return step(ctx, operations, retry, failures);
    }

    //----
    // PROCESS COMPLETION
    //----
    const prompts: INestiaAgentPrompt.ICancel[] = [];
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
            const collection: INestiaAgentPrompt.ICancel = {
              id: tc.id,
              type: "cancel",
              operations: [],
            };
            for (const reference of input.functions) {
              const operation = await cancelFunction(ctx, reference);
              if (operation !== null) collection.operations.push(operation);
            }
            if (collection.operations.length !== 0) prompts.push(collection);
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
