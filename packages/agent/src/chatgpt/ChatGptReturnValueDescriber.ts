import OpenAI from "openai";

import { IChatGptService } from "../structures/IChatGptService";
import { INestiaChatFunctionPrompt } from "../structures/INestiaChatFunctionPrompt";
import { INestiaChatPrompt } from "../structures/INestiaChatPrompt";
import { ChatGptHistoryDecoder } from "./ChatGptHistoryDecoder";

export namespace ChatGptReturnValueDescriber {
  export interface IProps {
    service: IChatGptService;
    histories: INestiaChatFunctionPrompt[];
  }

  export const execute = async (
    props: IProps,
  ): Promise<INestiaChatPrompt[]> => {
    const completion: OpenAI.ChatCompletion =
      await props.service.api.chat.completions.create(
        {
          model: props.service.model,
          messages: [
            // SYTEM PROMPT
            {
              role: "assistant",
              content: [
                "You are a helpful assistant describing return values of function calls.",
                "",
                "Here is the list of function call histories. Please describe them.",
                "just by one conversation.",
                "",
                "Also, its content format must be markdown. If required, utilize the",
                "mermaid syntax for drawing some diagrams. When image contents are,",
                "just put them through the markdown image syntax.",
              ].join("\n"),
            },
            // PREVIOUS FUNCTION CALLING HISTORIES
            ...props.histories.map(ChatGptHistoryDecoder.decode).flat(),
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
        kind: "text",
        role: "assistant",
        text: content,
      }));
  };
}
