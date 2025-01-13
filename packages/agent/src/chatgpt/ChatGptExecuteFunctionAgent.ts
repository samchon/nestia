import {
  ChatGptTypeChecker,
  HttpLlm,
  IChatGptSchema,
  IHttpMigrateRoute,
  IHttpResponse,
} from "@samchon/openapi";
import OpenAI from "openai";
import { IValidation } from "typia";

import { NestiaAgentConstant } from "../internal/NestiaAgentConstant";
import { NestiaAgentDefaultPrompt } from "../internal/NestiaAgentDefaultPrompt";
import { NestiaAgentPromptFactory } from "../internal/NestiaAgentPromptFactory";
import { NestiaAgentSystemPrompt } from "../internal/NestiaAgentSystemPrompt";
import { INestiaAgentContext } from "../structures/INestiaAgentContext";
import { INestiaAgentEvent } from "../structures/INestiaAgentEvent";
import { INestiaAgentOperation } from "../structures/INestiaAgentOperation";
import { INestiaAgentPrompt } from "../structures/INestiaAgentPrompt";
import { ChatGptCancelFunctionAgent } from "./ChatGptCancelFunctionAgent";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptExecuteFunctionAgent {
  export const execute = async (
    ctx: INestiaAgentContext,
  ): Promise<INestiaAgentPrompt[]> => {
    //----
    // EXECUTE CHATGPT API
    //----
    const completion: OpenAI.ChatCompletion = await ctx.request("execute", {
      messages: [
        // COMMON SYSTEM PROMPT
        {
          role: "system",
          content: NestiaAgentDefaultPrompt.write(ctx.config),
        } satisfies OpenAI.ChatCompletionSystemMessageParam,
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
            ctx.config?.systemPrompt?.execute?.(ctx.histories) ??
            NestiaAgentSystemPrompt.EXECUTE,
        },
      ],
      // STACKED FUNCTIONS
      tools: ctx.stack.map(
        (op) =>
          ({
            type: "function",
            function: {
              name: op.name,
              description: op.function.description,
              parameters: (op.function.separated
                ? (op.function.separated.llm ??
                  ({
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                    $defs: {},
                  } satisfies IChatGptSchema.IParameters))
                : op.function.parameters) as Record<string, any>,
            },
          }) as OpenAI.ChatCompletionTool,
      ),
      tool_choice: "auto",
      parallel_tool_calls: false,
    });

    //----
    // PROCESS COMPLETION
    //----
    const closures: Array<
      () => Promise<
        Array<
          | INestiaAgentPrompt.IExecute
          | INestiaAgentPrompt.ICancel
          | INestiaAgentPrompt.IText
        >
      >
    > = [];
    for (const choice of completion.choices) {
      for (const tc of choice.message.tool_calls ?? []) {
        if (tc.type === "function") {
          const operation: INestiaAgentOperation | undefined =
            ctx.operations.flat.get(tc.function.name);
          if (operation === undefined) continue;
          closures.push(
            async (): Promise<
              [INestiaAgentPrompt.IExecute, INestiaAgentPrompt.ICancel]
            > => {
              const call: INestiaAgentEvent.ICall = {
                type: "call",
                id: tc.id,
                operation,
                arguments: JSON.parse(tc.function.arguments),
              };
              if (call.operation.protocol === "http")
                fillHttpArguments({
                  operation: call.operation,
                  arguments: call.arguments,
                });
              await ctx.dispatch(call);

              const execute: INestiaAgentPrompt.IExecute = await propagate(
                ctx,
                call,
                0,
              );
              await ctx.dispatch({
                type: "execute",
                id: call.id,
                operation: call.operation,
                arguments: execute.arguments,
                value: execute.value,
              });

              await ChatGptCancelFunctionAgent.cancelFunction(ctx, {
                name: call.operation.name,
                reason: "completed",
              });
              await ctx.dispatch({
                type: "cancel",
                operation: call.operation,
                reason: "complete",
              });
              return [
                execute,
                {
                  type: "cancel",
                  id: call.id,
                  operations: [
                    NestiaAgentPromptFactory.selection({
                      ...call.operation,
                      reason: "complete",
                    }),
                  ],
                } satisfies INestiaAgentPrompt.ICancel,
              ] as const;
            },
          );
        }
      }
      if (
        choice.message.role === "assistant" &&
        !!choice.message.content?.length
      )
        closures.push(async () => {
          const value: INestiaAgentPrompt.IText = {
            type: "text",
            role: "assistant",
            text: choice.message.content!,
          };
          await ctx.dispatch(value);
          return [value];
        });
    }
    return (await Promise.all(closures.map((fn) => fn()))).flat();
  };

  const propagate = async (
    ctx: INestiaAgentContext,
    call: INestiaAgentEvent.ICall,
    retry: number,
  ): Promise<INestiaAgentPrompt.IExecute> => {
    if (call.operation.protocol === "http") {
      //----
      // HTTP PROTOCOL
      //----
      try {
        // CALL HTTP API
        const response: IHttpResponse = call.operation.controller.execute
          ? await call.operation.controller.execute({
              connection: call.operation.controller.connection,
              application: call.operation.controller.application,
              function: call.operation.function,
              arguments: call.arguments,
            })
          : await HttpLlm.propagate({
              connection: call.operation.controller.connection,
              application: call.operation.controller.application,
              function: call.operation.function,
              input: call.arguments,
            });
        // CHECK STATUS
        const success: boolean =
          ((response.status === 400 ||
            response.status === 404 ||
            response.status === 422) &&
            retry++ < (ctx.config?.retry ?? NestiaAgentConstant.RETRY) &&
            typeof response.body) === false;
        // DISPATCH EVENT
        return (
          (success === false
            ? await correct(ctx, call, retry, response.body)
            : null) ??
          (await NestiaAgentPromptFactory.execute({
            type: "execute",
            protocol: "http",
            controller: call.operation.controller,
            function: call.operation.function,
            id: call.id,
            name: call.operation.name,
            arguments: call.arguments,
            value: response,
          }))
        );
      } catch (error) {
        // DISPATCH ERROR
        return NestiaAgentPromptFactory.execute({
          type: "execute",
          protocol: "http",
          controller: call.operation.controller,
          function: call.operation.function,
          id: call.id,
          name: call.operation.name,
          arguments: call.arguments,
          value: {
            status: 500,
            headers: {},
            body:
              error instanceof Error
                ? {
                    ...error,
                    name: error.name,
                    message: error.message,
                  }
                : error,
          },
        });
      }
    } else {
      //----
      // CLASS FUNCTION
      //----
      // VALIDATE FIRST
      const check: IValidation<unknown> = call.operation.function.validate(
        call.arguments,
      );
      if (check.success === false)
        return (
          (retry++ < (ctx.config?.retry ?? NestiaAgentConstant.RETRY)
            ? await correct(ctx, call, retry, check.errors)
            : null) ??
          NestiaAgentPromptFactory.execute({
            type: "execute",
            protocol: "class",
            controller: call.operation.controller,
            function: call.operation.function,
            id: call.id,
            name: call.operation.name,
            arguments: call.arguments,
            value: {
              name: "TypeGuardError",
              message: "Invalid arguments.",
              errors: check.errors,
            },
          })
        );
      // EXECUTE FUNCTION
      try {
        const value: any = await call.operation.controller.execute({
          application: call.operation.controller.application,
          function: call.operation.function,
          arguments: call.arguments,
        });
        return NestiaAgentPromptFactory.execute({
          type: "execute",
          protocol: "class",
          controller: call.operation.controller,
          function: call.operation.function,
          id: call.id,
          name: call.operation.name,
          arguments: call.arguments,
          value,
        });
      } catch (error) {
        return NestiaAgentPromptFactory.execute({
          type: "execute",
          protocol: "class",
          controller: call.operation.controller,
          function: call.operation.function,
          id: call.id,
          name: call.operation.name,
          arguments: call.arguments,
          value:
            error instanceof Error
              ? {
                  ...error,
                  name: error.name,
                  message: error.message,
                }
              : error,
        });
      }
    }
  };

  const correct = async (
    ctx: INestiaAgentContext,
    call: INestiaAgentEvent.ICall,
    retry: number,
    error: unknown,
  ): Promise<INestiaAgentPrompt.IExecute | null> => {
    //----
    // EXECUTE CHATGPT API
    //----
    const completion: OpenAI.ChatCompletion = await ctx.request("execute", {
      messages: [
        // COMMON SYSTEM PROMPT
        {
          role: "system",
          content: NestiaAgentDefaultPrompt.write(ctx.config),
        } satisfies OpenAI.ChatCompletionSystemMessageParam,
        // PREVIOUS HISTORIES
        ...ctx.histories.map(ChatGptHistoryDecoder.decode).flat(),
        // USER INPUT
        {
          role: "user",
          content: ctx.prompt.text,
        },
        // TYPE CORRECTION
        {
          role: "system",
          content:
            ctx.config?.systemPrompt?.execute?.(ctx.histories) ??
            NestiaAgentSystemPrompt.EXECUTE,
        },
        {
          role: "assistant",
          tool_calls: [
            {
              type: "function",
              id: call.id,
              function: {
                name: call.operation.name,
                arguments: JSON.stringify(call.arguments),
              },
            } satisfies OpenAI.ChatCompletionMessageToolCall,
          ],
        } satisfies OpenAI.ChatCompletionAssistantMessageParam,
        {
          role: "tool",
          content: typeof error === "string" ? error : JSON.stringify(error),
          tool_call_id: call.id,
        } satisfies OpenAI.ChatCompletionToolMessageParam,
        {
          role: "system",
          content: [
            "You A.I. assistant has composed wrong arguments.",
            "",
            "Correct it at the next function calling.",
          ].join("\n"),
        },
      ],
      // STACK FUNCTIONS
      tools: [
        {
          type: "function",
          function: {
            name: call.operation.name,
            description: call.operation.function.description,
            parameters: (call.operation.function.separated
              ? (call.operation.function.separated?.llm ??
                ({
                  $defs: {},
                  type: "object",
                  properties: {},
                  additionalProperties: false,
                  required: [],
                } satisfies IChatGptSchema.IParameters))
              : call.operation.function.parameters) as any,
          },
        },
      ],
      tool_choice: "auto",
      parallel_tool_calls: false,
    });

    //----
    // PROCESS COMPLETION
    //----
    const toolCall: OpenAI.ChatCompletionMessageToolCall | undefined = (
      completion.choices[0]?.message.tool_calls ?? []
    ).find(
      (tc) =>
        tc.type === "function" && tc.function.name === call.operation.name,
    );
    if (toolCall === undefined) return null;
    return propagate(
      ctx,
      {
        id: toolCall.id,
        type: "call",
        operation: call.operation,
        arguments: JSON.parse(toolCall.function.arguments),
      },
      retry,
    );
  };

  const fillHttpArguments = (props: {
    operation: INestiaAgentOperation;
    arguments: object;
  }): void => {
    if (props.operation.protocol !== "http") return;
    const route: IHttpMigrateRoute = props.operation.function.route();
    if (
      route.body &&
      route.operation().requestBody?.required === true &&
      (props.arguments as any).body === undefined &&
      isObject(
        props.operation.function.parameters.$defs,
        props.operation.function.parameters.properties.body!,
      )
    )
      (props.arguments as any).body = {};
    if (route.query && (props.arguments as any).query === undefined)
      (props.arguments as any).query = {};
  };

  const isObject = (
    $defs: Record<string, IChatGptSchema>,
    schema: IChatGptSchema,
  ): boolean => {
    return (
      ChatGptTypeChecker.isObject(schema) ||
      (ChatGptTypeChecker.isReference(schema) &&
        isObject($defs, $defs[schema.$ref.split("/").at(-1)!]!)) ||
      (ChatGptTypeChecker.isAnyOf(schema) &&
        schema.anyOf.every((schema) => isObject($defs, schema)))
    );
  };
}
