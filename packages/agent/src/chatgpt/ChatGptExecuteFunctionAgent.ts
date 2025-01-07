import {
  ChatGptTypeChecker,
  HttpLlm,
  IChatGptSchema,
  IHttpConnection,
  IHttpLlmApplication,
  IHttpLlmFunction,
  IHttpMigrateRoute,
  IHttpResponse,
} from "@samchon/openapi";
import OpenAI from "openai";

import { NestiaChatAgent } from "../NestiaChatAgent";
import { NestiaChatAgentConstant } from "../internal/NestiaChatAgentConstant";
import { NestiaChatAgentDefaultPrompt } from "../internal/NestiaChatAgentDefaultPrompt";
import { NestiaChatAgentSystemPrompt } from "../internal/NestiaChatAgentSystemPrompt";
import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatEvent } from "../structures/INestiaChatEvent";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptExecuteFunctionAgent {
  export interface IProps {
    service: IChatGptService;
    connection: IHttpConnection;
    application: IHttpLlmApplication<"chatgpt">;
    functions: IHttpLlmFunction<"chatgpt">[];
    histories: INestiaChatPrompt[];
    dispatch: (event: INestiaChatEvent) => Promise<void>;
    content: string;
    config?: NestiaChatAgent.IConfig | undefined;
  }

  export const execute = async (
    props: IProps,
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
              content:
                props.config?.systemPrompt?.execute?.(props.histories) ??
                NestiaChatAgentSystemPrompt.EXECUTE,
            },
          ],
          // STACKED FUNCTIONS
          tools: props.functions.map(
            (func) =>
              ({
                type: "function",
                function: {
                  name: func.name,
                  description: func.description,
                  parameters: func.parameters as any,
                },
              }) as OpenAI.ChatCompletionTool,
          ),
          tool_choice: "auto",
          parallel_tool_calls: false,
        },
        props.service.options,
      );

    //----
    // PROCESS COMPLETION
    //----
    const closures: Array<() => Promise<INestiaChatPrompt>> = [];
    for (const choice of completion.choices) {
      for (const tc of choice.message.tool_calls ?? []) {
        if (tc.type === "function") {
          const func: IHttpLlmFunction<"chatgpt"> | undefined =
            props.functions.find((func) => func.name === tc.function.name);
          if (func === undefined) continue;
          closures.push(() =>
            propagate(
              props,
              {
                id: tc.id,
                function: func,
                input: JSON.parse(tc.function.arguments),
              },
              0,
            ),
          );
        }
      }
      if (
        choice.message.role === "assistant" &&
        !!choice.message.content?.length
      )
        closures.push(
          async () =>
            ({
              kind: "text",
              role: "assistant",
              text: choice.message.content!,
            }) satisfies INestiaChatPrompt.IText,
        );
    }
    return Promise.all(closures.map((fn) => fn()));
  };

  const propagate = async (
    props: IProps,
    call: IFunctionCall,
    retry: number,
  ): Promise<INestiaChatPrompt.IExecute> => {
    fill({
      function: call.function,
      arguments: call.input,
    });
    try {
      await props.dispatch({
        type: "call",
        function: call.function,
        arguments: call.input,
      });
      const response: IHttpResponse = await HttpLlm.propagate({
        connection: props.connection,
        application: props.application,
        function: call.function,
        input: call.input,
      });
      const success: boolean =
        ((response.status === 400 ||
          response.status === 404 ||
          response.status === 422) &&
          retry++ < (props.config?.retry ?? NestiaChatAgentConstant.RETRY) &&
          typeof response.body) === false;
      const result: INestiaChatPrompt.IExecute = (success === false
        ? await correct(props, call, retry, response.body)
        : null) ?? {
        kind: "execute",
        role: "assistant",
        function: call.function,
        id: call.id,
        arguments: call.input,
        response: response,
      };
      if (success === true)
        await props.dispatch({
          type: "complete",
          function: call.function,
          arguments: result.arguments,
          response: result.response,
        });
      return result;
    } catch (error) {
      return {
        kind: "execute",
        role: "assistant",
        function: call.function,
        id: call.id,
        arguments: call.input,
        response: {
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
      } satisfies INestiaChatPrompt.IExecute;
    }
  };

  const correct = async (
    props: IProps,
    call: IFunctionCall,
    retry: number,
    error: unknown,
  ): Promise<INestiaChatPrompt.IExecute | null> => {
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
            // TYPE CORRECTION
            {
              role: "system",
              content:
                props.config?.systemPrompt?.execute?.(props.histories) ??
                NestiaChatAgentSystemPrompt.EXECUTE,
            },
            {
              role: "assistant",
              tool_calls: [
                {
                  type: "function",
                  id: call.id,
                  function: {
                    name: call.function.name,
                    arguments: JSON.stringify(call.input),
                  },
                } satisfies OpenAI.ChatCompletionMessageToolCall,
              ],
            } satisfies OpenAI.ChatCompletionAssistantMessageParam,
            {
              role: "tool",
              content:
                typeof error === "string" ? error : JSON.stringify(error),
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
                name: call.function.name,
                description: call.function.description,
                parameters: (call.function.separated
                  ? (call.function.separated?.llm ??
                    ({
                      $defs: {},
                      type: "object",
                      properties: {},
                      additionalProperties: false,
                      required: [],
                    } satisfies IChatGptSchema.IParameters))
                  : call.function.parameters) as any,
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
    const toolCall: OpenAI.ChatCompletionMessageToolCall | undefined = (
      completion.choices[0]?.message.tool_calls ?? []
    ).find(
      (tc) => tc.type === "function" && tc.function.name === call.function.name,
    );
    if (toolCall === undefined) return null;
    return propagate(
      props,
      {
        id: toolCall.id,
        function: call.function,
        input: JSON.parse(toolCall.function.arguments),
      },
      retry,
    );
  };

  const fill = (props: {
    function: IHttpLlmFunction<"chatgpt">;
    arguments: object;
  }): void => {
    const route: IHttpMigrateRoute = props.function.route();
    if (
      route.body &&
      route.operation().requestBody?.required === true &&
      (props.arguments as any).body === undefined &&
      isObject(
        props.function.parameters.$defs,
        props.function.parameters.properties.body!,
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

interface IFunctionCall {
  id: string;
  function: IHttpLlmFunction<"chatgpt">;
  input: object;
}
