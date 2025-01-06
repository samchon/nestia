import OpenAI from "openai";

import { NestiaChatAgent } from "../NestiaChatAgent";
import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptDescribeFunctionAgent {
  export interface IProps {
    service: IChatGptService;
    histories: INestiaChatPrompt.IExecute[];
    config?: NestiaChatAgent.IConfig;
  }

  export const execute = async (
    props: IProps,
  ): Promise<INestiaChatPrompt.IDescribe[]> => {
    if (props.histories.length === 0) return [];

    const completion: OpenAI.ChatCompletion =
      await props.service.api.chat.completions.create(
        {
          model: props.service.model,
          messages: [
            // PREVIOUS FUNCTION CALLING HISTORIES
            ...props.histories.map(ChatGptHistoryDecoder.decode).flat(),
            // SYTEM PROMPT
            {
              role: "assistant",
              content:
                props.config?.systemPrompt?.describe?.(props.histories) ??
                SYSTEM_PROMPT,
            },
          ],
        },
        props.service.options,
      );
    return completion.choices
      .map((choice) =>
        choice.message.role === "assistant" && !!choice.message.content?.length
          ? choice.message.content
          : null,
      )
      .filter((str) => str !== null)
      .map((content) => ({
        kind: "describe",
        executions: props.histories,
        text: content,
      }));
  };
}

const SYSTEM_PROMPT = [
  "You are a helpful assistant describing return values of function calls.",
  "",
  "Above messages are the list of function call histories.",
  "When decribing the return values, please do not too much shortly",
  "summarize them. Instead, provide detailed descriptions as much as.",
  "",
  "Also, its content format must be markdown. If required, utilize the",
  "mermaid syntax for drawing some diagrams. When image contents are,",
  "just put them through the markdown image syntax.",
].join("\n");
