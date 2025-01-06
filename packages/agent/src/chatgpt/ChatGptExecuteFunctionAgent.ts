import {
  HttpLlm,
  IChatGptSchema,
  IHttpConnection,
  IHttpLlmApplication,
  IHttpLlmFunction,
  IHttpResponse,
} from "@samchon/openapi";
import OpenAI from "openai";

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
    retry: number;
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
        (response.status === 400 ||
          (response.status === 422 &&
            retry++ < props.retry &&
            typeof response.body)) === false;
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
              content: SYSTEM_MESSAGE_OF_ROLE,
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
}

interface IFunctionCall {
  id: string;
  function: IHttpLlmFunction<"chatgpt">;
  input: object;
}

const SYSTEM_MESSAGE_OF_ROLE = [
  "You are a helpful assistant for tool calling.",
  "",
  "Use the supplied tools to assist the user.",
  "",
  "If previous messsages are not enough to compose the arguments,",
  "you can ask the user to write more information. By the way, when asking",
  "the user to write more informations, make the text concise and clear.",
].join("\n");
