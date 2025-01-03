import {
  HttpLlm,
  IHttpConnection,
  IHttpLlmApplication,
  IHttpLlmFunction,
  IHttpResponse,
} from "@samchon/openapi";
import OpenAI from "openai";

import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatFunctionPrompt } from "../structures/INestiaChatFunctionPrompt";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptFunctionCaller {
  export interface IProps {
    service: IChatGptService;
    connection: IHttpConnection;
    application: IHttpLlmApplication<"chatgpt">;
    functions: IHttpLlmFunction<"chatgpt">[];
    histories: INestiaChatPrompt[];
    content: string;
    retry: number;
  }

  export const execute = async (
    props: IProps,
  ): Promise<INestiaChatFunctionPrompt[]> => {
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
          parallel_tool_calls: true,
        },
        props.service.options,
      );

    //----
    // PROCESS COMPLETION
    //----
    const functionCalls: IFunctionCall[] = [];
    for (const choice of completion.choices)
      for (const tc of choice.message.tool_calls ?? []) {
        if (tc.type !== "function") continue;
        const func: IHttpLlmFunction<"chatgpt"> | undefined =
          props.functions.find((func) => func.name === tc.function.name);
        if (func === undefined) continue;
        functionCalls.push({
          id: tc.id,
          function: func,
          input: JSON.parse(tc.function.arguments),
        });
      }
    return Promise.all(functionCalls.map((fc) => propagate(props, fc, 0)));
  };

  const propagate = async (
    props: IProps,
    call: IFunctionCall,
    retry: number,
  ): Promise<INestiaChatFunctionPrompt> => {
    try {
      const response: IHttpResponse = await HttpLlm.propagate({
        connection: props.connection,
        application: props.application,
        function: call.function,
        input: call.input,
      });
      return (
        (response.status === 400 &&
        retry++ < props.retry &&
        typeof response.body === "object" &&
        response.body !== null
          ? await correct(props, call, retry, response.body)
          : null) ?? {
          kind: "function",
          role: "assistant",
          function: call.function,
          id: call.id,
          input: call.input,
          response: response,
        }
      );
    } catch (error) {
      return {
        kind: "function",
        role: "assistant",
        function: call.function,
        id: call.id,
        input: call.input,
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
      } satisfies INestiaChatFunctionPrompt;
    }
  };

  const correct = async (
    props: IProps,
    call: IFunctionCall,
    retry: number,
    error: unknown,
  ): Promise<INestiaChatFunctionPrompt | null> => {
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
              content: "You are a helpful assistant.",
            },
            // PREVIOUS HISTORIES
            ...props.histories.map(ChatGptHistoryDecoder.decode).flat(),
            // USER INPUT
            {
              role: "user",
              content: props.content,
            },
            // TYPE CORRECTION
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
              content: "Type error detected",
              tool_call_id: call.id,
            } satisfies OpenAI.ChatCompletionToolMessageParam,
            {
              role: "assistant",
              content: [
                "You A.I. assistant has composed wrong typed arguments.",
                "Here is the detailed list of type errors. Review and correct them",
                "at the next function calling.",
                "",
                "```json",
                JSON.stringify(error, null, 2),
                "```",
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
                parameters: call.function.parameters as any,
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
}

interface IFunctionCall {
  id: string;
  function: IHttpLlmFunction<"chatgpt">;
  input: object;
}
