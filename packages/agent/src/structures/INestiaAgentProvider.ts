import OpenAI from "openai";

/**
 * LLM Provider for Nestia Chat.
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export type INestiaAgentProvider = INestiaAgentProvider.IChatGpt;
export namespace INestiaAgentProvider {
  export interface IChatGpt {
    /**
     * Discriminator type.
     */
    type: "chatgpt";

    /**
     * OpenAI API instance.
     */
    api: OpenAI;

    /**
     * Chat model to be used.
     */
    model: OpenAI.ChatModel;

    /**
     * Options for the request.
     */
    options?: OpenAI.RequestOptions | undefined;
  }
}
